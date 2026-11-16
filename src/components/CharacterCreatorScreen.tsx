import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Lock,
  Shuffle,
  Sparkles,
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
  DEFAULT_PLAYER_APPEARANCE,
  FaceModelId,
  GripTapeStyleId,
  NationalityCode,
  SkaterAccessoryStyle,
  SkaterAppearance,
  SkaterBodyBuild,
  SkaterBottomStyle,
  SkaterHairStyle,
  SkaterHeadwearStyle,
  SkaterStance,
  SkaterTopStyle,
  TruckFinishId,
  WheelSizeId,
} from '../types/game';
import { CareerStylePreference, PlayerCareerIdentity } from '../types/career';
import { CAREER_UNLOCKABLES, isCareerItemUnlocked } from '../data/careerSystem';
import { soundEngine } from '../audio/soundEngine';
import { CountryFlag, SkaterPortrait } from './SkaterPortrait';

interface CharacterCreatorScreenProps {
  language: 'pt' | 'en';
  isEditing: boolean;
  initialIdentity?: PlayerCareerIdentity;
  initialAppearance?: SkaterAppearance;
  unlockedItems: string[];
  liveAppearance: SkaterAppearance;
  onUpdateLiveAppearance: (next: SkaterAppearance) => void;
  showcaseZoom: number;
  onChangeShowcaseZoom: (zoom: number) => void;
  showcaseFocus: 'full' | 'head' | 'board';
  onChangeShowcaseFocus: (focus: 'full' | 'head' | 'board') => void;
  onConfirm: (
    identity: Omit<
      PlayerCareerIdentity,
      'competitorNumber' | 'jerseyNumber' | 'currentAge' | 'reputationTier'
    >,
    appearance: SkaterAppearance,
  ) => void;
  onBack: () => void;
}

type CreatorTab = 'identity' | 'body' | 'apparel' | 'board' | 'style';

const NATIONALITIES: { code: NationalityCode; labelPt: string; labelEn: string }[] = [
  { code: 'BR', labelPt: 'Brasil', labelEn: 'Brazil' },
  { code: 'US', labelPt: 'EUA', labelEn: 'USA' },
  { code: 'JP', labelPt: 'Japão', labelEn: 'Japan' },
  { code: 'FR', labelPt: 'França', labelEn: 'France' },
  { code: 'AU', labelPt: 'Austrália', labelEn: 'Australia' },
  { code: 'ES', labelPt: 'Espanha', labelEn: 'Spain' },
  { code: 'GB', labelPt: 'Reino Unido', labelEn: 'UK' },
  { code: 'CA', labelPt: 'Canadá', labelEn: 'Canada' },
  { code: 'DE', labelPt: 'Alemanha', labelEn: 'Germany' },
  { code: 'AR', labelPt: 'Argentina', labelEn: 'Argentina' },
];

const SKIN_TONES = ['#f2cbb0', '#e5bc98', '#d19870', '#b57b52', '#8c5838', '#5c3824'];
const HAIR_COLORS = ['#1b1512', '#3d281c', '#7a4b2a', '#c99746', '#9e2a2b', '#e2e8f0', '#0e7490'];
const CLOTHING_PALETTE = [
  '#1997b3',
  '#1b222c',
  '#e14b4b',
  '#f8fafc',
  '#d8c5a3',
  '#2e6f57',
  '#f59e0b',
  '#3b82f6',
  '#7c3aed',
];
const PANTS_PALETTE = ['#253140', '#181d24', '#8f7b5d', '#3d4a3a', '#31445e', '#47362b'];
const WHEEL_PALETTE = ['#38bdf8', '#f1f5f9', '#f59e0b', '#34d399', '#fb7185', '#a855f7'];

const BODY_BUILDS: { id: SkaterBodyBuild; pt: string; en: string }[] = [
  { id: 'slim', pt: 'Leve', en: 'Slim' },
  { id: 'athletic', pt: 'Atlético', en: 'Athletic' },
  { id: 'stocky', pt: 'Forte', en: 'Stocky' },
  { id: 'tall', pt: 'Alto', en: 'Tall' },
];

const FACE_MODELS: { id: FaceModelId; pt: string; en: string }[] = [
  { id: 'classic', pt: 'Clássico', en: 'Classic' },
  { id: 'angular', pt: 'Angular', en: 'Angular' },
  { id: 'broad', pt: 'Largo', en: 'Broad' },
  { id: 'youth', pt: 'Jovem', en: 'Youth' },
];

const HAIR_STYLES: { id: SkaterHairStyle; pt: string; en: string }[] = [
  { id: 'short_tuft', pt: 'Topete Curto', en: 'Short Tuft' },
  { id: 'messy_curls', pt: 'Cacheado', en: 'Messy Curls' },
  { id: 'side_part', pt: 'Dividido', en: 'Side Part' },
  { id: 'buzz', pt: 'Raspado', en: 'Buzz Cut' },
  { id: 'ponytail', pt: 'Rabo', en: 'Ponytail' },
  { id: 'bun', pt: 'Coque', en: 'Bun' },
  { id: 'long_flow', pt: 'Longo', en: 'Long Flow' },
  { id: 'dreads', pt: 'Dreads', en: 'Dreads' },
];

