# República das Tangerinas — Interactive 3D Passport (`MA060826`)

An interactive 3D biometric keepsake passport built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Three.js**, **React Three Fiber v9**, **Drei v10**, **React Spring**, **`signature_pad`**, and **`howler`**.

## Features

- **Bilingual Intro & Live Translation (PT / ES):** *"Welcome to our pass of life"* preloads 3D models & textures behind the intro screen and translates both UI and 3D passport pages between **Português (Brasil)** and **Español (Honduras)**.
- **Physical 3D Passport & Curved Page Physics:** ISO/IEC 7810 ID-3 proportions (`2.2 × 3.125`), beveled leather covers with Sobel-generated normal maps and 24k gold foil clearcoat, curved 28-segment paper turns, and synthesized leather/paper flip foley.
- **Brazilian-Style Biodata & Dual Live Signatures:** Inside-cover dual signature lines (Marcos da Silva Xavier — Brasil & Allison Pamela Ardon Segura — Honduras) with live `signature_pad` drawing, `OrbitControls` touch isolation, ghost portraits, and ICAO MRZ.
- **Guatemala & Santo Domingo Visa Spreads:** Authentic distressed Guatemalan `IGM` entry stamps (Oct 17 & Oct 19, 2026), physical Antigua Guatemala travel photo print, and Santo Domingo (`SDQ`) residence visa.
- **Photorealistic 3D Interior:** CC0 Poly Haven `.gltf` models (articulated desk lamp, porcelain teacup & saucer, encyclopedia books, potted plant) and photographed 1K PBR walnut desk & grey plaster walls with an open window vista and wind-swaying tangerine branches.
- **Mobile PWA Ready:** Portrait-aware dynamic camera framing, safe-area inset support, and a tabbed mobile signature bottom-sheet so it feels like a native app and can be saved to iOS/Android Home Screens.

## Local Development

```bash
npm install
npm run dev
```

## Production Build & Free Hosting (GitHub Pages)

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) and publishes the code-split production build (`VITE_BASE_PATH=/passport-interactive/`) to **GitHub Pages**:

1. Ensure the repository **Settings → Pages → Source** is set to **GitHub Actions**.
2. Merge your branch into `main` and push — the live site deploys automatically to `https://prof3ssorxavier.github.io/passport-interactive/`.
   *(If you prefer keeping the repository private while hosting for free, connect the repo to Vercel or Cloudflare Pages instead.)*

## Adding or Swapping 3D Models

Drop any Blender or Poly Haven CC0 `.glb` / `.gltf` asset into `public/models/` and mount it via `<CustomGlbProp url="models/your-asset.glb" groundToZero />` inside `src/components/canvas/DeskEnvironment.tsx`.
