import * as THREE from 'three';
import { selectActiveParkSkaters } from '../data/skaterRoster';
import { NpcLiveStatus, SkaterProfile, SkaterStyleId, TrickId } from '../types/game';
import {
  clampInsideParkBounds,
  findNearestGrindSegment,
  GrindSnapResult,
  sampleSkateparkSurface,
  SurfaceSample,
} from './parkCollision';
import { SkaterAnimState, TRICK_CATALOG } from './skatePhysics';
import { buildHeroSkaterAndBoard, HeroSkaterHandle } from './skaterBuilder';
import { ProceduralTextureSet } from './textures';

interface Waypoint {
  x: number;
  z: number;
  popChance?: number;
  preferGrind?: boolean;
}

const CIRCUITS: Waypoint[][] = [
  // 0: Central Plaza -> Funbox -> Flatbar loop
  [
    { x: -3.8, z: 2.2, popChance: 0.2 },
    { x: -4.2, z: -2.0, preferGrind: true, popChance: 0.65 },
    { x: -1.6, z: -4.4, popChance: 0.45 },
    { x: 3.4, z: -4.4, popChance: 0.72, preferGrind: true },
    { x: 4.5, z: -0.2, popChance: 0.25 },
    { x: 0.4, z: 3.6, popChance: 0.3 },
  ],
  // 1: Bowl Deck & Bank Flow
  [
    { x: 1.8, z: -7.8, popChance: 0.25 },
    { x: -1.2, z: -8.6, popChance: 0.4 },
    { x: -5.2, z: -9.6, popChance: 0.5 },
    { x: -9.4, z: -7.6, popChance: 0.45 },
    { x: -9.6, z: -2.5, popChance: 0.55 },
    { x: -5.2, z: -1.4, popChance: 0.6 },
    { x: 0.2, z: -1.2, popChance: 0.3 },
  ],
  // 2: East Manual Pad & Long Flatbar Street Line
  [
    { x: 8.6, z: 1.2, popChance: 0.3 },
    { x: 13.5, z: 1.2, popChance: 0.85, preferGrind: true },
    { x: 18.6, z: 1.8, popChance: 0.25 },
    { x: 18.4, z: 5.5, popChance: 0.4 },
    { x: 13.5, z: 5.5, popChance: 0.68, preferGrind: true },
    { x: 8.4, z: 5.6, popChance: 0.2 },
  ],
  // 3: West A-Frame Spine & Quarter-Pipe Circuit
  [
    { x: -19.0, z: 7.0, popChance: 0.3 },
    { x: -14.5, z: 7.0, popChance: 0.78 },
    { x: -9.6, z: 6.8, popChance: 0.35 },
    { x: -9.8, z: 2.8, popChance: 0.5 },
    { x: -14.5, z: 2.2, popChance: 0.35 },
    { x: -19.2, z: 3.4, popChance: 0.25 },
  ],
  // 4: Wide Full-Park Cruiser & South Pipe
  [
    { x: -7.0, z: 12.2, popChance: 0.4 },
    { x: 0.0, z: 14.4, popChance: 0.65 },
    { x: 7.5, z: 12.0, popChance: 0.4 },
    { x: 12.2, z: 8.6, popChance: 0.3 },
    { x: 7.2, z: -6.8, popChance: 0.45 },
    { x: -1.2, z: -0.6, popChance: 0.5 },
  ],
  // 5: Mid-Park Technical Triangle (Flatbar <-> Bench <-> Funbox)
  [
    { x: -1.6, z: -0.6, popChance: 0.75, preferGrind: true },
    { x: -4.4, z: -1.8, popChance: 0.55 },
    { x: -2.2, z: -4.4, popChance: 0.65 },
    { x: 2.8, z: -4.4, popChance: 0.65, preferGrind: true },
    { x: 2.2, z: 2.2, popChance: 0.3 },
  ],
];

const STYLE_CIRCUIT_PRIORITY: Record<SkaterStyleId, number[]> = {
  rail_specialist: [2, 5, 0, 4, 1, 3],
  bowl_flow: [1, 4, 3, 0, 5, 2],
  big_air: [3, 4, 1, 0, 2, 5],
  technical_street: [0, 5, 2, 4, 1, 3],
  all_around: [4, 0, 1, 2, 5, 3],
};

const _up = new THREE.Vector3(0, 1, 0);
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _rotMat = new THREE.Matrix4();
const _targetQuat = new THREE.Quaternion();

interface NpcActor {
  profile: SkaterProfile;
  handle: HeroSkaterHandle;
  circuit: Waypoint[];
  wpIdx: number;

  pos: THREE.Vector3;
  vel: THREE.Vector3;
  heading: number;
  bodySpinOffset: number;
  groundNormal: THREE.Vector3;
  boardQuat: THREE.Quaternion;

