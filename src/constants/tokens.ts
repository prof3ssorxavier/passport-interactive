import type { PageMeta, PassportHolder } from '@/types/passport';

export const PASSPORT_ID = 'MA060826' as const;
export const COUNTRY_NAME = 'REPÚBLICA DAS TANGERINAS' as const;
export const ISSUE_DATE = '06.08.2026' as const;

export const PASSPORT_HOLDERS: readonly [PassportHolder, PassportHolder] = [
  {
    id: `${PASSPORT_ID}-A`,
    firstName: 'ALLISON PAMELA',
    lastName: 'ARDON SEGURA',
    fullName: 'Allison Pamela Ardon Segura',
    birthplace: 'HONDURAS',
    countryCode: 'HND',
    accentColor: '#D4AF37',
  },
  {
    id: `${PASSPORT_ID}-M`,
    firstName: 'MARCOS DA SILVA',
    lastName: 'XAVIER',
    fullName: 'Marcos da Silva Xavier',
    birthplace: 'BRASIL',
    countryCode: 'BRA',
    accentColor: '#E86F2C',
  },
] as const;

/**
 * ISO/IEC 7810 ID-3 dimensions (88 mm × 125 mm, ratio 0.704)
 * mapped to Three.js world units.
 */
export const PASSPORT_DIMS = {
  width: 2.2,
  height: 3.125,
  coverThickness: 0.036,
  leafThickness: 0.001,
  leafZSpacing: 0.002,
  cornerRadius: 0.09,
  spinePivotX: -1.1, // -width / 2
} as const;

export const COLORS = {
  leatherNavy: '#102A4C',
  leatherNavyDark: '#091930',
  foilGold: '#D4AF37',
  foilGoldHighlight: '#F5DF89',
  paperCream: '#EAE2CE',
  paperWarmEdge: '#DDD3BC',
  tangerine: '#E86F2C',
  inkPrimary: '#0E1A2B',
  inkMuted: '#4A596E',
  stampGuatemala: '#184F5E',
  stampSdq: '#8E2424',
} as const;

export const PBR = {
  leather: {
    roughness: 0.74,
    metalness: 0.08,
    bumpScale: 0.012,
  },
  goldFoil: {
    roughness: 0.24,
    metalness: 0.88,
  },
  paper: {
    roughness: 0.96,
    metalness: 0.0,
    bumpScale: 0.0045,
  },
  spine: {
    roughness: 0.68,
    metalness: 0.1,
  },
} as const;

export const SPRING_CONFIGS = {
  cover: { mass: 1.5, tension: 130, friction: 24 },
  leaf: { mass: 0.85, tension: 155, friction: 21 },
  bookShift: { mass: 1.25, tension: 125, friction: 24 },
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
    description: 'Allison (Honduras) & Marcos (Brasil) • MA060826',
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
