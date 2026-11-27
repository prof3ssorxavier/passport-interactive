import type { PageMeta } from '@/types/passport';

export const PASSPORT_ID = 'MA060826' as const;
export const COUNTRY_NAME = 'REPÚBLICA DAS TANGERINAS' as const;
export const ISSUE_DATE = '06.08.2026' as const;

/**
 * ISO/IEC 7810 ID-3 dimensions (88 mm × 125 mm, ratio 0.704)
 * mapped to Three.js world units.
 */
export const PASSPORT_DIMS = {
  width: 2.2,
  height: 3.125,
  coverThickness: 0.032,
  leafThickness: 0.001,
  leafZSpacing: 0.002,
  spinePivotX: -1.1, // -width / 2
} as const;

export const COLORS = {
  leatherNavy: '#102A4C',
  leatherNavyDark: '#091930',
  foilGold: '#D4AF37',
  foilGoldHighlight: '#F1D77A',
  paperCream: '#F7F3E8',
  paperWarmEdge: '#E6DEC8',
  tangerine: '#E86F2C',
  inkPrimary: '#1B263B',
  inkMuted: '#5B6B82',
  stampGuatemala: '#1D5B6B',
  stampSdq: '#9B2C2C',
} as const;

export const PBR = {
  leather: {
    roughness: 0.72,
    metalness: 0.08,
  },
  goldFoil: {
    roughness: 0.26,
    metalness: 0.85,
  },
  paper: {
    roughness: 0.9,
    metalness: 0.0,
  },
  spine: {
    roughness: 0.68,
    metalness: 0.1,
  },
} as const;

export const SPRING_CONFIGS = {
  cover: { mass: 1.4, tension: 145, friction: 24 },
  leaf: { mass: 0.85, tension: 175, friction: 22 },
  bookShift: { mass: 1.2, tension: 140, friction: 24 },
} as const;

export const PASSPORT_PAGES: readonly PageMeta[] = [
  {
    index: 0,
    label: 'Capa Fechada',
    shortLabel: 'Capa',
    description: 'Couro azul-marinho com hot-stamping dourado',
  },
  {
    index: 1,
    label: 'Perfil & Assinatura',
    shortLabel: 'Perfil',
    description: 'Dados do titular MA060826 e área de assinatura',
  },
  {
    index: 2,
    label: 'Visto Guatemala',
    shortLabel: 'Guatemala',
    description: 'Carimbo de entrada — Outubro 2026',
  },
  {
    index: 3,
    label: 'Residência Santo Domingo',
    shortLabel: 'SDQ',
    description: 'Visto de residência — República Dominicana',
  },
] as const;
