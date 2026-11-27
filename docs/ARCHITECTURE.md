# Architecture — Interactive 3D Passport (*República das Tangerinas*)

**Passport ID:** `MA060826`  
**Stack:** Vite · React 19 · TypeScript (Strict) · Tailwind CSS v4 · Three.js · React Three Fiber v9 · Drei v10 · `@react-spring/three` v10 · `signature_pad` · `howler`

---

## 1. High-Level System Overview

The application renders a physically proportioned, interactive 3D passport in the browser. It separates **state & interaction contracts** (`src/hooks`, `src/types`) from **3D scene geometry & materials** (`src/components/canvas`), **procedural/SVG texture synthesis** (`src/utils/textures.ts`), and **2D HUD overlays** (`src/components/ui`).

```
passport-interactive/
├── docs/
│   ├── ARCHITECTURE.md         # System architecture, 3D geometry & state rules
│   └── DESIGN_TOKENS.md        # ISO ID-3 dimensions, colors, PBR & spring tokens
├── public/
│   └── assets/
│       ├── coat-of-arms.svg    # Metallic gold shield, tangerine, hummingbirds, 06.08.2026
│       ├── flag.svg            # Navy & tangerine national flag with gold hummingbird
│       ├── stamp-guatemala.svg # Guatemala Entry Visa (Oct 2026) ink stamp
│       └── stamp-sdq.svg       # Santo Domingo (SDQ) Residence Visa ink stamp
└── src/
    ├── constants/tokens.ts     # Runtime TypeScript mirror of DESIGN_TOKENS.md
    ├── types/passport.ts       # PageIndex, PassportState, Leaf descriptors
    ├── hooks/usePassportState.ts
    ├── utils/textures.ts       # High-DPI SVG-to-CanvasTexture synthesizer
    └── components/
        ├── canvas/
        │   ├── PassportScene.tsx
        │   ├── PassportBook.tsx
        │   └── PassportLeaf.tsx
        └── ui/
            └── HudControls.tsx
```

---

## 2. 3D Coordinate System & Geometry Rules

### 2.1 ISO/IEC 7810 ID-3 Proportions
Real-world passport books follow ISO/IEC 7810 ID-3 (`88 mm × 125 mm`, aspect ratio `0.704`).  
In Three.js world units:
- `width = 2.2`
- `height = 3.125` (`2.2 / 3.125 = 0.704`)
- `coverThickness = 0.032`
- `leafZSpacing = 0.002`

### 2.2 Left-Edge Spine Pivots (`-width / 2`)
Every rotatable sheet (Front Cover and Inner Leaves) rotates around its left spine edge:
- The animated hinge `<animated.group>` is positioned at `x = -PASSPORT_DIMS.width / 2` (`-1.1`) in `PassportBook`-local space.
- The sheet's visual mesh group sits inside the hinge at `x = +PASSPORT_DIMS.width / 2` (`+1.1`), so a Y-axis rotation from `0` to `-Math.PI` swings the sheet naturally from the right stack to the left stack around the spine.
- When `currentPage === 0` (closed), `PassportBook` centers the closed cover at `x = 0`. When `currentPage >= 1` (open), `PassportBook` smoothly translates along `+X` by `+PASSPORT_DIMS.width / 2` (`+1.1`) so the open two-page spread remains centered at the world origin (`x = 0` along the spine).

### 2.3 Z-Axis Leaf Spacing (`0.002`) & Anti-Z-Fighting
When a sheet rotates `180°` (`-Math.PI`) from the right stack to the left stack, its depth order relative to adjacent sheets inverts:
- **Unflipped (Right Stack, `rotY = 0`):** Topmost leaf has the largest `+Z`:
  $$z_{\text{right}}(i) = (N - i) \times 0.002$$
- **Flipped (Left Stack, `rotY = -\pi`):** Earlier leaves lie beneath later leaves on the left side:
  $$z_{\text{left}}(i) = i \times 0.002$$
- Each `PassportLeaf` smoothly animates both `rotationY` and `positionZ` via `@react-spring/three`, guaranteeing a minimum `0.002` separation at rest and eliminating coplanar z-fighting.
- Front (recto) and back (verso) faces of a single leaf are rendered as distinct opposing planes separated by `leafThickness` (`0.001`) with `FrontSide` rendering so opposing textures never bleed through.

---

## 3. State Machine (`currentPage`)

| `currentPage` | State Name | Flipped Leaves | Visible Spread |
| :---: | :--- | :--- | :--- |
| `0` | **Closed Cover** | None | Navy leather cover with metallic gold hot-stamping & coat of arms |
| `1` | **Profile + Touch Signature** | Front Cover | Inside front endpaper (L) · Holder profile `MA060826` + signature box (R) |
| `2` | **Guatemala Entry Visa (Oct 2026)** | Cover + Leaf 1 | Travel notes / flag watermark (L) · Guatemala Entry Stamp Oct 2026 (R) |
| `3` | **Santo Domingo Residence Visa** | Cover + Leaf 1 + Leaf 2 | Visa endorsement notes (L) · Santo Domingo (`SDQ`) Residence Visa (R) |

Navigation supports:
- Direct page jump (`goToPage(0 | 1 | 2 | 3)`)
- Sequential stepping (`nextPage()`, `prevPage()`)
- Clicking the closed cover or visible pages directly in 3D space
- Keyboard `ArrowRight` / `ArrowLeft` (disabled while `isSigning === true`)

---

## 4. Touch Isolation Rule (`isSigning`)

To prevent camera orbiting gestures from fighting with stylus/finger drawing on the Profile page signature canvas:
1. Application state exposes a strict boolean `isSigning`.
2. `<OrbitControls enabled={!isSigning} />` is bound directly to `!isSigning`.
3. Whenever the user enters signature mode or initiates a pointer/touch stroke inside the `signature_pad` canvas, `setIsSigning(true)` immediately locks `OrbitControls` and suppresses keyboard page flips.
4. Releasing the stroke or exiting signing mode calls `setIsSigning(false)` to restore 3D camera orbiting.

---

## 5. Audio & Texture Pipelines

- **Textures (`src/utils/textures.ts`):** SVGs from `public/assets/` are loaded into `Image` objects and composited onto offscreen `1024 × 1455` canvases (`SRGBColorSpace`, `anisotropy = 8`) to produce razor-sharp typography, guilloché security patterns, metallic gold foil accents, and angled visa ink stamps.
- **Audio (`howler`):** `howler` is installed and ready for page-turn foley (heavy leather cover thud vs. crisp cotton leaf rustle) triggered on `currentPage` transitions.
