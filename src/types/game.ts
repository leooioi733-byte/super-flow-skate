export type ScreenId = 'home' | 'play' | 'career' | 'creator' | 'garage' | 'settings' | 'gameplay';

export type PlayModeId = 'free_skate' | 'trick_jam' | 'time_attack' | 'park_tour';

export type GameplayMode = 'free_skate' | 'competition';

export type GameplayRuleMode =
  | 'standard'
  | 'night_session'
  | 'best_trick'
  | 'team_challenge'
  | 'big_air'
  | 'training_session'
  | 'photo_shoot'
  | 'video_shoot'
  | 'duel_1v1';

export type CameraMode = 'third_person' | 'first_person';
export type ReplayCameraMode = 'cine' | 'third_person' | 'first_person' | 'free_orbit';
export type ReplaySpeedOption = 0.25 | 0.5 | 1 | 2;

export type HeadwearType = 'cap' | 'beanie' | 'hair';
export type DeckGraphicId =
  | 'flow_wave'
  | 'costa_azul'
  | 'street_stripes'
  | 'natural_maple'
  | 'night_neon'
  | 'world_gold'
  | 'tokyo_ink'
  | 'brazil_tropics';
export type TruckFinishId = 'chrome' | 'matte_black' | 'anodized_teal' | 'gold';
export type DeckShapeId = 'street_popsicle' | 'cruiser_shaped' | 'wide_pool';
export type GripTapeStyleId = 'classic_black' | 'cyan_stripe' | 'clear_wood' | 'checkered' | 'pro_red';
export type BearingFinishId = 'steel' | 'gold_ceramic' | 'cyan_swiss' | 'crimson_pro';
export type WheelSizeId = 'street_52' | 'park_56' | 'cruiser_60';
export type FaceModelId = 'classic' | 'angular' | 'broad' | 'youth';

export interface GarageConfig {
  shirtColor: string;
  shirtAccent: string;
  pantsColor: string;
  shoeColor: string;
  headwear: HeadwearType;
  hatColor: string;
  deckGraphic: DeckGraphicId;
  wheelColor: string;
  truckFinish: TruckFinishId;
  shoeAccent?: string;
  sockColor?: string;
  deckShape?: DeckShapeId;
  gripStyle?: GripTapeStyleId;
  bearingFinish?: BearingFinishId;
  wheelSize?: WheelSizeId;
}

export interface SettingsConfig {
  masterVolume: number;
  sfxVolume: number;
  ambienceEnabled: boolean;
  shadowsEnabled: boolean;
  cameraSwayEnabled: boolean;
  language: 'pt' | 'en';
}

export interface PlayModeInfo {
  id: PlayModeId;
  titlePt: string;
  titleEn: string;
  subtitlePt: string;
  subtitleEn: string;
  zoneFocus: 'bowl' | 'plaza' | 'rails' | 'overview';
  durationLabel: string;
  gameplayMode: GameplayMode;
}

export type TournamentRound = 'qualifier' | 'semifinal' | 'final';

export interface CareerEvent {
  id: string;
  stage: number;
  title: string;
  location: string;
  disciplinePt: string;
  disciplineEn: string;
  tier: 'regional' | 'national' | 'international' | 'special';
  roundStructure: TournamentRound[];
  unlocked: boolean;
  trophiesRequired: number;
  targetScore: number;
}

export type NationalityCode = 'BR' | 'US' | 'JP' | 'FR' | 'AU' | 'ES' | 'GB' | 'CA' | 'DE' | 'AR';

export type SkaterStyleId =
  | 'technical_street'
  | 'bowl_flow'
  | 'big_air'
  | 'all_around'
  | 'rail_specialist';

export interface SkaterAttributes {
  technicalSkill: number; // Habilidade técnica (1-99)
  boardControl: number; // Controle do skate (1-99)
  trickPrecision: number; // Precisão nas manobras (1-99)
  creativity: number; // Criatividade (1-99)
  consistency: number; // Consistência (1-99)
  competitiveExperience: number; // Experiência competitiva (1-99)
}

export interface SkaterCareerStats {
  eventsEntered: number;
  wins: number;
  losses: number;
  podiums: number;
  bails: number;
  bestRunScore: number;
  averageScore: number;
  seasonPoints: number;
  nationalRank: number;
  internationalRank: number;
  winStreak: number;
}

