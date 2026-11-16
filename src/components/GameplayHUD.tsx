import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  Clapperboard,
  Eye,
  EyeOff,
  Gamepad2,
  Home,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  CameraMode,
  GameplayHudState,
  GameplayRunSummary,
  ReplayCameraMode,
  ReplayHudState,
  ReplaySpeedOption,
  TrickId,
  VirtualInputState,
} from '../types/game';
import { soundEngine } from '../audio/soundEngine';
import { CountryFlag } from './SkaterPortrait';

interface GameplayHUDProps {
  hud: GameplayHudState;
  cameraMode: CameraMode;
  language: 'pt' | 'en';
  isMuted: boolean;
  isCareerSession?: boolean;
  replayActive?: boolean;
  replayState?: ReplayHudState;
  virtualInputRef: React.MutableRefObject<VirtualInputState>;
  onToggleCamera: () => void;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onResetPosition: () => void;
  onRestartSession: () => void;
  onFinishTrainingOrShoot?: () => void;
  onReturnToCareerWithResult?: (summary: GameplayRunSummary) => void;
  onExitToMenu: () => void;
  onOpenReplay?: () => void;
  onCloseReplay?: () => void;
  onToggleReplayPlay?: () => void;
  onChangeReplaySpeed?: (speed: ReplaySpeedOption) => void;
  onChangeReplayCamera?: (mode: ReplayCameraMode) => void;
  onSeekReplay?: (time: number) => void;
  onJumpReplayHighlight?: () => void;
}

const TOUCH_TRICK_PAD: { id: TrickId; label: string }[] = [
  { id: 'kickflip', label: 'KICK' },
  { id: 'heelflip', label: 'HEEL' },
  { id: 'pop_shove_it', label: 'SHUV' },
  { id: 'flip_360', label: '360°' },
  { id: 'hardflip', label: 'HARD' },
  { id: 'fs_180', label: 'FS 180' },
];

