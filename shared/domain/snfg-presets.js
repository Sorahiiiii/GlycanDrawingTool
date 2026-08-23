export const SNFG_PRESETS = Object.freeze({
  glc: Object.freeze({ shape: 'circle-filled', color: '#0072BC', name: 'Glucose' }),
  gal: Object.freeze({ shape: 'circle-filled', color: '#FFD400', name: 'Galactose' }),
  man: Object.freeze({ shape: 'circle-filled', color: '#00A651', name: 'Mannose' }),
  glcnac: Object.freeze({ shape: 'square', color: '#0072BC', name: 'GlcNAc' }),
  galnac: Object.freeze({ shape: 'square', color: '#FFD400', name: 'GalNAc' }),
  fuc: Object.freeze({ shape: 'triangle', color: '#ED1C24', name: 'Fucose' }),
  glca: Object.freeze({ shape: 'diamond-divided-top', color: '#0072BC', name: 'GlcA' }),
  neu5ac: Object.freeze({ shape: 'diamond', color: '#A54399', name: 'Neu5Ac' }),
  xyl: Object.freeze({ shape: 'star-5', color: '#F47920', name: 'Xyl' })
});

export const snfgPresets = SNFG_PRESETS;
export default SNFG_PRESETS;
