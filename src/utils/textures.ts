import * as THREE from 'three';
import { I18N, type Language } from '@/constants/i18n';
import { COLORS, ISSUE_DATE, PASSPORT_ID } from '@/constants/tokens';
import type { DualSignatures, PassportTextures } from '@/types/passport';
import { assetUrl } from '@/utils/assetUrl';

// High-DPI canvas matching exact ISO ID-3 ratio (2.2 / 3.125 = 0.704)
const TEX_WIDTH = 1280;
const TEX_HEIGHT = 1818;

function createCanvas(w = TEX_WIDTH, h = TEX_HEIGHT): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context for passport texture');
  }
  return [canvas, ctx];
}

function toTexture(canvas: HTMLCanvasElement, isColor = true): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function buildPageAlphaMask(roundRightSide: boolean): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 728);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 512, 728);

  const r = 24;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  if (roundRightSide) {
    ctx.moveTo(0, 0);
    ctx.lineTo(512 - r, 0);
    ctx.quadraticCurveTo(512, 0, 512, r);
    ctx.lineTo(512, 728 - r);
    ctx.quadraticCurveTo(512, 728, 512 - r, 728);
    ctx.lineTo(0, 728);
  } else {
    ctx.moveTo(r, 0);
    ctx.lineTo(512, 0);
    ctx.lineTo(512, 728);
    ctx.lineTo(r, 728);
    ctx.quadraticCurveTo(0, 728, 0, 728 - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
  }
  ctx.closePath();
  ctx.fill();

  return toTexture(canvas, false);
}

/**
 * Converts a grayscale heightfield canvas into a true tangent-space RGB Normal Map
 * using a 3×3 Sobel gradient operator.
 */
