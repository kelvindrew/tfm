/**
 * TFM SCHEDULER — Tableau de Bord Principal (Apple Minimal)
 * Hiérarchie visuelle stricte, typographie soignée, monochromatique et lisibilité industrielle.
 */


import React, { useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronRight,
  FileText,
  Lock,
  MessageSquare,
  Moon,
  RotateCw,
  Shield,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateDay,
  calculateRange,
  getAllTeamsStatus,
  getShiftType,
  getTodayDateString,
  SHIFT_PATTERNS,
} from '../engine/rotationEngine';
import { Announcement, CycleDayInfo, RotationTeamId } from '../types';
import { LiquidGlassCard } from './LiquidGlassCard';
import { SyncStatusIndicator } from './SyncStatusIndicator';

interface HomeDashboardProps {
  onSelectAnnouncement: (announcement: Announcement) => void;
  onOpenTests: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onSelectAnnouncement,
  onOpenTests,
}) => {
  const {
    user,
    shiftConfig,
    selectedTeam,
    announcements,
    setActiveTab,
    allImportedPaySlips,
  } = useApp();

  const userDistributedSlip = allImportedPaySlips.find(
    (s) =>
      s.matricule.toUpperCase() === user.matricule.toUpperCase() &&
      (s.distributionStatus === 'DISTRIBUTED' || s.distributionStatus === 'VIEWED_BY_AGENT')
  );
  const isAwaitingVerification = userDistributedSlip?.distributionStatus === 'DISTRIBUTED';

  const todayStr = getTodayDateString();
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Données de rotation calculées de manière déterministe
  const currentDayInfo: CycleDayInfo = calculateDay(selectedDateStr, shiftConfig);
  const todayDayInfo: CycleDayInfo = calculateDay(todayStr, shiftConfig);
  const upcomingWeek: CycleDayInfo[] = calculateRange(todayStr, 7, shiftConfig);

  // Modèle de rotation actif (6/3, 5/2, ou 10/4)
  const currentPattern = shiftConfig.pattern || '6/3';
  const patternDef = SHIFT_PATTERNS[currentPattern] || SHIFT_PATTERNS['6/3'];
  const totalCycleDays = todayDayInfo.totalCycleDays || patternDef.totalDays;
  const currentTotalCycleDays = currentDayInfo.totalCycleDays || patternDef.totalDays;

  const formattedToday = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const getShiftDescriptor = (type: string) => {
    switch (type) {
      case 'DAY':
        return {
          title: 'Poste de Jour',
          hours: `${shiftConfig.dayShiftStart} — ${shiftConfig.dayShiftEnd}`,
          icon: Sun,
          label: 'Jour',
          short: 'J',
        };
      case 'NIGHT':
        return {
          title: 'Poste de Nuit',
          hours: `${shiftConfig.nightShiftStart} — ${shiftConfig.nightShiftEnd}`,
          icon: Moon,
          label: 'Nuit',
          short: 'N',
        };
      case 'OFF':
      default:
        return {
          title: 'Repos Récupérateur',
          hours: '24 heures de repos',
          icon: Sparkles,
          label: 'Repos',
          short: 'R',
        };
    }
  };

  const shiftInfo = getShiftDescriptor(currentDayInfo.shiftType);
  const ShiftIcon = shiftInfo.icon;

  return (
    <div className="space-y-6 pb-24 pt-1">
      {/* 1. EN-TÊTE COMPACT & IDENTITÉ AGENT */}
      <div className="flex items-start justify-between px-0.5">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] capitalize">
            {formattedToday}
          </span>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#18191D] dark:text-[#F4F4F5] mt-0.5">
            Bonjour, {user.fullName.split(' ')[0]}
          </h2>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Matricule {user.matricule} <span className="opacity-40">/</span> {user.rotationTeam}
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] block">
            Rotation {currentPattern} ({totalCycleDays}j)
          </span>
          <span className="text-xs font-semibold text-[#18191D] dark:text-[#F4F4F5] font-mono tabular-nums">
            Réf. {shiftConfig.referenceDate}
          </span>
        </div>
      </div>

      {/* INDICATEUR VISUEL DE SYNCHRONISATION LOCALE (ROTATIONS & ANNONCES) */}
      <SyncStatusIndicator />

      {/* BANNIÈRE DE SÉCURITÉ : Bulletin de paie reçu dans le coffre-fort */}
      {isAwaitingVerification && (
        <div
          onClick={() => setActiveTab('payslips')}
          className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 cursor-pointer hover:bg-amber-500/15 transition shadow-sm"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#18191D] dark:text-[#F4F4F5] truncate">
                  Bulletin de paie {userDistributedSlip?.period || 'Avril 2026'} disponible
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium shrink-0">
                  Verrouillé
                </span>
              </div>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5 truncate">
                Déposé dans votre coffre-fort. Vérification d'identité requise pour le déverrouiller.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-[#18191D] dark:text-[#F4F4F5] shrink-0 font-mono">
            <span className="hidden sm:inline">Déverrouiller</span>
            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
          </div>
        </div>
      )}

      {/* 2. INDICATEUR PROGRESSIF DE LA ROTATION (ADAPTATIF 6/3, 5/2, 10/4) */}
      <LiquidGlassCard variant="default" className="p-4 sm:p-5 overflow-hidden">
        <div className="space-y-4">
          {/* En-tête : Titre & Badge proéminent 'Jour X/total' */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                <RotateCw className="w-4 h-4" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Rotation {currentPattern} · {totalCycleDays} jours
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  Progression de l'Équipe {selectedTeam || 'A'}
                  {todayDayInfo.phaseLabel && (
                    <span className="ml-2 font-normal text-xs text-zinc-500 dark:text-zinc-400">
                      ({todayDayInfo.phaseLabel})
                    </span>
                  )}
                </h3>
              </div>
            </div>

            {/* Badge Équipe d'affectation & Jauge de cycle */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-black/[0.04] dark:border-white/[0.06] text-xs font-semibold font-mono text-zinc-800 dark:text-zinc-200">
                Équipe {selectedTeam || 'A'}
              </span>

              <div className="flex items-baseline gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400">
                  Jour
                </span>
                <span className="text-lg sm:text-xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-50">
                  {todayDayInfo.cycleDay}
                </span>
                <span className="text-xs font-mono font-semibold text-zinc-400 dark:text-zinc-500">
                  /{totalCycleDays}
                </span>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 tabular-nums">
                {Math.round((todayDayInfo.cycleDay / totalCycleDays) * 100)}%
              </span>
            </div>
          </div>

          {/* Barre de progression visuelle avec jauge fluide & repères */}
          <div className="space-y-2">
            <div className="relative w-full h-3 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden p-0.5 border border-black/[0.04] dark:border-white/[0.06]">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-zinc-800 via-zinc-900 to-emerald-600 dark:from-zinc-400 dark:via-zinc-200 dark:to-emerald-400 shadow-xs"
                style={{ width: `${(todayDayInfo.cycleDay / totalCycleDays) * 100}%` }}
              />
            </div>

            {/* Repères des jours de cycle avec icônes de confirmation */}
            <div className={`grid gap-1 sm:gap-1.5 ${
              totalCycleDays === 14 ? 'grid-cols-7 sm:grid-cols-14' : totalCycleDays === 7 ? 'grid-cols-7' : 'grid-cols-9'
            }`}>
              {Array.from({ length: totalCycleDays }, (_, i) => i + 1).map((dayNum) => {
                const isCurrent = dayNum === todayDayInfo.cycleDay;
                const isCompleted = dayNum < todayDayInfo.cycleDay;
                const pType = getShiftType(dayNum, currentPattern);
                const phaseLabel = pType === 'DAY' ? 'Jour' : pType === 'NIGHT' ? 'Nuit' : 'Repos';

                return (
                  <div
                    key={dayNum}
                    title={`Jour ${dayNum}/${totalCycleDays} · ${phaseLabel}`}
                    className={`flex flex-col items-center justify-between py-1.5 px-0.5 rounded-lg text-center transition-all ${
                      isCurrent
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs ring-2 ring-emerald-500/60 font-semibold'
                        : isCompleted
                        ? 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    <div className="flex items-center justify-center h-3">
                      {isCompleted ? (
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                      ) : isCurrent ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ) : (
                        <span className="text-[9px] font-mono opacity-50">·</span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono leading-none mt-0.5">
                      J{dayNum}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Segments de Phase dynamiques */}
          <div className={`grid gap-2 pt-0.5 text-xs ${
            patternDef.phases.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'
          }`}>
            {patternDef.phases.map((phase, pIdx) => {
              const isPhaseActive = todayDayInfo.cycleDay >= phase.startDay && todayDayInfo.cycleDay <= phase.endDay;
              return (
                <div
                  key={pIdx}
                  className={`p-2 sm:p-2.5 rounded-xl border transition ${
                    isPhaseActive
                      ? phase.type === 'DAY'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500/20'
                        : phase.type === 'NIGHT'
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500/20'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500/20'
                      : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.04] dark:border-white/[0.05] text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium truncate">
                      {phase.type === 'DAY' && <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" strokeWidth={2} />}
                      {phase.type === 'NIGHT' && <Moon className="w-3.5 h-3.5 text-blue-500 shrink-0" strokeWidth={2} />}
                      {phase.type === 'OFF' && <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2} />}
                      <span className="text-[11px] truncate">{pIdx + 1}. {phase.name}</span>
                    </div>
                    <span className="text-[10px] font-mono shrink-0 ml-1">J{phase.startDay}–J{phase.endDay}</span>
                  </div>
                  <p className="text-[10px] mt-1 font-mono text-zinc-500 dark:text-zinc-400">
                    {phase.daysCount}j ({phase.hours})
                  </p>
                </div>
              );
            })}
          </div>

          {/* Synthèse textuelle de progression */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] font-mono">
            <span>
              Aujourd'hui : Jour {todayDayInfo.cycleDay}/{totalCycleDays} ({todayDayInfo.shiftLabel})
            </span>
            <span className="text-zinc-800 dark:text-zinc-200 font-semibold">
              {totalCycleDays - todayDayInfo.cycleDay === 0
                ? 'Dernier jour du cycle de rotation'
                : `${totalCycleDays - todayDayInfo.cycleDay} jour(s) avant le prochain cycle de rotation`}
            </span>
          </div>
        </div>
      </LiquidGlassCard>

      {/* 2B. SITUATION SIMULTANÉE DES 3 ÉQUIPES DU SITE TFM (A, B, C) */}
      <LiquidGlassCard variant="default" className="p-4 sm:p-5">
        <div className="space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-500" strokeWidth={2} />
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Situation des 3 Équipes du Site TFM Aujourd'hui
              </h3>
            </div>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400">
              Régime {currentPattern}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {getAllTeamsStatus(todayStr, currentPattern, selectedTeam || 'A').map((ts) => {
              const isSelected = ts.team === (selectedTeam || 'A');
              const isDay = ts.shiftType === 'DAY';
              const isNight = ts.shiftType === 'NIGHT';
              const isOff = ts.shiftType === 'OFF';

              return (
                <div
                  key={ts.team}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs ring-1 ring-emerald-500/50'
                      : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.05] dark:border-white/[0.07] text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold font-mono">
                        {ts.teamName}
                      </span>
                      {isSelected && (
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-emerald-500 text-white dark:bg-emerald-600'
                            : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          Mon équipe
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono opacity-70">
                      J{ts.cycleDay}/{ts.totalCycleDays}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isDay && <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" strokeWidth={2.2} />}
                    {isNight && <Moon className="w-3.5 h-3.5 text-blue-500 shrink-0" strokeWidth={2.2} />}
                    {isOff && <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2.2} />}
                    <span className="text-xs font-semibold truncate">
                      {ts.phaseLabel}
                    </span>
                  </div>

                  <p className={`text-[10px] mt-1 truncate ${isSelected ? 'opacity-80' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {ts.shiftLabel}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </LiquidGlassCard>

      {/* 3. CARTE MAÎTRESSE DE ROTATION (ÉLÉMENT DOMINANT UNIQUE) */}
      <LiquidGlassCard variant="elevated" className="p-5 sm:p-6 overflow-hidden">
        <div className="space-y-5">
          {/* Ligne 1 : Méta-titre & Position de cycle */}
          <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
                {selectedDateStr === todayStr ? 'Statut du jour' : `Statut au ${selectedDateStr}`}
              </span>
              {selectedDateStr !== todayStr && (
                <button
                  onClick={() => setSelectedDateStr(todayStr)}
                  className="text-[11px] font-medium text-[#18191D] dark:text-[#F4F4F5] hover:underline"
                >
                  (Revenir à aujourd'hui)
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono font-medium tabular-nums text-[#18191D] dark:text-[#F4F4F5]">
              <span>Jour {currentDayInfo.cycleDay}</span>
              <span className="text-[#71717A] dark:text-[#A1A1AA]">/ {currentTotalCycleDays}</span>
            </div>
          </div>

          {/* Ligne 2 : Statut majeur & Horaires */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-[#18191D] dark:text-[#F4F4F5]">
                <ShiftIcon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#18191D] dark:text-[#F4F4F5]">
                  {shiftInfo.title}
                </h3>
                <p className="text-xs font-medium font-mono text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                  {shiftInfo.hours}
                </p>
              </div>
            </div>

            {/* Repères TFM si présents sur ce jour */}
            {currentDayInfo.landmarks.length > 0 && (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-xs font-mono font-semibold text-[#18191D] dark:text-[#F4F4F5]">
                  <span>Repère {currentDayInfo.landmarks.join(', ')}</span>
                </div>
                <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] text-right font-mono">
                  {currentDayInfo.landmarks.includes('B') && 'Jour de travail clé'}
                  {currentDayInfo.landmarks.includes('A') && 'Dernier jour de repos'}
                </span>
              </div>
            )}
          </div>

          {/* Ligne 3 : Trajectoire du cycle avec barre de progression */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs text-[#71717A] dark:text-[#A1A1AA]">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Progression du cycle</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] font-semibold text-[#18191D] dark:text-[#F4F4F5]">
                  Jour {currentDayInfo.cycleDay}/{currentTotalCycleDays}
                </span>
              </div>
              <span className="font-mono text-[11px] tabular-nums font-semibold text-[#18191D] dark:text-[#F4F4F5]">
                {Math.round((currentDayInfo.cycleDay / currentTotalCycleDays) * 100)}%
              </span>
            </div>

            {/* Barre de progression visuelle continue */}
            <div className="w-full h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out bg-[#18191D] dark:bg-[#F4F4F5]"
                style={{ width: `${(currentDayInfo.cycleDay / currentTotalCycleDays) * 100}%` }}
              />
            </div>

            {/* Segments épurés */}
            <div className={`grid gap-1.5 h-1.5 ${
              currentTotalCycleDays === 14 ? 'grid-cols-7 sm:grid-cols-14' : currentTotalCycleDays === 7 ? 'grid-cols-7' : 'grid-cols-9'
            }`}>
              {Array.from({ length: currentTotalCycleDays }, (_, i) => i + 1).map((step) => {
                const isCurrent = step === currentDayInfo.cycleDay;
                const isPassed = step < currentDayInfo.cycleDay;

                return (
                  <div
                    key={step}
                    className={`rounded-full transition-all duration-200 ${
                      isCurrent
                        ? 'bg-[#18191D] dark:bg-[#F4F4F5]'
                        : isPassed
                        ? 'bg-black/20 dark:bg-white/25'
                        : 'bg-black/[0.06] dark:bg-white/[0.08]'
                    }`}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#71717A] dark:text-[#A1A1AA] pt-0.5 font-mono">
              {patternDef.phases.map((p, idx) => (
                <span key={idx}>J{p.startDay}–J{p.endDay} {p.name.replace('Poste de ', '')}</span>
              ))}
            </div>
          </div>

          {/* Ligne 4 : Prochaine transition & Prochain repos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] text-xs">
            <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
              <span className="text-[11px] font-medium text-[#71717A] dark:text-[#A1A1AA] block">
                Prochaine bascule
              </span>
              <p className="font-semibold text-[#18191D] dark:text-[#F4F4F5] mt-0.5">
                {currentDayInfo.nextTransition.description}
              </p>
              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-mono mt-0.5 block">
                Date : {currentDayInfo.nextTransition.targetDate}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
              <span className="text-[11px] font-medium text-[#71717A] dark:text-[#A1A1AA] block">
                {currentDayInfo.nextMilestone.isRest ? 'Prochain repos' : 'Reprise du poste'}
              </span>
              <p className="font-semibold text-[#18191D] dark:text-[#F4F4F5] mt-0.5">
                {currentDayInfo.nextMilestone.description}
              </p>
              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-mono mt-0.5 block">
                Échéance : dans {currentDayInfo.nextMilestone.daysRemaining} jour(s)
              </span>
            </div>
          </div>
        </div>
      </LiquidGlassCard>

      {/* 3. APERÇU DU CALENDRIER (SÉLECTEUR HORIZONTAL COMPACT) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-sm font-semibold tracking-tight text-[#18191D] dark:text-[#F4F4F5]">
            Aperçu des 7 prochains jours
          </h3>
          <button
            onClick={() => setActiveTab('calendar')}
            className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18191D] dark:hover:text-[#F4F4F5] flex items-center gap-1 transition"
          >
            <span>Planning complet</span>
            <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
          </button>
        </div>

        {/* 7 Jours en disposition élégante et sobre */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {upcomingWeek.map((day) => {
            const isSelected = day.date === selectedDateStr;
            const isToday = day.date === todayStr;

            const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'narrow' }).format(
              new Date(day.date + 'T12:00:00Z')
            );

            return (
              <button
                key={day.date}
                onClick={() => setSelectedDateStr(day.date)}
                className={`flex flex-col items-center justify-between py-2.5 px-1 rounded-xl border text-center transition-all duration-150 active:scale-95 min-h-[80px] ${
                  isSelected
                    ? 'bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114] border-[#18191D] dark:border-white shadow-sm'
                    : isToday
                    ? 'bg-black/[0.04] dark:bg-white/[0.06] border-black/15 dark:border-white/20 text-[#18191D] dark:text-[#F4F4F5]'
                    : 'bg-white dark:bg-[#18191D] border-black/[0.06] dark:border-white/[0.08] text-[#18191D] dark:text-[#F4F4F5] hover:border-black/20 dark:hover:border-white/20'
                }`}
              >
                <span
                  className={`text-[10px] font-medium uppercase ${
                    isSelected ? 'opacity-80' : 'text-[#71717A] dark:text-[#A1A1AA]'
                  }`}
                >
                  {dayName}
                </span>

                <span className="text-sm font-semibold font-mono tabular-nums my-0.5">
                  {day.day}
                </span>

                {/* Indicateur de poste cohérent avec le calendrier */}
                <div className="flex flex-col items-center gap-1 w-full">
                  <div className="h-2 flex items-center justify-center">
                    {day.shiftType === 'DAY' && (
                      <span
                        className={`w-2.5 h-1 rounded-full ${
                          isSelected ? 'bg-white dark:bg-[#101114]' : 'bg-[#18191D] dark:bg-[#F4F4F5]'
                        }`}
                      />
                    )}
                    {day.shiftType === 'NIGHT' && (
                      <span
                        className={`w-2.5 h-1 rounded-full border ${
                          isSelected ? 'border-white dark:border-[#101114]' : 'border-[#18191D] dark:border-[#F4F4F5]'
                        }`}
                      />
                    )}
                    {day.shiftType === 'OFF' && (
                      <span
                        className={`w-1 h-1 rounded-full ${
                          isSelected ? 'bg-white/60 dark:bg-black/60' : 'bg-black/25 dark:bg-white/30'
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-0.5">
                    <span
                      className={`text-[9px] font-mono font-semibold px-1 rounded ${
                        isSelected
                          ? 'bg-white/20 dark:bg-black/20 text-inherit'
                          : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#71717A] dark:text-[#A1A1AA]'
                      }`}
                    >
                      {day.shiftType === 'DAY' ? 'J' : day.shiftType === 'NIGHT' ? 'N' : 'R'}
                    </span>

                    {day.landmarks.length > 0 && (
                      <span className="text-[8px] font-mono font-bold">
                        ·{day.landmarks[0]}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. ACCÈS RAPIDES ÉPURÉS (FEATURES RÉELLES UNIQUEMENT) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <LiquidGlassCard
          interactive
          onClick={() => setActiveTab('calendar')}
          className="p-3.5 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-[#18191D] dark:text-[#F4F4F5] shrink-0">
            <Calendar className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-[#18191D] dark:text-[#F4F4F5] truncate">Planning</h4>
            <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Rotations 2026</p>
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard
          interactive
          onClick={() => setActiveTab('payslips')}
          className="p-3.5 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-[#18191D] dark:text-[#F4F4F5] shrink-0">
            <FileText className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-[#18191D] dark:text-[#F4F4F5] truncate">Fiches de Paie</h4>
            <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Espace Sécurisé</p>
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard
          interactive
          onClick={() => setActiveTab('messages')}
          className="p-3.5 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-[#18191D] dark:text-[#F4F4F5] shrink-0">
            <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-[#18191D] dark:text-[#F4F4F5] truncate">Équipes</h4>
            <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Relèves de quart</p>
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard
          interactive
          onClick={onOpenTests}
          className="p-3.5 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-[#18191D] dark:text-[#F4F4F5] shrink-0">
            <Shield className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-[#18191D] dark:text-[#F4F4F5] truncate">Tests & Sécurité</h4>
            <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">37/37 Validés</p>
          </div>
        </LiquidGlassCard>
      </div>

      {/* 5. ANNONCES PROFESSIONNELLES ÉPURÉES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-sm font-semibold tracking-tight text-[#18191D] dark:text-[#F4F4F5]">
            Communications récentes
          </h3>
          <button
            onClick={() => setActiveTab('announcements')}
            className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18191D] dark:hover:text-[#F4F4F5] flex items-center gap-1 transition"
          >
            <span>Toutes les notes</span>
            <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
          </button>
        </div>

        <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06] rounded-2xl bg-white dark:bg-[#18191D] border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
          {announcements.slice(0, 3).map((announcement) => {
            const isUrgent = announcement.priority === 'URGENT' || announcement.priority === 'HIGH';

            return (
              <div
                key={announcement.id}
                onClick={() => onSelectAnnouncement(announcement)}
                className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                    <span className="font-semibold text-[#18191D] dark:text-[#F4F4F5]">
                      {announcement.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(announcement.publishedAt).toLocaleDateString('fr-FR')}</span>

                    {isUrgent && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-[#18191D] dark:text-[#F4F4F5] uppercase tracking-wider text-[10px]">
                          Prioritaire
                        </span>
                      </>
                    )}
                  </div>

                  <h4 className="text-xs sm:text-sm font-medium text-[#18191D] dark:text-[#F4F4F5] mt-1 truncate">
                    {announcement.title}
                  </h4>

                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5 line-clamp-1">
                    {announcement.content}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] shrink-0" strokeWidth={1.5} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
