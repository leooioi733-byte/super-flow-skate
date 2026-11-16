import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Edit3,
  Lock,
  Play,
  RotateCcw,
  SlidersHorizontal,
  User,
  Wrench,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  BearingFinishId,
  DeckGraphicId,
  DeckShapeId,
  DEFAULT_GARAGE_CONFIG,
  GameplayMode,
  GarageConfig,
  GripTapeStyleId,
  HeadwearType,
  PLAY_MODES,
  PlayModeId,
  PlayModeInfo,
  SettingsConfig,
  TruckFinishId,
  WheelSizeId,
} from '../types/game';
import { CAREER_UNLOCKABLES, isCareerItemUnlocked } from '../data/careerSystem';
import { soundEngine } from '../audio/soundEngine';

interface SubScreensProps {
  activeScreen: 'play' | 'garage' | 'settings';
  selectedMode: PlayModeId;
  onSelectMode: (mode: PlayModeInfo) => void;
  garageConfig: GarageConfig;
  onChangeGarage: (next: GarageConfig) => void;
  unlockedItems?: string[];
  showcaseZoom?: number;
  onChangeShowcaseZoom?: (z: number) => void;
  onOpenCreator?: () => void;
  settings: SettingsConfig;
  onChangeSettings: (next: SettingsConfig) => void;
  onLaunchGameplay: (mode: GameplayMode, eventTitle: string) => void;
  onBack: () => void;
}

const SHIRT_COLORS = [
  { label: 'Flow Cyan', hex: '#1997b3' },
  { label: 'Obsidian', hex: '#1b222c' },
  { label: 'Coral', hex: '#e14b4b' },
  { label: 'Sand', hex: '#d8c5a3' },
  { label: 'Forest', hex: '#2e6f57' },
];

const PANTS_COLORS = [
  { label: 'Indigo', hex: '#253140' },
  { label: 'Charcoal', hex: '#1f2329' },
  { label: 'Khaki', hex: '#8f7b5d' },
  { label: 'Olive', hex: '#3d4a3a' },
];

const SHOE_COLORS = [
  { label: 'Ice White', hex: '#e2e8f0' },
  { label: 'Jet Black', hex: '#181d24' },
  { label: 'Crimson', hex: '#b91c1c' },
  { label: 'Flow Teal', hex: '#1697b5' },
];

const HAT_COLORS = [
  { label: 'Night', hex: '#141c26' },
  { label: 'Cyan', hex: '#148aa5' },
  { label: 'Crimson', hex: '#b82835' },
  { label: 'Cream', hex: '#e7dfd3' },
];

const WHEEL_COLORS = [
  { label: 'Cyan', hex: '#38bdf8' },
  { label: 'Bone', hex: '#f1f5f9' },
  { label: 'Amber', hex: '#f59e0b' },
  { label: 'Mint', hex: '#34d399' },
  { label: 'Rose', hex: '#fb7185' },
];

const DECK_SHAPES: { id: DeckShapeId; pt: string; en: string; unlockId?: string }[] = [
  { id: 'street_popsicle', pt: 'Street 8.25"', en: 'Street 8.25"' },
  { id: 'cruiser_shaped', pt: 'Cruiser', en: 'Cruiser', unlockId: 'unlock_shape_cruiser' },
  { id: 'wide_pool', pt: 'Wide Pool', en: 'Wide Pool', unlockId: 'unlock_shape_wide_pool' },
];

const DECK_OPTIONS: { id: DeckGraphicId; label: string; unlockId?: string }[] = [
  { id: 'flow_wave', label: 'Flow Wave' },
  { id: 'costa_azul', label: 'Costa Azul' },
  { id: 'street_stripes', label: 'Street Stripes' },
  { id: 'natural_maple', label: '7-Ply Maple' },
  { id: 'brazil_tropics', label: 'Brasil Tropics', unlockId: 'unlock_deck_brazil_tropics' },
  { id: 'night_neon', label: 'Night Neon', unlockId: 'unlock_deck_night_neon' },
  { id: 'tokyo_ink', label: 'Tokyo Ink', unlockId: 'unlock_deck_tokyo_ink' },
  { id: 'world_gold', label: 'World Champ Gold', unlockId: 'unlock_deck_world_gold' },
];

