import * as THREE from 'three';
import {
  ComboEntry,
  CompetitionScores,
  GameplayHudState,
  GameplayMode,
  GameplayRuleMode,
  GameplayRunSummary,
  GameplaySessionConfig,
  LandingOutcome,
  LeaderboardEntry,
  NationalityCode,
  SkaterProfile,
  TrickCategory,
  TrickId,
} from '../types/game';
import {
  clampInsideParkBounds,
  findNearestGrindSegment,
  GrindSnapResult,
  sampleSkateparkSurface,
  SurfaceSample,
} from './parkCollision';
import { soundEngine } from '../audio/soundEngine';
import {
  generateDynamicCompetitionField,
  simulateNpcCompetitionRun,
  SKATER_ROSTER,
} from '../data/skaterRoster';

export interface TrickDefinition {
  id: TrickId;
  name: string;
  points: number;
  category: TrickCategory;
  duration: number;
  popImpulse: number;
  flipRollTurns: number; // +1 = kickflip, -1 = heelflip
  shuvYawTurns: number; // +0.5 = 180 shuv, +1 = 360 shuv, -0.5 = fs shuv
  popPitchSign: number; // +1 = tail pop (ollie), -1 = nose pop (nollie)
  hardflipTilt?: boolean;
  difficultyWeight: number;
}

export const TRICK_CATALOG: Record<TrickId, TrickDefinition> = {
  ollie: { id: 'ollie', name: 'Ollie', points: 100, category: 'basic', duration: 0.42, popImpulse: 6.4, flipRollTurns: 0, shuvYawTurns: 0, popPitchSign: 1, difficultyWeight: 1.0 },
  nollie: { id: 'nollie', name: 'Nollie', points: 130, category: 'basic', duration: 0.42, popImpulse: 6.3, flipRollTurns: 0, shuvYawTurns: 0, popPitchSign: -1, difficultyWeight: 1.2 },
  kickflip: { id: 'kickflip', name: 'Kickflip', points: 220, category: 'basic', duration: 0.56, popImpulse: 6.6, flipRollTurns: 1, shuvYawTurns: 0, popPitchSign: 1, difficultyWeight: 1.5 },
  heelflip: { id: 'heelflip', name: 'Heelflip', points: 220, category: 'basic', duration: 0.56, popImpulse: 6.6, flipRollTurns: -1, shuvYawTurns: 0, popPitchSign: 1, difficultyWeight: 1.5 },
  pop_shove_it: { id: 'pop_shove_it', name: 'Pop Shove-it', points: 180, category: 'basic', duration: 0.5, popImpulse: 6.3, flipRollTurns: 0, shuvYawTurns: 0.5, popPitchSign: 1, difficultyWeight: 1.3 },
  shove_it_360: { id: 'shove_it_360', name: '360 Shove-it', points: 320, category: 'basic', duration: 0.64, popImpulse: 6.8, flipRollTurns: 0, shuvYawTurns: 1.0, popPitchSign: 1, difficultyWeight: 1.9 },

  flip_360: { id: 'flip_360', name: '360 Flip', points: 480, category: 'advanced', duration: 0.72, popImpulse: 7.1, flipRollTurns: 1, shuvYawTurns: 1.0, popPitchSign: 1, difficultyWeight: 2.6 },
  varial_kickflip: { id: 'varial_kickflip', name: 'Varial Kickflip', points: 360, category: 'advanced', duration: 0.62, popImpulse: 6.8, flipRollTurns: 1, shuvYawTurns: 0.5, popPitchSign: 1, difficultyWeight: 2.1 },
  hardflip: { id: 'hardflip', name: 'Hardflip', points: 440, category: 'advanced', duration: 0.66, popImpulse: 7.0, flipRollTurns: 1, shuvYawTurns: -0.5, popPitchSign: 1, hardflipTilt: true, difficultyWeight: 2.5 },
  inward_heelflip: { id: 'inward_heelflip', name: 'Inward Heelflip', points: 440, category: 'advanced', duration: 0.66, popImpulse: 7.0, flipRollTurns: -1, shuvYawTurns: 0.5, popPitchSign: 1, hardflipTilt: true, difficultyWeight: 2.5 },
  fs_180: { id: 'fs_180', name: 'Frontside 180', points: 260, category: 'advanced', duration: 0.55, popImpulse: 6.6, flipRollTurns: 0, shuvYawTurns: 0, popPitchSign: 1, difficultyWeight: 1.7 },
  bs_180: { id: 'bs_180', name: 'Backside 180', points: 260, category: 'advanced', duration: 0.55, popImpulse: 6.6, flipRollTurns: 0, shuvYawTurns: 0, popPitchSign: 1, difficultyWeight: 1.7 },
  fs_360: { id: 'fs_360', name: 'Frontside 360', points: 520, category: 'advanced', duration: 0.78, popImpulse: 7.5, flipRollTurns: 0, shuvYawTurns: 0, popPitchSign: 1, difficultyWeight: 2.8 },
  bs_360: { id: 'bs_360', name: 'Backside 360', points: 520, category: 'advanced', duration: 0.78, popImpulse: 7.5, flipRollTurns: 0, shuvYawTurns: 0, popPitchSign: 1, difficultyWeight: 2.8 },

  indy: { id: 'indy', name: 'Indy Grab', points: 240, category: 'grab', duration: 0.45, popImpulse: 0, flipRollTurns: 0, shuvYawTurns: 0, popPitchSign: 1, difficultyWeight: 1.6 },
  melon: { id: 'melon', name: 'Melon Grab', points: 240, category: 'grab', duration: 0.45, popImpulse: 0, flipRollTurns: 0, shuvYawTurns: 0, popPitchSign: 1, difficultyWeight: 1.6 },
  method: { id: 'method', name: 'Method', points: 340, category: 'grab', duration: 0.5, popImpulse: 0, flipRollTurns: 0, shuvYawTurns: 0, popPitchSign: 1, difficultyWeight: 2.2 },
  nose_grab: { id: 'nose_grab', name: 'Nose Grab', points: 260, category: 'grab', duration: 0.45, popImpulse: 0, flipRollTurns: 0, shuvYawTurns: 0, popPitchSign: 1, difficultyWeight: 1.7 },
  tail_grab: { id: 'tail_grab', name: 'Tail Grab', points: 260, category: 'grab', duration: 0.45, popImpulse: 0, flipRollTurns: 0, shuvYawTurns: 0, popPitchSign: 1, difficultyWeight: 1.7 },

  grind_50_50: { id: 'grind_50_50', name: '50-50 Grind', points: 220, category: 'grind', duration: 0.4, popImpulse: 0, flipRollTurns: 0, shuvYawTurns: 0, popPitchSign: 1, difficultyWeight: 1.5 },
  grind_5_0: { id: 'grind_5_0', name: '5-0 Grind', points: 270, category: 'grind', duration: 0.4, popImpulse: 0, flipRollTurns: 0, shuvYawTurns: 0, popPitchSign: 1, difficultyWeight: 1.9 },
  nosegrind: { id: 'nosegrind', name: 'Nosegrind', points: 280, category: 'grind', duration: 0.4, popImpulse: 0, flipRollTurns: 0, shuvYawTurns: 0, popPitchSign: 1, difficultyWeight: 2.0 },
  boardslide: { id: 'boardslide', name: 'Boardslide', points: 260, category: 'grind', duration: 0.4, popImpulse: 0, flipRollTurns: 0, shuvYawTurns: 0, popPitchSign: 1, difficultyWeight: 1.8 },
  lipslide: { id: 'lipslide', name: 'Lipslide', points: 310, category: 'grind', duration: 0.4, popImpulse: 0, flipRollTurns: 0, shuvYawTurns: 0, popPitchSign: 1, difficultyWeight: 2.2 },
};