  groundState: SkaterAnimState['groundState'];
  speed: number;
  targetSpeed: number;
  steerLean: number;
  pushPhase: number;
  pushIntensity: number;

  activeTrick: TrickId | null;
  trickElapsed: number;
  trickDuration: number;
  activeGrab: TrickId | null;
  activeGrind: TrickId | null;
  grindSnap: GrindSnapResult | null;
  grindBalance: number;
  grindCooldown: number;

  airStartY: number;
  airPeakY: number;
  airSpinRate: number;
  boardFlipRoll: number;
  boardShuvYaw: number;
  boardPopPitch: number;
  boardHardflipTilt: number;
  wheelSpinAngle: number;

  landingOutcome: SkaterAnimState['landingOutcome'];
  landingAnimTimer: number;
  crashTimer: number;
  crashNonce: number;
  crashVelX: number;
  crashVelZ: number;
  getUpTimer: number;
  trickDecisionCooldown: number;

  // Live performance & scoring tracked from actual park tricks
  liveScore: number;
  pendingComboPoints: number;
  pendingComboTricks: number;
  tricksLanded: number;
  bails: number;
  lastTrickName: string | null;
  grindPointsAccum: number;

  surface: SurfaceSample;
}

export class NpcParkManager {
  public readonly group = new THREE.Group();
  private readonly actors: NpcActor[] = [];
  private readonly textures: ProceduralTextureSet;
  private readonly parkCount: number;
  private isCompetition = false;
  private activeProfileKey = '';

  constructor(textures: ProceduralTextureSet, count = 6) {
    this.textures = textures;
    this.parkCount = count;
    this.group.name = 'NpcSkatersGroup';
    this.configureSession('', false);
  }

  public configureSession(
    eventTitle: string,
    isCompetition: boolean,
    customRoster?: SkaterProfile[],
    priorityIds?: string[],
  ) {
    this.isCompetition = isCompetition;
    let selected: SkaterProfile[];
    if (customRoster && customRoster.length > 0 && priorityIds && priorityIds.length > 0) {
      const prioritySet = new Set(priorityIds);
      const priorityPool = customRoster.filter((s) => prioritySet.has(s.id));
      const fillPool = customRoster.filter((s) => !prioritySet.has(s.id));
      selected = [...priorityPool, ...fillPool].slice(0, this.parkCount);
    } else if (customRoster && customRoster.length > 0) {
      const defaultSelected = selectActiveParkSkaters(this.parkCount, eventTitle);
      const idSet = new Set(defaultSelected.map((d) => d.id));
      const matched = customRoster.filter((c) => idSet.has(c.id));
      selected =
        matched.length >= Math.min(4, this.parkCount)
          ? matched.slice(0, this.parkCount)
          : customRoster.slice(0, this.parkCount);
    } else {
      selected = selectActiveParkSkaters(this.parkCount, eventTitle);
    }

    const nextKey = selected.map((s) => s.id).join(',');

    if (nextKey !== this.activeProfileKey || this.actors.length === 0) {
      this.rebuildActors(selected);
      this.activeProfileKey = nextKey;
    } else {
      this.resetActorsForNewSession();
    }
  }

  private pickCircuitForActor(style: SkaterStyleId, usedCircuits: Set<number>, fallbackIdx: number): { circuit: Waypoint[]; circuitIdx: number } {
    const priorities = STYLE_CIRCUIT_PRIORITY[style] ?? [0, 1, 2, 3, 4, 5];
    for (let i = 0; i < priorities.length; i++) {
      const cIdx = priorities[i];
      if (!usedCircuits.has(cIdx)) {
        usedCircuits.add(cIdx);
        return { circuit: CIRCUITS[cIdx], circuitIdx: cIdx };
      }
    }
    const cIdx = fallbackIdx % CIRCUITS.length;
    return { circuit: CIRCUITS[cIdx], circuitIdx: cIdx };
  }

