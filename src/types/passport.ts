import type * as THREE from 'three';

export type PageIndex = 0 | 1 | 2 | 3;

export interface PageMeta {
  readonly index: PageIndex;
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
}

export interface PassportHolder {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly birthplace: string;
  readonly countryCode: string;
  readonly accentColor: string;
}

export interface DualSignatures {
  readonly marcos: string | null;
  readonly allison: string | null;
}

export interface PassportTextures {
  readonly coverFront: THREE.CanvasTexture;
  readonly coverMetalness: THREE.CanvasTexture;
  readonly coverRoughness: THREE.CanvasTexture;
  readonly coverNormal: THREE.CanvasTexture;
  readonly coverClearcoat: THREE.CanvasTexture;
  readonly coverInner: THREE.CanvasTexture;
  readonly paperNormal: THREE.CanvasTexture;
  readonly pageAlphaRecto: THREE.CanvasTexture;
  readonly pageAlphaVerso: THREE.CanvasTexture;
  readonly page1Recto: THREE.CanvasTexture;
  readonly page1Verso: THREE.CanvasTexture;
  readonly page2Recto: THREE.CanvasTexture;
  readonly page2Verso: THREE.CanvasTexture;
  readonly page3Recto: THREE.CanvasTexture;
  /** Redraws the inside-cover signature page with both Marcos & Allison signatures. */
  readonly setDualSignatures: (sigs: DualSignatures) => Promise<void>;
}