export interface SkaterAnimState {
  groundState: 'grounded' | 'airborne' | 'grinding' | 'crashed' | 'getting_up';
  speed: number;
  steerLean: number; // -1 to 1
  pushPhase: number;
  pushIntensity: number; // 0 to 1 (pumping propulsion on deck)
  braking: number; // 0 to 1 (powerslide brake on deck)
  powerslideAngle: number; // board sideways slide angle
  crouchAmount: number; // 0 to 1
  pumpG: number; // 0 to 1 transition compression
  activeTrick: TrickId | null;
  trickProgress: number; // 0 to 1
  activeGrab: TrickId | null;
  activeGrind: TrickId | null;
  grindBalance: number; // -1 to 1
  landingOutcome: LandingOutcome;
  landingTimer: number; // 0..0.42s recovery
  crashTimer: number;
  crashNonce: number;
  crashVelX: number;
  crashVelZ: number;
  getUpProgress: number; // 0..1
  boardFlipRoll: number; // radians
  boardShuvYaw: number; // radians
  boardPopPitch: number; // radians
  boardHardflipTilt: number; // radians
  wheelSpinAngle: number;
}

export interface SkateInputFrame {
  moveX: number; // -1 left .. +1 right
  moveY: number; // -1 brake .. +1 push
  sprint: boolean;
  brake: boolean;
  crouching: boolean;
  ollieJustPressed: boolean;
  nollieJustPressed: boolean;
  trickJustPressed: TrickId | null;
  grabHeld: TrickId | null;
  airSpinDir: -1 | 0 | 1;
}

export class SkateSimulation {
  public pos = new THREE.Vector3(0.5, 0, 7.2);
  public vel = new THREE.Vector3(0, 0, 0);
  public heading = Math.PI; // Facing -Z into the skatepark!
  public bodySpinOffset = 0; // Spin rotation accumulated during jump
  public groundNormal = new THREE.Vector3(0, 1, 0);
  public boardQuat = new THREE.Quaternion();

  public mode: GameplayMode = 'free_skate';
  public eventTitle = 'FREE SKATE';
  public paused = false;

  public groundState: SkaterAnimState['groundState'] = 'grounded';
  public speed = 0;
  public steerLean = 0;
  public pushPhase = 0;
  public pushIntensity = 0;
  public braking = 0;
  public powerslideAngle = 0;
  public crouchAmount = 0;
  public pumpG = 0;

  // Cinematic Slow-Mo & Gray Trick Tint
  public trickFxBlend = 0;
  public currentTimeScale = 1.0;

  // Trick & Combo State
  public activeTrick: TrickDefinition | null = null;
  public trickElapsed = 0;
  public activeGrab: TrickId | null = null;
  public grabHoldTime = 0;
  public activeGrind: TrickId | null = null;
  public grindSnap: GrindSnapResult | null = null;
  public grindBalance = 0;
  public grindDriftDir = 1;
  public grindCooldown = 0;
  public grindTickAccum = 0;

  public comboTricks: ComboEntry[] = [];
  public comboBasePoints = 0;
  public comboMultiplier = 1;
  public comboGraceTimer = 0; // brief manual/chain window on flat
  private bufferedTrickId: TrickId | null = null;
  private bufferedTrickTimer = 0;

  public landingOutcome: LandingOutcome = null;
  public landingMessage: string | null = null;
  public landingToastTimer = 0;
  public landingAnimTimer = 0;
  public crashTimer = 0;
  public crashNonce = 0;
  public crashVelX = 0;
  public crashVelZ = 0;
  public getUpTimer = 0;

  public airStartY = 0;
  public airPeakY = 0;
  public airSpinAccum = 0;
  public boardFlipRoll = 0;
  public boardShuvYaw = 0;
  public boardPopPitch = 0;
  public boardHardflipTilt = 0;
  public wheelSpinAngle = 0;

  // Score & Competition metrics
  public score = 0;
  public ruleMode: GameplayRuleMode = 'standard';
  public bestComboScore = 0;
  public bestComboLabel = '—';
  public highlightedTricks: string[] = [];
  public timeRemaining = 45;
  public runFinished = false;
  public competitionScores: CompetitionScores | null = null;
  private competitionRivals: Omit<LeaderboardEntry, 'isPlayer'>[] = [];
  private sessionRunCount = 0;
  private activeSessionOptions: Partial<GameplaySessionConfig> = {};
  private teammateNames: string[] = [];
  private teammateBonusScore = 0;
  private rivalTeamScore = 0;

  private uniqueTricksLanded = new Set<string>();
  private categoriesLanded = new Set<TrickCategory>();
  private perfectCount = 0;
  private sketchyCount = 0;
  private bailCount = 0;
  private maxAirHeight = 0;
  private difficultySum = 0;
  private landedTrickCount = 0;
  private speedSampleSum = 0;
  private speedSampleCount = 0;
  private surfaceSample: SurfaceSample = {
    height: 0,
    normal: new THREE.Vector3(0, 1, 0),
    isTransition: false,
    blockedByWall: false,
    wallNormalX: 0,
    wallNormalZ: 0,
  };

  private _up = new THREE.Vector3(0, 1, 0);
  private _forward = new THREE.Vector3();
  private _right = new THREE.Vector3();
  private _rotMat = new THREE.Matrix4();
  private _targetQuat = new THREE.Quaternion();

  public resetSession(
    mode: GameplayMode,
    title: string,
    options?: Partial<GameplaySessionConfig>,
    activeRoster?: SkaterProfile[],
  ) {
    this.mode = mode;
    this.eventTitle = title;
    this.activeSessionOptions = options ?? {};
    this.ruleMode = options?.ruleMode ?? 'standard';
    this.paused = false;
    this.score = 0;
    this.bestComboScore = 0;
    this.bestComboLabel = '—';
    this.highlightedTricks = [];
    this.timeRemaining =
      mode === 'competition' ? (options?.durationSeconds ?? (this.ruleMode === 'best_trick' || this.ruleMode === 'big_air' ? 35 : 45)) : 0;
    this.runFinished = false;
    this.competitionScores = null;
    this.sessionRunCount += 1;

    const rosterPool = activeRoster && activeRoster.length > 0 ? activeRoster : SKATER_ROSTER;
    this.teammateNames = [];
    this.teammateBonusScore = 0;
    this.rivalTeamScore = 0;

    if (mode === 'competition') {
      if (this.ruleMode === 'duel_1v1' && options?.rivalSkaterIds?.length) {
        const rival = rosterPool.find((s) => s.id === options.rivalSkaterIds![0]);
        if (rival) {
          const simRun = simulateNpcCompetitionRun(rival, 1.0, this.sessionRunCount);
          if (options.targetScore) {
            simRun.score = options.targetScore;
          }
          this.competitionRivals = [simRun];
        } else {
          this.competitionRivals = generateDynamicCompetitionField(title, this.sessionRunCount);
        }
      } else if (this.ruleMode === 'best_trick') {
        const base = generateDynamicCompetitionField(title, this.sessionRunCount);
        this.competitionRivals = base.map((r, i) => ({
          ...r,
          score: Math.round((1400 + ((r.overallRating - 65) * 48) + ((i * 190) % 720)) / 10) * 10,
          highlightNote: 'Best Combo',
        }));
      } else if (this.ruleMode === 'big_air') {
        const base = generateDynamicCompetitionField(title, this.sessionRunCount);
        this.competitionRivals = base.map((r, i) => ({
          ...r,
          score: Math.round((3200 + (r.overallRating - 68) * 95 + ((i * 230) % 680)) / 10) * 10,
          highlightNote: 'Air & Grabs',
        }));
      } else if (this.ruleMode === 'team_challenge') {
        const mates = (options?.teammateSkaterIds ?? [])
          .map((id) => rosterPool.find((s) => s.id === id))
          .filter((s): s is SkaterProfile => Boolean(s));
        const pickedMates = mates.length > 0 ? mates : rosterPool.slice(0, 2);
        this.teammateNames = pickedMates.map((m) => `${m.firstName} ${m.lastName}`);
        const mateRuns = pickedMates.map((m) => simulateNpcCompetitionRun(m, 0.96, this.sessionRunCount));
        this.teammateBonusScore = mateRuns.reduce((acc, r) => acc + r.score, 0);

        const rivals = rosterPool
          .filter((s) => !pickedMates.some((m) => m.id === s.id))
          .slice(0, 6)
          .map((s) => simulateNpcCompetitionRun(s, 1.02, this.sessionRunCount));
        this.rivalTeamScore = rivals.slice(0, 3).reduce((acc, r) => acc + r.score, 0);
        this.competitionRivals = rivals;
      } else {
        this.competitionRivals = generateDynamicCompetitionField(title, this.sessionRunCount);
      }
    } else {
      this.competitionRivals = [];
    }

    this.uniqueTricksLanded.clear();
    this.categoriesLanded.clear();
    this.perfectCount = 0;
    this.sketchyCount = 0;
    this.bailCount = 0;
    this.maxAirHeight = 0;
    this.difficultySum = 0;
    this.landedTrickCount = 0;
    this.speedSampleSum = 0;
    this.speedSampleCount = 0;

    this.resetSkaterPosition();
  }

