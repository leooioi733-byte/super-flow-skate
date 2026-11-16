import {
  CareerSeasonScaffold,
  ChampionshipInvite,
  LeaderboardEntry,
  NationalityCode,
  SkaterAttributes,
  SkaterProfile,
  SkaterStyleId,
  TournamentRound,
} from '../types/game';

export const SKATER_STYLE_LABELS: Record<SkaterStyleId, { pt: string; en: string }> = {
  technical_street: { pt: 'Street Técnico', en: 'Tech Street' },
  bowl_flow: { pt: 'Flow de Bowl', en: 'Bowl Flow' },
  big_air: { pt: 'Aéreos & Gaps', en: 'Big Air & Gaps' },
  all_around: { pt: 'All-Around Park', en: 'All-Around Park' },
  rail_specialist: { pt: 'Corrimãos & Ledges', en: 'Rails & Ledges' },
};

export const ATTRIBUTE_META: {
  key: keyof SkaterAttributes;
  labelPt: string;
  labelEn: string;
}[] = [
  { key: 'technicalSkill', labelPt: 'Habilidade Técnica', labelEn: 'Technical Skill' },
  { key: 'boardControl', labelPt: 'Controle do Skate', labelEn: 'Board Control' },
  { key: 'trickPrecision', labelPt: 'Precisão nas Manobras', labelEn: 'Trick Precision' },
  { key: 'creativity', labelPt: 'Criatividade', labelEn: 'Creativity' },
  { key: 'consistency', labelPt: 'Consistência', labelEn: 'Consistency' },
  { key: 'competitiveExperience', labelPt: 'Experiência Competitiva', labelEn: 'Comp. Experience' },
];