export const GameplayHUD: React.FC<GameplayHUDProps> = ({
  hud,
  cameraMode,
  language,
  isMuted,
  isCareerSession = false,
  replayActive = false,
  replayState,
  virtualInputRef,
  onToggleCamera,
  onTogglePause,
  onToggleMute,
  onResetPosition,
  onRestartSession,
  onFinishTrainingOrShoot,
  onReturnToCareerWithResult,
  onExitToMenu,
  onOpenReplay,
  onCloseReplay,
  onToggleReplayPlay,
  onChangeReplaySpeed,
  onChangeReplayCamera,
  onSeekReplay,
  onJumpReplayHighlight,
}) => {
  const isPt = language === 'pt';

  const [touchVisible, setTouchVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia?.('(pointer: coarse)').matches ||
      'ontouchstart' in window ||
      window.innerWidth < 900
    );
  });

  // Analog Joystick & Multi-Touch Button Pointer Isolation
  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const joyPointerIdRef = useRef<number | null>(null);
  const grabPointerIdRef = useRef<number | null>(null);
  const crouchPointerIdRef = useRef<number | null>(null);
  const [joyKnob, setJoyKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [crouchPressed, setCrouchPressed] = useState(false);
  const [grabPressed, setGrabPressed] = useState(false);
  const [replayControlsHidden, setReplayControlsHidden] = useState(false);

  // Reset Replay HUD visibility when opening/closing replay
  useEffect(() => {
    setReplayControlsHidden(false);
  }, [replayActive]);

  // Keyboard shortcut [H] to toggle Replay controls visibility
  useEffect(() => {
    if (!replayActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.repeat && e.code === 'KeyH') {
        setReplayControlsHidden((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [replayActive]);

  // Reset virtual inputs cleanly if paused, finished, or watching replay
  useEffect(() => {
    if (hud.paused || hud.runFinished || replayActive) {
      joyPointerIdRef.current = null;
      grabPointerIdRef.current = null;
      crouchPointerIdRef.current = null;
      virtualInputRef.current.moveX = 0;
      virtualInputRef.current.moveY = 0;
      virtualInputRef.current.sprint = false;
      virtualInputRef.current.crouching = false;
      virtualInputRef.current.grabHeld = null;
      virtualInputRef.current.spinDir = 0;
      setJoyKnob({ x: 0, y: 0 });
      setCrouchPressed(false);
      setGrabPressed(false);
    }
  }, [hud.paused, hud.runFinished, replayActive, virtualInputRef]);

  const updateJoystick = (clientX: number, clientY: number) => {
    const el = joyBaseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.4;

    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR && dist > 0) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }

    const nx = dx / maxR;
    const ny = -dy / maxR; // up = positive push!
    setJoyKnob({ x: dx, y: dy });

    virtualInputRef.current.moveX = Math.abs(nx) < 0.12 ? 0 : nx;
    virtualInputRef.current.moveY = Math.abs(ny) < 0.12 ? 0 : ny;
    virtualInputRef.current.sprint = dist / maxR > 0.82 && ny > 0.45;
  };

  const resetJoystick = () => {
    joyPointerIdRef.current = null;
    setJoyKnob({ x: 0, y: 0 });
    virtualInputRef.current.moveX = 0;
    virtualInputRef.current.moveY = 0;
    virtualInputRef.current.sprint = false;
  };

  const triggerVirtualTrick = (id: TrickId) => {
    const prevSeq = virtualInputRef.current.trickTrigger?.seq ?? 0;
    virtualInputRef.current.trickTrigger = { id, seq: prevSeq + 1 };
  };

  const formatTimer = (secs: number) => {
    const clamped = Math.max(0, Math.ceil(secs));
    const m = Math.floor(clamped / 60);
    const s = clamped % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const formatReplayTime = (secs: number) => {
    const clamped = Math.max(0, secs);
    const m = Math.floor(clamped / 60);
    const s = Math.floor(clamped % 60);
    const tenths = Math.floor((clamped % 1) * 10);
    return `${m}:${String(s).padStart(2, '0')}.${tenths}`;
  };

  if (replayActive) {
    const rState: ReplayHudState = replayState ?? {
      active: true,
      playing: true,
      currentTime: 0,
      duration: 0,
      speed: 1,
      cameraMode: 'cine',
      hasFrames: true,
      activeTrickName: null,
      comboTricks: [],
      comboBasePoints: 0,
      comboMultiplier: 1,
      landingOutcome: null,
      landingMessage: null,
      score: 0,
      speedKmh: 0,
    };
    const speeds: ReplaySpeedOption[] = [0.25, 0.5, 1, 2];
    const cameras: { id: ReplayCameraMode; label: string }[] = [
      { id: 'cine', label: 'Cine' },
      { id: 'third_person', label: isPt ? '3ª' : '3rd' },
      { id: 'first_person', label: isPt ? '1ª' : '1st' },
      { id: 'free_orbit', label: isPt ? 'Órbita' : 'Orbit' },
    ];
    const duration = Math.max(0.1, rState.duration);
    const current = Math.min(Math.max(0, rState.currentTime), duration);

    return (
      <div className="fixed inset-0 z-30 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5">
        {/* TOP REPLAY BAR */}
        <div className="flex items-start justify-between gap-3">
          {/* Top-Left Synced Score & Combo */}
          {!replayControlsHidden ? (
            <div className="flex flex-col gap-2 max-w-[290px] sm:max-w-[360px]">
              <div className="px-3.5 py-2 rounded-xl bg-[#0e1722]/88 border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                <div className="text-[10px] font-bold tracking-[0.22em] text-[#38bdf8]">
                  {isPt ? 'PONTUAÇÃO' : 'SCORE'}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-wide text-white tabular-nums leading-tight">
                  {rState.score.toLocaleString()}
                </div>
              </div>

              {rState.comboTricks.length > 0 && (
                <div className="px-3.5 py-2 rounded-xl bg-[#102636]/90 border border-cyan-400/50 shadow-[0_8px_22px_rgba(14,116,144,0.35)]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-extrabold tracking-[0.12em] text-cyan-200 uppercase truncate">
                      {rState.activeTrickName ??
                        rState.comboTricks[rState.comboTricks.length - 1]?.name}
                    </span>
                    <span className="text-sm font-extrabold text-[#38bdf8] tabular-nums shrink-0">
                      {rState.comboBasePoints.toLocaleString()} ×{rState.comboMultiplier}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-200/90 leading-snug line-clamp-2">
                    {rState.comboTricks.map((t) => t.name).join(' → ')}
                  </div>
                </div>
              )}

              {rState.landingMessage && (
                <div
                  className={`px-3 py-1.5 rounded-lg border text-xs font-extrabold tracking-[0.14em] uppercase shadow-lg ${
                    rState.landingOutcome === 'perfect'
                      ? 'bg-emerald-950/90 border-emerald-400/60 text-emerald-200'
                      : rState.landingOutcome === 'sketchy'
                        ? 'bg-amber-950/90 border-amber-400/60 text-amber-200'
                        : 'bg-rose-950/90 border-rose-400/60 text-rose-200'
                  }`}
                >
                  {rState.landingMessage}
                </div>
              )}
            </div>
          ) : (
            <div />
          )}

          {/* Top-Center Replay Studio Badge */}
          {!replayControlsHidden && (
            <div className="hidden sm:flex flex-col items-center px-4 py-2 rounded-xl bg-[#0e1722]/90 border border-cyan-400/40 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
              <div className="flex items-center gap-2 text-[11px] font-extrabold tracking-[0.22em] text-[#38bdf8]">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>REPLAY STUDIO</span>
              </div>
              <span className="text-xs font-bold tracking-[0.14em] text-slate-200 uppercase mt-0.5">
                {hud.eventTitle} · {rState.speed}×
              </span>
            </div>
          )}

          {/* Top-Right Speedometer + Toggle Config + Exit Replay */}
          <div
            className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5 sm:gap-2"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {!replayControlsHidden && (
              <div className="px-3 h-10 sm:h-11 rounded-xl bg-[#0e1722]/88 border border-white/15 flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-extrabold text-white tabular-nums">
                  {rState.speedKmh}
                </span>
                <span className="text-[10px] font-bold tracking-wider text-[#38bdf8]">KM/H</span>
              </div>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                soundEngine.playClick(false);
                setReplayControlsHidden((v) => !v);
              }}
              title={
                replayControlsHidden
                  ? isPt
                    ? 'Mostrar Configurações [H]'
                    : 'Show Controls [H]'
                  : isPt
                    ? 'Ocultar Configurações [H]'
                    : 'Hide Controls [H]'
              }
              className={`h-10 sm:h-11 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-extrabold tracking-[0.12em] transition-colors cursor-pointer shadow-lg ${
                replayControlsHidden
                  ? 'bg-[#12384b]/90 hover:bg-[#164860] border-cyan-400/60 text-cyan-100'
                  : 'bg-[#0e1722]/88 hover:bg-[#172536] border-white/18 text-slate-100'
              }`}
            >
              {replayControlsHidden ? (
                <>
                  <SlidersHorizontal className="w-4 h-4 text-[#38bdf8]" />
                  <span>{isPt ? 'CONFIG' : 'CONTROLS'}</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 text-[#38bdf8]" />
                  <span className="hidden md:inline">{isPt ? 'OCULTAR' : 'HIDE'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                soundEngine.playBack();
                onCloseReplay?.();
              }}
              className="h-10 sm:h-11 px-3.5 rounded-xl bg-[#162333] hover:bg-rose-950/85 border border-white/18 hover:border-rose-400/60 flex items-center gap-1.5 text-xs font-extrabold tracking-[0.14em] text-white transition-colors cursor-pointer shadow-lg"
            >
              <X className="w-4 h-4 text-rose-300" />
              <span>
                {replayControlsHidden
                  ? isPt
                    ? 'SAIR'
                    : 'EXIT'
                  : isPt
                    ? 'SAIR DO REPLAY'
                    : 'EXIT REPLAY'}
              </span>
            </button>
          </div>
        </div>

        {/* BOTTOM REPLAY CONTROLS DOCK */}
        {!replayControlsHidden && (
          <div
            className="pointer-events-auto w-full max-w-4xl mx-auto rounded-2xl bg-[#0e1722]/92 border border-white/15 p-3 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Timeline Scrubber */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] sm:text-xs font-bold text-[#38bdf8] tabular-nums w-12 shrink-0">
                {formatReplayTime(current)}
              </span>
              <input
                type="range"
                min={0}
                max={duration}
                step={0.05}
                value={current}
                onChange={(e) => onSeekReplay?.(parseFloat(e.target.value))}
                aria-label={isPt ? 'Linha do tempo do replay' : 'Replay timeline'}
                className="w-full h-2 rounded-lg bg-[#1a293a] accent-[#38bdf8] cursor-pointer"
              />
              <span className="text-[11px] sm:text-xs font-bold text-slate-300 tabular-nums w-12 text-right shrink-0">
                {formatReplayTime(duration)}
              </span>
            </div>

            {/* Controls Row */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              {/* Play/Pause & Highlight */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    soundEngine.playClick(false);
                    onToggleReplayPlay?.();
                  }}
                  className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-[#0e7490] to-[#178ea9] hover:from-[#1289a8] hover:to-[#1ea5c4] border border-cyan-300/45 flex items-center gap-1.5 text-xs font-extrabold tracking-[0.12em] text-white cursor-pointer"
                >
                  {rState.playing ? (
                    <Pause className="w-3.5 h-3.5 fill-white" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-white" />
                  )}
                  <span>{rState.playing ? (isPt ? 'PAUSAR' : 'PAUSE') : 'PLAY'}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    soundEngine.playClick(true);
                    onJumpReplayHighlight?.();
                  }}
                  className="h-9 px-3 rounded-xl bg-[#131f2d] hover:bg-[#1a2c3f] border border-amber-400/40 flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.1em] text-amber-200 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isPt ? 'MELHOR LANCE' : 'BEST MOMENT'}</span>
                </button>
              </div>

              {/* Playback Speeds */}
              <div className="flex items-center gap-1 bg-[#091018] p-1 rounded-xl border border-white/10">
                {speeds.map((spd) => {
                  const active = rState.speed === spd;
                  return (
                    <button
                      key={spd}
                      type="button"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        soundEngine.playClick(false);
                        onChangeReplaySpeed?.(spd);
                      }}
                      className={`h-7 px-2.5 rounded-lg text-[11px] font-extrabold tabular-nums transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#178ea9] text-white shadow'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {spd}×
                    </button>
                  );
                })}
              </div>

              {/* Camera Angles */}
              <div className="flex items-center gap-1 bg-[#091018] p-1 rounded-xl border border-white/10">
                <Camera className="w-3.5 h-3.5 text-[#38bdf8] mx-1.5 hidden sm:block" />
                {cameras.map((cam) => {
                  const active = rState.cameraMode === cam.id;
                  return (
                    <button
                      key={cam.id}
                      type="button"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        soundEngine.playClick(false);
                        onChangeReplayCamera?.(cam.id);
                      }}
                      className={`h-7 px-2.5 rounded-lg text-[11px] font-extrabold tracking-wider transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#12384b] border border-[#38bdf8]/60 text-[#38bdf8]'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {cam.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 tracking-wide">
              <span>
                {rState.cameraMode === 'free_orbit' || rState.cameraMode === 'cine'
                  ? isPt
                    ? 'Arraste na tela para orbitar a câmera · Scroll para zoom'
                    : 'Drag viewport to orbit camera · Scroll to zoom'
                  : rState.cameraMode === 'first_person'
                    ? isPt
                      ? 'Visão do skatista em 1ª pessoa'
                      : 'First-person skater perspective'
                    : isPt
                      ? 'Câmera de acompanhamento em 3ª pessoa'
                      : 'Third-person chase camera'}
              </span>
              <span className="hidden sm:inline">
                {isPt
                  ? 'Espaço: Play/Pause · H: Ocultar · Esc: Sair'
                  : 'Space: Play/Pause · H: Hide · Esc: Exit'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-20 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5">
      {/* TOP BAR: Score/Combo (Left) | Mode/Timer (Center) | Speed/Tools (Right) */}
      <div className="flex items-start justify-between gap-3">
        {/* TOP-LEFT: Score, Live Combo & Grind Balance */}
        <div className="flex flex-col gap-2 max-w-[290px] sm:max-w-[360px]">
          <div className="px-3.5 py-2.5 rounded-xl bg-[#0e1722]/86 border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
            <div className="text-[10px] font-bold tracking-[0.22em] text-[#38bdf8]">
              {isPt ? 'PONTUAÇÃO' : 'SCORE'}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-wide text-white tabular-nums leading-tight">
              {hud.score.toLocaleString()}
            </div>
          </div>

          {/* Active Combo Stack */}
          {hud.comboTricks.length > 0 && (
            <div className="px-3.5 py-2.5 rounded-xl bg-[#102636]/90 border border-cyan-400/50 shadow-[0_8px_22px_rgba(14,116,144,0.35)]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-extrabold tracking-[0.12em] text-cyan-200 uppercase truncate">
                  {hud.activeTrickName ?? hud.comboTricks[hud.comboTricks.length - 1]?.name}
                </span>
                <span className="text-sm font-extrabold text-[#38bdf8] tabular-nums shrink-0">
                  {hud.comboBasePoints.toLocaleString()} ×{hud.comboMultiplier}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-200/90 leading-snug line-clamp-2">
                {hud.comboTricks.map((t) => t.name).join(' → ')}
              </div>
            </div>
          )}

          {/* Landing Toast */}
          {hud.landingMessage && (
            <div
              className={`px-3 py-1.5 rounded-lg border text-xs font-extrabold tracking-[0.14em] uppercase shadow-lg ${
                hud.landingOutcome === 'perfect'
                  ? 'bg-emerald-950/90 border-emerald-400/60 text-emerald-200'
                  : hud.landingOutcome === 'sketchy'
                    ? 'bg-amber-950/90 border-amber-400/60 text-amber-200'
                    : 'bg-rose-950/90 border-rose-400/60 text-rose-200'
              }`}
            >
              {hud.landingMessage}
            </div>
          )}

          {/* Rail Grind Balance Meter */}
          {hud.grinding && (
            <div className="px-3 py-2 rounded-xl bg-[#0e1722]/90 border border-cyan-400/45">
              <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.18em] text-cyan-200 mb-1.5">
                <span>{isPt ? 'EQUILÍBRIO' : 'BALANCE'}</span>
                <span>A / D</span>
              </div>
              <div className="relative h-2.5 rounded-full bg-[#1a293a] overflow-hidden border border-white/10">
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 bg-cyan-400/25" />
                <div
                  className="absolute top-0 bottom-0 w-2.5 -ml-1.25 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]"
                  style={{ left: `${50 + hud.grindBalance * 46}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* TOP-CENTER: Mode Title, Special Rule Context & Competition Timer */}
        <div className="hidden sm:flex flex-col items-center gap-1.5">
          <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-[#0e1722]/88 border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
            <span className="text-[10px] font-bold tracking-[0.22em] text-slate-300 uppercase">
              {hud.eventTitle}
            </span>
            {hud.mode === 'competition' ? (
              <span
                className={`text-2xl font-extrabold tracking-widest tabular-nums ${
                  hud.timeRemaining <= 10 ? 'text-rose-400' : 'text-white'
                }`}
              >
                {formatTimer(hud.timeRemaining)}
              </span>
            ) : (
              <span className="text-xs font-bold tracking-[0.2em] text-[#38bdf8] mt-0.5">
                {hud.isTrainingOrShoot
                  ? isPt
                    ? 'SESSÃO CARREIRA'
                    : 'CAREER SESSION'
                  : 'FREE SKATE'}
              </span>
            )}

            {/* Rule-specific live telemetry strip */}
            {hud.ruleMode === 'best_trick' && (
              <div className="mt-1 text-[11px] font-bold text-cyan-200 tabular-nums">
                {isPt ? 'MELHOR COMBO:' : 'BEST COMBO:'} {hud.bestComboScore.toLocaleString()} pts
              </div>
            )}
            {hud.ruleMode === 'big_air' && (
              <div className="mt-1 text-[11px] font-bold text-amber-300 tabular-nums">
                {isPt ? 'ALTURA MÁX:' : 'MAX AIR:'} {hud.maxAirHeightMeters.toFixed(2)}m
              </div>
            )}
            {hud.ruleMode === 'night_session' && (
              <div className="mt-0.5 text-[10px] font-extrabold tracking-wider text-cyan-300">
                NIGHT SESSION · 1.18× FLOW
              </div>
            )}
            {hud.ruleMode === 'team_challenge' && hud.teamScore !== undefined && (
              <div className="mt-1 text-[11px] font-bold text-emerald-300 tabular-nums">
                {hud.teamLabel ?? 'EQUIPE'}: {hud.teamScore.toLocaleString()} vs{' '}
                {(hud.rivalTeamScore ?? 0).toLocaleString()}
              </div>
            )}
            {hud.ruleMode === 'duel_1v1' && hud.targetScore !== undefined && (
              <div className="mt-1 text-[11px] font-bold text-rose-300 tabular-nums">
                {isPt ? 'ALVO RIVAL:' : 'RIVAL TARGET:'} {hud.targetScore.toLocaleString()} pts
              </div>
            )}
          </div>

          {hud.isTrainingOrShoot && !hud.runFinished && onFinishTrainingOrShoot && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick(true);
                onFinishTrainingOrShoot();
              }}
              className="pointer-events-auto h-9 px-4 rounded-xl bg-gradient-to-r from-[#0e7490] to-[#178ea9] hover:from-[#1289a8] hover:to-[#1ea5c4] border border-cyan-300/45 flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.14em] text-white shadow-lg cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isPt ? 'CONCLUIR E SALVAR' : 'FINISH & SAVE'}</span>
            </button>
          )}
        </div>

        {/* TOP-RIGHT: Speed, Camera Toggle, Reset, Touch Toggle, Mute, Pause */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          {/* Mobile Timer & Finish Training on small screens */}
          {hud.mode === 'competition' && (
            <div className="sm:hidden px-2.5 h-10 rounded-xl bg-[#0e1722]/88 border border-white/15 flex items-center text-sm font-extrabold tabular-nums text-white">
              {formatTimer(hud.timeRemaining)}
            </div>
          )}
          {hud.isTrainingOrShoot && !hud.runFinished && onFinishTrainingOrShoot && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick(true);
                onFinishTrainingOrShoot();
              }}
              className="sm:hidden px-2.5 h-10 rounded-xl bg-[#1587a3] border border-cyan-300/40 flex items-center text-[10px] font-extrabold tracking-wider text-white"
            >
              {isPt ? 'SALVAR' : 'SAVE'}
            </button>
          )}

          {/* Speedometer */}
          <div className="px-3 h-10 sm:h-11 rounded-xl bg-[#0e1722]/86 border border-white/15 flex items-center gap-1.5">
            <span className="text-sm sm:text-base font-extrabold text-white tabular-nums">
              {hud.speedKmh}
            </span>
            <span className="text-[10px] font-bold tracking-wider text-[#38bdf8]">KM/H</span>
          </div>

          {/* Camera Toggle (3rd / 1st Person) */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick(false);
              onToggleCamera();
            }}
            title={isPt ? 'Alternar Câmera [C]' : 'Switch Camera [C]'}
            className="h-10 sm:h-11 px-2.5 sm:px-3 rounded-xl bg-[#0e1722]/86 hover:bg-[#172536] border border-white/15 hover:border-cyan-400/50 flex items-center gap-1.5 text-xs font-bold tracking-wider text-white transition-colors cursor-pointer"
          >
            {cameraMode === 'first_person' ? (
              <Eye className="w-4 h-4 text-[#38bdf8]" />
            ) : (
              <Camera className="w-4 h-4 text-[#38bdf8]" />
            )}
            <span className="hidden md:inline">
              {cameraMode === 'first_person' ? '1ST' : '3RD'}
            </span>
          </button>

          {/* Instant Replay */}
          {hud.hasReplay && onOpenReplay && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick(true);
                onOpenReplay();
              }}
              title={isPt ? 'Assistir Replay' : 'Watch Replay'}
              className="h-10 sm:h-11 px-2.5 sm:px-3 rounded-xl bg-[#0e1722]/86 hover:bg-[#12384b] border border-white/15 hover:border-cyan-400/60 flex items-center gap-1.5 text-xs font-bold tracking-wider text-white transition-colors cursor-pointer"
            >
              <Clapperboard className="w-4 h-4 text-[#38bdf8]" />
              <span className="hidden lg:inline">REPLAY</span>
            </button>
          )}

          {/* Reset Skater Position */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick(false);
              onResetPosition();
            }}
            title={isPt ? 'Reposicionar Skatista [R]' : 'Reset Position [R]'}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0e1722]/86 hover:bg-[#172536] border border-white/15 hover:border-cyan-400/50 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Toggle Virtual Touch Controls */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick(false);
              setTouchVisible((v) => !v);
            }}
            title={isPt ? 'Controles na Tela' : 'On-Screen Controls'}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
              touchVisible
                ? 'bg-[#12384b] border-[#38bdf8]/70 text-[#38bdf8]'
                : 'bg-[#0e1722]/86 hover:bg-[#172536] border-white/15 text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
          </button>

          {/* Audio Mute */}
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? 'Enable Audio' : 'Mute Audio'}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0e1722]/86 hover:bg-[#172536] border border-white/15 hover:border-cyan-400/50 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-white/80" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#38bdf8]" />
            )}
          </button>

          {/* Pause */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick(false);
              onTogglePause();
            }}
            title={isPt ? 'Pausar [Esc]' : 'Pause [Esc]'}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0e1722]/86 hover:bg-[#172536] border border-white/15 hover:border-cyan-400/50 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BOTTOM AREA: Mobile Touch Controls OR Desktop Keyboard Strip */}
      {touchVisible && !hud.paused && !hud.runFinished ? (
        <div className="flex items-end justify-between gap-2 pb-1">
          {/* Left Analog Joystick */}
          <div
            ref={joyBaseRef}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              joyPointerIdRef.current = e.pointerId;
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // Ignore unsupported capture
              }
              updateJoystick(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (joyPointerIdRef.current !== e.pointerId) return;
              e.stopPropagation();
              updateJoystick(e.clientX, e.clientY);
            }}
            onPointerUp={(e) => {
              if (joyPointerIdRef.current !== e.pointerId) return;
              e.stopPropagation();
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {
                // Ignore
              }
              resetJoystick();
            }}
            onPointerCancel={(e) => {
              if (joyPointerIdRef.current !== e.pointerId) return;
              e.stopPropagation();
              resetJoystick();
            }}
            className="pointer-events-auto relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#0e1722]/75 border-2 border-white/20 flex items-center justify-center touch-none shadow-[0_8px_26px_rgba(0,0,0,0.45)]"
          >
            <div className="absolute inset-3 rounded-full border border-white/10 pointer-events-none" />
            <div
              className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1997b3] to-[#0e7490] border border-cyan-300/60 shadow-[0_4px_14px_rgba(56,189,248,0.45)] pointer-events-none"
              style={{ transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)` }}
            />
          </div>

          {/* Right Trick + Jump + Grab Cluster */}
          <div
            className="pointer-events-auto flex items-end gap-2 touch-none"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
          >
            {/* Compact 2x3 Flip & Spin Pad */}
            <div className="grid grid-cols-3 gap-1.5">
              {TOUCH_TRICK_PAD.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    triggerVirtualTrick(t.id);
                  }}
                  className="h-10 px-2.5 rounded-lg bg-[#0e1722]/85 active:bg-[#1587a3] border border-white/15 text-[10px] font-extrabold tracking-wider text-white touch-none"
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Grab + Nollie + Primary Ollie */}
            <div className="flex flex-col gap-1.5 items-end">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    grabPointerIdRef.current = e.pointerId;
                    try {
                      e.currentTarget.setPointerCapture(e.pointerId);
                    } catch {
                      // Ignore
                    }
                    setGrabPressed(true);
                    const mx = virtualInputRef.current.moveX;
                    const my = virtualInputRef.current.moveY;
                    virtualInputRef.current.grabHeld =
                      my > 0.45
                        ? 'nose_grab'
                        : my < -0.45
                          ? 'tail_grab'
                          : mx < -0.45
                            ? 'melon'
                            : mx > 0.45
                              ? 'method'
                              : 'indy';
                  }}
                  onPointerUp={(e) => {
                    if (grabPointerIdRef.current !== e.pointerId) return;
                    e.stopPropagation();
                    grabPointerIdRef.current = null;
                    setGrabPressed(false);
                    virtualInputRef.current.grabHeld = null;
                  }}
                  onPointerCancel={(e) => {
                    if (grabPointerIdRef.current !== e.pointerId) return;
                    e.stopPropagation();
                    grabPointerIdRef.current = null;
                    setGrabPressed(false);
                    virtualInputRef.current.grabHeld = null;
                  }}
                  className={`h-10 px-3 rounded-xl border text-[11px] font-extrabold tracking-wider touch-none ${
                    grabPressed
                      ? 'bg-[#178ea9] border-cyan-300 text-white'
                      : 'bg-[#0e1722]/85 border-white/15 text-cyan-200'
                  }`}
                >
                  GRAB
                </button>

                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    virtualInputRef.current.nollieTrigger += 1;
                  }}
                  className="h-10 px-3 rounded-xl bg-[#0e1722]/85 active:bg-[#178ea9] border border-white/15 text-[11px] font-extrabold tracking-wider text-white touch-none"
                >
                  NOLLIE
                </button>
              </div>

              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  crouchPointerIdRef.current = e.pointerId;
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  } catch {
                    // Ignore
                  }
                  setCrouchPressed(true);
                  virtualInputRef.current.crouching = true;
                }}
                onPointerUp={(e) => {
                  if (crouchPointerIdRef.current !== e.pointerId) return;
                  e.stopPropagation();
                  crouchPointerIdRef.current = null;
                  setCrouchPressed(false);
                  virtualInputRef.current.crouching = false;
                  virtualInputRef.current.ollieTrigger += 1;
                }}
                onPointerCancel={(e) => {
                  if (crouchPointerIdRef.current !== e.pointerId) return;
                  e.stopPropagation();
                  crouchPointerIdRef.current = null;
                  setCrouchPressed(false);
                  virtualInputRef.current.crouching = false;
                }}
                className={`w-28 h-14 rounded-2xl border flex items-center justify-center text-xs font-extrabold tracking-[0.2em] text-white touch-none shadow-[0_8px_22px_rgba(14,116,144,0.45)] ${
                  crouchPressed
                    ? 'bg-[#1ea5c4] border-white scale-95'
                    : 'bg-gradient-to-r from-[#0e7490] to-[#178ea9] border-cyan-300/50'
                }`}
              >
                OLLIE
              </button>
            </div>
          </div>
        </div>
      ) : (
        !hud.paused &&
        !hud.runFinished && (
          <div className="flex justify-center">
            <div className="px-3.5 py-1.5 rounded-xl bg-[#0e1722]/78 border border-white/12 text-[11px] text-slate-200/90 tracking-wide text-center">
              <span className="text-[#38bdf8] font-bold">WASD</span> {isPt ? 'Mover' : 'Move'} ·{' '}
              <span className="text-[#38bdf8] font-bold">Shift</span> {isPt ? 'Impulso' : 'Push'} ·{' '}
              <span className="text-[#38bdf8] font-bold">Ctrl</span> {isPt ? 'Frear' : 'Brake'} ·{' '}
              <span className="text-[#38bdf8] font-bold">Space</span> Ollie ·{' '}
              <span className="text-[#38bdf8] font-bold">E</span> Nollie ·{' '}
              <span className="text-[#38bdf8] font-bold">J/K/L/U/I/O/Y/H</span>{' '}
              {isPt ? 'Manobras' : 'Flips'} ·{' '}
              <span className="text-[#38bdf8] font-bold">Q/Z</span> 180°/360° ·{' '}
              <span className="text-[#38bdf8] font-bold">G</span> Grab ·{' '}
              <span className="text-[#38bdf8] font-bold">C</span> {isPt ? 'Câmera' : 'Cam'} ·{' '}
              <span className="text-[#38bdf8] font-bold">R</span> Reset
            </div>
          </div>
        )
      )}

      {/* PAUSE MODAL */}
      {hud.paused && !hud.runFinished && (
        <div className="fixed inset-0 z-30 pointer-events-auto bg-[#070d14]/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto flow-scroll rounded-2xl bg-[#0e1722] border border-white/15 p-5 sm:p-6 shadow-[0_24px_60px_rgba(0,0,0,0.65)]">
            <p className="text-[11px] font-bold tracking-[0.26em] text-[#38bdf8]">FLOW SKATE</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[0.16em] text-white">
              {isPt ? 'PAUSADO' : 'PAUSED'}
            </h2>
            <p className="mt-1 text-xs text-slate-300">{hud.eventTitle}</p>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick(true);
                  onTogglePause();
                }}
                className="h-11 rounded-xl bg-gradient-to-r from-[#0e7490] to-[#178ea9] border border-cyan-300/35 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.18em] text-white cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isPt ? 'CONTINUAR' : 'RESUME'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick(false);
                  onToggleCamera();
                }}
                className="h-11 rounded-xl bg-[#131f2d] hover:bg-[#1a293b] border border-white/12 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.14em] text-white cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#38bdf8]" />
                <span>
                  {cameraMode === 'first_person'
                    ? isPt
                      ? 'CÂMERA: 1ª PESSOA'
                      : 'CAMERA: 1ST PERSON'
                    : isPt
                      ? 'CÂMERA: 3ª PESSOA'
                      : 'CAMERA: 3RD PERSON'}
                </span>
              </button>

              {hud.hasReplay && onOpenReplay && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick(true);
                    onOpenReplay();
                  }}
                  className="h-11 rounded-xl bg-[#12384b] hover:bg-[#164860] border border-cyan-400/45 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.14em] text-cyan-100 cursor-pointer"
                >
                  <Clapperboard className="w-4 h-4 text-[#38bdf8]" />
                  <span>{isPt ? 'VER REPLAY' : 'WATCH REPLAY'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick(false);
                  onRestartSession();
                }}
                className="h-11 rounded-xl bg-[#131f2d] hover:bg-[#1a293b] border border-white/12 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.14em] text-white cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[#38bdf8]" />
                <span>{isPt ? 'REINICIAR RUN' : 'RESTART RUN'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playBack();
                  onExitToMenu();
                }}
                className="h-11 rounded-xl bg-[#131f2d] hover:bg-[#231922] border border-white/12 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.14em] text-slate-200 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>{isPt ? 'SAIR PARA O MENU' : 'EXIT TO MENU'}</span>
              </button>
            </div>

            {hud.activeParkNpcs && hud.activeParkNpcs.length > 0 && (
              <div className="mt-4 pt-3.5 border-t border-white/10">
                <div className="text-[10px] font-bold tracking-[0.2em] text-slate-400 mb-2">
                  {isPt ? 'SKATISTAS NA PISTA AGORA' : 'SKATERS IN PARK NOW'}
                </div>
                <div className="flex flex-col gap-1.5">
                  {hud.activeParkNpcs.map((npc) => (
                    <div
                      key={npc.skaterId}
                      className="px-2.5 py-2 rounded-lg bg-[#131f2d]/85 border border-white/10 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CountryFlag code={npc.nationalityCode} className="w-4 h-3 rounded-[2px]" />
                        <span className="text-[10px] font-bold text-[#38bdf8] tabular-nums shrink-0">
                          {npc.competitorNumber}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">{npc.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {npc.lastTrickName ?? (isPt ? 'Aquecendo' : 'Cruising')} ·{' '}
                            {npc.tricksLanded} {isPt ? 'manobras' : 'tricks'}
                          </div>
                        </div>
                      </div>
                      <span className="font-extrabold text-white tabular-nums shrink-0 ml-2">
                        {npc.liveScore.toLocaleString()} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPETITION RESULTS MODAL */}
      {hud.runFinished && hud.competitionScores && (
        <div className="fixed inset-0 z-30 pointer-events-auto bg-[#070d14]/75 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-[#0e1722] border border-white/15 p-5 sm:p-6 shadow-[0_24px_64px_rgba(0,0,0,0.7)] max-h-[92vh] overflow-y-auto flow-scroll">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold tracking-[0.22em] text-[#38bdf8]">
                  <Trophy className="w-4 h-4" />
                  <span>{hud.eventTitle}</span>
                </div>
                <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-[0.12em] text-white">
                  {isPt ? 'RESULTADO FINAL' : 'OFFICIAL RESULTS'}
                </h2>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold tracking-[0.2em] text-slate-400">
                  {isPt ? 'NOTA GERAL' : 'OVERALL'}
                </div>
                <div className="text-3xl font-extrabold text-[#38bdf8] tabular-nums">
                  {hud.competitionScores.overall.toFixed(1)}
                </div>
              </div>
            </div>

            {/* 5 Judge Breakdown */}
            <div className="mt-4 grid grid-cols-5 gap-2">
              {[
                { label: isPt ? 'Dificul.' : 'Diff.', val: hud.competitionScores.difficulty },
                { label: isPt ? 'Execução' : 'Exec.', val: hud.competitionScores.execution },
                { label: isPt ? 'Varied.' : 'Variety', val: hud.competitionScores.variety },
                { label: isPt ? 'Amplit.' : 'Amp.', val: hud.competitionScores.amplitude },
                { label: isPt ? 'Fluidez' : 'Flow', val: hud.competitionScores.flow },
              ].map((crit) => (
                <div
                  key={crit.label}
                  className="p-2.5 rounded-xl bg-[#131f2d] border border-white/10 text-center"
                >
                  <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase truncate">
                    {crit.label}
                  </div>
                  <div className="mt-1 text-base sm:text-lg font-extrabold text-white tabular-nums">
                    {crit.val.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>

            {/* Leaderboard */}
            <div className="mt-4">
              <div className="text-[11px] font-bold tracking-[0.2em] text-slate-300 mb-2">
                {isPt ? 'CLASSIFICAÇÃO' : 'STANDINGS'}
              </div>
              <div className="flex flex-col gap-1.5">
                {hud.leaderboard.map((entry, idx) => (
                  <div
                    key={entry.skaterId ?? entry.name}
                    className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      entry.isPlayer
                        ? 'bg-[#12384b] border-[#38bdf8]/70 text-white font-bold'
                        : 'bg-[#131f2d]/85 border-white/10 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 text-center font-extrabold text-[#38bdf8] tabular-nums shrink-0">
                        #{idx + 1}
                      </span>
                      {entry.nationalityCode && (
                        <CountryFlag code={entry.nationalityCode} className="w-4 h-3 rounded-[2px]" />
                      )}
                      {entry.competitorNumber && (
                        <span className="text-[10px] font-bold text-[#38bdf8]/90 tabular-nums hidden sm:inline">
                          {entry.competitorNumber}
                        </span>
                      )}
                      <span className="truncate">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-4 tabular-nums shrink-0">
                      <span className="text-slate-300">{entry.score.toLocaleString()} pts</span>
                      <span className="font-extrabold text-white w-11 text-right">
                        {entry.overallRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Replay Button on Official Results */}
            {hud.hasReplay && onOpenReplay && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick(true);
                  onOpenReplay();
                }}
                className="mt-4 w-full h-11 rounded-xl bg-[#12384b] hover:bg-[#164860] border border-cyan-400/50 flex items-center justify-center gap-2 text-xs font-extrabold tracking-[0.18em] text-cyan-100 cursor-pointer"
              >
                <Clapperboard className="w-4 h-4 text-[#38bdf8]" />
                <span>{isPt ? 'VER REPLAY DA RUN' : 'WATCH RUN REPLAY'}</span>
              </button>
            )}

            {/* Actions */}
            {isCareerSession && hud.summary && onReturnToCareerWithResult ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick(false);
                    onRestartSession();
                  }}
                  className="h-11 rounded-xl bg-[#131f2d] hover:bg-[#1a293b] border border-white/12 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.16em] text-white cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isPt ? 'TENTAR DE NOVO' : 'RETRY RUN'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick(true);
                    onReturnToCareerWithResult(hud.summary!);
                  }}
                  className="h-11 rounded-xl bg-gradient-to-r from-[#0e7490] to-[#178ea9] hover:from-[#1289a8] hover:to-[#1ea5c4] border border-cyan-300/35 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.16em] text-white cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isPt ? 'SALVAR NA CARREIRA' : 'SAVE TO CAREER'}</span>
                </button>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick(false);
                    onExitToMenu();
                  }}
                  className="h-11 rounded-xl bg-[#131f2d] hover:bg-[#1a293b] border border-white/12 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.16em] text-white cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>{isPt ? 'MENU' : 'MENU'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick(true);
                    onRestartSession();
                  }}
                  className="h-11 rounded-xl bg-gradient-to-r from-[#0e7490] to-[#178ea9] hover:from-[#1289a8] hover:to-[#1ea5c4] border border-cyan-300/35 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.16em] text-white cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isPt ? 'NOVA RUN' : 'RUN AGAIN'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
