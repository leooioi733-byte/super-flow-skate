import {
  GameplayRuleMode,
  NationalityCode,
  SkaterAppearance,
  SkaterAttributes,
  SkaterProfile,
} from './game';

export type CareerStylePreference = 'street' | 'park' | 'balanced';

export type ReputationTierId = 'amateur' | 'local_hero' | 'pro' | 'world_elite' | 'legend';

export type SeasonPhaseId =
  | 'opening_ceremony'
  | 'national_circuit'
  | 'international_circuit'
  | 'special_events'
  | 'world_championship'
  | 'closing_awards';

export type CareerCityId =
  | 'costa_azul'
  | 'sao_paulo'
  | 'barcelona'
  | 'tokyo'
  | 'venice_beach';

export interface PlayerCareerIdentity {
  competitorNumber: string; // FS-000
  jerseyNumber: string; // 00
  firstName: string;
  lastName: string;
  nickname: string;
  nationalityCode: NationalityCode;
  startingAge: number;
  currentAge: number;
  stylePreference: CareerStylePreference;
  reputationTier: ReputationTierId;
}

export interface UnlockableItem {
  id: string;
  category: 'top' | 'shoes' | 'deck_shape' | 'deck_graphic' | 'grip' | 'trucks' | 'wheels' | 'bearings' | 'accessory';
  value: string;
  labelPt: string;
  labelEn: string;
  unlockSourcePt: string;
  unlockSourceEn: string;
  minReputation?: number;
  sponsorId?: string;
}

export interface SpecialEventDef {
  id: string;
  title: string;
  ruleMode: Extract<GameplayRuleMode, 'night_session' | 'best_trick' | 'team_challenge' | 'big_air'>;
  atmosphere: 'day' | 'night';
  cityId: CareerCityId;
  durationSeconds: number;
  minReputation: number;
  rewardReputation: number;
  rewardCash: number;
  unlockItemId?: string;
  taglinePt: string;
  taglineEn: string;
  scoringNotePt: string;
  scoringNoteEn: string;
}

export interface SponsorContract {
  id: string;
  name: string;
  categoryPt: string;
  categoryEn: string;
  minReputation: number;
  durationEvents: number;
  remainingEvents: number;
  repBonusPct: number;
  cashPerEvent: number;
  unlockItemIds: string[];
  active: boolean;
  expiredBefore: boolean;
  perkPt: string;
  perkEn: string;
}

export interface AgentOpportunity {
  id: string;
  type: 'sponsor_offer' | 'last_minute_invite' | 'launch_event' | 'photo_gig' | 'video_gig' | 'training_camp';
  titlePt: string;
  titleEn: string;
  descPt: string;
  descEn: string;
  cityId: CareerCityId;
  ruleMode?: GameplayRuleMode;
  targetAttr?: keyof SkaterAttributes;
  sponsorId?: string;
  rewardRep: number;
  rewardCash: number;
  expiresLabelPt: string;
  expiresLabelEn: string;
  resolved: boolean;
}

export interface SkaterRelation {
  skaterId: string;
  friendship: number; // 0-100
  rivalryIntensity: number; // 0-100
  status: 'neutral' | 'friend' | 'rival';
  headToHeadWins: number;
  headToHeadLosses: number;
  lastMessagePt: string;
  lastMessageEn: string;
  activeChallenge?: {
    id: string;
    titlePt: string;
    titleEn: string;
    ruleMode: GameplayRuleMode;
    targetScore: number;
  } | null;
}

export interface PressInterviewOption {
  id: string;
  labelPt: string;
  labelEn: string;
  quotePt: string;
  quoteEn: string;
  repDelta: number;
  cashDelta: number;
  rivalryShift?: {
    targetSkaterId: string;
    rivalryDelta: number;
    friendshipDelta: number;
  };
}

export interface PressInterviewQuestion {
  id: string;
  outlet: string;
  contextEventTitle: string;
  questionPt: string;
  questionEn: string;
  options: PressInterviewOption[];
}

