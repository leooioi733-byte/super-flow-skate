import {
  AgentOpportunity,
  CareerCityId,
  CareerSaveState,
  CircuitNewsItem,
  MagazineIssue,
  ParkTrackRecord,
  PastSeasonArchive,
  PlayerCareerIdentity,
  PressInterviewQuestion,
  ProVideoPart,
  ReputationTierId,
  SeasonAwardEntry,
  SeasonAwardsCeremony,
  SeasonPhaseId,
  SkaterRelation,
  SpecialEventDef,
  SponsorContract,
  UnlockableItem,
} from '../types/career';
import {
  CAREER_EVENTS,
  DEFAULT_PLAYER_APPEARANCE,
  GameplayRunSummary,
  NationalityCode,
  SkaterAppearance,
  SkaterAttributes,
  SkaterProfile,
} from '../types/game';
import {
  computeSkaterOverall,
  rankInternationalRoster,
  rankNationalRoster,
  SKATER_ROSTER,
} from './skaterRoster';

const STORAGE_KEY = 'flow_skate_career_v1';

export const CAREER_CITIES: {
  id: CareerCityId;
  name: string;
  countryCode: NationalityCode;
  spotPt: string;
  spotEn: string;
  travelCost: number;
}[] = [
  {
    id: 'costa_azul',
    name: 'Costa Azul',
    countryCode: 'BR',
    spotPt: 'Praça Beira-Mar & Deep Bowl',
    spotEn: 'Seafront Plaza & Deep Bowl',
    travelCost: 0,
  },
  {
    id: 'sao_paulo',
    name: 'São Paulo',
    countryCode: 'BR',
    spotPt: 'Sampa Urban Dome & Rails',
    spotEn: 'Sampa Urban Dome & Rails',
    travelCost: 220,
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    countryCode: 'ES',
    spotPt: 'MACBA Marble Plaza',
    spotEn: 'MACBA Marble Plaza',
    travelCost: 420,
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    countryCode: 'JP',
    spotPt: 'Tokyo Bay Night Arena',
    spotEn: 'Tokyo Bay Night Arena',
    travelCost: 520,
  },
  {
    id: 'venice_beach',
    name: 'Venice Beach',
    countryCode: 'US',
    spotPt: 'Pacific Concrete Bowl',
    spotEn: 'Pacific Concrete Bowl',
    travelCost: 480,
  },
];

export const REPUTATION_TIERS: {
  id: ReputationTierId;
  minRep: number;
  labelPt: string;
  labelEn: string;
}[] = [
  { id: 'amateur', minRep: 0, labelPt: 'Amador', labelEn: 'Amateur' },
  { id: 'local_hero', minRep: 200, labelPt: 'Destaque Local', labelEn: 'Local Hero' },
  { id: 'pro', minRep: 550, labelPt: 'Profissional', labelEn: 'Pro Skater' },
  { id: 'world_elite', minRep: 1100, labelPt: 'Elite Mundial', labelEn: 'World Elite' },
  { id: 'legend', minRep: 2000, labelPt: 'Lenda do Skate', labelEn: 'Skate Legend' },
];

export function getReputationTier(rep: number): (typeof REPUTATION_TIERS)[number] {
  let active = REPUTATION_TIERS[0];
  for (const tier of REPUTATION_TIERS) {
    if (rep >= tier.minRep) active = tier;
  }
  return active;
}

export const SEASON_PHASES: {
  id: SeasonPhaseId;
  titlePt: string;
  titleEn: string;
  descPt: string;
  descEn: string;
}[] = [
  {
    id: 'opening_ceremony',
    titlePt: 'Cerimônia de Abertura',
    titleEn: 'Opening Ceremony',
    descPt: 'Apresentação oficial dos competidores, mídia e metas da temporada.',
    descEn: 'Official athlete presentation, media day, and season goals.',
  },
  {
    id: 'national_circuit',
    titlePt: 'Circuito Nacional',
    titleEn: 'National Circuit',
    descPt: 'Etapas classificatórias em Costa Azul e São Paulo valendo ranking nacional.',
    descEn: 'National tour stops in Costa Azul & Sao Paulo for domestic rankings.',
  },
  {
    id: 'international_circuit',
    titlePt: 'Circuito Internacional',
    titleEn: 'International Circuit',
    descPt: 'Disputa contra a elite mundial em Barcelona e Venice Beach.',
    descEn: 'Global stops against top world skaters in Barcelona & Venice Beach.',
  },
  {
    id: 'special_events',
    titlePt: 'Eventos Especiais',
    titleEn: 'Special Events',
    descPt: 'Night Session, Best Trick, Team Challenge e Big Air com regras únicas.',
    descEn: 'Night Session, Best Trick, Team Challenge, and Big Air showcases.',
  },
  {
    id: 'world_championship',
    titlePt: 'Campeonato Mundial',
    titleEn: 'World Championship',
    descPt: 'Grande final anual valendo o troféu mundial e entrada no Hall da Fama.',
    descEn: 'Annual World Finals for the championship crown and Hall of Fame glory.',
  },
  {
    id: 'closing_awards',
    titlePt: 'Premiação de Encerramento',
    titleEn: 'Closing Awards',
    descPt: 'Entrega dos troféus anuais e evolução de todo o elenco para o próximo ano.',
    descEn: 'Annual season trophies and full roster evolution into next year.',
  },
];

export const SPECIAL_EVENTS: SpecialEventDef[] = [
  {
    id: 'sp_night_session',
    title: 'NIGHT SESSION TOKYO',
    ruleMode: 'night_session',
    atmosphere: 'night',
    cityId: 'tokyo',
    durationSeconds: 45,
    minReputation: 0,
    rewardReputation: 140,
    rewardCash: 450,
    unlockItemId: 'unlock_deck_night_neon',
    taglinePt: 'Iluminação noturna especial · Bônus 1.18× em combos limpos.',
    taglineEn: 'Midnight floodlights · 1.18× clean combo bonus.',
    scoringNotePt: 'Pontuação total com bônus noturno de fluidez.',
    scoringNoteEn: 'Total score with nocturnal flow multiplier.',
  },
  {
    id: 'sp_best_trick',
    title: 'BEST TRICK PRO',
    ruleMode: 'best_trick',
    atmosphere: 'day',
    cityId: 'barcelona',
    durationSeconds: 35,
    minReputation: 120,
    rewardReputation: 165,
    rewardCash: 550,
    unlockItemId: 'unlock_grip_pro_red',
    taglinePt: 'Vence quem acertar o combo/manobra única de maior valor em 35s.',
    taglineEn: 'Winner decided by single highest-scoring trick/combo in 35s.',
    scoringNotePt: 'Conta apenas seu MAIOR combo aterrissado.',
    scoringNoteEn: 'Only your SINGLE BEST landed combo counts.',
  },
  {
    id: 'sp_team_challenge',
    title: 'TEAM CHALLENGE',
    ruleMode: 'team_challenge',
    atmosphere: 'day',
    cityId: 'sao_paulo',
    durationSeconds: 45,
    minReputation: 180,
    rewardReputation: 180,
    rewardCash: 620,
    unlockItemId: 'unlock_top_windbreaker',
    taglinePt: 'Sua equipe (você + 2 skatistas aliados) contra o esquadrão rival.',
    taglineEn: 'Your 3-rider squad (you + 2 allies) vs rival team score.',
    scoringNotePt: 'Pontuação coletiva somando sua run + aliados.',
    scoringNoteEn: 'Collective score combining your run + teammates.',
  },
  {
    id: 'sp_big_air',
    title: 'BIG AIR INVITATIONAL',
    ruleMode: 'big_air',
    atmosphere: 'day',
    cityId: 'venice_beach',
    durationSeconds: 35,
    minReputation: 250,
    rewardReputation: 210,
    rewardCash: 750,
    unlockItemId: 'unlock_shape_wide_pool',
    taglinePt: 'Foco em altura máxima de salto, aéreos e grabs (+950 pts/metro).',
    taglineEn: 'Focused on max jump altitude, big airs, and grabs (+950 pts/meter).',
    scoringNotePt: 'Altura máxima + bônus de 1.35× em grabs aéreos.',
    scoringNoteEn: 'Max air height bonus + 1.35× aerial grab multiplier.',
  },
];

