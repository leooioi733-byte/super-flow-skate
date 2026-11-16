import * as THREE from 'three';

export interface SurfaceSample {
  height: number;
  normal: THREE.Vector3;
  isTransition: boolean;
  blockedByWall: boolean;
  wallNormalX: number;
  wallNormalZ: number;
}

export interface GrindSegment {
  id: string;
  a: THREE.Vector3;
  b: THREE.Vector3;
  dir: THREE.Vector3;
  length: number;
  isCoping?: boolean;
}

export interface GrindSnapResult {
  segment: GrindSegment;
  point: THREE.Vector3;
  t: number; // 0..1 along segment
  tangent: THREE.Vector3;
  forwardSign: number; // +1 or -1 based on skater heading
}

interface QuarterPipeSpec {
  qx: number;
  qz: number;
  width: number;
  height: number;
  depth: number;
  rotY: number;
  cosR: number;
  sinR: number;
}

const QUARTER_PIPES: QuarterPipeSpec[] = [
  {
    qx: 5.8,
    qz: -3.2,
    width: 4.4,
    height: 1.55,
    depth: 2.7,
    rotY: -Math.PI * 0.68,
    cosR: Math.cos(-Math.PI * 0.68),
    sinR: Math.sin(-Math.PI * 0.68),
  },
  {
    qx: -10.8,
    qz: -1.5,
    width: 4.2,
    height: 1.35,
    depth: 2.5,
    rotY: Math.PI * 0.14,
    cosR: Math.cos(Math.PI * 0.14),
    sinR: Math.sin(Math.PI * 0.14),
  },
  {
    qx: 0,
    qz: 17.6,
    width: 10.6,
    height: 1.62,
    depth: 2.7,
    rotY: -Math.PI * 0.5,
    cosR: Math.cos(-Math.PI * 0.5),
    sinR: Math.sin(-Math.PI * 0.5),
  },
];

// Build static list of all grindable rails, ledges, and curved bowl coping segments
const GRIND_SEGMENTS: GrindSegment[] = (() => {
  const segs: GrindSegment[] = [];
  const addSeg = (id: string, ax: number, ay: number, az: number, bx: number, by: number, bz: number, isCoping = false) => {
    const a = new THREE.Vector3(ax, ay, az);
    const b = new THREE.Vector3(bx, by, bz);
    const dir = new THREE.Vector3().subVectors(b, a);
    const length = dir.length();
    dir.normalize();
    segs.push({ id, a, b, dir, length, isCoping });
  };

  // 1. Flatbar rail (-2.9, 0.35, -1.2), length 3.6, rotY 0.24
  const fc = Math.cos(0.24);
  const fs = Math.sin(0.24);
  addSeg(
    'flatbar',
    -2.9 - 1.8 * fc,
    0.35,
    -1.2 + 1.8 * fs,
    -2.9 + 1.8 * fc,
    0.35,
    -1.2 - 1.8 * fs,
  );

  // 2. Funbox kinked rail (center 0.6, 0, -4.4)
  addSeg('funbox_rail_top', -0.1, 0.92, -3.45, 1.7, 0.92, -3.45);
  addSeg('funbox_rail_down', 1.7, 0.92, -3.45, 3.4, 0.34, -3.45);

  // 3. Funbox elevated grind ledge coping
  addSeg('funbox_ledge', -0.75, 0.92, -5.3, 1.95, 0.92, -5.3, true);

  // 4. Quarter-pipe coping rails
  QUARTER_PIPES.forEach((qp, idx) => {
    const lx = qp.depth / 2 - 0.85;
    const hw = qp.width / 2;
    const toWorld = (x: number, z: number) => ({
      wx: qp.qx + x * qp.cosR + z * qp.sinR,
      wz: qp.qz - x * qp.sinR + z * qp.cosR,
    });
    const p1 = toWorld(lx, -hw);
    const p2 = toWorld(lx, hw);
    addSeg(`qp_coping_${idx}`, p1.wx, qp.height + 0.02, p1.wz, p2.wx, qp.height + 0.02, p2.wz, true);
  });

  // 5. Bowl circular coping segmented into 24 chords (radius 2.65 around -5.2, -5.8 at y = 1.175)
  const bx = -5.2;
  const bz = -5.8;
  const br = 2.65;
  const steps = 24;
  for (let i = 0; i < steps; i++) {
    const a0 = (i / steps) * Math.PI * 2;
    const a1 = ((i + 1) / steps) * Math.PI * 2;
    addSeg(
      `bowl_coping_${i}`,
      bx + Math.cos(a0) * br,
      1.175,
      bz + Math.sin(a0) * br,
      bx + Math.cos(a1) * br,
      1.175,
      bz + Math.sin(a1) * br,
      true,
    );
  }

  // 6. Expanded East Manual Pad Copings & Long Flatbar Rail
  addSeg('east_pad_coping_n', 10.8, 0.37, 3.92, 16.2, 0.37, 3.92, true);
  addSeg('east_pad_coping_s', 10.8, 0.37, 7.08, 16.2, 0.37, 7.08, true);
  addSeg('east_long_rail', 10.9, 0.42, 1.2, 16.1, 0.42, 1.2);

  // 7. Expanded West A-Frame Coping Rail
  addSeg('west_aframe_up', -17.2, 0.24, 5.75, -15.4, 0.92, 5.75);
  addSeg('west_aframe_top', -15.4, 0.92, 5.75, -13.6, 0.92, 5.75);
  addSeg('west_aframe_down', -13.6, 0.92, 5.75, -11.8, 0.24, 5.75);

  return segs;
})();