export interface MagazineIssue {
  id: string;
  season: number;
  issueNumber: number;
  headlinePt: string;
  headlineEn: string;
  subheadPt: string;
  subheadEn: string;
  featuredSkaterName: string;
  featuredCountry: NationalityCode;
  featuredAppearance: SkaterAppearance;
  featuredTrick: string;
  scoreLabel: string;
  excerptPt: string;
  excerptEn: string;
}

export interface ProVideoPart {
  id: string;
  season: number;
  title: string;
  cityName: string;
  highlightTrick: string;
  bestComboScore: number;
  views: number;
  repGained: number;
}

export interface CircuitNewsItem {
  id: string;
  season: number;
  category: 'victory' | 'ranking' | 'withdrawal' | 'rookie' | 'retirement' | 'record' | 'sponsor' | 'media' | 'duel';
  headlinePt: string;
  headlineEn: string;
  detailPt: string;
  detailEn: string;
  tagLabelPt: string;
  tagLabelEn: string;
}

export interface ParkTrackRecord {
  id: string;
  labelPt: string;
  labelEn: string;
  metricType: 'score' | 'best_trick' | 'big_air';
  value: number;
  unit: string;
  trickNote: string;
  holderId: string;
  holderName: string;
  isPlayer: boolean;
  season: number;
}

export interface SeasonAwardEntry {
  categoryPt: string;
  categoryEn: string;
  winnerName: string;
  winnerDetailPt: string;
  winnerDetailEn: string;
  isPlayer: boolean;
}

export interface SeasonAwardsCeremony {
  seasonNumber: number;
  year: number;
  awards: SeasonAwardEntry[];
}

export interface PastSeasonArchive {
  seasonNumber: number;
  year: number;
  worldChampionName: string;
  worldChampionCountry: NationalityCode;
  playerRank: number;
  playerPoints: number;
  podiumTop3: { name: string; country: NationalityCode; points: number }[];
  retiredNames: string[];
  rookieNames: string[];
  awards: SeasonAwardEntry[];
}

export interface CareerHallOfFame {
  titles: number;
  podiums: number;
  eventsEntered: number;
  seasonsCompleted: number;
  worldChampionships: number;
  specialEventWins: number;
  duelWins: number;
  personalBestRunScore: number;
  personalBestComboScore: number;
  personalBestComboTrick: string;
  personalMaxAirMeters: number;
  historicTricks: string[];
  iconicRivalries: string[];
  awardsWon: { season: number; awardPt: string; awardEn: string }[];
  retiredLegends: {
    name: string;
    country: NationalityCode;
    titles: number;
    specialtyPt: string;
    specialtyEn: string;
  }[];
}

export interface PlayerCareerStats {
  eventsEntered: number;
  wins: number;
  podiums: number;
  bails: number;
  seasonPoints: number;
  bestRunScore: number;
}

export interface CareerSaveState {
  version: number;
  created: boolean;
  identity: PlayerCareerIdentity;
  appearance: SkaterAppearance;
  attributes: SkaterAttributes;
  playerStats: PlayerCareerStats;
  reputation: number;
  cash: number;
  currentSeason: number;
  currentYear: number;
  currentPhase: SeasonPhaseId;
  activeCityId: CareerCityId;
  completedEventsInPhase: string[];
  specialEventsCompletedInSeason: string[];
  unlockedItems: string[];
  roster: SkaterProfile[];
  retiredRoster: SkaterProfile[];
  sponsors: SponsorContract[];
  agentOpportunities: AgentOpportunity[];
  relations: Record<string, SkaterRelation>;
  pendingInterview: PressInterviewQuestion | null;
  magazines: MagazineIssue[];
  videos: ProVideoPart[];
  newsFeed: CircuitNewsItem[];
  parkRecords: ParkTrackRecord[];
  pastSeasons: PastSeasonArchive[];
  lastCeremony: SeasonAwardsCeremony | null;
  hallOfFame: CareerHallOfFame;
}