  public resetSkaterPosition() {
    this.pos.set(0.4, 0, 7.6);
    this.vel.set(0, 0, 0);
    this.heading = Math.PI; // Looking toward funbox, rails, bowl, and grandstands!
    this.bodySpinOffset = 0;
    this.groundNormal.set(0, 1, 0);
    this.groundState = 'grounded';
    this.speed = 0;
    this.steerLean = 0;
    this.pushIntensity = 0;
    this.braking = 0;
    this.powerslideAngle = 0;
    this.crouchAmount = 0;
    this.pumpG = 0;
    this.trickFxBlend = 0;
    this.currentTimeScale = 1.0;
    this.activeTrick = null;
    this.activeGrab = null;
    this.activeGrind = null;
    this.grindSnap = null;
    this.grindBalance = 0;
    this.comboTricks = [];
    this.comboBasePoints = 0;
    this.comboMultiplier = 1;
    this.comboGraceTimer = 0;
    this.landingOutcome = null;
    this.landingMessage = null;
    this.landingToastTimer = 0;
    this.landingAnimTimer = 0;
    this.crashTimer = 0;
    this.crashVelX = 0;
    this.crashVelZ = 0;
    this.getUpTimer = 0;
    this.boardFlipRoll = 0;
    this.boardShuvYaw = 0;
    this.boardPopPitch = 0;
    this.boardHardflipTilt = 0;
    this.airSpinAccum = 0;
    this.bufferedTrickId = null;
    this.bufferedTrickTimer = 0;
    this.updateBoardQuaternion(1);
  }

  private addTrickToCombo(id: TrickId, customPoints?: number) {
    const def = TRICK_CATALOG[id];
    const alreadyInCombo = this.comboTricks.some((t) => t.id === id);
    const basePts = customPoints ?? def.points;
    const adjustedPts = alreadyInCombo ? Math.round(basePts * 0.6) : basePts;

    this.comboTricks.push({
      id,
      name: def.name,
      points: adjustedPts,
      category: def.category,
    });
    this.comboBasePoints += adjustedPts;
    this.comboMultiplier = Math.min(12, this.comboTricks.length);
    this.comboGraceTimer = 1.25;
  }

  private startAirTrick(id: TrickId) {
    const def = TRICK_CATALOG[id];
    const wasGroundedOrGrinding = this.groundState === 'grounded' || this.groundState === 'grinding';

    if (wasGroundedOrGrinding) {
      // Launch upward! Preserve horizontal velocity + crouch charge bonus + ramp slope kick
      const crouchBonus = 1 + this.crouchAmount * 0.22;
      const basePop = def.popImpulse > 0 ? def.popImpulse : 6.4;
      const popBoost = basePop * crouchBonus;
      const slopeUp = Math.max(0, this.vel.y);
      this.vel.y = Math.max(popBoost, slopeUp * 0.88 + popBoost * 0.74);
      if (this.groundState === 'grinding') {
        this.grindCooldown = 0.28;
        this.activeGrind = null;
        this.grindSnap = null;
        this.bodySpinOffset = 0;
      }
      this.groundState = 'airborne';
      this.airStartY = this.pos.y;
      this.airPeakY = this.pos.y;
      this.airSpinAccum = 0;
      this.crouchAmount = 0;
      this.bufferedTrickId = null;
      this.bufferedTrickTimer = 0;
      soundEngine.playPop();
    } else if (def.flipRollTurns !== 0 || def.shuvYawTurns !== 0) {
      // Mid-air second flip/shove-it combo if high enough, else buffer if nearing touchdown
      const heightAboveGround = this.pos.y - this.surfaceSample.height;
      if (this.vel.y > -3.5 && heightAboveGround > 0.45) {
        soundEngine.playFlip();
      } else {
        if (this.vel.y < 0 && heightAboveGround <= 0.75) {
          this.bufferedTrickId = id;
          this.bufferedTrickTimer = 0.14;
        }
        return;
      }
    } else {
      return;
    }

    if (def.flipRollTurns !== 0 || def.shuvYawTurns !== 0) {
      soundEngine.playFlip();
    }

    this.activeTrick = def;
    this.trickElapsed = 0;
    this.addTrickToCombo(id);

    // Trigger immediate 180/360 spin velocity if fs/bs trick button was pressed
    if (id === 'fs_180' || id === 'fs_360') this.airSpinAccum += 0.01;
    if (id === 'bs_180' || id === 'bs_360') this.airSpinAccum -= 0.01;
  }

  private bankCombo(outcome: 'perfect' | 'sketchy') {
    if (this.comboTricks.length === 0) return;

    const qualityMult = outcome === 'perfect' ? 1.25 : 0.85;
    const nightFlowBonus = this.ruleMode === 'night_session' ? 1.18 : 1.0;
    const airEventBonus =
      this.ruleMode === 'big_air' && this.comboTricks.some((t) => t.category === 'grab') ? 1.35 : 1.0;
    const uniqueInCombo = new Set(this.comboTricks.map((t) => t.id)).size;
    const varietyBonus = uniqueInCombo > 1 ? uniqueInCombo * 40 : 0;
    const totalAwarded = Math.round(
      (this.comboBasePoints + varietyBonus) *
        this.comboMultiplier *
        qualityMult *
        nightFlowBonus *
        airEventBonus,
    );

    const comboString = this.comboTricks.map((t) => t.name).join(' + ');
    if (totalAwarded > this.bestComboScore) {
      this.bestComboScore = totalAwarded;
      this.bestComboLabel = comboString;
    }
    if (!this.highlightedTricks.includes(comboString)) {
      this.highlightedTricks = [comboString, ...this.highlightedTricks].slice(0, 6);
    }

    if (this.ruleMode === 'best_trick') {
      this.score = Math.max(this.score, totalAwarded);
    } else {
      this.score += totalAwarded;
    }

    for (const entry of this.comboTricks) {
      this.uniqueTricksLanded.add(entry.id);
      this.categoriesLanded.add(entry.category);
      this.difficultySum += TRICK_CATALOG[entry.id].difficultyWeight;
      this.landedTrickCount += 1;
    }

    if (outcome === 'perfect') this.perfectCount += 1;
    else this.sketchyCount += 1;

    this.landingOutcome = outcome;
    this.landingMessage =
      outcome === 'perfect'
        ? `PERFECT LANDING +${totalAwarded.toLocaleString()}`
        : `SKETCHY +${totalAwarded.toLocaleString()}`;
    this.landingToastTimer = 1.65;
    this.landingAnimTimer = 0.38;

    this.comboTricks = [];
    this.comboBasePoints = 0;
    this.comboMultiplier = 1;
    this.comboGraceTimer = 0;

    soundEngine.playComboBank();
  }

