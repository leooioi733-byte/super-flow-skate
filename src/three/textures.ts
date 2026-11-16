import * as THREE from 'three';
import { DeckGraphicId, GripTapeStyleId } from '../types/game';

export interface ProceduralTextureSet {
  concreteColor: THREE.CanvasTexture;
  concreteRoughness: THREE.CanvasTexture;
  concreteBump: THREE.CanvasTexture;
  rampConcreteColor: THREE.CanvasTexture;
  rampConcreteBump: THREE.CanvasTexture;
  rampConcreteRoughness: THREE.CanvasTexture;
  poolTileColor: THREE.CanvasTexture;
  griptapeColor: THREE.CanvasTexture;
  griptapeBump: THREE.CanvasTexture;
  griptapeVariants: Record<GripTapeStyleId, THREE.CanvasTexture>;
  shirtTexture: THREE.CanvasTexture;
  shirtBump: THREE.CanvasTexture;
  pantsTexture: THREE.CanvasTexture;
  pantsBump: THREE.CanvasTexture;
  shoeTexture: THREE.CanvasTexture;
  shoeBump: THREE.CanvasTexture;
  hatBump: THREE.CanvasTexture;
  skinTexture: THREE.CanvasTexture;
  metalScratchBump: THREE.CanvasTexture;
  paintWeatheredMask: THREE.CanvasTexture;
  canopyColor: THREE.CanvasTexture;
  canopyBump: THREE.CanvasTexture;
  wallColor: THREE.CanvasTexture;
  wallBump: THREE.CanvasTexture;
  woodColor: THREE.CanvasTexture;
  woodBump: THREE.CanvasTexture;
  grassColor: THREE.CanvasTexture;
  grassBump: THREE.CanvasTexture;
  barkColor: THREE.CanvasTexture;
  barkBump: THREE.CanvasTexture;
  leafColor: THREE.CanvasTexture;
  cityColor: THREE.CanvasTexture;
  umbrellaColor: THREE.CanvasTexture;
  bannerMain: THREE.CanvasTexture;
  bannerSecondary: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  skyGradient: THREE.CanvasTexture;
  sunGlow: THREE.CanvasTexture;
  woodDeckEdge: THREE.CanvasTexture;
  deckGraphics: Record<DeckGraphicId, THREE.CanvasTexture>;
  dispose: () => void;
}

function configureTexture(
  tex: THREE.CanvasTexture,
  anisotropy: number,
  isColor: boolean,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = anisotropy;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createConcreteTextures(anisotropy: number) {
  const size = 1024;
  const rand = mulberry32(104729);

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  cCtx.fillStyle = '#64696f';
  cCtx.fillRect(0, 0, size, size);

  // Mid-low base roughness with glossy troweled patches & rough weathered areas
  rCtx.fillStyle = '#9c9c9c';
  rCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Polished vs matte troweled patches so sunlight glints unevenly across slabs
  for (let i = 0; i < 240; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 35 + rand() * 135;
    const v = Math.floor(78 + rand() * 44);
    const grad = cCtx.createRadialGradient(x, y, 4, x, y, r);
    grad.addColorStop(0, `rgba(${v}, ${v + 2}, ${v + 4}, 0.2)`);
    grad.addColorStop(1, `rgba(${v}, ${v + 2}, ${v + 4}, 0)`);
    cCtx.fillStyle = grad;
    cCtx.beginPath();
    cCtx.arc(x, y, r, 0, Math.PI * 2);
    cCtx.fill();

    // High-contrast roughness clouds (glossy 55 vs matte 225)
    const rv = rand() > 0.45 ? Math.floor(48 + rand() * 48) : Math.floor(170 + rand() * 65);
    const rGrad = rCtx.createRadialGradient(x, y, 4, x, y, r);
    rGrad.addColorStop(0, `rgba(${rv}, ${rv}, ${rv}, 0.42)`);
    rGrad.addColorStop(1, `rgba(${rv}, ${rv}, ${rv}, 0)`);
    rCtx.fillStyle = rGrad;
    rCtx.beginPath();
    rCtx.arc(x, y, r, 0, Math.PI * 2);
    rCtx.fill();

    const bv = Math.floor(96 + rand() * 64);
    const bGrad = bCtx.createRadialGradient(x, y, 4, x, y, r);
    bGrad.addColorStop(0, `rgba(${bv}, ${bv}, ${bv}, 0.28)`);
    bGrad.addColorStop(1, `rgba(${bv}, ${bv}, ${bv}, 0)`);
    bCtx.fillStyle = bGrad;
    bCtx.beginPath();
    bCtx.arc(x, y, r, 0, Math.PI * 2);
    bCtx.fill();
  }

  // Brushed concrete broom micro-streaks
  for (let y = 0; y < size; y += 2) {
    const alpha = 0.03 + rand() * 0.045;
    const shade = rand() > 0.5 ? 172 : 86;
    cCtx.fillStyle = `rgba(${shade}, ${shade + 1}, ${shade + 2}, ${alpha})`;
    cCtx.fillRect(0, y, size, 1);

    const bShade = rand() > 0.5 ? 156 : 98;
    bCtx.fillStyle = `rgba(${bShade}, ${bShade}, ${bShade}, 0.22)`;
    bCtx.fillRect(0, y, size, 1);
  }

  // Rich multi-scale mineral aggregate grit & pitted concrete pores
  for (let i = 0; i < 36000; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const s = 0.9 + rand() * 2.4;
    const isLight = rand() > 0.46;
    const shade = isLight ? 174 + Math.floor(rand() * 28) : 64 + Math.floor(rand() * 28);
    cCtx.fillStyle = `rgba(${shade}, ${shade + 1}, ${shade + 2}, ${0.14 + rand() * 0.2})`;
    cCtx.fillRect(x, y, s, s);

    const bShade = isLight ? 196 : 62;
    bCtx.fillStyle = `rgba(${bShade}, ${bShade}, ${bShade}, 0.38)`;
    bCtx.fillRect(x, y, s, s);
  }

  // Hairline concrete stress cracks
  cCtx.strokeStyle = 'rgba(34, 38, 44, 0.38)';
  bCtx.strokeStyle = 'rgba(18, 18, 18, 0.85)';
  for (let c = 0; c < 18; c++) {
    let cx = rand() * size;
    let cy = rand() * size;
    cCtx.lineWidth = 0.9 + rand() * 1.3;
    bCtx.lineWidth = 1.6 + rand() * 1.4;
    cCtx.beginPath();
    bCtx.beginPath();
    cCtx.moveTo(cx, cy);
    bCtx.moveTo(cx, cy);
    const segs = 6 + Math.floor(rand() * 7);
    for (let s = 0; s < segs; s++) {
      cx += (rand() - 0.5) * 48;
      cy += (rand() - 0.5) * 48;
      cCtx.lineTo(cx, cy);
      bCtx.lineTo(cx, cy);
    }
    cCtx.stroke();
    bCtx.stroke();
  }

  // Urethane wheel skid arcs & glossy wax trails
  for (let i = 0; i < 28; i++) {
    cCtx.strokeStyle = `rgba(32, 36, 42, ${0.1 + rand() * 0.14})`;
    cCtx.lineWidth = 1.6 + rand() * 2.6;
    cCtx.beginPath();
    const sx = rand() * size;
    const sy = rand() * size;
    cCtx.moveTo(sx, sy);
    cCtx.quadraticCurveTo(
      sx + (rand() - 0.5) * 140,
      sy + (rand() - 0.5) * 140,
      sx + (rand() - 0.5) * 240,
      sy + (rand() - 0.5) * 240,
    );
    cCtx.stroke();
  }

  // Deep Slab Expansion Joints (4x4 slabs per tile)
  const joints = [0, size * 0.25, size * 0.5, size * 0.75];
  const drawJoint = (ctx: CanvasRenderingContext2D, color: string, lw: number, offset = 0) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    for (const pos of joints) {
      ctx.beginPath();
      ctx.moveTo(pos + offset, 0);
      ctx.lineTo(pos + offset, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, pos + offset);
      ctx.lineTo(size, pos + offset);
      ctx.stroke();
    }
  };

  drawJoint(cCtx, 'rgba(34, 38, 44, 0.85)', 5.5);
  drawJoint(cCtx, 'rgba(182, 188, 194, 0.42)', 1.8, 3.5);
  drawJoint(bCtx, 'rgba(10, 10, 10, 0.96)', 6);
  drawJoint(rCtx, 'rgba(250, 250, 250, 0.88)', 5.5);

  return {
    concreteColor: configureTexture(new THREE.CanvasTexture(colorCanvas), anisotropy, true, 9, 9),
    concreteRoughness: configureTexture(new THREE.CanvasTexture(roughCanvas), anisotropy, false, 9, 9),
    concreteBump: configureTexture(new THREE.CanvasTexture(bumpCanvas), anisotropy, false, 9, 9),
  };
}