function heightCanvasToNormalTexture(
  heightCanvas: HTMLCanvasElement,
  strength: number,
  repeat?: readonly [number, number],
): THREE.CanvasTexture {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const srcCtx = heightCanvas.getContext('2d');
  const [outCanvas, outCtx] = createCanvas(w, h);

  if (!srcCtx) {
    return toTexture(outCanvas, false);
  }

  const src = srcCtx.getImageData(0, 0, w, h).data;
  const dstImg = outCtx.createImageData(w, h);
  const dst = dstImg.data;

  const sample = (x: number, y: number): number => {
    const cx = x < 0 ? 0 : x >= w ? w - 1 : x;
    const cy = y < 0 ? 0 : y >= h ? h - 1 : y;
    return (src[(cy * w + cx) * 4] ?? 128) / 255;
  };

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const tl = sample(x - 1, y - 1);
      const t = sample(x, y - 1);
      const tr = sample(x + 1, y - 1);
      const l = sample(x - 1, y);
      const r = sample(x + 1, y);
      const bl = sample(x - 1, y + 1);
      const b = sample(x, y + 1);
      const br = sample(x + 1, y + 1);

      const dX = tr + 2 * r + br - (tl + 2 * l + bl);
      const dY = bl + 2 * b + br - (tl + 2 * t + tr);

      const nx = -dX * strength;
      const ny = -dY * strength;
      const nz = 1.0;
      const invLen = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);

      const idx = (y * w + x) * 4;
      dst[idx] = Math.round((nx * invLen * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round((ny * invLen * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round((nz * invLen * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }

  outCtx.putImageData(dstImg, 0, 0);
  const tex = toTexture(outCanvas, false);
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  return tex;
}

function buildPaperNormalTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 512);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  let seed = 7731;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let i = 0; i < 14000; i += 1) {
    const x = rand() * 512;
    const y = rand() * 512;
    const len = 2 + rand() * 6;
    const angle = rand() * Math.PI;
    const v = rand() > 0.5 ? 172 : 86;
    ctx.strokeStyle = `rgba(${v},${v},${v},0.34)`;
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }

  return heightCanvasToNormalTexture(canvas, 1.35, [3, 4]);
}

function drawBiometricChip(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  style: string | CanvasGradient,
): void {
  ctx.save();
  ctx.strokeStyle = style;
  ctx.fillStyle = style;
  ctx.lineWidth = 5;
  const w = 108;
  const h = 64;
  ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy);
  ctx.lineTo(cx - 18, cy);
  ctx.moveTo(cx + 18, cy);
  ctx.lineTo(cx + w / 2, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function buildCoverTextures(
  coatImg: HTMLImageElement | null,
  language: Language,
): {
  coverFront: THREE.CanvasTexture;
  coverMetalness: THREE.CanvasTexture;
  coverRoughness: THREE.CanvasTexture;
  coverNormal: THREE.CanvasTexture;
  coverClearcoat: THREE.CanvasTexture;
} {
  const t = I18N[language];
  const [canvas, ctx] = createCanvas();
  const [metalCanvas, metalCtx] = createCanvas();
  const [roughCanvas, roughCtx] = createCanvas();
  const [bumpCanvas, bumpCtx] = createCanvas();
  const [clearcoatCanvas, clearcoatCtx] = createCanvas();

  ctx.fillStyle = COLORS.leatherNavy;
  ctx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);

  const vignette = ctx.createRadialGradient(
    TEX_WIDTH * 0.5,
    TEX_HEIGHT * 0.44,
    TEX_WIDTH * 0.14,
    TEX_WIDTH * 0.5,
    TEX_HEIGHT * 0.5,
    TEX_HEIGHT * 0.76,
  );
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);

  const spineCrease = ctx.createLinearGradient(0, 0, 92, 0);
  spineCrease.addColorStop(0, 'rgba(0,0,0,0.34)');
  spineCrease.addColorStop(0.45, 'rgba(255,255,255,0.05)');
  spineCrease.addColorStop(0.7, 'rgba(0,0,0,0.18)');
  spineCrease.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = spineCrease;
  ctx.fillRect(0, 0, 92, TEX_HEIGHT);

  metalCtx.fillStyle = '#121212';
  metalCtx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);

  roughCtx.fillStyle = '#c4c4c4';
  roughCtx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);

  bumpCtx.fillStyle = '#808080';
  bumpCtx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);

  clearcoatCtx.fillStyle = '#161616';
  clearcoatCtx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);

  let seed = 42069;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let i = 0; i < 20000; i += 1) {
    const x = rand() * TEX_WIDTH;
    const y = rand() * TEX_HEIGHT;
    const r = 1.2 + rand() * 2.8;
    const bright = rand() > 0.48;

    ctx.fillStyle = bright ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.065)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    bumpCtx.fillStyle = bright ? 'rgba(225,225,225,0.28)' : 'rgba(35,35,35,0.28)';
    bumpCtx.beginPath();
    bumpCtx.arc(x, y, r * 1.15, 0, Math.PI * 2);
    bumpCtx.fill();
  }

  bumpCtx.fillStyle = '#383838';
  bumpCtx.fillRect(52, 0, 12, TEX_HEIGHT);

  // Rich, luminous 24k champagne-gold gradient so gold foil gleams vividly against deep navy
  const goldGrad = ctx.createLinearGradient(120, 100, TEX_WIDTH - 120, TEX_HEIGHT - 100);
  goldGrad.addColorStop(0, '#FCE79C');
  goldGrad.addColorStop(0.35, '#E8C252');
  goldGrad.addColorStop(0.65, '#F8E08A');
  goldGrad.addColorStop(1, '#D1A532');

  const drawFoilLayer = (
    target: CanvasRenderingContext2D,
    style: string | CanvasGradient,
    mode: 'color' | 'metal' | 'rough' | 'bump',
  ) => {
    target.save();
    target.strokeStyle = style;
    target.fillStyle = style;

    target.lineWidth = 5.5;
    drawRoundedRect(target, 80, 72, TEX_WIDTH - 152, TEX_HEIGHT - 144, 44);
    target.stroke();
    target.lineWidth = 2.2;
    drawRoundedRect(target, 98, 90, TEX_WIDTH - 188, TEX_HEIGHT - 180, 34);
    target.stroke();

    target.textAlign = 'center';
    target.font = '700 55px Georgia, "Times New Roman", serif';
    target.fillText(t.countryLine1, TEX_WIDTH / 2 + 10, 250);
    target.font = '700 68px Georgia, "Times New Roman", serif';
    target.fillText(t.countryLine2, TEX_WIDTH / 2 + 10, 336);

    target.lineWidth = 3;
    target.beginPath();
    target.moveTo(TEX_WIDTH * 0.26, 388);
    target.lineTo(TEX_WIDTH * 0.76, 388);
    target.stroke();

    if (coatImg) {
      const [maskC, maskCtx] = createCanvas(600, 660);
      maskCtx.drawImage(coatImg, 0, 0, 600, 660);
      if (mode === 'color') {
        // Tint coat of arms with the same luminous gold foil sheen
        maskCtx.globalCompositeOperation = 'source-atop';
        const coatGrad = maskCtx.createLinearGradient(0, 0, 600, 660);
        coatGrad.addColorStop(0, '#FCE79C');
        coatGrad.addColorStop(0.5, '#E8C252');
        coatGrad.addColorStop(1, '#D1A532');
        maskCtx.fillStyle = coatGrad;
        maskCtx.fillRect(0, 0, 600, 660);
      } else {
        maskCtx.globalCompositeOperation = 'source-in';
        maskCtx.fillStyle = typeof style === 'string' ? style : '#ffffff';
        maskCtx.fillRect(0, 0, 600, 660);
      }
      target.drawImage(maskC, TEX_WIDTH / 2 - 290, 444);
    }

    target.font = '700 65px Georgia, "Times New Roman", serif';
    target.fillText(t.passportTitle, TEX_WIDTH / 2 + 10, 1274);

    target.font = '600 35px "Courier New", monospace';
    target.fillText(PASSPORT_ID, TEX_WIDTH / 2 + 10, 1354);

    drawBiometricChip(target, TEX_WIDTH / 2 + 10, 1518, style);
    target.restore();
  };

  drawFoilLayer(ctx, goldGrad, 'color');
  // 0.72 metalness keeps rich warm gold diffuse body while gleaming under white studio lights
  drawFoilLayer(metalCtx, '#b8b8b8', 'metal');
  drawFoilLayer(roughCtx, '#323232', 'rough');
  drawFoilLayer(bumpCtx, '#242424', 'bump');
  drawFoilLayer(clearcoatCtx, '#f5f5f5', 'metal');

  // Downscale heightfield to 512×728 before Sobel normal computation (~6× faster startup)
  const [smallBump, smallBumpCtx] = createCanvas(512, 728);
  smallBumpCtx.drawImage(bumpCanvas, 0, 0, 512, 728);

  return {
    coverFront: toTexture(canvas, true),
    coverMetalness: toTexture(metalCanvas, false),
    coverRoughness: toTexture(roughCanvas, false),
    coverNormal: heightCanvasToNormalTexture(smallBump, 2.0),
    coverClearcoat: toTexture(clearcoatCanvas, false),
  };
}

