// Material palettes. Each material has 5 tones in role order:
//   [outline, shadow, base, light, shine]
// `mono` is the single color used by the filled (mono) style. `glow` materials get a soft halo.
// Hue-shifted: shadows lean cool or red, lights lean warm — flat value ramps look dull in game UI.

const material = (name, tones, extra = {}) => Object.freeze({ name, tones: Object.freeze(tones), mono: tones[3], glow: false, ...extra });

// basic
export const wood = material('wood', ['#2d130f', '#703524', '#a9623a', '#d8964f', '#f4cf88']);
export const stone = material('stone', ['#1d1c24', '#4f4c5c', '#85828f', '#b8b4bd', '#e8e4e6']);
export const steel = material('steel', ['#1b1f33', '#4d5a7c', '#8b9dba', '#c6d4e6', '#f6fbff']);
export const gold = material('gold', ['#3d1e10', '#a3531c', '#e39a2b', '#ffd45a', '#fff7d6']);
// tiers
export const bronze = material('bronze', ['#2e1309', '#7a3a1a', '#b8692f', '#e09a58', '#f8d29c']);
export const silver = material('silver', ['#20222e', '#6a7088', '#aeb4c4', '#dde2ea', '#ffffff']);
// glowing
export const lava = material('lava', ['#2a0807', '#8f1d0e', '#e8531a', '#ffa23a', '#fff2a8'], { glow: true });
export const poison = material('poison', ['#0f2410', '#2f6b1c', '#62ad24', '#a6e04a', '#ecffc0'], { glow: true });
export const arcane = material('arcane', ['#170a33', '#4a1f8f', '#8a4dff', '#c39bff', '#f4ecff'], { glow: true });
export const holy = material('holy', ['#3d2a0c', '#b0841e', '#f2cf4f', '#fff09e', '#ffffff'], { glow: true });

/** All first-release materials by name. Importing this pulls every palette (about 1 KB). */
export const materials = Object.freeze({ wood, stone, steel, gold, bronze, silver, lava, poison, arcane, holy });

/** Accept a material object or its name. Unknown names fall back to steel with a warning. */
export function resolveMaterial(m, fallback = steel) {
  if (m == null) return fallback;
  if (typeof m === 'object' && Array.isArray(m.tones)) return m;
  const found = materials[String(m).toLowerCase()];
  if (!found) {
    console.warn(`playglyph: unknown material "${m}". Available: ${Object.keys(materials).join(', ')}`);
    return fallback;
  }
  return found;
}
