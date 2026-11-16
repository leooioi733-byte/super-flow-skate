import * as THREE from 'three';
import { ComboEntry, LandingOutcome } from '../types/game';
import { SkateSimulation, SkaterAnimState } from './skatePhysics';

export interface ReplayFrame {
  t: number; // absolute elapsed session time (seconds)
  px: number;
  py: number;
  pz: number;
  qx: number;
  qy: number;
  qz: number;
  qw: number;
  heading: number;
  trickFxBlend: number;
  anim: SkaterAnimState;
  score: number;
  speedKmh: number;
  activeTrickName: string | null;
  comboTricks: ComboEntry[];
  comboBasePoints: number;
  comboMultiplier: number;
  landingOutcome: LandingOutcome;
  landingMessage: string | null;
}

export interface ReplaySampledMeta {
  heading: number;
  trickFxBlend: number;
  score: number;
  speedKmh: number;
  activeTrickName: string | null;
  comboTricks: ComboEntry[];
  comboBasePoints: number;
  comboMultiplier: number;
  landingOutcome: LandingOutcome;
  landingMessage: string | null;
}

const _qA = new THREE.Quaternion();
const _qB = new THREE.Quaternion();

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

export class ReplayBuffer {
  private frames: ReplayFrame[] = [];
  private elapsed = 0;
  private accum = 0;
  private readonly sampleInterval = 1 / 30;
  private readonly maxFrames = 1800; // 60 seconds rolling at 30 Hz
  private bestHighlightAbsTime = 0;
  private bestComboScoreSeen = 0;

  public reset(): void {
    this.frames = [];
    this.elapsed = 0;
    this.accum = 0;
    this.bestHighlightAbsTime = 0;
    this.bestComboScoreSeen = 0;
  }

  public hasFrames(): boolean {
    return this.frames.length >= 15; // >= 0.5s recorded
  }

  public getDuration(): number {
    if (this.frames.length < 2) return 0;
    return Math.max(0, this.frames[this.frames.length - 1].t - this.frames[0].t);
  }

  public getBestHighlightTime(): number {
    if (this.frames.length < 2) return 0;
    const baseT = this.frames[0].t;
    const dur = this.getDuration();
    if (this.bestHighlightAbsTime <= baseT) {
      return Math.max(0, dur * 0.5);
    }
    return THREE.MathUtils.clamp(this.bestHighlightAbsTime - baseT - 1.25, 0, Math.max(0, dur - 0.5));
  }

  public record(dt: number, sim: SkateSimulation): void {
    if (dt <= 0) return;
    this.elapsed += dt;
    this.accum += dt;

    if (this.accum < this.sampleInterval && this.frames.length > 0) return;
    this.accum = 0;

    const anim = sim.getAnimState();
    const hud = sim.getHudState();

    // Track peak combo moment for one-click highlight jump
    const comboScore = hud.comboBasePoints * hud.comboMultiplier;
    if (comboScore >= this.bestComboScoreSeen && comboScore > 0) {
      this.bestComboScoreSeen = comboScore;
      this.bestHighlightAbsTime = this.elapsed;
    }

    const frame: ReplayFrame = {
      t: this.elapsed,
      px: sim.pos.x,
      py: sim.pos.y,
      pz: sim.pos.z,
      qx: sim.boardQuat.x,
      qy: sim.boardQuat.y,
      qz: sim.boardQuat.z,
      qw: sim.boardQuat.w,
      heading: sim.heading,
      trickFxBlend: sim.trickFxBlend,
      anim: { ...anim },
      score: hud.score,
      speedKmh: hud.speedKmh,
      activeTrickName: hud.activeTrickName,
      comboTricks: hud.comboTricks.length > 0 ? hud.comboTricks.map((c) => ({ ...c })) : [],
      comboBasePoints: hud.comboBasePoints,
      comboMultiplier: hud.comboMultiplier,
      landingOutcome: hud.landingOutcome,
      landingMessage: hud.landingMessage,
    };

    this.frames.push(frame);
    if (this.frames.length > this.maxFrames) {
      this.frames.shift();
    }
  }