const TOP_STYLES: { id: SkaterTopStyle; pt: string; en: string; unlockId?: string }[] = [
  { id: 'tee', pt: 'Camiseta', en: 'T-Shirt' },
  { id: 'hoodie', pt: 'Moletom', en: 'Hoodie' },
  { id: 'tank', pt: 'Regata', en: 'Tank Top' },
  { id: 'longsleeve', pt: 'Manga Longa', en: 'Longsleeve' },
  { id: 'overshirt', pt: 'Sobreposta', en: 'Overshirt', unlockId: 'unlock_top_overshirt' },
  { id: 'windbreaker', pt: 'Corta-Vento', en: 'Windbreaker', unlockId: 'unlock_top_windbreaker' },
];

const BOTTOM_STYLES: { id: SkaterBottomStyle; pt: string; en: string }[] = [
  { id: 'baggy_jeans', pt: 'Calça Larga', en: 'Baggy Jeans' },
  { id: 'cargo_pants', pt: 'Calça Cargo', en: 'Cargo Pants' },
  { id: 'slim_chinos', pt: 'Chino Slim', en: 'Slim Chinos' },
  { id: 'skate_shorts', pt: 'Bermuda', en: 'Skate Shorts' },
];

const HEADWEAR_STYLES: { id: SkaterHeadwearStyle; pt: string; en: string }[] = [
  { id: 'cap', pt: 'Boné Frente', en: 'Front Cap' },
  { id: 'backward_cap', pt: 'Boné Trás', en: 'Back Cap' },
  { id: 'beanie', pt: 'Touca', en: 'Beanie' },
  { id: 'bucket_hat', pt: 'Bucket', en: 'Bucket Hat' },
  { id: 'none', pt: 'Sem Boné', en: 'None' },
];

const ACCESSORIES: { id: SkaterAccessoryStyle; pt: string; en: string; unlockId?: string }[] = [
  { id: 'none', pt: 'Nenhum', en: 'None' },
  { id: 'sunglasses', pt: 'Óculos', en: 'Sunglasses' },
  { id: 'backpack', pt: 'Mochila', en: 'Backpack' },
  { id: 'sweatband', pt: 'Faixa', en: 'Headband' },
  { id: 'knee_pads', pt: 'Joelheira', en: 'Knee Pads' },
  { id: 'headphones', pt: 'Headphones', en: 'Headphones', unlockId: 'unlock_acc_headphones' },
  { id: 'chain', pt: 'Corrente', en: 'Chain', unlockId: 'unlock_acc_chain' },
];

const DECK_SHAPES: { id: DeckShapeId; pt: string; en: string; unlockId?: string }[] = [
  { id: 'street_popsicle', pt: 'Street 8.25"', en: 'Street 8.25"' },
  { id: 'cruiser_shaped', pt: 'Cruiser Shaped', en: 'Shaped Cruiser', unlockId: 'unlock_shape_cruiser' },
  { id: 'wide_pool', pt: 'Wide Pool 8.75"', en: 'Wide Pool 8.75"', unlockId: 'unlock_shape_wide_pool' },
];

const DECK_GRAPHICS: { id: DeckGraphicId; label: string; unlockId?: string }[] = [
  { id: 'flow_wave', label: 'Flow Wave' },
  { id: 'costa_azul', label: 'Costa Azul' },
  { id: 'street_stripes', label: 'Street Stripes' },
  { id: 'natural_maple', label: '7-Ply Maple' },
  { id: 'brazil_tropics', label: 'Brasil Tropics', unlockId: 'unlock_deck_brazil_tropics' },
  { id: 'night_neon', label: 'Night Neon', unlockId: 'unlock_deck_night_neon' },
  { id: 'tokyo_ink', label: 'Tokyo Ink', unlockId: 'unlock_deck_tokyo_ink' },
  { id: 'world_gold', label: 'World Champ Gold', unlockId: 'unlock_deck_world_gold' },
];

const GRIP_STYLES: { id: GripTapeStyleId; pt: string; en: string; unlockId?: string }[] = [
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
  { id: 'street_52', label: '52mm Street' },
  { id: 'park_56', label: '56mm Park' },
  { id: 'cruiser_60', label: '60mm Pool' },
];

const BEARING_OPTIONS: { id: BearingFinishId; label: string; unlockId?: string }[] = [
  { id: 'steel', label: 'ABEC Steel' },
  { id: 'crimson_pro', label: 'Crimson Pro' },
  { id: 'cyan_swiss', label: 'Swiss Cyan', unlockId: 'unlock_bearing_cyan' },
  { id: 'gold_ceramic', label: 'Gold Ceramic', unlockId: 'unlock_bearing_gold' },
];

