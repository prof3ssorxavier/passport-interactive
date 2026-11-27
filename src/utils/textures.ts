import * as THREE from 'three';
import { COLORS, COUNTRY_NAME, ISSUE_DATE, PASSPORT_ID } from '@/constants/tokens';
import type { PassportTextures } from '@/types/passport';

const TEX_WIDTH = 1024;
const TEX_HEIGHT = 1455; // Matches ISO ID-3 ratio (2.2 / 3.125 = 0.704)

function createCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_WIDTH;
  canvas.height = TEX_HEIGHT;
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

function loadSvgImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function drawLeatherGrain(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = COLORS.leatherNavy;
  ctx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);

  // Subtle stitched vignette
  const vignette = ctx.createRadialGradient(
    TEX_WIDTH * 0.5,
    TEX_HEIGHT * 0.45,
    TEX_WIDTH * 0.15,
    TEX_WIDTH * 0.5,
    TEX_HEIGHT * 0.5,
    TEX_HEIGHT * 0.75,
  );
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0.03)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);

  // Deterministic subtle leather pebble grain
  let seed = 42069;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let i = 0; i < 6500; i += 1) {
    const x = rand() * TEX_WIDTH;
    const y = rand() * TEX_HEIGHT;
    const r = 0.8 + rand() * 1.6;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.028)' : 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBiometricChip(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  const w = 86;
  const h = 52;
  ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy);
  ctx.lineTo(cx - 14, cy);
  ctx.moveTo(cx + 14, cy);
  ctx.lineTo(cx + w / 2, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSecurityPaperBase(ctx: CanvasRenderingContext2D, pageNumber: string): void {
  ctx.fillStyle = COLORS.paperCream;
  ctx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);

  // Subtle paper warmth gradient near spine
  const spineGrad = ctx.createLinearGradient(0, 0, 140, 0);
  spineGrad.addColorStop(0, 'rgba(16, 42, 76, 0.08)');
  spineGrad.addColorStop(1, 'rgba(16, 42, 76, 0)');
  ctx.fillStyle = spineGrad;
  ctx.fillRect(0, 0, 140, TEX_HEIGHT);

  // Guilloché security border
  ctx.save();
  ctx.strokeStyle = 'rgba(232, 111, 44, 0.16)';
  ctx.lineWidth = 2;
  ctx.strokeRect(46, 46, TEX_WIDTH - 92, TEX_HEIGHT - 92);

  ctx.strokeStyle = 'rgba(16, 42, 76, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(58, 58, TEX_WIDTH - 116, TEX_HEIGHT - 116);

  // Subtle wave guilloché bands across background
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.13)';
  ctx.lineWidth = 1.2;
  for (let row = 0; row < 14; row += 1) {
    const baseY = 160 + row * 88;
    ctx.beginPath();
    for (let x = 70; x <= TEX_WIDTH - 70; x += 12) {
      const y = baseY + Math.sin(x * 0.02 + row * 0.8) * 10;
      if (x === 70) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Micro-footer with passport ID & page number
  ctx.fillStyle = COLORS.inkMuted;
  ctx.font = '600 20px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(PASSPORT_ID, 78, TEX_HEIGHT - 74);
  ctx.textAlign = 'right';
  ctx.fillText(pageNumber, TEX_WIDTH - 78, TEX_HEIGHT - 74);
}

function buildCoverTextures(coatImg: HTMLImageElement | null): {
  coverFront: THREE.CanvasTexture;
  coverMetalness: THREE.CanvasTexture;
} {
  const [canvas, ctx] = createCanvas();
  const [metalCanvas, metalCtx] = createCanvas();

  drawLeatherGrain(ctx);

  // Base low metalness for leather
  metalCtx.fillStyle = '#141414';
  metalCtx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);

  const drawFoilLayer = (target: CanvasRenderingContext2D, color: string, isMetalMask: boolean) => {
    target.save();
    target.strokeStyle = color;
    target.fillStyle = color;

    // Double gold border frame
    target.lineWidth = 5;
    target.strokeRect(54, 54, TEX_WIDTH - 108, TEX_HEIGHT - 108);
    target.lineWidth = 2;
    target.strokeRect(68, 68, TEX_WIDTH - 136, TEX_HEIGHT - 136);

    // Top country inscription
    target.textAlign = 'center';
    target.font = '700 44px Georgia, "Times New Roman", serif';
    target.fillText('REPÚBLICA DAS', TEX_WIDTH / 2, 200);
    target.font = '700 54px Georgia, "Times New Roman", serif';
    target.fillText('TANGERINAS', TEX_WIDTH / 2, 268);

    // Decorative gold divider
    target.lineWidth = 2.5;
    target.beginPath();
    target.moveTo(TEX_WIDTH * 0.25, 310);
    target.lineTo(TEX_WIDTH * 0.75, 310);
    target.stroke();

    // Coat of arms emblem
    if (coatImg && !isMetalMask) {
      target.drawImage(coatImg, TEX_WIDTH / 2 - 240, 355, 480, 528);
    } else if (isMetalMask) {
      // Bright metallic region over coat of arms
      target.fillStyle = '#d8d8d8';
      target.beginPath();
      target.arc(TEX_WIDTH / 2, 620, 230, 0, Math.PI * 2);
      target.fill();
      target.fillStyle = color;
    }

    // Bottom title & ID
    target.font = '700 52px Georgia, "Times New Roman", serif';
    target.fillText('PASSAPORTE', TEX_WIDTH / 2, 1020);

    target.font = '600 28px "Courier New", monospace';
    target.fillText(PASSPORT_ID, TEX_WIDTH / 2, 1084);

    drawBiometricChip(target, TEX_WIDTH / 2, 1215, color);
    target.restore();
  };

  drawFoilLayer(ctx, COLORS.foilGold, false);
  drawFoilLayer(metalCtx, '#e2e2e2', true);

  return {
    coverFront: toTexture(canvas, true),
    coverMetalness: toTexture(metalCanvas, false),
  };
}