  private rebuildActors(selected: SkaterProfile[]) {
    for (let i = 0; i < this.actors.length; i++) {
      this.group.remove(this.actors[i].handle.group);
      this.actors[i].handle.dispose();
    }
    this.actors.length = 0;

    const usedCircuits = new Set<number>();

    selected.forEach((profile, idx) => {
      const handle = buildHeroSkaterAndBoard(this.textures, profile.appearance.outfit, {
        skinColor: profile.appearance.skinColor,
        hairColor: profile.appearance.hairColor,
        visualModel: profile.appearance.visualModel,
        isNpc: true,
      });

      const { circuit } = this.pickCircuitForActor(profile.style, usedCircuits, idx);
      const startWpIdx = (idx * 2) % circuit.length;
      const startWp = circuit[startWpIdx];
      const nextWpIdx = (startWpIdx + 1) % circuit.length;
      const nextWp = circuit[nextWpIdx];
      const initHeading = Math.atan2(nextWp.x - startWp.x, nextWp.z - startWp.z);

      const surface: SurfaceSample = {
        height: 0,
        normal: new THREE.Vector3(0, 1, 0),
        isTransition: false,
        blockedByWall: false,
        wallNormalX: 0,
        wallNormalZ: 0,
      };
      sampleSkateparkSurface(startWp.x, 0.5, startWp.z, surface);

      const controlBonus = (profile.attributes.boardControl - 65) / 35;
      const cruiseSpeed = 6.2 + Math.max(0, controlBonus) * 3.1;

      const actor: NpcActor = {
        profile,
        handle,
        circuit,
        wpIdx: nextWpIdx,
        pos: new THREE.Vector3(startWp.x, surface.height, startWp.z),
        vel: new THREE.Vector3(Math.sin(initHeading) * cruiseSpeed, 0, Math.cos(initHeading) * cruiseSpeed),
        heading: initHeading,
        bodySpinOffset: 0,
        groundNormal: surface.normal.clone(),
        boardQuat: new THREE.Quaternion(),
        groundState: 'grounded',
        speed: cruiseSpeed,
        targetSpeed: cruiseSpeed,
        steerLean: 0,
        pushPhase: idx * 1.3,
        pushIntensity: 0,
        activeTrick: null,
        trickElapsed: 0,
        trickDuration: 0.5,
        activeGrab: null,
        activeGrind: null,
        grindSnap: null,
        grindBalance: 0,
        grindCooldown: 0,
        airStartY: surface.height,
        airPeakY: surface.height,
        airSpinRate: 0,
        boardFlipRoll: 0,
        boardShuvYaw: 0,
        boardPopPitch: 0,
        boardHardflipTilt: 0,
        wheelSpinAngle: 0,
        landingOutcome: null,
        landingAnimTimer: 0,
        crashTimer: 0,
        crashNonce: 0,
        crashVelX: 0,
        crashVelZ: 0,
        getUpTimer: 0,
        trickDecisionCooldown: 0.8 + idx * 0.45,
        liveScore: 0,
        pendingComboPoints: 0,
        pendingComboTricks: 0,
        tricksLanded: 0,
        bails: 0,
        lastTrickName: null,
        grindPointsAccum: 0,
        surface,
      };

      this.syncActorOrientation(actor, 1);
      handle.group.position.copy(actor.pos);
      handle.group.quaternion.copy(actor.boardQuat);
      this.group.add(handle.group);
      this.actors.push(actor);
    });
  }

  private resetActorsForNewSession() {
    for (let i = 0; i < this.actors.length; i++) {
      const actor = this.actors[i];
      const startWpIdx = (i * 2) % actor.circuit.length;
      const startWp = actor.circuit[startWpIdx];
      const nextWpIdx = (startWpIdx + 1) % actor.circuit.length;
      const nextWp = actor.circuit[nextWpIdx];
      const initHeading = Math.atan2(nextWp.x - startWp.x, nextWp.z - startWp.z);

      sampleSkateparkSurface(startWp.x, 0.5, startWp.z, actor.surface);
      actor.wpIdx = nextWpIdx;
      actor.pos.set(startWp.x, actor.surface.height, startWp.z);
      actor.heading = initHeading;
      actor.speed = actor.targetSpeed;
      actor.vel.set(Math.sin(initHeading) * actor.speed, 0, Math.cos(initHeading) * actor.speed);
      actor.bodySpinOffset = 0;
      actor.groundNormal.copy(actor.surface.normal);
      actor.groundState = 'grounded';
      actor.activeTrick = null;
      actor.activeGrab = null;
      actor.activeGrind = null;
      actor.grindSnap = null;
      actor.landingOutcome = null;
      actor.landingAnimTimer = 0;
      actor.crashTimer = 0;
      actor.getUpTimer = 0;
      actor.trickDecisionCooldown = 0.7 + i * 0.4;
      actor.liveScore = 0;
      actor.pendingComboPoints = 0;
      actor.pendingComboTricks = 0;
      actor.tricksLanded = 0;
      actor.bails = 0;
      actor.lastTrickName = null;
      actor.grindPointsAccum = 0;

      this.syncActorOrientation(actor, 1);
      actor.handle.group.position.copy(actor.pos);
      actor.handle.group.quaternion.copy(actor.boardQuat);
    }
  }

  public setVisible(visible: boolean) {
    this.group.visible = visible;
  }