const STYLE_CARDS: {
  id: CareerStylePreference;
  titlePt: string;
  titleEn: string;
  descPt: string;
  descEn: string;
  stats: { tech: number; ctrl: number; prec: number; crea: number; cons: number };
}[] = [
  {
    id: 'street',
    titlePt: 'Street Técnico',
    titleEn: 'Technical Street',
    descPt: 'Foco em flips rápidos, precisão em corrimãos e criatividade técnica.',
    descEn: 'Focused on technical flip tricks, rail precision, and creative lines.',
    stats: { tech: 66, ctrl: 61, prec: 65, crea: 63, cons: 60 },
  },
  {
    id: 'park',
    titlePt: 'Park & Transições',
    titleEn: 'Park & Bowl Flow',
    descPt: 'Controle superior em rampas, velocidade constante e aéreos fluidos.',
    descEn: 'Superior transition control, steady speed, and fluid bowl airs.',
    stats: { tech: 60, ctrl: 67, prec: 61, crea: 64, cons: 63 },
  },
  {
    id: 'balanced',
    titlePt: 'Equilibrado (All-Around)',
    titleEn: 'Balanced All-Around',
    descPt: 'Versátil em qualquer pista: street, bowl, big air e team challenges.',
    descEn: 'Versatile across street plazas, deep bowls, big air, and team formats.',
    stats: { tech: 63, ctrl: 63, prec: 63, crea: 63, cons: 62 },
  },
];

