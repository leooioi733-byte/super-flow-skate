import * as THREE from 'three';
import {
  BearingFinishId,
  DeckShapeId,
  GarageConfig,
  SkaterVisualModel,
  TruckFinishId,
  WheelSizeId,
} from '../types/game';
import { SkaterAnimState } from './skatePhysics';
import { ProceduralTextureSet } from './textures';

export interface HeroSkaterHandle {
  group: THREE.Group;
  skateboardGroup: THREE.Group;
  headGroup: THREE.Group;
  applyConfig: (config: GarageConfig) => void;
  setFirstPersonView: (isFirstPerson: boolean) => void;
  update: (elapsed: number) => void;
  updateGameplay: (anim: SkaterAnimState, dt: number) => void;
  dispose: () => void;
}

function getTruckFinishProps(finish: TruckFinishId): {
  color: number;
  metalness: number;
  roughness: number;
} {
  switch (finish) {
    case 'matte_black':
      return { color: 0x1e242b, metalness: 0.45, roughness: 0.48 };
    case 'anodized_teal':
      return { color: 0x1697b5, metalness: 0.85, roughness: 0.25 };
    case 'gold':
      return { color: 0xd9a74a, metalness: 0.92, roughness: 0.2 };
    case 'chrome':
    default:
      return { color: 0xd4dbe2, metalness: 0.94, roughness: 0.16 };
  }
}

function getBearingColorHex(finish: BearingFinishId | undefined): number {
  switch (finish) {
    case 'gold_ceramic':
      return 0xfacc15;
    case 'cyan_swiss':
      return 0x22d3ee;
    case 'crimson_pro':
      return 0xef4444;
    case 'steel':
    default:
      return 0xe2e8f0;
  }
}

function getWheelRadius(size: WheelSizeId | undefined): number {
  switch (size) {
    case 'street_52':
      return 0.025;
    case 'cruiser_60':
      return 0.032;
    case 'park_56':
    default:
      return 0.028;
  }
}

function createCapsuleLimbGeometry(radius: number, straightLength: number): THREE.BufferGeometry {
  const geo = new THREE.CapsuleGeometry(radius, straightLength, 8, 16);
  geo.translate(0, -(straightLength / 2 + radius * 0.4), 0);
  return geo;
}

function createSkateboardDeckGeometry(deckShape: DeckShapeId = 'street_popsicle'): THREE.BufferGeometry {
  const halfW = deckShape === 'wide_pool' ? 0.128 : deckShape === 'cruiser_shaped' ? 0.118 : 0.112;
  const halfLen = deckShape === 'cruiser_shaped' ? 0.375 : 0.395;

  const shape = new THREE.Shape();
  if (deckShape === 'cruiser_shaped') {
    shape.moveTo(-halfW * 0.84, -halfLen + 0.08);
    shape.lineTo(-halfW, 0.06);
    shape.quadraticCurveTo(-halfW, halfLen, 0, halfLen + 0.02);
    shape.quadraticCurveTo(halfW, halfLen, halfW, 0.06);
    shape.lineTo(halfW * 0.84, -halfLen + 0.08);
    shape.quadraticCurveTo(halfW * 0.86, -halfLen, 0, -halfLen + 0.02);
    shape.quadraticCurveTo(-halfW * 0.86, -halfLen, -halfW * 0.84, -halfLen + 0.08);
  } else {
    shape.moveTo(-halfW, -halfLen + 0.11);
    shape.lineTo(-halfW, halfLen - 0.11);
    shape.quadraticCurveTo(-halfW, halfLen, 0, halfLen);
    shape.quadraticCurveTo(halfW, halfLen, halfW, halfLen - 0.11);
    shape.lineTo(halfW, -halfLen + 0.11);
    shape.quadraticCurveTo(halfW, -halfLen, 0, -halfLen);
    shape.quadraticCurveTo(-halfW, -halfLen, -halfW, -halfLen + 0.11);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.013,
    bevelEnabled: true,
    bevelThickness: 0.0025,
    bevelSize: 0.0025,
    bevelSegments: 2,
    curveSegments: 16,
  });

  geo.rotateX(Math.PI / 2);
  const pos = geo.attributes.position;
  const uvs = geo.attributes.uv;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const concave = (x / halfW) * (x / halfW) * 0.007;
    let kick = 0;
    const absZ = Math.abs(z);
    if (absZ > 0.23) {
      const t = (absZ - 0.23) / (halfLen - 0.23);
      kick = Math.pow(t, 1.45) * 0.052;
    }

    pos.setY(i, y + concave + kick);

    const u = (x + halfW) / (halfW * 2);
    const v = (z + halfLen) / (halfLen * 2);
    uvs.setXY(i, THREE.MathUtils.clamp(u, 0, 1), THREE.MathUtils.clamp(v, 0, 1));
  }

  geo.computeVertexNormals();
  return geo;
}

export interface SkaterBuildOptions {
  skinColor?: string;
  hairColor?: string;
  isNpc?: boolean;
  visualModel?: SkaterVisualModel;
}