export interface SkaterResultRecord {
  eventId: string;
  eventTitle: string;
  tier: 'regional' | 'national' | 'international' | 'special';
  round: TournamentRound;
  season: number;
  placement: number;
  score: number;
  overallRating: number;
}

export interface RivalryRelation {
  rivalId: string;
  intensity: number; // 1-100
  labelPt: string;
  labelEn: string;
  headToHeadWins: number;
  headToHeadLosses: number;
}

export type SkaterBodyBuild = 'slim' | 'athletic' | 'stocky' | 'tall';
export type SkaterStance = 'regular' | 'goofy';
export type SkaterTopStyle = 'tee' | 'hoodie' | 'overshirt' | 'tank' | 'longsleeve' | 'windbreaker';
export type SkaterBottomStyle = 'baggy_jeans' | 'cargo_pants' | 'slim_chinos' | 'skate_shorts';
export type SkaterHairStyle =
  | 'short_tuft'
  | 'messy_curls'
  | 'ponytail'
  | 'bun'
  | 'buzz'
  | 'long_flow'
  | 'dreads'
  | 'side_part';
export type SkaterHeadwearStyle = 'cap' | 'backward_cap' | 'beanie' | 'bucket_hat' | 'none';
export type SkaterAccessoryStyle =
  | 'none'
  | 'sunglasses'
  | 'headphones'
  | 'backpack'
  | 'sweatband'
  | 'knee_pads'
  | 'chain';

export interface SkaterVisualModel {
  bodyBuild: SkaterBodyBuild;
  stance: SkaterStance;
  topStyle: SkaterTopStyle;
  bottomStyle: SkaterBottomStyle;
  hairStyle: SkaterHairStyle;
  headwearStyle: SkaterHeadwearStyle;
  accessory: SkaterAccessoryStyle;
  secondaryColor: string;
  faceModel?: FaceModelId;
}

export interface SkaterAppearance {
  skinColor: string;
  hairColor: string;
  outfit: GarageConfig;
  visualModel: SkaterVisualModel;
}

export interface SkaterProfile {
  id: string;
  competitorNumber: string; // e.g. 'FS-001'
  jerseyNumber: string; // e.g. '01'
  firstName: string;
  lastName: string;
  nickname: string;
  nationalityCode: NationalityCode;
  nationalityPt: string;
  nationalityEn: string;
  age: number;
  style: SkaterStyleId;
  personalityPt: string;
  personalityEn: string;
  bioPt: string;
  bioEn: string;
  featuredInPark: boolean;
  appearance: SkaterAppearance;
  attributes: SkaterAttributes;
  stats: SkaterCareerStats;
  history: SkaterResultRecord[];
  rivalries: RivalryRelation[];
}

export interface NpcLiveStatus {
  skaterId: string;
  competitorNumber: string;
  name: string;
  nationalityCode: NationalityCode;
  style: SkaterStyleId;
  liveScore: number;
  tricksLanded: number;
  bails: number;
  lastTrickName: string | null;
  state: 'grounded' | 'airborne' | 'grinding' | 'crashed' | 'getting_up';
}

export interface ChampionshipInvite {
  id: string;
  titlePt: string;
  titleEn: string;
  location: string;
  minInternationalRank: number;
  rewardPoints: number;
  unlocked: boolean;
}

export interface CareerSeasonScaffold {
  seasonYear: number;
  currentRound: TournamentRound;
  standingsScope: 'international' | 'national';
  invites: ChampionshipInvite[];
}

export type TrickCategory = 'basic' | 'advanced' | 'grab' | 'grind';

export type TrickId =
  | 'ollie'
  | 'nollie'
  | 'kickflip'
  | 'heelflip'
  | 'pop_shove_it'
  | 'shove_it_360'
  | 'flip_360'
  | 'varial_kickflip'
  | 'hardflip'
  | 'inward_heelflip'
  | 'fs_180'
  | 'bs_180'
  | 'fs_360'
  | 'bs_360'
  | 'indy'
  | 'melon'
  | 'method'
  | 'nose_grab'
  | 'tail_grab'
  | 'grind_50_50'
  | 'grind_5_0'
  | 'nosegrind'
  | 'boardslide'
  | 'lipslide';

export interface ComboEntry {
  id: TrickId;
  name: string;
  points: number;
  category: TrickCategory;
}

export type LandingOutcome = 'perfect' | 'sketchy' | 'bail' | null;

