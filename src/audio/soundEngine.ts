// Procedural Web Audio API synthesizer for UI, location-aware skatepark ambience, pipe echoes, rolling wheels, pops, grinds, and landings

export interface ParkAudioZoneParams {
  x: number;
  y: number;
  z: number;
  isTransition: boolean;
  speed: number;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Spatial Ambient Layers
  private ambienceMasterGain: GainNode | null = null;
  private breezeGain: GainNode | null = null;
  private trafficGain: GainNode | null = null;
  private trafficFilter: BiquadFilterNode | null = null;
  private pipeResGain: GainNode | null = null;
  private pipeResFilter: BiquadFilterNode | null = null;
  private crowdGain: GainNode | null = null;
  private ambienceStarted = false;

  // SFX Bus + Pipe Concrete Echo Loop
  private sfxBus: GainNode | null = null;
  private echoWetGain: GainNode | null = null;
  private echoFeedbackGain: GainNode | null = null;

  // Continuous rolling & grind sound nodes
  private rollGain: GainNode | null = null;
  private rollFilter: BiquadFilterNode | null = null;
  private grindGain: GainNode | null = null;
  private grindFilter: BiquadFilterNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private brownNoiseBuffer: AudioBuffer | null = null;

  private isMuted = true;
  private masterVolume = 0.75;
  private sfxVolume = 0.85;
  private ambienceEnabled = true;

  // Current smoothed spatial state
  private currentEchoWet = 0.04;
  private trafficPhase = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.connect(this.ctx.destination);

      this.createNoiseBuffers();
      this.setupSfxAndEchoBus();
      this.setupSkateLoops();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private createNoiseBuffers() {
    if (!this.ctx) return;
    // Pink-ish noise for rolling wheels, grinds, breeze & crowd
    const bufferSize = this.ctx.sampleRate * 3;
    const pink = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const pData = pink.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.048;
      pData[i] = (b0 + b1 + b2) * 0.25;
    }
    this.noiseBuffer = pink;