export const CAREER_UNLOCKABLES: UnlockableItem[] = [
  {
    id: 'unlock_top_windbreaker',
    category: 'top',
    value: 'windbreaker',
    labelPt: 'Jaqueta Corta-Vento Pro',
    labelEn: 'Pro Windbreaker',
    unlockSourcePt: 'Team Challenge / Reputação 220',
    unlockSourceEn: 'Team Challenge / 220 Rep',
    minReputation: 220,
  },
  {
    id: 'unlock_top_overshirt',
    category: 'top',
    value: 'overshirt',
    labelPt: 'Camisa Sobreposta Street',
    labelEn: 'Street Overshirt',
    unlockSourcePt: 'Reputação 120',
    unlockSourceEn: '120 Reputation',
    minReputation: 120,
  },
  {
    id: 'unlock_acc_headphones',
    category: 'accessory',
    value: 'headphones',
    labelPt: 'Headphones Studio Flow',
    labelEn: 'Flow Studio Headphones',
    unlockSourcePt: 'Reputação 150',
    unlockSourceEn: '150 Reputation',
    minReputation: 150,
  },
  {
    id: 'unlock_acc_chain',
    category: 'accessory',
    value: 'chain',
    labelPt: 'Corrente Metálica Street',
    labelEn: 'Street Metal Chain',
    unlockSourcePt: 'Patrocínio Flow Originals',
    unlockSourceEn: 'Flow Originals Sponsor',
    sponsorId: 'sponsor_flow_originals',
    minReputation: 450,
  },
  {
    id: 'unlock_deck_night_neon',
    category: 'deck_graphic',
    value: 'night_neon',
    labelPt: 'Deck Night Neon Edition',
    labelEn: 'Night Neon Pro Deck',
    unlockSourcePt: 'Night Session / Reputação 300',
    unlockSourceEn: 'Night Session / 300 Rep',
    minReputation: 300,
  },
  {
    id: 'unlock_deck_tokyo_ink',
    category: 'deck_graphic',
    value: 'tokyo_ink',
    labelPt: 'Deck Tokyo Ink Pro',
    labelEn: 'Tokyo Ink Pro Deck',
    unlockSourcePt: 'Patrocínio Kuroi Decks',
    unlockSourceEn: 'Kuroi Decks Sponsor',
    sponsorId: 'sponsor_kuroi',
    minReputation: 500,
  },
  {
    id: 'unlock_deck_brazil_tropics',
    category: 'deck_graphic',
    value: 'brazil_tropics',
    labelPt: 'Deck Brasil Tropics',
    labelEn: 'Brazil Tropics Deck',
    unlockSourcePt: 'Patrocínio Costa Azul Surf',
    unlockSourceEn: 'Costa Azul Sponsor',
    sponsorId: 'sponsor_costa_azul',
    minReputation: 180,
  },
  {
    id: 'unlock_deck_world_gold',
    category: 'deck_graphic',
    value: 'world_gold',
    labelPt: 'Deck Campeão Mundial Gold',
    labelEn: 'World Champion Gold Deck',
    unlockSourcePt: 'Campeão Mundial ou Reputação 1200',
    unlockSourceEn: 'World Title or 1200 Rep',
    minReputation: 1200,
  },
  {
    id: 'unlock_shape_cruiser',
    category: 'deck_shape',
    value: 'cruiser_shaped',
    labelPt: 'Shape Cruiser Old-School',
    labelEn: 'Shaped Cruiser Deck',
    unlockSourcePt: 'Reputação 160',
    unlockSourceEn: '160 Reputation',
    minReputation: 160,
  },
  {
    id: 'unlock_shape_wide_pool',
    category: 'deck_shape',
    value: 'wide_pool',
    labelPt: 'Shape Wide Pool 8.75"',
    labelEn: 'Wide Pool 8.75" Deck',
    unlockSourcePt: 'Big Air / Reputação 350',
    unlockSourceEn: 'Big Air / 350 Rep',
    minReputation: 350,
  },
  {
    id: 'unlock_grip_checkered',
    category: 'grip',
    value: 'checkered',
    labelPt: 'Lixa Checkered Classic',
    labelEn: 'Checkered Grip Tape',
    unlockSourcePt: 'Reputação 100',
    unlockSourceEn: '100 Reputation',
    minReputation: 100,
  },
  {
    id: 'unlock_grip_pro_red',
    category: 'grip',
    value: 'pro_red',
    labelPt: 'Lixa Pro Crimson Stripe',
    labelEn: 'Pro Crimson Grip',
    unlockSourcePt: 'Best Trick / Reputação 260',
    unlockSourceEn: 'Best Trick / 260 Rep',
    minReputation: 260,
  },
  {
    id: 'unlock_bearing_cyan',
    category: 'bearings',
    value: 'cyan_swiss',
    labelPt: 'Rolamentos Swiss Cyan',
    labelEn: 'Swiss Cyan Bearings',
    unlockSourcePt: 'Patrocínio Apex Bearings',
    unlockSourceEn: 'Apex Bearings Sponsor',
    sponsorId: 'sponsor_apex',
    minReputation: 140,
  },
  {
    id: 'unlock_bearing_gold',
    category: 'bearings',
    value: 'gold_ceramic',
    labelPt: 'Rolamentos Gold Ceramic',
    labelEn: 'Gold Ceramic Bearings',
    unlockSourcePt: 'Reputação 650',
    unlockSourceEn: '650 Reputation',
    minReputation: 650,
  },
  {
    id: 'unlock_truck_gold',
    category: 'trucks',
    value: 'gold',
    labelPt: 'Trucks Raw Gold Titanium',
    labelEn: 'Raw Gold Titanium Trucks',
    unlockSourcePt: 'Patrocínio Volt Trucks / Rep 420',
    unlockSourceEn: 'Volt Trucks / 420 Rep',
    sponsorId: 'sponsor_volt',
    minReputation: 420,
  },
];

export const INITIAL_SPONSORS: SponsorContract[] = [
  {
    id: 'sponsor_costa_azul',
    name: 'Costa Azul Skate Co.',
    categoryPt: 'Confecção & Shape Local',
    categoryEn: 'Local Apparel & Shapes',
    minReputation: 80,
    durationEvents: 4,
    remainingEvents: 4,
    repBonusPct: 12,
    cashPerEvent: 160,
    unlockItemIds: ['unlock_deck_brazil_tropics'],
    active: false,
    expiredBefore: false,
    perkPt: '+12% fama e $160/evento · Desbloqueia Deck Brasil Tropics',
    perkEn: '+12% rep & $160/event · Unlocks Brazil Tropics Deck',
  },
  {
    id: 'sponsor_apex',
    name: 'Apex Precision Bearings',
    categoryPt: 'Rolamentos & Rodas',
    categoryEn: 'Bearings & Wheels',
    minReputation: 140,
    durationEvents: 5,
    remainingEvents: 5,
    repBonusPct: 18,
    cashPerEvent: 230,
    unlockItemIds: ['unlock_bearing_cyan'],
    active: false,
    expiredBefore: false,
    perkPt: '+18% fama e $230/evento · Desbloqueia Rolamentos Swiss Cyan',
    perkEn: '+18% rep & $230/event · Unlocks Swiss Cyan Bearings',
  },
  {
    id: 'sponsor_volt',
    name: 'Volt Titanium Trucks',
    categoryPt: 'Trucks & Hardware Pro',
    categoryEn: 'Pro Trucks & Hardware',
    minReputation: 340,
    durationEvents: 5,
    remainingEvents: 5,
    repBonusPct: 24,
    cashPerEvent: 340,
    unlockItemIds: ['unlock_truck_gold'],
    active: false,
    expiredBefore: false,
    perkPt: '+24% fama e $340/evento · Desbloqueia Trucks Gold Titanium',
    perkEn: '+24% rep & $340/event · Unlocks Raw Gold Trucks',
  },
  {
    id: 'sponsor_kuroi',
    name: 'Kuroi Tokyo Decks',
    categoryPt: 'Decks Internacionais Pro',
    categoryEn: 'International Pro Decks',
    minReputation: 500,
    durationEvents: 6,
    remainingEvents: 6,
    repBonusPct: 30,
    cashPerEvent: 460,
    unlockItemIds: ['unlock_deck_tokyo_ink', 'unlock_acc_chain'],
    active: false,
    expiredBefore: false,
    perkPt: '+30% fama e $460/evento · Desbloqueia Deck Tokyo Ink + Corrente',
    perkEn: '+30% rep & $460/event · Unlocks Tokyo Ink Deck + Chain',
  },
];

export function isCareerItemUnlocked(itemId: string, unlockedItems: string[]): boolean {
  return unlockedItems.includes(itemId);
}

export function applyUnlockThresholds(save: CareerSaveState): CareerSaveState {
  const unlocked = new Set(save.unlockedItems);
  for (const item of CAREER_UNLOCKABLES) {
    if (item.minReputation !== undefined && save.reputation >= item.minReputation) {
      unlocked.add(item.id);
    }
    if (item.sponsorId && save.sponsors.some((s) => s.id === item.sponsorId && s.active)) {
      unlocked.add(item.id);
    }
  }
  if (save.hallOfFame.worldChampionships > 0) {
    unlocked.add('unlock_deck_world_gold');
  }
  if (unlocked.size === save.unlockedItems.length) return save;
  return { ...save, unlockedItems: Array.from(unlocked) };
}

function buildInitialAttributes(stylePref: PlayerCareerIdentity['stylePreference']): SkaterAttributes {
  if (stylePref === 'street') {
    return {
      technicalSkill: 66,
      boardControl: 61,
      trickPrecision: 65,
      creativity: 63,
      consistency: 60,
      competitiveExperience: 54,
    };
  }
  if (stylePref === 'park') {
    return {
      technicalSkill: 60,
      boardControl: 67,
      trickPrecision: 61,
      creativity: 64,
      consistency: 63,
      competitiveExperience: 54,
    };
  }
  return {
    technicalSkill: 63,
    boardControl: 63,
    trickPrecision: 63,
    creativity: 63,
    consistency: 62,
    competitiveExperience: 54,
  };
}