export const SKATER_ROSTER: SkaterProfile[] = [
  // 1. BRASIL — Top Local Icon
  {
    id: 'lucas_silva',
    competitorNumber: 'FS-001',
    jerseyNumber: '01',
    firstName: 'Lucas',
    lastName: 'Silva',
    nickname: 'Wave',
    nationalityCode: 'BR',
    nationalityPt: 'Brasil',
    nationalityEn: 'Brazil',
    age: 22,
    style: 'bowl_flow',
    personalityPt: 'Carismático e fluido nas transições profundas',
    personalityEn: 'Charismatic and effortless across deep transitions',
    bioPt: 'Cria de Costa Azul, domina linhas longas de bowl e aéreos altos com estilo limpo.',
    bioEn: 'Costa Azul local known for seamless bowl lines and lofty grabs.',
    featuredInPark: true,
    appearance: {
      skinColor: '#c98e64',
      hairColor: '#1b1512',
      outfit: {
        shirtColor: '#0e7490',
        shirtAccent: '#fde047',
        pantsColor: '#1e293b',
        shoeColor: '#f8fafc',
        headwear: 'cap',
        hatColor: '#0f172a',
        deckGraphic: 'costa_azul',
        wheelColor: '#38bdf8',
        truckFinish: 'chrome',
      },
      visualModel: {
        bodyBuild: 'athletic',
        stance: 'goofy',
        topStyle: 'tank',
        bottomStyle: 'skate_shorts',
        hairStyle: 'short_tuft',
        headwearStyle: 'backward_cap',
        accessory: 'knee_pads',
        secondaryColor: '#fde047',
      },
    },
    attributes: {
      technicalSkill: 87,
      boardControl: 92,
      trickPrecision: 89,
      creativity: 86,
      consistency: 90,
      competitiveExperience: 88,
    },
    stats: {
      eventsEntered: 18,
      wins: 6,
      losses: 12,
      podiums: 13,
      bails: 9,
      bestRunScore: 10450,
      averageScore: 8620,
      seasonPoints: 1420,
      nationalRank: 1,
      internationalRank: 3,
      winStreak: 2,
    },
    history: [
      { eventId: 'costa_azul_open', eventTitle: 'COSTA AZUL OPEN', tier: 'regional', round: 'final', season: 2026, placement: 1, score: 9400, overallRating: 88.4 },
      { eventId: 'sunset_bowl_jam', eventTitle: 'SUNSET BOWL JAM', tier: 'national', round: 'final', season: 2026, placement: 1, score: 10450, overallRating: 91.2 },
      { eventId: 'rio_park_pro', eventTitle: 'RIO PARK CLASSIC', tier: 'international', round: 'final', season: 2025, placement: 3, score: 9120, overallRating: 87.1 },
    ],
    rivalries: [
      { rivalId: 'kenji_takahashi', intensity: 88, labelPt: 'Duelo pelo Ouro Olímpico', labelEn: 'World Gold Rivalry', headToHeadWins: 4, headToHeadLosses: 5 },
      { rivalId: 'maya_costa', intensity: 74, labelPt: 'Clássico Costa Azul', labelEn: 'Costa Azul Derby', headToHeadWins: 6, headToHeadLosses: 4 },
    ],
  },

  // 2. JAPAN — Precision Technician
  {
    id: 'kenji_takahashi',
    competitorNumber: 'FS-002',
    jerseyNumber: '02',
    firstName: 'Kenji',
    lastName: 'Takahashi',
    nickname: 'Razor',
    nationalityCode: 'JP',
    nationalityPt: 'Japão',
    nationalityEn: 'Japan',
    age: 20,
    style: 'technical_street',
    personalityPt: 'Cirúrgico, silencioso e quase infalível nos flips',
    personalityEn: 'Surgical, calm, and nearly infallible on technical flips',
    bioPt: 'Especialista de Tóquio com precisão absurda em 360 flips, hardflips e saídas de corrimão.',
    bioEn: 'Tokyo technician with razor-sharp flicks on 360 flips, hardflips, and rail transfers.',
    featuredInPark: true,
    appearance: {
      skinColor: '#e5bc98',
      hairColor: '#131317',
      outfit: {
        shirtColor: '#f8fafc',
        shirtAccent: '#dc2626',
        pantsColor: '#18181b',
        shoeColor: '#181d24',
        headwear: 'hair',
        hatColor: '#141c26',
        deckGraphic: 'street_stripes',
        wheelColor: '#f1f5f9',
        truckFinish: 'matte_black',
      },
      visualModel: {
        bodyBuild: 'slim',
        stance: 'regular',
        topStyle: 'windbreaker',
        bottomStyle: 'slim_chinos',
        hairStyle: 'side_part',
        headwearStyle: 'none',
        accessory: 'sunglasses',
        secondaryColor: '#dc2626',
      },
    },
    attributes: {
      technicalSkill: 96,
      boardControl: 93,
      trickPrecision: 97,
      creativity: 88,
      consistency: 94,
      competitiveExperience: 91,
    },
    stats: {
      eventsEntered: 22,
      wins: 9,
      losses: 13,
      podiums: 18,
      bails: 5,
      bestRunScore: 11800,
      averageScore: 9540,
      seasonPoints: 1680,
      nationalRank: 1,
      internationalRank: 1,
      winStreak: 3,
    },
    history: [
      { eventId: 'tokyo_bay_pro', eventTitle: 'TOKYO BAY PRO', tier: 'international', round: 'final', season: 2026, placement: 1, score: 11800, overallRating: 94.8 },
      { eventId: 'flow_world_finals', eventTitle: 'FLOW WORLD FINALS', tier: 'special', round: 'final', season: 2025, placement: 1, score: 11240, overallRating: 93.4 },
    ],
    rivalries: [
      { rivalId: 'lucas_silva', intensity: 88, labelPt: 'Duelo Técnico vs Flow', labelEn: 'Tech vs Flow Clash', headToHeadWins: 5, headToHeadLosses: 4 },
    ],
  },

  // 3. BRASIL — Prodigy All-Around
  {
    id: 'maya_costa',
    competitorNumber: 'FS-003',
    jerseyNumber: '03',
    firstName: 'Maya',
    lastName: 'Costa',
    nickname: 'Faísca',
    nationalityCode: 'BR',
    nationalityPt: 'Brasil',
    nationalityEn: 'Brazil',
    age: 18,
    style: 'all_around',
    personalityPt: 'Criativa, explosiva e destemida nas bordas',
    personalityEn: 'Creative, explosive, and fearless around the coping',
    bioPt: 'Destaque da nova geração brasileira, combina combos criativos de flip com grinds técnicos.',
    bioEn: 'Breakout Brazilian star pairing inventive flip combos with crisp coping grinds.',
    featuredInPark: true,
    appearance: {
      skinColor: '#b87a52',
      hairColor: '#2c1810',
      outfit: {
        shirtColor: '#e14b4b',
        shirtAccent: '#ffffff',
        pantsColor: '#253140',
        shoeColor: '#e2e8f0',
        headwear: 'beanie',
        hatColor: '#b82835',
        deckGraphic: 'flow_wave',
        wheelColor: '#fb7185',
        truckFinish: 'gold',
      },
      visualModel: {
        bodyBuild: 'slim',
        stance: 'goofy',
        topStyle: 'hoodie',
        bottomStyle: 'cargo_pants',
        hairStyle: 'ponytail',
        headwearStyle: 'beanie',
        accessory: 'headphones',
        secondaryColor: '#fda4af',
      },
    },
    attributes: {
      technicalSkill: 86,
      boardControl: 85,
      trickPrecision: 84,
      creativity: 92,
      consistency: 81,
      competitiveExperience: 79,
    },
    stats: {
      eventsEntered: 14,
      wins: 3,
      losses: 11,
      podiums: 8,
      bails: 12,
      bestRunScore: 9350,
      averageScore: 7890,
      seasonPoints: 1190,
      nationalRank: 2,
      internationalRank: 5,
      winStreak: 1,
    },
    history: [
      { eventId: 'costa_azul_open', eventTitle: 'COSTA AZUL OPEN', tier: 'regional', round: 'final', season: 2026, placement: 2, score: 8150, overallRating: 83.2 },
      { eventId: 'sp_street_cup', eventTitle: 'SAMPA PARK CUP', tier: 'national', round: 'final', season: 2025, placement: 1, score: 9350, overallRating: 86.5 },
    ],
    rivalries: [
      { rivalId: 'chloe_moreau', intensity: 81, labelPt: 'Nova Geração Park', labelEn: 'Next-Gen Rivalry', headToHeadWins: 3, headToHeadLosses: 3 },
    ],
  },

  // 4. USA — Big Air Veteran
  {
    id: 'mason_knox',
    competitorNumber: 'FS-004',
    jerseyNumber: '04',
    firstName: 'Mason',
    lastName: 'Knox',
    nickname: 'Apex',
    nationalityCode: 'US',
    nationalityPt: 'Estados Unidos',
    nationalityEn: 'United States',
    age: 26,
    style: 'big_air',
    personalityPt: 'Competidor nato que busca amplitude máxima e 360s pesados',
    personalityEn: 'Seasoned podium hunter chasing huge amplitude and heavy 360s',
    bioPt: 'Veterano da Califórnia com anos de experiência em finais mundiais e transições rápidas.',
    bioEn: 'California veteran with podium poise in major international park finals.',
    featuredInPark: true,
    appearance: {
      skinColor: '#e6b895',
      hairColor: '#5c3d28',
      outfit: {
        shirtColor: '#1f2937',
        shirtAccent: '#f59e0b',
        pantsColor: '#8f7b5d',
        shoeColor: '#181d24',
        headwear: 'cap',
        hatColor: '#b82835',
        deckGraphic: 'natural_maple',
        wheelColor: '#f59e0b',
        truckFinish: 'gold',
      },
      visualModel: {
        bodyBuild: 'stocky',
        stance: 'regular',
        topStyle: 'overshirt',
        bottomStyle: 'baggy_jeans',
        hairStyle: 'short_tuft',
        headwearStyle: 'cap',
        accessory: 'knee_pads',
        secondaryColor: '#f59e0b',
      },
    },
    attributes: {
      technicalSkill: 84,
      boardControl: 90,
      trickPrecision: 86,
      creativity: 82,
      consistency: 88,
      competitiveExperience: 95,
    },
    stats: {
      eventsEntered: 27,
      wins: 8,
      losses: 19,
      podiums: 19,
      bails: 11,
      bestRunScore: 10900,
      averageScore: 9120,
      seasonPoints: 1540,
      nationalRank: 1,
      internationalRank: 2,
      winStreak: 0,
    },
    history: [
      { eventId: 'venice_open', eventTitle: 'VENICE BOWL OPEN', tier: 'international', round: 'final', season: 2026, placement: 2, score: 10620, overallRating: 90.7 },
      { eventId: 'flow_world_finals', eventTitle: 'FLOW WORLD FINALS', tier: 'special', round: 'final', season: 2025, placement: 2, score: 10900, overallRating: 91.4 },
    ],
    rivalries: [
      { rivalId: 'liam_obrien', intensity: 76, labelPt: 'Duelo dos Bowls', labelEn: 'Bowl Kings Battle', headToHeadWins: 5, headToHeadLosses: 3 },
    ],
  },

  // 5. BRASIL — Rail & Ledge Grinder
  {
    id: 'enzo_street',
    competitorNumber: 'FS-005',
    jerseyNumber: '05',
    firstName: 'Enzo',
    lastName: 'Mendes',
    nickname: 'Street',
    nationalityCode: 'BR',
    nationalityPt: 'Brasil',
    nationalityEn: 'Brazil',
    age: 21,
    style: 'rail_specialist',
    personalityPt: 'Focado nos corrimãos, boardslides e linhas agressivas',
    personalityEn: 'Locked-in rail shredder chasing heavy boardslides and kinks',
    bioPt: 'Especialista paulistano em corrimãos em descida, flip-in e nosegrinds velozes.',
    bioEn: 'Sao Paulo street specialist hammering downrails and fast nosegrinds.',
    featuredInPark: true,
    appearance: {
      skinColor: '#9c623c',
      hairColor: '#161312',
      outfit: {
        shirtColor: '#2e6f57',
        shirtAccent: '#e2e8f0',
        pantsColor: '#1f2329',
        shoeColor: '#e2e8f0',
        headwear: 'cap',
        hatColor: '#141c26',
        deckGraphic: 'street_stripes',
        wheelColor: '#34d399',
        truckFinish: 'matte_black',
      },
      visualModel: {
        bodyBuild: 'athletic',
        stance: 'regular',
        topStyle: 'longsleeve',
        bottomStyle: 'cargo_pants',
        hairStyle: 'buzz',
        headwearStyle: 'backward_cap',
        accessory: 'backpack',
        secondaryColor: '#34d399',
      },
    },
    attributes: {
      technicalSkill: 83,
      boardControl: 80,
      trickPrecision: 79,
      creativity: 81,
      consistency: 74,
      competitiveExperience: 77,
    },
    stats: {
      eventsEntered: 13,
      wins: 2,
      losses: 11,
      podiums: 5,
      bails: 17,
      bestRunScore: 8420,
      averageScore: 6890,
      seasonPoints: 960,
      nationalRank: 3,
      internationalRank: 8,
      winStreak: 0,
    },
    history: [
      { eventId: 'costa_azul_open', eventTitle: 'COSTA AZUL OPEN', tier: 'regional', round: 'final', season: 2026, placement: 3, score: 6750, overallRating: 76.5 },
      { eventId: 'downtown_rails', eventTitle: 'DOWNTOWN RAILS', tier: 'national', round: 'final', season: 2025, placement: 2, score: 8420, overallRating: 81.9 },
    ],
    rivalries: [
      { rivalId: 'rafa_ortiz', intensity: 72, labelPt: 'Rivalidade Sul-Americana', labelEn: 'South American Duel', headToHeadWins: 4, headToHeadLosses: 3 },
    ],
  },

  // 6. FRANCE — Creative Stylist
  {
    id: 'chloe_moreau',
    competitorNumber: 'FS-006',
    jerseyNumber: '06',
    firstName: 'Chloé',
    lastName: 'Moreau',
    nickname: 'Velvet',
    nationalityCode: 'FR',
    nationalityPt: 'França',
    nationalityEn: 'France',
    age: 19,
    style: 'all_around',
    personalityPt: 'Estilo parisiense elegante com combinações inesperadas',
    personalityEn: 'Stylish Parisian rider weaving inventive combinations',
    bioPt: 'Reconhecida pela criatividade pura, encadeia nollies e grabs estilizados sem perder ritmo.',
    bioEn: 'Known across Europe for fluid nollie transitions and stylish mid-air grabs.',
    featuredInPark: true,
    appearance: {
      skinColor: '#edd0b8',
      hairColor: '#6d3b23',
      outfit: {
        shirtColor: '#d8c5a3',
        shirtAccent: '#0f172a',
        pantsColor: '#3d4a3a',
        shoeColor: '#1697b5',
        headwear: 'beanie',
        hatColor: '#148aa5',
        deckGraphic: 'costa_azul',
        wheelColor: '#f1f5f9',
        truckFinish: 'anodized_teal',
      },
      visualModel: {
        bodyBuild: 'tall',
        stance: 'goofy',
        topStyle: 'overshirt',
        bottomStyle: 'slim_chinos',
        hairStyle: 'long_flow',
        headwearStyle: 'bucket_hat',
        accessory: 'chain',
        secondaryColor: '#148aa5',
      },
    },
    attributes: {
      technicalSkill: 84,
      boardControl: 87,
      trickPrecision: 85,
      creativity: 95,
      consistency: 83,
      competitiveExperience: 82,
    },
    stats: {
      eventsEntered: 15,
      wins: 3,
      losses: 12,
      podiums: 9,
      bails: 10,
      bestRunScore: 9680,
      averageScore: 8240,
      seasonPoints: 1245,
      nationalRank: 1,
      internationalRank: 4,
      winStreak: 1,
    },
    history: [
      { eventId: 'lyon_park_series', eventTitle: 'LYON PARK SERIES', tier: 'international', round: 'final', season: 2026, placement: 2, score: 9680, overallRating: 87.9 },
    ],
    rivalries: [
      { rivalId: 'maya_costa', intensity: 81, labelPt: 'Nova Geração Park', labelEn: 'Next-Gen Rivalry', headToHeadWins: 3, headToHeadLosses: 3 },
    ],
  },

  // 7. ARGENTINA — Aggressive Plaza Charger
  {
    id: 'rafa_ortiz',
    competitorNumber: 'FS-007',
    jerseyNumber: '07',
    firstName: 'Rafa',
    lastName: 'Ortiz',
    nickname: 'Tigre',
    nationalityCode: 'AR',
    nationalityPt: 'Argentina',
    nationalityEn: 'Argentina',
    age: 23,
    style: 'technical_street',
    personalityPt: 'Arrisca tudo em cada salto; alto risco, alta recompensa',
    personalityEn: 'All-in risk taker chasing high-reward combos',
    bioPt: 'Skatista de Buenos Aires apaixonado por manobras difíceis em gaps e funbox.',
    bioEn: 'Buenos Aires street charger launching technical flips across gaps.',
    featuredInPark: false,
    appearance: {
      skinColor: '#d7a178',
      hairColor: '#1f1814',
      outfit: {
        shirtColor: '#1997b3',
        shirtAccent: '#ffffff',
        pantsColor: '#1f2329',
        shoeColor: '#e2e8f0',
        headwear: 'cap',
        hatColor: '#148aa5',
        deckGraphic: 'flow_wave',
        wheelColor: '#38bdf8',
        truckFinish: 'chrome',
      },
      visualModel: {
        bodyBuild: 'stocky',
        stance: 'regular',
        topStyle: 'tee',
        bottomStyle: 'skate_shorts',
        hairStyle: 'messy_curls',
        headwearStyle: 'none',
        accessory: 'sweatband',
        secondaryColor: '#38bdf8',
      },
    },
    attributes: {
      technicalSkill: 79,
      boardControl: 74,
      trickPrecision: 72,
      creativity: 80,
      consistency: 66,
      competitiveExperience: 73,
    },
    stats: {
      eventsEntered: 12,
      wins: 1,
      losses: 11,
      podiums: 4,
      bails: 19,
      bestRunScore: 7650,
      averageScore: 6150,
      seasonPoints: 790,
      nationalRank: 1,
      internationalRank: 11,
      winStreak: 0,
    },
    history: [
      { eventId: 'costa_azul_open', eventTitle: 'COSTA AZUL OPEN', tier: 'regional', round: 'final', season: 2026, placement: 4, score: 5100, overallRating: 69.8 },
    ],
    rivalries: [
      { rivalId: 'enzo_street', intensity: 72, labelPt: 'Rivalidade Sul-Americana', labelEn: 'South American Duel', headToHeadWins: 3, headToHeadLosses: 4 },
    ],
  },

  // 8. AUSTRALIA — Vertical Bowl Stylist
  {
    id: 'liam_obrien',
    competitorNumber: 'FS-008',
    jerseyNumber: '08',
    firstName: 'Liam',
    lastName: "O'Brien",
    nickname: 'Swell',
    nationalityCode: 'AU',
    nationalityPt: 'Austrália',
    nationalityEn: 'Australia',
    age: 24,
    style: 'bowl_flow',
    personalityPt: 'Velocidade absurda em piscinas e grinds infinitos no coping',
    personalityEn: 'Blistering pool speed and endless coping grinds',
    bioPt: 'Cresceu entre o surf e o concreto australiano; mantém o flow em alta velocidade o tempo todo.',
    bioEn: 'Surf-inspired Australian park rider holding speed through every bowl corner.',
    featuredInPark: false,
    appearance: {
      skinColor: '#e4b38c',
      hairColor: '#9b743c',
      outfit: {
        shirtColor: '#d8c5a3',
        shirtAccent: '#1697b5',
        pantsColor: '#253140',
        shoeColor: '#e2e8f0',
        headwear: 'hair',
        hatColor: '#e7dfd3',
        deckGraphic: 'costa_azul',
        wheelColor: '#34d399',
        truckFinish: 'anodized_teal',
      },
      visualModel: {
        bodyBuild: 'tall',
        stance: 'goofy',
        topStyle: 'tank',
        bottomStyle: 'skate_shorts',
        hairStyle: 'long_flow',
        headwearStyle: 'none',
        accessory: 'knee_pads',
        secondaryColor: '#1697b5',
      },
    },
    attributes: {
      technicalSkill: 80,
      boardControl: 91,
      trickPrecision: 82,
      creativity: 85,
      consistency: 86,
      competitiveExperience: 84,
    },
    stats: {
      eventsEntered: 16,
      wins: 3,
      losses: 13,
      podiums: 10,
      bails: 8,
      bestRunScore: 9520,
      averageScore: 8140,
      seasonPoints: 1165,
      nationalRank: 1,
      internationalRank: 6,
      winStreak: 0,
    },
    history: [
      { eventId: 'gold_coast_bowl', eventTitle: 'GOLD COAST BOWL', tier: 'international', round: 'final', season: 2026, placement: 2, score: 9520, overallRating: 86.2 },
    ],
    rivalries: [
      { rivalId: 'mason_knox', intensity: 76, labelPt: 'Duelo dos Bowls', labelEn: 'Bowl Kings Battle', headToHeadWins: 3, headToHeadLosses: 5 },
    ],
  },

  // 9. BRASIL — Young Speed Prodigy
  {
    id: 'gabriel_rocha',
    competitorNumber: 'FS-009',
    jerseyNumber: '09',
    firstName: 'Gabriel',
    lastName: 'Rocha',
    nickname: 'Gabi',
    nationalityCode: 'BR',
    nationalityPt: 'Brasil',
    nationalityEn: 'Brazil',
    age: 17,
    style: 'big_air',
    personalityPt: 'Jovem prodígio que salta alto e arrisca giros 360',
    personalityEn: 'Fearless young prodigy boosting huge 360 airs',
    bioPt: 'Revelação de Florianópolis que já pressiona os veteranos com amplitude impressionante.',
    bioEn: 'Florianopolis rising talent pressing veterans with massive air height.',
    featuredInPark: false,
    appearance: {
      skinColor: '#d19870',
      hairColor: '#231814',
      outfit: {
        shirtColor: '#f59e0b',
        shirtAccent: '#141c26',
        pantsColor: '#1f2329',
        shoeColor: '#181d24',
        headwear: 'cap',
        hatColor: '#e7dfd3',
        deckGraphic: 'natural_maple',
        wheelColor: '#f59e0b',
        truckFinish: 'chrome',
      },
      visualModel: {
        bodyBuild: 'slim',
        stance: 'regular',
        topStyle: 'hoodie',
        bottomStyle: 'skate_shorts',
        hairStyle: 'short_tuft',
        headwearStyle: 'cap',
        accessory: 'headphones',
        secondaryColor: '#141c26',
      },
    },
    attributes: {
      technicalSkill: 78,
      boardControl: 82,
      trickPrecision: 77,
      creativity: 84,
      consistency: 75,
      competitiveExperience: 68,
    },
    stats: {
      eventsEntered: 9,
      wins: 1,
      losses: 8,
      podiums: 3,
      bails: 11,
      bestRunScore: 8110,
      averageScore: 6780,
      seasonPoints: 840,
      nationalRank: 4,
      internationalRank: 10,
      winStreak: 1,
    },
    history: [
      { eventId: 'floripa_open', eventTitle: 'FLORIPA PARK OPEN', tier: 'regional', round: 'final', season: 2026, placement: 1, score: 8110, overallRating: 80.4 },
    ],
    rivalries: [],
  },

  // 10. SPAIN — Sun-soaked Plaza Smooth
  {
    id: 'mateo_navarro',
    competitorNumber: 'FS-010',
    jerseyNumber: '10',
    firstName: 'Mateo',
    lastName: 'Navarro',
    nickname: 'Macba',
    nationalityCode: 'ES',
    nationalityPt: 'Espanha',
    nationalityEn: 'Spain',
    age: 25,
    style: 'technical_street',
    personalityPt: 'Clássico do street europeu com estilo limpo e switch stance',
    personalityEn: 'Classic European street skater with crisp switch-stance flow',
    bioPt: 'Lapidado nas praças de Barcelona, entrega linhas constantes sem desperdício de pontos.',
    bioEn: 'Polished on Barcelona plazas, delivering consistent high-flow lines.',
    featuredInPark: false,
    appearance: {
      skinColor: '#ddb08b',
      hairColor: '#241a15',
      outfit: {
        shirtColor: '#1b222c',
        shirtAccent: '#38bdf8',
        pantsColor: '#8f7b5d',
        shoeColor: '#e2e8f0',
        headwear: 'beanie',
        hatColor: '#141c26',
        deckGraphic: 'street_stripes',
        wheelColor: '#f1f5f9',
        truckFinish: 'matte_black',
      },
      visualModel: {
        bodyBuild: 'athletic',
        stance: 'regular',
        topStyle: 'longsleeve',
        bottomStyle: 'slim_chinos',
        hairStyle: 'side_part',
        headwearStyle: 'beanie',
        accessory: 'sunglasses',
        secondaryColor: '#38bdf8',
      },
    },
    attributes: {
      technicalSkill: 85,
      boardControl: 84,
      trickPrecision: 86,
      creativity: 79,
      consistency: 87,
      competitiveExperience: 83,
    },
    stats: {
      eventsEntered: 17,
      wins: 2,
      losses: 15,
      podiums: 8,
      bails: 7,
      bestRunScore: 9120,
      averageScore: 7980,
      seasonPoints: 1090,
      nationalRank: 1,
      internationalRank: 7,
      winStreak: 0,
    },
    history: [
      { eventId: 'bcn_street_jam', eventTitle: 'BARCELONA PLAZA JAM', tier: 'international', round: 'final', season: 2026, placement: 3, score: 9120, overallRating: 85.6 },
    ],
    rivalries: [],
  },

  // 11. UK — Grind Specialist
  {
    id: 'oliver_hayes',
    competitorNumber: 'FS-011',
    jerseyNumber: '11',
    firstName: 'Oliver',
    lastName: 'Hayes',
    nickname: 'Iron',
    nationalityCode: 'GB',
    nationalityPt: 'Reino Unido',
    nationalityEn: 'United Kingdom',
    age: 27,
    style: 'rail_specialist',
    personalityPt: 'Equilíbrio de aço nos corrimãos longos e lipslides',
    personalityEn: 'Steel balance on long rails and crisp lipslides',
    bioPt: 'Veterano de Londres especialista em travar grinds longos mesmo em pistas molhadas.',
    bioEn: 'London veteran famed for locking endless grinds across kinked rails.',
    featuredInPark: false,
    appearance: {
      skinColor: '#edd0bc',
      hairColor: '#4c3222',
      outfit: {
        shirtColor: '#2e6f57',
        shirtAccent: '#ffffff',
        pantsColor: '#1f2329',
        shoeColor: '#b91c1c',
        headwear: 'beanie',
        hatColor: '#141c26',
        deckGraphic: 'natural_maple',
        wheelColor: '#f1f5f9',
        truckFinish: 'chrome',
      },
      visualModel: {
        bodyBuild: 'stocky',
        stance: 'goofy',
        topStyle: 'windbreaker',
        bottomStyle: 'baggy_jeans',
        hairStyle: 'buzz',
        headwearStyle: 'beanie',
        accessory: 'backpack',
        secondaryColor: '#e2e8f0',
      },
    },
    attributes: {
      technicalSkill: 81,
      boardControl: 83,
      trickPrecision: 82,
      creativity: 74,
      consistency: 85,
      competitiveExperience: 86,
    },
    stats: {
      eventsEntered: 19,
      wins: 2,
      losses: 17,
      podiums: 7,
      bails: 9,
      bestRunScore: 8740,
      averageScore: 7540,
      seasonPoints: 930,
      nationalRank: 1,
      internationalRank: 9,
      winStreak: 0,
    },
    history: [
      { eventId: 'southbank_jam', eventTitle: 'SOUTHBANK CONTEST', tier: 'national', round: 'final', season: 2026, placement: 1, score: 8740, overallRating: 83.0 },
    ],
    rivalries: [],
  },

  // 12. BRASIL — Rising Curitiba Technical Rider
  {
    id: 'camila_tavares',
    competitorNumber: 'FS-012',
    jerseyNumber: '12',
    firstName: 'Camila',
    lastName: 'Tavares',
    nickname: 'Nollie',
    nationalityCode: 'BR',
    nationalityPt: 'Brasil',
    nationalityEn: 'Brazil',
    age: 20,
    style: 'technical_street',
    personalityPt: 'Mestra em nollies e inward heelflips limpos',
    personalityEn: 'Master of crisp nollies and inward heelflips',
    bioPt: 'Curitibana metódica que constrói pontuação constante com variações de flip.',
    bioEn: 'Methodical Curitiba talent stacking points with switch and inward flip combos.',
    featuredInPark: false,
    appearance: {
      skinColor: '#c78c66',
      hairColor: '#1c1412',
      outfit: {
        shirtColor: '#1997b3',
        shirtAccent: '#ffffff',
        pantsColor: '#253140',
        shoeColor: '#1697b5',
        headwear: 'cap',
        hatColor: '#148aa5',
        deckGraphic: 'flow_wave',
        wheelColor: '#38bdf8',
        truckFinish: 'anodized_teal',
      },
      visualModel: {
        bodyBuild: 'slim',
        stance: 'regular',
        topStyle: 'overshirt',
        bottomStyle: 'cargo_pants',
        hairStyle: 'bun',
        headwearStyle: 'none',
        accessory: 'sweatband',
        secondaryColor: '#ffffff',
      },
    },
    attributes: {
      technicalSkill: 82,
      boardControl: 79,
      trickPrecision: 84,
      creativity: 78,
      consistency: 80,
      competitiveExperience: 72,
    },
    stats: {
      eventsEntered: 10,
      wins: 1,
      losses: 9,
      podiums: 4,
      bails: 8,
      bestRunScore: 7890,
      averageScore: 6910,
      seasonPoints: 760,
      nationalRank: 5,
      internationalRank: 12,
      winStreak: 0,
    },
    history: [
      { eventId: 'curitiba_plaza', eventTitle: 'CURITIBA PLAZA PRO', tier: 'national', round: 'final', season: 2026, placement: 2, score: 7890, overallRating: 79.6 },
    ],
    rivalries: [],
  },

  // 13. CANADA — Smooth Transition & Snow-style Grabs
  {
    id: 'noah_tremblay',
    competitorNumber: 'FS-013',
    jerseyNumber: '13',
    firstName: 'Noah',
    lastName: 'Tremblay',
    nickname: 'Method',
    nationalityCode: 'CA',
    nationalityPt: 'Canadá',
    nationalityEn: 'Canada',
    age: 24,
    style: 'big_air',
    personalityPt: 'Aéreos largos com grabs clássicos de Method e Melon',
    personalityEn: 'Wide-carving airs styled with textbook Method and Melon grabs',
    bioPt: 'Vindo de Montreal, traz fluidez aérea e estilo inconfundível nos quarter-pipes.',
    bioEn: 'Montreal park rider bringing snowboard-inspired amplitude to every quarter-pipe.',
    featuredInPark: false,
    appearance: {
      skinColor: '#e8c1a4',
      hairColor: '#6b472b',
      outfit: {
        shirtColor: '#b91c1c',
        shirtAccent: '#f8fafc',
        pantsColor: '#3d4a3a',
        shoeColor: '#e2e8f0',
        headwear: 'beanie',
        hatColor: '#b82835',
        deckGraphic: 'natural_maple',
        wheelColor: '#f1f5f9',
        truckFinish: 'chrome',
      },
      visualModel: {
        bodyBuild: 'tall',
        stance: 'goofy',
        topStyle: 'hoodie',
        bottomStyle: 'baggy_jeans',
        hairStyle: 'dreads',
        headwearStyle: 'beanie',
        accessory: 'knee_pads',
        secondaryColor: '#f8fafc',
      },
    },
    attributes: {
      technicalSkill: 75,
      boardControl: 83,
      trickPrecision: 76,
      creativity: 83,
      consistency: 78,
      competitiveExperience: 76,
    },
    stats: {
      eventsEntered: 11,
      wins: 1,
      losses: 10,
      podiums: 3,
      bails: 9,
      bestRunScore: 7740,
      averageScore: 6620,
      seasonPoints: 720,
      nationalRank: 1,
      internationalRank: 13,
      winStreak: 0,
    },
    history: [
      { eventId: 'montreal_park', eventTitle: 'MONTREAL CONCRETE', tier: 'national', round: 'final', season: 2026, placement: 2, score: 7740, overallRating: 78.8 },
    ],
    rivalries: [],
  },

  // 14. GERMANY — Disciplined Grinder
  {
    id: 'jonas_weber',
    competitorNumber: 'FS-014',
    jerseyNumber: '14',
    firstName: 'Jonas',
    lastName: 'Weber',
    nickname: 'Kink',
    nationalityCode: 'DE',
    nationalityPt: 'Alemanha',
    nationalityEn: 'Germany',
    age: 23,
    style: 'rail_specialist',
    personalityPt: 'Metódico e preciso em sequências longas sem erro',
    personalityEn: 'Disciplined, methodical line builder with tidy rail exits',
    bioPt: 'Representante de Berlim que raramente erra uma aterrissagem em qualificatórias.',
    bioEn: 'Berlin competitor known for clean landings through high-pressure qualifiers.',
    featuredInPark: false,
    appearance: {
      skinColor: '#e9c4a8',
      hairColor: '#8d6e42',
      outfit: {
        shirtColor: '#1b222c',
        shirtAccent: '#f59e0b',
        pantsColor: '#253140',
        shoeColor: '#181d24',
        headwear: 'hair',
        hatColor: '#141c26',
        deckGraphic: 'street_stripes',
        wheelColor: '#f59e0b',
        truckFinish: 'matte_black',
      },
      visualModel: {
        bodyBuild: 'tall',
        stance: 'regular',
        topStyle: 'windbreaker',
        bottomStyle: 'cargo_pants',
        hairStyle: 'dreads',
        headwearStyle: 'bucket_hat',
        accessory: 'headphones',
        secondaryColor: '#f59e0b',
      },
    },
    attributes: {
      technicalSkill: 76,
      boardControl: 78,
      trickPrecision: 80,
      creativity: 71,
      consistency: 84,
      competitiveExperience: 74,
    },
    stats: {
      eventsEntered: 11,
      wins: 0,
      losses: 11,
      podiums: 2,
      bails: 6,
      bestRunScore: 7390,
      averageScore: 6490,
      seasonPoints: 685,
      nationalRank: 1,
      internationalRank: 14,
      winStreak: 0,
    },
    history: [
      { eventId: 'berlin_bowl', eventTitle: 'BERLIN PARK CUP', tier: 'national', round: 'final', season: 2026, placement: 3, score: 7390, overallRating: 77.2 },
    ],
    rivalries: [],
  },
];