    // Deeper brown noise + subtle low modulation for distant city traffic hum
    const brown = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const bData = brown.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.022 * white) / 1.022;
      bData[i] = Math.max(-1, Math.min(1, lastOut * 2.8));
    }
    this.brownNoiseBuffer = brown;
  }

  private setupSfxAndEchoBus() {
    if (!this.ctx || !this.masterGain) return;

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 1.0;

    // Dry path straight to master
    this.sfxBus.connect(this.masterGain);

    // Concrete Bowl / Pipe Slapback Echo Loop
    const delayA = this.ctx.createDelay(0.5);
    delayA.delayTime.value = 0.068;

    const delayB = this.ctx.createDelay(0.5);
    delayB.delayTime.value = 0.132;

    const echoFilter = this.ctx.createBiquadFilter();
    echoFilter.type = 'lowpass';
    echoFilter.frequency.value = 1550;
    echoFilter.Q.value = 0.7;

    this.echoFeedbackGain = this.ctx.createGain();
    this.echoFeedbackGain.gain.value = 0.22;

    this.echoWetGain = this.ctx.createGain();
    this.echoWetGain.gain.value = 0.04;

    this.sfxBus.connect(delayA);
    delayA.connect(delayB);
    delayA.connect(echoFilter);
    delayB.connect(echoFilter);
    echoFilter.connect(this.echoWetGain);
    echoFilter.connect(this.echoFeedbackGain);
    this.echoFeedbackGain.connect(delayA);
    this.echoWetGain.connect(this.masterGain);
  }

  private setupSkateLoops() {
    if (!this.ctx || !this.sfxBus || !this.noiseBuffer) return;

    // Rolling urethane wheels loop -> routed into sfxBus so pipes echo the wheels!
    const rollSrc = this.ctx.createBufferSource();
    rollSrc.buffer = this.noiseBuffer;
    rollSrc.loop = true;

    this.rollFilter = this.ctx.createBiquadFilter();
    this.rollFilter.type = 'bandpass';
    this.rollFilter.frequency.value = 180;
    this.rollFilter.Q.value = 0.9;

    this.rollGain = this.ctx.createGain();
    this.rollGain.gain.value = 0;

    rollSrc.connect(this.rollFilter);
    this.rollFilter.connect(this.rollGain);
    this.rollGain.connect(this.sfxBus);
    rollSrc.start();

    // Metallic grind loop -> routed into sfxBus so coping grinds echo inside bowl/pipes!
    const grindSrc = this.ctx.createBufferSource();
    grindSrc.buffer = this.noiseBuffer;
    grindSrc.loop = true;

    this.grindFilter = this.ctx.createBiquadFilter();
    this.grindFilter.type = 'bandpass';
    this.grindFilter.frequency.value = 2100;
    this.grindFilter.Q.value = 2.4;

    this.grindGain = this.ctx.createGain();
    this.grindGain.gain.value = 0;

    grindSrc.connect(this.grindFilter);
    this.grindFilter.connect(this.grindGain);
    this.grindGain.connect(this.sfxBus);
    grindSrc.start();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!muted) {
      this.ensureContext();
      if (this.ambienceEnabled && !this.ambienceStarted) {
        this.startAmbience();
      }
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        muted ? 0 : this.masterVolume,
        this.ctx.currentTime,
        0.04,
      );
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public updateSettings(masterPct: number, sfxPct: number, ambience: boolean) {
    this.masterVolume = Math.max(0, Math.min(1, masterPct / 100));
    this.sfxVolume = Math.max(0, Math.min(1, sfxPct / 100));
    this.ambienceEnabled = ambience;

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.masterVolume,
        this.ctx.currentTime,
        0.04,
      );
    }
    if (this.ambienceMasterGain && this.ctx) {
      this.ambienceMasterGain.gain.setTargetAtTime(
        ambience ? 1.0 : 0,
        this.ctx.currentTime,
        0.15,
      );
    } else if (ambience && !this.isMuted) {
      this.startAmbience();
    }
  }

  private startAmbience() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.ambienceStarted || !this.noiseBuffer || !this.brownNoiseBuffer) {
      return;
    }

    this.ambienceMasterGain = ctx.createGain();
    this.ambienceMasterGain.gain.value = this.ambienceEnabled ? 1.0 : 0;
    this.ambienceMasterGain.connect(this.masterGain);

    // 1. Open Skatepark Coastal Wind / Air Breeze
    const breezeSrc = ctx.createBufferSource();
    breezeSrc.buffer = this.noiseBuffer;
    breezeSrc.loop = true;

    const breezeFilter = ctx.createBiquadFilter();
    breezeFilter.type = 'lowpass';
    breezeFilter.frequency.value = 340;

    this.breezeGain = ctx.createGain();
    this.breezeGain.gain.value = 0.045;

    breezeSrc.connect(breezeFilter);
    breezeFilter.connect(this.breezeGain);
    this.breezeGain.connect(this.ambienceMasterGain);
    breezeSrc.start();

    // 2. Distant City Traffic Hum (louder near park perimeter edges!)
    const trafficSrc = ctx.createBufferSource();
    trafficSrc.buffer = this.brownNoiseBuffer;
    trafficSrc.loop = true;

    this.trafficFilter = ctx.createBiquadFilter();
    this.trafficFilter.type = 'bandpass';
    this.trafficFilter.frequency.value = 185;
    this.trafficFilter.Q.value = 0.65;

    this.trafficGain = ctx.createGain();
    this.trafficGain.gain.value = 0.008;

    trafficSrc.connect(this.trafficFilter);
    this.trafficFilter.connect(this.trafficGain);
    this.trafficGain.connect(this.ambienceMasterGain);
    trafficSrc.start();

    // 3. Enclosed Bowl / Pipe Concrete Resonance Hum
    const pipeSrc = ctx.createBufferSource();
    pipeSrc.buffer = this.noiseBuffer;
    pipeSrc.loop = true;

    this.pipeResFilter = ctx.createBiquadFilter();
    this.pipeResFilter.type = 'bandpass';
    this.pipeResFilter.frequency.value = 215;
    this.pipeResFilter.Q.value = 4.2;

    this.pipeResGain = ctx.createGain();
    this.pipeResGain.gain.value = 0.0;

    pipeSrc.connect(this.pipeResFilter);
    this.pipeResFilter.connect(this.pipeResGain);
    this.pipeResGain.connect(this.ambienceMasterGain);
    pipeSrc.start();

    // 4. Distant Grandstand Crowd / Stadium Murmur (louder near north stands)
    const crowdSrc = ctx.createBufferSource();
    crowdSrc.buffer = this.noiseBuffer;
    crowdSrc.loop = true;

    const crowdFilter = ctx.createBiquadFilter();
    crowdFilter.type = 'bandpass';
    crowdFilter.frequency.value = 620;
    crowdFilter.Q.value = 1.1;

    this.crowdGain = ctx.createGain();
    this.crowdGain.gain.value = 0.012;

    crowdSrc.connect(crowdFilter);
    crowdFilter.connect(this.crowdGain);
    this.crowdGain.connect(this.ambienceMasterGain);
    crowdSrc.start();

    this.ambienceStarted = true;
  }

  public updateLocationAmbience(params: ParkAudioZoneParams, dt: number) {
    if (this.isMuted || !this.ambienceEnabled || !this.ctx || !this.ambienceStarted) return;

    const { x, y, z, isTransition, speed } = params;
    const now = this.ctx.currentTime;

    // 1. Proximity to outer perimeter walls (X = ±25.6, Z = -11.7 / +20.5) -> Distant City Traffic
    const distEdgeX = Math.min(Math.abs(x - -25.6), Math.abs(25.6 - x));
    const distEdgeZ = Math.min(Math.abs(z - -11.7), Math.abs(20.5 - z));
    const minEdgeDist = Math.min(distEdgeX, distEdgeZ);
    const edgeProximity = Math.max(0, Math.min(1, (8.5 - minEdgeDist) / 7.5));

    // Gentle passing-car wave swell so traffic feels organic & alive
    this.trafficPhase += dt * 1.45;
    const carPassSwell = 0.68 + 0.32 * Math.sin(this.trafficPhase) * Math.cos(this.trafficPhase * 0.43);

    if (this.trafficGain && this.trafficFilter) {
      const targetTraffic = (0.008 + edgeProximity * 0.145) * carPassSwell;
      this.trafficGain.gain.setTargetAtTime(targetTraffic, now, 0.18);
      this.trafficFilter.frequency.setTargetAtTime(
        150 + edgeProximity * 170 + Math.sin(this.trafficPhase * 0.7) * 45,
        now,
        0.2,
      );
    }

    // 2. Inside Bowl or Quarter-Pipes / Transitions -> Hollow Concrete Pipe Echo & Resonance
    const bowlDist = Math.hypot(x - -5.2, z - -5.8);
    const inBowlCavity = bowlDist < 3.25 && y < 1.25 ? Math.max(0, Math.min(1, (3.25 - bowlDist) / 1.4)) : 0;

    // Proximity to quarter-pipes & A-frame pipe transitions
    const qp1Dist = Math.hypot(x - 5.8, z - -3.2);
    const qp2Dist = Math.hypot(x - -10.8, z - -1.5);
    const qp3Dist = Math.hypot(x - 0, z - 17.6);
    const nearPipe =
      Math.max(
        qp1Dist < 3.2 ? (3.2 - qp1Dist) / 2.4 : 0,
        qp2Dist < 3.0 ? (3.0 - qp2Dist) / 2.2 : 0,
        qp3Dist < 5.2 ? (5.2 - qp3Dist) / 3.8 : 0,
      );

    const pipeLevel = Math.min(1, Math.max(inBowlCavity, isTransition ? 0.72 : nearPipe * 0.78));
    const wallBounce = minEdgeDist < 3.6 ? (3.6 - minEdgeDist) * 0.08 : 0;

    this.currentEchoWet = Math.min(0.62, 0.04 + pipeLevel * 0.48 + wallBounce);
    if (this.echoWetGain && this.echoFeedbackGain) {
      this.echoWetGain.gain.setTargetAtTime(this.currentEchoWet, now, 0.12);
      this.echoFeedbackGain.gain.setTargetAtTime(0.16 + pipeLevel * 0.34, now, 0.12);
    }

    if (this.pipeResGain && this.pipeResFilter) {
      this.pipeResGain.gain.setTargetAtTime(pipeLevel * 0.065, now, 0.15);
      this.pipeResFilter.frequency.setTargetAtTime(195 + pipeLevel * 55, now, 0.15);
    }

    // 3. Grandstands / Crowd Murmur near North Stands (z < -4, |x| < 18)
    const crowdProx = z < -3 ? Math.max(0, Math.min(1, (-3 - z) / 8.5)) * (Math.abs(x) < 18 ? 1 : 0.4) : 0;
    if (this.crowdGain) {
      this.crowdGain.gain.setTargetAtTime(0.01 + crowdProx * 0.042, now, 0.25);
    }

    // 4. Open Air Breeze dips inside deep bowl, rises with riding speed in open plaza
    if (this.breezeGain) {
      const speedAir = Math.min(0.04, (speed / 15) * 0.035);
      const targetBreeze = (0.042 + speedAir) * (1 - inBowlCavity * 0.65);
      this.breezeGain.gain.setTargetAtTime(targetBreeze, now, 0.18);
    }
  }

  public updateSkateMotion(speed: number, grounded: boolean, grinding: boolean) {
    if (this.isMuted || !this.ctx || !this.rollGain || !this.rollFilter || !this.grindGain) return;
    const now = this.ctx.currentTime;
    const normSpeed = Math.min(1, Math.max(0, speed / 14));

    const targetRoll = grounded && !grinding && speed > 0.35 ? normSpeed * 0.22 * this.sfxVolume : 0;
    this.rollGain.gain.setTargetAtTime(targetRoll, now, 0.06);
    this.rollFilter.frequency.setTargetAtTime(140 + normSpeed * 280, now, 0.08);

    const targetGrind = grinding ? (0.12 + normSpeed * 0.12) * this.sfxVolume : 0;
    this.grindGain.gain.setTargetAtTime(targetGrind, now, 0.03);
  }

  public silenceGameplayLoops() {
    if (!this.ctx || !this.rollGain || !this.grindGain) return;
    const now = this.ctx.currentTime;
    this.rollGain.gain.setTargetAtTime(0, now, 0.03);
    this.grindGain.gain.setTargetAtTime(0, now, 0.03);
  }

  public playPop() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxBus) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.065);

    gain.gain.setValueAtTime(0.24 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playFlip() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxBus) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.06);

    gain.gain.setValueAtTime(0.08 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  public playPush() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxBus) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.07);

    gain.gain.setValueAtTime(0.11 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.085);
  }

  public playLand(outcome: 'perfect' | 'sketchy' | 'bail') {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxBus) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = outcome === 'bail' ? 'sawtooth' : 'triangle';

    if (outcome === 'perfect') {
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(52, now + 0.09);
      gain.gain.setValueAtTime(0.22 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    } else if (outcome === 'sketchy') {
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.11);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    } else {
      osc.frequency.setValueAtTime(115, now);
      osc.frequency.exponentialRampToValueAtTime(34, now + 0.22);
      gain.gain.setValueAtTime(0.28 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    }

    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playComboBank() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    [523.25, 659.25].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(0.09 * this.sfxVolume, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.16);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.17);
    });
  }

  public playBuzzer() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(330, now + 0.18);
    gain.gain.setValueAtTime(0.16 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.44);
  }

  public playHover() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.035);
    gain.gain.setValueAtTime(0.05 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playClick(primary = false) {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = primary ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(primary ? 520 : 440, now);
    osc.frequency.exponentialRampToValueAtTime(primary ? 780 : 620, now + 0.065);
    gain.gain.setValueAtTime((primary ? 0.12 : 0.09) * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.085);
  }

  public playBack() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.07);
    gain.gain.setValueAtTime(0.08 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }
}

export const soundEngine = new SoundEngine();