  private triggerBail(reason = 'BAIL · COMBO LOST') {
    this.crashVelX = this.vel.x * 0.92;
    this.crashVelZ = this.vel.z * 0.92;
    this.crashNonce += 1;

    this.groundState = 'crashed';
    this.crashTimer = 1.45;
    this.getUpTimer = 0.65;
    this.speed *= 0.25;
    this.vel.multiplyScalar(0.25);
    this.vel.y = 0;

    this.activeTrick = null;
    this.activeGrab = null;
    this.activeGrind = null;
    this.grindSnap = null;
    this.boardFlipRoll = 0;
    this.boardShuvYaw = 0;
    this.boardPopPitch = 0;
    this.powerslideAngle = 0;
    this.bodySpinOffset = 0;
    this.trickFxBlend = 0;
    this.currentTimeScale = 1.0;

    this.bailCount += 1;
    this.comboTricks = [];
    this.comboBasePoints = 0;
    this.comboMultiplier = 1;
    this.comboGraceTimer = 0;

    this.landingOutcome = 'bail';
    this.landingMessage = reason;
    this.landingToastTimer = 1.85;

    soundEngine.playLand('bail');
  }

  public finalizeTrainingOrShoot() {
    if (this.runFinished) return;
    if (this.comboTricks.length > 0 && this.groundState !== 'crashed') {
      this.bankCombo('sketchy');
    }
    this.finalizeCompetition();
  }

  private finalizeCompetition() {
    if (this.runFinished) return;
    if (this.comboTricks.length > 0 && this.groundState !== 'crashed') {
      this.bankCombo('sketchy');
    }
    if (this.ruleMode === 'big_air') {
      this.score += Math.round(this.maxAirHeight * 950);
    }
    this.runFinished = true;
    soundEngine.silenceGameplayLoops();
    soundEngine.playBuzzer();

    const avgDiff = this.landedTrickCount > 0 ? this.difficultySum / this.landedTrickCount : 0;
    const difficulty = THREE.MathUtils.clamp(avgDiff * 3.8 + Math.min(2.5, this.landedTrickCount * 0.25), 1.5, 9.9);

    const totalLandings = this.perfectCount + this.sketchyCount + this.bailCount;
    const execRatio =
      totalLandings > 0 ? (this.perfectCount * 1.0 + this.sketchyCount * 0.55) / totalLandings : 0.4;
    const execution = THREE.MathUtils.clamp(execRatio * 9.6 + (this.bailCount === 0 && totalLandings > 0 ? 0.4 : 0), 1.2, 9.9);

    const variety = THREE.MathUtils.clamp(
      this.uniqueTricksLanded.size * 0.95 + this.categoriesLanded.size * 1.35,
      1.0,
      9.9,
    );

    const amplitude = THREE.MathUtils.clamp(this.maxAirHeight * 3.2 + 2.2, 1.5, 9.9);

    const avgSpeed = this.speedSampleCount > 0 ? this.speedSampleSum / this.speedSampleCount : 0;
    const flow = THREE.MathUtils.clamp(avgSpeed * 0.75 - this.bailCount * 0.8 + 2.5, 1.5, 9.9);

    const overall = Number(((difficulty + execution + variety + amplitude + flow) * 2).toFixed(1));

    this.competitionScores = {
      difficulty: Number(difficulty.toFixed(1)),
      execution: Number(execution.toFixed(1)),
      variety: Number(variety.toFixed(1)),
      amplitude: Number(amplitude.toFixed(1)),
      flow: Number(flow.toFixed(1)),
      overall,
    };
  }

  public step(rawDt: number, input: SkateInputFrame) {
    if (this.paused || this.runFinished) {
      this.trickFxBlend = THREE.MathUtils.damp(this.trickFxBlend, 0, 12, rawDt);
      this.currentTimeScale = 1.0;
      soundEngine.silenceGameplayLoops();
      return;
    }

    // Cinematic Trick Slow-Motion + Gray Desaturation FX during any active trick/grab/grind!
    const doingTrickNow =
      (this.groundState === 'airborne' &&
        (this.activeTrick !== null ||
          this.activeGrab !== null ||
          Math.abs(this.airSpinAccum) > 0.25)) ||
      this.groundState === 'grinding';

    const targetFx = doingTrickNow ? 1 : 0;
    this.trickFxBlend = THREE.MathUtils.damp(this.trickFxBlend, targetFx, doingTrickNow ? 14 : 11, rawDt);
    this.currentTimeScale = THREE.MathUtils.lerp(1.0, 0.44, this.trickFxBlend);

    const dt = rawDt * this.currentTimeScale;

    if (this.landingToastTimer > 0) {
      this.landingToastTimer = Math.max(0, this.landingToastTimer - rawDt);
      if (this.landingToastTimer === 0) {
        this.landingOutcome = null;
        this.landingMessage = null;
      }
    }
    if (this.landingAnimTimer > 0) {
      this.landingAnimTimer = Math.max(0, this.landingAnimTimer - rawDt);
    }
    if (this.grindCooldown > 0) {
      this.grindCooldown = Math.max(0, this.grindCooldown - dt);
    }

    // Competition 45s countdown runs in real-time so slow-mo never stretches clock artificially
    if (this.mode === 'competition') {
      this.timeRemaining = Math.max(0, this.timeRemaining - rawDt);
      if (this.timeRemaining === 0 && this.groundState !== 'airborne') {
        this.finalizeCompetition();
        return;
      }
    }

    // Crash / Ragdoll Recovery States (real-time)
    if (this.groundState === 'crashed') {
      this.crashTimer -= rawDt;
      this.pos.x += this.vel.x * rawDt;
      this.pos.z += this.vel.z * rawDt;
      this.vel.multiplyScalar(Math.exp(-4.5 * rawDt));
      sampleSkateparkSurface(this.pos.x, this.pos.y + 0.2, this.pos.z, this.surfaceSample);
      this.pos.y = this.surfaceSample.height;
      clampInsideParkBounds(this.pos, this.vel);
      soundEngine.updateSkateMotion(0, false, false);
      soundEngine.updateLocationAmbience(
        { x: this.pos.x, y: this.pos.y, z: this.pos.z, isTransition: this.surfaceSample.isTransition, speed: 0 },
        rawDt,
      );

      if (this.crashTimer <= 0) {
        this.groundState = 'getting_up';
      }
      return;
    }

    if (this.groundState === 'getting_up') {
      this.getUpTimer -= rawDt;
      this.boardFlipRoll = THREE.MathUtils.damp(this.boardFlipRoll, 0, 10, rawDt);
      this.boardShuvYaw = THREE.MathUtils.damp(this.boardShuvYaw, 0, 10, rawDt);
      this.boardPopPitch = THREE.MathUtils.damp(this.boardPopPitch, 0, 10, rawDt);
      soundEngine.updateSkateMotion(0, false, false);
      if (this.getUpTimer <= 0) {
        this.groundState = 'grounded';
        this.boardFlipRoll = 0;
        this.boardShuvYaw = 0;
        this.boardPopPitch = 0;
      }
      return;
    }

    // Combo grace window between consecutive tricks on ground
    if (this.groundState === 'grounded' && this.comboTricks.length > 0) {
      this.comboGraceTimer -= rawDt;
      if (this.comboGraceTimer <= 0) {
        this.bankCombo('perfect');
      }
    }

    // Run simulation in 2 sub-steps for rock-solid transition carving & rail detection
    const subSteps = 2;
    const subDt = dt / subSteps;
    for (let s = 0; s < subSteps; s++) {
      this.stepPhysicsSubstep(
        subDt,
        s === 0
          ? input
          : {
              ...input,
              ollieJustPressed: false,
              nollieJustPressed: false,
              trickJustPressed: null,
            },
      );
      const afterStepState = this.groundState as SkaterAnimState['groundState'];
      if (afterStepState === 'crashed') break;
    }

    soundEngine.updateLocationAmbience(
      {
        x: this.pos.x,
        y: this.pos.y,
        z: this.pos.z,
        isTransition: this.surfaceSample.isTransition,
        speed: this.speed,
      },
      rawDt,
    );
  }