  public getLiveStatuses(): NpcLiveStatus[] {
    return this.actors
      .map((a) => ({
        skaterId: a.profile.id,
        competitorNumber: a.profile.competitorNumber,
        name: `${a.profile.firstName} ${a.profile.lastName}`,
        nationalityCode: a.profile.nationalityCode,
        style: a.profile.style,
        liveScore: Math.round(a.liveScore),
        tricksLanded: a.tricksLanded,
        bails: a.bails,
        lastTrickName: a.lastTrickName,
        state: a.groundState,
      }))
      .sort((a, b) => b.liveScore - a.liveScore);
  }

  public update(
    rawDt: number,
    playerPos: THREE.Vector3,
    timeScale: number,
    isGameplay: boolean,
  ) {
    this.group.visible = isGameplay;
    if (!isGameplay) return;

    const worldScale = THREE.MathUtils.lerp(1.0, timeScale, 0.72);
    const dt = Math.min(rawDt, 0.04) * worldScale;

    for (let i = 0; i < this.actors.length; i++) {
      this.stepActor(this.actors[i], i, dt, rawDt, playerPos);
    }
  }

  private pickTrickForProfile(profile: SkaterProfile, preferSpin: boolean): TrickId {
    const tech = profile.attributes.technicalSkill;
    const creativity = profile.attributes.creativity;
    const roll = Math.random();

    if (preferSpin && tech >= 78 && roll < 0.42) {
      return creativity >= 83 && Math.random() < 0.45
        ? Math.random() < 0.5
          ? 'fs_360'
          : 'bs_360'
        : Math.random() < 0.5
          ? 'fs_180'
          : 'bs_180';
    }

    const pool: TrickId[] = ['ollie', 'kickflip', 'heelflip', 'pop_shove_it'];
    if (tech >= 77) pool.push('varial_kickflip', 'shove_it_360', 'nollie');
    if (tech >= 83) pool.push('flip_360', 'hardflip');
    if (tech >= 89 || creativity >= 88) pool.push('inward_heelflip', 'fs_360');

    return pool[Math.floor(Math.random() * pool.length)];
  }

  private pickGrabForProfile(profile: SkaterProfile): TrickId | null {
    const grabChance = 0.25 + ((profile.attributes.creativity - 65) / 35) * 0.45;
    if (Math.random() > grabChance) return null;
    const grabs: TrickId[] =
      profile.attributes.creativity >= 84
        ? ['indy', 'melon', 'method', 'nose_grab', 'tail_grab']
        : ['indy', 'melon', 'tail_grab'];
    return grabs[Math.floor(Math.random() * grabs.length)];
  }

  private triggerActorAirTrick(actor: NpcActor, trickId: TrickId) {
    const def = TRICK_CATALOG[trickId];
    const powerBonus = (actor.profile.attributes.technicalSkill - 75) * 0.025;
    const popImpulse = (def.popImpulse > 0 ? def.popImpulse : 6.2) + Math.max(0, powerBonus);

    actor.vel.y = Math.max(popImpulse, Math.max(0, actor.vel.y) * 0.8 + popImpulse * 0.72);
    actor.groundState = 'airborne';
    actor.airStartY = actor.pos.y;
    actor.airPeakY = actor.pos.y;
    actor.activeTrick = trickId;
    actor.trickElapsed = 0;
    actor.trickDuration = def.duration;
    actor.activeGrab = null;
    actor.activeGrind = null;
    actor.grindSnap = null;
    actor.pendingComboPoints += def.points;
    actor.pendingComboTricks += 1;
    actor.lastTrickName = def.name;

    if (trickId === 'fs_180') actor.airSpinRate = Math.PI / def.duration;
    else if (trickId === 'bs_180') actor.airSpinRate = -Math.PI / def.duration;
    else if (trickId === 'fs_360') actor.airSpinRate = (Math.PI * 2) / def.duration;
    else if (trickId === 'bs_360') actor.airSpinRate = (-Math.PI * 2) / def.duration;
    else actor.airSpinRate = 0;
  }

  private triggerActorBail(actor: NpcActor) {
    actor.crashVelX = actor.vel.x * 0.9;
    actor.crashVelZ = actor.vel.z * 0.9;
    actor.crashNonce += 1;
    actor.groundState = 'crashed';
    actor.crashTimer = 1.45;
    actor.getUpTimer = 0.62;
    actor.speed *= 0.25;
    actor.vel.multiplyScalar(0.25);
    actor.vel.y = 0;
    actor.activeTrick = null;
    actor.activeGrab = null;
    actor.activeGrind = null;
    actor.grindSnap = null;
    actor.boardFlipRoll = 0;
    actor.boardShuvYaw = 0;
    actor.boardPopPitch = 0;
    actor.boardHardflipTilt = 0;
    actor.bodySpinOffset = 0;
    actor.landingOutcome = 'bail';
    actor.pendingComboPoints = 0;
    actor.pendingComboTricks = 0;
    actor.grindPointsAccum = 0;
    actor.bails += 1;
    actor.lastTrickName = 'Bail';
  }