function createRampConcreteTextures(anisotropy: number) {
  const size = 1024;
  const rand = mulberry32(44921);

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  ctx.fillStyle = '#7e858c';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#787878'; // Smoother troweled skate concrete that catches sun reflections!
  rCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 180; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 30 + rand() * 110;
    const v = Math.floor(108 + rand() * 34);
    const grad = ctx.createRadialGradient(x, y, 4, x, y, r);
    grad.addColorStop(0, `rgba(${v}, ${v + 1}, ${v + 3}, 0.2)`);
    grad.addColorStop(1, `rgba(${v}, ${v + 1}, ${v + 3}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    const rv = rand() > 0.4 ? Math.floor(42 + rand() * 44) : Math.floor(155 + rand() * 65);
    const rGrad = rCtx.createRadialGradient(x, y, 4, x, y, r);
    rGrad.addColorStop(0, `rgba(${rv}, ${rv}, ${rv}, 0.36)`);
    rGrad.addColorStop(1, `rgba(${rv}, ${rv}, ${rv}, 0)`);
    rCtx.fillStyle = rGrad;
    rCtx.beginPath();
    rCtx.arc(x, y, r, 0, Math.PI * 2);
    rCtx.fill();
  }

  for (let i = 0; i < 20000; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const s = 1 + rand() * 1.9;
    const shade = rand() > 0.5 ? 192 : 108;
    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade + 2}, 0.14)`;
    ctx.fillRect(x, y, s, s);

    const bShade = rand() > 0.5 ? 174 : 84;
    bCtx.fillStyle = `rgba(${bShade}, ${bShade}, ${bShade}, 0.28)`;
    bCtx.fillRect(x, y, s, s);
  }

  // Coping wax smears (glossy streaks!) & wheel rub arcs
  for (let i = 0; i < 50; i++) {
    ctx.strokeStyle = `rgba(30, 38, 48, ${0.11 + rand() * 0.13})`;
    ctx.lineWidth = 1.6 + rand() * 2.5;
    ctx.beginPath();
    const x = rand() * size;
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + (rand() - 0.5) * 45, 80 + rand() * 110, x + (rand() - 0.5) * 70, 140 + rand() * 180);
    ctx.stroke();

    // Waxed coping areas are smoother (darker in roughness map)
    rCtx.strokeStyle = 'rgba(35, 35, 35, 0.4)';
    rCtx.lineWidth = 4;
    rCtx.beginPath();
    rCtx.moveTo(x, 0);
    rCtx.lineTo(x + (rand() - 0.5) * 20, 60);
    rCtx.stroke();
  }

  ctx.strokeStyle = 'rgba(55, 60, 66, 0.45)';
  ctx.lineWidth = 3;
  bCtx.strokeStyle = 'rgba(24, 24, 24, 0.85)';
  bCtx.lineWidth = 3.5;
  for (const p of [size * 0.33, size * 0.66]) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    bCtx.beginPath();
    bCtx.moveTo(p, 0);
    bCtx.lineTo(p, size);
    bCtx.stroke();
  }

  return {
    rampConcreteColor: configureTexture(new THREE.CanvasTexture(colorCanvas), anisotropy, true, 2, 2),
    rampConcreteBump: configureTexture(new THREE.CanvasTexture(bumpCanvas), anisotropy, false, 2, 2),
    rampConcreteRoughness: configureTexture(new THREE.CanvasTexture(roughCanvas), anisotropy, false, 2, 2),
  };
}

function createPoolTileTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b4bdc4';
  ctx.fillRect(0, 0, size, size);

  const cols = 12;
  const rows = 4;
  const w = size / cols;
  const h = size / rows;
  const palette = ['#0b5d73', '#0f6f85', '#127c94', '#0c5468', '#156478', '#0d677d'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = palette[(r * 3 + c * 5) % palette.length];
      ctx.fillRect(c * w + 3, r * h + 3, w - 6, h - 6);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(c * w + 4, r * h + 4, w - 8, 6);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(c * w + 4, (r + 1) * h - 7, w - 8, 3);
    }
  }

  return configureTexture(new THREE.CanvasTexture(canvas), anisotropy, true, 6, 1);
}

function createGriptapeTextures(anisotropy: number) {
  const size = 256;
  const rand = mulberry32(99123);

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size * 2;
  const cCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size * 2;
  const bCtx = bumpCanvas.getContext('2d')!;

  cCtx.fillStyle = '#15181d';
  cCtx.fillRect(0, 0, size, size * 2);

  bCtx.fillStyle = '#606060';
  bCtx.fillRect(0, 0, size, size * 2);

  for (let i = 0; i < 22000; i++) {
    const x = rand() * size;
    const y = rand() * size * 2;
    const v = Math.floor(12 + rand() * 62);
    cCtx.fillStyle = `rgb(${v}, ${v + 2}, ${v + 4})`;
    cCtx.fillRect(x, y, 1.6, 1.6);

    const bv = Math.floor(40 + rand() * 215);
    bCtx.fillStyle = `rgb(${bv}, ${bv}, ${bv})`;
    bCtx.fillRect(x, y, 1.6, 1.6);
  }

  cCtx.fillStyle = '#1997b3';
  cCtx.fillRect(18, size * 2 - 94, size - 36, 10);

  return {
    griptapeColor: configureTexture(new THREE.CanvasTexture(colorCanvas), anisotropy, true),
    griptapeBump: configureTexture(new THREE.CanvasTexture(bumpCanvas), anisotropy, false),
  };
}