// --- Career Mode Architectural & Simulation Functions (Ready for Career Progression) ---

export function computeSkaterOverall(attrs: SkaterAttributes): number {
  const weighted =
    attrs.technicalSkill * 0.2 +
    attrs.boardControl * 0.18 +
    attrs.trickPrecision * 0.18 +
    attrs.creativity * 0.14 +
    attrs.consistency * 0.18 +
    attrs.competitiveExperience * 0.12;
  return Math.round(weighted);
}

export function rankInternationalRoster(roster: SkaterProfile[]): SkaterProfile[] {
  return [...roster].sort((a, b) => {
    if (b.stats.seasonPoints !== a.stats.seasonPoints) {
      return b.stats.seasonPoints - a.stats.seasonPoints;
    }
    return computeSkaterOverall(b.attributes) - computeSkaterOverall(a.attributes);
  });
}

export function rankNationalRoster(
  roster: SkaterProfile[],
  countryCode: NationalityCode = 'BR',
): SkaterProfile[] {
  return roster
    .filter((s) => s.nationalityCode === countryCode)
    .sort((a, b) => {
      if (b.stats.seasonPoints !== a.stats.seasonPoints) {
        return b.stats.seasonPoints - a.stats.seasonPoints;
      }
      return computeSkaterOverall(b.attributes) - computeSkaterOverall(a.attributes);
    });
}