function buildInitialRelations(roster: SkaterProfile[]): Record<string, SkaterRelation> {
  const map: Record<string, SkaterRelation> = {};
  roster.forEach((s, i) => {
    const isLocalFriend = s.id === 'lucas_silva' || s.id === 'maya_costa';
    const isEarlyRival = s.id === 'enzo_street' || s.id === 'gabriel_rocha';
    map[s.id] = {
      skaterId: s.id,
      friendship: isLocalFriend ? 62 : 28 + (i % 3) * 8,
      rivalryIntensity: isEarlyRival ? 48 : 14 + (i % 4) * 6,
      status: isLocalFriend ? 'friend' : isEarlyRival ? 'rival' : 'neutral',
      headToHeadWins: 0,
      headToHeadLosses: 0,
      lastMessagePt: isLocalFriend
        ? 'Bem-vindo ao circuito de Costa Azul! Bora treinar umas linhas no bowl.'
        : isEarlyRival
          ? 'Quero ver se você segura pressão na qualificatória.'
          : 'Nos vemos nas eliminatórias da temporada.',
      lastMessageEn: isLocalFriend
        ? 'Welcome to Costa Azul tour! Let’s run some bowl lines.'
        : isEarlyRival
          ? 'Let’s see if you can handle heat in qualifiers.'
          : 'See you out there during qualifiers.',
      activeChallenge:
        s.id === 'enzo_street'
          ? {
              id: 'chal_enzo_intro',
              titlePt: 'Desafio Street de Boas-Vindas',
              titleEn: 'Welcome Street Challenge',
              ruleMode: 'duel_1v1',
              targetScore: 3400,
            }
          : null,
    };
  });
  return map;
}

function buildInitialOpportunities(): AgentOpportunity[] {
  return [
    {
      id: 'opp_photo_costa',
      type: 'photo_gig',
      titlePt: 'Sessão de Fotos: Revista Flow Skate',
      titleEn: 'Photo Shoot: Flow Skate Magazine',
      descPt: 'Registre combos limpos na pista para tentar estampar uma matéria da revista.',
      descEn: 'Land clean combos in the park to earn a magazine feature.',
      cityId: 'costa_azul',
      ruleMode: 'photo_shoot',
      rewardRep: 85,
      rewardCash: 240,
      expiresLabelPt: 'Esta temporada',
      expiresLabelEn: 'This season',
      resolved: false,
    },
    {
      id: 'opp_video_part',
      type: 'video_gig',
      titlePt: 'Gravar Parte de Vídeo Amador',
      titleEn: 'Film Amateur Video Part',
      descPt: 'Grave sua melhor linha de manobras para publicar na videoteca oficial.',
      descEn: 'Film your best trick line to publish a video part and grow your hype.',
      cityId: 'costa_azul',
      ruleMode: 'video_shoot',
      rewardRep: 105,
      rewardCash: 280,
      expiresLabelPt: 'Esta temporada',
      expiresLabelEn: 'This season',
      resolved: false,
    },
    {
      id: 'opp_invite_sampa',
      type: 'last_minute_invite',
      titlePt: 'Convite de Última Hora: Sampa Rail Jam',
      titleEn: 'Last-Minute Invite: Sampa Rail Jam',
      descPt: 'Seu agente conseguiu uma vaga relâmpago após desistência de última hora.',
      descEn: 'Your agent secured a late entry after an athlete withdrew.',
      cityId: 'sao_paulo',
      ruleMode: 'standard',
      rewardRep: 120,
      rewardCash: 360,
      expiresLabelPt: 'Vaga limitada',
      expiresLabelEn: 'Limited slot',
      resolved: false,
    },
  ];
}

export function createNewCareerSave(
  identityInput: Omit<PlayerCareerIdentity, 'competitorNumber' | 'jerseyNumber' | 'currentAge' | 'reputationTier'>,
  appearance: SkaterAppearance,
): CareerSaveState {
  const clonedRoster: SkaterProfile[] = JSON.parse(JSON.stringify(SKATER_ROSTER));
  const playerFullName = `${identityInput.firstName} ${identityInput.lastName}`.trim();

  const initial: CareerSaveState = {
    version: 1,
    created: true,
    identity: {
      ...identityInput,
      competitorNumber: 'FS-000',
      jerseyNumber: '00',
      currentAge: identityInput.startingAge,
      reputationTier: 'amateur',
    },
    appearance,
    attributes: buildInitialAttributes(identityInput.stylePreference),
    playerStats: {
      eventsEntered: 0,
      wins: 0,
      podiums: 0,
      bails: 0,
      seasonPoints: 0,
      bestRunScore: 0,
    },
    reputation: 40,
    cash: 500,
    currentSeason: 1,
    currentYear: 2026,
    currentPhase: 'opening_ceremony',
    activeCityId: 'costa_azul',
    completedEventsInPhase: [],
    specialEventsCompletedInSeason: [],
    unlockedItems: [],
    roster: clonedRoster,
    retiredRoster: [],
    sponsors: JSON.parse(JSON.stringify(INITIAL_SPONSORS)),
    agentOpportunities: buildInitialOpportunities(),
    relations: buildInitialRelations(clonedRoster),
    pendingInterview: null,
    magazines: [
      {
        id: 'mag_issue_1',
        season: 1,
        issueNumber: 1,
        headlinePt: 'TEMPORADA 2026 ABERTA EM COSTA AZUL',
        headlineEn: '2026 TOUR OPENS IN COSTA AZUL',
        subheadPt: `${playerFullName} estreia como amador de olho no circuito profissional`,
        subheadEn: `${playerFullName} enters the amateur bracket eyeing a pro breakthrough`,
        featuredSkaterName: 'Kenji Takahashi',
        featuredCountry: 'JP',
        featuredAppearance: clonedRoster[1].appearance,
        featuredTrick: '360 Flip',
        scoreLabel: '94.8 OVR',
        excerptPt: 'Líder mundial Kenji Takahashi começa o ano defendendo o título contra Lucas Silva e Mason Knox.',
        excerptEn: 'World #1 Kenji Takahashi opens the year defending against Lucas Silva and Mason Knox.',
      },
    ],
    videos: [],
    newsFeed: [
      {
        id: 'news_init_1',
        season: 1,
        category: 'ranking',
        headlinePt: `${playerFullName} (${identityInput.nickname || 'Rookie'}) registrado como FS-000`,
        headlineEn: `${playerFullName} (${identityInput.nickname || 'Rookie'}) registered as FS-000`,
        detailPt: 'Começa a trajetória na categoria Amador buscando pontos, patrocinadores e fama.',
        detailEn: 'Amateur journey begins chasing points, sponsors, and fame.',
        tagLabelPt: 'ESTREIA',
        tagLabelEn: 'DEBUT',
      },
      {
        id: 'news_init_2',
        season: 1,
        category: 'ranking',
        headlinePt: 'Kenji Takahashi lidera o Ranking Mundial na abertura',
        headlineEn: 'Kenji Takahashi tops Opening World Standings',
        detailPt: 'Lucas Silva (#3) e Maya Costa (#5) lideram o pelotão brasileiro.',
        detailEn: 'Lucas Silva (#3) and Maya Costa (#5) headline the Brazilian squad.',
        tagLabelPt: 'RANKING',
        tagLabelEn: 'RANKING',
      },
    ],
    parkRecords: [
      {
        id: 'rec_best_run',
        labelPt: 'Maior Pontuação em Run',
        labelEn: 'Highest Run Score',
        metricType: 'score',
        value: 11800,
        unit: 'pts',
        trickNote: 'Tokyo Bay Pro Final',
        holderId: 'kenji_takahashi',
        holderName: 'Kenji Takahashi',
        isPlayer: false,
        season: 1,
      },
      {
        id: 'rec_best_trick',
        labelPt: 'Melhor Combo Único',
        labelEn: 'Best Single Combo',
        metricType: 'best_trick',
        value: 2640,
        unit: 'pts',
        trickNote: 'Hardflip + Boardslide',
        holderId: 'lucas_silva',
        holderName: 'Lucas Silva',
        isPlayer: false,
        season: 1,
      },
      {
        id: 'rec_big_air',
        labelPt: 'Maior Salto (Big Air)',
        labelEn: 'Highest Air Record',
        metricType: 'big_air',
        value: 2.95,
        unit: 'm',
        trickNote: 'Method Grab',
        holderId: 'mason_knox',
        holderName: 'Mason Knox',
        isPlayer: false,
        season: 1,
      },
    ],
    pastSeasons: [],
    lastCeremony: null,
    hallOfFame: {
      titles: 0,
      podiums: 0,
      eventsEntered: 0,
      seasonsCompleted: 0,
      worldChampionships: 0,
      specialEventWins: 0,
      duelWins: 0,
      personalBestRunScore: 0,
      personalBestComboScore: 0,
      personalBestComboTrick: '—',
      personalMaxAirMeters: 0,
      historicTricks: [],
      iconicRivalries: [],
      awardsWon: [],
      retiredLegends: [],
    },
  };

  return applyUnlockThresholds(initial);
}

export function createPlaceholderCareerSave(): CareerSaveState {
  const placeholder = createNewCareerSave(
    {
      firstName: 'Novo',
      lastName: 'Skatista',
      nickname: 'Flow',
      nationalityCode: 'BR',
      startingAge: 18,
      stylePreference: 'balanced',
    },
    DEFAULT_PLAYER_APPEARANCE,
  );
  return { ...placeholder, created: false };
}