const _bestNormal = new THREE.Vector3(0, 1, 0);
const _tempNormal = new THREE.Vector3();

// Evaluates exact skatepark surface height & normal at world (x, z) given current skater y
export function sampleSkateparkSurface(x: number, y: number, z: number, out: SurfaceSample): void {
  let bestH = 0;
  _bestNormal.set(0, 1, 0);
  let isTransition = false;
  let blockedByWall = false;
  let wallNormalX = 0;
  let wallNormalZ = 0;

  // 1. Concrete Bowl (-5.2, -5.8), deck 8.4 x 7.4, height 1.15
  const bx = -5.2;
  const bz = -5.8;
  const dxBowl = x - bx;
  const dzBowl = z - bz;
  const rBowl = Math.hypot(dxBowl, dzBowl);
  const flatR = 1.4;
  const outerR = 2.65;
  const deckH = 1.15;

  if (Math.abs(dxBowl) <= 4.2 && Math.abs(dzBowl) <= 3.7) {
    if (rBowl <= flatR) {
      bestH = 0.14;
      _bestNormal.set(0, 1, 0);
    } else if (rBowl <= outerR) {
      const s = THREE.MathUtils.clamp((rBowl - flatR) / (outerR - flatR), 0, 1);
      const angle = Math.asin(s);
      const h = 0.14 + (deckH - 0.14) * (1 - Math.cos(angle));
      const invR = rBowl > 0.0001 ? 1 / rBowl : 0;
      const nx = -dxBowl * invR * Math.sin(angle);
      const nz = -dzBowl * invR * Math.sin(angle);
      const ny = Math.cos(angle);
      bestH = h;
      _bestNormal.set(nx, ny, nz).normalize();
      isTransition = true;
    } else {
      // Raised bowl deck
      if (y >= deckH - 0.42) {
        bestH = deckH;
        _bestNormal.set(0, 1, 0);
      } else {
        // Blocking side wall of bowl deck (except where bank ramp meets +X)
        const onBankZ = dzBowl >= -4.2 && dzBowl <= -1.4;
        if (!onBankZ || dxBowl < 3.6) {
          blockedByWall = true;
          if (Math.abs(dxBowl) / 4.2 > Math.abs(dzBowl) / 3.7) {
            wallNormalX = Math.sign(dxBowl || 1);
          } else {
            wallNormalZ = Math.sign(dzBowl || 1);
          }
        }
      }
    }
  }

  // Bowl access bank ramp on +X side: bowl local x in [4.18, 6.58], z in [-4.2, -1.4]
  if (dxBowl >= 4.18 && dxBowl <= 6.58 && dzBowl >= -4.2 && dzBowl <= -1.4) {
    const t = THREE.MathUtils.clamp((6.58 - dxBowl) / 2.4, 0, 1);
    const h = t * deckH;
    if (h > bestH && y >= h - 0.5) {
      bestH = h;
      const slopeLen = Math.hypot(2.4, deckH);
      _bestNormal.set(deckH / slopeLen, 2.4 / slopeLen, 0);
      isTransition = true;
    }
  }

  // 2. Quarter-Pipes
  for (let i = 0; i < QUARTER_PIPES.length; i++) {
    const qp = QUARTER_PIPES[i];
    const relX = x - qp.qx;
    const relZ = z - qp.qz;
    // Transform world offset into QP local frame (rotation by -rotY)
    const lx = relX * qp.cosR - relZ * qp.sinR;
    const lz = relX * qp.sinR + relZ * qp.cosR;

    const halfD = qp.depth / 2;
    const halfW = qp.width / 2;

    if (lx >= -halfD && lx <= halfD && lz >= -halfW && lz <= halfW) {
      const lipX = halfD - 0.85;
      let h = 0;
      let slopeDyDx = 0;
      let trans = false;

      if (lx >= lipX) {
        h = qp.height;
      } else {
        // Transition curve: t in [0..1] from bottom (-halfD) to lipX
        const span = lipX - -halfD;
        const t = THREE.MathUtils.clamp((lx - -halfD) / span, 0, 1);
        const angle = (t * Math.PI) / 2;
        h = 0.02 + (qp.height - 0.02) * (1 - Math.cos(angle));
        // Slope derivative approximation
        const dh = (qp.height - 0.02) * Math.sin(angle) * (Math.PI / 2);
        slopeDyDx = dh / span;
        trans = true;
      }

      if (y >= h - 0.55) {
        if (h > bestH) {
          bestH = h;
          _tempNormal.set(-Math.min(slopeDyDx, 3.2), 1, 0).normalize();
          // Rotate local normal back to world space by +rotY
          const wx = _tempNormal.x * qp.cosR + _tempNormal.z * qp.sinR;
          const wz = -_tempNormal.x * qp.sinR + _tempNormal.z * qp.cosR;
          _bestNormal.set(wx, _tempNormal.y, wz).normalize();
          isTransition = trans;
        }
      } else if (lx > -halfD + 0.35) {
        // Distinguish side wall vs back wall of quarter pipe for smooth wall-sliding
        const distBack = Math.max(0, halfD - lx);
        const distSide = Math.max(0, halfW - Math.abs(lz));
        blockedByWall = true;
        if (distSide < distBack && distSide < 0.75) {
          const sideSign = lz >= 0 ? 1 : -1;
          wallNormalX = sideSign * qp.sinR;
          wallNormalZ = sideSign * qp.cosR;
        } else {
          wallNormalX = qp.cosR;
          wallNormalZ = -qp.sinR;
        }
      }
    }
  }

  // 3. Funbox / Pyramid (center 0.6, 0, -4.4)
  const fx = x - 0.6;
  const fz = z - -4.4;
  if (Math.abs(fz) <= 1.42) {
    let fh = 0;
    let fnx = 0;
    let fny = 1;
    let fTrans = false;

    if (fx >= -1.3 && fx <= 1.3) {
      fh = 0.58;
      // Elevated grind ledge on back (-Z) edge of funbox
      if (fz <= -0.88 && y >= 0.72) {
        fh = 0.92;
      }
    } else if (fx >= -3.05 && fx < -1.3) {
      const t = (fx + 3.05) / 1.75;
      fh = t * 0.58;
      const len = Math.hypot(1.75, 0.58);
      fnx = -0.58 / len;
      fny = 1.75 / len;
      fTrans = true;
    } else if (fx > 1.3 && fx <= 3.05) {
      const t = (3.05 - fx) / 1.75;
      fh = t * 0.58;
      const len = Math.hypot(1.75, 0.58);
      fnx = 0.58 / len;
      fny = 1.75 / len;
      fTrans = true;
    }

    if (fh > bestH && y >= fh - 0.45) {
      bestH = fh;
      _bestNormal.set(fnx, fny, 0);
      isTransition = fTrans;
    }
  }

  // 4. Wooden Skatepark Bench (near 3.95, -1.3, rotY -0.35) - skateable manual/ollie pad!
  const bRelX = x - 3.95;
  const bRelZ = z - -1.3;
  const bCos = Math.cos(-0.35);
  const bSin = Math.sin(-0.35);
  const blx = bRelX * bCos - bRelZ * bSin;
  const blz = bRelX * bSin + bRelZ * bCos;
  if (Math.abs(blx) <= 0.86 && Math.abs(blz) <= 0.28) {
    if (y >= 0.36 && 0.48 > bestH) {
      bestH = 0.48;
      _bestNormal.set(0, 1, 0);
    } else if (y < 0.36) {
      blockedByWall = true;
      wallNormalX = Math.sign(bRelX || 1);
      wallNormalZ = Math.sign(bRelZ || 1);
    }
  }

  // 5. Umbrella pole & nearby crew soft obstacle avoidance
  const uDist = Math.hypot(x - 2.65, z - -1.65);
  if (uDist < 0.28 && y < 2.6) {
    blockedByWall = true;
    wallNormalX = (x - 2.65) / (uDist || 1);
    wallNormalZ = (z - -1.65) / (uDist || 1);
  }

  // 6. East Street Manual Pad & Ramps (center 13.5, 0, 5.5)
  const ex = x - 13.5;
  const ez = z - 5.5;
  if (Math.abs(ez) <= 1.62) {
    let eh = 0;
    let enx = 0;
    let eny = 1;
    let eTrans = false;

    if (ex >= -2.7 && ex <= 2.7) {
      eh = 0.36;
    } else if (ex >= -4.4 && ex < -2.7) {
      const t = (ex + 4.4) / 1.7;
      eh = t * 0.36;
      const len = Math.hypot(1.7, 0.36);
      enx = -0.36 / len;
      eny = 1.7 / len;
      eTrans = true;
    } else if (ex > 2.7 && ex <= 4.4) {
      const t = (4.4 - ex) / 1.7;
      eh = t * 0.36;
      const len = Math.hypot(1.7, 0.36);
      enx = 0.36 / len;
      eny = 1.7 / len;
      eTrans = true;
    }

    if (eh > bestH && y >= eh - 0.38) {
      bestH = eh;
      _bestNormal.set(enx, eny, 0);
      isTransition = eTrans;
    }
  }

  // 7. West A-Frame Spine (center -14.5, 0, 7.0)
  const wx = x - -14.5;
  const wz = z - 7.0;
  if (Math.abs(wz) <= 1.32) {
    let wh = 0;
    let wnx = 0;
    let wny = 1;
    let wTrans = false;

    if (wx >= -0.9 && wx <= 0.9) {
      wh = 0.72;
    } else if (wx >= -2.8 && wx < -0.9) {
      const t = (wx + 2.8) / 1.9;
      wh = t * 0.72;
      const len = Math.hypot(1.9, 0.72);
      wnx = -0.72 / len;
      wny = 1.9 / len;
      wTrans = true;
    } else if (wx > 0.9 && wx <= 2.8) {
      const t = (2.8 - wx) / 1.9;
      wh = t * 0.72;
      const len = Math.hypot(1.9, 0.72);
      wnx = 0.72 / len;
      wny = 1.9 / len;
      wTrans = true;
    }

    if (wh > bestH && y >= wh - 0.45) {
      bestH = wh;
      _bestNormal.set(wnx, wny, 0);
      isTransition = wTrans;
    }
  }

  // 8. Corner Concrete Planters (solid walls around x = ±23.8, z = -9.8 / 18.6)
  const planters: [number, number][] = [
    [-23.8, -9.8],
    [23.8, -9.8],
    [-23.8, 18.6],
    [23.8, 18.6],
  ];
  for (let i = 0; i < planters.length; i++) {
    const px = planters[i][0];
    const pz = planters[i][1];
    const dxp = x - px;
    const dzp = z - pz;
    if (Math.abs(dxp) < 1.35 && Math.abs(dzp) < 1.35 && y < 0.75) {
      blockedByWall = true;
      if (Math.abs(dxp) > Math.abs(dzp)) {
        wallNormalX = Math.sign(dxp || 1);
      } else {
        wallNormalZ = Math.sign(dzp || 1);
      }
    }
  }

  out.height = bestH;
  out.normal.copy(_bestNormal);
  out.isTransition = isTransition;
  out.blockedByWall = blockedByWall;
  out.wallNormalX = wallNormalX;
  out.wallNormalZ = wallNormalZ;
}