  private stepPhysicsSubstep(dt: number, input: SkateInputFrame) {

    // Sample current park surface
    sampleSkateparkSurface(this.pos.x, this.pos.y, this.pos.z, this.surfaceSample);

    // Decrement trick input buffer
    if (this.bufferedTrickTimer > 0) {
      this.bufferedTrickTimer = Math.max(0, this.bufferedTrickTimer - dt);
      if (this.bufferedTrickTimer === 0) {
        this.bufferedTrickId = null;
      }
    }

    // Handle Trick / Ollie / Nollie / Grab Inputs
    if (this.groundState === 'grounded' || this.groundState === 'grinding') {
      this.crouchAmount = THREE.MathUtils.damp(
        this.crouchAmount,
        input.crouching ? 1 : 0,
        14,
        dt,
      );

      if (input.trickJustPressed) {
        this.startAirTrick(input.trickJustPressed);
      } else if (input.nollieJustPressed) {
        this.startAirTrick('nollie');
      } else if (input.ollieJustPressed) {
        this.startAirTrick(input.moveY > 0.65 && input.sprint ? 'nollie' : 'ollie');
      } else if (this.groundState === 'grounded' && this.bufferedTrickId && this.landingAnimTimer < 0.34) {
        const queued = this.bufferedTrickId;
        this.bufferedTrickId = null;
        this.bufferedTrickTimer = 0;
        this.startAirTrick(queued);
      }
    } else if (this.groundState === 'airborne') {
      this.crouchAmount = THREE.MathUtils.damp(this.crouchAmount, 0, 10, dt);

      if (input.trickJustPressed) {
        this.startAirTrick(input.trickJustPressed);
      } else if (input.ollieJustPressed && this.vel.y < 0 && this.pos.y - this.surfaceSample.height <= 0.65) {
        this.bufferedTrickId = input.moveY > 0.65 && input.sprint ? 'nollie' : 'ollie';
        this.bufferedTrickTimer = 0.14;
      } else if (input.nollieJustPressed && this.vel.y < 0 && this.pos.y - this.surfaceSample.height <= 0.65) {
        this.bufferedTrickId = 'nollie';
        this.bufferedTrickTimer = 0.14;
      }

      // Grab holding in mid-air!
      if (input.grabHeld) {
        if (this.activeGrab !== input.grabHeld) {
          this.activeGrab = input.grabHeld;
          this.grabHoldTime = 0;
          this.addTrickToCombo(input.grabHeld);
        }
        this.grabHoldTime += dt;
        if (this.grabHoldTime > 0.28) {
          // Steady grab hold points bonus
          this.comboBasePoints += Math.round(90 * dt);
        }
      } else {
        this.activeGrab = null;
      }

      // Mid-air 180 / 360 body + board spin
      const spinRate = 6.2; // rad/s
      if (input.airSpinDir !== 0) {
        const deltaSpin = input.airSpinDir * spinRate * dt;
        this.bodySpinOffset += deltaSpin;
        this.airSpinAccum += deltaSpin;
      } else if (this.activeTrick && (this.activeTrick.id === 'fs_180' || this.activeTrick.id === 'bs_180' || this.activeTrick.id === 'fs_360' || this.activeTrick.id === 'bs_360')) {
        const sign = this.activeTrick.id.startsWith('fs') ? 1 : -1;
        const is360 = this.activeTrick.id.endsWith('360');
        const targetTurns = is360 ? Math.PI * 2 : Math.PI;
        const remaining = targetTurns - Math.abs(this.airSpinAccum);
        if (remaining > 0.02) {
          const autoRate = is360 ? 9.2 : 7.4;
          const stepSpin = sign * Math.min(remaining, autoRate * dt);
          this.bodySpinOffset += stepSpin;
          this.airSpinAccum += stepSpin;
        }
      }
    }

    // Advance active flip / pop / shove-it animation curve
    if (this.activeTrick) {
      this.trickElapsed += dt;
      const t = THREE.MathUtils.clamp(this.trickElapsed / this.activeTrick.duration, 0, 1);

      // Smooth eased progress
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      this.boardFlipRoll = this.activeTrick.flipRollTurns * Math.PI * 2 * ease;
      this.boardShuvYaw = this.activeTrick.shuvYawTurns * Math.PI * 2 * ease;
      this.boardPopPitch = this.activeTrick.popPitchSign * Math.sin(t * Math.PI) * 0.48;
      this.boardHardflipTilt = this.activeTrick.hardflipTilt ? Math.sin(t * Math.PI) * 0.72 : 0;

      if (t >= 1 && this.groundState !== 'airborne') {
        this.activeTrick = null;
      }
    } else if (this.groundState === 'grounded') {
      this.boardFlipRoll = THREE.MathUtils.damp(this.boardFlipRoll, 0, 16, dt);
      this.boardShuvYaw = THREE.MathUtils.damp(this.boardShuvYaw, 0, 16, dt);
      this.boardPopPitch = THREE.MathUtils.damp(this.boardPopPitch, 0, 16, dt);
      this.boardHardflipTilt = THREE.MathUtils.damp(this.boardHardflipTilt, 0, 16, dt);
    }

    // --- Physics Integration by Ground State ---
    if (this.groundState === 'grounded') {
      this.stepGroundedPhysics(dt, input);
    } else if (this.groundState === 'airborne') {
      this.stepAirbornePhysics(dt);
    } else if (this.groundState === 'grinding') {
      this.stepGrindingPhysics(dt, input);
    }

    // Track speed sample for Flow score & wheel spin
    this.speedSampleSum += this.speed;
    this.speedSampleCount += 1;
    this.wheelSpinAngle += (this.speed / 0.028) * dt * 0.35;

    // Update rolling / grinding audio
    soundEngine.updateSkateMotion(
      this.speed,
      this.groundState === 'grounded',
      this.groundState === 'grinding',
    );
  }