export function loadCareerSave(): CareerSaveState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createPlaceholderCareerSave();
    const parsed = JSON.parse(raw) as CareerSaveState;
    if (!parsed || parsed.version !== 1 || !parsed.identity || !Array.isArray(parsed.roster)) {
      return createPlaceholderCareerSave();
    }
    return parsed;
  } catch {
    return createPlaceholderCareerSave();
  }
}

export function saveCareerState(state: CareerSaveState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearCareerSave(): CareerSaveState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
  return createPlaceholderCareerSave();
}

export function getPlayerCombinedStandings(save: CareerSaveState) {
  const playerRow = {
    id: 'player',
    competitorNumber: save.identity.competitorNumber,
    name: `${save.identity.firstName} ${save.identity.lastName}`,
    nickname: save.identity.nickname,
    nationalityCode: save.identity.nationalityCode,
    overall: computeSkaterOverall(save.attributes),
    wins: save.playerStats.wins,
    podiums: save.playerStats.podiums,
    seasonPoints: save.playerStats.seasonPoints,
    isPlayer: true,
  };

  const rows = save.roster.map((s) => ({
    id: s.id,
    competitorNumber: s.competitorNumber,
    name: `${s.firstName} ${s.lastName}`,
    nickname: s.nickname,
    nationalityCode: s.nationalityCode,
    overall: computeSkaterOverall(s.attributes),
    wins: s.stats.wins,
    podiums: s.stats.podiums,
    seasonPoints: s.stats.seasonPoints,
    isPlayer: false,
  }));

  const intl = [...rows, playerRow].sort((a, b) => {
    if (b.seasonPoints !== a.seasonPoints) return b.seasonPoints - a.seasonPoints;
    return b.overall - a.overall;
  });

  const nat = intl.filter((r) => r.nationalityCode === save.identity.nationalityCode);
  return {
    intl,
    nat,
    playerIntlRank: intl.findIndex((r) => r.isPlayer) + 1,
    playerNatRank: nat.findIndex((r) => r.isPlayer) + 1,
  };
}

export function trainAttributeQuick(
  save: CareerSaveState,
  attr: keyof SkaterAttributes,
  gain = 2,
): CareerSaveState {
  const nextVal = Math.min(99, save.attributes[attr] + gain);
  const nextRep = save.reputation + 15;
  const tier = getReputationTier(nextRep);
  return applyUnlockThresholds({
    ...save,
    attributes: { ...save.attributes, [attr]: nextVal },
    reputation: nextRep,
    identity: { ...save.identity, reputationTier: tier.id },
  });
}

export function signSponsorContract(save: CareerSaveState, sponsorId: string): CareerSaveState {
  const target = save.sponsors.find((s) => s.id === sponsorId);
  if (!target || save.reputation < target.minReputation) return save;

  const sponsors = save.sponsors.map((s) =>
    s.id === sponsorId
      ? { ...s, active: true, remainingEvents: s.durationEvents }
      : s,
  );
  const news: CircuitNewsItem = {
    id: `news_sp_${Date.now()}`,
    season: save.currentSeason,
    category: 'sponsor',
    headlinePt: `${save.identity.firstName} assina contrato com ${target.name}`,
    headlineEn: `${save.identity.firstName} signs deal with ${target.name}`,
    detailPt: `${target.durationEvents} eventos garantidos · Novos equipamentos desbloqueados na Garagem.`,
    detailEn: `${target.durationEvents}-event contract · New gear unlocked in Garage.`,
    tagLabelPt: 'PATROCÍNIO',
    tagLabelEn: 'SPONSOR',
  };

  return applyUnlockThresholds({
    ...save,
    sponsors,
    reputation: save.reputation + 45,
    newsFeed: [news, ...save.newsFeed].slice(0, 32),
  });
}

export function travelToCity(save: CareerSaveState, cityId: CareerCityId): CareerSaveState {
  const city = CAREER_CITIES.find((c) => c.id === cityId);
  if (!city || save.activeCityId === cityId) return save;
  const cost = Math.min(save.cash, city.travelCost);
  const news: CircuitNewsItem = {
    id: `news_tr_${Date.now()}`,
    season: save.currentSeason,
    category: 'media',
    headlinePt: `Viagem para ${city.name}: foco em ${city.spotPt}`,
    headlineEn: `Traveled to ${city.name}: scouting ${city.spotEn}`,
    detailPt: `Custo logístico $${cost} · Adaptado à pista local (+1 Controle).`,
    detailEn: `Logistics cost $${cost} · Adapted to local spot (+1 Board Control).`,
    tagLabelPt: 'VIAGEM',
    tagLabelEn: 'TRAVEL',
  };
  return applyUnlockThresholds({
    ...save,
    activeCityId: cityId,
    cash: save.cash - cost,
    reputation: save.reputation + 15,
    attributes: {
      ...save.attributes,
      boardControl: Math.min(99, save.attributes.boardControl + 1),
    },
    newsFeed: [news, ...save.newsFeed].slice(0, 32),
  });
}

export function attendLaunchEvent(save: CareerSaveState): CareerSaveState {
  const activeSponsor = save.sponsors.find((s) => s.active);
  const brand = activeSponsor ? activeSponsor.name : 'Flow Studios';
  const repGain = activeSponsor ? 75 : 45;
  const cashGain = activeSponsor ? 320 : 180;
  const nextRep = save.reputation + repGain;
  const tier = getReputationTier(nextRep);

  const news: CircuitNewsItem = {
    id: `news_launch_${Date.now()}`,
    season: save.currentSeason,
    category: 'sponsor',
    headlinePt: `${save.identity.firstName} brilha no evento de lançamento da ${brand}`,
    headlineEn: `${save.identity.firstName} headlines ${brand} launch showcase`,
    detailPt: `+${repGain} reputação e +$${cashGain} de cachê promocional.`,
    detailEn: `+${repGain} reputation and +$${cashGain} appearance fee.`,
    tagLabelPt: 'LANÇAMENTO',
    tagLabelEn: 'LAUNCH',
  };

  return applyUnlockThresholds({
    ...save,
    reputation: nextRep,
    cash: save.cash + cashGain,
    identity: { ...save.identity, reputationTier: tier.id },
    newsFeed: [news, ...save.newsFeed].slice(0, 32),
  });
}

export function interactWithSkater(
  save: CareerSaveState,
  skaterId: string,
  action: 'talk' | 'train' | 'provoke',
): CareerSaveState {
  const target = save.roster.find((s) => s.id === skaterId);
  const rel = save.relations[skaterId];
  if (!target || !rel) return save;

  let friendship = rel.friendship;
  let rivalry = rel.rivalryIntensity;
  let msgPt = rel.lastMessagePt;
  let msgEn = rel.lastMessageEn;
  let nextAttr = { ...save.attributes };
  let repGain = 10;

  if (action === 'talk') {
    friendship = Math.min(100, friendship + 14);
    rivalry = Math.max(0, rivalry - 6);
    msgPt = `Valeu pela troca de ideia! Se precisar de parceiro pro Team Challenge, tô dentro.`;
    msgEn = `Great catch-up! Count me in if you need a partner for the Team Challenge.`;
  } else if (action === 'train') {
    friendship = Math.min(100, friendship + 18);
    nextAttr = {
      ...nextAttr,
      technicalSkill: Math.min(99, nextAttr.technicalSkill + 1),
      consistency: Math.min(99, nextAttr.consistency + 1),
    };
    repGain = 24;
    msgPt = `Sessão pesada hoje! Tua base melhorou muito no bowl e nos corrimãos.`;
    msgEn = `Heavy session today! Your board control looked sharp across the park.`;
  } else {
    rivalry = Math.min(100, rivalry + 22);
    friendship = Math.max(0, friendship - 12);
    repGain = 18;
    msgPt = `Fechou então! Quero te ver batendo meu recorde frente a frente na pista.`;
    msgEn = `Deal! Let’s settle this head-to-head on the concrete.`;
  }

  const nextStatus: SkaterRelation['status'] =
    rivalry >= 55 && rivalry >= friendship ? 'rival' : friendship >= 52 ? 'friend' : 'neutral';

  const activeChallenge =
    action === 'provoke' || (nextStatus === 'rival' && !rel.activeChallenge)
      ? {
          id: `duel_${skaterId}_${Date.now()}`,
          titlePt: `Duelo 1v1 vs ${target.firstName}`,
          titleEn: `1v1 Duel vs ${target.firstName}`,
          ruleMode: 'duel_1v1' as const,
          targetScore: Math.round((4200 + computeSkaterOverall(target.attributes) * 45) / 50) * 50,
        }
      : rel.activeChallenge;

  const hofRivalries =
    nextStatus === 'rival' && !save.hallOfFame.iconicRivalries.includes(`${target.firstName} ${target.lastName}`)
      ? [...save.hallOfFame.iconicRivalries, `${target.firstName} ${target.lastName}`]
      : save.hallOfFame.iconicRivalries;

  return applyUnlockThresholds({
    ...save,
    attributes: nextAttr,
    reputation: save.reputation + repGain,
    relations: {
      ...save.relations,
      [skaterId]: {
        ...rel,
        friendship,
        rivalryIntensity: rivalry,
        status: nextStatus,
        lastMessagePt: msgPt,
        lastMessageEn: msgEn,
        activeChallenge,
      },
    },
    hallOfFame: { ...save.hallOfFame, iconicRivalries: hofRivalries },
  });
}

