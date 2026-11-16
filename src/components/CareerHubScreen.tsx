import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Award,
  Briefcase,
  Camera,
  ChevronRight,
  Crown,
  Edit3,
  Film,
  Flame,
  Handshake,
  MapPin,
  MessageSquare,
  Moon,
  Newspaper,
  Play,
  RotateCcw,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  CareerCityId,
  CareerSaveState,
  SpecialEventDef,
} from '../types/career';
import {
  CAREER_EVENTS,
  GameplaySessionConfig,
  SkaterAttributes,
  SkaterProfile,
} from '../types/game';
import {
  CAREER_CITIES,
  getPhaseEvents,
  getPlayerCombinedStandings,
  getReputationTier,
  REPUTATION_TIERS,
  SEASON_PHASES,
  SPECIAL_EVENTS,
} from '../data/careerSystem';
import {
  ATTRIBUTE_META,
  computeSkaterOverall,
  SKATER_STYLE_LABELS,
} from '../data/skaterRoster';
import { soundEngine } from '../audio/soundEngine';
import { CountryFlag, SkaterPortrait } from './SkaterPortrait';

interface CareerHubScreenProps {
  careerSave: CareerSaveState;
  language: 'pt' | 'en';
  onUpdateCareer: (next: CareerSaveState) => void;
  onQuickTrainAttr: (attr: keyof SkaterAttributes) => void;
  onSignSponsor: (sponsorId: string) => void;
  onTravelCity: (cityId: CareerCityId) => void;
  onAttendLaunch: () => void;
  onInteractSkater: (skaterId: string, action: 'talk' | 'train' | 'provoke') => void;
  onAnswerInterview: (optionId: string) => void;
  onAdvancePhase: () => void;
  onLaunchCareerGameplay: (cfg: GameplaySessionConfig) => void;
  onOpenEditor: () => void;
  onResetCareer: () => void;
  onBack: () => void;
}

type HubTab = 'season' | 'pro_life' | 'relations' | 'media' | 'legacy';