function buildCoverInnerTexture(coatImg: HTMLImageElement | null): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas();
  ctx.fillStyle = COLORS.leatherNavy;
  ctx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);

  // Fine gold guilloché endpaper pattern
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.16)';
  ctx.lineWidth = 1.5;
  for (let i = -TEX_HEIGHT; i < TEX_WIDTH + TEX_HEIGHT; i += 44) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + TEX_HEIGHT, TEX_HEIGHT);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i + TEX_HEIGHT, 0);
    ctx.lineTo(i, TEX_HEIGHT);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(56, 56, TEX_WIDTH - 112, TEX_HEIGHT - 112);

  if (coatImg) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.drawImage(coatImg, TEX_WIDTH / 2 - 190, TEX_HEIGHT / 2 - 210, 380, 418);
    ctx.restore();
  }

  ctx.fillStyle = 'rgba(212, 175, 55, 0.75)';
  ctx.textAlign = 'center';
  ctx.font = '600 24px Georgia, serif';
  ctx.fillText(COUNTRY_NAME, TEX_WIDTH / 2, 160);
  ctx.font = '500 20px "Courier New", monospace';
  ctx.fillText(`DOCUMENTO OFICIAL • ${PASSPORT_ID}`, TEX_WIDTH / 2, TEX_HEIGHT - 120);

  return toTexture(canvas, true);
}