export function generateChampionshipHeats(
  roster: SkaterProfile[],
  round: TournamentRound,
  heatSize = 6,
): SkaterProfile[][] {
  const seeded = rankInternationalRoster(roster);
  const participantCap = round === 'qualifier' ? seeded.length : round === 'semifinal' ? 8 : 6;
  const slice = seeded.slice(0, Math.min(participantCap, seeded.length));
  const heats: SkaterProfile[][] = [];
  for (let i = 0; i < slice.length; i += heatSize) {
    heats.push(slice.slice(i, i + heatSize));
  }
  return heats;
}

export function selectActiveParkSkaters(count = 6, eventTitle = ''): SkaterProfile[] {
  const lower = eventTitle.toLowerCase();
  let pool = SKATER_ROSTER;
  if (lower.includes('world') || lower.includes('final')) {
    pool = rankInternationalRoster(SKATER_ROSTER);
  } else if (lower.includes('rail') || lower.includes('street')) {
    pool = [...SKATER_ROSTER].sort((a, b) => {
      const aScore = (a.style === 'rail_specialist' || a.style === 'technical_street' ? 30 : 0) + a.attributes.technicalSkill;
      const bScore = (b.style === 'rail_specialist' || b.style === 'technical_street' ? 30 : 0) + b.attributes.technicalSkill;
      return bScore - aScore;
    });
  } else if (lower.includes('bowl')) {
    pool = [...SKATER_ROSTER].sort((a, b) => {
      const aScore = (a.style === 'bowl_flow' || a.style === 'big_air' ? 30 : 0) + a.attributes.boardControl;
      const bScore = (b.style === 'bowl_flow' || b.style === 'big_air' ? 30 : 0) + b.attributes.boardControl;
      return bScore - aScore;
    });
  } else {
    const featured = SKATER_ROSTER.filter((s) => s.featuredInPark);
    const others = SKATER_ROSTER.filter((s) => !s.featuredInPark);
    pool = [...featured, ...others];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

export function simulateNpcCompetitionRun(
  skater: SkaterProfile,
  difficultyScale = 1.0,
  seedOffset = 0,
): Omit<LeaderboardEntry, 'isPlayer'> {
  const a = skater.attributes;
  const overallAttr = computeSkaterOverall(a);

  // Deterministic variation per session/skater using light hash so scores feel alive each run
  const rawSeed =
    skater.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0) * 17, 0) + seedOffset * 131;
  const wave = Math.sin(rawSeed * 0.37) * 0.5 + 0.5; // 0..1

  // Higher consistency shrinks score variance; lower consistency creates wild highs & bails
  const varianceRange = ((100 - a.consistency) / 100) * 0.28 + 0.06;
  const perfMultiplier = 1 - varianceRange * 0.45 + wave * varianceRange;

  const basePoints =
    (a.technicalSkill * 28 +
      a.creativity * 22 +
      a.boardControl * 18 +
      a.trickPrecision * 18 +
      a.competitiveExperience * 14) *
    difficultyScale;

  const score = Math.max(2400, Math.round((basePoints * perfMultiplier) / 10) * 10);
  const overallRating = Number(
    Math.min(98.5, Math.max(58.0, overallAttr * 0.92 + wave * 6.5 - (100 - a.consistency) * 0.08)).toFixed(1),
  );

  return {
    name: `${skater.firstName} ${skater.lastName}`,
    score,
    overallRating,
    skaterId: skater.id,
    competitorNumber: skater.competitorNumber,
    nationalityCode: skater.nationalityCode,
  };
}