export const CareerHubScreen: React.FC<CareerHubScreenProps> = ({
  careerSave,
  language,
  onQuickTrainAttr,
  onSignSponsor,
  onTravelCity,
  onAttendLaunch,
  onInteractSkater,
  onAnswerInterview,
  onAdvancePhase,
  onLaunchCareerGameplay,
  onOpenEditor,
  onResetCareer,
  onBack,
}) => {
  const isPt = language === 'pt';
  const [tab, setTab] = useState<HubTab>('season');
  const [relSubView, setRelSubView] = useState<'relations' | 'intl' | 'nat'>('relations');
  const [selectedSkater, setSelectedSkater] = useState<SkaterProfile | null>(null);
  const [trainingAttr, setTrainingAttr] = useState<keyof SkaterAttributes>('technicalSkill');
  const [confirmReset, setConfirmReset] = useState(false);

  const standings = useMemo(() => getPlayerCombinedStandings(careerSave), [careerSave]);
  const repTier = useMemo(() => getReputationTier(careerSave.reputation), [careerSave.reputation]);
  const nextRepTier = useMemo(() => {
    const idx = REPUTATION_TIERS.findIndex((t) => t.id === repTier.id);
    return idx >= 0 && idx < REPUTATION_TIERS.length - 1 ? REPUTATION_TIERS[idx + 1] : null;
  }, [repTier]);

  const repProgressPct = useMemo(() => {
    if (!nextRepTier) return 100;
    const span = Math.max(1, nextRepTier.minRep - repTier.minRep);
    return Math.min(100, Math.round(((careerSave.reputation - repTier.minRep) / span) * 100));
  }, [careerSave.reputation, repTier, nextRepTier]);

  const playerFullName = `${careerSave.identity.firstName} ${careerSave.identity.lastName}`;
  const playerOverall = computeSkaterOverall(careerSave.attributes);
  const activeCity = CAREER_CITIES.find((c) => c.id === careerSave.activeCityId) ?? CAREER_CITIES[0];
  const phaseEvents = useMemo(
    () => getPhaseEvents(careerSave.currentPhase),
    [careerSave.currentPhase],
  );

  // Build Legend Categories dynamically for Hall of Fame
  const legendCategories = useMemo(() => {
    const allSkaters = [...careerSave.roster, ...careerSave.retiredRoster];
    const parkLegend = [...allSkaters]
      .filter((s) => s.style === 'bowl_flow' || s.style === 'all_around')
      .sort((a, b) => b.stats.wins - a.stats.wins)[0];
    const streetLegend = [...allSkaters]
      .filter((s) => s.style === 'technical_street' || s.style === 'rail_specialist')
      .sort((a, b) => b.stats.wins - a.stats.wins)[0];
    const sotyLeader = standings.intl[0];
    const worldChampName =
      careerSave.hallOfFame.worldChampionships > 0
        ? playerFullName
        : careerSave.pastSeasons[0]?.worldChampionName ?? sotyLeader.name;
    const recHolder = careerSave.parkRecords[0];

    return [
      {
        catPt: 'Lenda do Park',
        catEn: 'Park Legend',
        name: parkLegend ? `${parkLegend.firstName} ${parkLegend.lastName}` : 'Lucas Silva',
        detail: `${parkLegend?.stats.wins ?? 6} ${isPt ? 'títulos' : 'titles'}`,
      },
      {
        catPt: 'Lenda do Street',
        catEn: 'Street Legend',
        name: streetLegend ? `${streetLegend.firstName} ${streetLegend.lastName}` : 'Kenji Takahashi',
        detail: `${streetLegend?.stats.wins ?? 8} ${isPt ? 'títulos' : 'titles'}`,
      },
      {
        catPt: 'Campeão Mundial',
        catEn: 'World Champion',
        name: worldChampName,
        detail: careerSave.hallOfFame.worldChampionships > 0 ? `${careerSave.hallOfFame.worldChampionships}×` : '2026 Tour',
      },
      {
        catPt: 'Recordista da Pista',
        catEn: 'Track Record Holder',
        name: recHolder?.holderName ?? 'Kenji Takahashi',
        detail: `${recHolder?.value.toLocaleString() ?? '11,800'} ${recHolder?.unit ?? 'pts'}`,
      },
      {
        catPt: 'Líder Skatista do Ano',
        catEn: 'Skater of the Year Leader',
        name: sotyLeader.name,
        detail: `${sotyLeader.seasonPoints} pts`,
      },
    ];
  }, [careerSave, standings, playerFullName, isPt]);

  const launchOfficialEvent = (evId: string, evTitle: string) => {
    soundEngine.playClick(true);
    const topRivals = careerSave.roster
      .filter((s) => careerSave.relations[s.id]?.status === 'rival')
      .map((s) => s.id)
      .slice(0, 2);

    onLaunchCareerGameplay({
      mode: 'competition',
      eventTitle: evTitle,
      source: 'career',
      ruleMode: 'standard',
      atmosphere: 'day',
      durationSeconds: 45,
      careerEventId: evId,
      rivalSkaterIds: topRivals,
      playerDisplayName: playerFullName,
      playerNationalityCode: careerSave.identity.nationalityCode,
    });
  };

  const launchSpecialEvent = (sp: SpecialEventDef) => {
    if (careerSave.reputation < sp.minReputation) return;
    soundEngine.playClick(true);
    const allies = careerSave.roster
      .filter((s) => careerSave.relations[s.id]?.status === 'friend')
      .map((s) => s.id)
      .slice(0, 2);
    const rivals = careerSave.roster
      .filter((s) => careerSave.relations[s.id]?.status === 'rival')
      .map((s) => s.id)
      .slice(0, 2);

    onLaunchCareerGameplay({
      mode: 'competition',
      eventTitle: sp.title,
      source: 'career',
      ruleMode: sp.ruleMode,
      atmosphere: sp.atmosphere,
      durationSeconds: sp.durationSeconds,
      careerEventId: sp.id,
      teammateSkaterIds: allies,
      rivalSkaterIds: rivals,
      playerDisplayName: playerFullName,
      playerNationalityCode: careerSave.identity.nationalityCode,
    });
  };

  const tabs: { id: HubTab; labelPt: string; labelEn: string; icon: React.ReactNode }[] = [
    { id: 'season', labelPt: 'Temporada & Eventos', labelEn: 'Season & Events', icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: 'pro_life', labelPt: 'Vida Profissional', labelEn: 'Pro Life', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: 'relations', labelPt: 'Relações & Ranking', labelEn: 'Rivals & Standings', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'media', labelPt: 'Mídia & Notícias', labelEn: 'Media & News', icon: <Newspaper className="w-3.5 h-3.5" /> },
    { id: 'legacy', labelPt: 'Hall da Fama', labelEn: 'Hall of Fame', icon: <Crown className="w-3.5 h-3.5" /> },
  ];

  const currentPhaseIndex = SEASON_PHASES.findIndex((p) => p.id === careerSave.currentPhase);
  const currentPhaseMeta = SEASON_PHASES[Math.max(0, currentPhaseIndex)];

  return (
    <motion.div
      key="career_hub"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-20 bg-[#080f18]/92 flex flex-col p-3 sm:p-5 overflow-hidden select-none"
    >
      {/* TOP ATHLETE HEADER BAR */}
      <div className="rounded-2xl bg-[#0e1722] border border-white/15 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playBack();
              onBack();
            }}
            className="h-10 px-3 rounded-xl bg-[#131f2d] hover:bg-[#1a2b3d] border border-white/15 flex items-center gap-1.5 text-xs font-bold tracking-wider text-white cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#38bdf8]" />
            <span className="hidden sm:inline">{isPt ? 'MENU' : 'HOME'}</span>
          </button>

          <SkaterPortrait
            customAppearance={careerSave.appearance}
            jerseyNumber={careerSave.identity.jerseyNumber}
            label={playerFullName}
            size="sm"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CountryFlag code={careerSave.identity.nationalityCode} className="w-4 h-3 rounded-[2px]" />
              <span className="text-sm font-extrabold text-white truncate">
                {playerFullName}
              </span>
              <span className="text-[11px] font-bold text-[#38bdf8] tabular-nums shrink-0">
                {careerSave.identity.competitorNumber}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-300 tabular-nums">
              <span>OVR {playerOverall}</span>
              <span aria-hidden="true">·</span>
              <span>#{standings.playerIntlRank} {isPt ? 'Mundial' : 'World'}</span>
              <span aria-hidden="true">·</span>
              <span className="text-cyan-200 font-semibold">
                {isPt ? repTier.labelPt : repTier.labelEn}
              </span>
            </div>
          </div>
        </div>

        {/* Reputation + Cash + Season Meta + Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Reputation Meter */}
          <div className="w-32 sm:w-40">
            <div className="flex items-center justify-between text-[10px] font-bold tabular-nums mb-1">
              <span className="text-[#38bdf8]">{careerSave.reputation} REP</span>
              <span className="text-slate-400">
                {nextRepTier ? `${nextRepTier.minRep}` : 'MAX'}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[#1a293a] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0e7490] to-[#38bdf8]"
                style={{ width: `${repProgressPct}%` }}
              />
            </div>
          </div>

          <div className="px-2.5 py-1.5 rounded-lg bg-[#131f2d] border border-white/10 text-xs font-extrabold text-emerald-300 tabular-nums">
            ${careerSave.cash.toLocaleString()}
          </div>

          <div className="hidden md:flex flex-col text-right text-[11px] leading-tight">
            <span className="font-extrabold text-white">
              {isPt ? `TEMP ${careerSave.currentSeason} · ${careerSave.currentYear}` : `SEASON ${careerSave.currentSeason} · ${careerSave.currentYear}`}
            </span>
            <span className="text-[#38bdf8] font-semibold flex items-center justify-end gap-1">
              <MapPin className="w-3 h-3" />
              {activeCity.name}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick(false);
              onOpenEditor();
            }}
            title={isPt ? 'Editar Skatista e Skate' : 'Edit Skater & Board'}
            className="h-9 px-2.5 rounded-lg bg-[#131f2d] hover:bg-[#1a2b3d] border border-white/15 flex items-center gap-1.5 text-[11px] font-bold text-white cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="hidden sm:inline">{isPt ? 'Editar' : 'Edit'}</span>
          </button>
        </div>
      </div>

      {/* HORIZONTAL NAVIGATION TABS */}
      <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto flow-scroll shrink-0 pb-1">
        {tabs.map((t) => {
          const active = tab === t.id;
          const badge = t.id === 'pro_life' && careerSave.pendingInterview ? '!' : null;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                soundEngine.playClick(false);
                setTab(t.id);
                setSelectedSkater(null);
              }}
              className={`min-h-[40px] px-3.5 rounded-xl border flex items-center gap-2 text-xs font-bold tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                active
                  ? 'bg-[#1587a3] border-cyan-300/40 text-white'
                  : 'bg-[#0e1722] border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
              }`}
            >
              {t.icon}
              <span>{isPt ? t.labelPt : t.labelEn}</span>
              {badge && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-[#091018] text-[10px] font-extrabold flex items-center justify-center">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* MAIN CONTENT BODY (Landscape Grid inside Scrollable Area) */}
      <div className="mt-2.5 flex-1 min-h-0 overflow-y-auto flow-scroll pr-0.5">
        {/* TAB 1: TEMPORADA & EVENTOS */}
        {tab === 'season' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* Left Column: Annual Season Roadmap & Active Phase Events */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              {/* 6-Phase Season Progress Card */}
              <div className="p-4 rounded-2xl bg-[#0e1722] border border-white/15">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.2em] text-[#38bdf8] uppercase">
                      {isPt
                        ? `CALENDÁRIO DA TEMPORADA ${careerSave.currentYear}`
                        : `${careerSave.currentYear} SEASON SCHEDULE`}
                    </div>
                    <h2 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                      {isPt ? currentPhaseMeta.titlePt : currentPhaseMeta.titleEn}
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {isPt ? currentPhaseMeta.descPt : currentPhaseMeta.descEn}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick(true);
                      onAdvancePhase();
                    }}
                    className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#0e7490] to-[#178ea9] hover:from-[#1289a8] hover:to-[#1ea5c4] border border-cyan-300/35 flex items-center gap-2 text-xs font-extrabold tracking-wider text-white cursor-pointer shrink-0"
                  >
                    <span>
                      {careerSave.currentPhase === 'closing_awards'
                        ? isPt
                          ? `INICIAR ANO ${careerSave.currentYear + 1}`
                          : `START ${careerSave.currentYear + 1}`
                        : isPt
                          ? 'AVANÇAR FASE'
                          : 'NEXT PHASE'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 6-Step Progress Strip */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {SEASON_PHASES.map((ph, i) => {
                    const done = i < currentPhaseIndex;
                    const curr = i === currentPhaseIndex;
                    return (
                      <div
                        key={ph.id}
                        className={`p-2 rounded-lg border text-[10px] leading-tight ${
                          curr
                            ? 'bg-[#12384b] border-[#38bdf8] text-white font-bold'
                            : done
                              ? 'bg-emerald-950/50 border-emerald-500/35 text-emerald-200'
                              : 'bg-[#131f2d]/60 border-white/5 text-slate-400'
                        }`}
                      >
                        <div className="tabular-nums text-[9px] opacity-75">0{i + 1}</div>
                        <div className="mt-0.5 truncate">{isPt ? ph.titlePt : ph.titleEn}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phase-Specific Content: Opening / Phase Events / Closing Ceremony */}
              {careerSave.currentPhase === 'opening_ceremony' && (
                <div className="p-4 rounded-2xl bg-[#0e1722] border border-cyan-400/35 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold tracking-widest text-[#38bdf8]">
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isPt
                        ? `CERIMÔNIA DE ABERTURA · TEMPORADA ${careerSave.currentSeason}`
                        : `OPENING CEREMONY · SEASON ${careerSave.currentSeason}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {isPt
                      ? `Todos os ${careerSave.roster.length + 1} skatistas estão reunidos em ${activeCity.name}. Acompanhe seus rivais, faça um treino de aquecimento na aba Vida Profissional ou avance direto para o Circuito Nacional.`
                      : `All ${careerSave.roster.length + 1} athletes have gathered in ${activeCity.name}. Check rivals, warm up in Pro Life, or advance into the National Circuit.`}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-[#131f2d] border border-white/10">
                      <div className="text-[10px] text-slate-400">{isPt ? 'LÍDER ATUAL' : 'CURRENT #1'}</div>
                      <div className="text-xs font-extrabold text-white mt-0.5 truncate">
                        {standings.intl[0].name}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#131f2d] border border-white/10">
                      <div className="text-[10px] text-slate-400">{isPt ? 'SEU RANK' : 'YOUR RANK'}</div>
                      <div className="text-xs font-extrabold text-[#38bdf8] mt-0.5 tabular-nums">
                        #{standings.playerIntlRank}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#131f2d] border border-white/10">
                      <div className="text-[10px] text-slate-400">{isPt ? 'RECORDE DA PISTA' : 'TRACK RECORD'}</div>
                      <div className="text-xs font-extrabold text-white mt-0.5 tabular-nums">
                        {careerSave.parkRecords[0]?.value.toLocaleString()} pts
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {careerSave.currentPhase === 'closing_awards' && careerSave.lastCeremony && (
                <div className="p-4 rounded-2xl bg-[#0e1722] border border-amber-400/40 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold tracking-widest text-amber-300">
                    <Award className="w-4 h-4" />
                    <span>
                      {isPt
                        ? `PREMIAÇÃO OFICIAL ${careerSave.lastCeremony.year}`
                        : `${careerSave.lastCeremony.year} OFFICIAL SEASON AWARDS`}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {careerSave.lastCeremony.awards.map((aw) => (
                      <div
                        key={aw.categoryEn}
                        className={`p-3 rounded-xl border ${
                          aw.isPlayer
                            ? 'bg-[#12384b] border-[#38bdf8]/60'
                            : 'bg-[#131f2d] border-white/10'
                        }`}
                      >
                        <div className="text-[10px] font-bold tracking-wider text-[#38bdf8] uppercase">
                          {isPt ? aw.categoryPt : aw.categoryEn}
                        </div>
                        <div className="text-sm font-extrabold text-white mt-0.5">{aw.winnerName}</div>
                        <div className="text-[11px] text-slate-300">
                          {isPt ? aw.winnerDetailPt : aw.winnerDetailEn}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Circuit Competitions */}
              <div className="p-4 rounded-2xl bg-[#0e1722] border border-white/15 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold tracking-[0.16em] text-slate-200 uppercase">
                    {phaseEvents.length > 0
                      ? isPt
                        ? 'Etapas Oficiais desta Fase'
                        : 'Official Phase Events'
                      : isPt
                        ? 'Todas as Etapas do Circuito Oficial'
                        : 'Full Official Tour Stops'}
                  </span>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {careerSave.playerStats.wins} {isPt ? 'vitórias' : 'wins'} · {careerSave.playerStats.podiums}{' '}
                    {isPt ? 'pódios' : 'podiums'}
                  </span>
                </div>

                {(phaseEvents.length > 0 ? phaseEvents : CAREER_EVENTS).map((ev) => {
                  const completed = careerSave.completedEventsInPhase.includes(ev.id);
                  return (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-[#131f2d] border border-white/10 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-extrabold text-white">
                            {ev.title}
                          </span>
                          {completed && (
                            <span className="text-[10px] font-bold text-emerald-300 uppercase">
                              · {isPt ? 'CONCLUÍDO' : 'COMPLETED'}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          {ev.location} · {isPt ? ev.disciplinePt : ev.disciplineEn}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => launchOfficialEvent(ev.id, ev.title)}
                        className="h-9 px-3.5 rounded-lg bg-[#1587a3] hover:bg-[#1ea5c4] flex items-center gap-1.5 text-xs font-extrabold tracking-wider text-white cursor-pointer shrink-0"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>{isPt ? 'COMPETIR' : 'COMPETE'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Special Independent Events + Career Utility */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="p-4 rounded-2xl bg-[#0e1722] border border-white/15 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.16em] text-[#38bdf8] uppercase">
                    <Zap className="w-4 h-4" />
                    <span>{isPt ? 'Eventos Especiais' : 'Special Events'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {careerSave.specialEventsCompletedInSeason.length}/{SPECIAL_EVENTS.length}
                  </span>
                </div>

                {SPECIAL_EVENTS.map((sp) => {
                  const locked = careerSave.reputation < sp.minReputation;
                  const done = careerSave.specialEventsCompletedInSeason.includes(sp.id);
                  return (
                    <div
                      key={sp.id}
                      className={`p-3 rounded-xl border flex flex-col gap-2 ${
                        locked
                          ? 'bg-[#0b121b] border-white/5 opacity-65'
                          : 'bg-[#131f2d] border-white/12'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-white">
                            {sp.atmosphere === 'night' && <Moon className="w-3.5 h-3.5 text-cyan-300" />}
                            <span>{sp.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            {isPt ? sp.taglinePt : sp.taglineEn}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={locked}
                          onClick={() => launchSpecialEvent(sp)}
                          className={`h-8 px-3 rounded-lg text-[11px] font-extrabold tracking-wider shrink-0 ${
                            locked
                              ? 'bg-white/5 text-slate-400 cursor-not-allowed'
                              : 'bg-[#1587a3] hover:bg-[#1ea5c4] text-white cursor-pointer'
                          }`}
                        >
                          {locked
                            ? `${sp.minReputation} REP`
                            : done
                              ? isPt
                                ? 'REJOGAR'
                                : 'REPLAY'
                              : isPt
                                ? 'JOGAR'
                                : 'ENTER'}
                        </button>
                      </div>
                      <div className="text-[10px] text-cyan-200/85 flex items-center justify-between">
                        <span>{isPt ? sp.scoringNotePt : sp.scoringNoteEn}</span>
                        <span className="font-bold text-emerald-300 tabular-nums shrink-0 ml-2">
                          +{sp.rewardReputation} REP · +${sp.rewardCash}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reset Career Inline Confirmation */}
              <div className="p-3 rounded-xl bg-[#0e1722] border border-white/10 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  {isPt ? 'Reiniciar trajetória em um novo save?' : 'Restart career with a new skater?'}
                </span>
                {confirmReset ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick(true);
                        setConfirmReset(false);
                        onResetCareer();
                      }}
                      className="h-8 px-2.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-[10px] font-bold text-white cursor-pointer"
                    >
                      {isPt ? 'CONFIRMAR' : 'CONFIRM'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="h-8 px-2.5 rounded-lg bg-[#131f2d] text-[10px] font-bold text-slate-300 cursor-pointer"
                    >
                      {isPt ? 'Cancelar' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick(false);
                      setConfirmReset(true);
                    }}
                    className="h-8 px-3 rounded-lg bg-[#131f2d] hover:bg-[#1a2b3d] border border-white/10 flex items-center gap-1.5 text-[11px] font-bold text-slate-200 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{isPt ? 'Nova Carreira' : 'New Career'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VIDA PROFISSIONAL */}
        {tab === 'pro_life' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* Left: Pending Interview + Agent Opportunities + Training */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              {/* Post-Competition Press Conference */}
              {careerSave.pendingInterview && (
                <div className="p-4 rounded-2xl bg-[#112436] border border-amber-400/60 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs font-extrabold tracking-widest text-amber-300">
                    <span>
                      {isPt ? 'COLETIVA DE IMPRENSA PENDENTE' : 'PENDING PRESS CONFERENCE'}
                    </span>
                    <span className="text-[10px] text-slate-300">{careerSave.pendingInterview.outlet}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    &ldquo;{isPt ? careerSave.pendingInterview.questionPt : careerSave.pendingInterview.questionEn}&rdquo;
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {careerSave.pendingInterview.options.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick(true);
                          onAnswerInterview(opt.id);
                        }}
                        className="p-2.5 rounded-xl bg-[#0b1520] hover:bg-[#152c40] border border-white/15 text-left cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span>{isPt ? opt.labelPt : opt.labelEn}</span>
                          <span className="text-[10px] text-emerald-300 tabular-nums shrink-0 ml-2">
                            +{opt.repDelta} REP {opt.cashDelta > 0 ? `· +$${opt.cashDelta}` : ''}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 italic mt-0.5">
                          &ldquo;{isPt ? opt.quotePt : opt.quoteEn}&rdquo;
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Agent Opportunities */}
              <div className="p-4 rounded-2xl bg-[#0e1722] border border-white/15 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.16em] text-[#38bdf8] uppercase">
                  <Briefcase className="w-4 h-4" />
                  <span>{isPt ? 'Agente Pessoal & Oportunidades' : 'Personal Agent & Gigs'}</span>
                </div>

                {careerSave.agentOpportunities.map((opp) => (
                  <div
                    key={opp.id}
                    className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2.5 ${
                      opp.resolved
                        ? 'bg-[#0b121b] border-white/5 opacity-55'
                        : 'bg-[#131f2d] border-white/12'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                        {opp.type === 'photo_gig' ? (
                          <Camera className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                        ) : opp.type === 'video_gig' ? (
                          <Film className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        )}
                        <span className="truncate">{isPt ? opp.titlePt : opp.titleEn}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {isPt ? opp.descPt : opp.descEn}
                      </p>
                      <div className="text-[10px] font-bold text-emerald-300 mt-1 tabular-nums">
                        +{opp.rewardRep} REP · +${opp.rewardCash} ·{' '}
                        <span className="text-slate-400">
                          {isPt ? opp.expiresLabelPt : opp.expiresLabelEn}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={opp.resolved}
                      onClick={() => {
                        if (opp.resolved) return;
                        soundEngine.playClick(true);
                        onLaunchCareerGameplay({
                          mode: opp.ruleMode === 'standard' ? 'competition' : 'free_skate',
                          eventTitle: isPt ? opp.titlePt : opp.titleEn,
                          source: 'career',
                          ruleMode: opp.ruleMode ?? 'photo_shoot',
                          atmosphere: 'day',
                          durationSeconds: opp.ruleMode === 'standard' ? 45 : undefined,
                          careerActivityId: opp.id,
                          playerDisplayName: playerFullName,
                          playerNationalityCode: careerSave.identity.nationalityCode,
                        });
                      }}
                      className={`h-9 px-3.5 rounded-lg text-xs font-extrabold tracking-wider shrink-0 ${
                        opp.resolved
                          ? 'bg-white/5 text-slate-400 cursor-default'
                          : 'bg-[#1587a3] hover:bg-[#1ea5c4] text-white cursor-pointer'
                      }`}
                    >
                      {opp.resolved
                        ? isPt
                          ? 'CONCLUÍDO'
                          : 'DONE'
                        : isPt
                          ? 'PARTICIPAR'
                          : 'GO TO PARK'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Free Training Drills */}
              <div className="p-4 rounded-2xl bg-[#0e1722] border border-white/15 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold tracking-[0.16em] text-[#38bdf8] uppercase">
                    {isPt ? 'Treinos Livres & Evolução' : 'Free Training & Progression'}
                  </span>
                  <span className="text-xs font-bold text-white tabular-nums">OVR {playerOverall}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {ATTRIBUTE_META.map((attr) => {
                    const active = trainingAttr === attr.key;
                    const val = careerSave.attributes[attr.key];
                    return (
                      <button
                        key={attr.key}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick(false);
                          setTrainingAttr(attr.key);
                        }}
                        className={`p-2 rounded-lg border text-left cursor-pointer ${
                          active
                            ? 'bg-[#12384b] border-[#38bdf8] text-white'
                            : 'bg-[#131f2d] border-white/10 text-slate-300'
                        }`}
                      >
                        <div className="text-[10px] truncate">{isPt ? attr.labelPt : attr.labelEn}</div>
                        <div className="text-sm font-extrabold text-[#38bdf8] tabular-nums">{val}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick(true);
                      const meta = ATTRIBUTE_META.find((a) => a.key === trainingAttr);
                      onLaunchCareerGameplay({
                        mode: 'free_skate',
                        eventTitle: `${isPt ? 'TREINO' : 'TRAINING'}: ${(meta?.[isPt ? 'labelPt' : 'labelEn'] ?? '').toUpperCase()}`,
                        source: 'career',
                        ruleMode: 'training_session',
                        atmosphere: 'day',
                        trainingTargetAttr: trainingAttr,
                        playerDisplayName: playerFullName,
                        playerNationalityCode: careerSave.identity.nationalityCode,
                      });
                    }}
                    className="h-10 rounded-xl bg-gradient-to-r from-[#0e7490] to-[#178ea9] border border-cyan-300/35 flex items-center justify-center gap-1.5 text-xs font-extrabold tracking-wider text-white cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{isPt ? 'TREINAR NA PISTA' : 'PLAY TRAINING'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick(false);
                      onQuickTrainAttr(trainingAttr);
                    }}
                    className="h-10 rounded-xl bg-[#131f2d] hover:bg-[#1a2b3d] border border-white/15 flex items-center justify-center gap-1.5 text-xs font-bold tracking-wider text-white cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>{isPt ? 'COACHING (+2 ATR)' : 'QUICK DRILL (+2)'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Sponsors + City Travel + Launch Showcase */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {/* Sponsors */}
              <div className="p-4 rounded-2xl bg-[#0e1722] border border-white/15 flex flex-col gap-2">
                <span className="text-xs font-extrabold tracking-[0.16em] text-[#38bdf8] uppercase">
                  {isPt ? 'Patrocinadores & Contratos' : 'Sponsors & Contracts'}
                </span>
                {careerSave.sponsors.map((sp) => {
                  const locked = careerSave.reputation < sp.minReputation;
                  return (
                    <div
                      key={sp.id}
                      className={`p-3 rounded-xl border ${
                        sp.active
                          ? 'bg-[#12384b]/90 border-[#38bdf8]/70'
                          : 'bg-[#131f2d] border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-extrabold text-white">{sp.name}</div>
                          <div className="text-[10px] text-slate-300">
                            {isPt ? sp.categoryPt : sp.categoryEn}
                          </div>
                        </div>

                        {sp.active ? (
                          <span className="text-[10px] font-extrabold text-emerald-300 tabular-nums">
                            {isPt ? `ATIVO · ${sp.remainingEvents} EV` : `ACTIVE · ${sp.remainingEvents} LEFT`}
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={locked}
                            onClick={() => {
                              soundEngine.playClick(true);
                              onSignSponsor(sp.id);
                            }}
                            className={`h-8 px-3 rounded-lg text-[10px] font-extrabold tracking-wider ${
                              locked
                                ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                                : 'bg-[#1587a3] hover:bg-[#1ea5c4] text-white cursor-pointer'
                            }`}
                          >
                            {locked
                              ? `${sp.minReputation} REP`
                              : sp.expiredBefore
                                ? isPt
                                  ? 'RENOVAR'
                                  : 'RENEW'
                                : isPt
                                  ? 'ASSINAR'
                                  : 'SIGN'}
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] text-cyan-200/85 mt-1">
                        {isPt ? sp.perkPt : sp.perkEn}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Travel + Launch Showcase */}
              <div className="p-4 rounded-2xl bg-[#0e1722] border border-white/15 flex flex-col gap-2.5">
                <span className="text-xs font-extrabold tracking-[0.16em] text-[#38bdf8] uppercase">
                  {isPt ? 'Viagens & Eventos de Lançamento' : 'City Travel & Launch Events'}
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {CAREER_CITIES.map((city) => {
                    const here = careerSave.activeCityId === city.id;
                    return (
                      <button
                        key={city.id}
                        type="button"
                        disabled={here}
                        onClick={() => {
                          soundEngine.playClick(false);
                          onTravelCity(city.id);
                        }}
                        className={`px-3 py-2 rounded-xl border flex items-center justify-between text-left ${
                          here
                            ? 'bg-[#12384b] border-[#38bdf8] cursor-default'
                            : 'bg-[#131f2d] hover:bg-[#1a2b3d] border-white/10 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CountryFlag code={city.countryCode} className="w-4 h-3 rounded-[2px]" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{city.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {isPt ? city.spotPt : city.spotEn}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#38bdf8] tabular-nums shrink-0">
                          {here ? (isPt ? 'ATUAL' : 'HERE') : city.travelCost > 0 ? `$${city.travelCost}` : isPt ? 'GRÁTIS' : 'FREE'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick(true);
                    onAttendLaunch();
                  }}
                  className="h-10 rounded-xl bg-[#131f2d] hover:bg-[#1b2d42] border border-cyan-400/35 flex items-center justify-center gap-2 text-xs font-extrabold tracking-wider text-white cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#38bdf8]" />
                  <span>{isPt ? 'EVENTO DE LANÇAMENTO DO PATROCINADOR' : 'ATTEND SPONSOR LAUNCH EVENT'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RELAÇÕES & RANKING */}
        {tab === 'relations' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'relations', pt: `Elenco & Relações (${careerSave.roster.length})`, en: `Skaters & Rivals (${careerSave.roster.length})` },
                  { id: 'intl', pt: 'Ranking Mundial', en: 'World Standings' },
                  { id: 'nat', pt: `Ranking ${careerSave.identity.nationalityCode}`, en: `${careerSave.identity.nationalityCode} Standings` },
                ] as const
              ).map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick(false);
                    setRelSubView(sub.id);
                    setSelectedSkater(null);
                  }}
                  className={`h-9 px-3 rounded-lg border text-xs font-bold cursor-pointer ${
                    relSubView === sub.id
                      ? 'bg-[#12384b] border-[#38bdf8] text-white'
                      : 'bg-[#0e1722] border-white/10 text-slate-300'
                  }`}
                >
                  {isPt ? sub.pt : sub.en}
                </button>
              ))}
            </div>

            {relSubView !== 'relations' ? (
              <div className="rounded-2xl bg-[#0e1722] border border-white/15 p-3.5 flex flex-col gap-1.5">
                {(relSubView === 'intl' ? standings.intl : standings.nat).map((row, idx) => (
                  <div
                    key={row.id}
                    className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      row.isPlayer
                        ? 'bg-[#12384b] border-[#38bdf8]/75 text-white font-bold'
                        : 'bg-[#131f2d] border-white/10 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 font-extrabold text-[#38bdf8] tabular-nums">#{idx + 1}</span>
                      <CountryFlag code={row.nationalityCode} className="w-4 h-3 rounded-[2px]" />
                      <span className="text-[10px] font-bold text-[#38bdf8] tabular-nums">
                        {row.competitorNumber}
                      </span>
                      <span className="truncate">{row.name}</span>
                    </div>
                    <div className="flex items-center gap-4 tabular-nums shrink-0 text-[11px]">
                      <span className="text-slate-400">OVR {row.overall}</span>
                      <span>
                        {row.wins}V · {row.podiums}P
                      </span>
                      <span className="font-extrabold text-[#38bdf8] w-16 text-right">
                        {row.seasonPoints} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedSkater ? (
              /* Detailed Athlete Modal/View */
              <div className="rounded-2xl bg-[#0e1722] border border-white/15 p-4 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playBack();
                    setSelectedSkater(null);
                  }}
                  className="self-start h-8 px-3 rounded-lg bg-[#131f2d] border border-white/10 flex items-center gap-1.5 text-xs font-bold text-white cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>{isPt ? 'VOLTAR AO ELENCO' : 'BACK TO ROSTER'}</span>
                </button>

                <div className="flex items-center gap-3.5">
                  <SkaterPortrait skater={selectedSkater} size="lg" />
                  <div>
                    <div className="text-[11px] font-bold text-[#38bdf8] tabular-nums">
                      {selectedSkater.competitorNumber} · OVR {computeSkaterOverall(selectedSkater.attributes)}
                    </div>
                    <h3 className="text-lg font-extrabold text-white">
                      {selectedSkater.firstName} &ldquo;{selectedSkater.nickname}&rdquo; {selectedSkater.lastName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                      <CountryFlag code={selectedSkater.nationalityCode} />
                      <span>
                        {isPt ? selectedSkater.nationalityPt : selectedSkater.nationalityEn} · {selectedSkater.age}{' '}
                        {isPt ? 'anos' : 'yrs'} ·{' '}
                        {isPt ? SKATER_STYLE_LABELS[selectedSkater.style].pt : SKATER_STYLE_LABELS[selectedSkater.style].en}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300">
                  {isPt ? selectedSkater.bioPt : selectedSkater.bioEn}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ATTRIBUTE_META.map((attr) => (
                    <div key={attr.key} className="p-2.5 rounded-lg bg-[#131f2d] border border-white/10">
                      <div className="text-[10px] text-slate-400">
                        {isPt ? attr.labelPt : attr.labelEn}
                      </div>
                      <div className="text-sm font-extrabold text-[#38bdf8] tabular-nums">
                        {selectedSkater.attributes[attr.key]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {careerSave.roster.map((sk) => {
                  const rel = careerSave.relations[sk.id];
                  const statusLabel =
                    rel?.status === 'rival'
                      ? isPt
                        ? 'RIVAL'
                        : 'RIVAL'
                      : rel?.status === 'friend'
                        ? isPt
                          ? 'AMIGO'
                          : 'ALLY'
                        : isPt
                          ? 'NEUTRO'
                          : 'NEUTRAL';
                  return (
                    <div
                      key={sk.id}
                      className="p-3 rounded-2xl bg-[#0e1722] border border-white/12 flex flex-col gap-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClick(false);
                            setSelectedSkater(sk);
                          }}
                          className="cursor-pointer shrink-0"
                        >
                          <SkaterPortrait skater={sk} size="sm" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CountryFlag code={sk.nationalityCode} className="w-4 h-3 rounded-[2px]" />
                              <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                                {sk.firstName} {sk.lastName}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-extrabold shrink-0 ${
                                rel?.status === 'rival'
                                  ? 'text-rose-400'
                                  : rel?.status === 'friend'
                                    ? 'text-emerald-300'
                                    : 'text-slate-400'
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 tabular-nums">
                            <span>{sk.competitorNumber}</span>
                            <span>·</span>
                            <span>#{sk.stats.internationalRank}</span>
                            <span>·</span>
                            <span>
                              H2H: {rel?.headToHeadWins ?? 0}V-{rel?.headToHeadLosses ?? 0}D
                            </span>
                          </div>
                        </div>
                      </div>

                      {rel && (
                        <>
                          <p className="text-[11px] text-slate-300 italic line-clamp-2 bg-[#131f2d]/70 px-2.5 py-1.5 rounded-lg">
                            &ldquo;{isPt ? rel.lastMessagePt : rel.lastMessageEn}&rdquo;
                          </p>

                          <div className="grid grid-cols-2 gap-2 text-[10px] tabular-nums">
                            <div>
                              <div className="flex justify-between text-emerald-300 mb-0.5">
                                <span>{isPt ? 'Amizade' : 'Friendship'}</span>
                                <span>{rel.friendship}</span>
                              </div>
                              <div className="h-1 rounded-full bg-[#192839]">
                                <div
                                  className="h-full rounded-full bg-emerald-400"
                                  style={{ width: `${rel.friendship}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-rose-300 mb-0.5">
                                <span>{isPt ? 'Rivalidade' : 'Rivalry'}</span>
                                <span>{rel.rivalryIntensity}</span>
                              </div>
                              <div className="h-1 rounded-full bg-[#192839]">
                                <div
                                  className="h-full rounded-full bg-rose-400"
                                  style={{ width: `${rel.rivalryIntensity}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                soundEngine.playClick(false);
                                onInteractSkater(sk.id, 'talk');
                              }}
                              className="h-8 px-2.5 rounded-lg bg-[#131f2d] hover:bg-[#1a2b3d] border border-white/10 flex items-center gap-1 text-[10px] font-bold text-slate-200 cursor-pointer"
                            >
                              <MessageSquare className="w-3 h-3 text-[#38bdf8]" />
                              <span>{isPt ? 'Conversar' : 'Talk'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                soundEngine.playClick(false);
                                onInteractSkater(sk.id, 'train');
                              }}
                              className="h-8 px-2.5 rounded-lg bg-[#131f2d] hover:bg-[#1a2b3d] border border-white/10 flex items-center gap-1 text-[10px] font-bold text-emerald-200 cursor-pointer"
                            >
                              <Handshake className="w-3 h-3 text-emerald-400" />
                              <span>{isPt ? 'Treinar' : 'Train'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                soundEngine.playClick(false);
                                onInteractSkater(sk.id, 'provoke');
                              }}
                              className="h-8 px-2.5 rounded-lg bg-[#131f2d] hover:bg-[#2a1a22] border border-white/10 flex items-center gap-1 text-[10px] font-bold text-rose-300 cursor-pointer"
                            >
                              <Flame className="w-3 h-3 text-rose-400" />
                              <span>{isPt ? 'Desafiar' : 'Challenge'}</span>
                            </button>

                            {rel.activeChallenge && (
                              <button
                                type="button"
                                onClick={() => {
                                  soundEngine.playClick(true);
                                  onLaunchCareerGameplay({
                                    mode: 'competition',
                                    eventTitle: isPt
                                      ? rel.activeChallenge!.titlePt
                                      : rel.activeChallenge!.titleEn,
                                    source: 'career',
                                    ruleMode: 'duel_1v1',
                                    atmosphere: 'day',
                                    durationSeconds: 40,
                                    rivalSkaterIds: [sk.id],
                                    targetScore: rel.activeChallenge!.targetScore,
                                    playerDisplayName: playerFullName,
                                    playerNationalityCode: careerSave.identity.nationalityCode,
                                  });
                                }}
                                className="ml-auto h-8 px-2.5 rounded-lg bg-rose-700 hover:bg-rose-600 flex items-center gap-1 text-[10px] font-extrabold text-white cursor-pointer"
                              >
                                <Swords className="w-3 h-3" />
                                <span>{isPt ? 'DUELO 1v1' : '1v1 DUEL'}</span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MÍDIA & NOTÍCIAS */}
        {tab === 'media' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* Left: Flow Skate Magazine & Pro Videos */}
            <div className="lg:col-span-6 flex flex-col gap-3">
              {/* Magazine Cover */}
              <div className="p-4 rounded-2xl bg-[#0e1722] border border-white/15 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-extrabold tracking-[0.16em] text-[#38bdf8] uppercase">
                  <span>{isPt ? 'Revista Flow Skate' : 'Flow Skate Magazine'}</span>
                  <span>#{careerSave.magazines[0]?.issueNumber ?? 1}</span>
                </div>

                {careerSave.magazines[0] && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#122638] to-[#0a121b] border border-cyan-400/35 flex gap-3.5 items-center">
                    <SkaterPortrait
                      customAppearance={careerSave.magazines[0].featuredAppearance}
                      jerseyNumber="01"
                      label={careerSave.magazines[0].featuredSkaterName}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#38bdf8]">
                        <CountryFlag
                          code={careerSave.magazines[0].featuredCountry}
                          className="w-3.5 h-2.5 rounded-[1px]"
                        />
                        <span>{careerSave.magazines[0].scoreLabel}</span>
                      </div>
                      <h3 className="text-sm font-extrabold text-white leading-snug mt-0.5">
                        {isPt
                          ? careerSave.magazines[0].headlinePt
                          : careerSave.magazines[0].headlineEn}
                      </h3>
                      <p className="text-[11px] text-cyan-100/85 mt-1">
                        {isPt
                          ? careerSave.magazines[0].excerptPt
                          : careerSave.magazines[0].excerptEn}
                      </p>
                    </div>
                  </div>
                )}

                {careerSave.magazines.length > 1 && (
                  <div className="flex flex-col gap-1.5">
                    {careerSave.magazines.slice(1, 4).map((m) => (
                      <div
                        key={m.id}
                        className="px-3 py-2 rounded-lg bg-[#131f2d] border border-white/10 flex items-center justify-between text-xs"
                      >
                        <span className="truncate font-semibold text-white">
                          #{m.issueNumber} · {isPt ? m.headlinePt : m.headlineEn}
                        </span>
                        <span className="text-[10px] text-[#38bdf8] shrink-0 ml-2">{m.featuredTrick}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pro Video Parts */}
              <div className="p-4 rounded-2xl bg-[#0e1722] border border-white/15 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.16em] text-[#38bdf8] uppercase">
                  <Film className="w-4 h-4" />
                  <span>{isPt ? 'Vídeos Profissionais Publicados' : 'Published Pro Video Parts'}</span>
                </div>

                {careerSave.videos.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    {isPt
                      ? 'Nenhum vídeo publicado ainda. Aceite oportunidades de gravação na aba Vida Profissional!'
                      : 'No video parts published yet. Film your first street/park part in Pro Life!'}
                  </p>
                ) : (
                  careerSave.videos.map((v) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-xl bg-[#131f2d] border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white truncate">{v.title}</div>
                        <div className="text-[11px] text-slate-300 mt-0.5 truncate">
                          {v.highlightTrick} · {v.cityName}
                        </div>
                      </div>
                      <div className="text-right tabular-nums shrink-0">
                        <div className="text-xs font-extrabold text-[#38bdf8]">
                          {v.views.toLocaleString()} views
                        </div>
                        <div className="text-[10px] text-emerald-300">+{v.repGained} REP</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Circuit News Feed */}
            <div className="lg:col-span-6 p-4 rounded-2xl bg-[#0e1722] border border-white/15 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.16em] text-[#38bdf8] uppercase mb-1">
                <Newspaper className="w-4 h-4" />
                <span>{isPt ? 'Notícias & Bastidores do Circuito' : 'Tour News & Circuit Wire'}</span>
              </div>

              {careerSave.newsFeed.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#131f2d] border border-white/10 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-[#38bdf8]">
                      {isPt ? item.tagLabelPt : item.tagLabelEn}
                    </span>
                    <span className="text-slate-400 tabular-nums">
                      {isPt ? `Temp. ${item.season}` : `S${item.season}`}
                    </span>
                  </div>
                  <div className="text-xs font-extrabold text-white">
                    {isPt ? item.headlinePt : item.headlineEn}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {isPt ? item.detailPt : item.detailEn}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: HALL DA FAMA & LEGADO */}
        {tab === 'legacy' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* Left: Player Legacy Stats + Historic Tricks + Track Records */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <div className="p-4 rounded-2xl bg-[#0e1722] border border-white/15">
                <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.16em] text-[#38bdf8] uppercase mb-3">
                  <Crown className="w-4 h-4" />
                  <span>{isPt ? 'Legado Pessoal no Hall da Fama' : 'Personal Hall of Fame Legacy'}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  {[
                    { label: isPt ? 'TÍTULOS' : 'TITLES', val: careerSave.hallOfFame.titles },
                    { label: isPt ? 'PÓDIOS' : 'PODIUMS', val: careerSave.hallOfFame.podiums },
                    { label: isPt ? 'TEMPORADAS' : 'SEASONS', val: careerSave.hallOfFame.seasonsCompleted },
                    { label: isPt ? 'MUNDIAIS' : 'WORLDS', val: careerSave.hallOfFame.worldChampionships },
                    { label: isPt ? 'DUELOS 1v1' : '1v1 WINS', val: careerSave.hallOfFame.duelWins },
                    {
                      label: isPt ? 'MELHOR RUN' : 'BEST RUN',
                      val: careerSave.hallOfFame.personalBestRunScore.toLocaleString(),
                    },
                    {
                      label: isPt ? 'MELHOR COMBO' : 'BEST COMBO',
                      val: careerSave.hallOfFame.personalBestComboScore.toLocaleString(),
                    },
                    {
                      label: isPt ? 'MAIOR SALTO' : 'MAX AIR',
                      val: `${careerSave.hallOfFame.personalMaxAirMeters.toFixed(2)}m`,
                    },
                  ].map((st) => (
                    <div key={st.label} className="p-2.5 rounded-xl bg-[#131f2d] border border-white/10">
                      <div className="text-[9px] font-bold tracking-wider text-slate-400">{st.label}</div>
                      <div className="text-sm font-extrabold text-white tabular-nums mt-0.5">{st.val}</div>
                    </div>
                  ))}
                </div>

                {careerSave.hallOfFame.historicTricks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">
                      {isPt ? 'Manobras Históricas Registradas' : 'Signature Historic Tricks'}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {careerSave.hallOfFame.historicTricks.map((tr) => (
                        <span
                          key={tr}
                          className="px-2.5 py-1 rounded-lg bg-[#131f2d] border border-white/10 text-[11px] font-semibold text-cyan-200"
                        >
                          {tr}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Track Records */}
              <div className="p-4 rounded-2xl bg-[#0e1722] border border-white/15 flex flex-col gap-2">
                <span className="text-xs font-extrabold tracking-[0.16em] text-[#38bdf8] uppercase">
                  {isPt ? 'Recordes da Pista' : 'Official Park Records'}
                </span>
                {careerSave.parkRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      rec.isPlayer ? 'bg-[#12384b] border-[#38bdf8]' : 'bg-[#131f2d] border-white/10'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-white">
                        {isPt ? rec.labelPt : rec.labelEn}
                      </div>
                      <div className="text-[11px] text-slate-300">
                        {rec.holderName} · {rec.trickNote}
                      </div>
                    </div>
                    <div className="text-sm font-extrabold text-[#38bdf8] tabular-nums">
                      {rec.value.toLocaleString()} {rec.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 5 Legends Categories + Past Season Archive */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="p-4 rounded-2xl bg-[#0e1722] border border-white/15 flex flex-col gap-2">
                <span className="text-xs font-extrabold tracking-[0.16em] text-[#38bdf8] uppercase">
                  {isPt ? 'Categorias de Lendas' : 'Legends Categories'}
                </span>
                {legendCategories.map((leg) => (
                  <div
                    key={leg.catEn}
                    className="px-3 py-2.5 rounded-xl bg-[#131f2d] border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="text-[10px] font-bold text-[#38bdf8] uppercase">
                        {isPt ? leg.catPt : leg.catEn}
                      </div>
                      <div className="font-extrabold text-white">{leg.name}</div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-300 tabular-nums">
                      {leg.detail}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-[#0e1722] border border-white/15 flex flex-col gap-2">
                <span className="text-xs font-extrabold tracking-[0.16em] text-[#38bdf8] uppercase">
                  {isPt ? 'Arquivo de Temporadas Anteriores' : 'Past Seasons Archive'}
                </span>
                {careerSave.pastSeasons.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    {isPt
                      ? 'Conclua sua primeira temporada completa para registrar campeões anuais e aposentadorias no arquivo.'
                      : 'Complete your first full season to archive champions, podiums, and hall of fame inductions.'}
                  </p>
                ) : (
                  careerSave.pastSeasons.map((ps) => (
                    <div
                      key={ps.seasonNumber}
                      className="p-3 rounded-xl bg-[#131f2d] border border-white/10 text-xs flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between font-extrabold text-white">
                        <span>
                          {isPt ? `Temporada ${ps.seasonNumber} (${ps.year})` : `Season ${ps.seasonNumber} (${ps.year})`}
                        </span>
                        <span className="text-[#38bdf8] tabular-nums">#{ps.playerRank}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                        <CountryFlag code={ps.worldChampionCountry} className="w-3.5 h-2.5 rounded-[1px]" />
                        <span>
                          {isPt ? 'Campeão Mundial:' : 'World Champion:'} <strong>{ps.worldChampionName}</strong>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