function drawBrazilianStyleSecurityPaper(
  ctx: CanvasRenderingContext2D,
  pageNumber: string,
  spineOnLeft: boolean,
  flagImg: HTMLImageElement | null,
  coatImg: HTMLImageElement | null,
  showVistosLabel = true,
  showNumberTab = true,
): void {
  ctx.fillStyle = COLORS.paperCream;
  ctx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);

  const paperShade = ctx.createRadialGradient(
    TEX_WIDTH * 0.5,
    TEX_HEIGHT * 0.45,
    180,
    TEX_WIDTH * 0.5,
    TEX_HEIGHT * 0.5,
    TEX_HEIGHT * 0.72,
  );
  paperShade.addColorStop(0, 'rgba(255, 252, 244, 0.2)');
  paperShade.addColorStop(1, 'rgba(176, 158, 124, 0.24)');
  ctx.fillStyle = paperShade;
  ctx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);

  ctx.save();
  const bandWidth = 175;
  const bandPalette = [
    'rgba(181, 174, 114, 0.18)',
    'rgba(128, 174, 174, 0.12)',
    'rgba(220, 156, 114, 0.13)',
    'rgba(154, 166, 128, 0.14)',
  ];

  for (let col = 0; col < 6; col += 1) {
    const colX = col * (TEX_WIDTH / 6);
    const colW = TEX_WIDTH / 6 + 1;
    ctx.save();
    ctx.beginPath();
    ctx.rect(colX, 0, colW, TEX_HEIGHT);
    ctx.clip();

    const yShift = (col % 2 === 0 ? 0 : 120) + col * 38;
    for (let b = -4; b < 14; b += 1) {
      ctx.fillStyle = bandPalette[(b + col + 8) % bandPalette.length] ?? bandPalette[0]!;
      ctx.beginPath();
      const y0 = b * bandWidth + yShift;
      ctx.moveTo(colX - 20, y0);
      ctx.lineTo(colX + colW + 20, y0 + 185);
      ctx.lineTo(colX + colW + 20, y0 + 275);
      ctx.lineTo(colX - 20, y0 + 90);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.strokeStyle = 'rgba(150, 138, 96, 0.12)';
  ctx.lineWidth = 1;
  for (let gx = 90; gx < TEX_WIDTH - 60; gx += 128) {
    for (let gy = 110; gy < TEX_HEIGHT - 90; gy += 128) {
      ctx.beginPath();
      ctx.moveTo(gx, gy - 18);
      ctx.lineTo(gx + 18, gy);
      ctx.lineTo(gx, gy + 18);
      ctx.lineTo(gx - 18, gy);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(gx, gy, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();

  let seed = 8801 + Number(pageNumber || '1') * 97;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let i = 0; i < 4500; i += 1) {
    const x = rand() * TEX_WIDTH;
    const y = rand() * TEX_HEIGHT;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(122, 104, 74, 0.045)' : 'rgba(255, 250, 238, 0.05)';
    ctx.fillRect(x, y, 2.5 + rand() * 3.5, 1.4);
  }

  // Vertical woven security strip on verso/left pages
  if (!spineOnLeft && showNumberTab) {
    const stripX = 148;
    const stripW = 84;
    ctx.save();
    ctx.fillStyle = 'rgba(236, 234, 224, 0.72)';
    ctx.fillRect(stripX, 0, stripW, TEX_HEIGHT - 360);
    ctx.strokeStyle = 'rgba(72, 92, 128, 0.34)';
    ctx.lineWidth = 2;
    ctx.strokeRect(stripX, 0, stripW, TEX_HEIGHT - 360);

    ctx.strokeStyle = 'rgba(72, 92, 128, 0.32)';
    ctx.lineWidth = 1.6;
    for (let sy = 20; sy < TEX_HEIGHT - 380; sy += 64) {
      const cx = stripX + stripW / 2;
      ctx.beginPath();
      ctx.moveTo(cx, sy);
      ctx.lineTo(cx + 28, sy + 32);
      ctx.lineTo(cx, sy + 64);
      ctx.lineTo(cx - 28, sy + 32);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  // Realistic spine binding gutter shadow
  const gutterW = 190;
  const gutterX0 = spineOnLeft ? 0 : TEX_WIDTH;
  const gutterX1 = spineOnLeft ? gutterW : TEX_WIDTH - gutterW;
  const spineGrad = ctx.createLinearGradient(gutterX0, 0, gutterX1, 0);
  spineGrad.addColorStop(0, 'rgba(30, 36, 48, 0.28)');
  spineGrad.addColorStop(0.22, 'rgba(30, 36, 48, 0.12)');
  spineGrad.addColorStop(0.55, 'rgba(30, 36, 48, 0.03)');
  spineGrad.addColorStop(1, 'rgba(30, 36, 48, 0)');
  ctx.fillStyle = spineGrad;
  ctx.fillRect(spineOnLeft ? 0 : TEX_WIDTH - gutterW, 0, gutterW, TEX_HEIGHT);

  if (flagImg && showNumberTab) {
    const fx = spineOnLeft ? TEX_WIDTH - 134 : 58;
    const fy = 58;
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.drawImage(flagImg, fx, fy, 76, 50);
    ctx.strokeStyle = 'rgba(16, 42, 76, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(fx, fy, 76, 50);
    ctx.restore();
  }

  if (showNumberTab) {
    const tabW = 188;
    const tabH = 74;
    const tabY = 1230;
    const tabX = spineOnLeft ? TEX_WIDTH - tabW : 0;

    ctx.save();
    ctx.fillStyle = 'rgba(32, 58, 98, 0.88)';
    ctx.fillRect(tabX, tabY, tabW, tabH);

    const diamondCx = spineOnLeft ? tabX + tabW - 92 : tabX + 92;
    const diamondCy = tabY + tabH / 2;
    ctx.strokeStyle = 'rgba(234, 226, 206, 0.72)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(diamondCx, tabY + 8);
    ctx.lineTo(diamondCx + 52, diamondCy);
    ctx.lineTo(diamondCx, tabY + tabH - 8);
    ctx.lineTo(diamondCx - 52, diamondCy);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = '#EAE2CE';
    ctx.font = '700 40px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(pageNumber, diamondCx, diamondCy + 14);
    ctx.restore();
  }

  if (showVistosLabel) {
    ctx.save();
    const crestX = spineOnLeft ? TEX_WIDTH - 126 : 64;
    const crestY = TEX_HEIGHT - 146;
    if (coatImg) {
      ctx.globalAlpha = 0.45;
      ctx.drawImage(coatImg, crestX, crestY, 64, 70);
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = 'rgba(26, 42, 68, 0.78)';
    ctx.font = '700 18px system-ui, sans-serif';
    if (spineOnLeft) {
      ctx.textAlign = 'right';
      ctx.fillText('REPÚBLICA', TEX_WIDTH - 142, TEX_HEIGHT - 124);
      ctx.fillText('DAS', TEX_WIDTH - 142, TEX_HEIGHT - 102);
      ctx.fillText('TANGERINAS', TEX_WIDTH - 142, TEX_HEIGHT - 80);
    } else {
      ctx.textAlign = 'left';
      ctx.fillText('REPÚBLICA', 142, TEX_HEIGHT - 124);
      ctx.fillText('DAS', 142, TEX_HEIGHT - 102);
      ctx.fillText('TANGERINAS', 142, TEX_HEIGHT - 80);
    }

    ctx.textAlign = 'center';
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(26, 42, 68, 0.65)';
    ctx.fillText('VISTOS / VISAS', spineOnLeft ? 280 : TEX_WIDTH - 280, TEX_HEIGHT - 84);
    ctx.restore();
  }
}

/**
 * Helper to draw a realistic grayscale ghost portrait (like real biometric passports).
 */
function drawGhostPortrait(
  ctx: CanvasRenderingContext2D,
  profileImg: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  alpha = 0.38,
): void {
  const [tmp, tCtx] = createCanvas(dw, dh);
  const srcW = profileImg.naturalWidth;
  const srcH = profileImg.naturalHeight;
  const targetAspect = dw / dh;
  const cropH = Math.min(srcH, srcW / targetAspect);
  const cropY = Math.min(srcH - cropH, srcH * 0.28);

  tCtx.filter = 'grayscale(100%) contrast(108%) brightness(105%)';
  tCtx.drawImage(profileImg, 0, cropY, srcW, cropH, 0, 0, dw, dh);

  // Soft feather edge vignette so ghost portrait blends organically into cotton paper
  tCtx.globalCompositeOperation = 'destination-in';
  const rad = tCtx.createRadialGradient(dw / 2, dh * 0.48, dw * 0.22, dw / 2, dh / 2, dw * 0.62);
  rad.addColorStop(0, 'rgba(0,0,0,1)');
  rad.addColorStop(1, 'rgba(0,0,0,0)');
  tCtx.fillStyle = rad;
  tCtx.fillRect(0, 0, dw, dh);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(tmp, dx, dy);
  ctx.restore();
}

/**
 * Draws the REAL Brazilian-passport-style Left Signature & Barcode Page (Inside Front Cover)
 * with TWO signature lines (Marcos & Allison), vertical barcode, laser-perforated ID,
 * multilingual legal notice, and ghost portrait!
 */
function buildSignaturePageBase(
  flagImg: HTMLImageElement | null,
  coatImg: HTMLImageElement | null,
  profileImg: HTMLImageElement | null,
  language: Language,
): HTMLCanvasElement {
  const t = I18N[language];
  const [canvas, ctx] = createCanvas();
  drawBrazilianStyleSecurityPaper(ctx, '00', false, flagImg, coatImg, false, false);

  // Top-left Brazilian-style vertical navy badge + mini flag
  if (flagImg) {
    ctx.drawImage(flagImg, 54, 48, 56, 38);
  }
  ctx.fillStyle = 'rgba(32, 58, 98, 0.85)';
  ctx.fillRect(126, 0, 74, 150);
  ctx.fillStyle = '#EAE2CE';
  ctx.font = '700 42px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('01', 163, 118);

  // Top-right crest + vertical text (matching ref)
  if (coatImg) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.drawImage(coatImg, TEX_WIDTH - 156, 56, 92, 102);
    ctx.restore();
  }
  ctx.save();
  ctx.translate(TEX_WIDTH - 92, 278);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = 'rgba(26, 42, 68, 0.8)';
  ctx.font = '700 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(t.countryName, 0, 0);
  ctx.restore();

  // Left vertical laser-perforated dot-matrix ID + vertical bold ID + barcode (exact Brazilian ref!)
  ctx.save();
  ctx.translate(148, 760);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = 'rgba(30, 38, 50, 0.35)';
  ctx.font = '700 66px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(PASSPORT_ID, 0, 0);
  ctx.restore();

  ctx.save();
  ctx.translate(230, 760);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = COLORS.inkPrimary;
  ctx.font = '700 42px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(PASSPORT_ID, 0, 0);
  ctx.restore();

  // Crisp vertical barcode
  ctx.save();
  let bx = 278;
  const barYStart = 420;
  const barYEnd = 1080;
  const pattern = [4, 2, 6, 3, 2, 5, 3, 2, 7, 2, 4, 3, 6, 2, 3, 5, 2, 4, 3, 6, 2, 5, 3, 4];
  let curY = barYStart;
  let pi = 0;
  ctx.fillStyle = COLORS.inkPrimary;
  while (curY < barYEnd) {
    const h = (pattern[pi % pattern.length] ?? 3) * 3.5;
    if (pi % 2 === 0) {
      ctx.fillRect(bx, curY, 64, h);
    }
    curY += h;
    pi += 1;
  }
  ctx.restore();

  // TWO Official Signature Lines (Marcos & Allison)
  const sigLeft = 408;
  const sigRight = TEX_WIDTH - 130;

  // Signature 1 — Marcos
  ctx.strokeStyle = 'rgba(20, 34, 56, 0.55)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(sigLeft, 360);
  ctx.lineTo(sigRight, 360);
  ctx.stroke();

  ctx.fillStyle = COLORS.inkPrimary;
  ctx.font = '700 21px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(t.textures.sig1Label, (sigLeft + sigRight) / 2, 392);
  ctx.fillStyle = COLORS.inkMuted;
  ctx.font = '600 18px "Courier New", monospace';
  ctx.fillText('MARCOS DA SILVA XAVIER (BRASIL)', (sigLeft + sigRight) / 2, 422);

  // Signature 2 — Allison
  ctx.strokeStyle = 'rgba(20, 34, 56, 0.55)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(sigLeft, 650);
  ctx.lineTo(sigRight, 650);
  ctx.stroke();

  ctx.fillStyle = COLORS.inkPrimary;
  ctx.font = '700 21px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(t.textures.sig2Label, (sigLeft + sigRight) / 2, 682);
  ctx.fillStyle = COLORS.inkMuted;
  ctx.font = '600 18px "Courier New", monospace';
  ctx.fillText('ALLISON PAMELA ARDON SEGURA (HONDURAS)', (sigLeft + sigRight) / 2, 712);

  // Official Multilingual Legal Notice (matching Brazilian ref!)
  ctx.fillStyle = 'rgba(20, 34, 56, 0.82)';
  ctx.font = '600 22px Georgia, serif';
  ctx.textAlign = 'center';
  const noticeCx = (sigLeft + sigRight) / 2 - 40;
  ctx.fillText(t.textures.legalLine1, noticeCx, 854);
  ctx.fillText(t.textures.legalLine2, noticeCx, 886);

  ctx.font = 'italic 20px Georgia, serif';
  ctx.fillStyle = 'rgba(20, 34, 56, 0.68)';
  ctx.fillText('This passport must be signed by both bearers,', noticeCx, 948);
  ctx.fillText('except where the bearer is unable to do so.', noticeCx, 978);

  ctx.fillText('Este pasaporte debe ser firmado por los titulares,', noticeCx, 1038);
  ctx.fillText('salvo en caso de incapacidad.', noticeCx, 1068);

  // Subtle Ghost Portrait in lower-right (matching Brazilian signature page!)
  if (profileImg) {
    drawGhostPortrait(ctx, profileImg, TEX_WIDTH - 410, 1180, 310, 360, 0.36);
  }

  return canvas;
}

/**
 * Draws the REAL Brazilian-passport-style Right Biodata Page (Page 1 Recto)
 * modeled directly on the uploaded Brazilian biodata reference:
 * - Left: PASSAPORTE / PASSPORT + crisp couple portrait photo
 * - Middle: Authentic dense official biodata fields (NO web cards!)
 * - Right: Translucent grayscale ghost photo + hologram accent
 * - Bottom: Full-width classic white/ivory 2-line ICAO MRZ
 */
function buildRealBiodataPage(
  flagImg: HTMLImageElement | null,
  coatImg: HTMLImageElement | null,
  profileImg: HTMLImageElement | null,
  language: Language,
): THREE.CanvasTexture {
  const t = I18N[language];
  const [canvas, ctx] = createCanvas();
  drawBrazilianStyleSecurityPaper(ctx, '01', true, flagImg, coatImg, false, false);

  // Subtle horizontal polycarbonate sheen band across middle
  const polyGrad = ctx.createLinearGradient(0, 180, TEX_WIDTH, 1300);
  polyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
  polyGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.02)');
  polyGrad.addColorStop(1, 'rgba(180, 160, 110, 0.12)');
  ctx.fillStyle = polyGrad;
  ctx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);

  // Top Country Title Band
  ctx.fillStyle = COLORS.inkPrimary;
  ctx.font = '700 32px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(t.countryName, 462, 116);

  // Top metadata row (TIPO | PAÍS EMISSOR | PASSAPORTE Nº)
  const drawField = (label: string, value: string, x: number, y: number, valueSize = 27) => {
    ctx.fillStyle = 'rgba(46, 62, 84, 0.85)';
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x, y);

    ctx.fillStyle = COLORS.inkPrimary;
    ctx.font = `700 ${valueSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(value, x, y + valueSize + 4);
  };

  drawField('TIPO / TYPE', 'P', 462, 154, 26);
  drawField('PAÍS / ISSUING COUNTRY', 'TNG', 610, 154, 26);
  drawField(`${t.passportNoLabel} / PASSPORT NO.`, PASSPORT_ID, 920, 154, 28);

  // Left Column: PASSAPORTE / PASSPORT + Crisp Portrait Photo
  ctx.fillStyle = COLORS.inkPrimary;
  ctx.font = '700 28px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(t.passportTitle, 252, 232);
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillStyle = COLORS.inkMuted;
  ctx.fillText('PASSPORT', 252, 264);

  const photoX = 76;
  const photoY = 294;
  const photoW = 354;
  const photoH = 468;

  ctx.save();
  drawRoundedRect(ctx, photoX, photoY, photoW, photoH, 8);
  ctx.clip();
  if (profileImg) {
    const srcW = profileImg.naturalWidth;
    const srcH = profileImg.naturalHeight;
    const targetAspect = photoW / photoH;
    const cropW = Math.min(srcW, srcH * targetAspect);
    const cropH = Math.min(srcH, cropW / targetAspect);
    const cropX = (srcW - cropW) / 2;
    const cropY = Math.min(srcH - cropH, srcH * 0.24);
    ctx.drawImage(profileImg, cropX, cropY, cropW, cropH, photoX, photoY, photoW, photoH);

    // Delicate translucent holographic crest over bottom-right corner
    if (coatImg) {
      ctx.globalAlpha = 0.24;
      ctx.drawImage(coatImg, photoX + photoW - 118, photoY + photoH - 128, 112, 122);
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();

  ctx.strokeStyle = 'rgba(16, 42, 76, 0.28)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, photoX, photoY, photoW, photoH, 8);
  ctx.stroke();

  // Official seal & flag beneath portrait photo
  if (flagImg) {
    ctx.drawImage(flagImg, 76, 800, 108, 72);
    ctx.strokeStyle = 'rgba(16, 42, 76, 0.2)';
    ctx.strokeRect(76, 800, 108, 72);
  }
  if (coatImg) {
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.drawImage(coatImg, 210, 788, 96, 106);
    ctx.restore();
  }

  // Middle Column: Authentic Dense Official Biodata Fields (matching Brazilian ref!)
  const midX = 462;
  drawField(t.textures.bearer1Label, 'MARCOS DA SILVA XAVIER', midX, 246, 26);
  drawField(t.textures.birthplaceLabel, 'BRASIL', midX, 326, 26);

  // Thin security divider between holders
  ctx.strokeStyle = 'rgba(16, 42, 76, 0.16)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(midX, 404);
  ctx.lineTo(900, 404);
  ctx.stroke();

  drawField(t.textures.bearer2Label, 'ALLISON PAMELA ARDON SEGURA', midX, 426, 25);
  drawField(t.textures.birthplaceLabel, 'HONDURAS', midX, 506, 26);

  ctx.strokeStyle = 'rgba(16, 42, 76, 0.16)';
  ctx.beginPath();
  ctx.moveTo(midX, 584);
  ctx.lineTo(900, 584);
  ctx.stroke();

  drawField(t.textures.nationalityLabel, t.textures.nationalityValue, midX, 608, 24);
  drawField('SEXO / SEX', 'M / F', midX, 692, 24);
  drawField('REGISTRO / JOINT ID', PASSPORT_ID, 640, 692, 24);

  drawField(t.textures.issueDateLabel, t.textures.issueDateValue, midX, 786, 24);
  drawField(t.textures.expiryDateLabel, t.textures.expiryDateValue, midX, 872, 24);
  drawField(t.textures.authorityLabel, t.textures.authorityValue, midX, 958, 23);

  // Right Column: Authentic Grayscale Ghost Portrait + Hologram Square (matching Brazilian ref!)
  if (profileImg) {
    drawGhostPortrait(ctx, profileImg, 932, 300, 276, 356, 0.34);
  }
  ctx.save();
  ctx.fillStyle = 'rgba(165, 198, 212, 0.35)';
  ctx.strokeStyle = 'rgba(16, 42, 76, 0.25)';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, 1084, 710, 96, 66, 6);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Bottom Full-Width Classic White/Ivory ICAO Machine Readable Zone (MRZ)
  ctx.save();
  ctx.fillStyle = '#F3EFE4';
  ctx.fillRect(0, 1430, TEX_WIDTH, TEX_HEIGHT - 1430);
  ctx.strokeStyle = 'rgba(16, 42, 76, 0.14)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 1430);
  ctx.lineTo(TEX_WIDTH, 1430);
  ctx.stroke();

  ctx.fillStyle = '#111926';
  ctx.font = '700 35px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('P<TNGXAVIER<<MARCOS<<ARDON<SEGURA<<ALLISON<<', 76, 1554);
  ctx.fillText(`${PASSPORT_ID}<8BRA2608064HND3608069<<<<<<<<<<<<08`, 76, 1632);
  ctx.restore();

  return toTexture(canvas, true);
}

/**
 * Draws an authentic distressed Guatemalan IGM Immigration Rubber Stamp
 * modeled directly on the user's real passport stamp photo (`INSTITUTO GUATEMALTECO DE MIGRACIÓN`).
 * Uses `multiply` blend + organic ink roughness so it genuinely soaks into the cotton paper!
 */
function drawGuatemalaIgmStamp(
  ctx: CanvasRenderingContext2D,
  options: {
    cx: number;
    cy: number;
    angle: number;
    inkColor: string;
    dateText: string;
    officerName: string;
    seed: number;
  },
): void {
  const { cx, cy, angle, inkColor, dateText, officerName, seed: initSeed } = options;
  const w = 680;
  const h = 440;

  const [sc, sCtx] = createCanvas(w, h);
  sCtx.strokeStyle = inkColor;
  sCtx.fillStyle = inkColor;

  // Outer distressed border with repeating "IGM" micro-border on sides & top
  sCtx.lineWidth = 5;
  sCtx.strokeRect(18, 18, w - 36, h - 36);

  // Repeating IGM security border stamps along left & top-right (just like the real stamp!)
  sCtx.font = '700 18px "Courier New", monospace';
  sCtx.textAlign = 'left';
  for (let row = 0; row < 4; row += 1) {
    sCtx.fillText('IGM IGM IGM', 452, 54 + row * 22);
  }
  for (let row = 0; row < 5; row += 1) {
    sCtx.fillText('IGM IGM', 32, 224 + row * 22);
  }

  // Stylized Guatemala map silhouette on upper-left (just like the real IGM stamp!)
  sCtx.save();
  sCtx.lineWidth = 3.2;
  sCtx.beginPath();
  sCtx.moveTo(64, 48);
  sCtx.lineTo(124, 48);
  sCtx.lineTo(136, 98);
  sCtx.lineTo(164, 118);
  sCtx.lineTo(148, 152);
  sCtx.lineTo(116, 178);
  sCtx.lineTo(68, 186);
  sCtx.lineTo(42, 154);
  sCtx.lineTo(54, 116);
  sCtx.lineTo(74, 92);
  sCtx.closePath();
  sCtx.stroke();
  sCtx.restore();

  // Official Header: INSTITUTO GUATEMALTECO DE MIGRACIÓN
  sCtx.textAlign = 'left';
  sCtx.font = '700 22px system-ui, sans-serif';
  sCtx.fillText('INSTITUTO', 184, 62);
  sCtx.fillText('GUATEMALTECO DE', 184, 88);
  sCtx.font = '800 38px system-ui, sans-serif';
  sCtx.fillText('MIGRACIÓN', 184, 128);

  // Central Date Rectangle Box
  sCtx.lineWidth = 4;
  sCtx.strokeRect(164, 152, 344, 166);
  sCtx.strokeRect(508, 152, 146, 166);

  // Date Stamp inside box (e.g. "- 17 OCT 2026" or "- 19 OCT 2026")
  sCtx.textAlign = 'center';
  sCtx.font = '700 44px "Courier New", monospace';
  sCtx.fillText(dateText, 336, 250);

  // Bottom officer / delegation line (matching real stamp)
  sCtx.font = '700 26px system-ui, sans-serif';
  sCtx.textAlign = 'center';
  sCtx.fillText(officerName, w / 2, 368);
  sCtx.font = '700 18px "Courier New", monospace';
  sCtx.fillText('DELEGACIÓN • AERO. LA AURORA • GUA', w / 2, 404);

  // Subtle hand-inked immigration officer signature flourish on right box (like the real photo!)
  sCtx.save();
  sCtx.lineWidth = 3.2;
  sCtx.lineCap = 'round';
  sCtx.beginPath();
  sCtx.moveTo(545, 198);
  sCtx.bezierCurveTo(595, 168, 625, 226, 565, 258);
  sCtx.bezierCurveTo(532, 276, 578, 310, 616, 294);
  sCtx.stroke();
  sCtx.restore();

  // Distressed rubber-stamp ink speckles (erases tiny micro-gaps so it looks authentically stamped!)
  let s = initSeed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  sCtx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 3200; i += 1) {
    const rx = rand() * w;
    const ry = rand() * h;
    const rr = 0.8 + rand() * 2.2;
    sCtx.fillStyle = `rgba(0,0,0,${0.18 + rand() * 0.42})`;
    sCtx.beginPath();
    sCtx.arc(rx, ry, rr, 0, Math.PI * 2);
    sCtx.fill();
  }

  // Composite onto cotton paper with `multiply` so paper texture & bands show right through the ink!
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.78;
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(sc, -w / 2, -h / 2);
  ctx.restore();
}

/**
 * Page 1 Verso (Left side of Guatemala Spread):
 * Features the couple's Antigua Guatemala photo styled like a realistic physical printed photo
 * tucked onto the visa page with subtle paper shadow & handwritten caption!
 */
function buildPage1Verso(
  flagImg: HTMLImageElement | null,
  coatImg: HTMLImageElement | null,
  antiguaImg: HTMLImageElement | null,
  language: Language,
): THREE.CanvasTexture {
  const t = I18N[language];
  const [canvas, ctx] = createCanvas();
  drawBrazilianStyleSecurityPaper(ctx, '02', false, flagImg, coatImg, true, true);

  if (antiguaImg) {
    const cardW = 580;
    const cardH = 740;
    const pad = 26;
    const bottomPad = 92;

    ctx.save();
    ctx.translate(TEX_WIDTH * 0.56, TEX_HEIGHT * 0.46);
    ctx.rotate(-0.045);

    ctx.shadowColor = 'rgba(18, 26, 38, 0.28)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetX = 10;
    ctx.shadowOffsetY = 16;

    ctx.fillStyle = '#FBF9F4';
    ctx.fillRect(-cardW / 2, -cardH / 2, cardW, cardH);

    ctx.shadowColor = 'transparent';

    const imgW = cardW - pad * 2;
    const imgH = cardH - pad - bottomPad;
    const srcW = antiguaImg.naturalWidth;
    const srcH = antiguaImg.naturalHeight;
    const targetAspect = imgW / imgH;
    const cropW = Math.min(srcW, srcH * targetAspect);
    const cropH = Math.min(srcH, cropW / targetAspect);
    const cropX = (srcW - cropW) / 2;
    const cropY = Math.min(srcH - cropH, srcH * 0.14);

    ctx.drawImage(
      antiguaImg,
      cropX,
      cropY,
      cropW,
      cropH,
      -cardW / 2 + pad,
      -cardH / 2 + pad,
      imgW,
      imgH,
    );

    ctx.strokeStyle = 'rgba(16, 42, 76, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-cardW / 2 + pad, -cardH / 2 + pad, imgW, imgH);

    ctx.fillStyle = '#2B3A52';
    ctx.font = 'italic 30px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(t.textures.antiguaCaption, 0, cardH / 2 - 34);
    ctx.restore();
  }

  return toTexture(canvas, true);
}

/**
 * Page 2 Recto (Right side of Guatemala Spread):
 * Both authentic distressed Guatemalan IGM entry stamps:
 * - Marcos: muted purple-ish ink, Oct 17, 2026
 * - Allison: muted blue-ish ink, Oct 19, 2026
 */
function buildPage2Recto(
  flagImg: HTMLImageElement | null,
  coatImg: HTMLImageElement | null,
): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas();
  drawBrazilianStyleSecurityPaper(ctx, '03', true, flagImg, coatImg, true, true);

  // Stamp 1: Marcos — Oct 17, 2026 (muted purple-ish ink blending into cotton paper)
  drawGuatemalaIgmStamp(ctx, {
    cx: 600,
    cy: 560,
    angle: -0.07,
    inkColor: '#634375',
    dateText: '- 17 OCT 2026',
    officerName: 'MARCOS DA SILVA XAVIER',
    seed: 171026,
  });

  // Stamp 2: Allison — Oct 19, 2026 (muted blue-ish ink blending into cotton paper)
  drawGuatemalaIgmStamp(ctx, {
    cx: 560,
    cy: 1120,
    angle: 0.06,
    inkColor: '#2B5685',
    dateText: '- 19 OCT 2026',
    officerName: 'ALLISON PAMELA ARDON SEGURA',
    seed: 191026,
  });

  return toTexture(canvas, true);
}

function buildPage2Verso(
  flagImg: HTMLImageElement | null,
  coatImg: HTMLImageElement | null,
  language: Language,
): THREE.CanvasTexture {
  const t = I18N[language];
  const [canvas, ctx] = createCanvas();
  drawBrazilianStyleSecurityPaper(ctx, '04', false, flagImg, coatImg, true, true);

  ctx.fillStyle = COLORS.inkPrimary;
  ctx.font = '700 32px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(t.textures.endorsementsTitle, TEX_WIDTH / 2 + 40, 154);

  ctx.fillStyle = COLORS.tangerine;
  ctx.fillRect(TEX_WIDTH / 2 - 160, 174, 400, 3.5);

  ctx.save();
  ctx.fillStyle = 'rgba(246, 240, 226, 0.84)';
  ctx.strokeStyle = 'rgba(16, 42, 76, 0.25)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 276, 300, TEX_WIDTH - 360, 420, 16);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.inkPrimary;
  ctx.font = '700 28px Georgia, serif';
  ctx.fillText(t.textures.notesHeading, 316, 368);

  ctx.fillStyle = COLORS.inkPrimary;
  ctx.font = '700 23px "Courier New", monospace';
  ctx.fillText(`${t.textures.noteJointPassport} ${PASSPORT_ID}`, 316, 444);
  ctx.fillText('• Marcos da Silva Xavier (BRA)', 316, 502);
  ctx.fillText('• Allison Pamela Ardon Segura (HND)', 316, 560);
  ctx.fillText(`${t.textures.noteIssue} ${ISSUE_DATE}`, 316, 618);

  return toTexture(canvas, true);
}

function buildPage3Recto(
  flagImg: HTMLImageElement | null,
  coatImg: HTMLImageElement | null,
  sdqStamp: HTMLImageElement | null,
  language: Language,
): THREE.CanvasTexture {
  const t = I18N[language];
  const [canvas, ctx] = createCanvas();
  drawBrazilianStyleSecurityPaper(ctx, '05', true, flagImg, coatImg, true, true);

  ctx.fillStyle = COLORS.inkPrimary;
  ctx.font = '700 32px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(t.textures.sdqPageTitle, TEX_WIDTH / 2 - 20, 154);

  ctx.fillStyle = COLORS.tangerine;
  ctx.fillRect(TEX_WIDTH / 2 - 260, 174, 480, 3.5);

  ctx.save();
  ctx.fillStyle = 'rgba(246, 240, 224, 0.90)';
  ctx.strokeStyle = COLORS.foilGold;
  ctx.lineWidth = 4.5;
  drawRoundedRect(ctx, 112, 260, TEX_WIDTH - 224, 640, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COLORS.leatherNavy;
  ctx.fillRect(112, 260, TEX_WIDTH - 224, 88);

  ctx.fillStyle = COLORS.foilGoldHighlight;
  ctx.font = '700 32px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('REPÚBLICA DOMINICANA • RESIDENCIA', TEX_WIDTH / 2, 316);

  ctx.textAlign = 'left';
  const visaRows: ReadonlyArray<readonly [string, string]> = [
    [t.textures.sdqCityLabel, 'SANTO DOMINGO (SDQ)'],
    [t.textures.sdqClassLabel, t.textures.sdqClassValue],
    [`${t.passportTitle} / PASSPORT`, PASSPORT_ID],
    ['STATUS', t.textures.sdqStatusValue],
  ];

  let y = 414;
  for (const [label, value] of visaRows) {
    ctx.fillStyle = COLORS.inkMuted;
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.fillText(label, 156, y);

    ctx.fillStyle = COLORS.inkPrimary;
    ctx.font = '700 30px "Courier New", monospace';
    ctx.fillText(value, 156, y + 38);
    y += 114;
  }
  ctx.restore();

  if (sdqStamp) {
    ctx.save();
    ctx.translate(TEX_WIDTH * 0.56, TEX_HEIGHT * 0.67);
    ctx.rotate(0.08);
    ctx.globalAlpha = 0.85;
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(sdqStamp, -270, -270, 540, 540);
    ctx.restore();
  }

  return toTexture(canvas, true);
}

export async function createPassportTextures(language: Language): Promise<PassportTextures> {
  const [coatImg, flagImg, sdqStamp, profileImg, antiguaImg] = await Promise.all([
    loadImage(assetUrl('assets/coat-of-arms.svg')),
    loadImage(assetUrl('assets/flag.svg')),
    loadImage(assetUrl('assets/stamp-sdq.svg')),
    loadImage(assetUrl('assets/profile-photo.jpg')),
    loadImage(assetUrl('assets/antigua-photo.jpg')),
  ]);

  const { coverFront, coverMetalness, coverRoughness, coverNormal, coverClearcoat } =
    buildCoverTextures(coatImg, language);

  const sigBaseCanvas = buildSignaturePageBase(flagImg, coatImg, profileImg, language);
  const [sigLiveCanvas, sigLiveCtx] = createCanvas();
  sigLiveCtx.drawImage(sigBaseCanvas, 0, 0);
  const coverInner = toTexture(sigLiveCanvas, true);

  const setDualSignatures = async (sigs: DualSignatures): Promise<void> => {
    sigLiveCtx.clearRect(0, 0, TEX_WIDTH, TEX_HEIGHT);
    sigLiveCtx.drawImage(sigBaseCanvas, 0, 0);

    if (sigs.marcos) {
      const mImg = await loadImage(sigs.marcos);
      if (mImg) {
        sigLiveCtx.save();
        sigLiveCtx.globalCompositeOperation = 'multiply';
        sigLiveCtx.drawImage(mImg, 430, 185, 680, 175);
        sigLiveCtx.restore();
      }
    }

    if (sigs.allison) {
      const aImg = await loadImage(sigs.allison);
      if (aImg) {
        sigLiveCtx.save();
        sigLiveCtx.globalCompositeOperation = 'multiply';
        sigLiveCtx.drawImage(aImg, 430, 475, 680, 175);
        sigLiveCtx.restore();
      }
    }

    coverInner.needsUpdate = true;
  };

  return {
    coverFront,
    coverMetalness,
    coverRoughness,
    coverNormal,
    coverClearcoat,
    coverInner,
    paperNormal: buildPaperNormalTexture(),
    pageAlphaRecto: buildPageAlphaMask(true),
    pageAlphaVerso: buildPageAlphaMask(false),
    page1Recto: buildRealBiodataPage(flagImg, coatImg, profileImg, language),
    page1Verso: buildPage1Verso(flagImg, coatImg, antiguaImg, language),
    page2Recto: buildPage2Recto(flagImg, coatImg),
    page2Verso: buildPage2Verso(flagImg, coatImg, language),
    page3Recto: buildPage3Recto(flagImg, coatImg, sdqStamp, language),
    setDualSignatures,
  };
}

export function disposePassportTextures(textures: PassportTextures): void {
  textures.coverFront.dispose();
  textures.coverMetalness.dispose();
  textures.coverRoughness.dispose();
  textures.coverNormal.dispose();
  textures.coverClearcoat.dispose();
  textures.coverInner.dispose();
  textures.paperNormal.dispose();
  textures.pageAlphaRecto.dispose();
  textures.pageAlphaVerso.dispose();
  textures.page1Recto.dispose();
  textures.page1Verso.dispose();
  textures.page2Recto.dispose();
  textures.page2Verso.dispose();
  textures.page3Recto.dispose();
}
