/**
 * HydrogenicIons.ts
 *
 * Chemical symbols of the one-electron ions with nuclear charge Z = 1–6. They
 * are standard notation in every language, so they are not localized.
 */

const ION_SYMBOLS = ["H", "He⁺", "Li²⁺", "Be³⁺", "B⁴⁺", "C⁵⁺"] as const;

/** The symbol of the hydrogenic ion with nuclear charge Z (e.g. "Li²⁺" for 3). */
export function hydrogenicIonSymbol(nuclearCharge: number): string {
  return ION_SYMBOLS[nuclearCharge - 1] ?? `Z=${nuclearCharge}`;
}