  private stepGroundedPhysics(dt: number, input: SkateInputFrame) {
    // 1. Speed-responsive Carving & Powerslide Braking (both feet stay on deck!)
    const steerInput = -input.moveX;
    const speedFactor = THREE.MathUtils.clamp(0.45 + this.speed / 8, 0.45, 1.35);
    const turnSpeed = 2.7 / speedFactor;
    this.heading += steerInput * turnSpeed * dt;
    this.steerLean = THREE.MathUtils.damp(this.steerLean, input.moveX * Math.min(1, this.speed / 4.2), 10, dt);

    this._forward.set(Math.sin(this.heading), 0, Math.cos(this.heading));
    const dotN = this._forward.dot(this.surfaceSample.normal);
    this._forward.addScaledVector(this.surfaceSample.normal, -dotN).normalize();

    // 2. Slope Gravity + Transition Pumping Compression
    const gravityAccel = -19.2;
    const slopeGravity = gravityAccel * this._forward.y;
    const targetPumpG = this.surfaceSample.isTransition ? Math.min(1, this.speed / 10) : 0;
    this.pumpG = THREE.MathUtils.damp(this.pumpG, targetPumpG, 10, dt);

    // 3. Pumping Acceleration / Powerslide Brake / Rolling Friction
    const maxSpeed = input.sprint ? 15.6 : 12.0;
    let pushAccel = 0;

    if (input.brake || input.moveY < -0.2) {
      this.braking = THREE.MathUtils.damp(this.braking, 1, 14, dt);
      const slideSign = input.moveX !== 0 ? Math.sign(input.moveX) : 1;
      this.powerslideAngle = THREE.MathUtils.damp(this.powerslideAngle, slideSign * 0.56 * Math.min(1, this.speed / 3), 12, dt);
      pushAccel = -14.2;
      this.pushIntensity = THREE.MathUtils.damp(this.pushIntensity, 0, 10, dt);
    } else {
      this.braking = THREE.MathUtils.damp(this.braking, 0, 10, dt);
      this.powerslideAngle = THREE.MathUtils.damp(this.powerslideAngle, 0, 12, dt);
      if (input.moveY > 0.15) {
        const targetPush = input.sprint ? 1.0 : 0.78;
        this.pushIntensity = THREE.MathUtils.damp(this.pushIntensity, targetPush, 8, dt);
        const prevSin = Math.sin(this.pushPhase);
        this.pushPhase += dt * (input.sprint ? 8.8 : 7.0);
        if (prevSin <= 0 && Math.sin(this.pushPhase) > 0 && this.speed < maxSpeed - 1) {
          soundEngine.playPush();
        }
        const headroom = THREE.MathUtils.clamp((maxSpeed - this.speed) / maxSpeed, 0.1, 1);
        const pumpBoost = this.surfaceSample.isTransition ? 1.25 : 1.0;
        pushAccel = (input.sprint ? 12.8 : 9.2) * input.moveY * headroom * pumpBoost;
      } else {
        this.pushIntensity = THREE.MathUtils.damp(this.pushIntensity, 0, 8, dt);
      }
    }

    const friction = (0.62 + Math.abs(this.steerLean) * 0.42) * (this.speed > 0.25 ? 1 : 3.6);
    this.speed += (pushAccel + slopeGravity) * dt;
    this.speed = Math.max(0, this.speed - friction * dt);
    if (this.speed > 18.6) this.speed = THREE.MathUtils.damp(this.speed, 18.6, 4, dt);

    // 4. Advance Position & Handle Transitions / Ramp Launches / Smooth Wall-Sliding
    this.vel.copy(this._forward).multiplyScalar(this.speed);
    const prevY = this.pos.y;
    const prevVelY = this.vel.y;
    const prevWasTransition = this.surfaceSample.isTransition;

    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    clampInsideParkBounds(this.pos, this.vel);

    sampleSkateparkSurface(this.pos.x, this.pos.y + 0.16, this.pos.z, this.surfaceSample);

    if (this.surfaceSample.blockedByWall) {
      const nx = this.surfaceSample.wallNormalX;
      const nz = this.surfaceSample.wallNormalZ;
      this.pos.x += nx * 0.09;
      this.pos.z += nz * 0.09;
      const vDot = this.vel.x * nx + this.vel.z * nz;
      if (vDot < 0) {
        this.vel.x -= vDot * nx * 1.15;
        this.vel.z -= vDot * nz * 1.15;
        const remainHoriz = Math.hypot(this.vel.x, this.vel.z);
        // Smoothly steer heading along wall tangent so skater glides past obstacles cleanly
        if (remainHoriz > 0.4) {
          this.heading = Math.atan2(this.vel.x, this.vel.z);
        }
        this.speed = remainHoriz * 0.88;
      }
      sampleSkateparkSurface(this.pos.x, this.pos.y + 0.16, this.pos.z, this.surfaceSample);
    }

    const heightDiff = this.surfaceSample.height - prevY;

    if (
      (prevWasTransition && !this.surfaceSample.isTransition && prevVelY > 1.35) ||
      (heightDiff < -0.14 && this.speed > 2.2) ||
      heightDiff < -0.26
    ) {
      this.groundState = 'airborne';
      this.airStartY = prevY;
      this.airPeakY = prevY;
      this.airSpinAccum = 0;
      if (prevVelY > 1.35 && prevWasTransition) {
        this.vel.y = Math.max(prevVelY * 1.16, 2.8);
      } else {
        this.vel.y = Math.max(prevVelY, 0);
      }
    } else {
      this.pos.y = this.surfaceSample.height;
      this.groundNormal.lerp(this.surfaceSample.normal, Math.min(1, dt * 18)).normalize();
    }

    this.updateBoardQuaternion(dt);
  }

  private stepAirbornePhysics(dt: number) {
    // Gravity & mild air drag
    this.vel.y -= 18.5 * dt;
    this.vel.x *= Math.exp(-0.08 * dt);
    this.vel.z *= Math.exp(-0.08 * dt);
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.pos.z += this.vel.z * dt;
    clampInsideParkBounds(this.pos, this.vel);
    this.speed = Math.hypot(this.vel.x, this.vel.z);

    if (this.pos.y > this.airPeakY) {
      this.airPeakY = this.pos.y;
    }

    // Check Grind / Slide Snap while descending or near rail height!
    if (this.grindCooldown <= 0 && this.vel.y <= 2.4 && this.speed > 1.6) {
      const snap = findNearestGrindSegment(this.pos, this.vel);
      if (snap) {
        this.enterGrind(snap);
        return;
      }
    }

    // Check Ground Impact & Airborne Wall Deflection
    sampleSkateparkSurface(this.pos.x, this.pos.y, this.pos.z, this.surfaceSample);
    if (this.surfaceSample.blockedByWall) {
      const nx = this.surfaceSample.wallNormalX;
      const nz = this.surfaceSample.wallNormalZ;
      this.pos.x += nx * 0.1;
      this.pos.z += nz * 0.1;
      const vDot = this.vel.x * nx + this.vel.z * nz;
      if (vDot < 0) {
        this.vel.x -= vDot * nx * 1.18;
        this.vel.z -= vDot * nz * 1.18;
        this.speed = Math.hypot(this.vel.x, this.vel.z);
        if (this.speed > 0.4) {
          this.heading = Math.atan2(this.vel.x, this.vel.z);
        }
      }
      sampleSkateparkSurface(this.pos.x, this.pos.y, this.pos.z, this.surfaceSample);
    }

    if (this.pos.y <= this.surfaceSample.height) {
      this.pos.y = this.surfaceSample.height;
      this.resolveLanding();
    }

    this.updateBoardQuaternion(dt);
  }