export function answerPressInterview(save: CareerSaveState, optionId: string): CareerSaveState {
  const interview = save.pendingInterview;
  if (!interview) return save;
  const opt = interview.options.find((o) => o.id === optionId);
  if (!opt) return save;

  const nextRep = Math.max(0, save.reputation + opt.repDelta);
  const nextCash = Math.max(0, save.cash + opt.cashDelta);
  const tier = getReputationTier(nextRep);
  let nextRelations = { ...save.relations };

  if (opt.rivalryShift) {
    const rel = nextRelations[opt.rivalryShift.targetSkaterId];
    if (rel) {
      const nextRiv = Math.min(100, Math.max(0, rel.rivalryIntensity + opt.rivalryShift.rivalryDelta));
      const nextFri = Math.min(100, Math.max(0, rel.friendship + opt.rivalryShift.friendshipDelta));
      nextRelations = {
        ...nextRelations,
        [rel.skaterId]: {
          ...rel,
          rivalryIntensity: nextRiv,
          friendship: nextFri,
          status: nextRiv >= 55 && nextRiv >= nextFri ? 'rival' : nextFri >= 52 ? 'friend' : 'neutral',
          lastMessagePt: opt.quotePt,
          lastMessageEn: opt.quoteEn,
        },
      };
    }
  }

  const news: CircuitNewsItem = {
    id: `news_press_${Date.now()}`,
    season: save.currentSeason,
    category: 'media',
    headlinePt: `Coletiva (${interview.outlet}): "${opt.quotePt}"`,
    headlineEn: `Press (${interview.outlet}): "${opt.quoteEn}"`,
    detailPt: `Repercussão pós-${interview.contextEventTitle}: ${opt.repDelta >= 0 ? `+${opt.repDelta}` : opt.repDelta} reputação.`,
    detailEn: `Post-${interview.contextEventTitle} buzz: ${opt.repDelta >= 0 ? `+${opt.repDelta}` : opt.repDelta} reputation.`,
    tagLabelPt: 'IMPRENSA',
    tagLabelEn: 'PRESS',
  };

  return applyUnlockThresholds({
    ...save,
    reputation: nextRep,
    cash: nextCash,
    identity: { ...save.identity, reputationTier: tier.id },
    relations: nextRelations,
    pendingInterview: null,
    newsFeed: [news, ...save.newsFeed].slice(0, 32),
  });
}