function createClothingTextures(anisotropy: number) {
  const size = 512;
  const rand = mulberry32(8831);

  // 1. Heavy Cotton Jersey T-Shirt (Color + Deep Interlock Knit Bump)
  const sColor = document.createElement('canvas');
  sColor.width = size;
  sColor.height = size;
  const scCtx = sColor.getContext('2d')!;

  const sBump = document.createElement('canvas');
  sBump.width = size;
  sBump.height = size;
  const sbCtx = sBump.getContext('2d')!;

  scCtx.fillStyle = '#ffffff';
  scCtx.fillRect(0, 0, size, size);
  sbCtx.fillStyle = '#808080';
  sbCtx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 3) {
    for (let x = 0; x < size; x += 3) {
      const n = (rand() - 0.5) * 22;
      const v = Math.floor(242 + n);
      scCtx.fillStyle = `rgb(${Math.min(255, v)}, ${Math.min(255, v)}, ${Math.min(255, v)})`;
      scCtx.fillRect(x, y, 2, 2);

      const bv = Math.floor((x + y) % 6 === 0 ? 185 + n : 78 + n);
      sbCtx.fillStyle = `rgb(${bv}, ${bv}, ${bv})`;
      sbCtx.fillRect(x, y, 2, 2);
    }
  }

  // Realistic draped chest & waist fabric folds in both color & bump
  for (let f = 0; f < 8; f++) {
    const fy = 120 + f * 44;
    const grad = scCtx.createLinearGradient(0, fy, 0, fy + 28);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.09)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    scCtx.fillStyle = grad;
    scCtx.fillRect(0, fy, size, 28);

    const bGrad = sbCtx.createLinearGradient(0, fy, 0, fy + 28);
    bGrad.addColorStop(0, 'rgba(128,128,128,0)');
    bGrad.addColorStop(0.5, 'rgba(55,55,55,0.45)');
    bGrad.addColorStop(1, 'rgba(128,128,128,0)');
    sbCtx.fillStyle = bGrad;
    sbCtx.fillRect(0, fy, size, 28);
  }

  scCtx.strokeStyle = 'rgba(0,0,0,0.22)';
  scCtx.setLineDash([5, 3]);
  scCtx.lineWidth = 2.5;
  scCtx.strokeRect(10, 10, size - 20, size - 20);
  scCtx.setLineDash([]);

  scCtx.fillStyle = 'rgba(10, 18, 28, 0.34)';
  scCtx.fillRect(146, 140, 220, 92);
  scCtx.strokeStyle = 'rgba(255, 255, 255, 0.94)';
  scCtx.lineWidth = 4;
  scCtx.strokeRect(146, 140, 220, 92);

  scCtx.fillStyle = '#ffffff';
  scCtx.font = '800 42px "Plus Jakarta Sans", sans-serif';
  scCtx.textAlign = 'center';
  scCtx.textBaseline = 'middle';
  scCtx.fillText('FLOW', size / 2, 174);
  scCtx.font = '700 18px "Plus Jakarta Sans", sans-serif';
  scCtx.fillText('SKATE TEAM', size / 2, 209);

  // 2. Heavy Skate Denim / Twill Pants (Color + Deep Diagonal Twill Bump)
  const pColor = document.createElement('canvas');
  pColor.width = size;
  pColor.height = size;
  const pcCtx = pColor.getContext('2d')!;

  const pBump = document.createElement('canvas');
  pBump.width = size;
  pBump.height = size;
  const pbCtx = pBump.getContext('2d')!;

  pcCtx.fillStyle = '#ffffff';
  pcCtx.fillRect(0, 0, size, size);
  pbCtx.fillStyle = '#808080';
  pbCtx.fillRect(0, 0, size, size);

  for (let i = -size; i < size * 2; i += 4) {
    pcCtx.strokeStyle = i % 8 === 0 ? 'rgba(0,0,0,0.095)' : 'rgba(255,255,255,0.06)';
    pcCtx.lineWidth = 2;
    pcCtx.beginPath();
    pcCtx.moveTo(i, 0);
    pcCtx.lineTo(i + size, size);
    pcCtx.stroke();

    pbCtx.strokeStyle = i % 8 === 0 ? 'rgba(205,205,205,0.9)' : 'rgba(62,62,62,0.9)';
    pbCtx.lineWidth = 2;
    pbCtx.beginPath();
    pbCtx.moveTo(i, 0);
    pbCtx.lineTo(i + size, size);
    pbCtx.stroke();
  }

  for (let i = 0; i < 11000; i++) {
    const x = rand() * size;
    const y = rand() * size;
    pcCtx.fillStyle = rand() > 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)';
    pcCtx.fillRect(x, y, 2, 2);
  }

  // Knee creases & hem folds
  for (const ky of [180, 210, 240, 390, 420]) {
    const grad = pcCtx.createLinearGradient(0, ky, 0, ky + 18);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.1)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    pcCtx.fillStyle = grad;
    pcCtx.fillRect(0, ky, size, 18);

    const bGrad = pbCtx.createLinearGradient(0, ky, 0, ky + 18);
    bGrad.addColorStop(0, 'rgba(128,128,128,0)');
    bGrad.addColorStop(0.5, 'rgba(42,42,42,0.6)');
    bGrad.addColorStop(1, 'rgba(128,128,128,0)');
    pbCtx.fillStyle = bGrad;
    pbCtx.fillRect(0, ky, size, 18);
  }

  pcCtx.strokeStyle = 'rgba(255, 225, 180, 0.45)';
  pcCtx.lineWidth = 3;
  pcCtx.setLineDash([7, 4]);
  for (const sx of [16, 250, 262, size - 16]) {
    pcCtx.beginPath();
    pcCtx.moveTo(sx, 0);
    pcCtx.lineTo(sx, size);
    pcCtx.stroke();
  }
  pcCtx.setLineDash([]);

  // 3. Suede Skate Shoe Texture + Bump
  const shColor = document.createElement('canvas');
  shColor.width = 256;
  shColor.height = 256;
  const shcCtx = shColor.getContext('2d')!;

  const shBump = document.createElement('canvas');
  shBump.width = 256;
  shBump.height = 256;
  const shbCtx = shBump.getContext('2d')!;

  shcCtx.fillStyle = '#ffffff';
  shcCtx.fillRect(0, 0, 256, 256);
  shbCtx.fillStyle = '#808080';
  shbCtx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 14000; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const v = 220 + Math.floor(rand() * 35);
    shcCtx.fillStyle = `rgb(${v},${v},${v})`;
    shcCtx.fillRect(x, y, 1.6, 1.6);

    const bv = 65 + Math.floor(rand() * 145);
    shbCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    shbCtx.fillRect(x, y, 1.6, 1.6);
  }

  shcCtx.strokeStyle = 'rgba(0,0,0,0.28)';
  shcCtx.setLineDash([4, 3]);
  shcCtx.lineWidth = 2.5;
  shcCtx.strokeRect(20, 24, 216, 208);
  shcCtx.setLineDash([]);

  // 4. Hat Knit / Twill Bump
  const hBump = document.createElement('canvas');
  hBump.width = 256;
  hBump.height = 256;
  const hbCtx = hBump.getContext('2d')!;
  hbCtx.fillStyle = '#808080';
  hbCtx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 6) {
    hbCtx.fillStyle = x % 12 === 0 ? '#c4c4c4' : '#444444';
    hbCtx.fillRect(x, 0, 3, 256);
  }
  for (let y = 0; y < 256; y += 4) {
    hbCtx.fillStyle = 'rgba(255,255,255,0.2)';
    hbCtx.fillRect(0, y, 256, 1.5);
  }

  // 5. Subtle Organic Skin Texture (natural micro warmth, avoids plastic look)
  const skColor = document.createElement('canvas');
  skColor.width = 256;
  skColor.height = 256;
  const skCtx = skColor.getContext('2d')!;
  skCtx.fillStyle = '#ffffff';
  skCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6000; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    skCtx.fillStyle = rand() > 0.5 ? 'rgba(220,165,130,0.08)' : 'rgba(255,235,220,0.08)';
    skCtx.fillRect(x, y, 2, 2);
  }

  return {
    shirtTexture: configureTexture(new THREE.CanvasTexture(sColor), anisotropy, true),
    shirtBump: configureTexture(new THREE.CanvasTexture(sBump), anisotropy, false),
    pantsTexture: configureTexture(new THREE.CanvasTexture(pColor), anisotropy, true),
    pantsBump: configureTexture(new THREE.CanvasTexture(pBump), anisotropy, false),
    shoeTexture: configureTexture(new THREE.CanvasTexture(shColor), anisotropy, true),
    shoeBump: configureTexture(new THREE.CanvasTexture(shBump), anisotropy, false),
    hatBump: configureTexture(new THREE.CanvasTexture(hBump), anisotropy, false, 2, 2),
    skinTexture: configureTexture(new THREE.CanvasTexture(skColor), anisotropy, true),
  };
}