export function generateDynamicCompetitionField(
  eventTitle: string,
  seedOffset = 1,
): Omit<LeaderboardEntry, 'isPlayer'>[] {
  const lower = eventTitle.toLowerCase();
  const isFinalOrWorld = lower.includes('final') || lower.includes('world');
  const isBowlOrSeries = lower.includes('bowl') || lower.includes('rails') || lower.includes('street');
  const difficultyScale = isFinalOrWorld ? 1.24 : isBowlOrSeries ? 1.05 : 0.88;

  const pool = selectActiveParkSkaters(7, eventTitle);
  return pool.map((skater) => simulateNpcCompetitionRun(skater, difficultyScale, seedOffset));
}

export function advanceTournamentRound(
  heats: SkaterProfile[][],
  scoresBySkaterId: Record<string, number>,
  nextRound: TournamentRound,
): SkaterProfile[] {
  const flattened = heats.flat().sort((a, b) => {
    const sb = scoresBySkaterId[b.id] ?? 0;
    const sa = scoresBySkaterId[a.id] ?? 0;
    return sb - sa;
  });
  const advanceCap = nextRound === 'semifinal' ? 8 : 6;
  return flattened.slice(0, Math.min(advanceCap, flattened.length));
}

export function updateRivalryHeadToHead(
  skater: SkaterProfile,
  rivalId: string,
  won: boolean,
): SkaterProfile {
  const existing = skater.rivalries.find((r) => r.rivalId === rivalId);
  if (!existing) {
    return {
      ...skater,
      rivalries: [
        ...skater.rivalries,
        {
          rivalId,
          intensity: 55,
          labelPt: 'Rivalidade Emergente',
          labelEn: 'Emerging Rivalry',
          headToHeadWins: won ? 1 : 0,
          headToHeadLosses: won ? 0 : 1,
        },
      ],
    };
  }
  return {
    ...skater,
    rivalries: skater.rivalries.map((r) =>
      r.rivalId === rivalId
        ? {
            ...r,
            intensity: Math.min(100, r.intensity + 4),
            headToHeadWins: r.headToHeadWins + (won ? 1 : 0),
            headToHeadLosses: r.headToHeadLosses + (won ? 0 : 1),
          }
        : r,
    ),
  };
}