export function resolveCareerGameplayResult(
  save: CareerSaveState,
  summary: GameplayRunSummary,
  context: {
    careerEventId?: string;
    careerActivityId?: string;
    trainingTargetAttr?: keyof SkaterAttributes;
    rivalSkaterIds?: string[];
  },
): CareerSaveState {
  let next = { ...save };
  const playerFull = `${next.identity.firstName} ${next.identity.lastName}`;
  const isTraining = summary.ruleMode === 'training_session';
  const isPhoto = summary.ruleMode === 'photo_shoot';
  const isVideo = summary.ruleMode === 'video_shoot';
  const isDuel = summary.ruleMode === 'duel_1v1';
  const isSpecial =
    summary.ruleMode === 'night_session' ||
    summary.ruleMode === 'best_trick' ||
    summary.ruleMode === 'team_challenge' ||
    summary.ruleMode === 'big_air';

  // Active sponsor bonuses & contract expiration countdown
  const activeSponsors = next.sponsors.filter((s) => s.active);
  const repMultiplier = 1 + activeSponsors.reduce((acc, s) => acc + s.repBonusPct / 100, 0);
  const sponsorCash = activeSponsors.reduce((acc, s) => acc + s.cashPerEvent, 0);

  const nextNews: CircuitNewsItem[] = [...next.newsFeed];
  const nextRecords: ParkTrackRecord[] = next.parkRecords.map((r) => ({ ...r }));

  // Update Park Records if broken
  const runRec = nextRecords.find((r) => r.metricType === 'score');
  if (runRec && summary.score > runRec.value && summary.ruleMode !== 'best_trick') {
    runRec.value = summary.score;
    runRec.holderId = 'player';
    runRec.holderName = playerFull;
    runRec.isPlayer = true;
    runRec.trickNote = summary.bestComboLabel;
    runRec.season = next.currentSeason;
    nextNews.unshift({
      id: `news_rec_run_${Date.now()}`,
      season: next.currentSeason,
      category: 'record',
      headlinePt: `NOVO RECORDE DA PISTA! ${playerFull} marca ${summary.score.toLocaleString()} pts`,
      headlineEn: `NEW PARK RECORD! ${playerFull} scores ${summary.score.toLocaleString()} pts`,
      detailPt: `Recorde absoluto superado em ${summary.eventTitle}.`,
      detailEn: `All-time track score shattered at ${summary.eventTitle}.`,
      tagLabelPt: 'RECORDE',
      tagLabelEn: 'RECORD',
    });
  }

  const btRec = nextRecords.find((r) => r.metricType === 'best_trick');
  if (btRec && summary.bestComboScore > btRec.value) {
    btRec.value = summary.bestComboScore;
    btRec.holderId = 'player';
    btRec.holderName = playerFull;
    btRec.isPlayer = true;
    btRec.trickNote = summary.bestComboLabel;
    btRec.season = next.currentSeason;
  }

  const airRec = nextRecords.find((r) => r.metricType === 'big_air');
  if (airRec && summary.maxAirHeightMeters > airRec.value) {
    airRec.value = summary.maxAirHeightMeters;
    airRec.holderId = 'player';
    airRec.holderName = playerFull;
    airRec.isPlayer = true;
    airRec.trickNote = summary.bestComboLabel;
    airRec.season = next.currentSeason;
  }

  // Personal Best & Historic Tricks in Hall of Fame
  const hof = {
    ...next.hallOfFame,
    historicTricks: [...next.hallOfFame.historicTricks],
  };
  if (summary.score > hof.personalBestRunScore && summary.ruleMode !== 'best_trick') {
    hof.personalBestRunScore = summary.score;
  }
  if (summary.bestComboScore > hof.personalBestComboScore) {
    hof.personalBestComboScore = summary.bestComboScore;
    hof.personalBestComboTrick = summary.bestComboLabel;
  }
  if (summary.maxAirHeightMeters > hof.personalMaxAirMeters) {
    hof.personalMaxAirMeters = summary.maxAirHeightMeters;
  }
  if (summary.bestComboScore >= 900 && summary.bestComboLabel !== '—') {
    const entry = `${summary.bestComboLabel} (${summary.bestComboScore.toLocaleString()} pts)`;
    if (!hof.historicTricks.includes(entry)) {
      hof.historicTricks = [entry, ...hof.historicTricks].slice(0, 8);
    }
  }

  let repGained = 0;
  let cashGained = 0;

  if (isTraining) {
    const attrKey = context.trainingTargetAttr ?? 'technicalSkill';
    const gain = summary.landedTricksCount >= 4 ? 3 : 2;
    next.attributes = {
      ...next.attributes,
      [attrKey]: Math.min(99, next.attributes[attrKey] + gain),
      consistency: Math.min(99, next.attributes.consistency + (summary.bailsCount <= 1 ? 1 : 0)),
    };
    repGained = 35;
    nextNews.unshift({
      id: `news_trn_${Date.now()}`,
      season: next.currentSeason,
      category: 'media',
      headlinePt: `Treino concluído: ${summary.landedTricksCount} manobras (+${gain} atributo)`,
      headlineEn: `Training completed: ${summary.landedTricksCount} tricks (+${gain} attribute)`,
      detailPt: `Combo destaque: ${summary.bestComboLabel}.`,
      detailEn: `Highlight combo: ${summary.bestComboLabel}.`,
      tagLabelPt: 'TREINO',
      tagLabelEn: 'TRAINING',
    });
  } else if (isPhoto) {
    repGained = Math.round((70 + Math.min(90, summary.bestComboScore / 35)) * repMultiplier);
    cashGained = 240;
    const issueNum = next.magazines.length + 1;
    const cover: MagazineIssue = {
      id: `mag_${Date.now()}`,
      season: next.currentSeason,
      issueNumber: issueNum,
      headlinePt: `${playerFull.toUpperCase()} NA CAPA: ${summary.bestComboLabel.toUpperCase()}`,
      headlineEn: `${playerFull.toUpperCase()} COVER STORY: ${summary.bestComboLabel.toUpperCase()}`,
      subheadPt: `Sessão fotográfica histórica em ${CAREER_CITIES.find((c) => c.id === next.activeCityId)?.name ?? 'Costa Azul'}`,
      subheadEn: `Feature photo session in ${CAREER_CITIES.find((c) => c.id === next.activeCityId)?.name ?? 'Costa Azul'}`,
      featuredSkaterName: playerFull,
      featuredCountry: next.identity.nationalityCode,
      featuredAppearance: next.appearance,
      featuredTrick: summary.bestComboLabel !== '—' ? summary.bestComboLabel : 'Ollie Clean',
      scoreLabel: `${summary.bestComboScore.toLocaleString()} PTS`,
      excerptPt: `Com estilo único e precisão cirúrgica, ${next.identity.firstName} cravou o clique perfeito.`,
      excerptEn: `With clean style and sharp precision, ${next.identity.firstName} nailed the cover shot.`,
    };
    next.magazines = [cover, ...next.magazines].slice(0, 12);
    nextNews.unshift({
      id: `news_pho_${Date.now()}`,
      season: next.currentSeason,
      category: 'media',
      headlinePt: `Capa da Revista #${issueNum}: ${playerFull} em destaque!`,
      headlineEn: `Magazine Issue #${issueNum}: ${playerFull} lands the cover!`,
      detailPt: `Manobra registrada: ${cover.featuredTrick}. +${repGained} fama.`,
      detailEn: `Shot landed: ${cover.featuredTrick}. +${repGained} reputation.`,
      tagLabelPt: 'REVISTA',
      tagLabelEn: 'MAGAZINE',
    });
  } else if (isVideo) {
    repGained = Math.round((85 + Math.min(110, summary.score / 55)) * repMultiplier);
    cashGained = 280;
    const cityObj = CAREER_CITIES.find((c) => c.id === next.activeCityId);
    const vid: ProVideoPart = {
      id: `vid_${Date.now()}`,
      season: next.currentSeason,
      title: `${next.identity.nickname || next.identity.firstName} — ${cityObj?.name ?? 'Park'} Part`,
      cityName: cityObj?.name ?? 'Costa Azul',
      highlightTrick: summary.bestComboLabel !== '—' ? summary.bestComboLabel : 'Street Line',
      bestComboScore: summary.bestComboScore,
      views: Math.round(1800 + next.reputation * 18 + summary.score * 2.4),
      repGained,
    };
    next.videos = [vid, ...next.videos].slice(0, 14);
    nextNews.unshift({
      id: `news_vid_${Date.now()}`,
      season: next.currentSeason,
      category: 'media',
      headlinePt: `Novo Vídeo Publicado: "${vid.title}" (${vid.views.toLocaleString()} views)`,
      headlineEn: `Video Part Published: "${vid.title}" (${vid.views.toLocaleString()} views)`,
      detailPt: `Destaque para ${vid.highlightTrick}. Popularidade nas alturas!`,
      detailEn: `Featuring ${vid.highlightTrick}. Fan buzz surges across the tour!`,
      tagLabelPt: 'VÍDEO PRO',
      tagLabelEn: 'PRO VIDEO',
    });
  } else if (isDuel && context.rivalSkaterIds?.length) {
    const rivalId = context.rivalSkaterIds[0];
    const rival = next.roster.find((s) => s.id === rivalId);
    const won = summary.placement === 1;
    repGained = Math.round((won ? 95 : 30) * repMultiplier);
    cashGained = won ? 320 : 80;
    if (won) hof.duelWins += 1;

    const rel = next.relations[rivalId];
    if (rel) {
      next.relations = {
        ...next.relations,
        [rivalId]: {
          ...rel,
          rivalryIntensity: Math.min(100, rel.rivalryIntensity + 10),
          headToHeadWins: rel.headToHeadWins + (won ? 1 : 0),
          headToHeadLosses: rel.headToHeadLosses + (won ? 0 : 1),
          activeChallenge: null,
          lastMessagePt: won
            ? 'Você mandou bem nesse duelo... Mas na próxima etapa eu dou o troco!'
            : 'Dessa vez deu eu! Treina mais e me chama pra revanche.',
          lastMessageEn: won
            ? 'Clean battle this time... Catch me on the next tour stop!'
            : 'I took this round! Keep practicing and ask for a rematch.',
        },
      };
    }

    if (rival) {
      nextNews.unshift({
        id: `news_duel_${Date.now()}`,
        season: next.currentSeason,
        category: 'duel',
        headlinePt: won
          ? `${playerFull} vence duelo 1v1 contra ${rival.firstName} ${rival.lastName}!`
          : `${rival.firstName} ${rival.lastName} supera ${playerFull} em duelo 1v1`,
        headlineEn: won
          ? `${playerFull} defeats ${rival.firstName} ${rival.lastName} in 1v1 Duel!`
          : `${rival.firstName} ${rival.lastName} tops ${playerFull} in 1v1 Duel`,
        detailPt: `Placar: ${summary.score.toLocaleString()} pts.`,
        detailEn: `Final tally: ${summary.score.toLocaleString()} pts.`,
        tagLabelPt: 'CONFRONTO',
        tagLabelEn: 'DUEL',
      });
    }
  } else {
    // Official Circuit Competition or Special Event!
    const placement = summary.placement;
    const isWin = placement === 1;
    const isPodium = placement <= 3;
    const pointsEarned = Math.max(80, 420 - (placement - 1) * 55) + (isSpecial ? 80 : 0);

    next.playerStats = {
      eventsEntered: next.playerStats.eventsEntered + 1,
      wins: next.playerStats.wins + (isWin ? 1 : 0),
      podiums: next.playerStats.podiums + (isPodium ? 1 : 0),
      bails: next.playerStats.bails + summary.bailsCount,
      seasonPoints: next.playerStats.seasonPoints + pointsEarned,
      bestRunScore: Math.max(next.playerStats.bestRunScore, summary.score),
    };

    hof.eventsEntered += 1;
    if (isWin) hof.titles += 1;
    if (isPodium) hof.podiums += 1;
    if (isWin && isSpecial) hof.specialEventWins += 1;
    if (isWin && (context.careerEventId === 'flow_world_finals' || next.currentPhase === 'world_championship')) {
      hof.worldChampionships += 1;
    }

    // Small organic attribute growth from competing
    next.attributes = {
      ...next.attributes,
      competitiveExperience: Math.min(99, next.attributes.competitiveExperience + (isPodium ? 2 : 1)),
      trickPrecision: Math.min(99, next.attributes.trickPrecision + (summary.bailsCount === 0 ? 1 : 0)),
      technicalSkill: Math.min(99, next.attributes.technicalSkill + (isWin ? 1 : 0)),
    };

    const baseRep = Math.max(45, 195 - (placement - 1) * 28);
    repGained = Math.round(baseRep * repMultiplier);
    cashGained = Math.max(110, 620 - (placement - 1) * 85) + sponsorCash;

    if (context.careerEventId && !next.completedEventsInPhase.includes(context.careerEventId)) {
      next.completedEventsInPhase = [...next.completedEventsInPhase, context.careerEventId];
    }
    if (isSpecial && context.careerEventId && !next.specialEventsCompletedInSeason.includes(context.careerEventId)) {
      next.specialEventsCompletedInSeason = [...next.specialEventsCompletedInSeason, context.careerEventId];
      const spDef = SPECIAL_EVENTS.find((s) => s.id === context.careerEventId);
      if (spDef?.unlockItemId && isPodium && !next.unlockedItems.includes(spDef.unlockItemId)) {
        next.unlockedItems = [...next.unlockedItems, spDef.unlockItemId];
      }
    }

    // Evolve AI skaters who participated + occasional AI withdrawal / victory celebration news!
    const resultMap = new Map(summary.leaderboard.filter((e) => !e.isPlayer && e.skaterId).map((e, i) => [e.skaterId!, { idx: i + 1, score: e.score }]));
    const withdrawnIdx = next.playerStats.eventsEntered % next.roster.length;
    const withdrawnSkater = next.roster[withdrawnIdx];

    next.roster = next.roster.map((sk) => {
      const r = resultMap.get(sk.id);
      if (!r) return sk;
      const skPlacement = summary.leaderboard.findIndex((x) => x.skaterId === sk.id) + 1;
      const skWin = skPlacement === 1;
      const skPod = skPlacement <= 3;
      const skPts = Math.max(55, 390 - (skPlacement - 1) * 48);
      return {
        ...sk,
        stats: {
          ...sk.stats,
          eventsEntered: sk.stats.eventsEntered + 1,
          wins: sk.stats.wins + (skWin ? 1 : 0),
          losses: sk.stats.losses + (skWin ? 0 : 1),
          podiums: sk.stats.podiums + (skPod ? 1 : 0),
          seasonPoints: sk.stats.seasonPoints + skPts,
          bestRunScore: Math.max(sk.stats.bestRunScore, r.score),
          winStreak: skWin ? sk.stats.winStreak + 1 : 0,
        },
      };
    });

    // Recompute AI ranks
    const intl = rankInternationalRoster(next.roster);
    const intlIdx = new Map(intl.map((s, i) => [s.id, i + 1]));
    next.roster = next.roster.map((s) => {
      const nat = rankNationalRoster(next.roster, s.nationalityCode);
      return {
        ...s,
        stats: {
          ...s.stats,
          internationalRank: intlIdx.get(s.id) ?? s.stats.internationalRank,
          nationalRank: nat.findIndex((x) => x.id === s.id) + 1,
        },
      };
    });

    const winner = summary.leaderboard[0];
    nextNews.unshift({
      id: `news_ev_${Date.now()}`,
      season: next.currentSeason,
      category: 'victory',
      headlinePt: `${winner?.name ?? playerFull} vence o ${summary.eventTitle} (${winner?.score.toLocaleString()} pts)!`,
      headlineEn: `${winner?.name ?? playerFull} wins ${summary.eventTitle} (${winner?.score.toLocaleString()} pts)!`,
      detailPt: `${playerFull} finalizou em #${placement} (+${pointsEarned} pts no ranking).`,
      detailEn: `${playerFull} finished #${placement} (+${pointsEarned} standings pts).`,
      tagLabelPt: isWin ? 'CAMPEÃO' : 'RESULTADO',
      tagLabelEn: isWin ? 'CHAMPION' : 'RESULTS',
    });

    if (withdrawnSkater && !resultMap.has(withdrawnSkater.id)) {
      nextNews.unshift({
        id: `news_wd_${Date.now()}`,
        season: next.currentSeason,
        category: 'withdrawal',
        headlinePt: `${withdrawnSkater.firstName} ${withdrawnSkater.lastName} abandona etapa por lesão leve`,
        headlineEn: `${withdrawnSkater.firstName} ${withdrawnSkater.lastName} withdraws with minor sprain`,
        detailPt: 'Retorna após fisioterapia; abre vaga no ranking provisório.',
        detailEn: 'Expected back next stop; shakes up provisional standings.',
        tagLabelPt: 'BAIXA',
        tagLabelEn: 'WITHDRAWAL',
      });
    }

    // Tick active sponsors & expire finished contracts
    next.sponsors = next.sponsors.map((sp) => {
      if (!sp.active) return sp;
      const rem = sp.remainingEvents - 1;
      if (rem <= 0) {
        nextNews.unshift({
          id: `news_spexp_${sp.id}_${Date.now()}`,
          season: next.currentSeason,
          category: 'sponsor',
          headlinePt: `Contrato com ${sp.name} encerrado — disponível para renovação!`,
          headlineEn: `${sp.name} contract expired — ready for renewal!`,
          detailPt: 'Visite seu Agente na aba Vida Profissional para renovar ou buscar marca maior.',
          detailEn: 'Check Pro Life to renew or upgrade your sponsorship.',
          tagLabelPt: 'CONTRATO',
          tagLabelEn: 'CONTRACT',
        });
        return { ...sp, active: false, remainingEvents: sp.durationEvents, expiredBefore: true };
      }
      return { ...sp, remainingEvents: rem };
    });

    // Generate pending Post-Competition Press Interview!
    const topRival = next.roster.find((s) => next.relations[s.id]?.status === 'rival') ?? next.roster[0];
    next.pendingInterview = {
      id: `press_${Date.now()}`,
      outlet: 'Flow Skate Press',
      contextEventTitle: summary.eventTitle,
      questionPt: isPodium
        ? `Pódio incrível no ${summary.eventTitle}! Como você avalia a disputa contra ${topRival.firstName} ${topRival.lastName}?`
        : `Resultado duro no ${summary.eventTitle} (#${placement}). Qual é sua resposta para a torcida e rivais?`,
      questionEn: isPodium
        ? `Great podium at ${summary.eventTitle}! How did the battle with ${topRival.firstName} ${topRival.lastName} feel?`
        : `Tough finish at ${summary.eventTitle} (#${placement}). What is your message to fans and rivals?`,
      options: [
        {
          id: 'humble',
          labelPt: 'Respeito o elenco, foco no treino constante',
          labelEn: 'Respect the field, staying focused on training',
          quotePt: 'Todo mundo aqui anda muito. Vou voltar ainda mais técnico na próxima bateria.',
          quoteEn: 'Everyone here rips. I am heading back to the park to sharpen every line.',
          repDelta: 32,
          cashDelta: 0,
          rivalryShift: { targetSkaterId: topRival.id, rivalryDelta: -4, friendshipDelta: 10 },
        },
        {
          id: 'confident',
          labelPt: 'Provocar rival e prometer vitória no Mundial',
          labelEn: 'Call out rival & promise World Finals win',
          quotePt: `Respeito o ${topRival.firstName}, mas o lugar mais alto do pódio já tem dono na final!`,
          quoteEn: `Respect to ${topRival.firstName}, but that top podium spot is mine in the finals!`,
          repDelta: 55,
          cashDelta: 120,
          rivalryShift: { targetSkaterId: topRival.id, rivalryDelta: 18, friendshipDelta: -8 },
        },
        {
          id: 'sponsor_shoutout',
          labelPt: 'Agradecer fãs e patrocinadores da equipe',
          labelEn: 'Shout out fans and team sponsors',
          quotePt: 'Minha equipe e quem acompanha de casa fazem tudo isso valer a pena!',
          quoteEn: 'My crew and the fans back home make every slam worth it!',
          repDelta: 40,
          cashDelta: 180,
        },
      ],
    };
  }

  // Mark agent opportunity resolved if triggered from Pro Life
  if (context.careerActivityId) {
    next.agentOpportunities = next.agentOpportunities.map((o) =>
      o.id === context.careerActivityId ? { ...o, resolved: true } : o,
    );
  }

  next.reputation += repGained;
  next.cash += cashGained;
  next.identity = {
    ...next.identity,
    reputationTier: getReputationTier(next.reputation).id,
  };
  next.newsFeed = nextNews.slice(0, 36);
  next.parkRecords = nextRecords;
  next.hallOfFame = hof;

  return applyUnlockThresholds(next);
}

