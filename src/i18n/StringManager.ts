/**
 * StringManager.ts
 *
 * Centralizes all localized string access for the simulation.
 *
 * Strings are loaded from JSON files per locale and wrapped in reactive
 * Property objects by SceneryStack. When the user switches language in the
 * Preferences dialog, all StringProperties update automatically.
 *
 * ── How to add a locale ───────────────────────────────────────────────────────
 * 1. Create src/i18n/strings_XX.json with the same keys as strings_en.json
 * 2. Import it below and add `XX: stringsXX` to the locale map
 * 3. Add "XX" to `availableLocales` in src/init.ts
 *
 * ── How to add a string ───────────────────────────────────────────────────────
 * 1. Add the key + English value to strings_en.json
 * 2. Add the same key + translated value to ALL other locale files
 *    (TypeScript will show an error here if any locale is missing a key)
 * 3. Expose the new StringProperty via a new getter method below
 */

import type { ReadOnlyProperty } from "scenerystack/axon";
import { LocalizedString } from "scenerystack/chipper";
import stringsEn from "./strings_en.json";
import stringsEs from "./strings_es.json";
import stringsFr from "./strings_fr.json";

// ── Compile-time key-parity check ─────────────────────────────────────────────
// English is the canonical shape; every other locale must match it exactly.
// TypeScript errors here if any locale file is missing (or adds) a key relative to
// English. Add one `satisfies` line per new locale so the check stays exhaustive.
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsFr satisfies typeof stringsEn);
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsEn satisfies typeof stringsFr);
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsEs satisfies typeof stringsEn);
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsEn satisfies typeof stringsEs);

// ── Build the reactive string property tree ───────────────────────────────────
const stringProperties = LocalizedString.getNestedStringProperties({
  en: stringsEn,
  fr: stringsFr,
  es: stringsEs,
});

/**
 * Explicit `a11y` shape exposed by {@link StringManager.getA11yStrings}.
 * Keep this in sync with the `a11y` key in `strings_en.json` — a locale key
 * rename that is not mirrored here fails at the getter return (not silently).
 */
export type QuantumAtom3DA11yStrings = {
  readonly screenSummary: {
    readonly playAreaStringProperty: ReadOnlyProperty<string>;
    readonly controlAreaStringProperty: ReadOnlyProperty<string>;
    readonly interactionHintStringProperty: ReadOnlyProperty<string>;
  };
  readonly currentDetailsStringProperty: ReadOnlyProperty<string>;
};

/**
 * Explicit Preferences → Simulation labels from {@link StringManager.getPreferences}.
 * Same sync rule as {@link QuantumAtom3DA11yStrings}.
 */
export type QuantumAtom3DPreferenceStrings = {
  readonly titleStringProperty: ReadOnlyProperty<string>;
  readonly phaseColormapStringProperty: ReadOnlyProperty<string>;
  readonly phaseColormapHsvStringProperty: ReadOnlyProperty<string>;
  readonly phaseColormapUniformStringProperty: ReadOnlyProperty<string>;
};

/**
 * StringManager is a singleton that provides typed access to all localized
 * strings. Use `StringManager.getInstance()` everywhere — never construct it
 * directly.
 */
export class StringManager {
  private static instance: StringManager | null = null;

  private constructor() {
    // Private — obtain via getInstance()
  }

  public static getInstance(): StringManager {
    if (StringManager.instance === null) {
      StringManager.instance = new StringManager();
    }
    return StringManager.instance;
  }

  /**
   * The simulation title shown in the navigation bar and browser tab.
   * Updates automatically when the locale changes.
   */
  public getTitleStringProperty(): ReadOnlyProperty<string> {
    return stringProperties.titleStringProperty;
  }

  /**
   * Screen name StringProperties used when constructing Screen instances.
   * Each property updates automatically when the locale changes.
   */
  public getScreenNames(): {
    readonly orbitalsStringProperty: ReadOnlyProperty<string>;
    readonly superpositionStringProperty: ReadOnlyProperty<string>;
    readonly angularMomentumStringProperty: ReadOnlyProperty<string>;
    readonly zeemanStringProperty: ReadOnlyProperty<string>;
    readonly oscillatorStringProperty: ReadOnlyProperty<string>;
  } {
    return {
      orbitalsStringProperty: stringProperties.screens.orbitalsStringProperty,
      superpositionStringProperty: stringProperties.screens.superpositionStringProperty,
      angularMomentumStringProperty: stringProperties.screens.angularMomentumStringProperty,
      zeemanStringProperty: stringProperties.screens.zeemanStringProperty,
      oscillatorStringProperty: stringProperties.screens.oscillatorStringProperty,
    };
  }

  /** Visible labels shared by the orbital views (controls, readouts, P(r) chart, cross-section). */
  public getOrbitalStrings() {
    return stringProperties.orbital;
  }
  public getSuperpositionStrings() {
    return stringProperties.superposition;
  }
  public getAngularStrings() {
    return stringProperties.angular;
  }
  public getZeemanStrings() {
    return stringProperties.zeeman;
  }
  public getOscillatorStrings() {
    return stringProperties.oscillator;
  }

  /** Accessibility strings for the Orbitals screen. */
  public getOrbitalsA11yStrings() {
    return stringProperties.a11y.orbitals;
  }

  /** Accessibility strings for the Superposition screen. */
  public getSuperpositionA11yStrings() {
    return stringProperties.a11y.superposition;
  }

  /** Accessibility strings for the Angular Momentum screen. */
  public getAngularMomentumA11yStrings() {
    return stringProperties.a11y.angularMomentum;
  }

  /** Accessibility strings for the Zeeman screen. */
  public getZeemanA11yStrings() {
    return stringProperties.a11y.zeeman;
  }

  /** Accessibility strings for the 3D Oscillator screen. */
  public getOscillatorA11yStrings() {
    return stringProperties.a11y.oscillator;
  }

  /**
   * Simulation-specific preference labels shown in Preferences → Simulation.
   */
  public getPreferences() {
    return stringProperties.preferences;
  }
}