export function buildHeroSkaterAndBoard(
  textures: ProceduralTextureSet,
  initialConfig: GarageConfig,
  options?: SkaterBuildOptions,
): HeroSkaterHandle {
  const isNpc = options?.isNpc === true;
  const vm: SkaterVisualModel | undefined = options?.visualModel;
  const stanceSign = vm?.stance === 'goofy' ? -1 : 1;
  const castMainShadow = true;
  const castMinorShadow = !isNpc;
  const disposables: Array<{ dispose: () => void }> = [];
  const root = new THREE.Group();
  root.name = isNpc ? 'NpcSkaterRoot' : 'HeroSkaterRoot';

  // --- Shared Stylized PBR / Physical Materials ---
  const skinMat = new THREE.MeshStandardMaterial({
    color: options?.skinColor ? new THREE.Color(options.skinColor) : 0xe3af88,
    map: textures.skinTexture,
    roughness: 0.56,
    metalness: 0.02,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: options?.hairColor ? new THREE.Color(options.hairColor) : 0x261c16,
    bumpMap: textures.hatBump,
    bumpScale: 0.01,
    roughness: 0.82,
    metalness: 0.02,
  });
  const shirtMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(initialConfig.shirtColor),
    map: textures.shirtTexture,
    bumpMap: textures.shirtBump,
    bumpScale: 0.018,
    roughness: 0.84,
    metalness: 0.02,
    sheen: 0.45,
    sheenRoughness: 0.72,
    sheenColor: new THREE.Color(0xffffff),
  });
  const shirtAccentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialConfig.shirtAccent),
    bumpMap: textures.shirtBump,
    bumpScale: 0.012,
    roughness: 0.76,
    metalness: 0.03,
  });
  const pantsMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(initialConfig.pantsColor),
    map: textures.pantsTexture,
    bumpMap: textures.pantsBump,
    bumpScale: 0.024,
    roughness: 0.88,
    metalness: 0.02,
    sheen: 0.35,
    sheenRoughness: 0.8,
  });
  const beltMat = new THREE.MeshPhysicalMaterial({
    color: 0x161a20,
    roughness: 0.4,
    metalness: 0.3,
    clearcoat: 0.35,
  });
  const shoeUpperMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialConfig.shoeColor),
    map: textures.shoeTexture,
    bumpMap: textures.shoeBump,
    bumpScale: 0.016,
    roughness: 0.72,
    metalness: 0.04,
  });
  const shoeSoleMat = new THREE.MeshStandardMaterial({
    color: 0xf1ede4,
    bumpMap: textures.shoeBump,
    bumpScale: 0.01,
    roughness: 0.82,
    metalness: 0.0,
  });
  const shoeAccentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialConfig.shoeAccent ?? '#1997b3'),
    bumpMap: textures.shoeBump,
    bumpScale: 0.012,
    roughness: 0.58,
    metalness: 0.06,
  });
  const hatMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialConfig.hatColor),
    bumpMap: textures.hatBump,
    bumpScale: 0.018,
    roughness: 0.82,
    metalness: 0.02,
  });
  const hatBrimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(vm?.secondaryColor ?? initialConfig.shirtAccent ?? '#1892ae'),
    bumpMap: textures.hatBump,
    bumpScale: 0.014,
    roughness: 0.68,
    metalness: 0.05,
  });

  // Skateboard Physical Materials
  const gripMat = new THREE.MeshStandardMaterial({
    map: textures.griptapeVariants[initialConfig.gripStyle ?? 'classic_black'],
    bumpMap: textures.griptapeBump,
    bumpScale: 0.014,
    roughness: 0.94,
    metalness: 0.02,
  });
  const deckGraphicMat = new THREE.MeshPhysicalMaterial({
    map: textures.deckGraphics[initialConfig.deckGraphic],
    roughness: 0.28,
    metalness: 0.06,
    clearcoat: 0.92,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.55,
  });
  const woodEdgeMat = new THREE.MeshStandardMaterial({
    map: textures.woodDeckEdge,
    bumpMap: textures.woodBump,
    bumpScale: 0.008,
    roughness: 0.56,
    metalness: 0.02,
  });
  const truckProps = getTruckFinishProps(initialConfig.truckFinish);
  const truckMat = new THREE.MeshPhysicalMaterial({
    color: truckProps.color,
    metalness: truckProps.metalness,
    roughness: truckProps.roughness,
    bumpMap: textures.metalScratchBump,
    bumpScale: 0.005,
    anisotropy: 0.72,
    envMapIntensity: 2.0,
  });
  const bushingMat = new THREE.MeshPhysicalMaterial({
    color: 0x0ea5e9,
    roughness: 0.3,
    metalness: 0.05,
    clearcoat: 0.65,
    clearcoatRoughness: 0.2,
  });
  const wheelMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(initialConfig.wheelColor),
    roughness: 0.3,
    metalness: 0.04,
    clearcoat: 0.7,
    clearcoatRoughness: 0.22,
    envMapIntensity: 1.4,
  });
  const bearingMat = new THREE.MeshPhysicalMaterial({
    color: getBearingColorHex(initialConfig.bearingFinish),
    metalness: 0.95,
    roughness: 0.14,
    envMapIntensity: 2.0,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(vm?.secondaryColor ?? initialConfig.shirtAccent),
    roughness: 0.62,
    metalness: 0.1,
  });
  const accessoryDarkMat = new THREE.MeshPhysicalMaterial({
    color: 0x111827,
    roughness: 0.34,
    metalness: 0.35,
    clearcoat: 0.6,
  });
  const accessoryBrightMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialConfig.sockColor ?? '#f1f5f9'),
    roughness: 0.45,
    metalness: 0.2,
  });

  disposables.push(
    skinMat,
    hairMat,
    shirtMat,
    shirtAccentMat,
    secondaryMat,
    accessoryDarkMat,
    accessoryBrightMat,
    pantsMat,
    beltMat,
    shoeUpperMat,
    shoeSoleMat,
    shoeAccentMat,
    hatMat,
    hatBrimMat,
    gripMat,
    deckGraphicMat,
    woodEdgeMat,
    truckMat,
    bushingMat,
    wheelMat,
    bearingMat,
  );

  // --- Rounded Character Hierarchy (Bottom-Center Pivot at Y=0) ---
  const skaterBody = new THREE.Group();
  const buildType = vm?.bodyBuild ?? 'athletic';
  const bodyScaleX =
    buildType === 'slim' ? 0.91 : buildType === 'stocky' ? 1.12 : buildType === 'tall' ? 0.96 : 1.0;
  const bodyScaleY =
    buildType === 'tall' ? 1.06 : buildType === 'slim' ? 0.98 : buildType === 'stocky' ? 0.97 : 1.0;
  skaterBody.scale.set(bodyScaleX, bodyScaleY, bodyScaleX);
  root.add(skaterBody);

  const hips = new THREE.Group();
  hips.position.set(0, 0.92, 0);
  skaterBody.add(hips);

  const pelvisGeo = new THREE.SphereGeometry(0.145, 20, 14);
  pelvisGeo.scale(1.06, 0.65, 0.74);
  disposables.push(pelvisGeo);
  const pelvisMesh = new THREE.Mesh(pelvisGeo, pantsMat);
  pelvisMesh.castShadow = true;
  pelvisMesh.receiveShadow = true;
  hips.add(pelvisMesh);

  const beltGeo = new THREE.TorusGeometry(0.132, 0.022, 10, 24);
  beltGeo.rotateX(Math.PI / 2);
  beltGeo.scale(1.08, 1, 0.74);
  disposables.push(beltGeo);
  const beltMesh = new THREE.Mesh(beltGeo, beltMat);
  beltMesh.position.y = 0.045;
  beltMesh.castShadow = castMinorShadow;
  hips.add(beltMesh);

  const bottomStyle = vm?.bottomStyle ?? 'baggy_jeans';
  const thighRadius =
    bottomStyle === 'baggy_jeans' ? 0.08 : bottomStyle === 'slim_chinos' ? 0.064 : 0.072;
  const shinRadius =
    bottomStyle === 'baggy_jeans' ? 0.073 : bottomStyle === 'slim_chinos' ? 0.056 : 0.064;

  const buildLeg = (side: -1 | 1) => {
    const hipJoint = new THREE.Group();
    hipJoint.position.set(side * 0.092, -0.03, 0);
    hips.add(hipJoint);

    const thighGeo = createCapsuleLimbGeometry(thighRadius, 0.3);
    disposables.push(thighGeo);
    const thigh = new THREE.Mesh(thighGeo, pantsMat);
    thigh.castShadow = true;
    thigh.receiveShadow = true;
    hipJoint.add(thigh);

    // Cargo pocket on outer thigh
    if (bottomStyle === 'cargo_pants') {
      const pocketGeo = new THREE.BoxGeometry(0.034, 0.12, 0.088);
      disposables.push(pocketGeo);
      const pocket = new THREE.Mesh(pocketGeo, pantsMat);
      pocket.position.set(side * (thighRadius - 0.004), -0.19, 0.005);
      pocket.castShadow = castMinorShadow;
      hipJoint.add(pocket);
    }

    const kneeJoint = new THREE.Group();
    kneeJoint.position.set(0, -0.4, 0);
    hipJoint.add(kneeJoint);

    if (bottomStyle === 'skate_shorts') {
      // Upper short hem + exposed lower leg + athletic crew sock!
      const shortHemGeo = createCapsuleLimbGeometry(thighRadius * 0.94, 0.09);
      const bareShinGeo = createCapsuleLimbGeometry(0.048, 0.25);
      const sockGeo = new THREE.CylinderGeometry(0.051, 0.049, 0.13, 14);
      disposables.push(shortHemGeo, bareShinGeo, sockGeo);

      const shortHem = new THREE.Mesh(shortHemGeo, pantsMat);
      shortHem.castShadow = true;
      kneeJoint.add(shortHem);

      const bareShin = new THREE.Mesh(bareShinGeo, skinMat);
      bareShin.position.y = -0.05;
      bareShin.castShadow = true;
      bareShin.receiveShadow = true;
      kneeJoint.add(bareShin);

      const sock = new THREE.Mesh(sockGeo, accessoryBrightMat);
      sock.position.y = -0.32;
      sock.castShadow = castMinorShadow;
      kneeJoint.add(sock);
    } else {
      const shinGeo = createCapsuleLimbGeometry(shinRadius, 0.29);
      disposables.push(shinGeo);
      const shin = new THREE.Mesh(shinGeo, pantsMat);
      shin.castShadow = true;
      shin.receiveShadow = true;
      kneeJoint.add(shin);

      const cuffGeo = new THREE.TorusGeometry(shinRadius * 0.96, 0.016, 10, 18);
      cuffGeo.rotateX(Math.PI / 2);
      disposables.push(cuffGeo);
      const cuff = new THREE.Mesh(cuffGeo, pantsMat);
      cuff.position.y = -0.36;
      cuff.castShadow = castMinorShadow;
      kneeJoint.add(cuff);
    }

    // Pro Knee Pads
    if (vm?.accessory === 'knee_pads') {
      const padCapGeo = new THREE.SphereGeometry(0.068, 12, 10, 0, Math.PI, 0, Math.PI * 0.7);
      padCapGeo.scale(1.0, 1.15, 0.72);
      const padStrapGeo = new THREE.TorusGeometry(0.066, 0.012, 8, 16);
      padStrapGeo.rotateX(Math.PI / 2);
      disposables.push(padCapGeo, padStrapGeo);

      const padCap = new THREE.Mesh(padCapGeo, accessoryDarkMat);
      padCap.position.set(0, -0.02, 0.036);
      padCap.castShadow = castMinorShadow;
      kneeJoint.add(padCap);

      const padStrap = new THREE.Mesh(padStrapGeo, secondaryMat);
      padStrap.position.set(0, -0.02, 0);
      kneeJoint.add(padStrap);
    }

    const footGroup = new THREE.Group();
    footGroup.position.set(0, -0.41, 0);
    kneeJoint.add(footGroup);

    const soleGeo = new THREE.CapsuleGeometry(0.052, 0.13, 8, 16);
    soleGeo.rotateX(Math.PI / 2);
    soleGeo.scale(1.0, 0.34, 1.0);
    disposables.push(soleGeo);
    const sole = new THREE.Mesh(soleGeo, shoeSoleMat);
    sole.position.set(0, -0.052, 0.045);
    sole.castShadow = castMinorShadow;
    sole.receiveShadow = true;
    footGroup.add(sole);

    const upperGeo = new THREE.CapsuleGeometry(0.048, 0.11, 8, 16);
    upperGeo.rotateX(Math.PI / 2);
    upperGeo.scale(0.98, 0.72, 1.0);
    disposables.push(upperGeo);
    const upper = new THREE.Mesh(upperGeo, shoeUpperMat);
    upper.position.set(0, -0.015, 0.036);
    upper.castShadow = castMainShadow;
    upper.receiveShadow = true;
    footGroup.add(upper);

    const toeGeo = new THREE.SphereGeometry(0.046, 14, 10);
    toeGeo.scale(0.98, 0.62, 1.15);
    disposables.push(toeGeo);
    const toe = new THREE.Mesh(toeGeo, shoeAccentMat);
    toe.position.set(0, -0.025, 0.105);
    toe.castShadow = castMinorShadow;
    footGroup.add(toe);

    return { hipJoint, kneeJoint, footGroup };
  };

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);

  const spine = new THREE.Group();
  spine.position.set(0, 0.07, 0);
  hips.add(spine);

  const topStyle = vm?.topStyle ?? 'tee';
  const torsoRadius = topStyle === 'hoodie' || topStyle === 'windbreaker' ? 0.168 : 0.155;
  const torsoGeo = new THREE.CapsuleGeometry(torsoRadius, 0.22, 10, 22);
  torsoGeo.scale(1.08, 1.0, 0.68);
  disposables.push(torsoGeo);
  const torso = new THREE.Mesh(torsoGeo, shirtMat);
  torso.position.y = 0.23;
  torso.castShadow = true;
  torso.receiveShadow = true;
  spine.add(torso);

  const collarGeo = new THREE.TorusGeometry(0.074, 0.016, 10, 22);
  collarGeo.rotateX(Math.PI / 2);
  disposables.push(collarGeo);
  const collar = new THREE.Mesh(collarGeo, shirtAccentMat);
  collar.position.set(0, 0.455, 0.008);
  spine.add(collar);

  const hemGeo = new THREE.TorusGeometry(torsoRadius * 0.92, 0.015, 10, 24);
  hemGeo.rotateX(Math.PI / 2);
  hemGeo.scale(1.08, 1, 0.7);
  disposables.push(hemGeo);
  const hem = new THREE.Mesh(hemGeo, shirtAccentMat);
  hem.position.y = 0.035;
  spine.add(hem);

  // Top-specific silhouette variations (Hoodie hood/pocket, Windbreaker stripe/high collar, Overshirt panels)
  if (topStyle === 'hoodie') {
    const hoodGeo = new THREE.SphereGeometry(0.11, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.65);
    hoodGeo.scale(1.08, 0.78, 0.95);
    const pocketGeo = new THREE.BoxGeometry(0.19, 0.11, 0.045);
    disposables.push(hoodGeo, pocketGeo);

    const hood = new THREE.Mesh(hoodGeo, shirtMat);
    hood.position.set(0, 0.43, -0.095);
    hood.rotation.x = 0.62;
    hood.castShadow = castMinorShadow;
    spine.add(hood);

    const kPocket = new THREE.Mesh(pocketGeo, shirtAccentMat);
    kPocket.position.set(0, 0.11, 0.11);
    spine.add(kPocket);
  } else if (topStyle === 'windbreaker') {
    const highCollarGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.075, 16, 1, true);
    const stripeGeo = new THREE.BoxGeometry(0.32, 0.055, 0.232);
    disposables.push(highCollarGeo, stripeGeo);

    const highCollar = new THREE.Mesh(highCollarGeo, shirtAccentMat);
    highCollar.position.set(0, 0.46, 0.008);
    spine.add(highCollar);

    const chestStripe = new THREE.Mesh(stripeGeo, secondaryMat);
    chestStripe.position.set(0, 0.28, 0.002);
    spine.add(chestStripe);
  } else if (topStyle === 'overshirt') {
    const panelGeo = new THREE.BoxGeometry(0.085, 0.36, 0.226);
    const lapelGeo = new THREE.BoxGeometry(0.055, 0.12, 0.04);
    disposables.push(panelGeo, lapelGeo);

    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(panelGeo, secondaryMat);
      panel.position.set(side * 0.102, 0.22, 0.004);
      panel.castShadow = castMinorShadow;
      spine.add(panel);

      const lapel = new THREE.Mesh(lapelGeo, secondaryMat);
      lapel.position.set(side * 0.068, 0.41, 0.075);
      lapel.rotation.z = side * -0.24;
      spine.add(lapel);
    }
  }

  // Torso-mounted accessories (Backpack or Chain)
  if (vm?.accessory === 'backpack') {
    const packGeo = new THREE.BoxGeometry(0.24, 0.31, 0.115);
    const packPocketGeo = new THREE.BoxGeometry(0.18, 0.14, 0.04);
    const strapGeo = new THREE.TorusGeometry(0.11, 0.012, 8, 16, Math.PI * 1.15);
    disposables.push(packGeo, packPocketGeo, strapGeo);

    const pack = new THREE.Mesh(packGeo, accessoryDarkMat);
    pack.position.set(0, 0.24, -0.155);
    pack.castShadow = castMinorShadow;
    spine.add(pack);

    const packPocket = new THREE.Mesh(packPocketGeo, secondaryMat);
    packPocket.position.set(0, 0.17, -0.215);
    spine.add(packPocket);

    for (const side of [-1, 1]) {
      const strap = new THREE.Mesh(strapGeo, accessoryDarkMat);
      strap.position.set(side * 0.1, 0.28, -0.02);
      strap.rotation.y = Math.PI / 2;
      spine.add(strap);
    }
  } else if (vm?.accessory === 'chain') {
    const chainGeo = new THREE.TorusGeometry(0.082, 0.009, 8, 20);
    chainGeo.rotateX(Math.PI * 0.42);
    disposables.push(chainGeo);
    const chain = new THREE.Mesh(chainGeo, truckMat);
    chain.position.set(0, 0.41, 0.045);
    spine.add(chain);
  }

  const neckGroup = new THREE.Group();
  neckGroup.position.set(0, 0.46, 0.01);
  spine.add(neckGroup);

  const neckGeo = new THREE.CylinderGeometry(0.046, 0.056, 0.09, 16);
  disposables.push(neckGeo);
  const neckMesh = new THREE.Mesh(neckGeo, skinMat);
  neckMesh.position.y = 0.035;
  neckMesh.castShadow = true;
  neckGroup.add(neckMesh);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.17, 0.01);
  neckGroup.add(headGroup);

  const faceModel = vm?.faceModel ?? 'classic';
  const craniumGeo = new THREE.SphereGeometry(0.108, 24, 20);
  if (faceModel === 'angular') {
    craniumGeo.scale(0.89, 1.12, 0.95);
  } else if (faceModel === 'broad') {
    craniumGeo.scale(1.03, 1.04, 1.0);
  } else if (faceModel === 'youth') {
    craniumGeo.scale(0.95, 1.02, 1.0);
  } else {
    craniumGeo.scale(0.94, 1.08, 0.98);
  }
  disposables.push(craniumGeo);
  const cranium = new THREE.Mesh(craniumGeo, skinMat);
  cranium.castShadow = true;
  cranium.receiveShadow = true;
  headGroup.add(cranium);

  const earGeo = new THREE.SphereGeometry(0.024, 10, 10);
  earGeo.scale(0.55, 1.15, 0.8);
  disposables.push(earGeo);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, skinMat);
    ear.position.set(side * 0.098, -0.005, -0.005);
    headGroup.add(ear);
  }

  // Distinct Hairstyles
  const hairStyle = vm?.hairStyle ?? 'short_tuft';
  const hairGroup = new THREE.Group();
  headGroup.add(hairGroup);

  const hairDomeGeo = new THREE.SphereGeometry(0.114, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.58);
  hairDomeGeo.scale(0.96, 1.08, 1.02);
  disposables.push(hairDomeGeo);
  const hairDome = new THREE.Mesh(hairDomeGeo, hairMat);
  hairDome.rotation.x = -0.24;
  hairDome.position.set(0, 0.008, -0.008);
  hairDome.castShadow = true;
  hairGroup.add(hairDome);

  if (hairStyle === 'short_tuft') {
    const tuftGeo = new THREE.CapsuleGeometry(0.032, 0.07, 8, 12);
    tuftGeo.rotateZ(Math.PI / 2);
    tuftGeo.scale(1.0, 0.72, 0.85);
    disposables.push(tuftGeo);
    const tuft = new THREE.Mesh(tuftGeo, hairMat);
    tuft.position.set(0, 0.088, 0.068);
    tuft.castShadow = true;
    hairGroup.add(tuft);
  } else if (hairStyle === 'messy_curls') {
    const curlGeo = new THREE.SphereGeometry(0.044, 10, 8);
    disposables.push(curlGeo);
    const curlOffsets: [number, number, number][] = [
      [0, 0.11, 0.04],
      [-0.055, 0.095, 0.025],
      [0.055, 0.095, 0.025],
      [-0.075, 0.055, -0.02],
      [0.075, 0.055, -0.02],
      [0, 0.095, -0.065],
    ];
    for (const [cx, cy, cz] of curlOffsets) {
      const curl = new THREE.Mesh(curlGeo, hairMat);
      curl.position.set(cx, cy, cz);
      curl.castShadow = castMinorShadow;
      hairGroup.add(curl);
    }
  } else if (hairStyle === 'ponytail') {
    const tailGeo = new THREE.CapsuleGeometry(0.032, 0.13, 8, 12);
    tailGeo.rotateX(-0.55);
    disposables.push(tailGeo);
    const tail = new THREE.Mesh(tailGeo, hairMat);
    tail.position.set(0, -0.01, -0.145);
    tail.castShadow = castMinorShadow;
    hairGroup.add(tail);
  } else if (hairStyle === 'bun') {
    const bunGeo = new THREE.SphereGeometry(0.048, 12, 10);
    disposables.push(bunGeo);
    const bun = new THREE.Mesh(bunGeo, hairMat);
    bun.position.set(0, 0.135, -0.025);
    bun.castShadow = castMinorShadow;
    hairGroup.add(bun);
  } else if (hairStyle === 'long_flow') {
    const backFlowGeo = new THREE.CapsuleGeometry(0.098, 0.13, 8, 14);
    backFlowGeo.scale(1.06, 1.0, 0.56);
    const sideLockGeo = new THREE.CapsuleGeometry(0.028, 0.12, 8, 10);
    disposables.push(backFlowGeo, sideLockGeo);

    const backFlow = new THREE.Mesh(backFlowGeo, hairMat);
    backFlow.position.set(0, -0.055, -0.072);
    backFlow.castShadow = castMinorShadow;
    hairGroup.add(backFlow);

    for (const side of [-1, 1]) {
      const lock = new THREE.Mesh(sideLockGeo, hairMat);
      lock.position.set(side * 0.094, -0.045, 0.01);
      lock.rotation.z = side * -0.12;
      hairGroup.add(lock);
    }
  } else if (hairStyle === 'dreads') {
    const locGeo = new THREE.CapsuleGeometry(0.018, 0.15, 6, 8);
    disposables.push(locGeo);
    for (let i = -3; i <= 3; i++) {
      const loc = new THREE.Mesh(locGeo, hairMat);
      loc.position.set(i * 0.028, -0.035, -0.095 + Math.abs(i) * 0.01);
      loc.rotation.x = 0.22;
      loc.rotation.z = i * 0.08;
      hairGroup.add(loc);
    }
  } else if (hairStyle === 'side_part') {
    const sweepGeo = new THREE.CapsuleGeometry(0.036, 0.095, 8, 12);
    sweepGeo.rotateZ(Math.PI * 0.42);
    sweepGeo.scale(1.0, 0.72, 0.9);
    disposables.push(sweepGeo);
    const sweep = new THREE.Mesh(sweepGeo, hairMat);
    sweep.position.set(0.018, 0.102, 0.046);
    hairGroup.add(sweep);
  }
  // 'buzz' simply uses the tight hairDome with no extra volume!

  // Headwear (Cap, Backward Cap, Beanie, Bucket Hat)
  const capGroup = new THREE.Group();
  capGroup.position.set(0, 0.02, 0);
  headGroup.add(capGroup);

  const capCrownGeo = new THREE.SphereGeometry(0.115, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);
  capCrownGeo.scale(0.97, 1.04, 1.02);
  const capBrimGeo = new THREE.CylinderGeometry(0.096, 0.104, 0.014, 22);
  capBrimGeo.scale(1.0, 1.0, 0.88);
  const capButtonGeo = new THREE.SphereGeometry(0.014, 10, 8);
  disposables.push(capCrownGeo, capBrimGeo, capButtonGeo);

  const capCrown = new THREE.Mesh(capCrownGeo, hatMat);
  capCrown.rotation.x = -0.1;
  capCrown.castShadow = true;
  capGroup.add(capCrown);

  const capBrim = new THREE.Mesh(capBrimGeo, hatBrimMat);
  capBrim.position.set(0, 0.016, 0.092);
  capBrim.rotation.x = 0.1;
  capBrim.castShadow = true;
  capGroup.add(capBrim);

  const capButton = new THREE.Mesh(capButtonGeo, hatBrimMat);
  capButton.position.set(0, 0.122, -0.01);
  capGroup.add(capButton);

  if (vm?.headwearStyle === 'backward_cap') {
    capGroup.rotation.y = Math.PI;
  }

  const beanieGroup = new THREE.Group();
  beanieGroup.position.set(0, 0.025, 0);
  headGroup.add(beanieGroup);

  const beanieCrownGeo = new THREE.SphereGeometry(0.116, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
  beanieCrownGeo.scale(0.98, 1.24, 1.02);
  const beanieCuffGeo = new THREE.TorusGeometry(0.106, 0.024, 10, 24);
  beanieCuffGeo.rotateX(Math.PI / 2);
  beanieCuffGeo.scale(0.98, 1, 1.02);
  disposables.push(beanieCrownGeo, beanieCuffGeo);

  const beanieCrown = new THREE.Mesh(beanieCrownGeo, hatMat);
  beanieCrown.rotation.x = -0.12;
  beanieCrown.castShadow = true;
  beanieGroup.add(beanieCrown);

  const beanieCuff = new THREE.Mesh(beanieCuffGeo, hatBrimMat);
  beanieCuff.position.y = 0.015;
  beanieCuff.castShadow = true;
  beanieGroup.add(beanieCuff);

  const bucketHatGroup = new THREE.Group();
  bucketHatGroup.position.set(0, 0.032, 0);
  headGroup.add(bucketHatGroup);

  if (vm?.headwearStyle === 'bucket_hat') {
    const bCrownGeo = new THREE.CylinderGeometry(0.102, 0.112, 0.088, 18);
    const bBrimGeo = new THREE.CylinderGeometry(0.114, 0.168, 0.032, 22, 1, true);
    disposables.push(bCrownGeo, bBrimGeo);

    const bCrown = new THREE.Mesh(bCrownGeo, hatMat);
    bCrown.position.y = 0.05;
    bCrown.castShadow = true;
    bucketHatGroup.add(bCrown);

    const bBrim = new THREE.Mesh(bBrimGeo, hatBrimMat);
    bBrim.position.y = 0.0;
    bBrim.castShadow = castMinorShadow;
    bucketHatGroup.add(bBrim);
  } else {
    bucketHatGroup.visible = false;
  }

  // Head-mounted Accessories (Sunglasses, Headphones, Sweatband)
  if (vm?.accessory === 'sunglasses') {
    const lensGeo = new THREE.BoxGeometry(0.064, 0.032, 0.022);
    const bridgeGeo = new THREE.BoxGeometry(0.16, 0.012, 0.022);
    disposables.push(lensGeo, bridgeGeo);

    for (const side of [-1, 1]) {
      const lens = new THREE.Mesh(lensGeo, accessoryDarkMat);
      lens.position.set(side * 0.042, 0.006, 0.102);
      headGroup.add(lens);
    }
    const bridge = new THREE.Mesh(bridgeGeo, accessoryDarkMat);
    bridge.position.set(0, 0.014, 0.102);
    headGroup.add(bridge);
  } else if (vm?.accessory === 'headphones') {
    const arcGeo = new THREE.TorusGeometry(0.118, 0.013, 8, 18, Math.PI);
    const cupGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.026, 12);
    cupGeo.rotateZ(Math.PI / 2);
    disposables.push(arcGeo, cupGeo);

    const arc = new THREE.Mesh(arcGeo, accessoryDarkMat);
    arc.position.set(0, 0.03, -0.005);
    headGroup.add(arc);

    for (const side of [-1, 1]) {
      const cup = new THREE.Mesh(cupGeo, secondaryMat);
      cup.position.set(side * 0.112, 0.005, -0.005);
      headGroup.add(cup);
    }
  } else if (vm?.accessory === 'sweatband') {
    const bandGeo = new THREE.TorusGeometry(0.107, 0.015, 8, 22);
    bandGeo.rotateX(Math.PI / 2);
    disposables.push(bandGeo);
    const band = new THREE.Mesh(bandGeo, secondaryMat);
    band.position.set(0, 0.036, 0);
    headGroup.add(band);
  }

  const hasLongSleeves =
    topStyle === 'hoodie' || topStyle === 'longsleeve' || topStyle === 'windbreaker';
  const isTank = topStyle === 'tank';

  const buildArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.2, 0.39, 0);
    spine.add(shoulder);

    const shoulderBallGeo = new THREE.SphereGeometry(0.06, 14, 12);
    disposables.push(shoulderBallGeo);
    const shoulderBall = new THREE.Mesh(shoulderBallGeo, isTank ? skinMat : shirtMat);
    shoulderBall.castShadow = true;
    shoulder.add(shoulderBall);

    if (!isTank) {
      const sleeveLen = hasLongSleeves ? 0.24 : 0.13;
      const sleeveGeo = new THREE.CylinderGeometry(0.055, hasLongSleeves ? 0.048 : 0.06, sleeveLen, 14);
      sleeveGeo.translate(0, -sleeveLen * 0.46, 0);
      disposables.push(sleeveGeo);
      const sleeve = new THREE.Mesh(sleeveGeo, topStyle === 'overshirt' ? secondaryMat : shirtMat);
      sleeve.castShadow = true;
      shoulder.add(sleeve);
    }

    const upperArmGeo = createCapsuleLimbGeometry(0.042, 0.18);
    disposables.push(upperArmGeo);
    const upperArm = new THREE.Mesh(upperArmGeo, hasLongSleeves ? shirtMat : skinMat);
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.25, 0);
    shoulder.add(elbow);

    const forearmGeo = createCapsuleLimbGeometry(hasLongSleeves ? 0.04 : 0.036, 0.17);
    disposables.push(forearmGeo);
    const forearm = new THREE.Mesh(forearmGeo, hasLongSleeves ? shirtMat : skinMat);
    forearm.castShadow = true;
    elbow.add(forearm);

    if (vm?.accessory === 'sweatband' || hasLongSleeves) {
      const wristGeo = new THREE.TorusGeometry(0.039, 0.011, 8, 14);
      wristGeo.rotateX(Math.PI / 2);
      disposables.push(wristGeo);
      const wrist = new THREE.Mesh(wristGeo, hasLongSleeves ? shirtAccentMat : secondaryMat);
      wrist.position.set(0, -0.205, 0);
      elbow.add(wrist);
    }

    const handGeo = new THREE.SphereGeometry(0.038, 12, 10);
    handGeo.scale(0.85, 1.18, 0.92);
    disposables.push(handGeo);
    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.position.set(0, -0.255, 0.008);
    hand.castShadow = true;
    elbow.add(hand);

    return { shoulder, elbow, hand };
  };

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);

  // --- Detailed Skateboard (with dedicated flip/shuv pivot & wheel spin refs) ---
  const skateboardGroup = new THREE.Group();
  root.add(skateboardGroup);

  const deckFlipPivot = new THREE.Group();
  skateboardGroup.add(deckFlipPivot);

  const deckGeo = createSkateboardDeckGeometry(initialConfig.deckShape ?? 'street_popsicle');
  disposables.push(deckGeo);

  const topGripGeo = deckGeo.clone();
  topGripGeo.scale(0.985, 0.35, 0.985);
  topGripGeo.translate(0, 0.0085, 0);
  disposables.push(topGripGeo);

  const bottomArtGeo = deckGeo.clone();
  bottomArtGeo.scale(0.985, 0.35, 0.985);
  bottomArtGeo.translate(0, -0.0085, 0);
  disposables.push(bottomArtGeo);

  const boardCoreMesh = new THREE.Mesh(deckGeo, woodEdgeMat);
  boardCoreMesh.castShadow = true;
  boardCoreMesh.receiveShadow = true;
  deckFlipPivot.add(boardCoreMesh);

  const boardGripMesh = new THREE.Mesh(topGripGeo, gripMat);
  boardGripMesh.castShadow = true;
  boardGripMesh.receiveShadow = true;
  deckFlipPivot.add(boardGripMesh);

  const boardGraphicMesh = new THREE.Mesh(bottomArtGeo, deckGraphicMat);
  boardGraphicMesh.castShadow = true;
  boardGraphicMesh.receiveShadow = true;
  deckFlipPivot.add(boardGraphicMesh);

  const wheelRadius = getWheelRadius(initialConfig.wheelSize);
  const baseplateGeo = new THREE.BoxGeometry(0.056, 0.012, 0.072);
  const hangerGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.195, 14);
  hangerGeo.rotateZ(Math.PI / 2);
  const axleGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.235, 12);
  axleGeo.rotateZ(Math.PI / 2);
  const kingpinGeo = new THREE.CylinderGeometry(0.0075, 0.0075, 0.052, 10);
  const bushingGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.022, 12);
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.036, 20);
  wheelGeo.rotateZ(Math.PI / 2);
  const bearingGeo = new THREE.CylinderGeometry(wheelRadius * 0.43, wheelRadius * 0.43, 0.038, 14);
  bearingGeo.rotateZ(Math.PI / 2);
  const boltGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.018, 6);

  disposables.push(
    baseplateGeo,
    hangerGeo,
    axleGeo,
    kingpinGeo,
    bushingGeo,
    wheelGeo,
    bearingGeo,
    boltGeo,
  );

  const wheelSpinGroups: THREE.Group[] = [];

  for (const zSign of [-1, 1]) {
    const truckGroup = new THREE.Group();
    truckGroup.position.set(0, -0.015, zSign * 0.215);
    deckFlipPivot.add(truckGroup);

    const baseplate = new THREE.Mesh(baseplateGeo, truckMat);
    baseplate.castShadow = castMinorShadow;
    truckGroup.add(baseplate);

    const kingpin = new THREE.Mesh(kingpinGeo, truckMat);
    kingpin.position.set(0, -0.025, zSign * -0.008);
    kingpin.rotation.x = zSign * 0.22;
    truckGroup.add(kingpin);

    const bushing = new THREE.Mesh(bushingGeo, bushingMat);
    bushing.position.set(0, -0.026, zSign * -0.005);
    truckGroup.add(bushing);

    const hanger = new THREE.Mesh(hangerGeo, truckMat);
    hanger.position.set(0, -0.042, 0);
    hanger.castShadow = castMinorShadow;
    truckGroup.add(hanger);

    const axle = new THREE.Mesh(axleGeo, truckMat);
    axle.position.set(0, -0.042, 0);
    truckGroup.add(axle);

    for (const bx of [-0.018, 0.018]) {
      for (const bz of [-0.022, 0.022]) {
        const bolt = new THREE.Mesh(boltGeo, truckMat);
        bolt.position.set(bx, 0.02, bz);
        truckGroup.add(bolt);
      }
    }

    for (const wx of [-0.106, 0.106]) {
      const wheelPivot = new THREE.Group();
      wheelPivot.position.set(wx, -0.042, 0);
      truckGroup.add(wheelPivot);

      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.castShadow = castMinorShadow;
      wheelPivot.add(wheel);

      const bearing = new THREE.Mesh(bearingGeo, bearingMat);
      wheelPivot.add(bearing);

      wheelSpinGroups.push(wheelPivot);
    }
  }

  // --- Deep Grounding Contact Shadows ---
  const shadowGeo = new THREE.PlaneGeometry(1.35, 1.0);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: textures.contactShadow,
    transparent: true,
    depthWrite: false,
    opacity: 0.8,
  });
  disposables.push(shadowGeo, shadowMat);
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(-0.08, 0.012, 0.06);
  root.add(contactShadow);

  const applyConfig = (cfg: GarageConfig) => {
    shirtMat.color.set(cfg.shirtColor);
    shirtAccentMat.color.set(cfg.shirtAccent);
    pantsMat.color.set(cfg.pantsColor);
    shoeUpperMat.color.set(cfg.shoeColor);
    if (cfg.shoeAccent) shoeAccentMat.color.set(cfg.shoeAccent);
    if (cfg.sockColor) accessoryBrightMat.color.set(cfg.sockColor);
    hatMat.color.set(cfg.hatColor);
    wheelMat.color.set(cfg.wheelColor);
    bearingMat.color.setHex(getBearingColorHex(cfg.bearingFinish));

    if (vm) {
      capGroup.visible = vm.headwearStyle === 'cap' || vm.headwearStyle === 'backward_cap';
      beanieGroup.visible = vm.headwearStyle === 'beanie';
      bucketHatGroup.visible = vm.headwearStyle === 'bucket_hat';
      hairGroup.visible = vm.headwearStyle !== 'beanie' && vm.headwearStyle !== 'bucket_hat';
      secondaryMat.color.set(vm.secondaryColor || cfg.shirtAccent);
      hatBrimMat.color.set(vm.secondaryColor || cfg.shirtAccent);
    } else {
      capGroup.visible = cfg.headwear === 'cap';
      beanieGroup.visible = cfg.headwear === 'beanie';
      bucketHatGroup.visible = false;
      hairGroup.visible = cfg.headwear !== 'beanie';
    }

    gripMat.map = textures.griptapeVariants[cfg.gripStyle ?? 'classic_black'] ?? textures.griptapeColor;
    gripMat.needsUpdate = true;

    deckGraphicMat.map = textures.deckGraphics[cfg.deckGraphic] ?? textures.deckGraphics.flow_wave;
    deckGraphicMat.needsUpdate = true;

    const finish = getTruckFinishProps(cfg.truckFinish);
    truckMat.color.setHex(finish.color);
    truckMat.metalness = finish.metalness;
    truckMat.roughness = finish.roughness;
    truckMat.needsUpdate = true;
  };

  applyConfig(initialConfig);

  const setFirstPersonView = (isFirstPerson: boolean) => {
    headGroup.visible = !isFirstPerson;
    neckGroup.visible = !isFirstPerson;
  };

  // --- Home / Garage / Menu Standing Pose ---
  const update = (elapsed: number) => {
    setFirstPersonView(false);
    contactShadow.visible = true;
    contactShadow.position.set(-0.08, 0.012, 0.06);

    skaterBody.position.set(0, 0, 0);
    skaterBody.rotation.set(0, 0, 0);

    hips.position.set(0, 0.92, 0);
    hips.rotation.set(0, 0, 0);

    leftLeg.hipJoint.rotation.set(-0.04, 0.12, 0.04);
    leftLeg.kneeJoint.rotation.set(0.06, 0, 0);
    leftLeg.footGroup.rotation.set(-0.02, 0, -0.04);

    rightLeg.hipJoint.rotation.set(0.06, -0.14, -0.05);
    rightLeg.kneeJoint.rotation.set(0.08, 0, 0);
    rightLeg.footGroup.rotation.set(-0.14, 0, 0.05);

    const breath = Math.sin(elapsed * 1.85);
    const sway = Math.sin(elapsed * 0.92);

    spine.position.y = 0.07 + breath * 0.005;
    spine.rotation.set(0.02 + breath * 0.012, 0, sway * 0.012);

    headGroup.rotation.set(breath * 0.02 - 0.02, Math.sin(elapsed * 0.65) * 0.08 - 0.1, 0);

    rightArm.shoulder.rotation.set(0.06, 0, 0.14 + sway * 0.018);
    rightArm.elbow.rotation.set(-0.22, 0, 0);

    leftArm.shoulder.rotation.set(-0.22, 0.08, -0.22);
    leftArm.elbow.rotation.set(-0.22, 0, 0);

    skateboardGroup.position.set(-0.33, 0.4, 0.16);
    skateboardGroup.rotation.set(-1.38, 0.45, 0.1 + sway * 0.012);
    deckFlipPivot.position.set(0, 0, 0);
    deckFlipPivot.rotation.set(0, 0, 0);
  };

  // --- Articulated Multi-Body Ragdoll Crash State (Each body part has distinct inertia, gravity & damping!) ---
  const rag = {
    lastNonce: -1,
    bx: 0, by: 0.25, bz: 0,
    vx: 0, vy: 0, vz: 0,
    rx: 0, ry: 0, rz: 0,
    avx: 0, avy: 0, avz: 0,
    spineX: 0, vSpineX: 0,
    spineY: 0, vSpineY: 0,
    spineZ: 0, vSpineZ: 0,
    headX: 0, vHeadX: 0,
    headY: 0, vHeadY: 0,
    headZ: 0, vHeadZ: 0,
    lHipX: -0.2, vLHipX: 0, lHipY: 0, vLHipY: 0, lHipZ: -0.18, vLHipZ: 0,
    lKnee: 0.4, vLKnee: 0, lFootX: 0.2, vLFootX: 0, lFootZ: 0, vLFootZ: 0,
    rHipX: -0.2, vRHipX: 0, rHipY: 0, vRHipY: 0, rHipZ: 0.18, vRHipZ: 0,
    rKnee: 0.4, vRKnee: 0, rFootX: 0.2, vRFootX: 0, rFootZ: 0, vRFootZ: 0,
    lArmX: 0, vLArmX: 0, lArmY: 0, vLArmY: 0, lArmZ: -0.4, vLArmZ: 0, lElbow: -0.4, vLElbow: 0,
    rArmX: 0, vRArmX: 0, rArmY: 0, vRArmY: 0, rArmZ: 0.4, vRArmZ: 0, rElbow: -0.4, vRElbow: 0,
    boardPos: new THREE.Vector3(0, 0.088, 0),
    boardVel: new THREE.Vector3(),
    boardRot: new THREE.Vector3(),
    boardSpin: new THREE.Vector3(),
  };

  const wrapAngle = (a: number) => {
    let r = (a + Math.PI) % (Math.PI * 2);
    if (r < 0) r += Math.PI * 2;
    return r - Math.PI;
  };

  // --- Full Articulated Skateboarding Animation & Ragdoll Rig ---
  const damp = THREE.MathUtils.damp;

  const updateGameplay = (anim: SkaterAnimState, dt: number) => {
    const lam = 16;

    // Spin wheels smoothly
    for (let i = 0; i < wheelSpinGroups.length; i++) {
      wheelSpinGroups[i].rotation.x = anim.wheelSpinAngle;
    }

    // Contact shadow directly under board when grounded or grinding
    contactShadow.visible = anim.groundState !== 'airborne' && anim.groundState !== 'crashed';
    contactShadow.position.set(0, 0.014, 0);

    // 1. MULTI-BODY PER-PART RAGDOLL WIPEOUT SOLVER
    if (anim.groundState === 'crashed') {
      if (anim.crashNonce !== rag.lastNonce) {
        rag.lastNonce = anim.crashNonce;
        rag.bx = 0;
        rag.by = 0.78;
        rag.bz = 0;
        const speedMag = Math.hypot(anim.crashVelX, anim.crashVelZ);
        const dirSign = Math.random() > 0.5 ? 1 : -1;

        rag.vx = (Math.random() - 0.5) * 2.4;
        rag.vy = 2.7 + Math.min(2.4, speedMag * 0.28);
        rag.vz = Math.min(4.6, speedMag * 0.38 + 1.4);

        rag.rx = 0.25;
        rag.ry = -Math.PI * 0.42 * stanceSign + (Math.random() - 0.5) * 0.9;
        rag.rz = dirSign * 0.35;
        rag.avx = (Math.random() > 0.35 ? 1 : -1) * (6.2 + Math.random() * 4.8);
        rag.avy = (Math.random() - 0.5) * 8.5;
        rag.avz = dirSign * (7.2 + Math.random() * 5.2);

        // Distinct asymmetric initial impulses for every single limb & joint!
        rag.spineX = 0.15; rag.vSpineX = (Math.random() - 0.5) * 14;
        rag.spineY = 0.2; rag.vSpineY = (Math.random() - 0.5) * 12;
        rag.spineZ = 0; rag.vSpineZ = -dirSign * (6 + Math.random() * 6);

        rag.headX = -0.15; rag.vHeadX = (Math.random() - 0.5) * 19;
        rag.headY = 0.2; rag.vHeadY = (Math.random() - 0.5) * 16;
        rag.headZ = 0; rag.vHeadZ = (Math.random() - 0.5) * 14;

        // Left leg kicks wider & bends more; right leg lags/extends differently
        rag.lHipX = -0.55; rag.vLHipX = -9 - Math.random() * 7;
        rag.lHipY = -0.15; rag.vLHipY = (Math.random() - 0.5) * 9;
        rag.lHipZ = -0.35; rag.vLHipZ = -4 - Math.random() * 5;
        rag.lKnee = 0.95; rag.vLKnee = 6 + Math.random() * 8;
        rag.lFootX = 0.2; rag.vLFootX = (Math.random() - 0.5) * 18;
        rag.lFootZ = 0; rag.vLFootZ = (Math.random() - 0.5) * 10;

        rag.rHipX = 0.15; rag.vRHipX = 6 + Math.random() * 7;
        rag.rHipY = 0.18; rag.vRHipY = (Math.random() - 0.5) * 9;
        rag.rHipZ = 0.32; rag.vRHipZ = 4 + Math.random() * 5;
        rag.rKnee = 0.35; rag.vRKnee = -4 + Math.random() * 9;
        rag.rFootX = -0.1; rag.vRFootX = (Math.random() - 0.5) * 18;
        rag.rFootZ = 0; rag.vRFootZ = (Math.random() - 0.5) * 10;

        // Left arm flails high & wide; right arm reaches across chest/ground with independent elbows!
        rag.lArmX = -0.9; rag.vLArmX = -11 - Math.random() * 9;
        rag.lArmY = -0.2; rag.vLArmY = (Math.random() - 0.5) * 12;
        rag.lArmZ = -0.85; rag.vLArmZ = -7 - Math.random() * 7;
        rag.lElbow = -0.6; rag.vLElbow = -10 - Math.random() * 9;

        rag.rArmX = 0.55; rag.vRArmX = 9 + Math.random() * 8;
        rag.rArmY = 0.25; rag.vRArmY = (Math.random() - 0.5) * 12;
        rag.rArmZ = 0.75; rag.vRArmZ = 6 + Math.random() * 7;
        rag.rElbow = -1.05; rag.vRElbow = 8 + Math.random() * 9;

        // Launch skateboard separately!
        rag.boardPos.set((Math.random() - 0.5) * 0.45, 0.18, 0.25);
        rag.boardVel.set((Math.random() - 0.5) * 4.4, 3.6 + Math.random() * 1.9, 2.5 + Math.random() * 2.2);
        rag.boardRot.set(0.2, 0.3, 0.4);
        rag.boardSpin.set(10 + Math.random() * 7, (Math.random() - 0.5) * 11, 12 + Math.random() * 9);
      }

      const rdt = Math.min(dt, 0.033);

      // Pelvis Core Trajectory & Concrete Bounce
      const prevVy = rag.vy;
      rag.vy -= 19.2 * rdt;
      rag.bx += rag.vx * rdt;
      rag.by += rag.vy * rdt;
      rag.bz += rag.vz * rdt;
      rag.rx += rag.avx * rdt;
      rag.ry += rag.avy * rdt;
      rag.rz += rag.avz * rdt;

      const groundFloorY = 0.16;
      let floorImpact = 0;
      const onFloor = rag.by <= groundFloorY;

      if (onFloor) {
        rag.by = groundFloorY;
        if (prevVy < -1.0) {
          floorImpact = Math.min(1.8, -prevVy * 0.32);
          rag.vy = -prevVy * 0.26;
          // Angular kick from catching floor edge asymmetrically
          rag.avx += (Math.random() - 0.5) * 5.2 * floorImpact;
          rag.avz += (Math.random() - 0.5) * 5.2 * floorImpact;

          // Transmit distinct shockwave velocities based on each part's inertia!
          rag.vSpineX += (Math.random() - 0.45) * 11 * floorImpact;
          rag.vSpineY += (Math.random() - 0.5) * 8 * floorImpact;
          rag.vSpineZ += (Math.random() - 0.5) * 9 * floorImpact;

          // Light head whips more violently!
          rag.vHeadX += (Math.random() - 0.5) * 16 * floorImpact;
          rag.vHeadY += (Math.random() - 0.5) * 14 * floorImpact;
          rag.vHeadZ += (Math.random() - 0.5) * 14 * floorImpact;

          // Legs rebound with different timing & asymmetry
          rag.vLHipX += (Math.random() - 0.5) * 13 * floorImpact;
          rag.vLKnee += (Math.random() - 0.35) * 14 * floorImpact;
          rag.vLFootX += (Math.random() - 0.5) * 20 * floorImpact;

          rag.vRHipX += (Math.random() - 0.5) * 10 * floorImpact;
          rag.vRKnee += (Math.random() - 0.65) * 11 * floorImpact;
          rag.vRFootX += (Math.random() - 0.5) * 18 * floorImpact;

          // Arms & forearms slap & rebound cleanly
          rag.vLArmX += (Math.random() - 0.5) * 16 * floorImpact;
          rag.vLArmZ += (Math.random() - 0.6) * 12 * floorImpact;
          rag.vLElbow += (Math.random() - 0.5) * 17 * floorImpact;

          rag.vRArmX += (Math.random() - 0.5) * 13 * floorImpact;
          rag.vRArmZ += (Math.random() - 0.4) * 11 * floorImpact;
          rag.vRElbow += (Math.random() - 0.5) * 15 * floorImpact;
        } else {
          rag.vy = 0;
        }

        // Slide & rotational concrete friction
        const slideDamp = Math.exp(-4.6 * rdt);
        rag.vx *= slideDamp;
        rag.vz *= slideDamp;
        rag.avx *= Math.exp(-5.8 * rdt);
        rag.avy *= Math.exp(-6.2 * rdt);
        rag.avz *= Math.exp(-5.8 * rdt);

        // Settle pelvis toward lying naturally on concrete (side or back/belly depending on current roll)
        const cosX = Math.cos(rag.rx);
        const targetFlatX = cosX >= 0 ? Math.PI * 0.47 : -Math.PI * 0.47;
        const wrappedX = wrapAngle(rag.rx);
        rag.rx = THREE.MathUtils.lerp(wrappedX, targetFlatX, Math.min(1, rdt * 3.8));
      }

      // Per-Part Loose Joint Solver (with gravity torque & floor contact friction — NO stiff snapping!)
      const stepLooseJoint = (
        val: number,
        vel: number,
        extTorque: number,
        kLimit: number,
        cDamp: number,
        min: number,
        max: number,
        bounce: number,
      ): [number, number] => {
        // Only apply gentle soft-limit spring near range center; mostly gravity + momentum!
        const softCenter = (min + max) * 0.5;
        const accel = extTorque - kLimit * (val - softCenter) - cDamp * vel;
        let nv = vel + accel * rdt;
        let nval = val + nv * rdt;
        if (nval < min) {
          nval = min;
          nv = -nv * bounce;
        } else if (nval > max) {
          nval = max;
          nv = -nv * bounce;
        }
        return [nval, nv];
      };

      const bodyTiltSinX = Math.sin(rag.rx);
      const bodyTiltSinZ = Math.sin(rag.rz);
      const floorFriction = onFloor ? 1.35 : 0.72;

      // 1) Spine/Torso: heavier inertia, soft flex & independent yaw twist
      [rag.spineX, rag.vSpineX] = stepLooseJoint(rag.spineX, rag.vSpineX, -bodyTiltSinX * 5.5, 2.2, 2.2 * floorFriction, -0.7, 1.15, 0.24);
      [rag.spineY, rag.vSpineY] = stepLooseJoint(rag.spineY, rag.vSpineY, bodyTiltSinZ * 3.2, 1.8, 2.4 * floorFriction, -0.75, 0.75, 0.2);
      [rag.spineZ, rag.vSpineZ] = stepLooseJoint(rag.spineZ, rag.vSpineZ, -bodyTiltSinZ * 5.0, 2.0, 2.2 * floorFriction, -0.72, 0.72, 0.24);

      // 2) Head/Neck: very light mass, whips opposite torso motion & rolls loosely
      const spineCoupleX = -rag.vSpineX * 1.4;
      [rag.headX, rag.vHeadX] = stepLooseJoint(rag.headX, rag.vHeadX, spineCoupleX - bodyTiltSinX * 6.5, 3.0, 1.7 * floorFriction, -0.75, 0.85, 0.36);
      [rag.headY, rag.vHeadY] = stepLooseJoint(rag.headY, rag.vHeadY, -rag.vSpineY * 1.1, 2.2, 1.9 * floorFriction, -0.95, 0.95, 0.28);
      [rag.headZ, rag.vHeadZ] = stepLooseJoint(rag.headZ, rag.vHeadZ, -bodyTiltSinZ * 7.2, 2.6, 1.8 * floorFriction, -0.68, 0.68, 0.32);

      // 3) Left Leg: looser, slightly lighter/bouncier knee & splayed hip
      [rag.lHipX, rag.vLHipX] = stepLooseJoint(rag.lHipX, rag.vLHipX, bodyTiltSinX * 8.5, 1.5, 1.65 * floorFriction, -1.42, 0.95, 0.38);
      [rag.lHipY, rag.vLHipY] = stepLooseJoint(rag.lHipY, rag.vLHipY, -bodyTiltSinZ * 2.5, 1.4, 2.0 * floorFriction, -0.58, 0.45, 0.2);
      [rag.lHipZ, rag.vLHipZ] = stepLooseJoint(rag.lHipZ, rag.vLHipZ, -3.6 - bodyTiltSinZ * 4.5, 1.3, 1.8 * floorFriction, -0.88, 0.22, 0.3);
      [rag.lKnee, rag.vLKnee] = stepLooseJoint(rag.lKnee, rag.vLKnee, -rag.vLHipX * 1.3 + 4.2, 1.2, 1.55 * floorFriction, 0.08, 2.15, 0.42);
      [rag.lFootX, rag.vLFootX] = stepLooseJoint(rag.lFootX, rag.vLFootX, -rag.vLKnee * 0.9, 2.8, 1.45 * floorFriction, -0.65, 0.85, 0.35);
      [rag.lFootZ, rag.vLFootZ] = stepLooseJoint(rag.lFootZ, rag.vLFootZ, -rag.vLHipZ * 0.8, 3.0, 1.6 * floorFriction, -0.45, 0.45, 0.25);

      // 4) Right Leg: heavier damping & different gravity bias so both legs fall asymmetrically!
      [rag.rHipX, rag.vRHipX] = stepLooseJoint(rag.rHipX, rag.vRHipX, bodyTiltSinX * 6.8, 1.9, 2.05 * floorFriction, -1.42, 0.95, 0.26);
      [rag.rHipY, rag.vRHipY] = stepLooseJoint(rag.rHipY, rag.vRHipY, bodyTiltSinZ * 2.8, 1.6, 2.2 * floorFriction, -0.45, 0.58, 0.2);
      [rag.rHipZ, rag.vRHipZ] = stepLooseJoint(rag.rHipZ, rag.vRHipZ, 3.4 - bodyTiltSinZ * 4.5, 1.5, 2.1 * floorFriction, -0.22, 0.88, 0.25);
      [rag.rKnee, rag.vRKnee] = stepLooseJoint(rag.rKnee, rag.vRKnee, -rag.vRHipX * 1.1 + 3.0, 1.6, 1.95 * floorFriction, 0.08, 2.15, 0.3);
      [rag.rFootX, rag.vRFootX] = stepLooseJoint(rag.rFootX, rag.vRFootX, -rag.vRKnee * 0.8, 3.2, 1.75 * floorFriction, -0.65, 0.85, 0.28);
      [rag.rFootZ, rag.vRFootZ] = stepLooseJoint(rag.rFootZ, rag.vRFootZ, -rag.vRHipZ * 0.8, 3.4, 1.9 * floorFriction, -0.45, 0.45, 0.22);

      // 5) Left Arm (loose & whippy, independent elbow hinge!)
      [rag.lArmX, rag.vLArmX] = stepLooseJoint(rag.lArmX, rag.vLArmX, -bodyTiltSinX * 11.0, 1.1, 1.42 * floorFriction, -2.15, 1.65, 0.42);
      [rag.lArmY, rag.vLArmY] = stepLooseJoint(rag.lArmY, rag.vLArmY, -rag.vSpineY * 1.2, 1.4, 1.85 * floorFriction, -0.95, 0.95, 0.25);
      [rag.lArmZ, rag.vLArmZ] = stepLooseJoint(rag.lArmZ, rag.vLArmZ, -7.2 - bodyTiltSinZ * 6.5, 1.2, 1.48 * floorFriction, -2.35, 0.15, 0.44);
      [rag.lElbow, rag.vLElbow] = stepLooseJoint(rag.lElbow, rag.vLElbow, -rag.vLArmX * 1.35 - 2.4, 1.1, 1.35 * floorFriction, -2.28, -0.08, 0.45);

      // 6) Right Arm (heavier shoulder inertia, catches ground with distinct elbow fold)
      [rag.rArmX, rag.vRArmX] = stepLooseJoint(rag.rArmX, rag.vRArmX, -bodyTiltSinX * 9.2, 1.4, 1.72 * floorFriction, -2.15, 1.65, 0.34);
      [rag.rArmY, rag.vRArmY] = stepLooseJoint(rag.rArmY, rag.vRArmY, rag.vSpineY * 1.2, 1.6, 2.1 * floorFriction, -0.95, 0.95, 0.22);
      [rag.rArmZ, rag.vRArmZ] = stepLooseJoint(rag.rArmZ, rag.vRArmZ, 6.8 - bodyTiltSinZ * 6.5, 1.5, 1.78 * floorFriction, -0.15, 2.35, 0.36);
      [rag.rElbow, rag.vRElbow] = stepLooseJoint(rag.rElbow, rag.vRElbow, -rag.vRArmX * 1.15 - 3.2, 1.4, 1.65 * floorFriction, -2.28, -0.08, 0.36);

      // Integrate tumbling skateboard separately
      rag.boardVel.y -= 19.2 * rdt;
      rag.boardPos.addScaledVector(rag.boardVel, rdt);
      rag.boardRot.addScaledVector(rag.boardSpin, rdt);
      if (rag.boardPos.y <= 0.055) {
        rag.boardPos.y = 0.055;
        if (rag.boardVel.y < -0.9) {
          rag.boardVel.y = -rag.boardVel.y * 0.42;
          rag.boardSpin.multiplyScalar(0.7);
        } else {
          rag.boardVel.y = 0;
          rag.boardSpin.multiplyScalar(Math.exp(-7.5 * rdt));
        }
        rag.boardVel.x *= Math.exp(-3.8 * rdt);
        rag.boardVel.z *= Math.exp(-3.8 * rdt);
      }

      // Apply exact ragdoll transforms directly (zero artificial stiffness!)
      skaterBody.position.set(rag.bx, rag.by, rag.bz);
      skaterBody.rotation.set(rag.rx, rag.ry, rag.rz);
      hips.position.y = 0.04;
      spine.rotation.set(rag.spineX, rag.spineY, rag.spineZ);
      headGroup.rotation.set(rag.headX, rag.headY, rag.headZ);

      leftLeg.hipJoint.rotation.set(rag.lHipX, rag.lHipY, rag.lHipZ);
      leftLeg.kneeJoint.rotation.set(rag.lKnee, 0, 0);
      leftLeg.footGroup.rotation.set(rag.lFootX, 0, rag.lFootZ);

      rightLeg.hipJoint.rotation.set(rag.rHipX, rag.rHipY, rag.rHipZ);
      rightLeg.kneeJoint.rotation.set(rag.rKnee, 0, 0);
      rightLeg.footGroup.rotation.set(rag.rFootX, 0, rag.rFootZ);

      leftArm.shoulder.rotation.set(rag.lArmX, rag.lArmY, rag.lArmZ);
      leftArm.elbow.rotation.set(rag.lElbow, 0, 0);
      rightArm.shoulder.rotation.set(rag.rArmX, rag.rArmY, rag.rArmZ);
      rightArm.elbow.rotation.set(rag.rElbow, 0, 0);

      skateboardGroup.position.copy(rag.boardPos);
      skateboardGroup.rotation.set(0, 0, 0);
      deckFlipPivot.position.set(0, 0, 0);
      deckFlipPivot.rotation.set(rag.boardRot.x, rag.boardRot.y, rag.boardRot.z);
      return;
    }

    // 2. SMOOTH SHORTEST-PATH RECOVERY FROM RAGDOLL REST TO DECK STANCE
    if (anim.groundState === 'getting_up') {
      const p = THREE.MathUtils.smoothstep(anim.getUpProgress, 0, 1);
      skateboardGroup.position.set(
        THREE.MathUtils.lerp(rag.boardPos.x, 0, p),
        THREE.MathUtils.lerp(rag.boardPos.y, 0.088, p),
        THREE.MathUtils.lerp(rag.boardPos.z, 0, p),
      );
      skateboardGroup.rotation.set(0, 0, 0);
      deckFlipPivot.position.set(0, 0, 0);
      deckFlipPivot.rotation.set(
        THREE.MathUtils.lerp(wrapAngle(rag.boardRot.x), 0, p),
        THREE.MathUtils.lerp(wrapAngle(rag.boardRot.y), 0, p),
        THREE.MathUtils.lerp(wrapAngle(rag.boardRot.z), 0, p),
      );

      skaterBody.position.set(
        THREE.MathUtils.lerp(rag.bx, 0, p),
        THREE.MathUtils.lerp(rag.by, 0.095, p),
        THREE.MathUtils.lerp(rag.bz, 0, p),
      );
      const startRx = wrapAngle(rag.rx);
      const targetRy = -Math.PI * 0.42 * stanceSign;
      const startRy = targetRy + wrapAngle(rag.ry - targetRy);
      const startRz = wrapAngle(rag.rz);
      skaterBody.rotation.set(
        THREE.MathUtils.lerp(startRx, 0, p),
        THREE.MathUtils.lerp(startRy, targetRy, p),
        THREE.MathUtils.lerp(startRz, 0, p),
      );
      hips.position.y = THREE.MathUtils.lerp(0.04, 0.88, p);
      spine.rotation.set(
        THREE.MathUtils.lerp(rag.spineX, 0.1, p),
        THREE.MathUtils.lerp(rag.spineY, 0.34 * stanceSign, p),
        THREE.MathUtils.lerp(rag.spineZ, 0, p),
      );
      headGroup.rotation.set(
        THREE.MathUtils.lerp(rag.headX, 0.04, p),
        THREE.MathUtils.lerp(rag.headY, 0.62 * stanceSign, p),
        THREE.MathUtils.lerp(rag.headZ, 0, p),
      );

      leftLeg.hipJoint.rotation.set(
        THREE.MathUtils.lerp(rag.lHipX, -0.22, p),
        THREE.MathUtils.lerp(rag.lHipY, 0, p),
        THREE.MathUtils.lerp(rag.lHipZ, -0.21, p),
      );
      leftLeg.kneeJoint.rotation.set(THREE.MathUtils.lerp(rag.lKnee, 0.44, p), 0, 0);
      leftLeg.footGroup.rotation.set(
        THREE.MathUtils.lerp(rag.lFootX, -0.22, p),
        0,
        THREE.MathUtils.lerp(rag.lFootZ, 0, p),
      );

      rightLeg.hipJoint.rotation.set(
        THREE.MathUtils.lerp(rag.rHipX, -0.22, p),
        THREE.MathUtils.lerp(rag.rHipY, 0, p),
        THREE.MathUtils.lerp(rag.rHipZ, 0.23, p),
      );
      rightLeg.kneeJoint.rotation.set(THREE.MathUtils.lerp(rag.rKnee, 0.44, p), 0, 0);
      rightLeg.footGroup.rotation.set(
        THREE.MathUtils.lerp(rag.rFootX, -0.22, p),
        0,
        THREE.MathUtils.lerp(rag.rFootZ, 0, p),
      );

      leftArm.shoulder.rotation.set(
        THREE.MathUtils.lerp(rag.lArmX, -0.1, p),
        THREE.MathUtils.lerp(rag.lArmY, 0.18, p),
        THREE.MathUtils.lerp(rag.lArmZ, -0.28, p),
      );
      leftArm.elbow.rotation.set(THREE.MathUtils.lerp(rag.lElbow, -0.34, p), 0, 0);
      rightArm.shoulder.rotation.set(
        THREE.MathUtils.lerp(rag.rArmX, 0.1, p),
        THREE.MathUtils.lerp(rag.rArmY, -0.18, p),
        THREE.MathUtils.lerp(rag.rArmZ, 0.32, p),
      );
      rightArm.elbow.rotation.set(THREE.MathUtils.lerp(rag.rElbow, -0.34, p), 0, 0);
      return;
    }

    // 3. STANDARD SKATEBOARDING POSES (Grounded, Pumping, Powerslide, Airborne Tricks, Grinds)
    // Ground the skateboard on its 4 wheels at y = 0.088 above surface!
    skateboardGroup.position.set(0, 0.088, 0);
    skateboardGroup.rotation.set(0, anim.powerslideAngle, anim.steerLean * 0.14);

    const popLift = Math.abs(anim.boardPopPitch) * 0.18;
    deckFlipPivot.position.y = popLift;
    deckFlipPivot.rotation.set(
      anim.boardPopPitch,
      anim.boardShuvYaw,
      anim.boardFlipRoll + anim.boardHardflipTilt,
    );

    // Base planted stance parameters (regular or goofy stance riding on top of deck)
    let bodyRotY = -Math.PI * 0.42 * stanceSign + anim.powerslideAngle * 0.7;
    let bodyRotX = 0;
    let bodyRotZ = 0;
    let bodyPosY = 0.095;
    let bodyPosX = 0;
    let bodyPosZ = 0;

    let spineRotX = 0.1;
    let spineRotY = 0.34 * stanceSign;
    let spineRotZ = 0;

    // Athletic stance: both shoes squarely planted over front & back bolts!
    let lHipX = -0.22, lHipZ = -0.21, lKnee = 0.44, lFoot = -0.22;
    let rHipX = -0.22, rHipZ = 0.23, rKnee = 0.44, rFoot = -0.22;

    let lArmX = -0.1, lArmY = 0.18, lArmZ = -0.28, lElbow = -0.34;
    let rArmX = 0.1, rArmY = -0.18, rArmZ = 0.32, rElbow = -0.34;
    let headRotY = 0.62 * stanceSign - anim.steerLean * 0.22;
    let headRotX = 0.04;

    // Auto-compute realistic pelvis height from knee bend when feet are on board!
    let lockFeetToDeck = true;

    if (anim.groundState === 'grinding') {
      const balTilt = anim.grindBalance * 0.34;
      lArmZ = -0.82 - balTilt;
      rArmZ = 0.82 - balTilt;
      lArmX = Math.sin(anim.grindBalance * 2.2) * 0.18;
      rArmX = -lArmX;
      lElbow = -0.24;
      rElbow = -0.24;
      lHipX = -0.28; lKnee = 0.56; lFoot = -0.28;
      rHipX = -0.28; rKnee = 0.56; rFoot = -0.28;
      spineRotZ = -balTilt * 0.65;

      if (anim.activeGrind === 'grind_5_0') {
        bodyPosZ = -0.06;
        lHipX = -0.4; lKnee = 0.62; lFoot = -0.18;
        rHipX = -0.16; rKnee = 0.38; rFoot = -0.22;
        spineRotX = 0.04;
      } else if (anim.activeGrind === 'nosegrind') {
        bodyPosZ = 0.06;
        lHipX = -0.18; lKnee = 0.44; lFoot = -0.26;
        rHipX = 0.06; rKnee = 0.28; rFoot = -0.2;
        spineRotX = 0.24;
      } else if (anim.activeGrind === 'boardslide' || anim.activeGrind === 'lipslide') {
        spineRotY = 0.82;
        headRotY = 0.12;
        lHipX = -0.32; lKnee = 0.66; lFoot = -0.34;
        rHipX = -0.32; rKnee = 0.66; rFoot = -0.34;
      }
    } else if (anim.groundState === 'airborne') {
      lockFeetToDeck = false;
      lHipX = -0.46; lKnee = 0.88; lFoot = -0.12;
      rHipX = -0.46; rKnee = 0.88; rFoot = -0.12;
      lArmZ = -0.68; rArmZ = 0.68;
      lElbow = -0.44; rElbow = -0.44;
      spineRotX = 0.22;

      if (anim.activeTrick && anim.trickProgress < 0.96) {
        const tp = anim.trickProgress;
        const popSpike = Math.sin(tp * Math.PI);

        if (anim.activeTrick === 'ollie') {
          rHipX = THREE.MathUtils.lerp(0.16, -0.52, tp);
          rKnee = THREE.MathUtils.lerp(0.12, 0.96, tp);
          lHipX = -0.64 * popSpike - 0.35;
          lKnee = 1.08;
        } else if (anim.activeTrick === 'nollie') {
          lHipX = THREE.MathUtils.lerp(0.16, -0.52, tp);
          lKnee = THREE.MathUtils.lerp(0.12, 0.96, tp);
          rHipX = -0.64 * popSpike - 0.35;
          rKnee = 1.08;
        } else if (
          anim.activeTrick === 'kickflip' ||
          anim.activeTrick === 'varial_kickflip' ||
          anim.activeTrick === 'flip_360' ||
          anim.activeTrick === 'hardflip'
        ) {
          lHipX = -0.58;
          lHipZ = -0.44 - popSpike * 0.3;
          lKnee = 0.62;
          lFoot = 0.25 * popSpike; // ankle flicks!
          rKnee = 1.08;
          lArmZ = -0.9;
          rArmZ = 0.9;
        } else if (anim.activeTrick === 'heelflip' || anim.activeTrick === 'inward_heelflip') {
          lHipX = -0.7 - popSpike * 0.24;
          lHipZ = -0.14;
          lKnee = 0.52;
          lFoot = -0.35 * popSpike;
          rKnee = 1.04;
          spineRotY = 0.55;
        } else if (anim.activeTrick === 'pop_shove_it' || anim.activeTrick === 'shove_it_360') {
          rHipX = -0.4;
          rHipZ = 0.38 * popSpike + 0.24;
          lKnee = 1.1;
          rKnee = 1.1;
        }
      }

      if (anim.activeGrab === 'indy') {
        lKnee = 1.16; rKnee = 1.16;
        spineRotX = 0.46;
        rArmX = -0.9; rArmZ = 0.14; rElbow = -0.34;
        lArmZ = -0.84;
      } else if (anim.activeGrab === 'melon') {
        lKnee = 1.16; rKnee = 1.16;
        spineRotX = 0.42;
        lArmX = -0.8; lArmY = 0.4; lArmZ = -0.18; lElbow = -0.38;
        rArmZ = 0.86;
      } else if (anim.activeGrab === 'method') {
        lHipX = 0.25; rHipX = 0.25; lKnee = 1.25; rKnee = 1.25;
        spineRotX = -0.12; spineRotZ = -0.26;
        lArmX = -0.72; lArmZ = -0.25; lElbow = -0.35;
        rArmZ = 0.96; rArmX = -0.3;
      } else if (anim.activeGrab === 'nose_grab') {
        spineRotX = 0.48; spineRotY = 0.58;
        lArmX = -1.06; lArmZ = -0.12; lElbow = -0.25;
        rKnee = 1.16;
      } else if (anim.activeGrab === 'tail_grab') {
        spineRotX = 0.38; spineRotY = -0.1;
        rArmX = 0.88; rArmZ = 0.25; rElbow = -0.28;
        lKnee = 0.85; rKnee = 1.16;
      }
    } else {
      // GROUNDED RIDING: Skater stays 100% planted ON TOP of the skateboard!
      // Dynamic carving lean + transition G-force compression
      bodyRotZ = -anim.steerLean * 0.24;
      spineRotZ = -anim.steerLean * 0.16;
      const transSquat = anim.pumpG * 0.18;

      // Subtle riding micro-sway so rider looks alive & balanced
      const speedRatio = Math.min(1, anim.speed / 10);
      lArmZ -= speedRatio * 0.12;
      rArmZ += speedRatio * 0.12;

      // Athletic Skate Pumping (feet remain planted on griptape, knees pump smoothly up/down!)
      if (anim.pushIntensity > 0.06 && anim.crouchAmount < 0.25) {
        const p = anim.pushIntensity;
        const pumpWave = Math.sin(anim.pushPhase);
        const pumpBend = (0.5 - 0.5 * pumpWave) * 0.36 * p;
        lHipX -= pumpBend * 0.7;
        rHipX -= pumpBend * 0.7;
        lKnee += pumpBend * 1.4;
        rKnee += pumpBend * 1.4;
        lFoot -= pumpBend * 0.7;
        rFoot -= pumpBend * 0.7;
        spineRotX += (0.14 + pumpBend * 0.65) * p;
        spineRotY += Math.cos(anim.pushPhase) * 0.12 * p;
        lArmX = -0.12 + pumpWave * 0.34 * p;
        rArmX = 0.12 - pumpWave * 0.34 * p;
        lArmZ = -0.38 - Math.abs(pumpWave) * 0.16 * p;
        rArmZ = 0.42 + Math.abs(pumpWave) * 0.16 * p;
      }

      // Powerslide Braking (both feet stay firmly planted on the sideways-sliding deck!)
      if (anim.braking > 0.06) {
        const b = anim.braking;
        lHipX -= 0.22 * b;
        rHipX -= 0.22 * b;
        lKnee += 0.46 * b;
        rKnee += 0.46 * b;
        lFoot -= 0.24 * b;
        rFoot -= 0.24 * b;
        bodyRotZ += anim.powerslideAngle * 0.32 * b;
        spineRotX += 0.26 * b;
        lArmZ = -0.68;
        rArmZ = 0.72;
        lArmX = -0.25;
        rArmX = 0.25;
      }

      // Crouch compression for Ollie wind-up + Transition G-load
      const totalCrouch = Math.min(1, anim.crouchAmount + transSquat);
      if (totalCrouch > 0.02) {
        lHipX -= totalCrouch * 0.28;
        rHipX -= totalCrouch * 0.28;
        lKnee += totalCrouch * 0.6;
        rKnee += totalCrouch * 0.6;
        lFoot -= totalCrouch * 0.32;
        rFoot -= totalCrouch * 0.32;
        spineRotX += totalCrouch * 0.34;
        lArmX -= totalCrouch * 0.32;
        rArmX -= totalCrouch * 0.32;
      }

      // Landing recovery animation (Perfect compression vs Sketchy wobble!)
      if (anim.landingTimer > 0) {
        const lt = anim.landingTimer / 0.38;
        if (anim.landingOutcome === 'sketchy') {
          const wobble = Math.sin(lt * Math.PI * 4) * 0.32 * lt;
          spineRotZ += wobble;
          lArmZ -= 0.55 * lt + wobble;
          rArmZ += 0.55 * lt - wobble;
          lHipX -= 0.18 * lt;
          rHipX -= 0.18 * lt;
          lKnee += 0.42 * lt;
          rKnee += 0.42 * lt;
          lFoot -= 0.24 * lt;
          rFoot -= 0.24 * lt;
        } else {
          const comp = Math.sin(lt * Math.PI);
          lHipX -= 0.22 * comp;
          rHipX -= 0.22 * comp;
          lKnee += 0.48 * comp;
          rKnee += 0.48 * comp;
          lFoot -= 0.26 * comp;
          rFoot -= 0.26 * comp;
          spineRotX += 0.22 * comp;
        }
      }
    }

    // Exact leg kinematic height compensation so shoe soles sit squarely ON griptape (y = 0.102)!
    let hipsPosY = 0.82;
    if (lockFeetToDeck) {
      const thighLen = 0.4;
      const shinLen = 0.41;
      const legReachL = thighLen * Math.cos(lHipX) + shinLen * Math.cos(lHipX + lKnee);
      const legReachR = thighLen * Math.cos(rHipX) + shinLen * Math.cos(rHipX + rKnee);
      const minReach = Math.min(legReachL, legReachR);
      // Sole offset below footGroup is 0.068; deck top above skaterBody is ~0.008 -> hipsPosY = minReach + 0.088
      hipsPosY = minReach + 0.088;
    }

    // Smoothly damp every joint for fluid transitions!
    skaterBody.position.x = damp(skaterBody.position.x, bodyPosX, lam, dt);
    skaterBody.position.y = damp(skaterBody.position.y, bodyPosY, lam, dt);
    skaterBody.position.z = damp(skaterBody.position.z, bodyPosZ, lam, dt);
    skaterBody.rotation.x = damp(skaterBody.rotation.x, bodyRotX, lam, dt);
    skaterBody.rotation.y = damp(skaterBody.rotation.y, bodyRotY, lam, dt);
    skaterBody.rotation.z = damp(skaterBody.rotation.z, bodyRotZ, lam, dt);

    hips.position.y = damp(hips.position.y, hipsPosY, lam, dt);
    spine.rotation.x = damp(spine.rotation.x, spineRotX, lam, dt);
    spine.rotation.y = damp(spine.rotation.y, spineRotY, lam, dt);
    spine.rotation.z = damp(spine.rotation.z, spineRotZ, lam, dt);

    headGroup.rotation.y = damp(headGroup.rotation.y, headRotY, lam, dt);
    headGroup.rotation.x = damp(headGroup.rotation.x, headRotX, lam, dt);
    headGroup.rotation.z = damp(headGroup.rotation.z, 0, lam, dt);

    leftLeg.hipJoint.rotation.x = damp(leftLeg.hipJoint.rotation.x, lHipX, lam, dt);
    leftLeg.hipJoint.rotation.y = damp(leftLeg.hipJoint.rotation.y, 0, lam, dt);
    leftLeg.hipJoint.rotation.z = damp(leftLeg.hipJoint.rotation.z, lHipZ, lam, dt);
    leftLeg.kneeJoint.rotation.x = damp(leftLeg.kneeJoint.rotation.x, lKnee, lam, dt);
    leftLeg.footGroup.rotation.x = damp(leftLeg.footGroup.rotation.x, lFoot, lam, dt);
    leftLeg.footGroup.rotation.z = damp(leftLeg.footGroup.rotation.z, 0, lam, dt);

    rightLeg.hipJoint.rotation.x = damp(rightLeg.hipJoint.rotation.x, rHipX, lam, dt);
    rightLeg.hipJoint.rotation.y = damp(rightLeg.hipJoint.rotation.y, 0, lam, dt);
    rightLeg.hipJoint.rotation.z = damp(rightLeg.hipJoint.rotation.z, rHipZ, lam, dt);
    rightLeg.kneeJoint.rotation.x = damp(rightLeg.kneeJoint.rotation.x, rKnee, lam, dt);
    rightLeg.footGroup.rotation.x = damp(rightLeg.footGroup.rotation.x, rFoot, lam, dt);
    rightLeg.footGroup.rotation.z = damp(rightLeg.footGroup.rotation.z, 0, lam, dt);

    leftArm.shoulder.rotation.x = damp(leftArm.shoulder.rotation.x, lArmX, lam, dt);
    leftArm.shoulder.rotation.y = damp(leftArm.shoulder.rotation.y, lArmY, lam, dt);
    leftArm.shoulder.rotation.z = damp(leftArm.shoulder.rotation.z, lArmZ, lam, dt);
    leftArm.elbow.rotation.x = damp(leftArm.elbow.rotation.x, lElbow, lam, dt);

    rightArm.shoulder.rotation.x = damp(rightArm.shoulder.rotation.x, rArmX, lam, dt);
    rightArm.shoulder.rotation.y = damp(rightArm.shoulder.rotation.y, rArmY, lam, dt);
    rightArm.shoulder.rotation.z = damp(rightArm.shoulder.rotation.z, rArmZ, lam, dt);
    rightArm.elbow.rotation.x = damp(rightArm.elbow.rotation.x, rElbow, lam, dt);
  };

  const dispose = () => {
    disposables.forEach((d) => d.dispose());
  };

  return {
    group: root,
    skateboardGroup,
    headGroup,
    applyConfig,
    setFirstPersonView,
    update,
    updateGameplay,
    dispose,
  };
}