function buildPage1Recto(flagImg: HTMLImageElement | null): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas();
  drawSecurityPaperBase(ctx, '01');

  // Header bar
  ctx.fillStyle = COLORS.leatherNavy;
  ctx.font = '700 32px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(COUNTRY_NAME, 86, 134);

  ctx.fillStyle = COLORS.tangerine;
  ctx.fillRect(86, 152, TEX_WIDTH - 172, 5);

  if (flagImg) {
    ctx.drawImage(flagImg, TEX_WIDTH - 246, 86, 160, 106);
  }

  // Portrait frame
  ctx.save();
  ctx.fillStyle = 'rgba(16, 42, 76, 0.06)';
  ctx.strokeStyle = COLORS.leatherNavy;
  ctx.lineWidth = 3;
  ctx.fillRect(86, 214, 280, 360);
  ctx.strokeRect(86, 214, 280, 360);

  // Minimalist holder silhouette
  ctx.fillStyle = 'rgba(16, 42, 76, 0.25)';
  ctx.beginPath();
  ctx.arc(226, 336, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(226, 500, 96, 84, 0, Math.PI, 0, false);
  ctx.fill();
  ctx.restore();

  // Biographical data fields
  const fields: ReadonlyArray<readonly [string, string]> = [
    ['TIPO / TYPE', 'P'],
    ['CÓDIGO / CODE', 'TNG'],
    ['PASSAPORTE Nº / PASSPORT NO.', PASSPORT_ID],
    ['NACIONALIDADE / NATIONALITY', 'TANGERINENSE'],
    ['DATA DE EMISSÃO / DATE OF ISSUE', ISSUE_DATE],
    ['AUTORIDADE / AUTHORITY', 'MIN. DAS TANGERINAS'],
  ];

  let fieldY = 242;
  for (const [label, value] of fields) {
    ctx.fillStyle = COLORS.inkMuted;
    ctx.font = '600 17px system-ui, sans-serif';
    ctx.fillText(label, 408, fieldY);

    ctx.fillStyle = COLORS.inkPrimary;
    ctx.font = '700 28px "Courier New", monospace';
    ctx.fillText(value, 408, fieldY + 34);

    fieldY += 78;
  }

  // Dedicated Touch Signature Zone (Sprint 2 signature_pad target)
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.strokeStyle = COLORS.tangerine;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([10, 6]);
  ctx.fillRect(86, 756, TEX_WIDTH - 172, 240);
  ctx.strokeRect(86, 756, TEX_WIDTH - 172, 240);
  ctx.setLineDash([]);

  ctx.fillStyle = COLORS.inkMuted;
  ctx.font = '600 18px system-ui, sans-serif';
  ctx.fillText('ASSINATURA DO TITULAR / HOLDER SIGNATURE', 110, 792);

  ctx.strokeStyle = 'rgba(16, 42, 76, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(116, 944);
  ctx.lineTo(TEX_WIDTH - 116, 944);
  ctx.stroke();

  ctx.fillStyle = 'rgba(232, 111, 44, 0.72)';
  ctx.font = 'italic 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Área interativa de assinatura (Touch Isolation pronta)', TEX_WIDTH / 2, 888);
  ctx.restore();

  // Machine Readable Zone (MRZ)
  ctx.save();
  ctx.fillStyle = 'rgba(16, 42, 76, 0.05)';
  ctx.fillRect(72, 1110, TEX_WIDTH - 144, 170);

  ctx.fillStyle = COLORS.inkPrimary;
  ctx.font = '700 26px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('P<TNGTANGERINAS<<CITIZEN<<<<<<<<<<<<<<<<<<<<', 92, 1178);
  ctx.fillText(`${PASSPORT_ID}<8TNG2608064M3608069<<<<<<<<<<<<04`, 92, 1234);
  ctx.restore();

  return toTexture(canvas, true);
}

function buildPage1Verso(coatImg: HTMLImageElement | null): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas();
  drawSecurityPaperBase(ctx, '02');

  ctx.fillStyle = COLORS.leatherNavy;
  ctx.font = '700 28px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('VISTOS / VISAS', TEX_WIDTH / 2, 130);

  ctx.fillStyle = COLORS.tangerine;
  ctx.fillRect(TEX_WIDTH / 2 - 140, 148, 280, 3);

  if (coatImg) {
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.drawImage(coatImg, TEX_WIDTH / 2 - 210, TEX_HEIGHT / 2 - 230, 420, 462);
    ctx.restore();
  }

  ctx.fillStyle = COLORS.inkMuted;
  ctx.font = '500 22px Georgia, serif';
  ctx.fillText('Esta página é reservada para vistos oficiais.', TEX_WIDTH / 2, TEX_HEIGHT - 180);

  return toTexture(canvas, true);
}

function buildPage2Recto(guatemalaStamp: HTMLImageElement | null): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas();
  drawSecurityPaperBase(ctx, '03');

  ctx.fillStyle = COLORS.leatherNavy;
  ctx.font = '700 28px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('VISTOS / VISAS — AMÉRICA CENTRAL', TEX_WIDTH / 2, 130);

  ctx.fillStyle = COLORS.tangerine;
  ctx.fillRect(TEX_WIDTH / 2 - 190, 148, 380, 3);

  // Subtle entry record metadata
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.inkMuted;
  ctx.font = '600 18px "Courier New", monospace';
  ctx.fillText('REGISTRO DE ENTRADA • OUTUBRO 2026', 100, 236);
  ctx.fillText('PORTO: AEROPORTO INTERNACIONAL LA AURORA (GUA)', 100, 268);

  if (guatemalaStamp) {
    ctx.save();
    ctx.translate(TEX_WIDTH * 0.52, TEX_HEIGHT * 0.48);
    ctx.rotate(-0.11);
    ctx.globalAlpha = 0.9;
    ctx.drawImage(guatemalaStamp, -310, -200, 620, 400);
    ctx.restore();
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.stampGuatemala;
  ctx.font = '700 22px "Courier New", monospace';
  ctx.fillText('VALIDADO • PERMANÊNCIA AUTORIZADA', TEX_WIDTH / 2, 1140);

  return toTexture(canvas, true);
}

