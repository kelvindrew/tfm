/**
 * TFM SCHEDULER — Calendrier Mensuel des Rotations (Design Natif Haute Définition)
 * Conçu spécifiquement pour écran tactile mobile Android :
 * - Cartes de jours tactiles avec auras colorées distinctives (Ambre Jour, Bleu Nuit, Émeraude Repos)
 * - Badge de repère officiel TFM (A, B, C) parfaitement intégré
 * - Sélecteur d'équipe (A, B, C) en accès direct
 * - Résumé statistique adapté selon le régime (6/3, 10/4 sans nuit, 5/2)
 * - Fiche d'inspection du jour sélectionné détaillée et intuitive
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateCalendarGrid,
  calculateDay,
  calculateMonthSummary,
  getTodayDateString,
  MonthSummary,
  SHIFT_PATTERNS,
} from '../engine/rotationEngine';
import { CalendarGridDay, CycleDayInfo, RotationTeamId, ShiftType } from '../types';
import { LiquidGlassCard } from './LiquidGlassCard';

export const FullCalendar: React.FC = () => {
  const { shiftConfig, selectedTeam, setRotationTeam } = useApp();

  const todayStr = getTodayDateString();
  const todayParts = todayStr.split('-');
  const initialYear = parseInt(todayParts[0], 10) || 2026;
  const initialMonth = parseInt(todayParts[1], 10) || 11;

  const [currentYear, setCurrentYear] = useState<number>(initialYear);
  const [currentMonth, setCurrentMonth] = useState<number>(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [shiftFilter, setShiftFilter] = useState<'ALL' | ShiftType>('ALL');
  const [slideDirection, setSlideDirection] = useState<'none' | 'left' | 'right'>('none');

  // Gestes tactiles horizontaux (swipe)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.6) {
      if (deltaX < 0) {
        goToNextMonth();
      } else {
        goToPreviousMonth();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const goToPreviousMonth = () => {
    setSlideDirection('left');
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    setSlideDirection('right');
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const resetToToday = () => {
    const parts = todayStr.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    setSlideDirection('none');
    setCurrentYear(y);
    setCurrentMonth(m);
    setSelectedDate(todayStr);
  };

  useEffect(() => {
    if (slideDirection !== 'none') {
      const timer = setTimeout(() => setSlideDirection('none'), 220);
      return () => clearTimeout(timer);
    }
  }, [slideDirection, currentYear, currentMonth]);

  // Données de la grille complète
  const calendarGrid: CalendarGridDay[] = useMemo(() => {
    return calculateCalendarGrid(currentYear, currentMonth, shiftConfig);
  }, [currentYear, currentMonth, shiftConfig]);

  // Résumé statistique du mois civil
  const monthSummary: MonthSummary = useMemo(() => {
    return calculateMonthSummary(currentYear, currentMonth, shiftConfig);
  }, [currentYear, currentMonth, shiftConfig]);

  // Informations de la date sélectionnée
  const selectedDayInfo: CycleDayInfo = useMemo(() => {
    return calculateDay(selectedDate, shiftConfig);
  }, [selectedDate, shiftConfig]);

  // Nom du mois en français
  const formattedMonthTitle = useMemo(() => {
    const dateObj = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    return new Intl.DateTimeFormat('fr-FR', {
      month: 'long',
      year: 'numeric',
    }).format(dateObj);
  }, [currentYear, currentMonth]);

  // Formatage éditorial de la date sélectionnée
  const formattedSelectedFullDate = useMemo(() => {
    const parts = selectedDate.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(dateObj);
  }, [selectedDate]);

  const handleSelectDay = (day: CalendarGridDay) => {
    setSelectedDate(day.date);
    if (!day.isCurrentMonth) {
      setCurrentYear(day.year);
      setCurrentMonth(day.month);
    }
  };

  const isSelectedDayShift = selectedDayInfo.shiftType === 'DAY';
  const isSelectedNightShift = selectedDayInfo.shiftType === 'NIGHT';
  const isSelectedOffShift = selectedDayInfo.shiftType === 'OFF';

  const currentPattern = shiftConfig.pattern || '6/3';
  const patternDef = SHIFT_PATTERNS[currentPattern];
  const hasNightShifts = patternDef.nightShifts > 0;

  return (
    <div className="space-y-3.5 pb-24 pt-1">
      {/* 1. EN-TÊTE ÉPURÉ AVEC COMMANDES DE NAVIGATION TACTILES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-0.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18191D] dark:text-[#F4F4F5] capitalize">
              {formattedMonthTitle}
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              {patternDef.badge}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Planning TFM officiel · {patternDef.name} · Lubumbashi (CAT UTC+2)
          </p>
        </div>

        {/* Contrôles d'équipe & navigation mois */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {/* Sélecteur d'équipe A, B, C */}
          <div className="flex items-center p-0.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] mr-1">
            {(['A', 'B', 'C'] as RotationTeamId[]).map((tId) => (
              <button
                key={tId}
                type="button"
                onClick={() => setRotationTeam(tId)}
                title={`Afficher le planning de l'Équipe ${tId}`}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all ${
                  (selectedTeam || 'A') === tId
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Eq. {tId}
              </button>
            ))}
          </div>

          <button
            onClick={resetToToday}
            className="min-h-[38px] px-3 flex items-center gap-1.5 rounded-xl text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] active:scale-95 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">Aujourd'hui</span>
          </button>

          <button
            onClick={goToPreviousMonth}
            aria-label="Mois précédent"
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-zinc-800 dark:text-zinc-200 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] active:scale-95 transition"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          </button>

          <button
            onClick={goToNextMonth}
            aria-label="Mois suivant"
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-zinc-800 dark:text-zinc-200 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] active:scale-95 transition"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* 2. RÉSUMÉ STATISTIQUE DU MOIS VIBRANT ET ADAPTÉ */}
      <div className="rounded-2xl bg-white dark:bg-[#18191D] border border-black/[0.06] dark:border-white/[0.08] p-2 shadow-xs">
        <div className={`grid ${hasNightShifts ? 'grid-cols-3' : 'grid-cols-2'} gap-2 text-center`}>
          {/* Postes de Jour */}
          <button
            onClick={() => setShiftFilter(shiftFilter === 'DAY' ? 'ALL' : 'DAY')}
            title="Filtrer les postes de jour"
            className={`p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-between gap-2 border ${
              shiftFilter === 'DAY'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-900 dark:text-amber-100 ring-1 ring-amber-500/30'
                : 'bg-amber-500/[0.05] border-amber-500/15 text-zinc-800 dark:text-zinc-200 hover:border-amber-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                <Sun className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <div className="text-left leading-tight">
                <span className="text-[11px] font-semibold block">Postes Jour</span>
                <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono">06h — 18h</span>
              </div>
            </div>
            <span className="text-base sm:text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
              {monthSummary.dayShiftsCount} <span className="text-[10px] font-normal opacity-70">j</span>
            </span>
          </button>

          {/* Postes de Nuit (affiché uniquement si le modèle a des nuits) */}
          {hasNightShifts && (
            <button
              onClick={() => setShiftFilter(shiftFilter === 'NIGHT' ? 'ALL' : 'NIGHT')}
              title="Filtrer les postes de nuit"
              className={`p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-between gap-2 border ${
                shiftFilter === 'NIGHT'
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500/30'
                  : 'bg-blue-500/[0.05] border-blue-500/15 text-zinc-800 dark:text-zinc-200 hover:border-blue-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
                  <Moon className="w-4 h-4" strokeWidth={2.2} />
                </div>
                <div className="text-left leading-tight">
                  <span className="text-[11px] font-semibold block">Postes Nuit</span>
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono">18h — 06h</span>
                </div>
              </div>
              <span className="text-base sm:text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
                {monthSummary.nightShiftsCount} <span className="text-[10px] font-normal opacity-70">j</span>
              </span>
            </button>
          )}

          {/* Jours de Repos */}
          <button
            onClick={() => setShiftFilter(shiftFilter === 'OFF' ? 'ALL' : 'OFF')}
            title="Filtrer les jours de repos"
            className={`p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-between gap-2 border ${
              shiftFilter === 'OFF'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500/30'
                : 'bg-emerald-500/[0.05] border-emerald-500/15 text-zinc-800 dark:text-zinc-200 hover:border-emerald-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <div className="text-left leading-tight">
                <span className="text-[11px] font-semibold block">Repos</span>
                <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono">Récupération</span>
              </div>
            </div>
            <span className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {monthSummary.offDaysCount} <span className="text-[10px] font-normal opacity-70">j</span>
            </span>
          </button>
        </div>
      </div>

      {/* 3. GRILLE MENSUELLE HAUTE DÉFINITION AVEC CELLULES TACTILES */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="rounded-3xl bg-white dark:bg-[#18191D] border border-black/[0.06] dark:border-white/[0.08] shadow-sm p-3 sm:p-4 overflow-hidden transition-all"
      >
        {/* Noms des 7 colonnes */}
        <div className="grid grid-cols-7 mb-2 border-b border-black/[0.04] dark:border-white/[0.06] pb-2 text-center select-none">
          {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map((d) => (
            <div
              key={d}
              className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider font-mono"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grille continue unifiée */}
        <div
          className={`grid grid-cols-7 gap-1 sm:gap-1.5 transition-transform duration-200 ${
            slideDirection === 'left'
              ? '-translate-x-1 opacity-90'
              : slideDirection === 'right'
              ? 'translate-x-1 opacity-90'
              : 'translate-x-0 opacity-100'
          }`}
        >
          {calendarGrid.map((day) => {
            const isSelected = day.date === selectedDate;
            const isToday = day.date === todayStr;
            const matchesFilter = shiftFilter === 'ALL' || day.shiftType === shiftFilter;

            const isDay = day.shiftType === 'DAY';
            const isNight = day.shiftType === 'NIGHT';
            const isOff = day.shiftType === 'OFF';

            // Couleurs de fond et bordure selon le poste
            let shiftBg = '';
            let pillColor = '';
            let typeLabel = '';

            if (isDay) {
              shiftBg = 'bg-amber-500/[0.08] dark:bg-amber-400/[0.09] border-amber-500/25 dark:border-amber-400/20 text-zinc-900 dark:text-zinc-100';
              pillColor = 'bg-amber-500 shadow-xs shadow-amber-500/40';
              typeLabel = 'Jour';
            } else if (isNight) {
              shiftBg = 'bg-blue-500/[0.08] dark:bg-blue-400/[0.09] border-blue-500/25 dark:border-blue-400/20 text-zinc-900 dark:text-zinc-100';
              pillColor = 'bg-blue-500 shadow-xs shadow-blue-500/40';
              typeLabel = 'Nuit';
            } else {
              shiftBg = 'bg-emerald-500/[0.08] dark:bg-emerald-400/[0.09] border-emerald-500/25 dark:border-emerald-400/20 text-zinc-900 dark:text-zinc-100';
              pillColor = 'bg-emerald-500 shadow-xs shadow-emerald-500/40';
              typeLabel = 'Repos';
            }

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={`relative h-14 sm:h-16 w-full flex flex-col justify-between p-1.5 rounded-2xl border transition-all duration-150 active:scale-95 select-none ${
                  isSelected
                    ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-md z-20 scale-[1.03]'
                    : shiftBg
                } ${
                  !day.isCurrentMonth
                    ? 'opacity-30 grayscale'
                    : !matchesFilter
                    ? 'opacity-20'
                    : 'opacity-100'
                }`}
              >
                {/* Ligne haute : Point Aujourd'hui + Repère TFM (A, B, C) */}
                <div className="w-full flex items-center justify-between h-3 leading-none">
                  {isToday ? (
                    <span
                      title="Aujourd'hui"
                      className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                    />
                  ) : (
                    <span className="w-1.5 h-1.5" />
                  )}

                  {day.landmarks.length > 0 && (
                    <span
                      title={`Repère officiel : ${day.landmarks.join(', ')}`}
                      className={`text-[8px] font-mono font-black px-1 py-0.2 rounded-full leading-none shadow-2xs ${
                        day.landmarks.includes('B')
                          ? isSelected
                            ? 'bg-amber-400 text-black'
                            : 'bg-amber-500 text-black'
                          : isSelected
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {day.landmarks[0]}
                    </span>
                  )}
                </div>

                {/* Numéro du jour centré et lisible */}
                <div className="w-full flex items-center justify-center my-auto">
                  <span
                    className={`text-sm sm:text-base font-bold font-mono tracking-tight tabular-nums ${
                      isSelected
                        ? 'text-white dark:text-zinc-950 font-extrabold text-base sm:text-lg'
                        : isToday
                        ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                        : ''
                    }`}
                  >
                    {day.day}
                  </span>
                </div>

                {/* Ligne basse : Pilule vibrante du quart de travail */}
                <div className="w-full flex items-center justify-center h-2.5">
                  <span
                    title={day.shiftLabel}
                    className={`h-1.5 w-4 sm:w-5 rounded-full transition-all ${
                      isSelected
                        ? 'bg-emerald-400 dark:bg-emerald-600'
                        : pillColor
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Légende en bas de calendrier */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-black/[0.04] dark:border-white/[0.06] text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-zinc-800 dark:text-zinc-200">Jour</span>
            </span>
            {hasNightShifts && (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-zinc-800 dark:text-zinc-200">Nuit</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-zinc-800 dark:text-zinc-200">Repos</span>
            </span>
          </div>

          <div className="text-[11px] font-mono opacity-80">
            {currentPattern === '6/3' && 'Repères TFM : B (J5 travail) · A/C (J9 fin cycle)'}
            {currentPattern === '10/4' && 'Régime 10/4 : 10j Jour · 4j Repos (aucun poste de nuit)'}
            {currentPattern === '5/2' && 'Régime 5/2 : 5j Jour · 2j Repos'}
          </div>
        </div>
      </div>

      {/* 4. FICHE D'INSPECTION DÉTAILLÉE DE LA JOURNÉE SÉLECTIONNÉE */}
      <LiquidGlassCard variant="default" className="p-4 sm:p-5 space-y-4">
        {/* En-tête de la journée */}
        <div className="flex items-start justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
                {formattedSelectedFullDate}
              </span>
              {selectedDate === todayStr && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  Aujourd'hui
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              {isSelectedDayShift && <Sun className="w-5 h-5 text-amber-500 shrink-0" strokeWidth={2.2} />}
              {isSelectedNightShift && <Moon className="w-5 h-5 text-blue-500 shrink-0" strokeWidth={2.2} />}
              {isSelectedOffShift && <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" strokeWidth={2.2} />}
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                {isSelectedDayShift && 'Poste de Jour (06h — 18h)'}
                {isSelectedNightShift && 'Poste de Nuit (18h — 06h)'}
                {isSelectedOffShift && 'Repos Récupérateur'}
              </h3>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Équipe {selectedTeam || 'A'} · {selectedDayInfo.phaseLabel || selectedDayInfo.shiftLabel}
            </p>
          </div>

          {/* Badge de position dans le cycle */}
          <div className="text-right shrink-0">
            <span className="text-sm font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 block">
              J{selectedDayInfo.cycleDay}/{patternDef.totalDays}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 block mt-0.5">
              Cycle {currentPattern}
            </span>
          </div>
        </div>

        {/* Détails opérationnels en 2 colonnes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {/* Prochaine transition */}
          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
              Prochaine bascule
            </span>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {selectedDayInfo.nextTransition.description}
            </p>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 block">
              Date : {selectedDayInfo.nextTransition.targetDate}
            </span>
          </div>

          {/* Prochain jalon */}
          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
              {selectedDayInfo.nextMilestone.isRest ? 'Prochain repos' : 'Reprise du poste'}
            </span>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {selectedDayInfo.nextMilestone.description}
            </p>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 block">
              Échéance : dans {selectedDayInfo.nextMilestone.daysRemaining} jour(s)
            </span>
          </div>
        </div>

        {/* Repères TFM si applicables */}
        {selectedDayInfo.landmarks.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
              <Info className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Repère officiel TFM actif ce jour :</span>
            </div>
            {selectedDayInfo.landmarks.includes('B') && (
              <p className="text-amber-800 dark:text-amber-300">
                <strong>Repère B</strong> : Jour clé de travail opérationnel dans le cycle TFM.
              </p>
            )}
            {selectedDayInfo.landmarks.includes('A') && (
              <p className="text-amber-800 dark:text-amber-300">
                <strong>Repère A</strong> : Dernier jour de repos récupérateur avant reprise.
              </p>
            )}
            {selectedDayInfo.landmarks.includes('C') && (
              <p className="text-amber-800 dark:text-amber-300">
                <strong>Repère C</strong> : Dernier jour du cycle de rotation.
              </p>
            )}
          </div>
        )}
      </LiquidGlassCard>
    </div>
  );
};