  private bankActorCombo(actor: NpcActor, outcome: 'perfect' | 'sketchy') {
    if (actor.pendingComboPoints <= 0) return;
    const precisionMult = outcome === 'perfect' ? 1.18 : 0.72;
    const compBonus = this.isCompetition
      ? 1 + (actor.profile.attributes.competitiveExperience - 70) * 0.004
      : 1;
    const comboMult = Math.max(1, actor.pendingComboTricks);
    const awarded = Math.round(actor.pendingComboPoints * comboMult * precisionMult * compBonus);

    actor.liveScore += awarded;
    actor.tricksLanded += actor.pendingComboTricks;
    actor.pendingComboPoints = 0;
    actor.pendingComboTricks = 0;
    actor.grindPointsAccum = 0;
  }

  private stepActor(
    actor: NpcActor,
    actorIdx: number,
    dt: number,
    rawDt: number,
    playerPos: THREE.Vector3,
  ) {
    if (actor.landingAnimTimer > 0) actor.landingAnimTimer = Math.max(0, actor.landingAnimTimer - dt);
    if (actor.grindCooldown > 0) actor.grindCooldown = Math.max(0, actor.grindCooldown - dt);
    if (actor.trickDecisionCooldown > 0) actor.trickDecisionCooldown = Math.max(0, actor.trickDecisionCooldown - dt);

    // 1. Crash & Recovery (real-time pacing so ragdoll settles naturally)
    if (actor.groundState === 'crashed') {
      actor.crashTimer -= rawDt;
      actor.pos.x += actor.vel.x * rawDt;
      actor.pos.z += actor.vel.z * rawDt;
      actor.vel.multiplyScalar(Math.exp(-4.2 * rawDt));
      sampleSkateparkSurface(actor.pos.x, actor.pos.y + 0.2, actor.pos.z, actor.surface);
      actor.pos.y = actor.surface.height;
      clampInsideParkBounds(actor.pos, actor.vel);
      if (actor.crashTimer <= 0) {
        actor.groundState = 'getting_up';
      }
      this.pushRenderPose(actor, rawDt);
      return;
    }

    if (actor.groundState === 'getting_up') {
      actor.getUpTimer -= rawDt;
      if (actor.getUpTimer <= 0) {
        actor.groundState = 'grounded';
        actor.speed = 4.2;
        actor.landingOutcome = null;
      }
      this.pushRenderPose(actor, rawDt);
      return;
    }

    // 2. Active State Physics
    if (actor.groundState === 'grounded') {
      this.stepActorGrounded(actor, actorIdx, dt, playerPos);
    } else if (actor.groundState === 'airborne') {
      this.stepActorAirborne(actor, dt);
    } else if (actor.groundState === 'grinding') {
      this.stepActorGrinding(actor, dt);
    }

    actor.wheelSpinAngle += (actor.speed / 0.028) * dt * 0.35;
    this.syncActorOrientation(actor, dt);
    this.pushRenderPose(actor, dt);
  }

