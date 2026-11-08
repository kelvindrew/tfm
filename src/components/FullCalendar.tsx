/**
 * TFM SCHEDULER — Calendrier Épuré Haute Fidélité
 * 
 * Design conforme à la capture d'écran mobile :
 * - Titre de mois clair et sous-titre officiel TFM
 * - Barre de navigation sobre : [ ↺ Aujourd'hui ]  [ < ]  [ > ]
 * - Carte de synthèse : Jour (xx j), Nuit (xx j), Repos (xx j)
 * - Grille mensuelle 7 colonnes (LUN, MAR, MER, JEU, VEN, SAM, DIM)
 * - Indicateurs de quart épurés :
 *   - ━ Trait plein pour Jour
 *   - ▢ Trait ajouré pour Nuit
 *   - • Point centré pour Repos
 * - Repères d'équipes (A, B, C) intégrés
 * - Cellule active sélectionnée : Squircle blanc intense avec typographie noire
 * - Aucune configuration encombrante (déportée dans le Profil)
 */

import React, { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateCalendarGrid,
  calculateDay,
  calculateMonthSummary,
  getTodayDateString,
  MonthSummary,
  SHIFT_PATTERNS,
} from '../engine/rotationEngine';
import { CalendarGridDay } from '../types';

export const FullCalendar: React.FC = () => {
  const { shiftConfig, selectedTeam } = useApp();

  const todayStr = getTodayDateString();
  const todayParts = todayStr.split('-');
  const initialYear = parseInt(todayParts[0], 10) || 2026;
  const initialMonth = parseInt(todayParts[1], 10) || 11;

  const [currentYear, setCurrentYear] = useState<number>(initialYear);
  const [currentMonth, setCurrentMonth] = useState<number>(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Swipe tactile fluide
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

    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
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
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const resetToToday = () => {
    const parts = todayStr.split('-');
    setCurrentYear(parseInt(parts[0], 10));
    setCurrentMonth(parseInt(parts[1], 10));
    setSelectedDate(todayStr);
  };

  // Grille mensuelle continue
  const calendarGrid: CalendarGridDay[] = useMemo(() => {
    return calculateCalendarGrid(currentYear, currentMonth, shiftConfig);
  }, [currentYear, currentMonth, shiftConfig]);

  // Résumé statistique du mois
  const monthSummary: MonthSummary = useMemo(() => {
    return calculateMonthSummary(currentYear, currentMonth, shiftConfig);
  }, [currentYear, currentMonth, shiftConfig]);

  // Titre du mois en français
  const formattedMonthTitle = useMemo(() => {
    const dateObj = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const title = new Intl.DateTimeFormat('fr-FR', {
      month: 'long',
      year: 'numeric',
    }).format(dateObj);
    return title.charAt(0).toUpperCase() + title.slice(1);
  }, [currentYear, currentMonth]);

  const currentPattern = shiftConfig.pattern || '6/3';
  const patternDef = SHIFT_PATTERNS[currentPattern];
  const hasNightShifts = patternDef.nightShifts > 0;

  // Calcul du jalon du jour sélectionné
  const selectedDayInfo = useMemo(() => {
    return calculateDay(selectedDate, shiftConfig);
  }, [selectedDate, shiftConfig]);

  const handleSelectDay = (day: CalendarGridDay) => {
    setSelectedDate(day.date);
    if (!day.isCurrentMonth) {
      setCurrentYear(day.year);
      setCurrentMonth(day.month);
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="space-y-4 pb-24 pt-1 max-w-md mx-auto select-none"
    >
      {/* 1. TITRE DU MOIS & SOUS-TITRE (Exactement comme dans la capture) */}
      <div className="space-y-1 px-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {formattedMonthTitle}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
          Planning officiel TFM · Rotation {patternDef.name} ({patternDef.totalDays} jours) · Équipe {selectedTeam || 'A'} · Lubumbashi (CAT UTC+2)
        </p>
      </div>

      {/* 2. COMMANDES DE NAVIGATION (Bouton Aujourd'hui et flèches) */}
      <div className="flex items-center gap-2 px-1">
        <button
          type="button"
          onClick={resetToToday}
          className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1C1D22] dark:hover:bg-[#25272E] text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 border border-black/[0.04] dark:border-white/[0.06] shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Aujourd'hui</span>
        </button>

        <button
          type="button"
          onClick={goToPreviousMonth}
          className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1C1D22] dark:hover:bg-[#25272E] text-zinc-800 dark:text-zinc-200 flex items-center justify-center transition active:scale-95 border border-black/[0.04] dark:border-white/[0.06] shadow-2xs"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={goToNextMonth}
          className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1C1D22] dark:hover:bg-[#25272E] text-zinc-800 dark:text-zinc-200 flex items-center justify-center transition active:scale-95 border border-black/[0.04] dark:border-white/[0.06] shadow-2xs"
          aria-label="Mois suivant"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. CARTE RÉSUMÉ DES POSTES (Conforme au design de la capture) */}
      <div className="rounded-2xl bg-zinc-100/80 dark:bg-[#16171B] border border-black/[0.04] dark:border-white/[0.06] p-3.5 shadow-2xs">
        <div className={`grid ${hasNightShifts ? 'grid-cols-3' : 'grid-cols-2'} gap-2 text-center`}>
          {/* Jour */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              <span className="w-2.5 h-1 rounded-full bg-zinc-800 dark:bg-zinc-200 inline-block" />
              <span>Jour</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 dark:text-white mt-1">
              {monthSummary.dayShiftsCount} <span className="text-xs font-normal opacity-70">j</span>
            </span>
          </div>

          {/* Nuit (affiché si le régime comporte des nuits) */}
          {hasNightShifts && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                <span className="w-2.5 h-1 rounded-full border border-zinc-700 dark:border-zinc-300 inline-block" />
                <span>Nuit</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 dark:text-white mt-1">
                {monthSummary.nightShiftsCount} <span className="text-xs font-normal opacity-70">j</span>
              </span>
            </div>
          )}

          {/* Repos */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 dark:text-zinc-400 inline-block" />
              <span>Repos</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 dark:text-white mt-1">
              {monthSummary.offDaysCount} <span className="text-xs font-normal opacity-70">j</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4. GRILLE MENSUELLE PUR MINIMALISME */}
      <div className="rounded-3xl bg-zinc-100/50 dark:bg-[#16171B] border border-black/[0.04] dark:border-white/[0.06] p-3 sm:p-4 shadow-sm">
        {/* En-tête des 7 jours de la semaine */}
        <div className="grid grid-cols-7 mb-2.5 pb-2 border-b border-black/[0.04] dark:border-white/[0.06] text-center">
          {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map((dayName) => (
            <div
              key={dayName}
              className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wider font-mono"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Grille continue des jours */}
        <div className="grid grid-cols-7 gap-y-2 gap-x-1 sm:gap-x-2">
          {calendarGrid.map((day) => {
            const isSelected = day.date === selectedDate;
            const isToday = day.date === todayStr;
            const isDay = day.shiftType === 'DAY';
            const isNight = day.shiftType === 'NIGHT';
            const isOff = day.shiftType === 'OFF';

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={`group relative flex flex-col items-center justify-between py-1.5 px-0.5 rounded-2xl transition-all duration-150 min-h-[58px] active:scale-95 ${
                  isSelected
                    ? 'bg-white text-black shadow-lg ring-2 ring-white/60 dark:ring-white scale-105 z-10'
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                } ${!day.isCurrentMonth ? 'opacity-25' : 'opacity-100'}`}
              >
                {/* Repère TFM (A, B, C) au dessus du chiffre */}
                <div className="h-3 flex items-center justify-center">
                  {day.landmarks.length > 0 ? (
                    <span
                      className={`text-[9px] font-mono font-bold leading-none ${
                        isSelected
                          ? 'text-zinc-700'
                          : 'text-zinc-400 dark:text-zinc-500'
                      }`}
                    >
                      {day.landmarks[0]}
                    </span>
                  ) : isToday && !isSelected ? (
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                  ) : null}
                </div>

                {/* Numéro du jour */}
                <span
                  className={`text-sm sm:text-base font-bold font-mono tracking-tight leading-none my-0.5 tabular-nums ${
                    isSelected
                      ? 'text-black font-extrabold text-base'
                      : isToday
                      ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                      : 'text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  {day.day}
                </span>

                {/* Représentation visuelle du quart de travail (Conforme à la capture) */}
                <div className="h-2 flex items-center justify-center">
                  {isDay && (
                    <span
                      title="Poste Jour"
                      className={`h-1 w-3.5 rounded-full ${
                        isSelected ? 'bg-black' : 'bg-zinc-400 dark:bg-zinc-500'
                      }`}
                    />
                  )}
                  {isNight && (
                    <span
                      title="Poste Nuit"
                      className={`h-1 w-3.5 rounded-full border ${
                        isSelected
                          ? 'border-black'
                          : 'border-zinc-400 dark:border-zinc-500'
                      }`}
                    />
                  )}
                  {isOff && (
                    <span
                      title="Repos"
                      className={`w-1 h-1 rounded-full ${
                        isSelected ? 'bg-black' : 'bg-zinc-500 dark:bg-zinc-600'
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Légende officielle en bas de calendrier (Exactement comme dans la capture) */}
        <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] space-y-1.5 select-none">
          <div className="flex items-center justify-center gap-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-1 rounded-full bg-zinc-800 dark:bg-zinc-300" />
              <span>Jour</span>
            </span>

            {hasNightShifts && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded-full border border-zinc-700 dark:border-zinc-300" />
                <span>Nuit</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              <span>Repos</span>
            </span>
          </div>

          <p className="text-[11px] text-center text-zinc-400 dark:text-zinc-500 font-mono">
            Rotation {patternDef.name} : {patternDef.badge}
          </p>
        </div>
      </div>
    </div>
  );
};
