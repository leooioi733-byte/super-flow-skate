import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  CameraMode,
  GarageConfig,
  GameplayHudState,
  GameplayMode,
  GameplaySessionConfig,
  PlayModeInfo,
  ReplayCameraMode,
  ReplayHudState,
  ReplaySpeedOption,
  ScreenId,
  SkaterAppearance,
  SkaterProfile,
  TrickId,
  VirtualInputState,
} from '../types/game';
import { buildSkateparkScene } from './skateparkBuilder';
import { buildHeroSkaterAndBoard } from './skaterBuilder';
import { createProceduralTextureSet } from './textures';
import { SkateInputFrame, SkateSimulation, SkaterAnimState } from './skatePhysics';
import { sampleSkateparkSurface, SurfaceSample } from './parkCollision';
import { soundEngine } from '../audio/soundEngine';
import { NpcParkManager } from './npcSkaterAI';
import { ReplayBuffer, ReplaySampledMeta } from './replaySystem';

interface SkateparkCanvasProps {
  activeScreen: ScreenId;
  selectedModeFocus: PlayModeInfo['zoneFocus'];
  garageConfig: GarageConfig;
  playerAppearance?: SkaterAppearance;
  careerRoster?: SkaterProfile[];
  sessionConfig?: GameplaySessionConfig;
  showcaseZoom?: number;
  showcaseFocus?: 'full' | 'head' | 'board';
  shadowsEnabled: boolean;
  cameraSwayEnabled: boolean;
  gameplayMode: GameplayMode;
  gameplayEventTitle: string;
  cameraMode: CameraMode;
  paused: boolean;
  sessionNonce: number;
  resetPosNonce: number;
  finishSessionNonce?: number;
  replayActive?: boolean;
  replayPlaying?: boolean;
  replaySpeed?: ReplaySpeedOption;
  replayCameraMode?: ReplayCameraMode;
  replaySeekNonce?: number;
  replaySeekTime?: number;
  replayJumpHighlightNonce?: number;
  virtualInputRef: React.MutableRefObject<VirtualInputState>;
  onHudUpdate: (hud: GameplayHudState) => void;
  onReplayHudUpdate?: (replay: ReplayHudState) => void;
  onReplayPlayPauseToggle?: () => void;
  onToggleCamera: () => void;
  onTogglePause: () => void;
}

// Pre-allocated math helpers (zero GC inside render loop)
const _camPosTarget = new THREE.Vector3();
const _lookAtCurrent = new THREE.Vector3(0.42, 1.02, 0.2);
const _lookAtTarget = new THREE.Vector3();
const _headWorldPos = new THREE.Vector3();
const _fpForward = new THREE.Vector3();
const _fpUp = new THREE.Vector3();
const _fpRight = new THREE.Vector3();
const _identityQuat = new THREE.Quaternion();
const _replayPos = new THREE.Vector3();
const _replayQuat = new THREE.Quaternion();
const _replayAnim: SkaterAnimState = {
  groundState: 'grounded',
  speed: 0,
  steerLean: 0,
  pushPhase: 0,
  pushIntensity: 0,
  braking: 0,
  powerslideAngle: 0,
  crouchAmount: 0,
  pumpG: 0,
  activeTrick: null,
  trickProgress: 0,
  activeGrab: null,
  activeGrind: null,
  grindBalance: 0,
  landingOutcome: null,
  landingTimer: 0,
  crashTimer: 0,
  crashNonce: 0,
  crashVelX: 0,
  crashVelZ: 0,
  getUpProgress: 0,
  boardFlipRoll: 0,
  boardShuvYaw: 0,
  boardPopPitch: 0,
  boardHardflipTilt: 0,
  wheelSpinAngle: 0,
};
const _replayMeta: ReplaySampledMeta = {
  heading: Math.PI,
  trickFxBlend: 0,
  score: 0,
  speedKmh: 0,
  activeTrickName: null,
  comboTricks: [],
  comboBasePoints: 0,
  comboMultiplier: 1,
  landingOutcome: null,
  landingMessage: null,
};

const _camSurfaceProbe: SurfaceSample = {
  height: 0,
  normal: new THREE.Vector3(0, 1, 0),
  isTransition: false,
  blockedByWall: false,
  wallNormalX: 0,
  wallNormalZ: 0,
};