  private stepActorGrounded(
    actor: NpcActor,
    actorIdx: number,
    dt: number,
    playerPos: THREE.Vector3,
  ) {
    const wp = actor.circuit[actor.wpIdx];
    let dx = wp.x - actor.pos.x;
    let dz = wp.z - actor.pos.z;
    const distToWp = Math.hypot(dx, dz);

    if (distToWp < 1.85) {
      const stylePopBias =
        actor.profile.style === 'rail_specialist' && wp.preferGrind
          ? 0.24
          : actor.profile.style === 'big_air'
            ? 0.16
            : actor.profile.style === 'technical_street'
              ? 0.12
              : 0;
      const creativityBias = (actor.profile.attributes.creativity - 78) * 0.005;

      if (
        actor.trickDecisionCooldown <= 0 &&
        wp.popChance &&
        Math.random() < wp.popChance + stylePopBias + creativityBias
      ) {
        const trick = this.pickTrickForProfile(actor.profile, !wp.preferGrind && Math.random() < 0.34);
        this.triggerActorAirTrick(actor, trick);
        actor.trickDecisionCooldown = Math.max(
          0.75,
          1.65 - (actor.profile.attributes.creativity - 70) * 0.018,
        );
      }
      actor.wpIdx = (actor.wpIdx + 1) % actor.circuit.length;
      const next = actor.circuit[actor.wpIdx];
      dx = next.x - actor.pos.x;
      dz = next.z - actor.pos.z;
    }

    // Repulsion vector away from player & sibling NPCs so riders don't overlap awkwardly
    let avoidX = 0;
    let avoidZ = 0;
    const pDx = actor.pos.x - playerPos.x;
    const pDz = actor.pos.z - playerPos.z;
    const pDist = Math.hypot(pDx, pDz);
    if (pDist > 0.05 && pDist < 2.5) {
      const weight = ((2.5 - pDist) / 2.5) * 4.5;
      avoidX += (pDx / pDist) * weight;
      avoidZ += (pDz / pDist) * weight;
    }

    for (let j = 0; j < this.actors.length; j++) {
      if (j === actorIdx) continue;
      const other = this.actors[j];
      const oDx = actor.pos.x - other.pos.x;
      const oDz = actor.pos.z - other.pos.z;
      const oDist = Math.hypot(oDx, oDz);
      if (oDist > 0.05 && oDist < 2.2) {
        const weight = ((2.2 - oDist) / 2.2) * 3.8;
        avoidX += (oDx / oDist) * weight;
        avoidZ += (oDz / oDist) * weight;
      }
    }

    const desiredAngle = Math.atan2(dx + avoidX, dz + avoidZ);
    let angleDiff = desiredAngle - actor.heading;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const maxTurn = (2.1 + (actor.profile.attributes.boardControl - 70) * 0.03) * dt;
    const steerDelta = THREE.MathUtils.clamp(angleDiff, -maxTurn, maxTurn);
    actor.heading += steerDelta;
    actor.steerLean = THREE.MathUtils.damp(
      actor.steerLean,
      THREE.MathUtils.clamp(-angleDiff * 1.4, -1, 1),
      8,
      dt,
    );

    // Pumping / cruise speed control
    const wantSpeed = actor.targetSpeed;
    const pushing = actor.speed < wantSpeed - 0.55;
    actor.pushIntensity = THREE.MathUtils.damp(actor.pushIntensity, pushing ? 0.72 : 0, 6, dt);
    if (pushing) {
      actor.pushPhase += dt * 7.2;
      actor.speed += 5.4 * dt;
    } else {
      actor.speed = THREE.MathUtils.damp(actor.speed, wantSpeed, 2.2, dt);
    }

    sampleSkateparkSurface(actor.pos.x, actor.pos.y + 0.16, actor.pos.z, actor.surface);
    _fwd.set(Math.sin(actor.heading), 0, Math.cos(actor.heading));
    const dotN = _fwd.dot(actor.surface.normal);
    _fwd.addScaledVector(actor.surface.normal, -dotN).normalize();

    const slopeAccel = -16.5 * _fwd.y;
    actor.speed = THREE.MathUtils.clamp(actor.speed + slopeAccel * dt, 2.8, 14.8);
    actor.vel.copy(_fwd).multiplyScalar(actor.speed);

    const prevY = actor.pos.y;
    const prevWasTrans = actor.surface.isTransition;

    actor.pos.x += actor.vel.x * dt;
    actor.pos.z += actor.vel.z * dt;
    clampInsideParkBounds(actor.pos, actor.vel);

    sampleSkateparkSurface(actor.pos.x, actor.pos.y + 0.16, actor.pos.z, actor.surface);
    if (actor.surface.blockedByWall) {
      const nx = actor.surface.wallNormalX;
      const nz = actor.surface.wallNormalZ;
      actor.pos.x += nx * 0.14;
      actor.pos.z += nz * 0.14;
      actor.heading = Math.atan2(nx + _fwd.x * 0.4, nz + _fwd.z * 0.4);
      sampleSkateparkSurface(actor.pos.x, actor.pos.y + 0.16, actor.pos.z, actor.surface);
    }

    if (
      (prevWasTrans && !actor.surface.isTransition && actor.vel.y > 2.2) ||
      actor.surface.height - prevY < -0.28
    ) {
      actor.groundState = 'airborne';
      actor.airStartY = prevY;
      actor.airPeakY = prevY;
      if (actor.vel.y > 1.8) actor.vel.y = Math.max(actor.vel.y * 1.08, 4.1);
      if (actor.trickDecisionCooldown <= 0 && Math.random() < 0.72) {
        const trick = this.pickTrickForProfile(actor.profile, true);
        const def = TRICK_CATALOG[trick];
        actor.activeTrick = trick;
        actor.trickElapsed = 0;
        actor.trickDuration = def.duration;
        actor.pendingComboPoints += def.points;
        actor.pendingComboTricks += 1;
        actor.lastTrickName = def.name;
        actor.trickDecisionCooldown = 1.35;
      }
    } else {
      actor.pos.y = actor.surface.height;
      actor.groundNormal.lerp(actor.surface.normal, Math.min(1, dt * 14)).normalize();
    }

    actor.boardFlipRoll = THREE.MathUtils.damp(actor.boardFlipRoll, 0, 14, dt);
    actor.boardShuvYaw = THREE.MathUtils.damp(actor.boardShuvYaw, 0, 14, dt);
    actor.boardPopPitch = THREE.MathUtils.damp(actor.boardPopPitch, 0, 14, dt);
    actor.boardHardflipTilt = THREE.MathUtils.damp(actor.boardHardflipTilt, 0, 14, dt);
  }

