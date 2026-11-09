/**
 * TFM SCHEDULER — Calendrier Mensuel Officiel TFM (Apple Minimal Design)
 * Conforme à la Section 6 du Master Prompt (iOS 16 Joey Banks inspiration) :
 * - Grille mensuelle 7 colonnes épurée avec jours réels (28, 29, 30, 31 jours et années bissextiles)
 * - Navigation de mois en mois et bouton rapide "Aujourd'hui"
 * - Indicateurs de quart sobres et lisibles (Jour, Nuit, Repos)
 * - Repères TFM (A, B, C) au-dessus des numéros de jours
 * - Carte de détails du jour sélectionné sous le calendrier (horaires, cycle, transition, repères)
 * - Palette exacte : #101114, #202227, #FFFFFF, #A1A1AA, #34363B, #777C84
 */

import React, { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Moon, RotateCcw, Sparkles, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateCalendarGrid,
  calculateDay,
  calculateMonthSummary,
  getTodayDateString,
  MonthSummary,
  SHIFT_PATTERNS,
} from '../engine/rotationEngine';
import { CalendarGridDay, CycleDayInfo } from '../types';

export const FullCalendar: React.FC = () => {
  const { shiftConfig, selectedTeam } = useApp();

  const todayStr = getTodayDateString();
  const todayParts = todayStr.split('-');
  const initialYear = parseInt(todayParts[0], 10) || 2026;
  const initialMonth = parseInt(todayParts[1], 10) || 11;

  const [currentYear, setCurrentYear] = useState<number>(initialYear);
  const [currentMonth, setCurrentMonth] = useState<number>(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Swipe tactile
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

  // Synthèse du mois
  const monthSummary: MonthSummary = useMemo(() => {
    return calculateMonthSummary(currentYear, currentMonth, shiftConfig);
  }, [currentYear, currentMonth, shiftConfig]);

  // Détails du jour sélectionné
  const selectedDayInfo: CycleDayInfo = useMemo(() => {
    return calculateDay(selectedDate, shiftConfig);
  }, [selectedDate, shiftConfig]);

  // Libellé officiel du mois
  const formattedMonthTitle = useMemo(() => {
    const dateObj = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const title = new Intl.DateTimeFormat('fr-FR', {
      month: 'long',
      year: 'numeric',
    }).format(dateObj);
    return title.charAt(0).toUpperCase() + title.slice(1);
  }, [currentYear, currentMonth]);

  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(dateObj);
  }, [selectedDate]);

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
      className="max-w-md mx-auto space-y-4 pb-24 pt-1 select-none font-sans"
    >
      {/* 1. TITRE DU MOIS & NAVIGATION APPLE */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white capitalize">
            {formattedMonthTitle}
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Planning officiel TFM · Équipe {selectedTeam || 'A'}
          </p>
        </div>

        {/* Boutons de navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={resetToToday}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202227] hover:bg-[#282B32] text-white text-xs font-semibold border border-[#34363B] active:scale-95 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Aujourd'hui</span>
          </button>

          <button
            type="button"
            onClick={goToPreviousMonth}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#202227] hover:bg-[#282B32] text-white border border-[#34363B] active:scale-95 transition"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={goToNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#202227] hover:bg-[#282B32] text-white border border-[#34363B] active:scale-95 transition"
            aria-label="Mois suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. CARTE SYNTHÈSE DU MOIS (JOUR, NUIT, REPOS) */}
      <div className="rounded-2xl bg-[#202227] border border-[#34363B] p-3.5">
        <div className={`grid ${hasNightShifts ? 'grid-cols-3' : 'grid-cols-2'} gap-2 text-center`}>
          {/* Jour */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA] font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span>Jour</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
              {monthSummary.dayShiftsCount} <span className="text-xs font-normal text-[#777C84]">j</span>
            </span>
          </div>

          {/* Nuit */}
          {hasNightShifts && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA] font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                <span>Nuit</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                {monthSummary.nightShiftsCount} <span className="text-xs font-normal text-[#777C84]">j</span>
              </span>
            </div>
          )}

          {/* Repos */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#777C84] inline-block" />
              <span>Repos</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
              {monthSummary.offDaysCount} <span className="text-xs font-normal text-[#777C84]">j</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. GRILLE MENSUELLE HAUTE DÉFINITION (7 COLONNES) */}
      <div className="rounded-2xl bg-[#202227] border border-[#34363B] p-3.5 sm:p-4">
        {/* En-tête des jours de semaine */}
        <div className="grid grid-cols-7 mb-2 pb-2 border-b border-[#34363B] text-center">
          {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map((dayName) => (
            <div
              key={dayName}
              className="text-[11px] font-semibold text-[#777C84] font-mono tracking-wider"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Cellules des jours du mois */}
        <div className="grid grid-cols-7 gap-y-1.5 gap-x-1 sm:gap-x-1.5">
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
                className={`relative flex flex-col items-center justify-between py-1.5 px-0.5 rounded-xl transition-all duration-150 min-h-[56px] active:scale-95 ${
                  isSelected
                    ? 'bg-white text-[#101114] shadow-md ring-2 ring-white scale-105 z-10 font-bold'
                    : isToday
                    ? 'bg-[#282B32] text-white border border-[#777C84]'
                    : 'text-white hover:bg-[#282B32]'
                } ${!day.isCurrentMonth ? 'opacity-25' : 'opacity-100'}`}
              >
                {/* Repère TFM (A, B, C) */}
                <div className="h-2.5 flex items-center justify-center">
                  {day.landmarks.length > 0 ? (
                    <span
                      className={`text-[9px] font-mono font-bold leading-none ${
                        isSelected ? 'text-[#101114]' : 'text-[#A1A1AA]'
                      }`}
                    >
                      {day.landmarks[0]}
                    </span>
                  ) : null}
                </div>

                {/* Numéro du jour */}
                <span
                  className={`text-sm sm:text-base font-bold font-mono tracking-tight leading-none my-0.5 tabular-nums ${
                    isSelected ? 'text-[#101114] font-extrabold' : 'text-white'
                  }`}
                >
                  {day.day}
                </span>

                {/* Indicateur de quart sobre */}
                <div className="h-2 flex items-center justify-center">
                  {isDay && (
                    <span
                      title="Poste Jour"
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? 'bg-[#101114]' : 'bg-amber-400'
                      }`}
                    />
                  )}
                  {isNight && (
                    <span
                      title="Poste Nuit"
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? 'bg-[#101114]' : 'bg-blue-400'
                      }`}
                    />
                  )}
                  {isOff && (
                    <span
                      title="Repos"
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-[#101114]' : 'bg-[#777C84]'
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Légende en bas de calendrier */}
        <div className="mt-3.5 pt-3 border-t border-[#34363B] flex items-center justify-center gap-4 text-xs text-[#A1A1AA]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Jour</span>
          </span>

          {hasNightShifts && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Nuit</span>
            </span>
          )}

          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#777C84]" />
            <span>Repos</span>
          </span>
        </div>
      </div>

      {/* 4. DÉTAILS DU JOUR SÉLECTIONNÉ (APPLE INSET CARD) */}
      <div className="rounded-2xl bg-[#202227] border border-[#34363B] p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
              Détails du jour sélectionné
            </span>
            <h3 className="text-base font-bold text-white capitalize mt-0.5 truncate">
              {formattedSelectedDate}
            </h3>
          </div>

          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold tracking-wider ${
              selectedDayInfo.shiftType === 'DAY'
                ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                : selectedDayInfo.shiftType === 'NIGHT'
                ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                : 'bg-[#34363B]/40 text-[#A1A1AA] border border-[#34363B]'
            }`}
          >
            {selectedDayInfo.shiftType === 'DAY'
              ? 'JOUR'
              : selectedDayInfo.shiftType === 'NIGHT'
              ? 'NUIT'
              : 'REPOS'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-[#34363B]">
          <div>
            <span className="text-[10px] text-[#A1A1AA]">Poste & Horaires</span>
            <p className="font-semibold text-white mt-0.5">
              {selectedDayInfo.shiftType === 'DAY'
                ? '06:00 — 18:00 (12h)'
                : selectedDayInfo.shiftType === 'NIGHT'
                ? '18:00 — 06:00 (12h)'
                : '24h de repos complet'}
            </p>
          </div>

          <div>
            <span className="text-[10px] text-[#A1A1AA]">Cycle de rotation</span>
            <p className="font-semibold text-white mt-0.5">
              Jour {selectedDayInfo.cycleDay} sur 9 ({selectedDayInfo.shiftLabel})
            </p>
          </div>

          <div>
            <span className="text-[10px] text-[#A1A1AA]">Bascule suivante</span>
            <p className="font-semibold text-white mt-0.5">
              {selectedDayInfo.nextTransition.description}
            </p>
          </div>

          <div>
            <span className="text-[10px] text-[#A1A1AA]">Repère associé</span>
            <p className="font-semibold text-white mt-0.5">
              {selectedDayInfo.landmarks.length > 0
                ? `Repère ${selectedDayInfo.landmarks.join(', ')}`
                : 'Aucun repère'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
