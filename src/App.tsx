/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { SkateparkCanvas } from './three/SkateparkCanvas';
import { TitleScreenHUD } from './components/TitleScreenHUD';
import { SubScreens } from './components/SubScreens';
import { GameplayHUD } from './components/GameplayHUD';
import { CharacterCreatorScreen } from './components/CharacterCreatorScreen';
import { CareerHubScreen } from './components/CareerHubScreen';
import { soundEngine } from './audio/soundEngine';
import {
  advanceSeasonPhase,
  answerPressInterview,
  attendLaunchEvent,
  clearCareerSave,
  createNewCareerSave,
  interactWithSkater,
  loadCareerSave,
  saveCareerState,
  signSponsorContract,
  trainAttributeQuick,
  travelToCity,
  resolveCareerGameplayResult,
} from './data/careerSystem';
import { CareerSaveState, PlayerCareerIdentity } from './types/career';
import {
  CameraMode,
  DEFAULT_GARAGE_CONFIG,
  DEFAULT_PLAYER_APPEARANCE,
  DEFAULT_SETTINGS_CONFIG,
  GameplayHudState,
  GameplayMode,
  GameplayRunSummary,
  GameplaySessionConfig,
  GarageConfig,
  PLAY_MODES,
  PlayModeId,
  PlayModeInfo,
  ReplayCameraMode,
  ReplayHudState,
  ReplaySpeedOption,
  ScreenId,
  SettingsConfig,
  SkaterAppearance,
  VirtualInputState,
} from './types/game';

const INITIAL_HUD_STATE: GameplayHudState = {
  mode: 'free_skate',
  ruleMode: 'standard',
  eventTitle: 'FREE SKATE',
  score: 0,
  bestComboScore: 0,
  bestComboLabel: '—',
  maxAirHeightMeters: 0,
  landedTricksCount: 0,
  speedKmh: 0,
  cameraMode: 'third_person',
  airborne: false,
  grinding: false,
  crashed: false,
  grindBalance: 0,
  activeTrickName: null,
  comboTricks: [],
  comboBasePoints: 0,
  comboMultiplier: 1,
  landingOutcome: null,
  landingMessage: null,
  timeRemaining: 0,
  runFinished: false,
  paused: false,
  competitionScores: null,
  leaderboard: [],
};