function createEnvironmentTextures(anisotropy: number) {
  const rand = mulberry32(61907);

  // 1. Brushed Steel Grind Scratches Bump (for coping, rails, poles)
  const mBump = document.createElement('canvas');
  mBump.width = 512;
  mBump.height = 512;
  const mbCtx = mBump.getContext('2d')!;
  mbCtx.fillStyle = '#808080';
  mbCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 450; i++) {
    const y = rand() * 512;
    const bv = rand() > 0.5 ? 165 : 75;
    mbCtx.strokeStyle = `rgba(${bv},${bv},${bv},0.45)`;
    mbCtx.lineWidth = 1 + rand() * 1.5;
    mbCtx.beginPath();
    mbCtx.moveTo(0, y);
    mbCtx.lineTo(512, y + (rand() - 0.5) * 18);
    mbCtx.stroke();
  }

  // 2. Weathered Painted Lines Texture (subtle concrete show-through & tire scuffs)
  const pMask = document.createElement('canvas');
  pMask.width = 256;
  pMask.height = 256;
  const pmCtx = pMask.getContext('2d')!;
  pmCtx.fillStyle = '#ffffff';
  pmCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3200; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    pmCtx.fillStyle = `rgba(140, 145, 150, ${0.12 + rand() * 0.28})`;
    pmCtx.fillRect(x, y, 2, 3);
  }

  // 3. Corrugated / Ribbed Stadium Canopy Texture (Color + Bump)
  const canColor = document.createElement('canvas');
  canColor.width = 512;
  canColor.height = 512;
  const cancCtx = canColor.getContext('2d')!;
  const canBump = document.createElement('canvas');
  canBump.width = 512;
  canBump.height = 512;
  const canbCtx = canBump.getContext('2d')!;

  cancCtx.fillStyle = '#c4cbd2';
  cancCtx.fillRect(0, 0, 512, 512);
  canbCtx.fillStyle = '#808080';
  canbCtx.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 16) {
    cancCtx.fillStyle = x % 32 === 0 ? 'rgba(180,192,204,0.35)' : 'rgba(255,255,255,0.25)';
    cancCtx.fillRect(x, 0, 8, 512);
    canbCtx.fillStyle = x % 32 === 0 ? '#b8b8b8' : '#4a4a4a';
    canbCtx.fillRect(x, 0, 8, 512);
  }

  // 4. Architectural Concrete Retaining Wall (Color + Bump)
  const wColor = document.createElement('canvas');
  wColor.width = 512;
  wColor.height = 256;
  const wcCtx = wColor.getContext('2d')!;

  const wBump = document.createElement('canvas');
  wBump.width = 512;
  wBump.height = 256;
  const wbCtx = wBump.getContext('2d')!;

  wcCtx.fillStyle = '#1b2c3d';
  wcCtx.fillRect(0, 0, 512, 256);
  wbCtx.fillStyle = '#808080';
  wbCtx.fillRect(0, 0, 512, 256);

  for (let x = 0; x < 512; x += 128) {
    wcCtx.strokeStyle = 'rgba(6, 12, 18, 0.78)';
    wcCtx.lineWidth = 3.5;
    wcCtx.strokeRect(x, 0, 128, 256);

    wbCtx.strokeStyle = 'rgba(12, 12, 12, 0.92)';
    wbCtx.lineWidth = 4;
    wbCtx.strokeRect(x, 0, 128, 256);

    for (let s = 0; s < 7; s++) {
      const sx = x + 12 + rand() * 100;
      const grad = wcCtx.createLinearGradient(sx, 0, sx, 235);
      grad.addColorStop(0, 'rgba(6, 12, 18, 0.32)');
      grad.addColorStop(1, 'rgba(6, 12, 18, 0)');
      wcCtx.fillStyle = grad;
      wcCtx.fillRect(sx, 0, 4 + rand() * 8, 235);
    }

    for (const hx of [x + 28, x + 100]) {
      for (const hy of [64, 192]) {
        wcCtx.fillStyle = 'rgba(6, 10, 16, 0.8)';
        wcCtx.beginPath();
        wcCtx.arc(hx, hy, 4.5, 0, Math.PI * 2);
        wcCtx.fill();

        wbCtx.fillStyle = '#101010';
        wbCtx.beginPath();
        wbCtx.arc(hx, hy, 4.5, 0, Math.PI * 2);
        wbCtx.fill();
      }
    }
  }

  for (let i = 0; i < 9500; i++) {
    const x = rand() * 512;
    const y = rand() * 256;
    wcCtx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.07)';
    wcCtx.fillRect(x, y, 2, 2);

    const bv = rand() > 0.5 ? 168 : 88;
    wbCtx.fillStyle = `rgba(${bv},${bv},${bv},0.35)`;
    wbCtx.fillRect(x, y, 2, 2);
  }

  // 5. Cedar Wood Plank Bench (Color + Bump)
  const wdColor = document.createElement('canvas');
  wdColor.width = 512;
  wdColor.height = 256;
  const wdcCtx = wdColor.getContext('2d')!;

  const wdBump = document.createElement('canvas');
  wdBump.width = 512;
  wdBump.height = 256;
  const wdbCtx = wdBump.getContext('2d')!;

  wdcCtx.fillStyle = '#875b34';
  wdcCtx.fillRect(0, 0, 512, 256);
  wdbCtx.fillStyle = '#808080';
  wdbCtx.fillRect(0, 0, 512, 256);

  for (let y = 0; y < 256; y += 2) {
    const wave = Math.sin(y * 0.14) * 14;
    const tone = rand() > 0.5 ? 'rgba(55, 30, 12, 0.24)' : 'rgba(225, 180, 128, 0.15)';
    wdcCtx.fillStyle = tone;
    wdcCtx.fillRect(0, y, 512, 1.5);

    const bv = 105 + Math.floor(wave + rand() * 48);
    wdbCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    wdbCtx.fillRect(0, y, 512, 1.5);
  }
  for (const py of [64, 128, 192]) {
    wdcCtx.fillStyle = 'rgba(28, 14, 5, 0.8)';
    wdcCtx.fillRect(0, py - 2, 512, 4);
    wdbCtx.fillStyle = '#121212';
    wdbCtx.fillRect(0, py - 2, 512, 4);
  }

  // 6. Detailed Coastal Grass & Soil Turf (Color + Bump)
  const gColor = document.createElement('canvas');
  gColor.width = 512;
  gColor.height = 512;
  const gcCtx = gColor.getContext('2d')!;

  const gBump = document.createElement('canvas');
  gBump.width = 512;
  gBump.height = 512;
  const gbCtx = gBump.getContext('2d')!;

  gcCtx.fillStyle = '#405237';
  gcCtx.fillRect(0, 0, 512, 512);
  gbCtx.fillStyle = '#808080';
  gbCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 110; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 20 + rand() * 68;
    const grad = gcCtx.createRadialGradient(x, y, 2, x, y, r);
    grad.addColorStop(0, rand() > 0.35 ? 'rgba(62, 82, 50, 0.34)' : 'rgba(116, 108, 76, 0.28)');
    grad.addColorStop(1, 'rgba(62, 82, 50, 0)');
    gcCtx.fillStyle = grad;
    gcCtx.beginPath();
    gcCtx.arc(x, y, r, 0, Math.PI * 2);
    gcCtx.fill();
  }

  for (let i = 0; i < 24000; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    gcCtx.fillStyle = rand() > 0.45 ? 'rgba(122, 142, 94, 0.3)' : 'rgba(46, 58, 36, 0.32)';
    gcCtx.fillRect(x, y, 2, 3);

    const bv = rand() > 0.5 ? 185 : 70;
    gbCtx.fillStyle = `rgba(${bv},${bv},${bv},0.42)`;
    gbCtx.fillRect(x, y, 2, 3);
  }

  // 7. Palm Bark (Ringed Trunk Texture + Bump)
  const bColor = document.createElement('canvas');
  bColor.width = 256;
  bColor.height = 256;
  const bcCtx = bColor.getContext('2d')!;

  const bBump = document.createElement('canvas');
  bBump.width = 256;
  bBump.height = 256;
  const bbCtx = bBump.getContext('2d')!;

  bcCtx.fillStyle = '#755b45';
  bcCtx.fillRect(0, 0, 256, 256);
  bbCtx.fillStyle = '#808080';
  bbCtx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 22) {
    bcCtx.fillStyle = 'rgba(40, 28, 18, 0.65)';
    bcCtx.fillRect(0, y, 256, 5);
    bcCtx.fillStyle = 'rgba(154, 128, 98, 0.42)';
    bcCtx.fillRect(0, y + 5, 256, 4);

    bbCtx.fillStyle = '#202020';
    bbCtx.fillRect(0, y, 256, 5);
    bbCtx.fillStyle = '#d8d8d8';
    bbCtx.fillRect(0, y + 5, 256, 4);
  }
  for (let i = 0; i < 4200; i++) {
    bcCtx.fillStyle = 'rgba(34, 22, 14, 0.25)';
    bcCtx.fillRect(rand() * 256, rand() * 256, 1.5, 6);
  }

  // 8. Palm Leaf Veins
  const lColor = document.createElement('canvas');
  lColor.width = 256;
  lColor.height = 256;
  const lcCtx = lColor.getContext('2d')!;
  lcCtx.fillStyle = '#2f5734';
  lcCtx.fillRect(0, 0, 256, 256);
  lcCtx.strokeStyle = '#46764a';
  lcCtx.lineWidth = 3.5;
  for (let y = 0; y < 256; y += 10) {
    lcCtx.beginPath();
    lcCtx.moveTo(128, y);
    lcCtx.lineTo(0, y - 16);
    lcCtx.moveTo(128, y);
    lcCtx.lineTo(256, y - 16);
    lcCtx.stroke();
  }

  // 9. Distant City Building Architectural Facade
  const cColor = document.createElement('canvas');
  cColor.width = 256;
  cColor.height = 256;
  const ccCtx = cColor.getContext('2d')!;
  ccCtx.fillStyle = '#525c68';
  ccCtx.fillRect(0, 0, 256, 256);
  for (let y = 14; y < 246; y += 26) {
    for (let x = 14; x < 246; x += 28) {
      ccCtx.fillStyle = rand() > 0.25 ? '#354250' : '#7c94a8';
      ccCtx.fillRect(x, y, 16, 16);
    }
  }

  // 10. Teal & White Striped Umbrella Canvas
  const uColor = document.createElement('canvas');
  uColor.width = 512;
  uColor.height = 256;
  const ucCtx = uColor.getContext('2d')!;
  const stripes = 8;
  const sw = 512 / stripes;
  for (let i = 0; i < stripes; i++) {
    ucCtx.fillStyle = i % 2 === 0 ? '#147b94' : '#cfd6de';
    ucCtx.fillRect(i * sw, 0, sw + 1, 256);
    ucCtx.fillStyle = 'rgba(0,0,0,0.16)';
    ucCtx.fillRect(i * sw, 0, 2, 256);
  }
  for (let y = 0; y < 256; y += 3) {
    ucCtx.fillStyle = 'rgba(0,0,0,0.06)';
    ucCtx.fillRect(0, y, 512, 1);
  }

  return {
    metalScratchBump: configureTexture(new THREE.CanvasTexture(mBump), anisotropy, false, 2, 2),
    paintWeatheredMask: configureTexture(new THREE.CanvasTexture(pMask), anisotropy, true, 1, 4),
    canopyColor: configureTexture(new THREE.CanvasTexture(canColor), anisotropy, true, 6, 2),
    canopyBump: configureTexture(new THREE.CanvasTexture(canBump), anisotropy, false, 6, 2),
    wallColor: configureTexture(new THREE.CanvasTexture(wColor), anisotropy, true, 6, 1),
    wallBump: configureTexture(new THREE.CanvasTexture(wBump), anisotropy, false, 6, 1),
    woodColor: configureTexture(new THREE.CanvasTexture(wdColor), anisotropy, true, 1, 1),
    woodBump: configureTexture(new THREE.CanvasTexture(wdBump), anisotropy, false, 1, 1),
    grassColor: configureTexture(new THREE.CanvasTexture(gColor), anisotropy, true, 24, 24),
    grassBump: configureTexture(new THREE.CanvasTexture(gBump), anisotropy, false, 24, 24),
    barkColor: configureTexture(new THREE.CanvasTexture(bColor), anisotropy, true, 1, 1),
    barkBump: configureTexture(new THREE.CanvasTexture(bBump), anisotropy, false, 1, 1),
    leafColor: configureTexture(new THREE.CanvasTexture(lColor), anisotropy, true, 1, 2),
    cityColor: configureTexture(new THREE.CanvasTexture(cColor), anisotropy, true, 2, 3),
    umbrellaColor: configureTexture(new THREE.CanvasTexture(uColor), anisotropy, true, 1, 1),
  };
}