export function evaluateSeasonInvites(
  playerInternationalRank: number,
  invites: ChampionshipInvite[],
): ChampionshipInvite[] {
  return invites.map((inv) => ({
    ...inv,
    unlocked: inv.unlocked || playerInternationalRank <= inv.minInternationalRank,
  }));
}

export function evolveSkaterAfterSeason(
  skater: SkaterProfile,
  placement: number,
  runScore: number,
): SkaterProfile {
  const isWin = placement === 1;
  const isPodium = placement <= 3;
  const ageFactor = skater.age <= 21 ? 2 : skater.age <= 25 ? 1 : 0;
  const nextEvents = skater.stats.eventsEntered + 1;
  const nextAvg = Math.round(
    (skater.stats.averageScore * skater.stats.eventsEntered + runScore) / nextEvents,
  );

  return {
    ...skater,
    attributes: {
      ...skater.attributes,
      technicalSkill: Math.min(99, skater.attributes.technicalSkill + (isPodium ? 1 : 0) + (ageFactor > 1 ? 1 : 0)),
      boardControl: Math.min(99, skater.attributes.boardControl + (isPodium ? 1 : 0)),
      trickPrecision: Math.min(99, skater.attributes.trickPrecision + (isWin ? 1 : 0)),
      consistency: Math.min(99, skater.attributes.consistency + (isWin ? 1 : 0)),
      competitiveExperience: Math.min(99, skater.attributes.competitiveExperience + 1),
    },
    stats: {
      ...skater.stats,
      eventsEntered: nextEvents,
      wins: skater.stats.wins + (isWin ? 1 : 0),
      losses: skater.stats.losses + (isWin ? 0 : 1),
      podiums: skater.stats.podiums + (isPodium ? 1 : 0),
      bestRunScore: Math.max(skater.stats.bestRunScore, runScore),
      averageScore: nextAvg,
      seasonPoints: skater.stats.seasonPoints + Math.max(40, 260 - (placement - 1) * 35),
      winStreak: isWin ? skater.stats.winStreak + 1 : 0,
    },
  };
}

