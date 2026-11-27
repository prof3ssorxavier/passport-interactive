import type * as THREE from 'three';

export type PageIndex = 0 | 1 | 2 | 3;

export interface PageMeta {
  readonly index: PageIndex;
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
}

export interface PassportTextures {
  readonly coverFront: THREE.CanvasTexture;
  readonly coverMetalness: THREE.CanvasTexture;
  readonly coverInner: THREE.CanvasTexture;
  readonly page1Recto: THREE.CanvasTexture;
  readonly page1Verso: THREE.CanvasTexture;
  readonly page2Recto: THREE.CanvasTexture;
  readonly page2Verso: THREE.CanvasTexture;
  readonly page3Recto: THREE.CanvasTexture;
}