function createDeckGraphic(id: DeckGraphicId, anisotropy: number): THREE.CanvasTexture {
  const w = 256;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = id === 'natural_maple' ? '#d7ad79' : '#0f1b29';
  ctx.fillRect(0, 0, w, h);

  if (id === 'flow_wave') {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0c2335');
    grad.addColorStop(0.5, '#137996');
    grad.addColorStop(1, '#25c2dc');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, 180);
    ctx.lineTo(w, 105);
    ctx.lineTo(w, 150);
    ctx.lineTo(0, 225);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, 235);
    ctx.lineTo(w, 160);
    ctx.lineTo(w, 184);
    ctx.lineTo(0, 259);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.translate(w / 2, h / 2 + 40);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 44px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FLOW', 0, -14);
    ctx.fillStyle = '#a5f3fc';
    ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('SKATE TEAM', 0, 22);
    ctx.restore();
  } else if (id === 'costa_azul') {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.45, '#f97316');
    grad.addColorStop(0.46, '#0e7490');
    grad.addColorStop(1, '#082f49');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(w / 2, 165, 58, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COSTA', w / 2, 330);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('AZUL', w / 2, 362);
  } else if (id === 'street_stripes') {
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, w, h);

    const colors = ['#06b6d4', '#f43f5e', '#facc15', '#ffffff'];
    colors.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.fillRect(36 + i * 48, 0, 34, h);
    });

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(28, h / 2 - 42, w - 56, 84);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(28, h / 2 - 42, w - 56, 84);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 32px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FLOW', w / 2, h / 2);
  } else if (id === 'night_neon') {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#090d1a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#082f49');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(28, 70);
    ctx.lineTo(w - 28, h * 0.42);
    ctx.lineTo(42, h * 0.65);
    ctx.lineTo(w - 30, h - 70);
    ctx.stroke();

    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 44, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NIGHT', w / 2, h / 2 - 4);
    ctx.fillStyle = '#a5f3fc';
    ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('SESSION PRO', w / 2, h / 2 + 18);
  } else if (id === 'world_gold') {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#111827');
    grad.addColorStop(0.5, '#1f2937');
    grad.addColorStop(1, '#090d14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 8;
    ctx.strokeRect(22, 24, w - 44, h - 48);

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 - 12, 52, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WORLD', w / 2, h / 2 - 16);
    ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CHAMPION', w / 2, h / 2 + 6);
  } else if (id === 'tokyo_ink') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(w / 2, 165, 62, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(28, 260 + i * 32, w - 56, 12);
    }
    ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TOKYO INK', w / 2, 470);
  } else if (id === 'brazil_tropics') {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#15803d');
    grad.addColorStop(0.5, '#0ea5e9');
    grad.addColorStop(1, '#064e3b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(w / 2, 110);
    ctx.lineTo(w - 28, h / 2);
    ctx.lineTo(w / 2, h - 110);
    ctx.lineTo(28, h / 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 44, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 21px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BRASIL PRO', w / 2, h / 2 + 5);
  } else {
    const rand = mulberry32(7312);
    for (let x = 0; x < w; x += 3) {
      const alpha = 0.04 + rand() * 0.08;
      ctx.fillStyle = `rgba(120, 72, 28, ${alpha})`;
      ctx.fillRect(x, 0, 2, h);
    }
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22d3ee';
    ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FLOW', w / 2, h / 2 - 8);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('7-PLY MAPLE', w / 2, h / 2 + 18);
  }

  ctx.strokeStyle = 'rgba(218, 178, 130, 0.75)';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, w - 8, h - 8);

  return configureTexture(new THREE.CanvasTexture(canvas), anisotropy, true);
}