const ROOKIE_POOL: {
  firstName: string;
  lastName: string;
  nickname: string;
  nationalityCode: NationalityCode;
  nationalityPt: string;
  nationalityEn: string;
  style: SkaterProfile['style'];
}[] = [
  { firstName: 'Davi', lastName: 'Alencar', nickname: 'Vortex', nationalityCode: 'BR', nationalityPt: 'Brasil', nationalityEn: 'Brazil', style: 'technical_street' },
  { firstName: 'Yuki', lastName: 'Sato', nickname: 'Kaze', nationalityCode: 'JP', nationalityPt: 'Japão', nationalityEn: 'Japan', style: 'all_around' },
  { firstName: 'Sofia', lastName: 'Vega', nickname: 'Sol', nationalityCode: 'ES', nationalityPt: 'Espanha', nationalityEn: 'Spain', style: 'bowl_flow' },
  { firstName: 'Tyler', lastName: 'Brooks', nickname: 'Launch', nationalityCode: 'US', nationalityPt: 'Estados Unidos', nationalityEn: 'United States', style: 'big_air' },
];

export function advanceSeasonPhase(save: CareerSaveState): CareerSaveState {
  const order: SeasonPhaseId[] = [
    'opening_ceremony',
    'national_circuit',
    'international_circuit',
    'special_events',
    'world_championship',
    'closing_awards',
  ];
  const idx = order.indexOf(save.currentPhase);

  // Move to next phase within current season
  if (idx < order.length - 1) {
    const nextPhase = order[idx + 1];
    let lastCeremony = save.lastCeremony;
    const nextNews = [...save.newsFeed];

    if (nextPhase === 'closing_awards') {
      const standings = getPlayerCombinedStandings(save);
      const leader = standings.intl[0];
      const friendAlly = save.roster.find((s) => save.relations[s.id]?.status === 'friend') ?? save.roster[0];
      const topRival = save.roster.find((s) => save.relations[s.id]?.status === 'rival') ?? save.roster[1];
      const rookie = [...save.roster].sort((a, b) => a.age - b.age)[0];
      const playerFull = `${save.identity.firstName} ${save.identity.lastName}`;
      const playerWonBestTrick = save.hallOfFame.personalBestComboScore >= 1800;

      const awards: SeasonAwardEntry[] = [
        {
          categoryPt: 'Skatista do Ano',
          categoryEn: 'Skater of the Year',
          winnerName: leader.name,
          winnerDetailPt: `${leader.seasonPoints} pts na temporada`,
          winnerDetailEn: `${leader.seasonPoints} season pts`,
          isPlayer: leader.isPlayer,
        },
        {
          categoryPt: 'Melhor Manobra',
          categoryEn: 'Best Trick Award',
          winnerName: playerWonBestTrick ? playerFull : 'Lucas Silva',
          winnerDetailPt: playerWonBestTrick ? save.hallOfFame.personalBestComboTrick : 'Hardflip + Boardslide',
          winnerDetailEn: playerWonBestTrick ? save.hallOfFame.personalBestComboTrick : 'Hardflip + Boardslide',
          isPlayer: playerWonBestTrick,
        },
        {
          categoryPt: 'Revelação da Temporada',
          categoryEn: 'Rookie of the Year',
          winnerName: save.currentSeason === 1 ? playerFull : `${rookie.firstName} ${rookie.lastName}`,
          winnerDetailPt: save.currentSeason === 1 ? `Estreia ${save.identity.competitorNumber}` : `${rookie.age} anos`,
          winnerDetailEn: save.currentSeason === 1 ? `Debut ${save.identity.competitorNumber}` : `${rookie.age} yrs`,
          isPlayer: save.currentSeason === 1,
        },
        {
          categoryPt: 'Maior Rivalidade',
          categoryEn: 'Biggest Rivalry',
          winnerName: `${playerFull} vs ${topRival.firstName} ${topRival.lastName}`,
          winnerDetailPt: 'Confronto de alto nível na pista',
          winnerDetailEn: 'High-stakes head-to-head battle',
          isPlayer: true,
        },
        {
          categoryPt: 'Melhor Equipe',
          categoryEn: 'Best Squad',
          winnerName: `Flow Team (${save.identity.firstName} & ${friendAlly.firstName})`,
          winnerDetailPt: 'Sinergia em Team Challenge & Park',
          winnerDetailEn: 'Team Challenge & Park synergy',
          isPlayer: true,
        },
      ];

      lastCeremony = {
        seasonNumber: save.currentSeason,
        year: save.currentYear,
        awards,
      };
      nextNews.unshift({
        id: `news_ceremony_${save.currentSeason}`,
        season: save.currentSeason,
        category: 'victory',
        headlinePt: `Premiação ${save.currentYear}: ${leader.name} eleito Skatista do Ano!`,
        headlineEn: `${save.currentYear} Awards: ${leader.name} crowned Skater of the Year!`,
        detailPt: 'Cerimônia oficial de encerramento realizada com todo o elenco.',
        detailEn: 'Official end-of-season awards ceremony concluded with the full tour.',
        tagLabelPt: 'PREMIAÇÃO',
        tagLabelEn: 'AWARDS',
      });
    }

    return applyUnlockThresholds({
      ...save,
      currentPhase: nextPhase,
      completedEventsInPhase: [],
      lastCeremony,
      newsFeed: nextNews.slice(0, 36),
    });
  }

  // Transition Closing Awards -> New Season Year!
  const standings = getPlayerCombinedStandings(save);
  const worldChamp = standings.intl[0];
  const awards = save.lastCeremony?.awards ?? [];
  const nextSeasonNum = save.currentSeason + 1;
  const nextYear = save.currentYear + 1;

  // Age all AI skaters, evolve attributes, retire oldest veterans (> 29 yrs, keep min 12 skaters), draft rookies
  const aged = save.roster.map((s) => {
    const youngBoost = s.age <= 21 ? 2 : s.age <= 25 ? 1 : 0;
    return {
      ...s,
      age: s.age + 1,
      attributes: {
        ...s.attributes,
        technicalSkill: Math.min(99, s.attributes.technicalSkill + youngBoost),
        boardControl: Math.min(99, s.attributes.boardControl + (youngBoost > 0 ? 1 : 0)),
        competitiveExperience: Math.min(99, s.attributes.competitiveExperience + 1),
      },
      stats: {
        ...s.stats,
        seasonPoints: 0,
      },
    };
  });

  const retiredThisOffseason: SkaterProfile[] = [];
  const activeRoster: SkaterProfile[] = [];
  for (const sk of aged) {
    if (sk.age >= 29 && activeRoster.length + (aged.length - retiredThisOffseason.length) > 13 && retiredThisOffseason.length < 1) {
      retiredThisOffseason.push(sk);
    } else {
      activeRoster.push(sk);
    }
  }

  const rookieNames: string[] = [];
  const rookieSeed = ROOKIE_POOL[(nextSeasonNum - 2) % ROOKIE_POOL.length];
  if (rookieSeed && !activeRoster.some((s) => s.lastName === rookieSeed.lastName)) {
    const baseTemplate = SKATER_ROSTER[nextSeasonNum % SKATER_ROSTER.length];
    const nextNum = 15 + nextSeasonNum;
    const newRookie: SkaterProfile = {
      ...JSON.parse(JSON.stringify(baseTemplate)),
      id: `rookie_${nextSeasonNum}_${rookieSeed.lastName.toLowerCase()}`,
      competitorNumber: `FS-0${nextNum}`,
      jerseyNumber: `${nextNum}`,
      firstName: rookieSeed.firstName,
      lastName: rookieSeed.lastName,
      nickname: rookieSeed.nickname,
      nationalityCode: rookieSeed.nationalityCode,
      nationalityPt: rookieSeed.nationalityPt,
      nationalityEn: rookieSeed.nationalityEn,
      age: 17,
      style: rookieSeed.style,
      personalityPt: 'Jovem talento com fome de título mundial',
      personalityEn: 'Hungry young prodigy chasing podium breakthroughs',
      bioPt: `Revelação da temporada ${nextYear} recém-chegada ao circuito pro.`,
      bioEn: `Breakout ${nextYear} rookie joining the pro tour.`,
      attributes: {
        technicalSkill: 78,
        boardControl: 76,
        trickPrecision: 75,
        creativity: 82,
        consistency: 73,
        competitiveExperience: 64,
      },
      stats: {
        eventsEntered: 0,
        wins: 0,
        losses: 0,
        podiums: 0,
        bails: 0,
        bestRunScore: 0,
        averageScore: 0,
        seasonPoints: 0,
        nationalRank: 4,
        internationalRank: activeRoster.length + 1,
        winStreak: 0,
      },
      history: [],
      rivalries: [],
    };
    activeRoster.push(newRookie);
    rookieNames.push(`${newRookie.firstName} ${newRookie.lastName}`);
  }

  const nextRelations = { ...save.relations };
  for (const r of activeRoster) {
    if (!nextRelations[r.id]) {
      nextRelations[r.id] = {
        skaterId: r.id,
        friendship: 30,
        rivalryIntensity: 20,
        status: 'neutral',
        headToHeadWins: 0,
        headToHeadLosses: 0,
        lastMessagePt: 'Acabei de subir pro circuito principal. Nos vemos na pista!',
        lastMessageEn: 'Just joined the main tour. See you on the concrete!',
        activeChallenge: null,
      };
    }
  }

  const archive: PastSeasonArchive = {
    seasonNumber: save.currentSeason,
    year: save.currentYear,
    worldChampionName: worldChamp.name,
    worldChampionCountry: worldChamp.nationalityCode,
    playerRank: standings.playerIntlRank,
    playerPoints: save.playerStats.seasonPoints,
    podiumTop3: standings.intl.slice(0, 3).map((r) => ({
      name: r.name,
      country: r.nationalityCode,
      points: r.seasonPoints,
    })),
    retiredNames: retiredThisOffseason.map((r) => `${r.firstName} ${r.lastName}`),
    rookieNames,
    awards,
  };

  const earnedPlayerAwards = awards
    .filter((a) => a.isPlayer)
    .map((a) => ({ season: save.currentYear, awardPt: a.categoryPt, awardEn: a.categoryEn }));

  const newRetiredLegends = retiredThisOffseason.map((r) => ({
    name: `${r.firstName} ${r.lastName}`,
    country: r.nationalityCode,
    titles: r.stats.wins,
    specialtyPt: r.personalityPt,
    specialtyEn: r.personalityEn,
  }));

  const seasonNews: CircuitNewsItem[] = [
    {
      id: `news_newseason_${nextSeasonNum}`,
      season: nextSeasonNum,
      category: 'ranking',
      headlinePt: `Bem-vindo à Temporada ${nextYear}!`,
      headlineEn: `Welcome to Season ${nextYear}!`,
      detailPt: rookieNames.length > 0 ? `Novo talento no elenco: ${rookieNames.join(', ')}.` : 'Elenco atualizado para o novo ciclo anual.',
      detailEn: rookieNames.length > 0 ? `New tour arrival: ${rookieNames.join(', ')}.` : 'Roster evolved for the new annual cycle.',
      tagLabelPt: `ANO ${nextYear}`,
      tagLabelEn: `${nextYear}`,
    },
  ];
  if (retiredThisOffseason.length > 0) {
    seasonNews.push({
      id: `news_retire_${nextSeasonNum}`,
      season: nextSeasonNum,
      category: 'retirement',
      headlinePt: `Aposentadoria oficial: ${retiredThisOffseason.map((r) => `${r.firstName} ${r.lastName}`).join(', ')}`,
      headlineEn: `Official Retirement: ${retiredThisOffseason.map((r) => `${r.firstName} ${r.lastName}`).join(', ')}`,
      detailPt: 'Entra para o Hall da Fama após longa carreira no circuito.',
      detailEn: 'Inducted into the Hall of Fame after an iconic pro career.',
      tagLabelPt: 'LEGADO',
      tagLabelEn: 'LEGACY',
    });
  }

  return applyUnlockThresholds({
    ...save,
    identity: {
      ...save.identity,
      currentAge: save.identity.currentAge + 1,
    },
    playerStats: {
      ...save.playerStats,
      seasonPoints: 0,
    },
    currentSeason: nextSeasonNum,
    currentYear: nextYear,
    currentPhase: 'opening_ceremony',
    completedEventsInPhase: [],
    specialEventsCompletedInSeason: [],
    roster: activeRoster,
    retiredRoster: [...save.retiredRoster, ...retiredThisOffseason],
    relations: nextRelations,
    agentOpportunities: buildInitialOpportunities(),
    pastSeasons: [archive, ...save.pastSeasons],
    lastCeremony: null,
    newsFeed: [...seasonNews, ...save.newsFeed].slice(0, 36),
    hallOfFame: {
      ...save.hallOfFame,
      seasonsCompleted: save.hallOfFame.seasonsCompleted + 1,
      awardsWon: [...save.hallOfFame.awardsWon, ...earnedPlayerAwards],
      retiredLegends: [...save.hallOfFame.retiredLegends, ...newRetiredLegends],
    },
  });
}

export function getPhaseEvents(phase: SeasonPhaseId) {
  if (phase === 'national_circuit') return CAREER_EVENTS.slice(0, 2);
  if (phase === 'international_circuit') return CAREER_EVENTS.slice(2, 3);
  if (phase === 'world_championship') return CAREER_EVENTS.slice(3, 4);
  return [];
}