export interface CompetitionScores {
  difficulty: number; // 0 - 10
  execution: number; // 0 - 10
  variety: number; // 0 - 10
  amplitude: number; // 0 - 10
  flow: number; // 0 - 10
  overall: number; // 0 - 100
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  overallRating: number;
  isPlayer?: boolean;
  skaterId?: string;
  competitorNumber?: string;
  nationalityCode?: NationalityCode;
  highlightNote?: string;
}

export interface GameplaySessionConfig {
  mode: GameplayMode;
  eventTitle: string;
  source: 'quick_play' | 'career';
  ruleMode: GameplayRuleMode;
  atmosphere: 'day' | 'night';
  durationSeconds?: number;
  careerEventId?: string;
  careerActivityId?: string;
  rivalSkaterIds?: string[];
  teammateSkaterIds?: string[];
  trainingTargetAttr?: keyof SkaterAttributes;
  targetScore?: number;
  playerDisplayName?: string;
  playerNationalityCode?: NationalityCode;
}

export interface GameplayRunSummary {
  eventTitle: string;
  ruleMode: GameplayRuleMode;
  score: number;
  bestComboScore: number;
  bestComboLabel: string;
  maxAirHeightMeters: number;
  landedTricksCount: number;
  uniqueTricksCount: number;
  bailsCount: number;
  overallRating: number;
  placement: number;
  teamScore?: number;
  rivalTeamScore?: number;
  leaderboard: LeaderboardEntry[];
  npcLiveStatuses: NpcLiveStatus[];
  highlightedTricks: string[];
}

export interface GameplayHudState {
  mode: GameplayMode;
  ruleMode: GameplayRuleMode;
  eventTitle: string;
  score: number;
  bestComboScore: number;
  bestComboLabel: string;
  maxAirHeightMeters: number;
  landedTricksCount: number;
  speedKmh: number;
  cameraMode: CameraMode;
  airborne: boolean;
  grinding: boolean;
  crashed: boolean;
  grindBalance: number; // -1 to 1
  activeTrickName: string | null;
  comboTricks: ComboEntry[];
  comboBasePoints: number;
  comboMultiplier: number;
  landingOutcome: LandingOutcome;
  landingMessage: string | null;
  timeRemaining: number; // seconds for competition
  runFinished: boolean;
  paused: boolean;
  competitionScores: CompetitionScores | null;
  leaderboard: LeaderboardEntry[];
  activeParkNpcs?: NpcLiveStatus[];
  isTrainingOrShoot?: boolean;
  teamScore?: number;
  rivalTeamScore?: number;
  teamLabel?: string;
  targetScore?: number;
  trainingAttrLabel?: string;
  hasReplay?: boolean;
  summary?: GameplayRunSummary;
}

export interface ReplayHudState {
  active: boolean;
  playing: boolean;
  currentTime: number;
  duration: number;
  speed: ReplaySpeedOption;
  cameraMode: ReplayCameraMode;
  hasFrames: boolean;
  activeTrickName: string | null;
  comboTricks: ComboEntry[];
  comboBasePoints: number;
  comboMultiplier: number;
  landingOutcome: LandingOutcome;
  landingMessage: string | null;
  score: number;
  speedKmh: number;
}

export interface VirtualInputState {
  moveX: number; // -1 to 1
  moveY: number; // -1 (brake) to +1 (push)
  sprint: boolean;
  crouching: boolean;
  ollieTrigger: number; // increment counter to edge-trigger
  nollieTrigger: number;
  trickTrigger: { id: TrickId; seq: number } | null;
  grabHeld: TrickId | null;
  spinDir: -1 | 0 | 1;
}

export const DEFAULT_GARAGE_CONFIG: GarageConfig = {
  shirtColor: '#1997b3',
  shirtAccent: '#ffffff',
  pantsColor: '#253140',
  shoeColor: '#e2e8f0',
  shoeAccent: '#1997b3',
  sockColor: '#f1f5f9',
  headwear: 'cap',
  hatColor: '#141c26',
  deckGraphic: 'flow_wave',
  deckShape: 'street_popsicle',
  gripStyle: 'classic_black',
  wheelColor: '#38bdf8',
  wheelSize: 'park_56',
  truckFinish: 'chrome',
  bearingFinish: 'steel',
};