  private stepActorAirborne(actor: NpcActor, dt: number) {
    actor.vel.y -= 18.5 * dt;
    actor.pos.x += actor.vel.x * dt;
    actor.pos.y += actor.vel.y * dt;
    actor.pos.z += actor.vel.z * dt;
    clampInsideParkBounds(actor.pos, actor.vel);

    if (actor.pos.y > actor.airPeakY) {
      actor.airPeakY = actor.pos.y;
    }

    if (actor.activeTrick) {
      const def = TRICK_CATALOG[actor.activeTrick];
      actor.trickElapsed += dt;
      const t = THREE.MathUtils.clamp(actor.trickElapsed / actor.trickDuration, 0, 1);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      actor.boardFlipRoll = def.flipRollTurns * Math.PI * 2 * ease;
      actor.boardShuvYaw = def.shuvYawTurns * Math.PI * 2 * ease;
      actor.boardPopPitch = def.popPitchSign * Math.sin(t * Math.PI) * 0.45;
      actor.boardHardflipTilt = def.hardflipTilt ? Math.sin(t * Math.PI) * 0.68 : 0;

      if (t >= 0.85 && !actor.activeGrab && actor.vel.y > -1.0 && actor.pos.y - actor.airStartY > 0.72) {
        const grab = this.pickGrabForProfile(actor.profile);
        if (grab) {
          actor.activeGrab = grab;
          const grabDef = TRICK_CATALOG[grab];
          actor.pendingComboPoints += grabDef.points;
          actor.pendingComboTricks += 1;
          actor.lastTrickName = grabDef.name;
        }
      }
      if (t >= 0.95 && actor.activeGrab && actor.vel.y < -2.6) {
        actor.activeGrab = null;
      }
    }

    if (actor.airSpinRate !== 0) {
      actor.bodySpinOffset += actor.airSpinRate * dt;
    }

    // Grind detection
    if (actor.grindCooldown <= 0 && actor.vel.y <= 1.8) {
      const snap = findNearestGrindSegment(actor.pos, actor.vel, 0.52, 0.44);
      if (snap) {
        actor.groundState = 'grinding';
        actor.grindSnap = snap;
        actor.pos.copy(snap.point);
        actor.speed = Math.max(4.6, Math.hypot(actor.vel.x, actor.vel.z));
        actor.vel.copy(snap.tangent).multiplyScalar(actor.speed);
        const railYaw = Math.atan2(snap.tangent.x, snap.tangent.z);
        const preferSlide = actor.profile.style === 'rail_specialist' && Math.random() < 0.52;
        actor.heading = railYaw;
        actor.bodySpinOffset = preferSlide ? Math.PI / 2 : 0;
        actor.activeTrick = null;
        actor.activeGrab = null;
        actor.boardFlipRoll = 0;
        actor.boardShuvYaw = 0;
        actor.boardPopPitch = 0;
        actor.boardHardflipTilt = 0;
        const grindId: TrickId = preferSlide
          ? Math.random() < 0.45
            ? 'lipslide'
            : 'boardslide'
          : Math.random() < 0.55
            ? 'grind_50_50'
            : Math.random() < 0.5
              ? 'grind_5_0'
              : 'nosegrind';
        actor.activeGrind = grindId;
        const grindDef = TRICK_CATALOG[grindId];
        actor.pendingComboPoints += grindDef.points;
        actor.pendingComboTricks += 1;
        actor.lastTrickName = grindDef.name;
        actor.grindPointsAccum = 0;
        actor.grindBalance = (Math.random() - 0.5) * 0.28;
        return;
      }
    }

    // Touchdown resolution driven by Precision + Consistency + Competitive Experience
    sampleSkateparkSurface(actor.pos.x, actor.pos.y, actor.pos.z, actor.surface);
    if (actor.pos.y <= actor.surface.height) {
      actor.pos.y = actor.surface.height;
      actor.groundNormal.copy(actor.surface.normal);
      const halfTurns = Math.round(actor.bodySpinOffset / Math.PI);
      actor.heading += halfTurns * Math.PI;
      actor.bodySpinOffset = 0;
      actor.airSpinRate = 0;
      actor.activeGrab = null;

      const cons = actor.profile.attributes.consistency;
      const prec = actor.profile.attributes.trickPrecision;
      const exp = actor.profile.attributes.competitiveExperience;
      const diffBonus = actor.activeTrick ? TRICK_CATALOG[actor.activeTrick].difficultyWeight * 0.025 : 0;
      const pressureScale = this.isCompetition ? 1 + (85 - exp) * 0.008 : 1;
      const bailProb = Math.max(
        0.015,
        ((100 - cons) * 0.0024 + (100 - prec) * 0.0014) * (1 + diffBonus) * pressureScale,
      );

      actor.activeTrick = null;
      actor.boardFlipRoll = 0;
      actor.boardShuvYaw = 0;
      actor.boardPopPitch = 0;
      actor.boardHardflipTilt = 0;

      if (Math.random() < bailProb) {
        this.triggerActorBail(actor);
        return;
      }

      actor.groundState = 'grounded';
      const sketchyProb = Math.max(0.05, (98 - prec) * 0.0045);
      const outcome: 'perfect' | 'sketchy' = Math.random() < sketchyProb ? 'sketchy' : 'perfect';
      actor.landingOutcome = outcome;
      actor.landingAnimTimer = 0.36;
      actor.speed = Math.max(3.8, Math.hypot(actor.vel.x, actor.vel.z));
      this.bankActorCombo(actor, outcome);
    }
  }