function createGripVariantTexture(style: GripTapeStyleId, anisotropy: number): THREE.CanvasTexture {
  const w = 256;
  const h = 512;
  const rand = mulberry32(style === 'checkered' ? 401 : style === 'cyan_stripe' ? 402 : 403);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  if (style === 'clear_wood') {
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#c89b62');
    grad.addColorStop(0.5, '#d6ad74');
    grad.addColorStop(1, '#ba8c52');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 4) {
      ctx.fillStyle = `rgba(92, 56, 22, ${0.06 + rand() * 0.08})`;
      ctx.fillRect(x, 0, 2, h);
    }
    ctx.fillStyle = 'rgba(20, 24, 30, 0.14)';
    ctx.fillRect(0, 190, w, 130);
  } else if (style === 'checkered') {
    const cell = 32;
    for (let y = 0; y < h; y += cell) {
      for (let x = 0; x < w; x += cell) {
        const dark = ((x / cell) + (y / cell)) % 2 === 0;
        ctx.fillStyle = dark ? '#181a1f' : '#e2e8f0';
        ctx.fillRect(x, y, cell, cell);
      }
    }
  } else {
    ctx.fillStyle = style === 'pro_red' ? '#241418' : '#181a1e';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) {
      const gx = rand() * w;
      const gy = rand() * h;
      const v = Math.floor(20 + rand() * 32);
      ctx.fillStyle = `rgba(${v},${v},${v},0.45)`;
      ctx.fillRect(gx, gy, 2, 2);
    }
    if (style === 'cyan_stripe') {
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(0, h * 0.66, w, 26);
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(0, h * 0.66 + 32, w, 10);
    } else if (style === 'pro_red') {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(0, h * 0.24, w, 24);
    }
  }

  return configureTexture(new THREE.CanvasTexture(canvas), anisotropy, true);
}

function createWoodEdgeTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const plies = ['#d8b07a', '#b8834b', '#1997b3', '#d8b07a', '#b8834b', '#141c26', '#d8b07a'];
  const h = 64 / plies.length;
  plies.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.fillRect(0, i * h, 64, h + 1);
  });
  return configureTexture(new THREE.CanvasTexture(canvas), anisotropy, true);
}