function buildPage2Verso(flagImg: HTMLImageElement | null): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas();
  drawSecurityPaperBase(ctx, '04');

  ctx.fillStyle = COLORS.leatherNavy;
  ctx.font = '700 28px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('OBSERVAÇÕES / ENDORSEMENTS', TEX_WIDTH / 2, 130);

  ctx.fillStyle = COLORS.tangerine;
  ctx.fillRect(TEX_WIDTH / 2 - 170, 148, 340, 3);

  if (flagImg) {
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.drawImage(flagImg, TEX_WIDTH / 2 - 180, 260, 360, 240);
    ctx.restore();
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.inkPrimary;
  ctx.font = '600 22px Georgia, serif';
  ctx.fillText('Notas Diplomáticas:', 106, 630);

  ctx.fillStyle = COLORS.inkMuted;
  ctx.font = '500 20px "Courier New", monospace';
  ctx.fillText(`• Passaporte biométrico nº ${PASSPORT_ID}`, 106, 690);
  ctx.fillText('• Válido para todas as fronteiras amigas', 106, 736);
  ctx.fillText('• Emissão comemorativa: 06.08.2026', 106, 782);

  return toTexture(canvas, true);
}

function buildPage3Recto(sdqStamp: HTMLImageElement | null): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas();
  drawSecurityPaperBase(ctx, '05');

  ctx.fillStyle = COLORS.leatherNavy;
  ctx.font = '700 28px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('VISTO DE RESIDÊNCIA — SANTO DOMINGO', TEX_WIDTH / 2, 130);

  ctx.fillStyle = COLORS.tangerine;
  ctx.fillRect(TEX_WIDTH / 2 - 220, 148, 440, 3);

  // Official Visa Sticker Card
  ctx.save();
  ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
  ctx.strokeStyle = COLORS.foilGold;
  ctx.lineWidth = 4;
  ctx.fillRect(96, 224, TEX_WIDTH - 192, 540);
  ctx.strokeRect(96, 224, TEX_WIDTH - 192, 540);

  ctx.fillStyle = COLORS.leatherNavy;
  ctx.fillRect(96, 224, TEX_WIDTH - 192, 76);

  ctx.fillStyle = COLORS.foilGoldHighlight;
  ctx.font = '700 26px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('REPÚBLICA DOMINICANA • RESIDENCIA', TEX_WIDTH / 2, 272);

  ctx.textAlign = 'left';
  const visaRows: ReadonlyArray<readonly [string, string]> = [
    ['CIDADE / CITY', 'SANTO DOMINGO (SDQ)'],
    ['CATEGORIA / CLASS', 'RESIDÊNCIA PERMANENTE'],
    ['PASSAPORTE / PASSPORT', PASSPORT_ID],
    ['STATUS', 'APROVADO • MÚLTIPLAS ENTRADAS'],
  ];

  let y = 358;
  for (const [label, value] of visaRows) {
    ctx.fillStyle = COLORS.inkMuted;
    ctx.font = '600 17px system-ui, sans-serif';
    ctx.fillText(label, 132, y);

    ctx.fillStyle = COLORS.inkPrimary;
    ctx.font = '700 24px "Courier New", monospace';
    ctx.fillText(value, 132, y + 32);
    y += 96;
  }
  ctx.restore();

  // Official circular SDQ seal overlapping bottom-right of visa sticker
  if (sdqStamp) {
    ctx.save();
    ctx.translate(TEX_WIDTH * 0.64, TEX_HEIGHT * 0.67);
    ctx.rotate(0.09);
    ctx.globalAlpha = 0.9;
    ctx.drawImage(sdqStamp, -230, -230, 460, 460);
    ctx.restore();
  }

  return toTexture(canvas, true);
}

export async function createPassportTextures(): Promise<PassportTextures> {
  const [coatImg, flagImg, guatemalaStamp, sdqStamp] = await Promise.all([
    loadSvgImage('/assets/coat-of-arms.svg'),
    loadSvgImage('/assets/flag.svg'),
    loadSvgImage('/assets/stamp-guatemala.svg'),
    loadSvgImage('/assets/stamp-sdq.svg'),
  ]);

  const { coverFront, coverMetalness } = buildCoverTextures(coatImg);

  return {
    coverFront,
    coverMetalness,
    coverInner: buildCoverInnerTexture(coatImg),
    page1Recto: buildPage1Recto(flagImg),
    page1Verso: buildPage1Verso(coatImg),
    page2Recto: buildPage2Recto(guatemalaStamp),
    page2Verso: buildPage2Verso(flagImg),
    page3Recto: buildPage3Recto(sdqStamp),
  };
}

export function disposePassportTextures(textures: PassportTextures): void {
  Object.values(textures).forEach((tex) => tex.dispose());
}
