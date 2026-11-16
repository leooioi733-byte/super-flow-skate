import * as THREE from 'three';
import { ProceduralTextureSet } from './textures';

export interface SkateparkHandle {
  group: THREE.Group;
  update: (elapsed: number) => void;
  dispose: () => void;
}

interface AnimatedPerson {
  group: THREE.Group;
  head: THREE.Object3D;
  phase: number;
}

export function buildSkateparkScene(textures: ProceduralTextureSet): SkateparkHandle {
  const disposables: Array<{ dispose: () => void }> = [];
  const root = new THREE.Group();
  root.name = 'SkateparkRoot';

  const animatedPeople: AnimatedPerson[] = [];

  // --- Shared High-Detail Physical & PBR Materials (Optimized to minimize shader compilations) ---
  const plazaConcreteMat = new THREE.MeshPhysicalMaterial({
    map: textures.concreteColor,
    roughnessMap: textures.concreteRoughness,
    clearcoatRoughnessMap: textures.concreteRoughness,
    bumpMap: textures.concreteBump,
    bumpScale: 0.055,
    roughness: 0.82,
    metalness: 0.04,
    clearcoat: 0.3,
    clearcoatRoughness: 0.38,
    envMapIntensity: 1.35,
  });

  const rampConcreteMat = new THREE.MeshPhysicalMaterial({
    map: textures.rampConcreteColor,
    roughnessMap: textures.rampConcreteRoughness,
    clearcoatRoughnessMap: textures.rampConcreteRoughness,
    bumpMap: textures.rampConcreteBump,
    bumpScale: 0.042,
    roughness: 0.66,
    metalness: 0.04,
    clearcoat: 0.4,
    clearcoatRoughness: 0.28,
    envMapIntensity: 1.45,
  });

  const copingSteelMat = new THREE.MeshPhysicalMaterial({
    color: 0xc2cbd4,
    metalness: 0.94,
    roughness: 0.18,
    bumpMap: textures.metalScratchBump,
    bumpScale: 0.012,
    envMapIntensity: 1.75,
  });

  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x16202b,
    metalness: 0.76,
    roughness: 0.34,
    bumpMap: textures.metalScratchBump,
    bumpScale: 0.01,
    envMapIntensity: 1.35,
  });

  const poolTileMat = new THREE.MeshPhysicalMaterial({
    map: textures.poolTileColor,
    roughness: 0.2,
    metalness: 0.08,
    clearcoat: 0.95,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.55,
  });

  const wallNavyMat = new THREE.MeshStandardMaterial({
    map: textures.wallColor,
    bumpMap: textures.wallBump,
    bumpScale: 0.042,
    roughness: 0.76,
    metalness: 0.08,
  });

  const flowCyanMat = new THREE.MeshStandardMaterial({
    color: 0x137a94,
    roughness: 0.38,
    metalness: 0.18,
    envMapIntensity: 1.25,
  });

  const umbrellaMat = new THREE.MeshStandardMaterial({
    map: textures.umbrellaColor,
    bumpMap: textures.shirtBump,
    bumpScale: 0.014,
    roughness: 0.86,
    metalness: 0.02,
  });

  const canopyRoofMat = new THREE.MeshStandardMaterial({
    map: textures.canopyColor,
    bumpMap: textures.canopyBump,
    bumpScale: 0.03,
    roughness: 0.56,
    metalness: 0.25,
    envMapIntensity: 1.05,
  });

  const whitePaintMat = new THREE.MeshStandardMaterial({
    color: 0xcfd6de,
    map: textures.paintWeatheredMask,
    bumpMap: textures.concreteBump,
    bumpScale: 0.02,
    roughness: 0.7,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const cyanLineMat = new THREE.MeshStandardMaterial({
    color: 0x1a87a0,
    map: textures.paintWeatheredMask,
    bumpMap: textures.concreteBump,
    bumpScale: 0.02,
    roughness: 0.54,
    metalness: 0.06,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const grassMat = new THREE.MeshStandardMaterial({
    map: textures.grassColor,
    bumpMap: textures.grassBump,
    bumpScale: 0.055,
    roughness: 0.96,
    metalness: 0.0,
  });

  const palmTrunkMat = new THREE.MeshStandardMaterial({
    map: textures.barkColor,
    bumpMap: textures.barkBump,
    bumpScale: 0.055,
    roughness: 0.92,
    metalness: 0.0,
  });

  const palmLeafMat = new THREE.MeshStandardMaterial({
    map: textures.leafColor,
    bumpMap: textures.grassBump,
    bumpScale: 0.015,
    roughness: 0.62,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });

  const woodBenchMat = new THREE.MeshStandardMaterial({
    map: textures.woodColor,
    bumpMap: textures.woodBump,
    bumpScale: 0.028,
    roughness: 0.66,
    metalness: 0.03,
  });

  const cityBlockMat = new THREE.MeshStandardMaterial({
    map: textures.cityColor,
    roughness: 0.82,
    metalness: 0.1,
  });

  const fenceMeshMat = new THREE.MeshStandardMaterial({
    color: 0x334455,
    metalness: 0.65,
    roughness: 0.42,
    transparent: true,
    opacity: 0.34,
  });

  disposables.push(
    plazaConcreteMat,
    rampConcreteMat,
    copingSteelMat,
    darkSteelMat,
    poolTileMat,
    wallNavyMat,
    flowCyanMat,
    umbrellaMat,
    canopyRoofMat,
    whitePaintMat,
    cyanLineMat,
    grassMat,
    palmTrunkMat,
    palmLeafMat,
    woodBenchMat,
    cityBlockMat,
    fenceMeshMat,
  );

  // --- 1. Realistic Golden-Hour Sky Dome + Radiant Sun Disc & Corona ---
  const skyGeo = new THREE.SphereGeometry(210, 32, 22);
  const skyMat = new THREE.MeshBasicMaterial({
    map: textures.skyGradient,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  disposables.push(skyGeo, skyMat);
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  skyMesh.rotation.y = -0.35;
  root.add(skyMesh);

  // Radiant Sun Disc + Multi-Layer Additive Corona Glow
  const sunPos = new THREE.Vector3(74, 34, -62);
  const sunOrbGeo = new THREE.SphereGeometry(4.8, 22, 16);
  const sunOrbMat = new THREE.MeshBasicMaterial({
    color: 0xfffce0,
    fog: false,
  });
  disposables.push(sunOrbGeo, sunOrbMat);
  const sunOrb = new THREE.Mesh(sunOrbGeo, sunOrbMat);
  sunOrb.position.copy(sunPos);
  root.add(sunOrb);

  const coronaInnerMat = new THREE.SpriteMaterial({
    map: textures.sunGlow,
    color: 0xf5df88,
    transparent: true,
    opacity: 0.76,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  const coronaOuterMat = new THREE.SpriteMaterial({
    map: textures.sunGlow,
    color: 0xebaf3e,
    transparent: true,
    opacity: 0.44,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  disposables.push(coronaInnerMat, coronaOuterMat);

  const sunCoronaInner = new THREE.Sprite(coronaInnerMat);
  sunCoronaInner.position.copy(sunPos);
  sunCoronaInner.scale.set(28, 28, 1);
  root.add(sunCoronaInner);

  const sunCoronaOuter = new THREE.Sprite(coronaOuterMat);
  sunCoronaOuter.position.copy(sunPos);
  sunCoronaOuter.scale.set(66, 66, 1);
  root.add(sunCoronaOuter);

  // --- 2. Expanded Concrete Skatepark Plaza & Outer Coastal Turf ---
  const outerGroundGeo = new THREE.PlaneGeometry(360, 360);
  outerGroundGeo.rotateX(-Math.PI / 2);
  disposables.push(outerGroundGeo);
  const outerGround = new THREE.Mesh(outerGroundGeo, grassMat);
  outerGround.position.y = -0.05;
  outerGround.receiveShadow = true;
  root.add(outerGround);

  const plazaGeo = new THREE.PlaneGeometry(60, 48);
  plazaGeo.rotateX(-Math.PI / 2);
  disposables.push(plazaGeo);
  const plazaFloor = new THREE.Mesh(plazaGeo, plazaConcreteMat);
  plazaFloor.position.set(0, 0, 3.0);
  plazaFloor.receiveShadow = true;
  root.add(plazaFloor);

  const addLineStrip = (x: number, z: number, w: number, l: number, mat: THREE.Material, rotY = 0) => {
    const geo = new THREE.PlaneGeometry(w, l);
    geo.rotateX(-Math.PI / 2);
    disposables.push(geo);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.008, z);
    mesh.rotation.y = rotY;
    mesh.receiveShadow = true;
    root.add(mesh);
  };

  // Classic Home Framing Accent Lines + Expanded Plaza Court Lines
  addLineStrip(-0.6, 1.5, 0.11, 22, cyanLineMat, 0.08);
  addLineStrip(1.45, 3.15, 2.7, 0.09, whitePaintMat, 0.08);
  addLineStrip(1.22, 0.45, 2.7, 0.09, whitePaintMat, 0.08);
  addLineStrip(2.68, 1.8, 0.09, 2.7, whitePaintMat, 0.08);
  addLineStrip(-0.02, 1.8, 0.09, 2.7, whitePaintMat, 0.08);
  addLineStrip(0, 12.2, 46, 0.1, cyanLineMat, 0);
  addLineStrip(-20.5, 4.5, 0.1, 29, whitePaintMat, 0);
  addLineStrip(20.5, 4.5, 0.1, 29, whitePaintMat, 0);

  // --- 3. Concrete Skate Bowl ---
  const buildBowlPlatform = (bx: number, bz: number) => {
    const bowlGroup = new THREE.Group();
    bowlGroup.position.set(bx, 0, bz);
    root.add(bowlGroup);

    const deckW = 8.4;
    const deckD = 7.4;
    const deckH = 1.15;
    const bowlRadius = 2.65;

    const deckShape = new THREE.Shape();
    deckShape.moveTo(-deckW / 2, -deckD / 2);
    deckShape.lineTo(deckW / 2, -deckD / 2);
    deckShape.lineTo(deckW / 2, deckD / 2);
    deckShape.lineTo(-deckW / 2, deckD / 2);
    deckShape.closePath();

    const holePath = new THREE.Path();
    holePath.absarc(0, 0, bowlRadius, 0, Math.PI * 2, true);
    deckShape.holes.push(holePath);

    const deckGeo = new THREE.ExtrudeGeometry(deckShape, {
      depth: deckH,
      bevelEnabled: true,
      bevelSize: 0.04,
      bevelThickness: 0.04,
      bevelSegments: 2,
      curveSegments: 26,
    });
    deckGeo.rotateX(-Math.PI / 2);
    disposables.push(deckGeo);

    const deckMesh = new THREE.Mesh(deckGeo, rampConcreteMat);
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    bowlGroup.add(deckMesh);

    const profile: THREE.Vector2[] = [];
    profile.push(new THREE.Vector2(0, 0.14));
    profile.push(new THREE.Vector2(1.4, 0.14));
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = (t * Math.PI) / 2;
      const r = 1.4 + (bowlRadius - 1.4) * Math.sin(angle);
      const y = 0.14 + (deckH - 0.14) * (1 - Math.cos(angle));
      profile.push(new THREE.Vector2(r, y));
    }
    const innerBowlGeo = new THREE.LatheGeometry(profile, 34);
    const bowlShellMat = rampConcreteMat.clone();
    bowlShellMat.side = THREE.BackSide;
    disposables.push(innerBowlGeo, bowlShellMat);

    const innerBowlMesh = new THREE.Mesh(innerBowlGeo, bowlShellMat);
    innerBowlMesh.receiveShadow = true;
    bowlGroup.add(innerBowlMesh);

    const tileBandGeo = new THREE.CylinderGeometry(
      bowlRadius - 0.01,
      bowlRadius - 0.04,
      0.2,
      34,
      1,
      true,
    );
    const tileBandMat = poolTileMat.clone();
    tileBandMat.side = THREE.BackSide;
    disposables.push(tileBandGeo, tileBandMat);
    const tileBand = new THREE.Mesh(tileBandGeo, tileBandMat);
    tileBand.position.y = deckH - 0.11;
    bowlGroup.add(tileBand);

    const copingGeo = new THREE.TorusGeometry(bowlRadius, 0.048, 10, 38);
    copingGeo.rotateX(Math.PI / 2);
    disposables.push(copingGeo);
    const copingMesh = new THREE.Mesh(copingGeo, copingSteelMat);
    copingMesh.position.y = deckH + 0.025;
    copingMesh.castShadow = true;
    bowlGroup.add(copingMesh);

    const bankShape = new THREE.Shape();
    bankShape.moveTo(0, 0);
    bankShape.lineTo(2.4, 0);
    bankShape.lineTo(2.4, deckH);
    bankShape.closePath();
    const bankGeo = new THREE.ExtrudeGeometry(bankShape, {
      depth: 2.8,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02,
      bevelSegments: 1,
    });
    disposables.push(bankGeo);
    const bankMesh = new THREE.Mesh(bankGeo, rampConcreteMat);
    bankMesh.position.set(deckW / 2 + 2.38, 0, -1.4);
    bankMesh.rotation.y = Math.PI;
    bankMesh.castShadow = true;
    bankMesh.receiveShadow = true;
    bowlGroup.add(bankMesh);
  };

  buildBowlPlatform(-5.2, -5.8);

  // --- 4. Quarter-Pipe Ramps (Original 2 + Expanded South Wide Quarter-Pipe) ---
  const buildQuarterPipe = (qx: number, qz: number, width: number, height: number, depth: number, rotY: number) => {
    const qpGroup = new THREE.Group();
    qpGroup.position.set(qx, 0, qz);
    qpGroup.rotation.y = rotY;
    root.add(qpGroup);

    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(depth, 0);
    shape.lineTo(depth, height);
    shape.lineTo(depth - 0.85, height);
    shape.quadraticCurveTo(depth - 1.15, 0.14, 0, 0.02);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: width,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02,
      bevelSegments: 1,
      curveSegments: 16,
    });
    geo.translate(-depth / 2, 0, -width / 2);
    disposables.push(geo);

    const mesh = new THREE.Mesh(geo, rampConcreteMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    qpGroup.add(mesh);

    const copingGeo = new THREE.CylinderGeometry(0.042, 0.042, width + 0.06, 12);
    copingGeo.rotateX(Math.PI / 2);
    disposables.push(copingGeo);
    const coping = new THREE.Mesh(copingGeo, copingSteelMat);
    coping.position.set(depth / 2 - 0.85, height + 0.015, 0);
    coping.castShadow = true;
    qpGroup.add(coping);

    const plateGeo = new THREE.BoxGeometry(0.32, 0.016, width);
    disposables.push(plateGeo);
    const plate = new THREE.Mesh(plateGeo, copingSteelMat);
    plate.position.set(-depth / 2 + 0.16, 0.014, 0);
    plate.receiveShadow = true;
    qpGroup.add(plate);

    const stripeGeo = new THREE.BoxGeometry(depth * 0.65, 0.12, width + 0.05);
    disposables.push(stripeGeo);
    const stripe = new THREE.Mesh(stripeGeo, flowCyanMat);
    stripe.position.set(depth * 0.12, height * 0.55, 0);
    qpGroup.add(stripe);
  };

  buildQuarterPipe(5.8, -3.2, 4.4, 1.55, 2.7, -Math.PI * 0.68);
  buildQuarterPipe(-10.8, -1.5, 4.2, 1.35, 2.5, Math.PI * 0.14);
  // Expanded South Wide Quarter-Pipe (facing north into the plaza!)
  buildQuarterPipe(0, 17.6, 10.6, 1.62, 2.7, -Math.PI * 0.5);

  // --- 5. Funbox / Pyramid + Grind Ledge & Handrails ---
  const buildFunboxAndRails = () => {
    const fbGroup = new THREE.Group();
    fbGroup.position.set(0.6, 0, -4.4);
    root.add(fbGroup);

    const centerGeo = new THREE.BoxGeometry(2.6, 0.58, 2.8);
    disposables.push(centerGeo);
    const centerMesh = new THREE.Mesh(centerGeo, rampConcreteMat);
    centerMesh.position.y = 0.29;
    centerMesh.castShadow = true;
    centerMesh.receiveShadow = true;
    fbGroup.add(centerMesh);

    const slopeShape = new THREE.Shape();
    slopeShape.moveTo(0, 0);
    slopeShape.lineTo(1.75, 0);
    slopeShape.lineTo(1.75, 0.58);
    slopeShape.closePath();
    const slopeGeo = new THREE.ExtrudeGeometry(slopeShape, {
      depth: 2.8,
      bevelEnabled: false,
    });
    slopeGeo.translate(0, 0, -1.4);
    disposables.push(slopeGeo);

    const leftSlope = new THREE.Mesh(slopeGeo, rampConcreteMat);
    leftSlope.position.set(-3.05, 0, 0);
    leftSlope.castShadow = true;
    leftSlope.receiveShadow = true;
    fbGroup.add(leftSlope);

    const rightSlope = new THREE.Mesh(slopeGeo, rampConcreteMat);
    rightSlope.position.set(3.05, 0, 0);
    rightSlope.rotation.y = Math.PI;
    rightSlope.castShadow = true;
    rightSlope.receiveShadow = true;
    fbGroup.add(rightSlope);

    const ledgeGeo = new THREE.BoxGeometry(2.7, 0.34, 0.52);
    const copingAngleGeo = new THREE.BoxGeometry(2.72, 0.045, 0.08);
    disposables.push(ledgeGeo, copingAngleGeo);

    const ledge = new THREE.Mesh(ledgeGeo, rampConcreteMat);
    ledge.position.set(0, 0.75, -1.14);
    ledge.castShadow = true;
    ledge.receiveShadow = true;
    fbGroup.add(ledge);

    const ledgeCoping = new THREE.Mesh(copingAngleGeo, copingSteelMat);
    ledgeCoping.position.set(0, 0.92, -0.9);
    ledgeCoping.castShadow = true;
    fbGroup.add(ledgeCoping);

    const railCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.7, 0.92, 0.95),
      new THREE.Vector3(1.1, 0.92, 0.95),
      new THREE.Vector3(2.8, 0.34, 0.95),
    ]);
    const railTubeGeo = new THREE.TubeGeometry(railCurve, 16, 0.036, 10, false);
    const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 10);
    disposables.push(railTubeGeo, postGeo);

    const railMesh = new THREE.Mesh(railTubeGeo, copingSteelMat);
    railMesh.castShadow = true;
    fbGroup.add(railMesh);

    for (const [px, py] of [
      [-0.55, 0.72],
      [1.0, 0.72],
      [2.6, 0.2],
    ]) {
      const post = new THREE.Mesh(postGeo, darkSteelMat);
      post.position.set(px, py, 0.95);
      post.castShadow = true;
      fbGroup.add(post);
    }

    const flatRailGroup = new THREE.Group();
    flatRailGroup.position.set(-2.9, 0, -1.2);
    flatRailGroup.rotation.y = 0.24;
    root.add(flatRailGroup);

    const barGeo = new THREE.CylinderGeometry(0.032, 0.032, 3.6, 12);
    barGeo.rotateZ(Math.PI / 2);
    const legGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.34, 10);
    const footGeo = new THREE.BoxGeometry(0.16, 0.025, 0.34);
    disposables.push(barGeo, legGeo, footGeo);

    const bar = new THREE.Mesh(barGeo, copingSteelMat);
    bar.position.y = 0.35;
    bar.castShadow = true;
    flatRailGroup.add(bar);

    for (const lx of [-1.45, 1.45]) {
      const leg = new THREE.Mesh(legGeo, darkSteelMat);
      leg.position.set(lx, 0.175, 0);
      leg.castShadow = true;
      flatRailGroup.add(leg);

      const foot = new THREE.Mesh(footGeo, darkSteelMat);
      foot.position.set(lx, 0.012, 0);
      flatRailGroup.add(foot);
    }
  };

  buildFunboxAndRails();

  // --- 5B. Expanded Street Plaza Zones (East Manual Pad + Rail & West A-Frame Spine) ---
  const buildExpandedObstacles = () => {
    // East Street Manual Pad & Waxed Coping (center 13.5, 0, 5.5)
    const eastGroup = new THREE.Group();
    eastGroup.position.set(13.5, 0, 5.5);
    root.add(eastGroup);

    const padDeckGeo = new THREE.BoxGeometry(5.4, 0.36, 3.2);
    const padCopingGeo = new THREE.BoxGeometry(5.44, 0.045, 0.08);
    const padStripeGeo = new THREE.BoxGeometry(5.46, 0.08, 3.24);
    disposables.push(padDeckGeo, padCopingGeo, padStripeGeo);

    const padDeck = new THREE.Mesh(padDeckGeo, rampConcreteMat);
    padDeck.position.y = 0.18;
    padDeck.castShadow = true;
    padDeck.receiveShadow = true;
    eastGroup.add(padDeck);

    const padStripe = new THREE.Mesh(padStripeGeo, flowCyanMat);
    padStripe.position.y = 0.16;
    eastGroup.add(padStripe);

    for (const cz of [-1.58, 1.58]) {
      const coping = new THREE.Mesh(padCopingGeo, copingSteelMat);
      coping.position.set(0, 0.365, cz);
      coping.castShadow = true;
      eastGroup.add(coping);
    }

    const rampShape = new THREE.Shape();
    rampShape.moveTo(0, 0);
    rampShape.lineTo(1.7, 0);
    rampShape.lineTo(1.7, 0.36);
    rampShape.closePath();
    const padRampGeo = new THREE.ExtrudeGeometry(rampShape, { depth: 3.2, bevelEnabled: false });
    padRampGeo.translate(0, 0, -1.6);
    disposables.push(padRampGeo);

    const leftPadRamp = new THREE.Mesh(padRampGeo, rampConcreteMat);
    leftPadRamp.position.set(-4.4, 0, 0);
    leftPadRamp.castShadow = true;
    leftPadRamp.receiveShadow = true;
    eastGroup.add(leftPadRamp);

    const rightPadRamp = new THREE.Mesh(padRampGeo, rampConcreteMat);
    rightPadRamp.position.set(4.4, 0, 0);
    rightPadRamp.rotation.y = Math.PI;
    rightPadRamp.castShadow = true;
    rightPadRamp.receiveShadow = true;
    eastGroup.add(rightPadRamp);

    // East Long Flatbar Rail (center 13.5, 0, 1.2)
    const eastBarGeo = new THREE.CylinderGeometry(0.034, 0.034, 5.2, 12);
    eastBarGeo.rotateZ(Math.PI / 2);
    const eastLegGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.42, 10);
    disposables.push(eastBarGeo, eastLegGeo);

    const eastRail = new THREE.Group();
    eastRail.position.set(13.5, 0, 1.2);
    root.add(eastRail);

    const eBar = new THREE.Mesh(eastBarGeo, copingSteelMat);
    eBar.position.y = 0.42;
    eBar.castShadow = true;
    eastRail.add(eBar);

    for (const lx of [-2.2, 0, 2.2]) {
      const eLeg = new THREE.Mesh(eastLegGeo, darkSteelMat);
      eLeg.position.set(lx, 0.21, 0);
      eLeg.castShadow = true;
      eastRail.add(eLeg);
    }

    // West A-Frame Spine + Coping Rail (center -14.5, 0, 7.0)
    const westGroup = new THREE.Group();
    westGroup.position.set(-14.5, 0, 7.0);
    root.add(westGroup);

    const wTopGeo = new THREE.BoxGeometry(1.8, 0.72, 2.6);
    disposables.push(wTopGeo);
    const wTop = new THREE.Mesh(wTopGeo, rampConcreteMat);
    wTop.position.y = 0.36;
    wTop.castShadow = true;
    wTop.receiveShadow = true;
    westGroup.add(wTop);

    const wSlopeShape = new THREE.Shape();
    wSlopeShape.moveTo(0, 0);
    wSlopeShape.lineTo(1.9, 0);
    wSlopeShape.lineTo(1.9, 0.72);
    wSlopeShape.closePath();
    const wSlopeGeo = new THREE.ExtrudeGeometry(wSlopeShape, { depth: 2.6, bevelEnabled: false });
    wSlopeGeo.translate(0, 0, -1.3);
    disposables.push(wSlopeGeo);

    const wLeft = new THREE.Mesh(wSlopeGeo, rampConcreteMat);
    wLeft.position.set(-2.8, 0, 0);
    wLeft.castShadow = true;
    wLeft.receiveShadow = true;
    westGroup.add(wLeft);

    const wRight = new THREE.Mesh(wSlopeGeo, rampConcreteMat);
    wRight.position.set(2.8, 0, 0);
    wRight.rotation.y = Math.PI;
    wRight.castShadow = true;
    wRight.receiveShadow = true;
    westGroup.add(wRight);

    const aFrameCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.7, 0.24, -1.25),
      new THREE.Vector3(-0.9, 0.92, -1.25),
      new THREE.Vector3(0.9, 0.92, -1.25),
      new THREE.Vector3(2.7, 0.24, -1.25),
    ]);
    const aFrameGeo = new THREE.TubeGeometry(aFrameCurve, 18, 0.036, 10, false);
    const aPostGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.22, 8);
    disposables.push(aFrameGeo, aPostGeo);

    const aFrameRail = new THREE.Mesh(aFrameGeo, copingSteelMat);
    aFrameRail.castShadow = true;
    westGroup.add(aFrameRail);

    for (const [px, py] of [
      [-0.85, 0.81],
      [0.85, 0.81],
    ]) {
      const p = new THREE.Mesh(aPostGeo, darkSteelMat);
      p.position.set(px, py, -1.25);
      westGroup.add(p);
    }
  };

  buildExpandedObstacles();

  // --- 6. Grandstands + Fully Enclosed 4-Sided Park Perimeter ---
  const buildEnclosedPerimeterAndGrandstands = () => {
    // North Grandstands & Retaining Wall (z = -12.5, width 53.8m)
    const gsGroup = new THREE.Group();
    gsGroup.position.set(0, 0, -12.5);
    root.add(gsGroup);

    const nWallGeo = new THREE.BoxGeometry(53.8, 2.35, 0.75);
    const nWallCapGeo = new THREE.BoxGeometry(54.0, 0.14, 0.88);
    disposables.push(nWallGeo, nWallCapGeo);

    const nWall = new THREE.Mesh(nWallGeo, wallNavyMat);
    nWall.position.y = 1.175;
    nWall.castShadow = true;
    nWall.receiveShadow = true;
    gsGroup.add(nWall);

    const nWallCap = new THREE.Mesh(nWallCapGeo, flowCyanMat);
    nWallCap.position.y = 2.38;
    gsGroup.add(nWallCap);

    const tierGeo = new THREE.BoxGeometry(30, 0.55, 1.1);
    disposables.push(tierGeo);
    for (let t = 0; t < 4; t++) {
      const tier = new THREE.Mesh(tierGeo, rampConcreteMat);
      tier.position.set(-2, 2.4 + t * 0.55, -1.1 - t * 0.95);
      tier.castShadow = true;
      tier.receiveShadow = true;
      gsGroup.add(tier);
    }

    const canopyGeo = new THREE.BoxGeometry(32, 0.18, 5.4);
    const pillarGeo = new THREE.CylinderGeometry(0.11, 0.13, 4.6, 10);
    disposables.push(canopyGeo, pillarGeo);

    const canopy = new THREE.Mesh(canopyGeo, canopyRoofMat);
    canopy.position.set(-2, 6.4, -2.8);
    canopy.rotation.x = 0.08;
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    gsGroup.add(canopy);

    for (let px = -14; px <= 10; px += 6) {
      const pillar = new THREE.Mesh(pillarGeo, darkSteelMat);
      pillar.position.set(px, 4.1, -4.4);
      pillar.castShadow = true;
      gsGroup.add(pillar);
    }

    const signBoardGeo = new THREE.BoxGeometry(6.8, 1.55, 0.25);
    const signFaceGeo = new THREE.PlaneGeometry(6.5, 1.38);
    const signMat = new THREE.MeshStandardMaterial({
      map: textures.bannerMain,
      roughness: 0.45,
      metalness: 0.08,
    });
    disposables.push(signBoardGeo, signFaceGeo, signMat);

    const signBox = new THREE.Mesh(signBoardGeo, darkSteelMat);
    signBox.position.set(8.8, 3.25, 0.1);
    signBox.castShadow = true;
    gsGroup.add(signBox);

    const signFace = new THREE.Mesh(signFaceGeo, signMat);
    signFace.position.set(8.8, 3.25, 0.24);
    gsGroup.add(signFace);

    const wallSignGeo = new THREE.PlaneGeometry(5.2, 1.25);
    const wallSignMat = new THREE.MeshStandardMaterial({
      map: textures.bannerSecondary,
      roughness: 0.5,
      metalness: 0.05,
    });
    disposables.push(wallSignGeo, wallSignMat);
    const wallSign = new THREE.Mesh(wallSignGeo, wallSignMat);
    wallSign.position.set(-6.5, 1.35, 0.4);
    gsGroup.add(wallSign);

    // South Retaining Wall + Fence (z = +21.4, width 53.8m — behind Home camera, closes front side!)
    const sWall = new THREE.Mesh(nWallGeo, wallNavyMat);
    sWall.position.set(0, 1.175, 21.4);
    sWall.castShadow = true;
    sWall.receiveShadow = true;
    root.add(sWall);

    const sCap = new THREE.Mesh(nWallCapGeo, flowCyanMat);
    sCap.position.set(0, 2.38, 21.4);
    root.add(sCap);

    // Inner-facing banner on South Wall
    const southBanner = new THREE.Mesh(wallSignGeo, wallSignMat);
    southBanner.position.set(0, 1.35, 20.98);
    southBanner.rotation.y = Math.PI;
    root.add(southBanner);

    // West & East Side Walls (x = -26.5 and x = +26.5, z from -12.5 to +21.4 -> length 34.6m, center z = 4.45)
    const sideWallGeo = new THREE.BoxGeometry(0.75, 2.35, 34.6);
    const sideCapGeo = new THREE.BoxGeometry(0.88, 0.14, 34.8);
    const sideRailGeo = new THREE.CylinderGeometry(0.035, 0.035, 34.2, 8);
    sideRailGeo.rotateX(Math.PI / 2);
    const sideFenceGeo = new THREE.PlaneGeometry(34.2, 1.1);
    const fencePostGeo = new THREE.CylinderGeometry(0.038, 0.038, 1.25, 8);
    disposables.push(sideWallGeo, sideCapGeo, sideRailGeo, sideFenceGeo, fencePostGeo);

    for (const sx of [-26.5, 26.5]) {
      const sideWall = new THREE.Mesh(sideWallGeo, wallNavyMat);
      sideWall.position.set(sx, 1.175, 4.45);
      sideWall.castShadow = true;
      sideWall.receiveShadow = true;
      root.add(sideWall);

      const sideCap = new THREE.Mesh(sideCapGeo, flowCyanMat);
      sideCap.position.set(sx, 2.38, 4.45);
      root.add(sideCap);

      // Top safety handrail & translucent steel screen atop West & East walls
      const topRail = new THREE.Mesh(sideRailGeo, copingSteelMat);
      topRail.position.set(sx, 3.55, 4.45);
      root.add(topRail);

      const midRail = new THREE.Mesh(sideRailGeo, darkSteelMat);
      midRail.position.set(sx, 2.98, 4.45);
      root.add(midRail);

      const screen = new THREE.Mesh(sideFenceGeo, fenceMeshMat);
      screen.position.set(sx, 3.0, 4.45);
      screen.rotation.y = Math.PI / 2;
      root.add(screen);

      for (let fz = -11; fz <= 20; fz += 5.2) {
        const post = new THREE.Mesh(fencePostGeo, darkSteelMat);
        post.position.set(sx, 3.0, fz);
        root.add(post);
      }

      // Side Banners facing inward
      const sideSign = new THREE.Mesh(wallSignGeo, signMat);
      sideSign.position.set(sx + (sx < 0 ? 0.42 : -0.42), 1.35, 4.5);
      sideSign.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2;
      root.add(sideSign);
    }

    // North & South Top Safety Handrail Fence atop walls
    const nsRailGeo = new THREE.CylinderGeometry(0.035, 0.035, 53.0, 8);
    nsRailGeo.rotateZ(Math.PI / 2);
    const nsScreenGeo = new THREE.PlaneGeometry(53.0, 1.1);
    disposables.push(nsRailGeo, nsScreenGeo);

    for (const [rz, screenRot] of [
      [21.4, 0],
      [-12.5, Math.PI],
    ] as [number, number][]) {
      const topR = new THREE.Mesh(nsRailGeo, copingSteelMat);
      topR.position.set(0, 3.55, rz);
      root.add(topR);

      const screen = new THREE.Mesh(nsScreenGeo, fenceMeshMat);
      screen.position.set(0, 3.0, rz);
      screen.rotation.y = screenRot;
      root.add(screen);

      for (let fx = -24; fx <= 24; fx += 6) {
        const post = new THREE.Mesh(fencePostGeo, darkSteelMat);
        post.position.set(fx, 3.0, rz);
        root.add(post);
      }
    }

    // Scenic Concrete Planters inside East & West Perimeter Corners
    const planterBoxGeo = new THREE.BoxGeometry(2.4, 0.45, 2.4);
    const planterSoilGeo = new THREE.BoxGeometry(2.1, 0.1, 2.1);
    const shrubGeo = new THREE.SphereGeometry(0.55, 10, 8);
    disposables.push(planterBoxGeo, planterSoilGeo, shrubGeo);

    for (const [px, pz] of [
      [-23.8, -9.8],
      [23.8, -9.8],
      [-23.8, 18.6],
      [23.8, 18.6],
    ]) {
      const box = new THREE.Mesh(planterBoxGeo, rampConcreteMat);
      box.position.set(px, 0.225, pz);
      box.castShadow = true;
      box.receiveShadow = true;
      root.add(box);

      const turf = new THREE.Mesh(planterSoilGeo, grassMat);
      turf.position.set(px, 0.46, pz);
      root.add(turf);

      const shrub = new THREE.Mesh(shrubGeo, palmLeafMat);
      shrub.position.set(px, 0.72, pz);
      shrub.scale.set(1.2, 0.75, 1.2);
      shrub.castShadow = true;
      root.add(shrub);
    }
  };

  buildEnclosedPerimeterAndGrandstands();

  // --- 7. Rounded Smooth Crew & Spectators (Shared materials & geometries for high FPS!) ---
  const sharedSkinMat = new THREE.MeshStandardMaterial({ color: 0xdca57d, roughness: 0.62 });
  const sharedHairMat = new THREE.MeshStandardMaterial({
    color: 0x1e1815,
    bumpMap: textures.hatBump,
    bumpScale: 0.006,
    roughness: 0.82,
  });
  const sharedShoeMat = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb,
    map: textures.shoeTexture,
    bumpMap: textures.shoeBump,
    bumpScale: 0.007,
    roughness: 0.74,
  });
  const sharedContactMat = new THREE.MeshBasicMaterial({
    map: textures.contactShadow,
    transparent: true,
    depthWrite: false,
    opacity: 0.72,
  });
  const npcLegStandGeo = new THREE.CapsuleGeometry(0.058, 0.6, 6, 12);
  const npcLegSeatGeo = new THREE.CapsuleGeometry(0.058, 0.28, 6, 12);
  const npcTorsoGeo = new THREE.CapsuleGeometry(0.14, 0.22, 8, 14);
  npcTorsoGeo.scale(1.06, 1.0, 0.68);
  const npcArmGeo = new THREE.CapsuleGeometry(0.042, 0.3, 6, 10);
  const npcHeadGeo = new THREE.SphereGeometry(0.102, 16, 12);
  npcHeadGeo.scale(0.95, 1.08, 0.98);
  const npcCapGeo = new THREE.SphereGeometry(0.108, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56);
  const npcShoeGeo = new THREE.CapsuleGeometry(0.046, 0.1, 6, 10);
  npcShoeGeo.rotateX(Math.PI / 2);
  npcShoeGeo.scale(1.0, 0.68, 1.0);
  const npcShadowGeo = new THREE.PlaneGeometry(0.78, 0.78);
  npcShadowGeo.rotateX(-Math.PI / 2);

  disposables.push(
    sharedSkinMat,
    sharedHairMat,
    sharedShoeMat,
    sharedContactMat,
    npcLegStandGeo,
    npcLegSeatGeo,
    npcTorsoGeo,
    npcArmGeo,
    npcHeadGeo,
    npcCapGeo,
    npcShoeGeo,
    npcShadowGeo,
  );

  const shirtPaletteMats = new Map<number, THREE.MeshStandardMaterial>();
  const pantsPaletteMats = new Map<number, THREE.MeshStandardMaterial>();
  const getShirtMat = (hex: number) => {
    let m = shirtPaletteMats.get(hex);
    if (!m) {
      m = new THREE.MeshStandardMaterial({
        color: hex,
        map: textures.shirtTexture,
        bumpMap: textures.shirtBump,
        bumpScale: 0.008,
        roughness: 0.84,
      });
      shirtPaletteMats.set(hex, m);
      disposables.push(m);
    }
    return m;
  };
  const getPantsMat = (hex: number) => {
    let m = pantsPaletteMats.get(hex);
    if (!m) {
      m = new THREE.MeshStandardMaterial({
        color: hex,
        map: textures.pantsTexture,
        bumpMap: textures.pantsBump,
        bumpScale: 0.012,
        roughness: 0.88,
      });
      pantsPaletteMats.set(hex, m);
      disposables.push(m);
    }
    return m;
  };

  const addStylizedPerson = (
    px: number,
    py: number,
    pz: number,
    rotY: number,
    shirtHex: number,
    pantsHex: number,
    seated = false,
    phase = 0,
  ) => {
    const pGroup = new THREE.Group();
    pGroup.position.set(px, py, pz);
    pGroup.rotation.y = rotY;
    root.add(pGroup);

    const shirtM = getShirtMat(shirtHex);
    const pantsM = getPantsMat(pantsHex);

    const legY = seated ? 0.24 : 0.42;
    const lGeo = seated ? npcLegSeatGeo : npcLegStandGeo;
    for (const sx of [-0.085, 0.085]) {
      const leg = new THREE.Mesh(lGeo, pantsM);
      leg.position.set(sx, legY, seated ? 0.12 : 0);
      if (seated) leg.rotation.x = -0.35;
      leg.castShadow = !seated;
      pGroup.add(leg);

      const shoe = new THREE.Mesh(npcShoeGeo, sharedShoeMat);
      shoe.position.set(sx, 0.036, seated ? 0.24 : 0.035);
      pGroup.add(shoe);
    }

    const torsoY = seated ? 0.58 : 0.98;
    const torso = new THREE.Mesh(npcTorsoGeo, shirtM);
    torso.position.y = torsoY;
    torso.castShadow = !seated;
    pGroup.add(torso);

    for (const sx of [-0.19, 0.19]) {
      const arm = new THREE.Mesh(npcArmGeo, shirtM);
      arm.position.set(sx, torsoY - 0.02, 0);
      arm.rotation.z = sx > 0 ? 0.12 : -0.12;
      arm.castShadow = !seated;
      pGroup.add(arm);
    }

    const head = new THREE.Group();
    head.position.set(0, torsoY + 0.35, 0);
    pGroup.add(head);

    const headMesh = new THREE.Mesh(npcHeadGeo, sharedSkinMat);
    headMesh.castShadow = !seated;
    head.add(headMesh);

    const cap = new THREE.Mesh(npcCapGeo, sharedHairMat);
    cap.rotation.x = -0.16;
    cap.position.y = 0.015;
    head.add(cap);

    if (!seated) {
      const cs = new THREE.Mesh(npcShadowGeo, sharedContactMat);
      cs.position.y = 0.01;
      pGroup.add(cs);
    }

    animatedPeople.push({ group: pGroup, head, phase });
  };

  const buildUmbrellaAndCrew = () => {
    const ux = 2.65;
    const uz = -1.65;

    const poleGeo = new THREE.CylinderGeometry(0.035, 0.04, 2.75, 10);
    disposables.push(poleGeo);
    const pole = new THREE.Mesh(poleGeo, darkSteelMat);
    pole.position.set(ux, 1.375, uz);
    pole.castShadow = true;
    root.add(pole);

    const canopySegments = 16;
    const coneGeo = new THREE.ConeGeometry(1.55, 0.42, canopySegments, 1, false);
    disposables.push(coneGeo);
    const umbrellaTop = new THREE.Mesh(coneGeo, umbrellaMat);
    umbrellaTop.position.set(ux, 2.75, uz);
    umbrellaTop.castShadow = true;
    root.add(umbrellaTop);

    const trimGeo = new THREE.TorusGeometry(1.53, 0.025, 8, canopySegments);
    trimGeo.rotateX(Math.PI / 2);
    disposables.push(trimGeo);
    const trim = new THREE.Mesh(trimGeo, whitePaintMat);
    trim.position.set(ux, 2.55, uz);
    root.add(trim);

    const benchSeatGeo = new THREE.BoxGeometry(1.65, 0.08, 0.48);
    const benchLegGeo = new THREE.BoxGeometry(0.08, 0.42, 0.44);
    disposables.push(benchSeatGeo, benchLegGeo);
    const bench = new THREE.Group();
    bench.position.set(ux + 1.35, 0, uz + 0.35);
    bench.rotation.y = -0.35;
    root.add(bench);

    const seat = new THREE.Mesh(benchSeatGeo, woodBenchMat);
    seat.position.y = 0.44;
    seat.castShadow = true;
    seat.receiveShadow = true;
    bench.add(seat);

    for (const bx of [-0.66, 0.66]) {
      const leg = new THREE.Mesh(benchLegGeo, darkSteelMat);
      leg.position.set(bx, 0.21, 0);
      leg.castShadow = true;
      bench.add(leg);
    }

    addStylizedPerson(ux - 0.85, 0, uz - 0.15, 0.32, 0xd97706, 0x1e293b, false, 0.4);
    addStylizedPerson(ux - 0.18, 0, uz + 0.18, -0.15, 0xc81e3a, 0x1f2937, false, 1.7);
    addStylizedPerson(ux + 0.52, 0, uz - 0.12, -0.45, 0x1e293b, 0x334155, false, 2.9);

    addStylizedPerson(-7.5, 2.72, -13.6, 0.1, 0x0284c7, 0x1e293b, true, 0.9);
    addStylizedPerson(-4.8, 3.27, -14.55, 0.05, 0xe11d48, 0x334155, true, 2.1);
    addStylizedPerson(-1.4, 2.72, -13.6, -0.08, 0xf59e0b, 0x1e293b, true, 3.4);
    addStylizedPerson(2.2, 3.82, -15.5, -0.15, 0x10b981, 0x1f2937, true, 1.2);
    addStylizedPerson(5.4, 3.27, -14.55, -0.2, 0x38bdf8, 0x0f172a, true, 4.0);
  };

  buildUmbrellaAndCrew();

  // --- 8. Palm Trees, Floodlights & Urban Skyline ---
  const segGeo = new THREE.CylinderGeometry(0.14, 0.19, 1.05, 8);
  const frondGeo = new THREE.ConeGeometry(0.45, 2.6, 5);
  frondGeo.scale(1.2, 1, 0.14);
  frondGeo.translate(0, 1.3, 0);
  disposables.push(segGeo, frondGeo);

  const buildPalmTree = (tx: number, tz: number, scale = 1, lean = 0.08) => {
    const palm = new THREE.Group();
    palm.position.set(tx, 0, tz);
    palm.scale.setScalar(scale);
    root.add(palm);

    let cy = 0.48;
    let cx = 0;
    for (let i = 0; i < 6; i++) {
      const seg = new THREE.Mesh(segGeo, palmTrunkMat);
      seg.position.set(cx, cy, 0);
      seg.rotation.z = -lean * (i * 0.35);
      seg.scale.setScalar(1 - i * 0.06);
      seg.castShadow = true;
      palm.add(seg);
      cy += 0.94;
      cx += lean * (i * 0.12);
    }

    const crown = new THREE.Group();
    crown.position.set(cx, cy - 0.3, 0);
    palm.add(crown);

    for (let f = 0; f < 7; f++) {
      const frond = new THREE.Mesh(frondGeo, palmLeafMat);
      const angle = (f / 7) * Math.PI * 2;
      frond.rotation.order = 'YXZ';
      frond.rotation.y = angle;
      frond.rotation.x = 1.15 + (f % 2) * 0.22;
      frond.castShadow = true;
      crown.add(frond);
    }
  };

  buildPalmTree(8.8, -9.8, 1.15, 0.09);
  buildPalmTree(-14.2, -10.5, 1.05, -0.07);
  buildPalmTree(19.5, -13.5, 1.25, 0.06);
  buildPalmTree(-23.8, -9.8, 1.12, 0.08);
  buildPalmTree(23.8, -9.8, 1.18, -0.06);
  buildPalmTree(-23.8, 18.6, 1.1, 0.07);
  buildPalmTree(23.8, 18.6, 1.16, -0.08);

  const mastGeo = new THREE.CylinderGeometry(0.08, 0.13, 8.2, 8);
  const armGeo = new THREE.BoxGeometry(1.1, 0.14, 0.14);
  const headGeo = new THREE.BoxGeometry(0.65, 0.28, 0.22);
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0xfff8e7,
    emissive: 0xffdf8a,
    emissiveIntensity: 0.72,
    roughness: 0.2,
  });
  disposables.push(mastGeo, armGeo, headGeo, lensMat);

  const buildLightPole = (lx: number, lz: number, rotY: number) => {
    const poleGroup = new THREE.Group();
    poleGroup.position.set(lx, 0, lz);
    poleGroup.rotation.y = rotY;
    root.add(poleGroup);

    const mast = new THREE.Mesh(mastGeo, darkSteelMat);
    mast.position.y = 4.1;
    mast.castShadow = true;
    poleGroup.add(mast);

    const arm = new THREE.Mesh(armGeo, darkSteelMat);
    arm.position.set(0.45, 8.1, 0);
    poleGroup.add(arm);

    const head = new THREE.Mesh(headGeo, lensMat);
    head.position.set(0.9, 8.05, 0);
    head.rotation.z = -0.35;
    poleGroup.add(head);
  };

  buildLightPole(-15.5, -12.0, 0.4);
  buildLightPole(14.5, -12.0, -0.45);
  buildLightPole(-26.2, 14.5, 0.25);
  buildLightPole(26.2, 14.5, Math.PI - 0.25);

  const buildHorizonBackdrop = () => {
    const citySpecs = [
      [-32, -42, 7, 11, 7],
      [-20, -46, 6, 15, 6],
      [18, -48, 8, 13, 7],
      [32, -42, 7, 9, 6],
      [44, -34, 9, 14, 8],
      [-44, -34, 8, 10, 7],
    ];
    citySpecs.forEach(([x, z, w, h, d]) => {
      const bGeo = new THREE.BoxGeometry(w, h, d);
      disposables.push(bGeo);
      const bMesh = new THREE.Mesh(bGeo, cityBlockMat);
      bMesh.position.set(x, h / 2 - 0.1, z);
      root.add(bMesh);
    });

    const fwGroup = new THREE.Group();
    fwGroup.position.set(-2.5, 9.5, -38);
    root.add(fwGroup);

    const rimGeo = new THREE.TorusGeometry(6.8, 0.14, 8, 28);
    const spokeGeo = new THREE.CylinderGeometry(0.05, 0.05, 13.6, 6);
    const fwMat = new THREE.MeshStandardMaterial({
      color: 0xe6decb,
      roughness: 0.5,
      metalness: 0.4,
    });
    disposables.push(rimGeo, spokeGeo, fwMat);

    fwGroup.add(new THREE.Mesh(rimGeo, fwMat));

    for (let s = 0; s < 6; s++) {
      const spoke = new THREE.Mesh(spokeGeo, fwMat);
      spoke.rotation.z = (s / 6) * Math.PI;
      fwGroup.add(spoke);
    }

    fwGroup.name = 'FerrisWheel';
  };

  buildHorizonBackdrop();

  const ferrisWheel = root.getObjectByName('FerrisWheel');

  const update = (elapsed: number) => {
    if (ferrisWheel) {
      ferrisWheel.rotation.z = elapsed * 0.04;
    }

    // Subtle organic sun corona shimmer
    const pulse = 1 + Math.sin(elapsed * 1.4) * 0.03;
    sunCoronaInner.scale.set(28 * pulse, 28 * pulse, 1);

    for (let i = 0; i < animatedPeople.length; i++) {
      const p = animatedPeople[i];
      p.head.rotation.y = Math.sin(elapsed * 0.7 + p.phase) * 0.16;
      p.head.rotation.x = Math.sin(elapsed * 1.1 + p.phase) * 0.04;
    }
  };

  const dispose = () => {
    disposables.forEach((d) => d.dispose());
  };

  return {
    group: root,
    update,
    dispose,
  };
}