function createBannerTexture(title: string, subtitle: string, bg: string, accent: string, anisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 18, h);
  ctx.fillRect(w - 18, 0, 18, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, w - 16, h - 16);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 40px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, w / 2, h / 2 - 14);

  ctx.fillStyle = accent;
  ctx.font = '700 19px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(subtitle, w / 2, h / 2 + 24);

  return configureTexture(new THREE.CanvasTexture(canvas), anisotropy, true);
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(3, 8, 14, 0.88)');
  grad.addColorStop(0.45, 'rgba(3, 8, 14, 0.48)');
  grad.addColorStop(1, 'rgba(3, 8, 14, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createSkyGradientTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const rand = mulberry32(202611);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Rich golden-hour sky gradient (slightly deeper moodier tones)
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#15385c');
  grad.addColorStop(0.24, '#295680');
  grad.addColorStop(0.45, '#4e789b');
  grad.addColorStop(0.62, '#9e9072');
  grad.addColorStop(0.75, '#cfa658');
  grad.addColorStop(0.86, '#dba84e');
  grad.addColorStop(1.0, '#9a763c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Broad warm solar haze scattered around the sun azimuth
  const sunGlowGrad = ctx.createRadialGradient(w * 0.62, h * 0.67, 16, w * 0.62, h * 0.67, 310);
  sunGlowGrad.addColorStop(0, 'rgba(255, 240, 175, 0.64)');
  sunGlowGrad.addColorStop(0.32, 'rgba(245, 200, 95, 0.34)');
  sunGlowGrad.addColorStop(1, 'rgba(235, 175, 70, 0)');
  ctx.fillStyle = sunGlowGrad;
  ctx.fillRect(0, 0, w, h);

  // Realistic soft golden-lit cumulus & cirrus cloud bands
  for (let c = 0; c < 46; c++) {
    const cx = rand() * w;
    const cy = h * (0.28 + rand() * 0.36);
    const rx = 55 + rand() * 145;
    const ry = 10 + rand() * 24;

    // Warm sunlit underbelly
    for (let puff = 0; puff < 6; puff++) {
      const px = cx + (rand() - 0.5) * rx;
      const py = cy + (rand() - 0.5) * ry;
      const pr = 18 + rand() * 44;
      const cGrad = ctx.createRadialGradient(px, py, 2, px, py, pr);
      const bright = cy > h * 0.48;
      cGrad.addColorStop(0, bright ? 'rgba(255, 240, 196, 0.34)' : 'rgba(250, 244, 234, 0.28)');
      cGrad.addColorStop(0.55, bright ? 'rgba(255, 214, 138, 0.16)' : 'rgba(218, 224, 232, 0.14)');
      cGrad.addColorStop(1, 'rgba(255, 220, 160, 0)');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.ellipse(px, py, pr * 1.9, pr * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function createSunGlowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, 4, half, half, half);
  grad.addColorStop(0.0, 'rgba(255, 252, 224, 1.0)');
  grad.addColorStop(0.18, 'rgba(255, 235, 145, 0.92)');
  grad.addColorStop(0.45, 'rgba(255, 200, 75, 0.42)');
  grad.addColorStop(0.75, 'rgba(255, 175, 45, 0.12)');
  grad.addColorStop(1.0, 'rgba(255, 160, 30, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextureSet(renderer: THREE.WebGLRenderer): ProceduralTextureSet {
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const concrete = createConcreteTextures(anisotropy);
  const rampConcrete = createRampConcreteTextures(anisotropy);
  const griptape = createGriptapeTextures(anisotropy);
  const clothing = createClothingTextures(anisotropy);
  const env = createEnvironmentTextures(anisotropy);
  const poolTileColor = createPoolTileTexture(anisotropy);
  const bannerMain = createBannerTexture('COSTA AZUL SKATEPARK', 'FLOW STUDIOS PRO TOUR', '#132638', '#38bdf8', anisotropy);
  const bannerSecondary = createBannerTexture('FLOW SKATE', 'STREET & BOWL ARENA', '#0f1c2b', '#22d3ee', anisotropy);
  const contactShadow = createContactShadowTexture();
  const skyGradient = createSkyGradientTexture();
  const sunGlow = createSunGlowTexture();
  const woodDeckEdge = createWoodEdgeTexture(anisotropy);

  const deckGraphics: Record<DeckGraphicId, THREE.CanvasTexture> = {
    flow_wave: createDeckGraphic('flow_wave', anisotropy),
    costa_azul: createDeckGraphic('costa_azul', anisotropy),
    street_stripes: createDeckGraphic('street_stripes', anisotropy),
    natural_maple: createDeckGraphic('natural_maple', anisotropy),
    night_neon: createDeckGraphic('night_neon', anisotropy),
    world_gold: createDeckGraphic('world_gold', anisotropy),
    tokyo_ink: createDeckGraphic('tokyo_ink', anisotropy),
    brazil_tropics: createDeckGraphic('brazil_tropics', anisotropy),
  };

  const griptapeVariants: Record<GripTapeStyleId, THREE.CanvasTexture> = {
    classic_black: griptape.griptapeColor,
    cyan_stripe: createGripVariantTexture('cyan_stripe', anisotropy),
    clear_wood: createGripVariantTexture('clear_wood', anisotropy),
    checkered: createGripVariantTexture('checkered', anisotropy),
    pro_red: createGripVariantTexture('pro_red', anisotropy),
  };

  return {
    ...concrete,
    ...rampConcrete,
    ...griptape,
    griptapeVariants,
    ...clothing,
    ...env,
    poolTileColor,
    bannerMain,
    bannerSecondary,
    contactShadow,
    skyGradient,
    sunGlow,
    woodDeckEdge,
    deckGraphics,
    dispose: () => {
      concrete.concreteColor.dispose();
      concrete.concreteRoughness.dispose();
      concrete.concreteBump.dispose();
      rampConcrete.rampConcreteColor.dispose();
      rampConcrete.rampConcreteBump.dispose();
      rampConcrete.rampConcreteRoughness.dispose();
      griptape.griptapeColor.dispose();
      griptape.griptapeBump.dispose();
      Object.values(griptapeVariants).forEach((t) => {
        if (t !== griptape.griptapeColor) t.dispose();
      });
      clothing.shirtTexture.dispose();
      clothing.shirtBump.dispose();
      clothing.pantsTexture.dispose();
      clothing.pantsBump.dispose();
      clothing.shoeTexture.dispose();
      clothing.shoeBump.dispose();
      clothing.hatBump.dispose();
      clothing.skinTexture.dispose();
      env.metalScratchBump.dispose();
      env.paintWeatheredMask.dispose();
      env.canopyColor.dispose();
      env.canopyBump.dispose();
      env.wallColor.dispose();
      env.wallBump.dispose();
      env.woodColor.dispose();
      env.woodBump.dispose();
      env.grassColor.dispose();
      env.grassBump.dispose();
      env.barkColor.dispose();
      env.barkBump.dispose();
      env.leafColor.dispose();
      env.cityColor.dispose();
      env.umbrellaColor.dispose();
      poolTileColor.dispose();
      bannerMain.dispose();
      bannerSecondary.dispose();
      contactShadow.dispose();
      skyGradient.dispose();
      sunGlow.dispose();
      woodDeckEdge.dispose();
      Object.values(deckGraphics).forEach((t) => t.dispose());
    },
  };
}