export const CharacterCreatorScreen: React.FC<CharacterCreatorScreenProps> = ({
  language,
  isEditing,
  initialIdentity,
  initialAppearance,
  unlockedItems,
  liveAppearance,
  onUpdateLiveAppearance,
  showcaseZoom,
  onChangeShowcaseZoom,
  showcaseFocus,
  onChangeShowcaseFocus,
  onConfirm,
  onBack,
}) => {
  const isPt = language === 'pt';
  const [tab, setTab] = useState<CreatorTab>('identity');

  const [firstName, setFirstName] = useState<string>(
    isEditing && initialIdentity ? initialIdentity.firstName : 'Rafael',
  );
  const [lastName, setLastName] = useState<string>(
    isEditing && initialIdentity ? initialIdentity.lastName : 'Costa',
  );
  const [nickname, setNickname] = useState<string>(
    isEditing && initialIdentity ? initialIdentity.nickname : 'Flow',
  );
  const [nationalityCode, setNationalityCode] = useState<NationalityCode>(
    isEditing && initialIdentity ? initialIdentity.nationalityCode : 'BR',
  );
  const [startingAge, setStartingAge] = useState<number>(
    isEditing && initialIdentity ? initialIdentity.startingAge : 18,
  );
  const [stylePreference, setStylePreference] = useState<CareerStylePreference>(
    isEditing && initialIdentity ? initialIdentity.stylePreference : 'balanced',
  );

  // Use initialAppearance if provided when mounting
  const app = liveAppearance || initialAppearance || DEFAULT_PLAYER_APPEARANCE;

  const isLocked = (unlockId?: string) => {
    if (!unlockId) return false;
    return !isCareerItemUnlocked(unlockId, unlockedItems);
  };

  const getUnlockHint = (unlockId?: string) => {
    if (!unlockId) return '';
    const item = CAREER_UNLOCKABLES.find((u) => u.id === unlockId);
    if (!item) return '';
    return isPt ? item.unlockSourcePt : item.unlockSourceEn;
  };

  const patchOutfit = (patch: Partial<SkaterAppearance['outfit']>) => {
    const nextOutfit = { ...app.outfit, ...patch };
    // Keep headwear synced between legacy outfit.headwear and visualModel.headwearStyle
    onUpdateLiveAppearance({ ...app, outfit: nextOutfit });
  };

  const patchModel = (patch: Partial<SkaterAppearance['visualModel']>) => {
    const nextModel = { ...app.visualModel, ...patch };
    const nextOutfit = { ...app.outfit };
    if (patch.headwearStyle) {
      nextOutfit.headwear =
        patch.headwearStyle === 'none'
          ? 'hair'
          : patch.headwearStyle === 'beanie'
            ? 'beanie'
            : 'cap';
    }
    if (patch.secondaryColor) {
      nextOutfit.shirtAccent = patch.secondaryColor;
    }
    onUpdateLiveAppearance({ ...app, outfit: nextOutfit, visualModel: nextModel });
  };

  const handleRandomize = () => {
    soundEngine.playClick(false);
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const availableTops = TOP_STYLES.filter((t) => !isLocked(t.unlockId));
    const availableAcc = ACCESSORIES.filter((a) => !isLocked(a.unlockId));
    const availableShapes = DECK_SHAPES.filter((d) => !isLocked(d.unlockId));
    const availableGraphics = DECK_GRAPHICS.filter((g) => !isLocked(g.unlockId));
    const availableGrips = GRIP_STYLES.filter((g) => !isLocked(g.unlockId));
    const availableTrucks = TRUCK_OPTIONS.filter((t) => !isLocked(t.unlockId));
    const availableBearings = BEARING_OPTIONS.filter((b) => !isLocked(b.unlockId));

    const headwearStyle = pick(HEADWEAR_STYLES).id;
    const secondary = pick(CLOTHING_PALETTE);
    onUpdateLiveAppearance({
      skinColor: pick(SKIN_TONES),
      hairColor: pick(HAIR_COLORS),
      outfit: {
        shirtColor: pick(CLOTHING_PALETTE),
        shirtAccent: secondary,
        pantsColor: pick(PANTS_PALETTE),
        shoeColor: pick(['#e2e8f0', '#181d24', '#b91c1c', '#1697b5', '#f59e0b']),
        shoeAccent: secondary,
        sockColor: pick(['#f1f5f9', '#181d24', '#38bdf8']),
        headwear: headwearStyle === 'none' ? 'hair' : headwearStyle === 'beanie' ? 'beanie' : 'cap',
        hatColor: pick(['#141c26', '#148aa5', '#b82835', '#e7dfd3']),
        deckGraphic: pick(availableGraphics).id,
        deckShape: pick(availableShapes).id,
        gripStyle: pick(availableGrips).id,
        wheelColor: pick(WHEEL_PALETTE),
        wheelSize: pick(WHEEL_SIZES).id,
        truckFinish: pick(availableTrucks).id,
        bearingFinish: pick(availableBearings).id,
      },
      visualModel: {
        bodyBuild: pick(BODY_BUILDS).id,
        stance: Math.random() > 0.45 ? 'regular' : 'goofy',
        topStyle: pick(availableTops).id,
        bottomStyle: pick(BOTTOM_STYLES).id,
        hairStyle: pick(HAIR_STYLES).id,
        headwearStyle,
        accessory: pick(availableAcc).id,
        secondaryColor: secondary,
        faceModel: pick(FACE_MODELS).id,
      },
    });
  };

  const canSubmit = useMemo(
    () => firstName.trim().length >= 2 && lastName.trim().length >= 2,
    [firstName, lastName],
  );

  const handleSubmit = () => {
    if (!canSubmit) return;
    soundEngine.playClick(true);
    onConfirm(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nickname: nickname.trim() || firstName.trim(),
        nationalityCode,
        startingAge,
        stylePreference,
      },
      app,
    );
  };

  const tabs: { id: CreatorTab; labelPt: string; labelEn: string }[] = [
    { id: 'identity', labelPt: 'Identidade', labelEn: 'Identity' },
    { id: 'body', labelPt: 'Físico & Rosto', labelEn: 'Body & Face' },
    { id: 'apparel', labelPt: 'Roupas', labelEn: 'Apparel' },
    { id: 'board', labelPt: 'Skate', labelEn: 'Board' },
    { id: 'style', labelPt: 'Estilo', labelEn: 'Style' },
  ];

  return (
    <motion.div
      key="creator"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-20 pointer-events-none flex items-stretch justify-between p-3 sm:p-6"
    >
      {/* LEFT DRAWER: Full Skater & Skateboard Creator (Right side remains open for interactive 3D drag/zoom) */}
      <div className="pointer-events-auto w-full max-w-[495px] flex flex-col gap-2.5 max-h-[calc(100vh-24px)]">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playBack();
              onBack();
            }}
            className="h-10 px-3.5 rounded-xl bg-[#0e1722]/90 hover:bg-[#172536] border border-white/15 flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#38bdf8]" />
            <span>{isPt ? 'VOLTAR' : 'BACK'}</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <User className="w-4 h-4 text-[#38bdf8] shrink-0" />
            <h1 className="text-sm sm:text-base font-extrabold tracking-[0.16em] text-white truncate">
              {isEditing
                ? isPt
                  ? 'EDITAR SKATISTA'
                  : 'EDIT SKATER'
                : isPt
                  ? 'CRIAR SKATISTA'
                  : 'SKATER CREATOR'}
            </h1>
          </div>

          <button
            type="button"
            onClick={handleRandomize}
            title={isPt ? 'Gerar Visual Aleatório' : 'Randomize Appearance'}
            className="h-10 px-3 rounded-xl bg-[#0e1722]/90 hover:bg-[#172536] border border-white/15 flex items-center gap-1.5 text-[11px] font-bold text-[#38bdf8] cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isPt ? 'Aleatório' : 'Random'}</span>
          </button>
        </div>

        {/* Main Card Body */}
        <div className="flex-1 min-h-0 flex flex-col rounded-2xl bg-[#0e1722]/92 border border-white/15 shadow-[0_18px_48px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Horizontal Tabs */}
          <div className="p-1.5 bg-[#091018] border-b border-white/10 flex items-center gap-1 overflow-x-auto flow-scroll">
            {tabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick(false);
                    setTab(t.id);
                    if (t.id === 'board') onChangeShowcaseFocus('board');
                    else if (t.id === 'body') onChangeShowcaseFocus('head');
                    else onChangeShowcaseFocus('full');
                  }}
                  className={`h-9 px-3 rounded-lg text-[11px] font-bold tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1587a3] text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isPt ? t.labelPt : t.labelEn}
                </button>
              );
            })}
          </div>

          {/* Scrollable Form Region */}
          <div className="flex-1 min-h-0 overflow-y-auto flow-scroll p-4 flex flex-col gap-4">
            {/* TAB 1: IDENTITY */}
            {tab === 'identity' && (
              <>
                {/* Live Portrait Preview Banner */}
                <div className="p-3 rounded-xl bg-[#131f2d] border border-white/10 flex items-center gap-3.5">
                  <SkaterPortrait
                    customAppearance={app}
                    jerseyNumber="00"
                    label={`${firstName} ${lastName}`}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold tracking-[0.2em] text-[#38bdf8] tabular-nums">
                      FS-000 · {isEditing && initialIdentity ? initialIdentity.reputationTier.toUpperCase() : isPt ? 'AMADOR' : 'AMATEUR'}
                    </div>
                    <div className="text-base font-extrabold text-white truncate mt-0.5">
                      {firstName || '---'} &ldquo;{nickname || 'Flow'}&rdquo; {lastName || '---'}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-300">
                      <CountryFlag code={nationalityCode} />
                      <span>
                        {NATIONALITIES.find((n) => n.code === nationalityCode)?.[isPt ? 'labelPt' : 'labelEn']} · {startingAge}{' '}
                        {isPt ? 'anos' : 'yrs'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1 uppercase">
                      {isPt ? 'Nome' : 'First Name'}
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-[#0a1119] border border-white/15 focus:border-[#38bdf8] outline-none text-xs font-semibold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1 uppercase">
                      {isPt ? 'Sobrenome' : 'Last Name'}
                    </label>
                    <input
                      type="text"
                      maxLength={18}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-[#0a1119] border border-white/15 focus:border-[#38bdf8] outline-none text-xs font-semibold text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1 uppercase">
                      {isPt ? 'Apelido' : 'Nickname'}
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-[#0a1119] border border-white/15 focus:border-[#38bdf8] outline-none text-xs font-semibold text-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1 uppercase">
                      <span>{isPt ? 'Idade Inicial' : 'Starting Age'}</span>
                      <span className="text-[#38bdf8] tabular-nums">{startingAge}</span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={26}
                      disabled={isEditing}
                      value={startingAge}
                      onChange={(e) => setStartingAge(Number(e.target.value))}
                      className="w-full h-10 accent-[#22b8cf] cursor-pointer disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                    {isPt ? 'Nacionalidade' : 'Nationality'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {NATIONALITIES.map((nat) => {
                      const active = nationalityCode === nat.code;
                      return (
                        <button
                          key={nat.code}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick(false);
                            setNationalityCode(nat.code);
                          }}
                          className={`h-9 px-2.5 rounded-lg border flex items-center gap-2 text-xs font-semibold cursor-pointer ${
                            active
                              ? 'bg-[#12384b] border-[#38bdf8] text-white'
                              : 'bg-[#131f2d] border-white/10 text-slate-300 hover:border-white/30'
                          }`}
                        >
                          <CountryFlag code={nat.code} className="w-4 h-3 rounded-[2px]" />
                          <span className="truncate">{isPt ? nat.labelPt : nat.labelEn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: BODY & FACE */}
            {tab === 'body' && (
              <>
                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                    {isPt ? 'Biotipo Físico' : 'Body Build'}
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BODY_BUILDS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick(false);
                          patchModel({ bodyBuild: b.id });
                        }}
                        className={`h-9 rounded-lg border text-xs font-semibold cursor-pointer ${
                          app.visualModel.bodyBuild === b.id
                            ? 'bg-[#12384b] border-[#38bdf8] text-white'
                            : 'bg-[#131f2d] border-white/10 text-slate-300'
                        }`}
                      >
                        {isPt ? b.pt : b.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                    {isPt ? 'Formato de Rosto' : 'Face Model'}
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {FACE_MODELS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick(false);
                          patchModel({ faceModel: f.id });
                        }}
                        className={`h-9 rounded-lg border text-xs font-semibold cursor-pointer ${
                          (app.visualModel.faceModel ?? 'classic') === f.id
                            ? 'bg-[#12384b] border-[#38bdf8] text-white'
                            : 'bg-[#131f2d] border-white/10 text-slate-300'
                        }`}
                      >
                        {isPt ? f.pt : f.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                    {isPt ? 'Tom de Pele' : 'Skin Tone'}
                  </p>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {SKIN_TONES.map((hex) => {
                      const active = app.skinColor === hex;
                      return (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick(false);
                            onUpdateLiveAppearance({ ...app, skinColor: hex });
                          }}
                          style={{ backgroundColor: hex }}
                          className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center cursor-pointer ${
                            active ? 'border-[#38bdf8] scale-110' : 'border-white/20'
                          }`}
                        >
                          {active && <Check className="w-4 h-4 text-slate-900" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                    {isPt ? 'Estilo de Cabelo' : 'Hair Style'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {HAIR_STYLES.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick(false);
                          patchModel({ hairStyle: h.id });
                        }}
                        className={`h-9 px-2 rounded-lg border text-[11px] font-semibold truncate cursor-pointer ${
                          app.visualModel.hairStyle === h.id
                            ? 'bg-[#12384b] border-[#38bdf8] text-white'
                            : 'bg-[#131f2d] border-white/10 text-slate-300'
                        }`}
                      >
                        {isPt ? h.pt : h.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                    {isPt ? 'Cor do Cabelo' : 'Hair Color'}
                  </p>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {HAIR_COLORS.map((hex) => {
                      const active = app.hairColor === hex;
                      return (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick(false);
                            onUpdateLiveAppearance({ ...app, hairColor: hex });
                          }}
                          style={{ backgroundColor: hex }}
                          className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center cursor-pointer ${
                            active ? 'border-[#38bdf8] scale-110' : 'border-white/20'
                          }`}
                        >
                          {active && (
                            <Check
                              className={`w-3.5 h-3.5 ${hex === '#e2e8f0' ? 'text-slate-900' : 'text-white'}`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* TAB 3: APPAREL & ACCESSORIES */}
            {tab === 'apparel' && (
              <>
                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                    {isPt ? 'Peça Superior' : 'Top Style'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {TOP_STYLES.map((t) => {
                      const locked = isLocked(t.unlockId);
                      const active = app.visualModel.topStyle === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          disabled={locked}
                          title={locked ? getUnlockHint(t.unlockId) : undefined}
                          onClick={() => {
                            if (locked) return;
                            soundEngine.playClick(false);
                            patchModel({ topStyle: t.id });
                          }}
                          className={`h-9 px-2.5 rounded-lg border flex items-center justify-between text-[11px] font-semibold ${
                            locked
                              ? 'bg-[#0b121b] border-white/5 text-slate-500 cursor-not-allowed'
                              : active
                                ? 'bg-[#12384b] border-[#38bdf8] text-white cursor-pointer'
                                : 'bg-[#131f2d] border-white/10 text-slate-300 cursor-pointer'
                          }`}
                        >
                          <span className="truncate">{isPt ? t.pt : t.en}</span>
                          {locked && <Lock className="w-3 h-3 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                      {isPt ? 'Cor da Roupa' : 'Top Color'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {CLOTHING_PALETTE.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick(false);
                            patchOutfit({ shirtColor: hex });
                          }}
                          style={{ backgroundColor: hex }}
                          className={`w-7 h-7 rounded-md border-2 cursor-pointer ${
                            app.outfit.shirtColor === hex ? 'border-[#38bdf8] scale-110' : 'border-white/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                      {isPt ? 'Detalhes / Estampa' : 'Accent Color'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {CLOTHING_PALETTE.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick(false);
                            patchModel({ secondaryColor: hex });
                          }}
                          style={{ backgroundColor: hex }}
                          className={`w-7 h-7 rounded-md border-2 cursor-pointer ${
                            app.visualModel.secondaryColor === hex ? 'border-[#38bdf8] scale-110' : 'border-white/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                    {isPt ? 'Calça / Bermuda' : 'Bottoms'}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {BOTTOM_STYLES.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick(false);
                          patchModel({ bottomStyle: b.id });
                        }}
                        className={`h-9 rounded-lg border text-xs font-semibold cursor-pointer ${
                          app.visualModel.bottomStyle === b.id
                            ? 'bg-[#12384b] border-[#38bdf8] text-white'
                            : 'bg-[#131f2d] border-white/10 text-slate-300'
                        }`}
                      >
                        {isPt ? b.pt : b.en}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PANTS_PALETTE.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick(false);
                          patchOutfit({ pantsColor: hex });
                        }}
                        style={{ backgroundColor: hex }}
                        className={`w-7 h-7 rounded-md border-2 cursor-pointer ${
                          app.outfit.pantsColor === hex ? 'border-[#38bdf8] scale-110' : 'border-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                      {isPt ? 'Tênis' : 'Shoes'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['#e2e8f0', '#181d24', '#b91c1c', '#1697b5', '#f59e0b'].map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick(false);
                            patchOutfit({ shoeColor: hex });
                          }}
                          style={{ backgroundColor: hex }}
                          className={`w-7 h-7 rounded-md border-2 cursor-pointer ${
                            app.outfit.shoeColor === hex ? 'border-[#38bdf8] scale-110' : 'border-white/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                      {isPt ? 'Meias' : 'Socks'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['#f1f5f9', '#181d24', '#38bdf8', '#dc2626', '#facc15'].map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick(false);
                            patchOutfit({ sockColor: hex });
                          }}
                          style={{ backgroundColor: hex }}
                          className={`w-7 h-7 rounded-md border-2 cursor-pointer ${
                            (app.outfit.sockColor ?? '#f1f5f9') === hex
                              ? 'border-[#38bdf8] scale-110'
                              : 'border-white/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                    {isPt ? 'Boné / Chapéu / Touca' : 'Headwear'}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {HEADWEAR_STYLES.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick(false);
                          patchModel({ headwearStyle: h.id });
                        }}
                        className={`h-8 px-2 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                          app.visualModel.headwearStyle === h.id
                            ? 'bg-[#12384b] border-[#38bdf8] text-white'
                            : 'bg-[#131f2d] border-white/10 text-slate-300'
                        }`}
                      >
                        {isPt ? h.pt : h.en}
                      </button>
                    ))}
                  </div>
                  {app.visualModel.headwearStyle !== 'none' && (
                    <div className="flex items-center gap-2">
                      {['#141c26', '#148aa5', '#b82835', '#e7dfd3', '#2e6f57'].map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick(false);
                            patchOutfit({ hatColor: hex });
                          }}
                          style={{ backgroundColor: hex }}
                          className={`w-7 h-7 rounded-md border-2 cursor-pointer ${
                            app.outfit.hatColor === hex ? 'border-[#38bdf8] scale-110' : 'border-white/20'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                    {isPt ? 'Acessórios' : 'Accessories'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {ACCESSORIES.map((a) => {
                      const locked = isLocked(a.unlockId);
                      const active = app.visualModel.accessory === a.id;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          disabled={locked}
                          title={locked ? getUnlockHint(a.unlockId) : undefined}
                          onClick={() => {
                            if (locked) return;
                            soundEngine.playClick(false);
                            patchModel({ accessory: a.id });
                          }}
                          className={`h-8 px-2.5 rounded-lg border flex items-center justify-between text-[11px] font-semibold ${
                            locked
                              ? 'bg-[#0b121b] border-white/5 text-slate-500 cursor-not-allowed'
                              : active
                                ? 'bg-[#12384b] border-[#38bdf8] text-white cursor-pointer'
                                : 'bg-[#131f2d] border-white/10 text-slate-300 cursor-pointer'
                          }`}
                        >
                          <span className="truncate">{isPt ? a.pt : a.en}</span>
                          {locked && <Lock className="w-3 h-3 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* TAB 4: SKATEBOARD FULL SETUP */}
            {tab === 'board' && (
              <>
                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                    STANCE
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['regular', 'goofy'] as SkaterStance[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick(false);
                          patchModel({ stance: st });
                        }}
                        className={`h-9 rounded-lg border text-xs font-bold uppercase tracking-wider cursor-pointer ${
                          app.visualModel.stance === st
                            ? 'bg-[#12384b] border-[#38bdf8] text-white'
                            : 'bg-[#131f2d] border-white/10 text-slate-300'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                    {isPt ? 'Formato do Shape' : 'Deck Shape'}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {DECK_SHAPES.map((d) => {
                      const locked = isLocked(d.unlockId);
                      const active = (app.outfit.deckShape ?? 'street_popsicle') === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          disabled={locked}
                          title={locked ? getUnlockHint(d.unlockId) : undefined}
                          onClick={() => {
                            if (locked) return;
                            soundEngine.playClick(false);
                            patchOutfit({ deckShape: d.id });
                          }}
                          className={`h-9 px-2 rounded-lg border flex items-center justify-between text-[11px] font-semibold ${
                            locked
                              ? 'bg-[#0b121b] border-white/5 text-slate-500 cursor-not-allowed'
                              : active
                                ? 'bg-[#12384b] border-[#38bdf8] text-white cursor-pointer'
                                : 'bg-[#131f2d] border-white/10 text-slate-300 cursor-pointer'
                          }`}
                        >
                          <span className="truncate">{isPt ? d.pt : d.en}</span>
                          {locked && <Lock className="w-3 h-3 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                    {isPt ? 'Estampa Inferior do Deck' : 'Bottom Deck Graphic'}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DECK_GRAPHICS.map((g) => {
                      const locked = isLocked(g.unlockId);
                      const active = app.outfit.deckGraphic === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          disabled={locked}
                          title={locked ? getUnlockHint(g.unlockId) : undefined}
                          onClick={() => {
                            if (locked) return;
                            soundEngine.playClick(false);
                            patchOutfit({ deckGraphic: g.id });
                          }}
                          className={`h-9 px-2.5 rounded-lg border flex items-center justify-between text-xs font-semibold ${
                            locked
                              ? 'bg-[#0b121b] border-white/5 text-slate-500 cursor-not-allowed'
                              : active
                                ? 'bg-[#12384b] border-[#38bdf8] text-white cursor-pointer'
                                : 'bg-[#131f2d] border-white/10 text-slate-300 cursor-pointer'
                          }`}
                        >
                          <span className="truncate">{g.label}</span>
                          {locked && <Lock className="w-3 h-3 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                    {isPt ? 'Lixa Superior (Griptape)' : 'Top Griptape'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {GRIP_STYLES.map((gr) => {
                      const locked = isLocked(gr.unlockId);
                      const active = (app.outfit.gripStyle ?? 'classic_black') === gr.id;
                      return (
                        <button
                          key={gr.id}
                          type="button"
                          disabled={locked}
                          title={locked ? getUnlockHint(gr.unlockId) : undefined}
                          onClick={() => {
                            if (locked) return;
                            soundEngine.playClick(false);
                            patchOutfit({ gripStyle: gr.id });
                          }}
                          className={`h-8 px-2 rounded-lg border flex items-center justify-between text-[11px] font-semibold ${
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

                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                    TRUCKS
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TRUCK_OPTIONS.map((t) => {
                      const locked = isLocked(t.unlockId);
                      const active = app.outfit.truckFinish === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          disabled={locked}
                          title={locked ? getUnlockHint(t.unlockId) : undefined}
                          onClick={() => {
                            if (locked) return;
                            soundEngine.playClick(false);
                            patchOutfit({ truckFinish: t.id });
                          }}
                          className={`h-8 px-2.5 rounded-lg border flex items-center justify-between text-xs font-semibold ${
                            locked
                              ? 'bg-[#0b121b] border-white/5 text-slate-500 cursor-not-allowed'
                              : active
                                ? 'bg-[#12384b] border-[#38bdf8] text-white cursor-pointer'
                                : 'bg-[#131f2d] border-white/10 text-slate-300 cursor-pointer'
                          }`}
                        >
                          <span>{t.label}</span>
                          {locked && <Lock className="w-3 h-3 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                      {isPt ? 'Cor das Rodas' : 'Wheel Color'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {WHEEL_PALETTE.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick(false);
                            patchOutfit({ wheelColor: hex });
                          }}
                          style={{ backgroundColor: hex }}
                          className={`w-7 h-7 rounded-full border-2 cursor-pointer ${
                            app.outfit.wheelColor === hex ? 'border-[#38bdf8] scale-110' : 'border-white/25'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                      {isPt ? 'Tamanho Roda' : 'Wheel Size'}
                    </p>
                    <div className="flex flex-col gap-1">
                      {WHEEL_SIZES.map((ws) => (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick(false);
                            patchOutfit({ wheelSize: ws.id });
                          }}
                          className={`h-7 px-2 rounded border text-[10px] font-bold cursor-pointer ${
                            (app.outfit.wheelSize ?? 'park_56') === ws.id
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

                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 mb-1.5 uppercase">
                    {isPt ? 'Rolamentos' : 'Bearings'}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {BEARING_OPTIONS.map((b) => {
                      const locked = isLocked(b.unlockId);
                      const active = (app.outfit.bearingFinish ?? 'steel') === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          disabled={locked}
                          title={locked ? getUnlockHint(b.unlockId) : undefined}
                          onClick={() => {
                            if (locked) return;
                            soundEngine.playClick(false);
                            patchOutfit({ bearingFinish: b.id });
                          }}
                          className={`h-8 px-2.5 rounded-lg border flex items-center justify-between text-xs font-semibold ${
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
              </>
            )}

            {/* TAB 5: CAREER STYLE & CONFIRMATION */}
            {tab === 'style' && (
              <>
                <div className="flex flex-col gap-2">
                  {STYLE_CARDS.map((st) => {
                    const active = stylePreference === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        disabled={isEditing}
                        onClick={() => {
                          if (isEditing) return;
                          soundEngine.playClick(false);
                          setStylePreference(st.id);
                        }}
                        className={`p-3 rounded-xl border text-left transition-colors ${
                          isEditing ? 'opacity-80 cursor-default' : 'cursor-pointer'
                        } ${
                          active
                            ? 'bg-[#12384b] border-[#38bdf8]'
                            : 'bg-[#131f2d] border-white/10 hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold tracking-wider text-white uppercase">
                            {isPt ? st.titlePt : st.titleEn}
                          </span>
                          {active && <Check className="w-4 h-4 text-[#38bdf8]" />}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-300">
                          {isPt ? st.descPt : st.descEn}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-[10px] font-bold text-cyan-200 tabular-nums">
                          <span>TEC {st.stats.tech}</span>
                          <span>CTRL {st.stats.ctrl}</span>
                          <span>PREC {st.stats.prec}</span>
                          <span>CRIA {st.stats.crea}</span>
                          <span>CONS {st.stats.cons}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Final Registration Card */}
                <div className="p-3.5 rounded-xl bg-[#091119] border border-cyan-400/35">
                  <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#38bdf8]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isPt ? 'FICHA OFICIAL DO COMPETIDOR' : 'OFFICIAL ATHLETE CARD'}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <SkaterPortrait
                      customAppearance={app}
                      jerseyNumber="00"
                      label={`${firstName} ${lastName}`}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="font-extrabold text-white truncate">
                        {firstName} &ldquo;{nickname}&rdquo; {lastName}
                      </div>
                      <div className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5">
                        <CountryFlag code={nationalityCode} className="w-4 h-3 rounded-[2px]" />
                        <span>
                          FS-000 · {startingAge} {isPt ? 'anos' : 'yrs'} ·{' '}
                          {isEditing ? (isPt ? 'Carreira Ativa' : 'Active Career') : isPt ? 'Categoria Amador' : 'Amateur Bracket'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sticky Bottom Confirm Action */}
          <div className="p-3.5 bg-[#091018] border-t border-white/10 flex items-center gap-2.5">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#0e7490] to-[#178ea9] hover:from-[#1289a8] hover:to-[#1ea5c4] disabled:opacity-45 border border-cyan-300/35 flex items-center justify-center gap-2 text-xs font-extrabold tracking-[0.18em] text-white cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {isEditing
                  ? isPt
                    ? 'SALVAR ALTERAÇÕES'
                    : 'SAVE CHANGES'
                  : isPt
                    ? 'CONFIRMAR E INICIAR CARREIRA'
                    : 'CONFIRM & START CAREER'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM-RIGHT FLOATING 3D VIEWER CONTROLS (Does not obstruct rotating the 3D skater!) */}
      <div className="pointer-events-auto self-end flex flex-col items-end gap-2">
        <div className="p-2 rounded-xl bg-[#0e1722]/90 border border-white/15 flex items-center gap-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.45)]">
          {(
            [
              { id: 'full', label: isPt ? 'Corpo' : 'Body' },
              { id: 'head', label: isPt ? 'Rosto' : 'Face' },
              { id: 'board', label: 'Skate' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                soundEngine.playClick(false);
                onChangeShowcaseFocus(f.id);
              }}
              className={`h-8 px-2.5 rounded-lg text-[11px] font-bold tracking-wider cursor-pointer ${
                showcaseFocus === f.id
                  ? 'bg-[#1587a3] text-white'
                  : 'bg-[#131f2d] text-slate-300 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}

          <div className="w-px h-5 bg-white/15 mx-0.5" />

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

        <div className="px-3 py-1 rounded-lg bg-[#0e1722]/85 border border-white/10 text-[10px] font-semibold tracking-wider text-slate-300 flex items-center gap-1.5">
          <Wrench className="w-3 h-3 text-[#38bdf8]" />
          <span>{isPt ? 'Arraste para girar · Scroll para zoom' : 'Drag to rotate · Scroll to zoom'}</span>
        </div>
      </div>
    </motion.div>
  );
};