export const DEFAULT_PLAYER_APPEARANCE: SkaterAppearance = {
  skinColor: '#d19870',
  hairColor: '#1e1613',
  outfit: DEFAULT_GARAGE_CONFIG,
  visualModel: {
    bodyBuild: 'athletic',
    stance: 'regular',
    topStyle: 'tee',
    bottomStyle: 'baggy_jeans',
    hairStyle: 'short_tuft',
    headwearStyle: 'cap',
    accessory: 'none',
    secondaryColor: '#38bdf8',
    faceModel: 'classic',
  },
};

export const DEFAULT_SETTINGS_CONFIG: SettingsConfig = {
  masterVolume: 75,
  sfxVolume: 85,
  ambienceEnabled: true,
  shadowsEnabled: true,
  cameraSwayEnabled: true,
  language: 'pt',
};

export const PLAY_MODES: PlayModeInfo[] = [
  {
    id: 'free_skate',
    titlePt: 'FREE SKATE',
    titleEn: 'FREE SKATE',
    subtitlePt: 'Sessão aberta por todo o skatepark Costa Azul sem limite de tempo.',
    subtitleEn: 'Open session across the entire Costa Azul skatepark with no timer.',
    zoneFocus: 'overview',
    durationLabel: 'OPEN',
    gameplayMode: 'free_skate',
  },
  {
    id: 'trick_jam',
    titlePt: 'COMPETIÇÃO PARK',
    titleEn: 'PARK COMPETITION',
    subtitlePt: 'Runs oficiais de 45 segundos avaliadas por dificuldade, execução, variedade, amplitude e fluidez.',
    subtitleEn: 'Official 45-second runs judged on difficulty, execution, variety, amplitude, and flow.',
    zoneFocus: 'bowl',
    durationLabel: '0:45 RUN',
    gameplayMode: 'competition',
  },
  {
    id: 'time_attack',
    titlePt: 'STREET CONTEST',
    titleEn: 'STREET CONTEST',
    subtitlePt: 'Campeonato técnico nos corrimãos, ledges e funbox com ranking final.',
    subtitleEn: 'Technical contest across rails, ledges, and the funbox with final standings.',
    zoneFocus: 'rails',
    durationLabel: '0:45 RUN',
    gameplayMode: 'competition',
  },
  {
    id: 'park_tour',
    titlePt: 'BOWL JAM',
    titleEn: 'BOWL JAM',
    subtitlePt: 'Sessão livre com foco nas transições, coping e grandes aéreos do skatepark.',
    subtitleEn: 'Free session focused on transitions, coping grinds, and big skatepark airs.',
    zoneFocus: 'plaza',
    durationLabel: 'OPEN',
    gameplayMode: 'free_skate',
  },
];

export const CAREER_EVENTS: CareerEvent[] = [
  {
    id: 'costa_azul_open',
    stage: 1,
    title: 'COSTA AZUL OPEN',
    location: 'Costa Azul Skateplaza',
    disciplinePt: 'Qualificatória Skate Park · 45s',
    disciplineEn: 'Skate Park Qualifiers · 45s',
    tier: 'regional',
    roundStructure: ['qualifier', 'final'],
    unlocked: true,
    trophiesRequired: 0,
    targetScore: 4200,
  },
  {
    id: 'sunset_bowl_jam',
    stage: 2,
    title: 'SUNSET BOWL JAM',
    location: 'Deep Pool Arena',
    disciplinePt: 'Vertical Flow & Air · 45s',
    disciplineEn: 'Vertical Flow & Air · 45s',
    tier: 'national',
    roundStructure: ['qualifier', 'semifinal', 'final'],
    unlocked: true,
    trophiesRequired: 1,
    targetScore: 6800,
  },
  {
    id: 'downtown_rails',
    stage: 3,
    title: 'DOWNTOWN RAILS',
    location: 'Urban Plaza Set',
    disciplinePt: 'Technical Grind Series · 45s',
    disciplineEn: 'Technical Grind Series · 45s',
    tier: 'international',
    roundStructure: ['qualifier', 'semifinal', 'final'],
    unlocked: false,
    trophiesRequired: 3,
    targetScore: 9500,
  },
  {
    id: 'flow_world_finals',
    stage: 4,
    title: 'FLOW WORLD FINALS',
    location: 'Main Stadium Park',
    disciplinePt: 'Championship Run · 45s',
    disciplineEn: 'Championship Run · 45s',
    tier: 'special',
    roundStructure: ['qualifier', 'semifinal', 'final'],
    unlocked: false,
    trophiesRequired: 6,
    targetScore: 13000,
  },
];