  public sampleAtTime(
    relTime: number,
    outPos: THREE.Vector3,
    outQuat: THREE.Quaternion,
    outAnim: SkaterAnimState,
    outMeta: ReplaySampledMeta,
  ): boolean {
    const count = this.frames.length;
    if (count === 0) return false;

    if (count === 1) {
      const f = this.frames[0];
      outPos.set(f.px, f.py, f.pz);
      outQuat.set(f.qx, f.qy, f.qz, f.qw);
      Object.assign(outAnim, f.anim);
      outMeta.heading = f.heading;
      outMeta.trickFxBlend = f.trickFxBlend;
      outMeta.score = f.score;
      outMeta.speedKmh = f.speedKmh;
      outMeta.activeTrickName = f.activeTrickName;
      outMeta.comboTricks = f.comboTricks;
      outMeta.comboBasePoints = f.comboBasePoints;
      outMeta.comboMultiplier = f.comboMultiplier;
      outMeta.landingOutcome = f.landingOutcome;
      outMeta.landingMessage = f.landingMessage;
      return true;
    }

    const baseT = this.frames[0].t;
    const endT = this.frames[count - 1].t;
    const absT = THREE.MathUtils.clamp(baseT + relTime, baseT, endT);

    // Binary search for right-most frame with f.t <= absT
    let lo = 0;
    let hi = count - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (this.frames[mid].t <= absT) lo = mid;
      else hi = mid;
    }

    const a = this.frames[lo];
    const b = this.frames[Math.min(count - 1, lo + 1)];
    const span = b.t - a.t;
    const alpha = span > 0.0001 ? THREE.MathUtils.clamp((absT - a.t) / span, 0, 1) : 0;

    outPos.set(
      THREE.MathUtils.lerp(a.px, b.px, alpha),
      THREE.MathUtils.lerp(a.py, b.py, alpha),
      THREE.MathUtils.lerp(a.pz, b.pz, alpha),
    );
    _qA.set(a.qx, a.qy, a.qz, a.qw);
    _qB.set(b.qx, b.qy, b.qz, b.qw);
    outQuat.copy(_qA).slerp(_qB, alpha);

    // Copy discrete state from nearest frame, smoothly lerp continuous kinematics
    const ref = alpha < 0.5 ? a : b;
    Object.assign(outAnim, ref.anim);
    outAnim.steerLean = THREE.MathUtils.lerp(a.anim.steerLean, b.anim.steerLean, alpha);
    outAnim.pushPhase = THREE.MathUtils.lerp(a.anim.pushPhase, b.anim.pushPhase, alpha);
    outAnim.pushIntensity = THREE.MathUtils.lerp(a.anim.pushIntensity, b.anim.pushIntensity, alpha);
    outAnim.braking = THREE.MathUtils.lerp(a.anim.braking, b.anim.braking, alpha);
    outAnim.powerslideAngle = lerpAngle(a.anim.powerslideAngle, b.anim.powerslideAngle, alpha);
    outAnim.crouchAmount = THREE.MathUtils.lerp(a.anim.crouchAmount, b.anim.crouchAmount, alpha);
    outAnim.pumpG = THREE.MathUtils.lerp(a.anim.pumpG, b.anim.pumpG, alpha);
    outAnim.grindBalance = THREE.MathUtils.lerp(a.anim.grindBalance, b.anim.grindBalance, alpha);
    outAnim.wheelSpinAngle = THREE.MathUtils.lerp(a.anim.wheelSpinAngle, b.anim.wheelSpinAngle, alpha);

    // Only lerp trick flip/shuv/pop when still inside the same active trick!
    if (
      a.anim.activeTrick !== null &&
      a.anim.activeTrick === b.anim.activeTrick &&
      b.anim.trickProgress >= a.anim.trickProgress
    ) {
      outAnim.trickProgress = THREE.MathUtils.lerp(a.anim.trickProgress, b.anim.trickProgress, alpha);
      outAnim.boardFlipRoll = THREE.MathUtils.lerp(a.anim.boardFlipRoll, b.anim.boardFlipRoll, alpha);
      outAnim.boardShuvYaw = THREE.MathUtils.lerp(a.anim.boardShuvYaw, b.anim.boardShuvYaw, alpha);
      outAnim.boardPopPitch = THREE.MathUtils.lerp(a.anim.boardPopPitch, b.anim.boardPopPitch, alpha);
      outAnim.boardHardflipTilt = THREE.MathUtils.lerp(
        a.anim.boardHardflipTilt,
        b.anim.boardHardflipTilt,
        alpha,
      );
    }

    outMeta.heading = lerpAngle(a.heading, b.heading, alpha);
    outMeta.trickFxBlend = THREE.MathUtils.lerp(a.trickFxBlend, b.trickFxBlend, alpha);
    outMeta.score = ref.score;
    outMeta.speedKmh = Math.round(THREE.MathUtils.lerp(a.speedKmh, b.speedKmh, alpha));
    outMeta.activeTrickName = ref.activeTrickName;
    outMeta.comboTricks = ref.comboTricks;
    outMeta.comboBasePoints = ref.comboBasePoints;
    outMeta.comboMultiplier = ref.comboMultiplier;
    outMeta.landingOutcome = ref.landingOutcome;
    outMeta.landingMessage = ref.landingMessage;

    return true;
  }
}