export const SkateparkCanvas: React.FC<SkateparkCanvasProps> = ({
  activeScreen,
  selectedModeFocus,
  garageConfig,
  playerAppearance,
  careerRoster,
  sessionConfig,
  showcaseZoom = 1,
  showcaseFocus = 'full',
  shadowsEnabled,
  cameraSwayEnabled,
  gameplayMode,
  gameplayEventTitle,
  cameraMode,
  paused,
  sessionNonce,
  resetPosNonce,
  finishSessionNonce = 0,
  replayActive = false,
  replayPlaying = true,
  replaySpeed = 1,
  replayCameraMode = 'cine',
  replaySeekNonce = 0,
  replaySeekTime = 0,
  replayJumpHighlightNonce = 0,
  virtualInputRef,
  onHudUpdate,
  onReplayHudUpdate,
  onReplayPlayPauseToggle,
  onToggleCamera,
  onTogglePause,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  // Mutable refs so React state updates never recreate WebGLRenderer or scene
  const screenRef = useRef<ScreenId>(activeScreen);
  const modeFocusRef = useRef<PlayModeInfo['zoneFocus']>(selectedModeFocus);
  const shadowsRef = useRef<boolean>(shadowsEnabled);
  const swayRef = useRef<boolean>(cameraSwayEnabled);
  const garageConfigRef = useRef<GarageConfig>(garageConfig);
  const appearanceRef = useRef<SkaterAppearance | undefined>(playerAppearance);
  const careerRosterRef = useRef<SkaterProfile[] | undefined>(careerRoster);
  const sessionConfigRef = useRef<GameplaySessionConfig | undefined>(sessionConfig);
  const showcaseZoomRef = useRef<number>(showcaseZoom);
  const showcaseFocusRef = useRef<'full' | 'head' | 'board'>(showcaseFocus);
  const wheelZoomOffsetRef = useRef<number>(0);

  const gameplayModeRef = useRef<GameplayMode>(gameplayMode);
  const gameplayTitleRef = useRef<string>(gameplayEventTitle);
  const cameraModeRef = useRef<CameraMode>(cameraMode);
  const pausedRef = useRef<boolean>(paused);
  const replayActiveRef = useRef<boolean>(replayActive);
  const replayPlayingRef = useRef<boolean>(replayPlaying);
  const replaySpeedRef = useRef<ReplaySpeedOption>(replaySpeed);
  const replayCameraModeRef = useRef<ReplayCameraMode>(replayCameraMode);
  const replayBufferRef = useRef<ReplayBuffer>(new ReplayBuffer());
  const replayTimeRef = useRef<number>(0);
  const replayScrubDirtyRef = useRef<boolean>(false);

  const onHudUpdateRef = useRef(onHudUpdate);
  const onReplayHudUpdateRef = useRef(onReplayHudUpdate);
  const onReplayPlayPauseToggleRef = useRef(onReplayPlayPauseToggle);
  const onToggleCameraRef = useRef(onToggleCamera);
  const onTogglePauseRef = useRef(onTogglePause);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const texturesRef = useRef<ReturnType<typeof createProceduralTextureSet> | null>(null);
  const skaterHandleRef = useRef<ReturnType<typeof buildHeroSkaterAndBoard> | null>(null);
  const npcManagerRef = useRef<NpcParkManager | null>(null);
  const simRef = useRef<SkateSimulation | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const crossLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const floodLightsRef = useRef<THREE.PointLight[]>([]);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const isSoftwareGlRef = useRef<boolean>(false);

  // Interactive Garage turntable rotation + pointer parallax + 3rd-person orbit
  const pointerParallaxRef = useRef({ x: 0, y: 0 });
  const dragStateRef = useRef<{
    active: boolean;
    pointerId: number | null;
    lastX: number;
    lastY: number;
    yawOffset: number;
    targetYaw: number;
  }>({ active: false, pointerId: null, lastX: 0, lastY: 0, yawOffset: 0, targetYaw: 0 });
  const gpCameraRef = useRef({
    orbitYaw: 0,
    orbitPitch: 0.24,
    zoomDist: 4.9,
    smoothedCamYaw: Math.PI,
    fpLookYaw: 0,
    fpLookPitch: 0,
    currentFov: 40,
  });

  // Keyboard & edge-triggered trick queue refs
  const heldKeysRef = useRef<Set<string>>(new Set());
  const mouseGrabHeldRef = useRef<boolean>(false);
  const edgeQueueRef = useRef<{
    ollie: boolean;
    nollie: boolean;
    trick: TrickId | null;
    lastVirtOllie: number;
    lastVirtNollie: number;
    lastVirtTrickSeq: number;
  }>({
    ollie: false,
    nollie: false,
    trick: null,
    lastVirtOllie: 0,
    lastVirtNollie: 0,
    lastVirtTrickSeq: 0,
  });

  onHudUpdateRef.current = onHudUpdate;
  onReplayHudUpdateRef.current = onReplayHudUpdate;
  onReplayPlayPauseToggleRef.current = onReplayPlayPauseToggle;
  onToggleCameraRef.current = onToggleCamera;
  onTogglePauseRef.current = onTogglePause;

  useEffect(() => {
    const prev = screenRef.current;
    screenRef.current = activeScreen;
    if (activeScreen !== 'garage' && activeScreen !== 'creator') {
      dragStateRef.current.targetYaw = 0;
      wheelZoomOffsetRef.current = 0;
    }
    dragStateRef.current.active = false;
    dragStateRef.current.pointerId = null;
    if (activeScreen === 'gameplay' && prev !== 'gameplay' && simRef.current) {
      replayBufferRef.current.reset();
      replayTimeRef.current = 0;
      const sCfg = sessionConfigRef.current;
      simRef.current.resetSession(
        gameplayModeRef.current,
        gameplayTitleRef.current,
        sCfg,
        careerRosterRef.current,
      );
      const priorityIds = [
        ...(sCfg?.rivalSkaterIds ?? []),
        ...(sCfg?.teammateSkaterIds ?? []),
      ];
      npcManagerRef.current?.configureSession(
        gameplayTitleRef.current,
        gameplayModeRef.current === 'competition',
        careerRosterRef.current,
        priorityIds.length > 0 ? priorityIds : undefined,
      );
      gpCameraRef.current.orbitYaw = 0;
      gpCameraRef.current.orbitPitch = 0.24;
      gpCameraRef.current.zoomDist = 4.9;
      gpCameraRef.current.smoothedCamYaw = simRef.current.heading;
      gpCameraRef.current.fpLookYaw = 0;
      gpCameraRef.current.fpLookPitch = 0;
      onHudUpdateRef.current({
        ...simRef.current.getHudState(),
        cameraMode: cameraModeRef.current,
        activeParkNpcs: npcManagerRef.current?.getLiveStatuses() ?? [],
        hasReplay: false,
      });
    } else if (activeScreen !== 'gameplay') {
      heldKeysRef.current.clear();
      mouseGrabHeldRef.current = false;
      soundEngine.silenceGameplayLoops();
    }
  }, [activeScreen]);

  useEffect(() => {
    gameplayModeRef.current = gameplayMode;
    gameplayTitleRef.current = gameplayEventTitle;
    sessionConfigRef.current = sessionConfig;
  }, [gameplayMode, gameplayEventTitle, sessionConfig]);

  useEffect(() => {
    careerRosterRef.current = careerRoster;
  }, [careerRoster]);

  useEffect(() => {
    showcaseZoomRef.current = showcaseZoom;
    showcaseFocusRef.current = showcaseFocus;
  }, [showcaseZoom, showcaseFocus]);

  useEffect(() => {
    if (screenRef.current === 'gameplay' && simRef.current) {
      replayBufferRef.current.reset();
      replayTimeRef.current = 0;
      const sCfg = sessionConfigRef.current;
      simRef.current.resetSession(gameplayMode, gameplayEventTitle, sCfg, careerRosterRef.current);
      const priorityIds = [
        ...(sCfg?.rivalSkaterIds ?? []),
        ...(sCfg?.teammateSkaterIds ?? []),
      ];
      npcManagerRef.current?.configureSession(
        gameplayEventTitle,
        gameplayMode === 'competition',
        careerRosterRef.current,
        priorityIds.length > 0 ? priorityIds : undefined,
      );
      gpCameraRef.current.orbitYaw = 0;
      gpCameraRef.current.orbitPitch = 0.24;
      gpCameraRef.current.smoothedCamYaw = simRef.current.heading;
      gpCameraRef.current.fpLookYaw = 0;
      gpCameraRef.current.fpLookPitch = 0;
      onHudUpdateRef.current({
        ...simRef.current.getHudState(),
        cameraMode: cameraModeRef.current,
        activeParkNpcs: npcManagerRef.current?.getLiveStatuses() ?? [],
        hasReplay: false,
      });
    }
  }, [sessionNonce, gameplayMode, gameplayEventTitle]);

  // Replay control sync effects
  useEffect(() => {
    const wasActive = replayActiveRef.current;
    replayActiveRef.current = replayActive;
    if (replayActive && !wasActive) {
      soundEngine.silenceGameplayLoops();
      heldKeysRef.current.clear();
      mouseGrabHeldRef.current = false;
      dragStateRef.current.active = false;
      dragStateRef.current.pointerId = null;
      replayTimeRef.current = 0;
      replayScrubDirtyRef.current = true;
      gpCameraRef.current.orbitYaw = 0.42;
      gpCameraRef.current.orbitPitch = 0.16;
      gpCameraRef.current.zoomDist = 4.1;
      gpCameraRef.current.fpLookYaw = 0;
      gpCameraRef.current.fpLookPitch = 0;
      if (replayBufferRef.current.hasFrames()) {
        replayBufferRef.current.sampleAtTime(0, _replayPos, _replayQuat, _replayAnim, _replayMeta);
        onReplayHudUpdateRef.current?.({
          active: true,
          playing: replayPlayingRef.current,
          currentTime: 0,
          duration: replayBufferRef.current.getDuration(),
          speed: replaySpeedRef.current,
          cameraMode: replayCameraModeRef.current,
          hasFrames: true,
          activeTrickName: _replayMeta.activeTrickName,
          comboTricks: _replayMeta.comboTricks,
          comboBasePoints: _replayMeta.comboBasePoints,
          comboMultiplier: _replayMeta.comboMultiplier,
          landingOutcome: _replayMeta.landingOutcome,
          landingMessage: _replayMeta.landingMessage,
          score: _replayMeta.score,
          speedKmh: _replayMeta.speedKmh,
        });
      }
    } else if (!replayActive && wasActive) {
      heldKeysRef.current.clear();
      mouseGrabHeldRef.current = false;
      dragStateRef.current.active = false;
      dragStateRef.current.pointerId = null;
      gpCameraRef.current.orbitYaw = 0;
      gpCameraRef.current.orbitPitch = 0.24;
      gpCameraRef.current.zoomDist = 4.9;
      gpCameraRef.current.fpLookYaw = 0;
      gpCameraRef.current.fpLookPitch = 0;
      if (rendererRef.current) {
        rendererRef.current.domElement.style.filter = '';
      }
      if (simRef.current && skaterHandleRef.current) {
        gpCameraRef.current.smoothedCamYaw = simRef.current.heading;
        skaterHandleRef.current.group.position.copy(simRef.current.pos);
        skaterHandleRef.current.group.quaternion.copy(simRef.current.boardQuat);
        skaterHandleRef.current.setFirstPersonView(cameraModeRef.current === 'first_person');
        skaterHandleRef.current.updateGameplay(simRef.current.getAnimState(), 0.35);
      }
      onReplayHudUpdateRef.current?.({
        active: false,
        playing: false,
        currentTime: 0,
        duration: replayBufferRef.current.getDuration(),
        speed: replaySpeedRef.current,
        cameraMode: replayCameraModeRef.current,
        hasFrames: replayBufferRef.current.hasFrames(),
        activeTrickName: null,
        comboTricks: [],
        comboBasePoints: 0,
        comboMultiplier: 1,
        landingOutcome: null,
        landingMessage: null,
        score: 0,
        speedKmh: 0,
      });
      if (simRef.current && screenRef.current === 'gameplay') {
        onHudUpdateRef.current({
          ...simRef.current.getHudState(),
          cameraMode: cameraModeRef.current,
          activeParkNpcs: npcManagerRef.current?.getLiveStatuses() ?? [],
          hasReplay: replayBufferRef.current.hasFrames(),
        });
      }
    }
  }, [replayActive]);

  useEffect(() => {
    replayPlayingRef.current = replayPlaying;
  }, [replayPlaying]);

  useEffect(() => {
    replaySpeedRef.current = replaySpeed;
  }, [replaySpeed]);

  useEffect(() => {
    replayCameraModeRef.current = replayCameraMode;
    if (replayCameraMode === 'free_orbit' || replayCameraMode === 'cine') {
      gpCameraRef.current.orbitPitch = 0.18;
    }
  }, [replayCameraMode]);

  useEffect(() => {
    if (replaySeekNonce > 0) {
      const dur = replayBufferRef.current.getDuration();
      replayTimeRef.current = THREE.MathUtils.clamp(replaySeekTime, 0, Math.max(0.01, dur));
      replayScrubDirtyRef.current = true;
    }
  }, [replaySeekNonce, replaySeekTime]);

  useEffect(() => {
    if (replayJumpHighlightNonce > 0) {
      replayTimeRef.current = replayBufferRef.current.getBestHighlightTime();
      replayScrubDirtyRef.current = true;
    }
  }, [replayJumpHighlightNonce]);

  useEffect(() => {
    if (resetPosNonce > 0 && simRef.current && screenRef.current === 'gameplay') {
      simRef.current.resetSkaterPosition();
      gpCameraRef.current.orbitYaw = 0;
      gpCameraRef.current.smoothedCamYaw = simRef.current.heading;
      onHudUpdateRef.current({
        ...simRef.current.getHudState(),
        cameraMode: cameraModeRef.current,
        activeParkNpcs: npcManagerRef.current?.getLiveStatuses() ?? [],
      });
    }
  }, [resetPosNonce]);

  useEffect(() => {
    if (finishSessionNonce > 0 && simRef.current && screenRef.current === 'gameplay') {
      simRef.current.finalizeTrainingOrShoot();
      onHudUpdateRef.current({
        ...simRef.current.getHudState(),
        cameraMode: cameraModeRef.current,
        activeParkNpcs: npcManagerRef.current?.getLiveStatuses() ?? [],
        hasReplay: replayBufferRef.current.hasFrames(),
      });
    }
  }, [finishSessionNonce]);

  useEffect(() => {
    cameraModeRef.current = cameraMode;
    if (simRef.current && screenRef.current === 'gameplay') {
      onHudUpdateRef.current({
        ...simRef.current.getHudState(),
        cameraMode,
        activeParkNpcs: npcManagerRef.current?.getLiveStatuses() ?? [],
      });
    }
  }, [cameraMode]);

  useEffect(() => {
    pausedRef.current = paused;
    if (simRef.current) {
      simRef.current.paused = paused;
      if (paused) {
        heldKeysRef.current.clear();
        dragStateRef.current.active = false;
        dragStateRef.current.pointerId = null;
        soundEngine.silenceGameplayLoops();
      }
      if (screenRef.current === 'gameplay') {
        onHudUpdateRef.current({
          ...simRef.current.getHudState(),
          cameraMode: cameraModeRef.current,
          activeParkNpcs: npcManagerRef.current?.getLiveStatuses() ?? [],
          hasReplay: replayBufferRef.current.hasFrames(),
        });
      }
    }
  }, [paused]);

  useEffect(() => {
    modeFocusRef.current = selectedModeFocus;
  }, [selectedModeFocus]);

  useEffect(() => {
    swayRef.current = cameraSwayEnabled;
  }, [cameraSwayEnabled]);

  useEffect(() => {
    shadowsRef.current = shadowsEnabled;
    if (rendererRef.current && keyLightRef.current) {
      const enable = !isSoftwareGlRef.current && shadowsEnabled;
      rendererRef.current.shadowMap.enabled = enable;
      keyLightRef.current.castShadow = enable;
    }
  }, [shadowsEnabled]);

  useEffect(() => {
    garageConfigRef.current = garageConfig;
    appearanceRef.current = playerAppearance;
    if (skaterHandleRef.current) {
      skaterHandleRef.current.applyConfig(garageConfig);
    }
  }, [garageConfig, playerAppearance]);

  // Rebuild hero skater geometry cleanly whenever structural model/skin/hair/deck-shape/wheel-size props change
  const structuralSignature = playerAppearance
    ? [
        playerAppearance.skinColor,
        playerAppearance.hairColor,
        playerAppearance.visualModel.bodyBuild,
        playerAppearance.visualModel.stance,
        playerAppearance.visualModel.topStyle,
        playerAppearance.visualModel.bottomStyle,
        playerAppearance.visualModel.hairStyle,
        playerAppearance.visualModel.headwearStyle,
        playerAppearance.visualModel.accessory,
        playerAppearance.visualModel.faceModel ?? 'classic',
        garageConfig.deckShape ?? 'street_popsicle',
        garageConfig.wheelSize ?? 'park_56',
      ].join('|')
    : [
        garageConfig.deckShape ?? 'street_popsicle',
        garageConfig.wheelSize ?? 'park_56',
      ].join('|');

  useEffect(() => {
    const scene = sceneRef.current;
    const textures = texturesRef.current;
    const prevHandle = skaterHandleRef.current;
    if (!scene || !textures || !prevHandle) return;

    const prevPos = prevHandle.group.position.clone();
    const prevQuat = prevHandle.group.quaternion.clone();
    const prevRotY = prevHandle.group.rotation.y;

    scene.remove(prevHandle.group);
    prevHandle.dispose();

    const nextHandle = buildHeroSkaterAndBoard(textures, garageConfigRef.current, {
      skinColor: appearanceRef.current?.skinColor,
      hairColor: appearanceRef.current?.hairColor,
      visualModel: appearanceRef.current?.visualModel,
    });
    nextHandle.group.position.copy(prevPos);
    if (screenRef.current === 'gameplay') {
      nextHandle.group.quaternion.copy(prevQuat);
    } else {
      nextHandle.group.rotation.y = prevRotY;
    }
    scene.add(nextHandle.group);
    skaterHandleRef.current = nextHandle;
  }, [structuralSignature]);

  // Apply Night Session atmosphere vs Golden Hour day lighting cleanly
  useEffect(() => {
    const scene = sceneRef.current;
    const keyLight = keyLightRef.current;
    const crossLight = crossLightRef.current;
    const hemiLight = hemiLightRef.current;
    const ambientLight = ambientLightRef.current;
    const renderer = rendererRef.current;
    if (!scene || !keyLight || !crossLight || !hemiLight || !ambientLight || !renderer) return;

    const isNight = activeScreen === 'gameplay' && sessionConfig?.atmosphere === 'night';
    if (isNight) {
      scene.background = new THREE.Color(0x091322);
      scene.fog = new THREE.Fog(0x0b1628, 30, 108);
      scene.environmentIntensity = 0.24;
      hemiLight.color.setHex(0x4b74ab);
      hemiLight.groundColor.setHex(0x111827);
      hemiLight.intensity = 0.56;
      ambientLight.color.setHex(0x3a5d8c);
      ambientLight.intensity = 0.26;
      keyLight.color.setHex(0x9fd0ff);
      keyLight.intensity = 1.95;
      crossLight.color.setHex(0x38bdf8);
      crossLight.intensity = 0.72;
      renderer.toneMappingExposure = 1.06;
      floodLightsRef.current.forEach((l) => {
        l.intensity = 3.2;
      });
    } else {
      scene.background = new THREE.Color(0xb89f74);
      scene.fog = new THREE.Fog(0xba9f74, 38, 128);
      scene.environmentIntensity = 0.42;
      hemiLight.color.setHex(0xe0bd63);
      hemiLight.groundColor.setHex(0x4d3618);
      hemiLight.intensity = 0.44;
      ambientLight.color.setHex(0xdeb34f);
      ambientLight.intensity = 0.22;
      keyLight.color.setHex(0xf5be42);
      keyLight.intensity = 3.35;
      crossLight.color.setHex(0xd9b97e);
      crossLight.intensity = 0.54;
      renderer.toneMappingExposure = 0.94;
      floodLightsRef.current.forEach((l) => {
        l.intensity = 0;
      });
    }
  }, [activeScreen, sessionConfig?.atmosphere]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL (SwiftShader / llvmpipe / WARP) cleanly
    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param) ?? '');
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();
    isSoftwareGlRef.current = isSoftwareGl;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }
    rendererRef.current = renderer;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.94;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = !isSoftwareGl && shadowsRef.current;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
    });
    container.appendChild(renderer.domElement);

    // 2. Scene, Rich Golden-Hour Fog & Calibrated Studio Environment Reflections
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xb89f74);
    scene.fog = new THREE.Fog(0xba9f74, 38, 128);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.42;
    pmremGenerator.dispose();

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 240);
    camera.position.set(-0.25, 1.48, 5.25);
    camera.lookAt(_lookAtCurrent);

    // 4. Warm Golden-Yellow Sunlight + Yellow Ambient Fill + Single Crisp Dynamic Shadow Rig
    const hemiLight = new THREE.HemisphereLight(0xe0bd63, 0x4d3618, 0.44);
    hemiLight.position.set(0, 30, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const ambientLight = new THREE.AmbientLight(0xdeb34f, 0.22);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const keyLight = new THREE.DirectionalLight(0xf5be42, 3.35);
    keyLight.position.set(28, 13.5, -23);
    keyLight.target.position.set(0, 0, -2);
    scene.add(keyLight.target);
    keyLight.castShadow = !isSoftwareGl && shadowsRef.current;
    keyLight.shadow.mapSize.width = isSoftwareGl ? 1024 : 2048;
    keyLight.shadow.mapSize.height = isSoftwareGl ? 1024 : 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 68;
    keyLight.shadow.camera.left = -14;
    keyLight.shadow.camera.right = 14;
    keyLight.shadow.camera.top = 14;
    keyLight.shadow.camera.bottom = -14;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.radius = 1.6;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const crossShadowLight = new THREE.DirectionalLight(0xd9b97e, 0.54);
    crossShadowLight.position.set(-14, 11.5, 9);
    crossShadowLight.castShadow = false;
    scene.add(crossShadowLight);
    crossLightRef.current = crossShadowLight;

    // Night Session Stadium Floodlights (intensity 0 during daytime)
    const floodPositions: [number, number, number, number][] = [
      [-8, 7.5, -6, 0x38bdf8],
      [9, 7.5, 4, 0xf59e0b],
    ];
    floodLightsRef.current = floodPositions.map(([fx, fy, fz, col]) => {
      const fl = new THREE.PointLight(col, 0, 28, 1.3);
      fl.position.set(fx, fy, fz);
      scene.add(fl);
      return fl;
    });

    const cameraSpecLight = new THREE.PointLight(0xf5dfaa, 1.15, 14, 1.4);
    cameraSpecLight.position.set(-0.25, 1.8, 5.0);
    scene.add(cameraSpecLight);

    // 5. Build Procedural Textures, Skatepark, Skater + Physics Simulation
    const textures = createProceduralTextureSet(renderer);
    texturesRef.current = textures;
    const skatepark = buildSkateparkScene(textures);
    scene.add(skatepark.group);

    const heroSkater = buildHeroSkaterAndBoard(textures, garageConfigRef.current, {
      skinColor: appearanceRef.current?.skinColor,
      hairColor: appearanceRef.current?.hairColor,
      visualModel: appearanceRef.current?.visualModel,
    });
    heroSkater.group.position.set(1.38, 0, 1.85);
    heroSkater.group.rotation.y = -0.34;
    scene.add(heroSkater.group);
    skaterHandleRef.current = heroSkater;

    const npcManager = new NpcParkManager(textures, 6);
    npcManager.setVisible(screenRef.current === 'gameplay');
    scene.add(npcManager.group);
    npcManagerRef.current = npcManager;

    const sim = new SkateSimulation();
    simRef.current = sim;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 6. Resize, Pointer, Wheel & Keyboard Handlers
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    };
    window.addEventListener('resize', handleResize);

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && !dragStateRef.current.active) {
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        pointerParallaxRef.current.x = nx;
        pointerParallaxRef.current.y = ny;
      }

      if (!dragStateRef.current.active || dragStateRef.current.pointerId !== e.pointerId) return;
      const dx = THREE.MathUtils.clamp(e.clientX - dragStateRef.current.lastX, -90, 90);
      const dy = THREE.MathUtils.clamp(e.clientY - dragStateRef.current.lastY, -90, 90);
      dragStateRef.current.lastX = e.clientX;
      dragStateRef.current.lastY = e.clientY;

      if (screenRef.current === 'garage' || screenRef.current === 'creator') {
        dragStateRef.current.targetYaw += dx * 0.011;
      } else if (screenRef.current === 'gameplay' && (!pausedRef.current || replayActiveRef.current)) {
        const isFirstPersonNow = replayActiveRef.current
          ? replayCameraModeRef.current === 'first_person'
          : cameraModeRef.current === 'first_person';
        if (!isFirstPersonNow) {
          gpCameraRef.current.orbitYaw -= dx * 0.0065;
          gpCameraRef.current.orbitPitch = THREE.MathUtils.clamp(
            gpCameraRef.current.orbitPitch + dy * 0.0045,
            0.05,
            0.85,
          );
        } else {
          gpCameraRef.current.fpLookYaw = THREE.MathUtils.clamp(
            gpCameraRef.current.fpLookYaw - dx * 0.004,
            -0.85,
            0.85,
          );
          gpCameraRef.current.fpLookPitch = THREE.MathUtils.clamp(
            gpCameraRef.current.fpLookPitch - dy * 0.004,
            -0.55,
            0.4,
          );
        }
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.target !== domElem) return;
      if (screenRef.current === 'garage' || screenRef.current === 'creator') {
        if (dragStateRef.current.active) return;
        dragStateRef.current.active = true;
        dragStateRef.current.pointerId = e.pointerId;
        dragStateRef.current.lastX = e.clientX;
        dragStateRef.current.lastY = e.clientY;
        try {
          domElem.setPointerCapture(e.pointerId);
        } catch {
          // Ignore unsupported capture
        }
      } else if (screenRef.current === 'gameplay' && (!pausedRef.current || replayActiveRef.current)) {
        if (e.button === 2 && !replayActiveRef.current) {
          mouseGrabHeldRef.current = true;
        } else if (!dragStateRef.current.active) {
          dragStateRef.current.active = true;
          dragStateRef.current.pointerId = e.pointerId;
          dragStateRef.current.lastX = e.clientX;
          dragStateRef.current.lastY = e.clientY;
          try {
            domElem.setPointerCapture(e.pointerId);
          } catch {
            // Ignore unsupported capture
          }
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (dragStateRef.current.pointerId === e.pointerId) {
        dragStateRef.current.active = false;
        dragStateRef.current.pointerId = null;
        try {
          if (domElem.hasPointerCapture(e.pointerId)) {
            domElem.releasePointerCapture(e.pointerId);
          }
        } catch {
          // Ignore
        }
      }
      if (e.button === 2) {
        mouseGrabHeldRef.current = false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (screenRef.current === 'gameplay') {
        e.preventDefault();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      const allowGameplayZoom =
        screenRef.current === 'gameplay' &&
        (replayActiveRef.current
          ? replayCameraModeRef.current !== 'first_person'
          : cameraModeRef.current === 'third_person');
      if (allowGameplayZoom) {
        gpCameraRef.current.zoomDist = THREE.MathUtils.clamp(
          gpCameraRef.current.zoomDist + e.deltaY * 0.0035,
          2.2,
          9.5,
        );
      } else if (screenRef.current === 'garage' || screenRef.current === 'creator') {
        wheelZoomOffsetRef.current = THREE.MathUtils.clamp(
          wheelZoomOffsetRef.current + e.deltaY * 0.0018,
          -0.95,
          0.95,
        );
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (screenRef.current !== 'gameplay') return;

      const code = e.code;
      if (
        code === 'Space' ||
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight'
      ) {
        e.preventDefault();
      }

      if (screenRef.current === 'gameplay' && replayActiveRef.current) {
        if (!e.repeat && code === 'Space') {
          onReplayPlayPauseToggleRef.current?.();
        }
        return;
      }

      if (!e.repeat) {
        if (code === 'KeyC') {
          onToggleCameraRef.current();
          return;
        }
        if (code === 'KeyP') {
          onTogglePauseRef.current();
          return;
        }
        if (code === 'KeyR' && !pausedRef.current && simRef.current) {
          simRef.current.resetSkaterPosition();
          gpCameraRef.current.orbitYaw = 0;
          gpCameraRef.current.smoothedCamYaw = simRef.current.heading;
          onHudUpdateRef.current({ ...simRef.current.getHudState(), cameraMode: cameraModeRef.current });
          return;
        }
      }

      if (pausedRef.current) return;
      heldKeysRef.current.add(code);

      if (e.repeat) return;

      // Trick triggers on fresh press
      if (code === 'KeyE') edgeQueueRef.current.nollie = true;
      else if (code === 'Digit1' || code === 'KeyJ') edgeQueueRef.current.trick = 'kickflip';
      else if (code === 'Digit2' || code === 'KeyK') edgeQueueRef.current.trick = 'heelflip';
      else if (code === 'Digit3' || code === 'KeyL') edgeQueueRef.current.trick = 'pop_shove_it';
      else if (code === 'Digit4' || code === 'KeyU') edgeQueueRef.current.trick = 'shove_it_360';
      else if (code === 'Digit5' || code === 'KeyI') edgeQueueRef.current.trick = 'varial_kickflip';
      else if (code === 'Digit6' || code === 'KeyO') edgeQueueRef.current.trick = 'flip_360';
      else if (code === 'Digit7' || code === 'KeyY') edgeQueueRef.current.trick = 'hardflip';
      else if (code === 'Digit8' || code === 'KeyH') edgeQueueRef.current.trick = 'inward_heelflip';
      else if (code === 'KeyQ') {
        edgeQueueRef.current.trick =
          heldKeysRef.current.has('ShiftLeft') || heldKeysRef.current.has('ShiftRight')
            ? 'fs_360'
            : 'fs_180';
      } else if (code === 'KeyZ') {
        edgeQueueRef.current.trick =
          heldKeysRef.current.has('ShiftLeft') || heldKeysRef.current.has('ShiftRight')
            ? 'bs_360'
            : 'bs_180';
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const wasHeld = heldKeysRef.current.has(e.code);
      heldKeysRef.current.delete(e.code);
      if (e.code === 'Space' && wasHeld && screenRef.current === 'gameplay' && !pausedRef.current) {
        edgeQueueRef.current.ollie = true;
      }
    };

    const handleWindowBlur = () => {
      heldKeysRef.current.clear();
      mouseGrabHeldRef.current = false;
      dragStateRef.current.active = false;
      dragStateRef.current.pointerId = null;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', handlePointerDown);
    domElem.addEventListener('pointermove', handlePointerMove, { passive: true });
    domElem.addEventListener('pointerup', handlePointerUp);
    domElem.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    domElem.addEventListener('contextmenu', handleContextMenu);
    domElem.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
    };
    domElem.addEventListener('webglcontextlost', handleContextLost);

    // 7. Animation & Simulation Loop
    let frameId = 0;
    let disposed = false;
    let hudEmitAccum = 0;
    let lastScore = -1;
    let lastComboLen = -1;
    let lastOutcome: GameplayHudState['landingOutcome'] = null;
    let lastFinished = false;
    let lastGroundState = '';
    let lastTrickFxStep = 0;
    const clock = new THREE.Clock();

    const buildInputFrame = (): SkateInputFrame => {
      const keys = heldKeysRef.current;
      const virt = virtualInputRef.current;
      const edge = edgeQueueRef.current;

      let moveX = virt.moveX;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) moveX -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) moveX += 1;
      moveX = THREE.MathUtils.clamp(moveX, -1, 1);

      let moveY = virt.moveY;
      if (keys.has('KeyW') || keys.has('ArrowUp')) moveY += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) moveY -= 1;
      moveY = THREE.MathUtils.clamp(moveY, -1, 1);

      const sprint = virt.sprint || keys.has('ShiftLeft') || keys.has('ShiftRight');
      const brake = keys.has('ControlLeft') || keys.has('ControlRight');
      const crouching = virt.crouching || keys.has('Space');

      // Edge-triggered ollie/nollie/tricks from keyboard OR mobile virtual buttons
      let ollieJustPressed = edge.ollie;
      edge.ollie = false;
      if (virt.ollieTrigger !== edge.lastVirtOllie) {
        edge.lastVirtOllie = virt.ollieTrigger;
        ollieJustPressed = true;
      }

      let nollieJustPressed = edge.nollie;
      edge.nollie = false;
      if (virt.nollieTrigger !== edge.lastVirtNollie) {
        edge.lastVirtNollie = virt.nollieTrigger;
        nollieJustPressed = true;
      }

      let trickJustPressed = edge.trick;
      edge.trick = null;
      if (virt.trickTrigger && virt.trickTrigger.seq !== edge.lastVirtTrickSeq) {
        edge.lastVirtTrickSeq = virt.trickTrigger.seq;
        trickJustPressed = virt.trickTrigger.id;
      }

      // Contextual Grabs (G / right-click + direction, or dedicated keys V,B,N,M, or virtual button)
      let grabHeld: TrickId | null = virt.grabHeld;
      if (!grabHeld) {
        if (keys.has('KeyV')) grabHeld = 'melon';
        else if (keys.has('KeyB')) grabHeld = 'method';
        else if (keys.has('KeyN')) grabHeld = 'nose_grab';
        else if (keys.has('KeyM')) grabHeld = 'tail_grab';
        else if (keys.has('KeyG') || mouseGrabHeldRef.current) {
          if (moveY > 0.4) grabHeld = 'nose_grab';
          else if (moveY < -0.4) grabHeld = 'tail_grab';
          else if (moveX < -0.4) grabHeld = 'melon';
          else if (moveX > 0.4) grabHeld = 'method';
          else grabHeld = 'indy';
        }
      }

      let airSpinDir: -1 | 0 | 1 = virt.spinDir;
      if (airSpinDir === 0) {
        if (keys.has('KeyA') || keys.has('ArrowLeft')) airSpinDir = 1;
        else if (keys.has('KeyD') || keys.has('ArrowRight')) airSpinDir = -1;
      }

      return {
        moveX,
        moveY,
        sprint,
        brake,
        crouching,
        ollieJustPressed,
        nollieJustPressed,
        trickJustPressed,
        grabHeld,
        airSpinDir,
      };
    };

    const computeMenuCameraTargets = (elapsed: number) => {
      const screen = screenRef.current;
      const aspect = camera.aspect || 1.77;
      const narrowPullback = aspect < 1.35 ? (1.35 - aspect) * 2.1 : 0;

      const swayX = swayRef.current
        ? Math.sin(elapsed * 0.35) * 0.06 + pointerParallaxRef.current.x * 0.09
        : 0;
      const swayY = swayRef.current
        ? Math.cos(elapsed * 0.28) * 0.025 - pointerParallaxRef.current.y * 0.04
        : 0;

      if (screen === 'garage' || screen === 'creator') {
        const focus = showcaseFocusRef.current;
        const zoomFactor = THREE.MathUtils.clamp(
          1 / Math.max(0.55, showcaseZoomRef.current) + wheelZoomOffsetRef.current * 0.35,
          0.45,
          1.45,
        );
        const focusOffsetY = focus === 'head' ? 1.48 : focus === 'board' ? 0.42 : 0.92;
        const camOffsetY = focus === 'head' ? 1.56 : focus === 'board' ? 0.56 : 1.24;
        const baseDist = (focus === 'head' ? 1.55 : focus === 'board' ? 1.65 : 2.38) * zoomFactor + narrowPullback;
        const skaterX = 1.38;
        const skaterZ = 1.85;
        const screenShiftX = focus === 'full' ? -0.58 : -0.35;
        _camPosTarget.set(
          skaterX + screenShiftX - 0.5 + swayX * 0.3,
          camOffsetY + swayY * 0.25,
          skaterZ + baseDist,
        );
        _lookAtTarget.set(skaterX + screenShiftX * 0.95, focusOffsetY, skaterZ);
      } else if (screen === 'play') {
        const focus = modeFocusRef.current;
        if (focus === 'bowl') {
          _camPosTarget.set(-1.3 + swayX, 3.05 + swayY, 0.2);
          _lookAtTarget.set(-5.2, 0.75, -5.8);
        } else if (focus === 'rails') {
          _camPosTarget.set(3.8 + swayX, 2.25 + swayY, 1.6);
          _lookAtTarget.set(0.3, 0.6, -3.9);
        } else if (focus === 'plaza') {
          _camPosTarget.set(-4.2 + swayX, 2.55 + swayY, 3.9);
          _lookAtTarget.set(2.4, 1.4, -5.5);
        } else {
          _camPosTarget.set(-3.1 + swayX, 3.85 + swayY, 8.2);
          _lookAtTarget.set(0.2, 0.9, -3.5);
        }
      } else if (screen === 'career') {
        _camPosTarget.set(4.5 + swayX, 2.65 + swayY, 6.2);
        _lookAtTarget.set(-1.1, 1.25, -4.6);
      } else {
        _camPosTarget.set(-0.25 + swayX, 1.48 + swayY, 5.25 + narrowPullback);
        _lookAtTarget.set(0.42 + (narrowPullback > 0 ? 0.25 : 0), 1.02, 0.2);
      }
    };

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      const isGameplay = screenRef.current === 'gameplay';
      const activeSkater = skaterHandleRef.current;
      if (!activeSkater) return;

      skatepark.update(elapsed);

      if (isGameplay && replayActiveRef.current && replayBufferRef.current.hasFrames()) {
        // REPLAY PLAYBACK MODE
        soundEngine.silenceGameplayLoops();
        const rBuffer = replayBufferRef.current;
        const duration = Math.max(0.01, rBuffer.getDuration());
        if (replayPlayingRef.current) {
          replayTimeRef.current += dt * replaySpeedRef.current;
          if (replayTimeRef.current >= duration) {
            replayTimeRef.current = 0;
            replayScrubDirtyRef.current = true;
          }
        }

        const stepNpcDt = replayPlayingRef.current ? dt * replaySpeedRef.current * 0.5 : 0;
        npcManager.update(stepNpcDt, _replayPos, 1.0, false);

        rBuffer.sampleAtTime(replayTimeRef.current, _replayPos, _replayQuat, _replayAnim, _replayMeta);
        activeSkater.group.position.copy(_replayPos);
        activeSkater.group.quaternion.copy(_replayQuat);

        const rCam = replayCameraModeRef.current;
        activeSkater.setFirstPersonView(rCam === 'first_person');
        const activeCamMode = rCam;
        void activeCamMode;
        const justScrubbed = replayScrubDirtyRef.current;
        const animStepDt = justScrubbed
          ? 0.35
          : replayPlayingRef.current
            ? dt * replaySpeedRef.current
            : 0;
        replayScrubDirtyRef.current = false;
        activeSkater.updateGameplay(_replayAnim, animStepDt);

        keyLight.target.position.set(_replayPos.x, _replayPos.y, _replayPos.z);
        keyLight.position.set(_replayPos.x + 26, _replayPos.y + 13.5, _replayPos.z - 22);
        keyLight.target.updateMatrixWorld();

        const fxStep = Math.round(_replayMeta.trickFxBlend * 40);
        if (fxStep !== lastTrickFxStep) {
          lastTrickFxStep = fxStep;
          if (fxStep <= 0) {
            domElem.style.filter = '';
          } else {
            const b = fxStep / 40;
            domElem.style.filter = `saturate(${(1 - b * 0.74).toFixed(2)}) contrast(${(1 + b * 0.1).toFixed(2)}) brightness(${(1 - b * 0.04).toFixed(2)})`;
          }
        }

        activeSkater.group.updateMatrixWorld(true);

        if (rCam === 'first_person') {
          const targetNear = 0.04;
          const targetFov = 60;
          if (Math.abs(camera.near - targetNear) > 0.005 || Math.abs(gpCameraRef.current.currentFov - targetFov) > 0.2) {
            camera.near = targetNear;
            gpCameraRef.current.currentFov = THREE.MathUtils.damp(gpCameraRef.current.currentFov, targetFov, 8, dt);
            camera.fov = gpCameraRef.current.currentFov;
            camera.updateProjectionMatrix();
          }
          activeSkater.headGroup.getWorldPosition(_headWorldPos);
          _fpForward.set(0, 0, 1).applyQuaternion(_replayQuat).normalize();
          _fpUp.set(0, 1, 0).applyQuaternion(_replayQuat).normalize();
          _fpRight.set(1, 0, 0).applyQuaternion(_replayQuat).normalize();

          const lookYaw = gpCameraRef.current.fpLookYaw;
          const lookPitch = -0.34 + gpCameraRef.current.fpLookPitch;

          _camPosTarget
            .copy(_headWorldPos)
            .addScaledVector(_fpForward, 0.08)
            .addScaledVector(_fpUp, 0.04);
          sampleSkateparkSurface(_camPosTarget.x, _camPosTarget.y + 0.5, _camPosTarget.z, _camSurfaceProbe);
          if (_camPosTarget.y < _camSurfaceProbe.height + 0.22) {
            _camPosTarget.y = _camSurfaceProbe.height + 0.22;
          }
          _lookAtTarget
            .copy(_camPosTarget)
            .addScaledVector(_fpForward, Math.cos(lookYaw) * 3.0)
            .addScaledVector(_fpRight, Math.sin(lookYaw) * 2.6)
            .addScaledVector(_fpUp, Math.sin(lookPitch) * 2.8);

          camera.position.lerp(_camPosTarget, Math.min(1, dt * 24));
          _lookAtCurrent.lerp(_lookAtTarget, Math.min(1, dt * 24));
          camera.lookAt(_lookAtCurrent);
        } else {
          const targetNear = 0.1;
          const targetFov = rCam === 'cine' ? 48 : 42;
          if (Math.abs(camera.near - targetNear) > 0.005 || Math.abs(gpCameraRef.current.currentFov - targetFov) > 0.2) {
            camera.near = targetNear;
            gpCameraRef.current.currentFov = THREE.MathUtils.damp(gpCameraRef.current.currentFov, targetFov, 7, dt);
            camera.fov = gpCameraRef.current.currentFov;
            camera.updateProjectionMatrix();
          }

          let angleDiff = _replayMeta.heading - gpCameraRef.current.smoothedCamYaw;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          gpCameraRef.current.smoothedCamYaw += angleDiff * Math.min(1, dt * 4.5);

          const totalYaw =
            rCam === 'free_orbit'
              ? gpCameraRef.current.orbitYaw
              : rCam === 'cine'
                ? gpCameraRef.current.smoothedCamYaw + 0.62 + Math.sin(replayTimeRef.current * 0.45) * 0.28 + gpCameraRef.current.orbitYaw
                : gpCameraRef.current.smoothedCamYaw + gpCameraRef.current.orbitYaw;
          const zoom = rCam === 'cine' ? Math.min(gpCameraRef.current.zoomDist, 3.6) : gpCameraRef.current.zoomDist;
          const pitch = rCam === 'cine' ? Math.max(0.05, gpCameraRef.current.orbitPitch * 0.55) : gpCameraRef.current.orbitPitch;

          const horizDist = Math.cos(pitch) * zoom;
          const vertOffset = Math.sin(pitch) * zoom + (rCam === 'cine' ? 0.52 : 0.85);

          _camPosTarget.set(
            _replayPos.x - Math.sin(totalYaw) * horizDist,
            _replayPos.y + vertOffset,
            _replayPos.z - Math.cos(totalYaw) * horizDist,
          );
          sampleSkateparkSurface(_camPosTarget.x, _camPosTarget.y + 1.0, _camPosTarget.z, _camSurfaceProbe);
          if (_camPosTarget.y < _camSurfaceProbe.height + 0.36) {
            _camPosTarget.y = _camSurfaceProbe.height + 0.36;
          }

          _lookAtTarget.set(
            _replayPos.x + Math.sin(_replayMeta.heading) * 0.35,
            _replayPos.y + 0.88,
            _replayPos.z + Math.cos(_replayMeta.heading) * 0.35,
          );

          camera.position.x = THREE.MathUtils.damp(camera.position.x, _camPosTarget.x, 10, dt);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, _camPosTarget.y, 10, dt);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, _camPosTarget.z, 10, dt);

          _lookAtCurrent.x = THREE.MathUtils.damp(_lookAtCurrent.x, _lookAtTarget.x, 12, dt);
          _lookAtCurrent.y = THREE.MathUtils.damp(_lookAtCurrent.y, _lookAtTarget.y, 12, dt);
          _lookAtCurrent.z = THREE.MathUtils.damp(_lookAtCurrent.z, _lookAtTarget.z, 12, dt);
          camera.lookAt(_lookAtCurrent);
        }

        hudEmitAccum += dt;
        if (justScrubbed || hudEmitAccum >= 0.05) {
          hudEmitAccum = 0;
          if (replayActiveRef.current) {
            onReplayHudUpdateRef.current?.({
              active: true,
              playing: replayPlayingRef.current,
              currentTime: replayTimeRef.current,
              duration,
              speed: replaySpeedRef.current,
              cameraMode: replayCameraModeRef.current,
              hasFrames: true,
              activeTrickName: _replayMeta.activeTrickName,
              comboTricks: _replayMeta.comboTricks,
              comboBasePoints: _replayMeta.comboBasePoints,
              comboMultiplier: _replayMeta.comboMultiplier,
              landingOutcome: _replayMeta.landingOutcome,
              landingMessage: _replayMeta.landingMessage,
              score: _replayMeta.score,
              speedKmh: _replayMeta.speedKmh,
            });
          }
        }
      } else if (isGameplay) {
        const inputFrame = buildInputFrame();
        sim.step(dt, inputFrame);
        if (!pausedRef.current && !sim.runFinished) {
          replayBufferRef.current.record(dt, sim);
        }
        npcManager.update(pausedRef.current ? 0 : dt, sim.pos, sim.currentTimeScale, true);

        activeSkater.group.position.copy(sim.pos);
        activeSkater.group.quaternion.copy(sim.boardQuat);

        const activeCamMode = cameraModeRef.current;
        activeSkater.setFirstPersonView(activeCamMode === 'first_person');
        const animDt =
          sim.groundState === 'crashed' || sim.groundState === 'getting_up'
            ? dt
            : dt * sim.currentTimeScale;
        activeSkater.updateGameplay(sim.getAnimState(), animDt);

        // Keep high-res shadow frustum locked onto the skater across the expanded park
        keyLight.target.position.set(sim.pos.x, sim.pos.y, sim.pos.z);
        keyLight.position.set(sim.pos.x + 26, sim.pos.y + 13.5, sim.pos.z - 22);
        keyLight.target.updateMatrixWorld();

        // Subtle quantized grayscale tint synced with slow-motion tricks (zero React re-renders)
        const fxStep = Math.round(sim.trickFxBlend * 40);
        if (fxStep !== lastTrickFxStep) {
          lastTrickFxStep = fxStep;
          if (fxStep <= 0) {
            domElem.style.filter = '';
          } else {
            const b = fxStep / 40;
            domElem.style.filter = `saturate(${(1 - b * 0.74).toFixed(2)}) contrast(${(1 + b * 0.1).toFixed(2)}) brightness(${(1 - b * 0.04).toFixed(2)})`;
          }
        }

        // Ensure world matrices reflect latest skater & head transforms for 1st-person eye placement
        activeSkater.group.updateMatrixWorld(true);

        if (activeCamMode === 'first_person') {
          const targetNear = 0.04;
          const targetFov = 58 + Math.min(11, sim.speed * 0.72);
          if (Math.abs(camera.near - targetNear) > 0.005 || Math.abs(gpCameraRef.current.currentFov - targetFov) > 0.15) {
            camera.near = targetNear;
            gpCameraRef.current.currentFov = THREE.MathUtils.damp(gpCameraRef.current.currentFov, targetFov, 8, dt);
            camera.fov = gpCameraRef.current.currentFov;
            camera.updateProjectionMatrix();
          }

          activeSkater.headGroup.getWorldPosition(_headWorldPos);
          _fpForward.set(0, 0, 1).applyQuaternion(sim.boardQuat).normalize();
          _fpUp.set(0, 1, 0).applyQuaternion(sim.boardQuat).normalize();
          _fpRight.set(1, 0, 0).applyQuaternion(sim.boardQuat).normalize();

          // Slight downward look so shoes & rolling/flipping skateboard are clearly visible!
          const lookYaw = gpCameraRef.current.fpLookYaw;
          const lookPitch = -0.34 + gpCameraRef.current.fpLookPitch;

          _camPosTarget
            .copy(_headWorldPos)
            .addScaledVector(_fpForward, 0.08)
            .addScaledVector(_fpUp, 0.04);

          sampleSkateparkSurface(_camPosTarget.x, _camPosTarget.y + 0.5, _camPosTarget.z, _camSurfaceProbe);
          if (_camPosTarget.y < _camSurfaceProbe.height + 0.22) {
            _camPosTarget.y = _camSurfaceProbe.height + 0.22;
          }

          _lookAtTarget
            .copy(_camPosTarget)
            .addScaledVector(_fpForward, Math.cos(lookYaw) * 3.0)
            .addScaledVector(_fpRight, Math.sin(lookYaw) * 2.6)
            .addScaledVector(_fpUp, Math.sin(lookPitch) * 2.8);

          camera.position.lerp(_camPosTarget, Math.min(1, dt * 24));
          _lookAtCurrent.lerp(_lookAtTarget, Math.min(1, dt * 24));
          camera.lookAt(_lookAtCurrent);
        } else {
          // 3RD-PERSON CAMERA: smooth follow + orbit + zoom + automatic big-air framing
          const targetNear = 0.1;
          const targetFov = 42;
          if (Math.abs(camera.near - targetNear) > 0.005 || Math.abs(gpCameraRef.current.currentFov - targetFov) > 0.15) {
            camera.near = targetNear;
            gpCameraRef.current.currentFov = THREE.MathUtils.damp(gpCameraRef.current.currentFov, targetFov, 7, dt);
            camera.fov = gpCameraRef.current.currentFov;
            camera.updateProjectionMatrix();
          }

          // Shortest-angle damp toward skater travel heading
          let angleDiff = sim.heading - gpCameraRef.current.smoothedCamYaw;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          gpCameraRef.current.smoothedCamYaw += angleDiff * Math.min(1, dt * 4.5);

          const totalYaw = gpCameraRef.current.smoothedCamYaw + gpCameraRef.current.orbitYaw;
          const airElevation = sim.groundState === 'airborne' ? Math.max(0, sim.pos.y - sim.airStartY) : 0;
          const zoom = gpCameraRef.current.zoomDist + Math.min(1.6, airElevation * 0.55);
          const pitch = gpCameraRef.current.orbitPitch;

          const horizDist = Math.cos(pitch) * zoom;
          const vertOffset = Math.sin(pitch) * zoom + 0.85;

          _camPosTarget.set(
            sim.pos.x - Math.sin(totalYaw) * horizDist,
            sim.pos.y + vertOffset,
            sim.pos.z - Math.cos(totalYaw) * horizDist,
          );

          // Prevent camera from clipping below skatepark floor or ramps
          sampleSkateparkSurface(_camPosTarget.x, _camPosTarget.y + 1.0, _camPosTarget.z, _camSurfaceProbe);
          if (_camPosTarget.y < _camSurfaceProbe.height + 0.42) {
            _camPosTarget.y = _camSurfaceProbe.height + 0.42;
          }

          _lookAtTarget.set(
            sim.pos.x + Math.sin(sim.heading) * 0.55,
            sim.pos.y + 0.92 - Math.min(0.25, airElevation * 0.12),
            sim.pos.z + Math.cos(sim.heading) * 0.55,
          );

          const followDamp = 9.5;
          camera.position.x = THREE.MathUtils.damp(camera.position.x, _camPosTarget.x, followDamp, dt);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, _camPosTarget.y, followDamp, dt);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, _camPosTarget.z, followDamp, dt);

          _lookAtCurrent.x = THREE.MathUtils.damp(_lookAtCurrent.x, _lookAtTarget.x, 12, dt);
          _lookAtCurrent.y = THREE.MathUtils.damp(_lookAtCurrent.y, _lookAtTarget.y, 12, dt);
          _lookAtCurrent.z = THREE.MathUtils.damp(_lookAtCurrent.z, _lookAtTarget.z, 12, dt);
          camera.lookAt(_lookAtCurrent);
        }

        // Throttled HUD updates (~18Hz + immediate on trick/score/finish events)
        hudEmitAccum += dt;
        const importantChange =
          sim.score !== lastScore ||
          sim.comboTricks.length !== lastComboLen ||
          sim.landingOutcome !== lastOutcome ||
          sim.runFinished !== lastFinished ||
          sim.groundState !== lastGroundState;

        if (importantChange || hudEmitAccum >= 0.055) {
          hudEmitAccum = 0;
          lastScore = sim.score;
          lastComboLen = sim.comboTricks.length;
          lastOutcome = sim.landingOutcome;
          lastFinished = sim.runFinished;
          lastGroundState = sim.groundState;
          onHudUpdateRef.current({
            ...sim.getHudState(),
            cameraMode: activeCamMode,
            activeParkNpcs: npcManager.getLiveStatuses(),
            hasReplay: replayBufferRef.current.hasFrames(),
          });
        }
      } else {
        npcManager.update(dt, activeSkater.group.position, 1.0, false);
        if (lastTrickFxStep !== 0) {
          lastTrickFxStep = 0;
          domElem.style.filter = '';
        }
        keyLight.target.position.set(0, 0, -2);
        keyLight.position.set(28, 13.5, -23);
        keyLight.target.updateMatrixWorld();
        soundEngine.updateLocationAmbience({ x: 1.38, y: 0, z: 1.85, isTransition: false, speed: 0 }, dt);

        // Menu / Garage / Creator / Play / Career Showcase Pose & Camera
        activeSkater.group.position.set(1.38, 0, 1.85);
        activeSkater.group.quaternion.copy(_identityQuat);
        activeSkater.update(elapsed);

        dragStateRef.current.yawOffset = THREE.MathUtils.damp(
          dragStateRef.current.yawOffset,
          dragStateRef.current.targetYaw,
          7.5,
          dt,
        );
        activeSkater.group.rotation.y = -0.34 + dragStateRef.current.yawOffset;

        if (Math.abs(camera.near - 0.1) > 0.005 || Math.abs(gpCameraRef.current.currentFov - 40) > 0.15) {
          camera.near = 0.1;
          gpCameraRef.current.currentFov = THREE.MathUtils.damp(gpCameraRef.current.currentFov, 40, 6, dt);
          camera.fov = gpCameraRef.current.currentFov;
          camera.updateProjectionMatrix();
        }

        computeMenuCameraTargets(elapsed);
        const dampLambda = 4.2;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camPosTarget.x, dampLambda, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camPosTarget.y, dampLambda, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camPosTarget.z, dampLambda, dt);

        _lookAtCurrent.x = THREE.MathUtils.damp(_lookAtCurrent.x, _lookAtTarget.x, dampLambda, dt);
        _lookAtCurrent.y = THREE.MathUtils.damp(_lookAtCurrent.y, _lookAtTarget.y, dampLambda, dt);
        _lookAtCurrent.z = THREE.MathUtils.damp(_lookAtCurrent.z, _lookAtTarget.z, dampLambda, dt);
        camera.lookAt(_lookAtCurrent);
      }

      // Keep camera specular catch light synced near the active camera lens
      cameraSpecLight.position.set(
        camera.position.x + 0.3,
        camera.position.y + 0.45,
        camera.position.z - 0.35,
      );

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 18);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('pointerdown', handlePointerDown);
      domElem.removeEventListener('pointermove', handlePointerMove);
      domElem.removeEventListener('pointerup', handlePointerUp);
      domElem.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      domElem.removeEventListener('contextmenu', handleContextMenu);
      domElem.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      domElem.removeEventListener('webglcontextlost', handleContextLost);

      soundEngine.silenceGameplayLoops();
      npcManager.dispose();
      npcManagerRef.current = null;
      skaterHandleRef.current?.dispose();
      skaterHandleRef.current = null;
      skatepark.dispose();
      textures.dispose();
      texturesRef.current = null;
      sceneRef.current = null;
      envTarget.dispose();
      renderer.dispose();
      if (domElem.parentNode === container) {
        container.removeChild(domElem);
      }
    };
  }, [virtualInputRef]);

  if (webglFailed) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-[#283c4e] via-[#1c2b3a] to-[#0f1924]" />
    );
  }

  return (
    <div
      ref={mountRef}
      className={`absolute inset-0 w-full h-full touch-none ${
        activeScreen === 'garage' || activeScreen === 'creator'
          ? 'cursor-grab active:cursor-grabbing'
          : activeScreen === 'gameplay'
            ? 'cursor-crosshair'
            : ''
      }`}
      aria-label="3D Skatepark Viewport"
    />
  );
};
