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
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> radialTable: array<f32>;
@group(0) @binding(2) var<storage, read> radialMax: array<f32>;
@group(0) @binding(3) var<storage, read> colorLut: array<vec4<f32>>;

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
  let jitter = pixelJitter(u32(in.position.x), u32(in.position.y));

  var color = vec3(0.0, 0.0, 0.0);
  var transmittance = 1.0;
  let sampleCount = i32(ceil(2.0 * halfChord / step)) + 1;
  for (var i = 0; i < sampleCount; i++) {
    let t = -halfChord + (jitter + f32(i)) * step;
    if (t >= halfChord) {
      break;
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
  return vec4(color, 1.0);
}
`;