const INITIAL_REPLAY_STATE: ReplayHudState = {
  active: false,
  playing: true,
  currentTime: 0,
  duration: 0,
  speed: 1,
  cameraMode: 'cine',
  hasFrames: false,
  activeTrickName: null,
  comboTricks: [],
  comboBasePoints: 0,
  comboMultiplier: 1,
  landingOutcome: null,
  landingMessage: null,
  score: 0,
  speedKmh: 0,
};

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('home');
  const [selectedMode, setSelectedMode] = useState<PlayModeId>('free_skate');
  const [selectedModeFocus, setSelectedModeFocus] = useState<PlayModeInfo['zoneFocus']>(
    PLAY_MODES[0].zoneFocus,
  );
  const [careerSave, setCareerSave] = useState<CareerSaveState>(() => loadCareerSave());
  const [garageConfig, setGarageConfig] = useState<GarageConfig>(() =>
    careerSave.created ? careerSave.appearance.outfit : DEFAULT_GARAGE_CONFIG,
  );
  const [draftAppearance, setDraftAppearance] = useState<SkaterAppearance>(() =>
    careerSave.created ? careerSave.appearance : DEFAULT_PLAYER_APPEARANCE,
  );
  const [showcaseZoom, setShowcaseZoom] = useState<number>(1);
  const [showcaseFocus, setShowcaseFocus] = useState<'full' | 'head' | 'board'>('full');

  const [settings, setSettings] = useState<SettingsConfig>(DEFAULT_SETTINGS_CONFIG);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Gameplay session state
  const [gameplayMode, setGameplayMode] = useState<GameplayMode>('free_skate');
  const [gameplayEventTitle, setGameplayEventTitle] = useState<string>('FREE SKATE');
  const [activeSessionConfig, setActiveSessionConfig] = useState<GameplaySessionConfig | undefined>(
    undefined,
  );
  const [cameraMode, setCameraMode] = useState<CameraMode>('third_person');
  const [paused, setPaused] = useState<boolean>(false);
  const [sessionNonce, setSessionNonce] = useState<number>(0);
  const [resetPosNonce, setResetPosNonce] = useState<number>(0);
  const [finishSessionNonce, setFinishSessionNonce] = useState<number>(0);
  const [hudState, setHudState] = useState<GameplayHudState>(INITIAL_HUD_STATE);

  // Replay studio state
  const [replayActive, setReplayActive] = useState<boolean>(false);
  const [replayPlaying, setReplayPlaying] = useState<boolean>(true);
  const [replaySpeed, setReplaySpeed] = useState<ReplaySpeedOption>(1);
  const [replayCameraMode, setReplayCameraMode] = useState<ReplayCameraMode>('cine');
  const [replaySeekNonce, setReplaySeekNonce] = useState<number>(0);
  const [replaySeekTime, setReplaySeekTime] = useState<number>(0);
  const [replayJumpHighlightNonce, setReplayJumpHighlightNonce] = useState<number>(0);
  const [replayHudState, setReplayHudState] = useState<ReplayHudState>(INITIAL_REPLAY_STATE);
  const replayActiveRef = useRef<boolean>(false);
  const wasPausedBeforeReplayRef = useRef<boolean>(false);

  const virtualInputRef = useRef<VirtualInputState>({
    moveX: 0,
    moveY: 0,
    sprint: false,
    crouching: false,
    ollieTrigger: 0,
    nollieTrigger: 0,
    trickTrigger: null,
    grabHeld: null,
    spinDir: 0,
  });

  // Auto-persist career progress cleanly
  useEffect(() => {
    if (careerSave.created) {
      saveCareerState(careerSave);
    }
  }, [careerSave]);

  const activePlayerAppearance = useMemo<SkaterAppearance>(() => {
    if (activeScreen === 'creator') return draftAppearance;
    if (careerSave.created) {
      return { ...careerSave.appearance, outfit: garageConfig };
    }
    return { ...DEFAULT_PLAYER_APPEARANCE, outfit: garageConfig };
  }, [activeScreen, draftAppearance, careerSave, garageConfig]);

  const handleChangeGarage = useCallback(
    (next: GarageConfig) => {
      setGarageConfig(next);
      if (careerSave.created) {
        setCareerSave((prev) => ({
          ...prev,
          appearance: { ...prev.appearance, outfit: next },
        }));
      }
    },
    [careerSave.created],
  );

  const handleNavigate = useCallback(
    (target: ScreenId) => {
      if (target === 'career' && !careerSave.created) {
        setDraftAppearance(DEFAULT_PLAYER_APPEARANCE);
        setShowcaseZoom(1);
        setShowcaseFocus('full');
        setActiveScreen('creator');
        return;
      }
      if (target === 'creator') {
        setDraftAppearance(careerSave.created ? careerSave.appearance : DEFAULT_PLAYER_APPEARANCE);
        setShowcaseZoom(1);
        setShowcaseFocus('full');
      }
      if (target === 'garage') {
        setShowcaseZoom(1);
        setShowcaseFocus('full');
      }
      setActiveScreen(target);
    },
    [careerSave.created, careerSave.appearance],
  );

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      if (!next) {
        soundEngine.playClick(false);
      }
      return next;
    });
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen may be restricted in certain embedded iframe sandboxes
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleToggleCamera = useCallback(() => {
    setCameraMode((prev) => (prev === 'third_person' ? 'first_person' : 'third_person'));
  }, []);

  const handleTogglePause = useCallback(() => {
    setPaused((prev) => !prev);
  }, []);

  const handleOpenReplay = useCallback(() => {
    if (!hudState.hasReplay) return;
    wasPausedBeforeReplayRef.current = paused && !hudState.runFinished;
    replayActiveRef.current = true;
    setPaused(true);
    setReplayPlaying(true);
    setReplaySpeed(1);
    setReplayCameraMode('cine');
    setReplayActive(true);
    setReplayHudState((prev) => ({
      ...prev,
      active: true,
      playing: true,
      speed: 1,
      cameraMode: 'cine',
    }));
  }, [hudState.hasReplay, hudState.runFinished, paused]);

  const handleCloseReplay = useCallback(() => {
    replayActiveRef.current = false;
    setReplayActive(false);
    setReplayHudState((prev) => ({ ...prev, active: false, playing: false }));
    setPaused(hudState.runFinished ? false : wasPausedBeforeReplayRef.current);
  }, [hudState.runFinished]);

  const handleReplayHudUpdate = useCallback((next: ReplayHudState) => {
    if (!replayActiveRef.current) {
      setReplayHudState((prev) => (prev.active ? { ...prev, active: false, playing: false } : prev));
      return;
    }
    setReplayHudState(next);
  }, []);

  const handleToggleReplayPlay = useCallback(() => {
    setReplayPlaying((prev) => !prev);
  }, []);

  const handleSeekReplay = useCallback((time: number) => {
    setReplaySeekTime(time);
    setReplaySeekNonce((n) => n + 1);
  }, []);

  const handleJumpReplayHighlight = useCallback(() => {
    setReplayPlaying(true);
    setReplayJumpHighlightNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeScreen === 'gameplay') {
          soundEngine.playBack();
          if (replayActive) {
            handleCloseReplay();
          } else {
            setPaused((p) => !p);
          }
        } else if (activeScreen === 'creator' && careerSave.created) {
          soundEngine.playBack();
          setActiveScreen('career');
        } else if (activeScreen !== 'home') {
          soundEngine.playBack();
          setActiveScreen('home');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeScreen, careerSave.created, replayActive, handleCloseReplay]);

  const handleChangeSettings = useCallback((next: SettingsConfig) => {
    setSettings(next);
    soundEngine.updateSettings(next.masterVolume, next.sfxVolume, next.ambienceEnabled);
  }, []);

  const handleSelectMode = useCallback((mode: PlayModeInfo) => {
    setSelectedMode(mode.id);
    setSelectedModeFocus(mode.zoneFocus);
  }, []);

  const handleLaunchGameplay = useCallback((mode: GameplayMode, eventTitle: string) => {
    setActiveSessionConfig({
      mode,
      eventTitle,
      source: 'quick_play',
      ruleMode: 'standard',
      atmosphere: 'day',
    });
    setGameplayMode(mode);
    setGameplayEventTitle(eventTitle);
    setPaused(false);
    replayActiveRef.current = false;
    setReplayActive(false);
    setReplayHudState(INITIAL_REPLAY_STATE);
    setSessionNonce((n) => n + 1);
    setActiveScreen('gameplay');
  }, []);

  const handleLaunchCareerGameplay = useCallback((cfg: GameplaySessionConfig) => {
    setActiveSessionConfig(cfg);
    setGameplayMode(cfg.mode);
    setGameplayEventTitle(cfg.eventTitle);
    setPaused(false);
    replayActiveRef.current = false;
    setReplayActive(false);
    setReplayHudState(INITIAL_REPLAY_STATE);
    setSessionNonce((n) => n + 1);
    setActiveScreen('gameplay');
  }, []);

  const handleFinishTrainingOrShoot = useCallback(() => {
    setFinishSessionNonce((n) => n + 1);
  }, []);

  const handleReturnToCareerWithResult = useCallback(
    (summary: GameplayRunSummary) => {
      if (careerSave.created && activeSessionConfig?.source === 'career') {
        setCareerSave((prev) =>
          resolveCareerGameplayResult(prev, summary, {
            careerEventId: activeSessionConfig.careerEventId,
            careerActivityId: activeSessionConfig.careerActivityId,
            trainingTargetAttr: activeSessionConfig.trainingTargetAttr,
            rivalSkaterIds: activeSessionConfig.rivalSkaterIds,
          }),
        );
      }
      setPaused(false);
      replayActiveRef.current = false;
      setReplayActive(false);
      setReplayHudState(INITIAL_REPLAY_STATE);
      setCameraMode('third_person');
      setActiveSessionConfig(undefined);
      setActiveScreen('career');
    },
    [careerSave.created, activeSessionConfig],
  );

  const handleConfirmCreator = useCallback(
    (
      identityInput: Omit<
        PlayerCareerIdentity,
        'competitorNumber' | 'jerseyNumber' | 'currentAge' | 'reputationTier'
      >,
      appearance: SkaterAppearance,
    ) => {
      if (careerSave.created) {
        setCareerSave((prev) => ({
          ...prev,
          identity: {
            ...prev.identity,
            firstName: identityInput.firstName,
            lastName: identityInput.lastName,
            nickname: identityInput.nickname,
            nationalityCode: identityInput.nationalityCode,
          },
          appearance,
        }));
      } else {
        const fresh = createNewCareerSave(identityInput, appearance);
        setCareerSave(fresh);
      }
      setGarageConfig(appearance.outfit);
      setShowcaseFocus('full');
      setShowcaseZoom(1);
      setActiveScreen('career');
    },
    [careerSave.created],
  );

  const handleResetCareer = useCallback(() => {
    const empty = clearCareerSave();
    setCareerSave(empty);
    setGarageConfig(DEFAULT_GARAGE_CONFIG);
    setDraftAppearance(DEFAULT_PLAYER_APPEARANCE);
    setActiveScreen('creator');
  }, []);

  const handleRestartSession = useCallback(() => {
    setPaused(false);
    replayActiveRef.current = false;
    setReplayActive(false);
    setReplayHudState(INITIAL_REPLAY_STATE);
    setSessionNonce((n) => n + 1);
  }, []);

  const handleResetPosition = useCallback(() => {
    setPaused(false);
    replayActiveRef.current = false;
    setReplayActive(false);
    setResetPosNonce((n) => n + 1);
  }, []);

  const handleExitToMenu = useCallback(() => {
    const returnToCareer = activeSessionConfig?.source === 'career' && careerSave.created;
    setPaused(false);
    replayActiveRef.current = false;
    setReplayActive(false);
    setReplayHudState(INITIAL_REPLAY_STATE);
    setCameraMode('third_person');
    setActiveSessionConfig(undefined);
    setActiveScreen(returnToCareer ? 'career' : 'home');
  }, [activeSessionConfig?.source, careerSave.created]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0b131d]">
      {/* Isolated Full-Viewport 3D Skatepark & Hero Skater Scene */}
      <SkateparkCanvas
        activeScreen={activeScreen}
        selectedModeFocus={selectedModeFocus}
        garageConfig={garageConfig}
        playerAppearance={activePlayerAppearance}
        careerRoster={careerSave.created ? careerSave.roster : undefined}
        sessionConfig={activeSessionConfig}
        showcaseZoom={showcaseZoom}
        showcaseFocus={showcaseFocus}
        shadowsEnabled={settings.shadowsEnabled}
        cameraSwayEnabled={settings.cameraSwayEnabled}
        gameplayMode={gameplayMode}
        gameplayEventTitle={gameplayEventTitle}
        cameraMode={cameraMode}
        paused={paused}
        sessionNonce={sessionNonce}
        resetPosNonce={resetPosNonce}
        finishSessionNonce={finishSessionNonce}
        replayActive={replayActive}
        replayPlaying={replayPlaying}
        replaySpeed={replaySpeed}
        replayCameraMode={replayCameraMode}
        replaySeekNonce={replaySeekNonce}
        replaySeekTime={replaySeekTime}
        replayJumpHighlightNonce={replayJumpHighlightNonce}
        virtualInputRef={virtualInputRef}
        onHudUpdate={setHudState}
        onReplayHudUpdate={handleReplayHudUpdate}
        onReplayPlayPauseToggle={handleToggleReplayPlay}
        onToggleCamera={handleToggleCamera}
        onTogglePause={handleTogglePause}
      />

      {/* Home Screen Overlay (FLOW STUDIOS / FLOW / SKATE + 2x2 Action Grid + Top-Right Controls) */}
      <TitleScreenHUD
        visible={activeScreen === 'home'}
        hideTopControls={activeScreen === 'gameplay' || activeScreen === 'career'}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        onToggleMute={handleToggleMute}
        onToggleFullscreen={handleToggleFullscreen}
        onNavigate={handleNavigate}
      />

      {/* Character & Board Creator */}
      <AnimatePresence mode="wait">
        {activeScreen === 'creator' && (
          <CharacterCreatorScreen
            language={settings.language}
            isEditing={careerSave.created}
            initialIdentity={careerSave.created ? careerSave.identity : undefined}
            initialAppearance={careerSave.created ? careerSave.appearance : undefined}
            unlockedItems={careerSave.unlockedItems}
            liveAppearance={draftAppearance}
            onUpdateLiveAppearance={setDraftAppearance}
            showcaseZoom={showcaseZoom}
            onChangeShowcaseZoom={setShowcaseZoom}
            showcaseFocus={showcaseFocus}
            onChangeShowcaseFocus={setShowcaseFocus}
            onConfirm={handleConfirmCreator}
            onBack={() => setActiveScreen(careerSave.created ? 'career' : 'home')}
          />
        )}

        {/* Expanded Career Hub */}
        {activeScreen === 'career' && careerSave.created && (
          <CareerHubScreen
            careerSave={careerSave}
            language={settings.language}
            onUpdateCareer={setCareerSave}
            onQuickTrainAttr={(attr) => setCareerSave((prev) => trainAttributeQuick(prev, attr, 2))}
            onSignSponsor={(id) => setCareerSave((prev) => signSponsorContract(prev, id))}
            onTravelCity={(cityId) => setCareerSave((prev) => travelToCity(prev, cityId))}
            onAttendLaunch={() => setCareerSave((prev) => attendLaunchEvent(prev))}
            onInteractSkater={(id, action) =>
              setCareerSave((prev) => interactWithSkater(prev, id, action))
            }
            onAnswerInterview={(optId) =>
              setCareerSave((prev) => answerPressInterview(prev, optId))
            }
            onAdvancePhase={() => setCareerSave((prev) => advanceSeasonPhase(prev))}
            onLaunchCareerGameplay={handleLaunchCareerGameplay}
            onOpenEditor={() => handleNavigate('creator')}
            onResetCareer={handleResetCareer}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {/* Play / Garage / Settings Sub-Screens */}
        {(activeScreen === 'play' || activeScreen === 'garage' || activeScreen === 'settings') && (
          <SubScreens
            activeScreen={activeScreen}
            selectedMode={selectedMode}
            onSelectMode={handleSelectMode}
            garageConfig={garageConfig}
            onChangeGarage={handleChangeGarage}
            unlockedItems={careerSave.created ? careerSave.unlockedItems : undefined}
            showcaseZoom={showcaseZoom}
            onChangeShowcaseZoom={setShowcaseZoom}
            onOpenCreator={() => handleNavigate('creator')}
            settings={settings}
            onChangeSettings={handleChangeSettings}
            onLaunchGameplay={handleLaunchGameplay}
            onBack={() => setActiveScreen('home')}
          />
        )}
      </AnimatePresence>

      {/* Active Gameplay HUD & Mobile Touch Controls */}
      {activeScreen === 'gameplay' && (
        <GameplayHUD
          hud={hudState}
          cameraMode={cameraMode}
          language={settings.language}
          isMuted={isMuted}
          isCareerSession={activeSessionConfig?.source === 'career'}
          replayActive={replayActive}
          replayState={replayHudState}
          virtualInputRef={virtualInputRef}
          onToggleCamera={handleToggleCamera}
          onTogglePause={handleTogglePause}
          onToggleMute={handleToggleMute}
          onResetPosition={handleResetPosition}
          onRestartSession={handleRestartSession}
          onFinishTrainingOrShoot={handleFinishTrainingOrShoot}
          onReturnToCareerWithResult={handleReturnToCareerWithResult}
          onExitToMenu={handleExitToMenu}
          onOpenReplay={handleOpenReplay}
          onCloseReplay={handleCloseReplay}
          onToggleReplayPlay={handleToggleReplayPlay}
          onChangeReplaySpeed={setReplaySpeed}
          onChangeReplayCamera={setReplayCameraMode}
          onSeekReplay={handleSeekReplay}
          onJumpReplayHighlight={handleJumpReplayHighlight}
        />
      )}
    </main>
  );
}