const GRIP_OPTIONS: { id: GripTapeStyleId; pt: string; en: string; unlockId?: string }[] = [
  { id: 'classic_black', pt: 'Preta Clássica', en: 'Classic Black' },
  { id: 'cyan_stripe', pt: 'Listra Ciano', en: 'Cyan Stripe' },
  { id: 'clear_wood', pt: 'Transparente', en: 'Clear Wood' },
  { id: 'checkered', pt: 'Quadriculada', en: 'Checkered', unlockId: 'unlock_grip_checkered' },
  { id: 'pro_red', pt: 'Pro Crimson', en: 'Pro Crimson', unlockId: 'unlock_grip_pro_red' },
];

const TRUCK_OPTIONS: { id: TruckFinishId; label: string; unlockId?: string }[] = [
  { id: 'chrome', label: 'Chrome' },
  { id: 'matte_black', label: 'Matte Black' },
  { id: 'anodized_teal', label: 'Teal' },
  { id: 'gold', label: 'Raw Gold', unlockId: 'unlock_truck_gold' },
];

const WHEEL_SIZES: { id: WheelSizeId; label: string }[] = [
  { id: 'street_52', label: '52mm' },
  { id: 'park_56', label: '56mm' },
  { id: 'cruiser_60', label: '60mm' },
];

const BEARING_OPTIONS: { id: BearingFinishId; label: string; unlockId?: string }[] = [
  { id: 'steel', label: 'Steel' },
  { id: 'crimson_pro', label: 'Crimson' },
  { id: 'cyan_swiss', label: 'Swiss Cyan', unlockId: 'unlock_bearing_cyan' },
  { id: 'gold_ceramic', label: 'Gold Ceramic', unlockId: 'unlock_bearing_gold' },
];