  private enterGrind(snap: GrindSnapResult) {
    this.groundState = 'grinding';
    this.grindSnap = snap;
    this.pos.copy(snap.point);
    this.speed = Math.max(4.8, Math.hypot(this.vel.x, this.vel.z));
    this.vel.copy(snap.tangent).multiplyScalar(this.speed);
    this.grindBalance = (Math.random() - 0.5) * 0.24;
    this.grindDriftDir = Math.random() > 0.5 ? 1 : -1;
    this.grindTickAccum = 0;

    // Choose specific Grind or Slide based on board angle vs rail tangent & trick state!
    const boardFwdX = Math.sin(this.heading + this.bodySpinOffset);
    const boardFwdZ = Math.cos(this.heading + this.bodySpinOffset);
    const cosAngle = Math.abs(boardFwdX * snap.tangent.x + boardFwdZ * snap.tangent.z);

    let grindId: TrickId = 'grind_50_50';
    if (cosAngle < 0.65) {
      // Perpendicular boardslide or lipslide!
      grindId = Math.abs(this.bodySpinOffset) > 0.4 ? 'lipslide' : 'boardslide';
    } else if (this.boardPopPitch > 0.14) {
      grindId = 'grind_5_0';
    } else if (this.boardPopPitch < -0.14) {
      grindId = 'nosegrind';
    }

    // Align heading along rail for straight grinds, or 90 deg for slides
    const railYaw = Math.atan2(snap.tangent.x, snap.tangent.z);
    if (grindId === 'boardslide' || grindId === 'lipslide') {
      this.heading = railYaw;
      this.bodySpinOffset = Math.PI / 2;
    } else {
      this.heading = railYaw;
      this.bodySpinOffset = 0;
    }

    this.activeTrick = null;
    this.activeGrab = null;
    this.boardFlipRoll = 0;
    this.boardShuvYaw = 0;
    this.boardHardflipTilt = 0;
    this.boardPopPitch = grindId === 'grind_5_0' ? 0.28 : grindId === 'nosegrind' ? -0.28 : 0;

    this.activeGrind = grindId;
    this.addTrickToCombo(grindId);
  }

  private stepGrindingPhysics(dt: number, input: SkateInputFrame) {
    if (!this.grindSnap) {
      this.groundState = 'airborne';
      return;
    }

    // Maintain momentum along rail + downhill rail gravity
    const slopeAssist = -10.5 * this.grindSnap.tangent.y;
    this.speed = Math.max(3.6, this.speed + slopeAssist * dt - 0.55 * dt);
    this.vel.copy(this.grindSnap.tangent).multiplyScalar(this.speed);

    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.pos.z += this.vel.z * dt;

    // Grind Balance Mechanic (player balances with A / D!)
    this.grindBalance += (this.grindDriftDir * 0.42 + input.moveX * 1.45) * dt;
    if (Math.random() < dt * 1.2) {
      this.grindDriftDir *= -1;
    }

    if (Math.abs(this.grindBalance) >= 1.0) {
      this.triggerBail('LOST BALANCE ON RAIL');
      return;
    }

    // Continuous grind points accumulation
    this.grindTickAccum += dt;
    if (this.grindTickAccum >= 0.16) {
      this.grindTickAccum -= 0.16;
      this.comboBasePoints += 25;
    }

    // Re-check if still on rail segment with curved coping / kinked rail continuity
    const nextSnap = findNearestGrindSegment(this.pos, this.vel, 0.56, 0.52, this.grindSnap.segment.id);
    if (!nextSnap) {
      // Exited end of rail cleanly into air!
      this.groundState = 'airborne';
      this.activeGrind = null;
      this.grindSnap = null;
      this.grindCooldown = 0.28;
      this.vel.y = Math.max(this.vel.y, 1.5);
      this.boardPopPitch = 0;
      if (Math.abs(this.bodySpinOffset) > 1.2) {
        this.bodySpinOffset = 0;
      }
      return;
    }

    this.grindSnap = nextSnap;
    this.pos.x = THREE.MathUtils.lerp(this.pos.x, nextSnap.point.x, Math.min(1, dt * 16));
    this.pos.z = THREE.MathUtils.lerp(this.pos.z, nextSnap.point.z, Math.min(1, dt * 16));
    this.pos.y = nextSnap.point.y;
    if (this.activeGrind !== 'boardslide' && this.activeGrind !== 'lipslide') {
      this.heading = Math.atan2(nextSnap.tangent.x, nextSnap.tangent.z);
    }
    this.groundNormal.set(0, 1, 0);
    this.updateBoardQuaternion(dt);
  }

  private resolveLanding() {
    this.groundState = 'grounded';
    this.groundNormal.copy(this.surfaceSample.normal);

    const airHeight = Math.max(0, this.airPeakY - this.airStartY);
    if (airHeight > this.maxAirHeight) {
      this.maxAirHeight = airHeight;
    }

    // Evaluate trick completion & alignment precision!
    const trickProg = this.activeTrick ? this.trickElapsed / this.activeTrick.duration : 1;
    const incompleteFlip =
      this.activeTrick &&
      (this.activeTrick.flipRollTurns !== 0 || this.activeTrick.shuvYawTurns !== 0) &&
      trickProg < 0.82;

    // Count completed 180/360 body spins in mid-air
    const absSpin = Math.abs(this.airSpinAccum);
    if (absSpin >= Math.PI * 1.78) {
      const id: TrickId = this.airSpinAccum > 0 ? 'fs_360' : 'bs_360';
      if (!this.comboTricks.some((t) => t.id === id)) {
        this.addTrickToCombo(id);
      }
    } else if (absSpin >= Math.PI * 0.78) {
      const id: TrickId = this.airSpinAccum > 0 ? 'fs_180' : 'bs_180';
      if (!this.comboTricks.some((t) => t.id === id)) {
        this.addTrickToCombo(id);
      }
    }

    // Check yaw alignment relative to nearest 180 deg (regular or switch!)
    const wrappedSpin = ((this.bodySpinOffset % Math.PI) + Math.PI) % Math.PI;
    const yawError = Math.min(wrappedSpin, Math.PI - wrappedSpin);
    const grabIncomplete = this.activeGrab !== null; // Still holding board at touchdown!

    // Preserve travel momentum direction cleanly (never reverse 180 deg backwards on 180s!)
    const horizSpeed = Math.hypot(this.vel.x, this.vel.z);
    if (horizSpeed > 0.35) {
      this.heading = Math.atan2(this.vel.x, this.vel.z);
    }
    this.bodySpinOffset = 0;

    // Hard tricks demand tighter landing precision
    const diffMult = this.activeTrick ? this.activeTrick.difficultyWeight : 1.0;
    const perfectThreshold = 0.28 / Math.sqrt(diffMult); // ~11-16 deg
    const bailThreshold = 0.72 / Math.sqrt(diffMult * 0.75); // ~32-41 deg

    this.activeTrick = null;
    this.activeGrab = null;
    this.boardFlipRoll = 0;
    this.boardShuvYaw = 0;
    this.boardPopPitch = 0;
    this.boardHardflipTilt = 0;

    // Convert downward velocity onto landing transition slope (pumping transitions!)
    if (this.surfaceSample.isTransition && this.vel.y < -1.5) {
      this.speed = Math.min(18.0, horizSpeed + Math.abs(this.vel.y) * 0.46);
    } else {
      this.speed = horizSpeed;
    }

    if (incompleteFlip || grabIncomplete || yawError > bailThreshold) {
      this.triggerBail(
        grabIncomplete
          ? 'RELEASE GRAB BEFORE LANDING!'
          : incompleteFlip
            ? 'LANDED MID-FLIP!'
            : 'BAD ANGLE · BAIL!',
      );
      return;
    }

    if (this.comboTricks.length > 0) {
      const outcome: 'perfect' | 'sketchy' = yawError <= perfectThreshold ? 'perfect' : 'sketchy';
      if (outcome === 'sketchy') {
        this.speed *= 0.78;
      } else {
        this.speed = Math.min(17.5, this.speed + 0.55);
      }
      soundEngine.playLand(outcome);
      this.bankCombo(outcome);
    } else if (airHeight > 0.35) {
      soundEngine.playLand('perfect');
      this.landingAnimTimer = 0.28;
    }

    // If competition timer hit zero mid-air, end run right upon landing!
    if (this.mode === 'competition' && this.timeRemaining <= 0) {
      this.finalizeCompetition();
    }
  }

