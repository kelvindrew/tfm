/**
 * TFM SCHEDULER — Calendrier Mensuel Officiel TFM
 * 
 * Reconstruit intégralement de zéro d'après la maquette mobile WhatsApp :
 * - Thème sombre industriel natif (fond ardoise profonde #17191F)
 * - Titre de mois clair et sous-titre officiel TFM
 * - Ligne de navigation épurée : [ ↺ Aujourd'hui ]  [ < ]  [ > ]
 * - Carte de synthèse exacte : Jour (xx j) · Nuit (xx j) · Repos (xx j)
 * - Grille mensuelle 7 colonnes : LUN, MAR, MER, JEU, VEN, SAM, DIM
 * - Indicateurs de quart :
 *   - ━ Trait horizontal plein pour poste Jour
 *   - ▢ Trait horizontal ajouré pour poste Nuit
 *   - • Point centré pour jour de Repos
 * - Repères de rotation TFM (A, B, C) au-dessus des numéros
 * - Jour sélectionné : Squircle blanc intense avec typographie noire contrastée
 * - Aucune configuration encombrante (gestion centralisée dans le Profil)
 */

import React, { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateCalendarGrid,
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

  // Défilement tactile swipe horizontal
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

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
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

  // Calcul de la grille des 35/42 jours du mois
  const calendarGrid: CalendarGridDay[] = useMemo(() => {
    return calculateCalendarGrid(currentYear, currentMonth, shiftConfig);
  }, [currentYear, currentMonth, shiftConfig]);

  // Synthèse du mois (nombre de jours travaillés, nuits, repos)
  const monthSummary: MonthSummary = useMemo(() => {
    return calculateMonthSummary(currentYear, currentMonth, shiftConfig);
  }, [currentYear, currentMonth, shiftConfig]);

  // Libellé officiel du mois
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
      className="max-w-md mx-auto space-y-3.5 pb-24 pt-1 select-none font-sans"
    >
      {/* 1. TITRE DU MOIS & SOUS-TITRE OFFICIEL */}
      <div className="space-y-1 px-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white capitalize">
          {formattedMonthTitle}
        </h1>
        <p className="text-xs text-zinc-400 leading-snug">
          Planning officiel TFM · Rotation {patternDef.name} ({patternDef.totalDays} jours) · Équipe {selectedTeam || 'A'} · Lubumbashi (CAT UTC+2)
        </p>
      </div>

      {/* 2. COMMANDES DE NAVIGATION ([ ↺ Aujourd'hui ] [ < ] [ > ]) */}
      <div className="flex items-center gap-2 px-1">
        <button
          type="button"
          onClick={resetToToday}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1E24] hover:bg-[#252830] text-zinc-200 text-xs font-semibold border border-white/[0.08] active:scale-95 transition shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-300" strokeWidth={1.8} />
          <span>Aujourd'hui</span>
        </button>

        <button
          type="button"
          onClick={goToPreviousMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#1C1E24] hover:bg-[#252830] text-zinc-200 border border-white/[0.08] active:scale-95 transition shadow-2xs"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={goToNextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#1C1E24] hover:bg-[#252830] text-zinc-200 border border-white/[0.08] active:scale-95 transition shadow-2xs"
          aria-label="Mois suivant"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. CARTE SYNTHÈSE DES POSTES (Jour, Nuit, Repos) */}
      <div className="rounded-2xl bg-[#17191F] border border-white/[0.06] p-3.5 shadow-sm">
        <div className={`grid ${hasNightShifts ? 'grid-cols-3' : 'grid-cols-2'} gap-2 text-center`}>
          {/* Jour */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
              <span className="w-2.5 h-1 rounded-full bg-zinc-300 inline-block" />
              <span>Jour</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
              {monthSummary.dayShiftsCount} <span className="text-xs font-normal opacity-70">j</span>
            </span>
          </div>

          {/* Nuit (affiché si le cycle comporte des nuits) */}
          {hasNightShifts && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                <span className="w-2.5 h-1 rounded-full border border-zinc-300 inline-block" />
                <span>Nuit</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                {monthSummary.nightShiftsCount} <span className="text-xs font-normal opacity-70">j</span>
              </span>
            </div>
          )}

          {/* Repos */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 inline-block" />
              <span>Repos</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
              {monthSummary.offDaysCount} <span className="text-xs font-normal opacity-70">j</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4. GRILLE MENSUELLE HAUTE DÉFINITION (7 colonnes) */}
      <div className="rounded-3xl bg-[#17191F] border border-white/[0.06] p-3.5 sm:p-4 shadow-md">
        {/* Noms des jours de la semaine */}
        <div className="grid grid-cols-7 mb-2.5 pb-2 border-b border-white/[0.06] text-center">
          {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map((dayName) => (
            <div
              key={dayName}
              className="text-[11px] font-semibold text-zinc-500 tracking-wider font-mono"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Grille continue des jours */}
        <div className="grid grid-cols-7 gap-y-1.5 gap-x-1 sm:gap-x-1.5">
          {calendarGrid.map((day) => {
            const isSelected = day.date === selectedDate;
            const isDay = day.shiftType === 'DAY';
            const isNight = day.shiftType === 'NIGHT';
            const isOff = day.shiftType === 'OFF';

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={`relative flex flex-col items-center justify-between py-1.5 px-0.5 rounded-2xl transition-all duration-150 min-h-[58px] active:scale-95 ${
                  isSelected
                    ? 'bg-white text-black shadow-xl ring-2 ring-white scale-105 z-10'
                    : 'hover:bg-white/5'
                } ${!day.isCurrentMonth ? 'opacity-25' : 'opacity-100'}`}
              >
                {/* Repère TFM (A, B, C) au-dessus du chiffre */}
                <div className="h-3 flex items-center justify-center">
                  {day.landmarks.length > 0 ? (
                    <span
                      className={`text-[9px] font-mono font-bold leading-none ${
                        isSelected ? 'text-zinc-700' : 'text-zinc-400'
                      }`}
                    >
                      {day.landmarks[0]}
                    </span>
                  ) : null}
                </div>

                {/* Numéro du jour */}
                <span
                  className={`text-sm sm:text-base font-bold font-mono tracking-tight leading-none my-0.5 tabular-nums ${
                    isSelected
                      ? 'text-black font-extrabold text-base'
                      : 'text-zinc-100'
                  }`}
                >
                  {day.day}
                </span>

                {/* Représentation du quart de travail (Trait / Contour / Point) */}
                <div className="h-2 flex items-center justify-center">
                  {isDay && (
                    <span
                      title="Poste Jour"
                      className={`h-1 w-3.5 rounded-full ${
                        isSelected ? 'bg-black' : 'bg-zinc-400'
                      }`}
                    />
                  )}
                  {isNight && (
                    <span
                      title="Poste Nuit"
                      className={`h-1 w-3.5 rounded-full border ${
                        isSelected ? 'border-black' : 'border-zinc-400'
                      }`}
                    />
                  )}
                  {isOff && (
                    <span
                      title="Repos"
                      className={`w-1 h-1 rounded-full ${
                        isSelected ? 'bg-black' : 'bg-zinc-500'
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Légende en bas de calendrier */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1.5 select-none text-center">
          <div className="flex items-center justify-center gap-4 text-xs font-medium text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-1 rounded-full bg-zinc-300" />
              <span>Jour</span>
            </span>

            {hasNightShifts && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded-full border border-zinc-300" />
                <span>Nuit</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              <span>Repos</span>
            </span>
          </div>

          <p className="text-[11px] text-zinc-500 font-mono">
            Rotation {patternDef.name} : {patternDef.badge}
          </p>
        </div>
      </div>
    </div>
  );
};