  private stepActorGrinding(actor: NpcActor, dt: number) {
    if (!actor.grindSnap) {
      actor.groundState = 'airborne';
      return;
    }

    const slopeAssist = -10.0 * actor.grindSnap.tangent.y;
    actor.speed = Math.max(3.8, actor.speed + slopeAssist * dt - 0.5 * dt);
    actor.vel.copy(actor.grindSnap.tangent).multiplyScalar(actor.speed);
    actor.pos.addScaledVector(actor.vel, dt);

    actor.grindBalance =
      Math.sin(actor.wheelSpinAngle * 0.14) * ((105 - actor.profile.attributes.boardControl) * 0.011);
    actor.grindPointsAccum += 160 * dt;

    const nextSnap = findNearestGrindSegment(actor.pos, actor.vel, 0.54, 0.5);
    if (!nextSnap) {
      actor.pendingComboPoints += Math.round(actor.grindPointsAccum);
      actor.grindPointsAccum = 0;
      actor.groundState = 'airborne';
      actor.activeGrind = null;
      actor.grindSnap = null;
      actor.grindCooldown = 0.3;
      actor.vel.y = Math.max(actor.vel.y, 1.8);
      actor.bodySpinOffset = 0;
      return;
    }

    actor.grindSnap = nextSnap;
    actor.pos.y = nextSnap.point.y;
    actor.groundNormal.set(0, 1, 0);
  }

  private syncActorOrientation(actor: NpcActor, dt: number) {
    const yaw = actor.heading + actor.bodySpinOffset;
    _fwd.set(Math.sin(yaw), 0, Math.cos(yaw));
    const n = actor.groundState === 'airborne' ? _up : actor.groundNormal;
    _right.crossVectors(n, _fwd).normalize();
    _fwd.crossVectors(_right, n).normalize();
    _rotMat.makeBasis(_right, n, _fwd);
    _targetQuat.setFromRotationMatrix(_rotMat);
    actor.boardQuat.slerp(_targetQuat, Math.min(1, dt * 14));
  }

  private pushRenderPose(actor: NpcActor, dt: number) {
    actor.handle.group.position.copy(actor.pos);
    actor.handle.group.quaternion.copy(actor.boardQuat);

    const anim: SkaterAnimState = {
      groundState: actor.groundState,
      speed: actor.speed,
      steerLean: actor.steerLean,
      pushPhase: actor.pushPhase,
      pushIntensity: actor.pushIntensity,
      braking: 0,
      powerslideAngle: 0,
      crouchAmount: 0,
      pumpG: actor.surface.isTransition ? Math.min(1, actor.speed / 10) : 0,
      activeTrick: actor.activeTrick,
      trickProgress:
        actor.activeTrick && actor.trickDuration > 0
          ? THREE.MathUtils.clamp(actor.trickElapsed / actor.trickDuration, 0, 1)
          : 0,
      activeGrab: actor.activeGrab,
      activeGrind: actor.activeGrind,
      grindBalance: actor.grindBalance,
      landingOutcome: actor.landingOutcome,
      landingTimer: actor.landingAnimTimer,
      crashTimer: actor.crashTimer,
      crashNonce: actor.crashNonce,
      crashVelX: actor.crashVelX,
      crashVelZ: actor.crashVelZ,
      getUpProgress: actor.groundState === 'getting_up' ? 1 - actor.getUpTimer / 0.62 : 0,
      boardFlipRoll: actor.boardFlipRoll,
      boardShuvYaw: actor.boardShuvYaw,
      boardPopPitch: actor.boardPopPitch,
      boardHardflipTilt: actor.boardHardflipTilt,
      wheelSpinAngle: actor.wheelSpinAngle,
    };

    actor.handle.updateGameplay(anim, dt);
  }

  public dispose() {
    for (let i = 0; i < this.actors.length; i++) {
      this.actors[i].handle.dispose();
    }
    this.actors.length = 0;
  }
}
