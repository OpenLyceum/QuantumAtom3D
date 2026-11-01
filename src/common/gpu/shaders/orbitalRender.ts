/**
 * orbitalRender.ts
 *
 * The volume render as one full-screen fragment shader. It is the WGSL twin of
 * OrbitalRayMarcher.ts: the same rays, steps, jitter hash, opacity law and
 * lookup-table colours. ψ is evaluated in the shader, term by term:
 *
 *   ψ = Σ_k c_k · Z^{3/2} R_{n_k l_k}(1, Zr) · prefactor_k · sin^{|m|}θ · P(cos θ) · e^{i m_k φ}
 *
 * R comes from the radial lookup table (one row per (n, l) on a √r axis, read
 * with manual linear interpolation, since float storage buffers cannot be
 * filtered). P is the polynomial part of P_l^{|m|}, built by the same
 * recurrence as associatedLegendrePolynomialPart.
 *
 * WGSL leaves pow(0, 0) and atan2(0, 0) undefined, so sin^{|m|} is a loop and
 * the z-axis gets φ = 0 explicitly.
 */

/**
 * Bindings: 0 = Params (uniform), 1 = radial table, 2 = radial row maxima,
 * 3 = colour LUTs (phase, then density). Group 0, fragment stage only.
 */
export const ORBITAL_RENDER_SHADER = /* wgsl */ `
const LUT_SIZE: i32 = 256;
const PI: f32 = 3.14159265358979;
const OPAQUE_ENOUGH: f32 = 0.99;
const MAX_TERMS: i32 = 8;

struct Term {
  coefficient: vec4<f32>, // re, im, angular prefactor, unused
  quantum: vec4<i32>,     // n, l, m, radial table row
}

struct Params {
  right: vec4<f32>,
  up: vec4<f32>,
  forward: vec4<f32>,
  scene: vec4<f32>,   // Z, 1/max|ψ|, opacity gain, sphere radius
  view: vec4<f32>,    // view half-height, resolution, steps, term count
  flags: vec4<u32>,   // coloring (0 phase, 1 density), unused ×3
  terms: array<Term, MAX_TERMS>,
  render: vec4<f32>, // iso density level, reserved x3
  overlayColor: vec4<f32>,
  plane: vec4<f32>,
  counts: vec4<u32>,
  radialNodes: vec4<f32>,
  polarNodes: vec4<f32>,
  azimuthalNodes: vec4<f32>,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> radialTable: array<f32>;
@group(0) @binding(2) var<storage, read> radialMax: array<f32>;
@group(0) @binding(3) var<storage, read> colorLut: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read> points: array<vec4<f32>>;

struct VertexOut {
  @builtin(position) position: vec4<f32>,
}

@vertex
fn vertexMain(@builtin(vertex_index) index: u32) -> VertexOut {
  // One oversized triangle covering the viewport.
  let corners = array<vec2<f32>, 3>(vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  var out: VertexOut;
  out.position = vec4(corners[index], 0.0, 1.0);
  return out;
}

fn pixelJitter(px: u32, py: u32) -> f32 {
  var h: u32 = px * 1973u + py * 9277u;
  h = (h ^ (h >> 16u)) * 0x7feb352du;
  h = (h ^ (h >> 15u)) * 0x846ca68bu;
  h = h ^ (h >> 16u);
  return f32(h) / 4294967296.0;
}

fn radial(row: i32, nuclearCharge: f32, r: f32) -> f32 {
  let samples = i32(arrayLength(&radialTable)) / i32(arrayLength(&radialMax));
  let s = sqrt(nuclearCharge * r / radialMax[row]);
  if (s >= 1.0) {
    return 0.0;
  }
  let position = s * f32(samples - 1);
  let index = i32(floor(position));
  let fraction = position - f32(index);
  let base = row * samples + index;
  let a = radialTable[base];
  let b = radialTable[min(base + 1, row * samples + samples - 1)];
  return pow(nuclearCharge, 1.5) * (a + (b - a) * fraction);
}

fn legendrePolynomialPart(l: i32, absM: i32, x: f32) -> f32 {
  var pmm = 1.0;
  var oddFactor = 1.0;
  for (var i = 1; i <= absM; i++) {
    pmm = -pmm * oddFactor;
    oddFactor += 2.0;
  }
  if (l == absM) {
    return pmm;
  }
  var pmm1 = x * f32(2 * absM + 1) * pmm;
  for (var ll = absM + 2; ll <= l; ll++) {
    let next = (x * f32(2 * ll - 1) * pmm1 - f32(ll + absM - 1) * pmm) / f32(ll - absM);
    pmm = pmm1;
    pmm1 = next;
  }
  return pmm1;
}

fn psi(p: vec3<f32>) -> vec2<f32> {
  let r = length(p);
  var cosTheta = 1.0;
  if (r > 0.0) {
    cosTheta = clamp(p.z / r, -1.0, 1.0);
  }
  let sinTheta = sqrt(max(0.0, 1.0 - cosTheta * cosTheta));
  var phi = 0.0;
  if (p.x != 0.0 || p.y != 0.0) {
    phi = atan2(p.y, p.x);
  }
  var sum = vec2(0.0, 0.0);
  let termCount = i32(params.view.w);
  for (var k = 0; k < termCount; k++) {
    let term = params.terms[k];
    let l = term.quantum.y;
    let m = term.quantum.z;
    let absM = abs(m);
    var sinPower = 1.0;
    for (var i = 0; i < absM; i++) {
      sinPower *= sinTheta;
    }
    let amplitude = radial(term.quantum.w, params.scene.x, r)
      * term.coefficient.z * sinPower * legendrePolynomialPart(l, absM, cosTheta);
    let c = cos(f32(m) * phi);
    let s = sin(f32(m) * phi);
    sum += amplitude * vec2(term.coefficient.x * c - term.coefficient.y * s, term.coefficient.x * s + term.coefficient.y * c);
  }
  return sum;
}

fn density(p: vec3<f32>) -> f32 { let value = psi(p); return dot(value,value); }

fn fieldColor(value: vec2<f32>) -> vec3<f32> {
  let relative = min(1.0, dot(value,value)*params.scene.y*params.scene.y);
  var index = LUT_SIZE + i32(round(relative*f32(LUT_SIZE-1)));
  if(params.flags.x == 0u) {
    var phase = 0.0;
    if (dot(value,value) > 0.0) { phase = atan2(value.y,value.x); }
    index = clamp(i32(floor((phase+PI)/(2.0*PI)*f32(LUT_SIZE))),0,LUT_SIZE-1);
  }
  return colorLut[index].rgb;
}

fn surface(origin: vec3<f32>, halfChord: f32, step: f32) -> vec4<f32> {
  let level = params.render.x;
  if(level <= 0.0) { return vec4(0.0,0.0,0.0,2.0*params.scene.w); }
  let direction = params.forward.xyz;
  var previous = -halfChord;
  let count = i32(ceil(2.0*halfChord/step))+1;
  for(var i=0;i<count;i++) {
    let t=-halfChord+f32(i)*step;
    if(t>halfChord) { break; }
    if(density(origin+direction*t)>=level) {
      var a=previous;var b=t;
      for(var j=0;j<8;j++) {let mid=0.5*(a+b); if(density(origin+direction*mid)>=level){b=mid;}else{a=mid;}}
      let point=origin+direction*0.5*(a+b);
      let e=params.scene.w/2000.0;
      let gradient=vec3(
        density(point+vec3(e,0.0,0.0))-density(point-vec3(e,0.0,0.0)),
        density(point+vec3(0.0,e,0.0))-density(point-vec3(0.0,e,0.0)),
        density(point+vec3(0.0,0.0,e))-density(point-vec3(0.0,0.0,e)));
      var facing=0.0;
      if(length(gradient)>0.0){ facing=abs(dot(normalize(gradient),direction)); }
      return vec4(fieldColor(psi(point))*(0.35+0.65*facing),0.5*(a+b));
    }
    previous=t;
  }
  return vec4(0.0,0.0,0.0,2.0*params.scene.w);
}


struct SurfaceEvent { t: f32, color: vec4<f32> }
struct Events { count: u32, items: array<SurfaceEvent,24> }
fn pushEvent(events: ptr<function,Events>,t:f32,color:vec4<f32>,halfChord:f32) {
  if(abs(t)<=halfChord && (*events).count<24u) {
    let index=(*events).count;
    (*events).items[index]=SurfaceEvent(t,color);
    (*events).count=index+1u;
  }
}
fn planeTime(origin:vec3<f32>,direction:vec3<f32>,normal:vec3<f32>,offset:f32)->f32 {
  let denominator=dot(direction,normal);
  if(abs(denominator)<1e-7){return 1e30;}
  return (offset-dot(origin,normal))/denominator;
}
fn addRoots(events:ptr<function,Events>,a:f32,b:f32,c:f32,origin:vec3<f32>,cosTheta:f32,halfChord:f32) {
  var roots=vec2(1e30);
  if(abs(a)<1e-7){ if(abs(b)>=1e-7){roots.x=-c/b;} }
  else {
    let d=b*b-4.0*a*c;
    if(d>=0.0){roots=vec2(-b-sqrt(d),-b+sqrt(d))/(2.0*a);}
  }
  for(var i=0;i<2;i++){
    let t=roots[i];
    if(i==1 && abs(roots.x-roots.y)<1e-6){continue;}
    if(cosTheta==0.0 || (origin.z+t*params.forward.z)*cosTheta>=-1e-6){
      pushEvent(events,t,params.overlayColor,halfChord);
    }
  }
}
fn surfaceEvents(origin:vec3<f32>,halfChord:f32)->Events {
  var events:Events;
  events.count=0u;
  let direction=params.forward.xyz;
  let oo=dot(origin,origin);let od=dot(origin,direction);
  for(var i=0u;i<params.counts.x;i++){
    let r=params.radialNodes[i];
    addRoots(&events,1.0,2.0*od,oo-r*r,origin,0.0,halfChord);
  }
  for(var i=0u;i<params.counts.y;i++){
    let c=cos(params.polarNodes[i]);
    if(abs(c)<1e-6){pushEvent(&events,planeTime(origin,direction,vec3(0.0,0.0,1.0),0.0),params.overlayColor,halfChord);}
    else {addRoots(&events,direction.z*direction.z-c*c,2.0*(origin.z*direction.z-c*c*od),origin.z*origin.z-c*c*oo,origin,c,halfChord);}
  }
  for(var i=0u;i<params.counts.z;i++){
    let phi=params.azimuthalNodes[i];
    pushEvent(&events,planeTime(origin,direction,vec3(-sin(phi),cos(phi),0.0),0.0),params.overlayColor,halfChord);
  }
  if(params.counts.w>0u){
    let t=planeTime(origin,direction,params.plane.xyz,params.plane.w);
    if(abs(t)<=halfChord){
      let value=psi(origin+direction*t);
      var gain=1.0;if(params.flags.x==0u){gain=min(1.0,length(value)*params.scene.y);}
      pushEvent(&events,t,vec4(gain*fieldColor(value),0.9),halfChord);
    }
  }
  // Small fixed list: insertion sort preserves order at coincident node/plane hits.
  for(var i=1u;i<events.count;i++){
    let event=events.items[i];var j=i;
    while(j>0u){if(events.items[j-1u].t<=event.t){break;}events.items[j]=events.items[j-1u];j--;}
    events.items[j]=event;
  }
  return events;
}
fn compositeSurfaces(events:Events,limit:f32,background:vec3<f32>)->vec3<f32>{
  var rgb=background;
  for(var i=i32(events.count)-1;i>=0;i--){
    let event=events.items[i];
    if(event.t<=limit){rgb=mix(rgb,event.color.rgb,event.color.a);}
  }
  return rgb;
}

struct PointOut {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
  @location(1) corner: vec2<f32>,
  @location(2) depth: f32,
}

@vertex
fn pointVertex(@builtin(vertex_index) vertex:u32,@builtin(instance_index) instance:u32)->PointOut {
  let corners=array<vec2<f32>,6>(vec2(-1.0,-1.0),vec2(1.0,-1.0),vec2(-1.0,1.0),vec2(-1.0,1.0),vec2(1.0,-1.0),vec2(1.0,1.0));
  let p=points[instance].xyz;
  let radius=params.scene.w;
  let uv=vec2(dot(p,params.right.xyz),dot(p,params.up.xyz))/radius;
  let depth=(dot(p,params.forward.xyz)+radius)/(2.0*radius);
  var result:PointOut;
  result.position=vec4(uv+corners[vertex]/200.0,clamp(depth,0.0,1.0),1.0);
  if(length(p)>radius) {result.position=vec4(4.0,4.0,1.0,1.0);}
  result.color=fieldColor(psi(p));
  result.corner=corners[vertex];
  result.depth=dot(p,params.forward.xyz);
  return result;
}

@fragment
fn pointFragment(in:PointOut)->@location(0) vec4<f32>{
  if(dot(in.corner,in.corner)>1.0){discard;}
  let uv=(in.position.xy/params.view.y*2.0-vec2(1.0))*vec2(1.0,-1.0)*params.scene.w;
  let origin=params.right.xyz*uv.x+params.up.xyz*uv.y;
  let halfChord=sqrt(max(0.0,params.scene.w*params.scene.w-dot(uv,uv)));
  return vec4(compositeSurfaces(surfaceEvents(origin,halfChord),in.depth,in.color),1.0);
}

@fragment
fn fragmentMain(in: VertexOut) -> @location(0) vec4<f32> {
  let resolution = params.view.y;
  let radius = params.scene.w;
  // position.xy is already the pixel centre (px + 0.5, py + 0.5).
  let u = (in.position.x / resolution * 2.0 - 1.0) * params.view.x;
  let v = (1.0 - in.position.y / resolution * 2.0) * params.view.x;
  let chordSquared = radius * radius - u * u - v * v;
  if (chordSquared <= 0.0) {
    return vec4(0.0, 0.0, 0.0, 1.0);
  }
  let halfChord = sqrt(chordSquared);
  let steps = params.view.z;
  let step = 2.0 * radius / steps;
  let stepOpacity = params.scene.z * step / radius;
  let origin = params.right.xyz * u + params.up.xyz * v;
  let events=surfaceEvents(origin,halfChord);
  if(params.flags.y == 2u) {return vec4(compositeSurfaces(events,halfChord,vec3(0.0)),1.0);}
  if(params.flags.y == 1u) {let hit=surface(origin,halfChord,step);return vec4(compositeSurfaces(events,hit.w,hit.rgb),1.0);}
  let jitter = pixelJitter(u32(in.position.x), u32(in.position.y));

  var color = vec3(0.0, 0.0, 0.0);
  var transmittance = 1.0;
  var eventIndex=0u;
  let sampleCount = i32(ceil(2.0 * halfChord / step)) + 1;
  for (var i = 0; i < sampleCount; i++) {
    let t = -halfChord + (jitter + f32(i)) * step;
    if (t >= halfChord) {
      break;
    }
    while(eventIndex<events.count){
      let event=events.items[eventIndex];if(event.t>t){break;}
      color+=transmittance*event.color.a*event.color.rgb;
      transmittance*=1.0-event.color.a;eventIndex++;
    }
    let value = psi(origin + params.forward.xyz * t);
    let amplitude = min(1.0, length(value) * params.scene.y);
    let alpha = 1.0 - exp(-stepOpacity * amplitude);
    if (alpha <= 0.0) {
      continue;
    }
    var lutIndex: i32;
    if (params.flags.x == 0u) {
      lutIndex = min(LUT_SIZE - 1, i32(floor((atan2(value.y, value.x) + PI) / (2.0 * PI) * f32(LUT_SIZE))));
    } else {
      lutIndex = LUT_SIZE + i32(round(amplitude * amplitude * f32(LUT_SIZE - 1)));
    }
    color += transmittance * alpha * colorLut[lutIndex].rgb;
    transmittance *= 1.0 - alpha;
    if (transmittance < 1.0 - OPAQUE_ENOUGH) {
      break;
    }
  }
  while(eventIndex<events.count){
    let event=events.items[eventIndex];color+=transmittance*event.color.a*event.color.rgb;
    transmittance*=1.0-event.color.a;eventIndex++;
  }
  return vec4(color, 1.0);
}
`;