const _segVec = new THREE.Vector3();
const _ptVec = new THREE.Vector3();
const _projPt = new THREE.Vector3();

export function findNearestGrindSegment(
  pos: THREE.Vector3,
  vel: THREE.Vector3,
  maxHorizDist = 0.48,
  maxVertDist = 0.42,
  activeSegmentId?: string,
): GrindSnapResult | null {
  let bestScore = Infinity;
  let bestResult: GrindSnapResult | null = null;
  const speedHoriz = Math.hypot(vel.x, vel.z);

  for (let i = 0; i < GRIND_SEGMENTS.length; i++) {
    const seg = GRIND_SEGMENTS[i];
    _segVec.subVectors(seg.b, seg.a);
    _ptVec.subVectors(pos, seg.a);
    const t = THREE.MathUtils.clamp(_ptVec.dot(_segVec) / (seg.length * seg.length), 0, 1);
    _projPt.copy(seg.a).addScaledVector(_segVec, t);

    const dx = pos.x - _projPt.x;
    const dz = pos.z - _projPt.z;
    const dy = pos.y - _projPt.y;
    const horizDist = Math.hypot(dx, dz);

    const vertTol = activeSegmentId ? maxVertDist + 0.14 : maxVertDist;
    const minDy = activeSegmentId ? -0.34 : -0.22;

    if (horizDist <= maxHorizDist && dy >= minDy && dy <= vertTol) {
      let score = horizDist * horizDist + dy * dy;
      const dotVel = vel.x * seg.dir.x + vel.z * seg.dir.z;
      const forwardSign = dotVel >= 0 ? 1 : -1;

      // Prefer continuing along aligned rail/coping segments when already grinding
      if (activeSegmentId && speedHoriz > 0.2) {
        const align = Math.abs(dotVel) / speedHoriz;
        if (align < 0.25) continue;
        if (seg.id.slice(0, 8) === activeSegmentId.slice(0, 8)) {
          score *= 0.72;
        }
      }

      if (score < bestScore) {
        bestScore = score;
        bestResult = {
          segment: seg,
          point: _projPt.clone(),
          t,
          tangent: seg.dir.clone().multiplyScalar(forwardSign),
          forwardSign,
        };
      }
    }
  }

  return bestResult;
}

export function clampInsideParkBounds(pos: THREE.Vector3, vel: THREE.Vector3): void {
  // Enclosed 4-sided concrete walls at X = ±26.5, Z = -12.5 & +21.4
  const minX = -25.6;
  const maxX = 25.6;
  const minZ = -11.7;
  const maxZ = 20.5;

  if (pos.x < minX) {
    pos.x = minX;
    if (vel.x < 0) vel.x *= -0.35;
  } else if (pos.x > maxX) {
    pos.x = maxX;
    if (vel.x > 0) vel.x *= -0.35;
  }

  if (pos.z < minZ) {
    pos.z = minZ;
    if (vel.z < 0) vel.z *= -0.35;
  } else if (pos.z > maxZ) {
    pos.z = maxZ;
    if (vel.z > 0) vel.z *= -0.35;
  }
}