  private updateBoardQuaternion(dt: number) {
    const yaw = this.heading + this.bodySpinOffset;
    this._forward.set(Math.sin(yaw), 0, Math.cos(yaw));
    const n = this.groundState === 'airborne' ? this._up : this.groundNormal;

    // Orthonormal basis aligned with surface normal and travel yaw
    this._right.crossVectors(n, this._forward).normalize();
    this._forward.crossVectors(this._right, n).normalize();
    this._rotMat.makeBasis(this._right, n, this._forward);
    this._targetQuat.setFromRotationMatrix(this._rotMat);

    this.boardQuat.slerp(this._targetQuat, Math.min(1, dt * 16));
  }

  public getAnimState(): SkaterAnimState {
    return {
      groundState: this.groundState,
      speed: this.speed,
      steerLean: this.steerLean,
      pushPhase: this.pushPhase,
      pushIntensity: this.pushIntensity,
      braking: this.braking,
      powerslideAngle: this.powerslideAngle,
      crouchAmount: this.crouchAmount,
      pumpG: this.pumpG,
      activeTrick: this.activeTrick ? this.activeTrick.id : null,
      trickProgress: this.activeTrick
        ? THREE.MathUtils.clamp(this.trickElapsed / this.activeTrick.duration, 0, 1)
        : 0,
      activeGrab: this.activeGrab,
      activeGrind: this.activeGrind,
      grindBalance: this.grindBalance,
      landingOutcome: this.landingOutcome,
      landingTimer: this.landingAnimTimer,
      crashTimer: this.crashTimer,
      crashNonce: this.crashNonce,
      crashVelX: this.crashVelX,
      crashVelZ: this.crashVelZ,
      getUpProgress: this.groundState === 'getting_up' ? 1 - this.getUpTimer / 0.65 : 0,
      boardFlipRoll: this.boardFlipRoll,
      boardShuvYaw: this.boardShuvYaw,
      boardPopPitch: this.boardPopPitch,
      boardHardflipTilt: this.boardHardflipTilt,
      wheelSpinAngle: this.wheelSpinAngle,
    };
  }

  public getHudState(): GameplayHudState {
    const isTrainingOrShoot =
      this.ruleMode === 'training_session' ||
      this.ruleMode === 'photo_shoot' ||
      this.ruleMode === 'video_shoot';

    const playerMetricScore = this.ruleMode === 'best_trick' ? this.bestComboScore : this.score;
    const playerName = this.activeSessionOptions.playerDisplayName || 'YOU (FLOW TEAM)';
    const playerNat: NationalityCode = this.activeSessionOptions.playerNationalityCode || 'BR';

    let leaderboard: LeaderboardEntry[] = [];
    let placement = 1;
    if (this.runFinished && this.competitionScores) {
      const playerEntry: LeaderboardEntry = {
        name: playerName,
        score: playerMetricScore,
        overallRating: this.competitionScores.overall,
        isPlayer: true,
        competitorNumber: 'FS-000',
        nationalityCode: playerNat,
        highlightNote:
          this.ruleMode === 'best_trick'
            ? this.bestComboLabel
            : this.ruleMode === 'big_air'
              ? `${this.maxAirHeight.toFixed(2)}m Air`
              : undefined,
      };
      leaderboard = [...this.competitionRivals, playerEntry].sort((a, b) => b.score - a.score);
      placement = Math.max(1, leaderboard.findIndex((e) => e.isPlayer) + 1);
    }

    const totalTeamScore =
      this.ruleMode === 'team_challenge' ? this.score + this.teammateBonusScore : undefined;

    const summary: GameplayRunSummary | undefined =
      this.runFinished && this.competitionScores
        ? {
            eventTitle: this.eventTitle,
            ruleMode: this.ruleMode,
            score: playerMetricScore,
            bestComboScore: this.bestComboScore,
            bestComboLabel: this.bestComboLabel,
            maxAirHeightMeters: Number(this.maxAirHeight.toFixed(2)),
            landedTricksCount: this.landedTrickCount,
            uniqueTricksCount: this.uniqueTricksLanded.size,
            bailsCount: this.bailCount,
            overallRating: this.competitionScores.overall,
            placement:
              this.ruleMode === 'team_challenge' && totalTeamScore !== undefined
                ? totalTeamScore >= this.rivalTeamScore
                  ? 1
                  : 2
                : placement,
            teamScore: totalTeamScore,
            rivalTeamScore: this.ruleMode === 'team_challenge' ? this.rivalTeamScore : undefined,
            leaderboard,
            npcLiveStatuses: [],
            highlightedTricks: this.highlightedTricks,
          }
        : undefined;

    return {
      mode: this.mode,
      ruleMode: this.ruleMode,
      eventTitle: this.eventTitle,
      score: playerMetricScore,
      bestComboScore: this.bestComboScore,
      bestComboLabel: this.bestComboLabel,
      maxAirHeightMeters: Number(this.maxAirHeight.toFixed(2)),
      landedTricksCount: this.landedTrickCount,
      speedKmh: Math.round(this.speed * 3.6),
      cameraMode: 'third_person', // overridden by Canvas active cameraMode
      airborne: this.groundState === 'airborne',
      grinding: this.groundState === 'grinding',
      crashed: this.groundState === 'crashed' || this.groundState === 'getting_up',
      grindBalance: this.grindBalance,
      activeTrickName: this.activeTrick
        ? this.activeTrick.name
        : this.activeGrab
          ? TRICK_CATALOG[this.activeGrab].name
          : this.activeGrind
            ? TRICK_CATALOG[this.activeGrind].name
            : null,
      comboTricks: [...this.comboTricks],
      comboBasePoints: this.comboBasePoints,
      comboMultiplier: this.comboMultiplier,
      landingOutcome: this.landingOutcome,
      landingMessage: this.landingMessage,
      timeRemaining: this.timeRemaining,
      runFinished: this.runFinished,
      paused: this.paused,
      competitionScores: this.competitionScores,
      leaderboard,
      isTrainingOrShoot,
      teamScore: totalTeamScore,
      rivalTeamScore: this.ruleMode === 'team_challenge' ? this.rivalTeamScore : undefined,
      teamLabel: this.teammateNames.length > 0 ? this.teammateNames.join(' & ') : undefined,
      targetScore: this.activeSessionOptions.targetScore,
      trainingAttrLabel: this.activeSessionOptions.trainingTargetAttr,
      summary,
    };
  }
}
