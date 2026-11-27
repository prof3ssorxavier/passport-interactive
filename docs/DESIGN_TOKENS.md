# Design Tokens — *República das Tangerinas* (`MA060826`)

All runtime constants in `src/constants/tokens.ts` mirror the values defined in this specification.

---

## 1. Dimensions (ISO/IEC 7810 ID-3)

Standard biometric passport booklets measure **88 mm × 125 mm** (aspect ratio `0.704`).

| Token | Value (World Units) | Notes |
| --- | :---: | --- |
| `PASSPORT_WIDTH` | `2.2` | Exact `0.704` ratio with height (`2.2 / 3.125`) |
| `PASSPORT_HEIGHT` | `3.125` | Vertical axis (`Y`) |
| `COVER_THICKNESS` | `0.032` | Rigid navy leather-bound board thickness |
| `LEAF_THICKNESS` | `0.001` | Recto-to-verso plane separation per sheet |
| `LEAF_Z_SPACING` | `0.002` | Z-axis clearance between adjacent leaves (prevents z-fighting) |
| `SPINE_PIVOT_X` | `-1.1` | Left-edge hinge coordinate (`-PASSPORT_WIDTH / 2`) |

---

## 2. Color Palette

| Token | Hex | RGB | Usage |
| --- | :---: | :---: | --- |
| `leatherNavy` | `#102A4C` | `16, 42, 76` | Outer leather cover, spine, primary brand tone |
| `leatherNavyDark` | `#091930` | `9, 25, 48` | Ambient studio backdrop, recessed spine shadow |
| `foilGold` | `#D4AF37` | `212, 175, 55` | Metallic hot-stamped coat of arms, cover typography, borders |
| `foilGoldHighlight` | `#F1D77A` | `241, 215, 122` | Specular foil accents and active UI indicators |
| `paperCream` | `#F7F3E8` | `247, 243, 232` | Inner cotton security paper leaves |
| `paperWarmEdge` | `#E6DEC8` | `230, 222, 200` | Subtle page edges and guilloché watermark tint |
| `tangerine` | `#E86F2C` | `232, 111, 44` | National accent, flag field, tangerine crest, primary CTA |
| `inkPrimary` | `#1B263B` | `27, 38, 59` | Biographical data, headers, MRZ text |
| `inkMuted` | `#5B6B82` | `91, 107, 130` | Field labels, micro-print, page numbers |
| `stampGuatemala` | `#1D5B6B` | `29, 91, 107` | Guatemala Entry Visa (`OCT 2026`) ink |
| `stampSdq` | `#9B2C2C` | `155, 44, 44` | Santo Domingo (`SDQ`) Residence Visa seal ink |

---

## 3. PBR Material Tokens

| Surface | Roughness | Metalness | Notes |
| --- | :---: | :---: | --- |
| **Navy Leather Cover** | `0.72` | `0.08` | Subtle procedural grain bump/roughness variation |
| **Metallic Gold Hot-Stamping** | `0.26` | `0.85` | Driven by cover metalness/roughness map so foil gleams under rim light |
| **Cotton Security Paper** | `0.90` | `0.00` | Matte, non-reflective inner pages (`#F7F3E8`) |
| **Book Spine** | `0.68` | `0.10` | Matches cover leather with soft curvature |

---

## 4. Typography

- **Cover & Ceremonial Serif:** `'Georgia', 'Times New Roman', serif` (tracked uppercase `letter-spacing: 0.14em` for gold hot-stamping)
- **Passport Data & MRZ Monospace:** `'Courier New', ui-monospace, SFMono-Regular, monospace` (for `MA060826`, dates, and machine-readable zone lines)
- **HUD Sans-Serif:** `system-ui, -apple-system, 'Segoe UI', sans-serif`

---

## 5. Spring Physics Tokens (`@react-spring/three`)

| Element | `mass` | `tension` | `friction` | Feel |
| --- | :---: | :---: | :---: | --- |
| **Leather Cover** | `1.4` | `145` | `24` | Weighted, deliberate board swing |
| **Inner Paper Leaf** | `0.85` | `175` | `22` | Crisp, light cotton-paper turn |
| **Book Centering Shift** | `1.2` | `140` | `24` | Smooth lateral slide keeping spread centered |