export function applySeasonProgression(
  roster: SkaterProfile[],
  placementBySkaterId: Record<string, { placement: number; score: number }>,
): SkaterProfile[] {
  const evolved = roster.map((skater) => {
    const res = placementBySkaterId[skater.id];
    return res ? evolveSkaterAfterSeason(skater, res.placement, res.score) : skater;
  });

  const intlRanked = rankInternationalRoster(evolved);
  const intlMap = new Map(intlRanked.map((s, idx) => [s.id, idx + 1]));

  return evolved.map((skater) => {
    const natRanked = rankNationalRoster(evolved, skater.nationalityCode);
    const natRank = natRanked.findIndex((s) => s.id === skater.id) + 1;
    return {
      ...skater,
      stats: {
        ...skater.stats,
        internationalRank: intlMap.get(skater.id) ?? skater.stats.internationalRank,
        nationalRank: natRank > 0 ? natRank : skater.stats.nationalRank,
      },
    };
  });
}

export const INITIAL_CAREER_SCAFFOLD: CareerSeasonScaffold = {
  seasonYear: 2026,
  currentRound: 'qualifier',
  standingsScope: 'international',
  invites: [
    {
      id: 'invite_sampa_night',
      titlePt: 'SAMPA NIGHT INVITATIONAL',
      titleEn: 'SAMPA NIGHT INVITATIONAL',
      location: 'São Paulo Urban Dome',
      minInternationalRank: 8,
      rewardPoints: 450,
      unlocked: true,
    },
    {
      id: 'invite_flow_masters',
      titlePt: 'FLOW STUDIOS MASTERS',
      titleEn: 'FLOW STUDIOS MASTERS',
      location: 'Costa Azul Stadium',
      minInternationalRank: 4,
      rewardPoints: 800,
      unlocked: false,
    },
  ],
};