export const SubScreens: React.FC<SubScreensProps> = ({
  activeScreen,
  selectedMode,
  onSelectMode,
  garageConfig,
  onChangeGarage,
  unlockedItems = [],
  showcaseZoom = 1,
  onChangeShowcaseZoom,
  onOpenCreator,
  settings,
  onChangeSettings,
  onLaunchGameplay,
  onBack,
}) => {
  const [garageTab, setGarageTab] = useState<'skater' | 'board'>('skater');
  const isPt = settings.language === 'pt';

  const isLocked = (unlockId?: string) =>
    unlockId ? !isCareerItemUnlocked(unlockId, unlockedItems) : false;

  const getUnlockHint = (unlockId?: string) => {
    if (!unlockId) return '';
    const item = CAREER_UNLOCKABLES.find((u) => u.id === unlockId);
    return item ? (isPt ? item.unlockSourcePt : item.unlockSourceEn) : '';
  };

  const headerMeta: Record<
    'play' | 'garage' | 'settings',
    { title: string; subtitle: string; icon: React.ReactNode }
  > = {
    play: {
      title: isPt ? 'SELECIONAR MODO' : 'SELECT MODE',
      subtitle: isPt ? 'Escolha uma modalidade no skatepark' : 'Choose a skatepark session mode',
      icon: <Play className="w-4 h-4 fill-[#38bdf8] text-[#38bdf8]" />,
    },
    garage: {
      title: 'GARAGE',
      subtitle: isPt
        ? 'Personalize skatista e skate · Arraste o 3D para girar'
        : 'Customize skater & setup · Drag 3D view to inspect',
      icon: <Wrench className="w-4 h-4 text-[#38bdf8]" />,
    },
    settings: {
      title: 'SETTINGS',
      subtitle: isPt ? 'Áudio, gráficos e controles' : 'Audio, graphics & preferences',
      icon: <SlidersHorizontal className="w-4 h-4 text-[#38bdf8]" />,
    },
  };

  const currentMeta = headerMeta[activeScreen];

  return (
    <motion.div
      key={activeScreen}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 sm:p-8 md:p-10"
    >
      {/* Top-Left Back Button + Screen Header */}
      <div className="pointer-events-auto flex items-center gap-3.5 max-w-[540px]">
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          onMouseEnter={() => soundEngine.playHover()}
          onClick={() => {
            soundEngine.playBack();
            onBack();
          }}
          className="h-11 px-4 rounded-xl bg-[#101924]/88 hover:bg-[#172536] border border-white/15 hover:border-cyan-400/50 flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-white transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-[#38bdf8]" />
          <span>{isPt ? 'VOLTAR' : 'BACK'}</span>
        </motion.button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {currentMeta.icon}
            <h2 className="text-base sm:text-lg font-extrabold tracking-[0.18em] text-white truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              {currentMeta.title}
            </h2>
          </div>
          <p className="text-xs text-slate-200/85 truncate drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Left-Docked Interactive Content Container (Keeps Center-Right 3D Scene Clear) */}
      <div className="pointer-events-auto w-full max-w-[440px] max-h-[calc(100vh-110px)] overflow-y-auto flow-scroll rounded-2xl bg-[#0e1722]/88 border border-white/15 p-4 sm:p-5 shadow-[0_16px_42px_rgba(0,0,0,0.45)]">
        {/* 1. PLAY MODE SELECTION */}
        {activeScreen === 'play' && (
          <div className="flex flex-col gap-2.5">
            {PLAY_MODES.map((mode) => {
              const active = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onMouseEnter={() => soundEngine.playHover()}
                  onClick={() => {
                    soundEngine.playClick(false);
                    onSelectMode(mode);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#12384b]/90 border-[#38bdf8]/70'
                      : 'bg-[#131f2d]/80 hover:bg-[#19293b] border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs sm:text-sm font-bold tracking-[0.16em] text-white">
                      {isPt ? mode.titlePt : mode.titleEn}
                    </span>
                    <span className="text-[11px] font-semibold tracking-widest text-[#38bdf8] tabular-nums">
                      {mode.durationLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300/85 leading-relaxed">
                    {isPt ? mode.subtitlePt : mode.subtitleEn}
                  </p>
                </button>
              );
            })}

            <button
              type="button"
              onMouseEnter={() => soundEngine.playHover()}
              onClick={() => {
                soundEngine.playClick(true);
                const modeObj = PLAY_MODES.find((m) => m.id === selectedMode) ?? PLAY_MODES[0];
                const name = isPt ? modeObj.titlePt : modeObj.titleEn;
                onLaunchGameplay(modeObj.gameplayMode, name);
              }}
              className="mt-1 w-full h-12 rounded-xl bg-gradient-to-r from-[#0e7490] to-[#178ea9] hover:from-[#1289a8] hover:to-[#1ea5c4] border border-cyan-300/35 flex items-center justify-center gap-2.5 text-xs sm:text-sm font-bold tracking-[0.2em] text-white transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isPt ? 'INICIAR SESSÃO' : 'START SESSION'}</span>
            </button>
          </div>
        )}



        {/* 3. GARAGE (Live Skater & Skateboard Customization) */}
        {activeScreen === 'garage' && (
          <div className="flex flex-col gap-4">
            {/* Segmented Tab Control */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#0a1119] border border-white/10">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick(false);
                  setGarageTab('skater');
                }}
                className={`h-10 rounded-lg flex items-center justify-center gap-2 text-xs font-bold tracking-[0.14em] transition-colors cursor-pointer ${
                  garageTab === 'skater'
                    ? 'bg-[#1587a3] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{isPt ? 'SKATISTA' : 'SKATER'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick(false);
                  setGarageTab('board');
                }}
                className={`h-10 rounded-lg flex items-center justify-center gap-2 text-xs font-bold tracking-[0.14em] transition-colors cursor-pointer ${
                  garageTab === 'board'
                    ? 'bg-[#1587a3] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>SKATEBOARD</span>
              </button>
            </div>

            {garageTab === 'skater' ? (
              <div className="flex flex-col gap-3.5">
                {/* Shirt Color */}
                <div>
                  <p className="text-[11px] font-bold tracking-[0.16em] text-slate-300 mb-2">
                    {isPt ? 'CAMISETA' : 'T-SHIRT'}
                  </p>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {SHIRT_COLORS.map((c) => {
                      const active = garageConfig.shirtColor === c.hex;
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          title={c.label}
                          onClick={() => {
                            soundEngine.playClick(false);
                            onChangeGarage({ ...garageConfig, shirtColor: c.hex });
                          }}
                          style={{ backgroundColor: c.hex }}
                          className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-transform cursor-pointer ${
                            active
                              ? 'border-cyan-300 scale-110'
                              : 'border-white/20 hover:border-white/50'
                          }`}
                        >
                          {active && <Check className="w-4 h-4 text-white drop-shadow" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pants Color */}
                <div>
                  <p className="text-[11px] font-bold tracking-[0.16em] text-slate-300 mb-2">
                    {isPt ? 'CALÇA' : 'PANTS'}
                  </p>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {PANTS_COLORS.map((c) => {
                      const active = garageConfig.pantsColor === c.hex;
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          title={c.label}
                          onClick={() => {
                            soundEngine.playClick(false);
                            onChangeGarage({ ...garageConfig, pantsColor: c.hex });
                          }}
                          style={{ backgroundColor: c.hex }}
                          className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-transform cursor-pointer ${
                            active
                              ? 'border-cyan-300 scale-110'
                              : 'border-white/20 hover:border-white/50'
                          }`}
                        >
                          {active && <Check className="w-4 h-4 text-white drop-shadow" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Shoes */}
                <div>
                  <p className="text-[11px] font-bold tracking-[0.16em] text-slate-300 mb-2">
                    {isPt ? 'TÊNIS' : 'SHOES'}
                  </p>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {SHOE_COLORS.map((c) => {
                      const active = garageConfig.shoeColor === c.hex;
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          title={c.label}
                          onClick={() => {
                            soundEngine.playClick(false);
                            onChangeGarage({ ...garageConfig, shoeColor: c.hex });
                          }}
                          style={{ backgroundColor: c.hex }}
                          className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-transform cursor-pointer ${
                            active
                              ? 'border-cyan-300 scale-110'
                              : 'border-white/20 hover:border-white/50'
                          }`}
                        >
                          {active && (
                            <Check
                              className={`w-4 h-4 ${
                                c.hex === '#e2e8f0' ? 'text-slate-900' : 'text-white'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Headwear Style + Color */}
                <div>
                  <p className="text-[11px] font-bold tracking-[0.16em] text-slate-300 mb-2">
                    {isPt ? 'BONÉ / TOUCA' : 'HEADWEAR'}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-2.5">
                    {(
                      [
                        { id: 'cap', label: isPt ? 'Boné' : 'Cap' },
                        { id: 'beanie', label: isPt ? 'Touca' : 'Beanie' },
                        { id: 'hair', label: isPt ? 'Sem Boné' : 'None' },
                      ] as { id: HeadwearType; label: string }[]
                    ).map((hw) => {
                      const active = garageConfig.headwear === hw.id;
                      return (
                        <button
                          key={hw.id}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick(false);
                            onChangeGarage({ ...garageConfig, headwear: hw.id });
                          }}
                          className={`h-9 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#12384b] border-[#38bdf8] text-white'
                              : 'bg-[#131f2d] border-white/10 text-slate-300 hover:border-white/30'
                          }`}
                        >
                          {hw.label}
                        </button>
                      );
                    })}
                  </div>

                  {garageConfig.headwear !== 'hair' && (
                    <div className="flex items-center gap-2.5">
                      {HAT_COLORS.map((c) => {
                        const active = garageConfig.hatColor === c.hex;
                        return (
                          <button
                            key={c.hex}
                            type="button"
                            title={c.label}
                            onClick={() => {
                              soundEngine.playClick(false);
                              onChangeGarage({ ...garageConfig, hatColor: c.hex });
                            }}
                            style={{ backgroundColor: c.hex }}
                            className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-transform cursor-pointer ${
                              active
                                ? 'border-cyan-300 scale-110'
                                : 'border-white/20 hover:border-white/50'
                            }`}
                          >
                            {active && (
                              <Check
                                className={`w-3.5 h-3.5 ${
                                  c.hex === '#e7dfd3' ? 'text-slate-900' : 'text-white'
                                }`}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {/* Deck Shape */}
                <div>
                  <p className="text-[11px] font-bold tracking-[0.16em] text-slate-300 mb-2">
                    {isPt ? 'FORMATO DO SHAPE' : 'DECK SHAPE'}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {DECK_SHAPES.map((s) => {
                      const locked = isLocked(s.unlockId);
                      const active = (garageConfig.deckShape ?? 'street_popsicle') === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={locked}
                          title={locked ? getUnlockHint(s.unlockId) : undefined}
                          onClick={() => {
                            if (locked) return;
                            soundEngine.playClick(false);
                            onChangeGarage({ ...garageConfig, deckShape: s.id });
                          }}
                          className={`h-9 px-2 rounded-lg border text-[11px] font-semibold flex items-center justify-between ${
                            locked
                              ? 'bg-[#0b121b] border-white/5 text-slate-500 cursor-not-allowed'
                              : active
                                ? 'bg-[#12384b] border-[#38bdf8] text-white cursor-pointer'
                                : 'bg-[#131f2d] border-white/10 text-slate-300 cursor-pointer'
                          }`}
                        >
                          <span className="truncate">{isPt ? s.pt : s.en}</span>
                          {locked && <Lock className="w-3 h-3 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Deck Graphic */}
                <div>
                  <p className="text-[11px] font-bold tracking-[0.16em] text-slate-300 mb-2">
                    {isPt ? 'ARTE DO DECK' : 'DECK GRAPHIC'}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DECK_OPTIONS.map((d) => {
                      const locked = isLocked(d.unlockId);
                      const active = garageConfig.deckGraphic === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          disabled={locked}
                          title={locked ? getUnlockHint(d.unlockId) : undefined}
                          onClick={() => {
                            if (locked) return;
                            soundEngine.playClick(false);
                            onChangeGarage({ ...garageConfig, deckGraphic: d.id });
                          }}
                          className={`h-9 px-2.5 rounded-lg border text-xs font-semibold text-left flex items-center justify-between transition-colors ${
                            locked
                              ? 'bg-[#0b121b] border-white/5 text-slate-500 cursor-not-allowed'
                              : active
                                ? 'bg-[#12384b] border-[#38bdf8] text-white cursor-pointer'
                                : 'bg-[#131f2d] border-white/10 text-slate-300 hover:border-white/30 cursor-pointer'
                          }`}
                        >
                          <span className="truncate">{d.label}</span>
                          {locked ? (
                            <Lock className="w-3 h-3 shrink-0" />
                          ) : (
                            active && <Check className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Grip Tape */}
                <div>
                  <p className="text-[11px] font-bold tracking-[0.16em] text-slate-300 mb-2">
                    {isPt ? 'LIXA SUPERIOR' : 'GRIPTAPE'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {GRIP_OPTIONS.map((gr) => {
                      const locked = isLocked(gr.unlockId);
                      const active = (garageConfig.gripStyle ?? 'classic_black') === gr.id;
                      return (
                        <button
                          key={gr.id}
                          type="button"
                          disabled={locked}
                          title={locked ? getUnlockHint(gr.unlockId) : undefined}
                          onClick={() => {
                            if (locked) return;
                            soundEngine.playClick(false);
                            onChangeGarage({ ...garageConfig, gripStyle: gr.id });
                          }}
                          className={`h-8 px-2 rounded-lg border text-[11px] font-semibold flex items-center justify-between ${
                            locked
                              ? 'bg-[#0b121b] border-white/5 text-slate-500 cursor-not-allowed'
                              : active
                                ? 'bg-[#12384b] border-[#38bdf8] text-white cursor-pointer'
                                : 'bg-[#131f2d] border-white/10 text-slate-300 cursor-pointer'
                          }`}
                        >
                          <span className="truncate">{isPt ? gr.pt : gr.en}</span>
                          {locked && <Lock className="w-3 h-3 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Trucks Finish */}
                <div>
                  <p className="text-[11px] font-bold tracking-[0.16em] text-slate-300 mb-2">
                    TRUCKS
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TRUCK_OPTIONS.map((t) => {
                      const locked = isLocked(t.unlockId);
                      const active = garageConfig.truckFinish === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          disabled={locked}
                          title={locked ? getUnlockHint(t.unlockId) : undefined}
                          onClick={() => {
                            if (locked) return;
                            soundEngine.playClick(false);
                            onChangeGarage({ ...garageConfig, truckFinish: t.id });
                          }}
                          className={`h-9 px-3 rounded-lg border text-xs font-semibold text-left flex items-center justify-between transition-colors ${
                            locked
                              ? 'bg-[#0b121b] border-white/5 text-slate-500 cursor-not-allowed'
                              : active
                                ? 'bg-[#12384b] border-[#38bdf8] text-white cursor-pointer'
                                : 'bg-[#131f2d] border-white/10 text-slate-300 hover:border-white/30 cursor-pointer'
                          }`}
                        >
                          <span>{t.label}</span>
                          {locked ? (
                            <Lock className="w-3 h-3 shrink-0" />
                          ) : (
                            active && <Check className="w-3.5 h-3.5 text-[#38bdf8]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Wheels Color & Size */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.16em] text-slate-300 mb-2">
                      {isPt ? 'RODAS URETANO' : 'WHEELS'}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {WHEEL_COLORS.map((c) => {
                        const active = garageConfig.wheelColor === c.hex;
                        return (
                          <button
                            key={c.hex}
                            type="button"
                            title={c.label}
                            onClick={() => {
                              soundEngine.playClick(false);
                              onChangeGarage({ ...garageConfig, wheelColor: c.hex });
                            }}
                            style={{ backgroundColor: c.hex }}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform cursor-pointer ${
                              active
                                ? 'border-cyan-300 scale-110'
                                : 'border-white/25 hover:border-white/60'
                            }`}
                          >
                            {active && <Check className="w-3.5 h-3.5 text-slate-900" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold tracking-[0.16em] text-slate-300 mb-2">
                      {isPt ? 'TAMANHO' : 'SIZE'}
                    </p>
                    <div className="flex flex-col gap-1">
                      {WHEEL_SIZES.map((ws) => (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick(false);
                            onChangeGarage({ ...garageConfig, wheelSize: ws.id });
                          }}
                          className={`h-7 px-2 rounded border text-[10px] font-bold cursor-pointer ${
                            (garageConfig.wheelSize ?? 'park_56') === ws.id
                              ? 'bg-[#12384b] border-[#38bdf8] text-white'
                              : 'bg-[#131f2d] border-white/10 text-slate-300'
                          }`}
                        >
                          {ws.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bearings */}
                <div>
                  <p className="text-[11px] font-bold tracking-[0.16em] text-slate-300 mb-2">
                    {isPt ? 'ROLAMENTOS' : 'BEARINGS'}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {BEARING_OPTIONS.map((b) => {
                      const locked = isLocked(b.unlockId);
                      const active = (garageConfig.bearingFinish ?? 'steel') === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          disabled={locked}
                          title={locked ? getUnlockHint(b.unlockId) : undefined}
                          onClick={() => {
                            if (locked) return;
                            soundEngine.playClick(false);
                            onChangeGarage({ ...garageConfig, bearingFinish: b.id });
                          }}
                          className={`h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${
                            locked
                              ? 'bg-[#0b121b] border-white/5 text-slate-500 cursor-not-allowed'
                              : active
                                ? 'bg-[#12384b] border-[#38bdf8] text-white cursor-pointer'
                                : 'bg-[#131f2d] border-white/10 text-slate-300 cursor-pointer'
                          }`}
                        >
                          <span className="truncate">{b.label}</span>
                          {locked && <Lock className="w-3 h-3 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {onOpenCreator && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick(false);
                  onOpenCreator();
                }}
                className="w-full h-9 rounded-xl bg-[#131f2d] hover:bg-[#1a2b3d] border border-cyan-400/35 flex items-center justify-center gap-2 text-xs font-bold tracking-wider text-cyan-200 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>{isPt ? 'EDITOR COMPLETO (ROSTO, CABELO & ESTILO)' : 'FULL SKATER & BOARD EDITOR'}</span>
              </button>
            )}

            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick(false);
                  onChangeGarage(DEFAULT_GARAGE_CONFIG);
                }}
                className="h-10 px-3.5 rounded-xl bg-[#131f2d] hover:bg-[#1a2b3d] border border-white/12 flex items-center gap-2 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isPt ? 'Padrão' : 'Reset'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick(true);
                  onBack();
                }}
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-[#0e7490] to-[#178ea9] hover:from-[#1289a8] hover:to-[#1ea5c4] border border-cyan-300/35 text-xs font-bold tracking-[0.16em] text-white transition-colors cursor-pointer"
              >
                {isPt ? 'SALVAR E VOLTAR' : 'SAVE & RETURN'}
              </button>
            </div>
          </div>
        )}

        {/* 4. SETTINGS */}
        {activeScreen === 'settings' && (
          <div className="flex flex-col gap-4">
            {/* Master Volume */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-200 tracking-[0.12em]">
                  {isPt ? 'VOLUME GERAL' : 'MASTER VOLUME'}
                </span>
                <span className="text-[#38bdf8] tabular-nums">{settings.masterVolume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.masterVolume}
                onChange={(e) =>
                  onChangeSettings({ ...settings, masterVolume: Number(e.target.value) })
                }
                className="w-full accent-[#22b8cf] cursor-pointer"
              />
            </div>

            {/* SFX Volume */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-200 tracking-[0.12em]">
                  {isPt ? 'EFEITOS DE INTERFACE' : 'INTERFACE SFX'}
                </span>
                <span className="text-[#38bdf8] tabular-nums">{settings.sfxVolume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.sfxVolume}
                onChange={(e) =>
                  onChangeSettings({ ...settings, sfxVolume: Number(e.target.value) })
                }
                className="w-full accent-[#22b8cf] cursor-pointer"
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-2">
              {[
                {
                  key: 'ambienceEnabled' as const,
                  label: isPt ? 'Som Ambiente do Skatepark' : 'Skatepark Ambience',
                  val: settings.ambienceEnabled,
                },
                {
                  key: 'shadowsEnabled' as const,
                  label: isPt ? 'Sombras 3D Realistas' : 'Realistic 3D Shadows',
                  val: settings.shadowsEnabled,
                },
                {
                  key: 'cameraSwayEnabled' as const,
                  label: isPt ? 'Movimento Suave de Câmera' : 'Dynamic Camera Sway',
                  val: settings.cameraSwayEnabled,
                },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick(false);
                    onChangeSettings({ ...settings, [item.key]: !item.val });
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#131f2d] hover:bg-[#1a293a] border border-white/10 flex items-center justify-between text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  <span>{item.label}</span>
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider ${
                      item.val
                        ? 'bg-[#0e7490] text-white'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {item.val ? (isPt ? 'ON' : 'ON') : 'OFF'}
                  </span>
                </button>
              ))}
            </div>

            {/* Language Switcher */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-[0.12em] text-slate-200">
                {isPt ? 'IDIOMA' : 'LANGUAGE'}
              </span>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0a1119] border border-white/10">
                {(['pt', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick(false);
                      onChangeSettings({ ...settings, language: lang });
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-wider transition-colors cursor-pointer ${
                      settings.language === lang
                        ? 'bg-[#1587a3] text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom-Right Zoom Controls in Garage */}
      {activeScreen === 'garage' && onChangeShowcaseZoom && (
        <div className="pointer-events-auto self-end flex items-center gap-1.5 p-1.5 rounded-xl bg-[#0e1722]/90 border border-white/15 shadow-lg">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick(false);
              onChangeShowcaseZoom(Math.min(1.35, Number((showcaseZoom + 0.15).toFixed(2))));
            }}
            title={isPt ? 'Afastar' : 'Zoom Out'}
            className="w-8 h-8 rounded-lg bg-[#131f2d] hover:bg-[#1a293b] flex items-center justify-center text-white cursor-pointer"
          >
            <ZoomOut className="w-4 h-4 text-[#38bdf8]" />
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick(false);
              onChangeShowcaseZoom(Math.max(0.65, Number((showcaseZoom - 0.15).toFixed(2))));
            }}
            title={isPt ? 'Aproximar' : 'Zoom In'}
            className="w-8 h-8 rounded-lg bg-[#131f2d] hover:bg-[#1a293b] flex items-center justify-center text-white cursor-pointer"
          >
            <ZoomIn className="w-4 h-4 text-[#38bdf8]" />
          </button>
        </div>
      )}
    </motion.div>
  );
};
