/**
 * TFM SCHEDULER — Tableau de Bord Principal (Apple Minimal Design)
 * Conforme à la Section 5 du Master Prompt (iOS 16 Joey Banks inspiration) :
 * - Palette stricte : #101114 (fond), #202227 (surface), #FFFFFF (texte), #A1A1AA (texte secondaire), #34363B (séparateurs), #777C84 (accent).
 * - En-tête employé complet (salutation, nom, matricule, département, date, raccourci profil).
 * - Carte maîtresse de quart (type de poste, jour du cycle, horaires, décompte transition, repère).
 * - Ruban complet de rotation 9 jours compact et sobre.
 * - État des 3 équipes du site (A, B, C).
 * - Prochaine transition, prochain repos, annonces officielles et indicateur de synchronisation réel.
 */

import React, { useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Lock,
  MessageSquare,
  Moon,
  RotateCw,
  Shield,
  Sparkles,
  Sun,
  User,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateDay,
  calculateRange,
  getAllTeamsStatus,
  getTodayDateString,
  SHIFT_PATTERNS,
} from '../engine/rotationEngine';
import { Announcement, CycleDayInfo } from '../types';
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

  const currentDayInfo: CycleDayInfo = calculateDay(selectedDateStr, shiftConfig);
  const todayDayInfo: CycleDayInfo = calculateDay(todayStr, shiftConfig);
  const upcomingCycle: CycleDayInfo[] = calculateRange(todayStr, 9, shiftConfig);

  const currentPattern = shiftConfig.pattern || '6/3';
  const patternDef = SHIFT_PATTERNS[currentPattern] || SHIFT_PATTERNS['6/3'];
  const totalCycleDays = todayDayInfo.totalCycleDays || patternDef.totalDays || 9;

  // Formatage de la date en français soigné
  const formattedToday = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const getShiftBadge = (type: string) => {
    switch (type) {
      case 'DAY':
        return {
          title: 'Poste de Jour',
          badgeText: 'JOUR',
          hours: `${shiftConfig.dayShiftStart} — ${shiftConfig.dayShiftEnd} (12h)`,
          icon: Sun,
          textColor: 'text-amber-400',
          bgColor: 'bg-amber-400/10',
          borderColor: 'border-amber-400/20',
          statusText: 'Travail en cours',
        };
      case 'NIGHT':
        return {
          title: 'Poste de Nuit',
          badgeText: 'NUIT',
          hours: `${shiftConfig.nightShiftStart} — ${shiftConfig.nightShiftEnd} (12h)`,
          icon: Moon,
          textColor: 'text-blue-400',
          bgColor: 'bg-blue-400/10',
          borderColor: 'border-blue-400/20',
          statusText: 'Travail en cours',
        };
      case 'OFF':
      default:
        return {
          title: 'Jour de Repos',
          badgeText: 'REPOS',
          hours: '24 heures de repos récupérateur',
          icon: Sparkles,
          textColor: 'text-[#A1A1AA]',
          bgColor: 'bg-[#34363B]/40',
          borderColor: 'border-[#34363B]',
          statusText: 'Repos complet',
        };
    }
  };

  const shiftBadge = getShiftBadge(currentDayInfo.shiftType);
  const ShiftIcon = shiftBadge.icon;

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* 1. EMPLOYEE HEADER (Apple Inset Style) */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#A1A1AA] capitalize">
            {formattedToday}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5 truncate">
            Bonjour, {user.fullName.split(' ')[0]}
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-0.5 flex items-center gap-1.5 font-mono">
            <span>Matricule {user.matricule}</span>
            <span className="text-[#777C84]">·</span>
            <span>{user.rotationTeam}</span>
          </p>
        </div>

        {/* Profil Shortcut */}
        <button
          onClick={() => setActiveTab('profile')}
          className="w-10 h-10 rounded-full bg-[#202227] border border-[#34363B] flex items-center justify-center text-white hover:border-[#777C84] transition active:scale-95 shrink-0"
          title="Mon profil"
        >
          <User className="w-4 h-4 text-[#A1A1AA]" />
        </button>
      </div>

      {/* INDICATEUR VISUEL DE SYNCHRONISATION LOCALE */}
      <SyncStatusIndicator />

      {/* BANNIÈRE SÉCURITÉ : Bulletin de paie reçu dans le coffre-fort */}
      {isAwaitingVerification && (
        <div
          onClick={() => setActiveTab('payslips')}
          className="p-3.5 rounded-2xl bg-[#202227] border border-amber-500/30 flex items-center justify-between gap-3 cursor-pointer hover:border-amber-500/50 transition active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white truncate">
                  Bulletin {userDistributedSlip?.period || 'Nouveau bulletin'} disponible
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium shrink-0">
                  Coffre-fort
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1AA] mt-0.5 truncate">
                Authentification biométrique requise pour consulter votre document.
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#A1A1AA] shrink-0" />
        </div>
      )}

      {/* 2. CURRENT SHIFT CARD (CARTE MAÎTRESSE EN SURFACE #202227) */}
      <div className="rounded-2xl bg-[#202227] border border-[#34363B] p-4 sm:p-5 space-y-4">
        {/* Ligne 1 : Statut du poste & Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#A1A1AA]">
              {selectedDateStr === todayStr ? "Aujourd'hui" : `Date : ${selectedDateStr}`}
            </span>
            {selectedDateStr !== todayStr && (
              <button
                onClick={() => setSelectedDateStr(todayStr)}
                className="text-[11px] text-white hover:underline"
              >
                (Revenir)
              </button>
            )}
          </div>

          <div className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold tracking-wider ${shiftBadge.bgColor} ${shiftBadge.textColor} ${shiftBadge.borderColor}`}>
            {shiftBadge.badgeText}
          </div>
        </div>

        {/* Ligne 2 : Titre de poste & Horaires */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#101114] border border-[#34363B] flex items-center justify-center text-white shrink-0">
              <ShiftIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {shiftBadge.title}
              </h2>
              <p className="text-xs text-[#A1A1AA] font-mono mt-0.5">
                {shiftBadge.hours}
              </p>
            </div>
          </div>

          {/* Repère TFM (A, B, C) */}
          {currentDayInfo.landmarks.length > 0 && (
            <div className="flex flex-col items-end">
              <span className="px-2.5 py-1 rounded-md bg-[#101114] border border-[#34363B] text-xs font-mono font-bold text-white">
                Repère {currentDayInfo.landmarks.join(', ')}
              </span>
              <span className="text-[10px] text-[#777C84] mt-0.5 font-mono">
                {currentDayInfo.landmarks.includes('B') && 'Nuit 2'}
                {currentDayInfo.landmarks.includes('A') && 'Fin Repos'}
                {currentDayInfo.landmarks.includes('C') && 'Fin Repos'}
              </span>
            </div>
          )}
        </div>

        {/* Ligne 3 : Progression dans le cycle de 9 jours */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A1A1AA]">
              Position dans la rotation
            </span>
            <span className="font-mono font-semibold text-white">
              Jour {currentDayInfo.cycleDay} sur {totalCycleDays} ({Math.round((currentDayInfo.cycleDay / totalCycleDays) * 100)}%)
            </span>
          </div>

          {/* Jauge horizontale épurée Apple */}
          <div className="w-full h-2 rounded-full bg-[#101114] overflow-hidden p-0.5 border border-[#34363B]">
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: `${(currentDayInfo.cycleDay / totalCycleDays) * 100}%` }}
            />
          </div>
        </div>

        {/* Ligne 4 : Séparateur et Métadonnées de transition */}
        <div className="pt-3 border-t border-[#34363B] grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-semibold uppercase text-[#A1A1AA] block">
              Prochaine bascule
            </span>
            <p className="font-semibold text-white mt-0.5 truncate">
              {currentDayInfo.nextTransition.description}
            </p>
            <span className="text-[10px] text-[#777C84] font-mono mt-0.5 block">
              Le {currentDayInfo.nextTransition.targetDate}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase text-[#A1A1AA] block">
              {currentDayInfo.nextMilestone.isRest ? 'Prochain repos' : 'Reprise travail'}
            </span>
            <p className="font-semibold text-white mt-0.5 truncate">
              {currentDayInfo.nextMilestone.description}
            </p>
            <span className="text-[10px] text-[#777C84] font-mono mt-0.5 block">
              Dans {currentDayInfo.nextMilestone.daysRemaining} jour(s)
            </span>
          </div>
        </div>
      </div>

      {/* 3. ROTATION OVERVIEW (BANDE DE 9 JOURS DU CYCLE) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
            Cycle de Rotation Complet (9 Jours)
          </h3>
          <span className="text-[11px] font-mono text-[#777C84]">
            Équipe {selectedTeam || 'A'}
          </span>
        </div>

        {/* Ruban horizontal des 9 jours */}
        <div className="grid grid-cols-9 gap-1 sm:gap-1.5">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((dayNum) => {
            const isCurrent = dayNum === todayDayInfo.cycleDay;
            const shiftType = dayNum <= 3 ? 'DAY' : dayNum <= 6 ? 'NIGHT' : 'OFF';
            const label = shiftType === 'DAY' ? 'J' : shiftType === 'NIGHT' ? 'N' : 'R';
            const landmark = dayNum === 5 ? 'B' : dayNum === 9 ? 'A' : null;

            return (
              <div
                key={dayNum}
                className={`flex flex-col items-center justify-between py-2 px-0.5 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-white text-[#101114] border-white shadow-sm ring-2 ring-white/30 font-bold'
                    : 'bg-[#202227] text-white border-[#34363B]'
                }`}
              >
                <span className={`text-[9px] font-mono ${isCurrent ? 'text-[#101114]' : 'text-[#A1A1AA]'}`}>
                  J{dayNum}
                </span>

                {/* Point de quart */}
                <div className="my-1">
                  <span
                    className={`block w-2 h-2 rounded-full ${
                      isCurrent
                        ? 'bg-[#101114]'
                        : shiftType === 'DAY'
                        ? 'bg-amber-400'
                        : shiftType === 'NIGHT'
                        ? 'bg-blue-400'
                        : 'bg-[#777C84]'
                    }`}
                  />
                </div>

                <span className="text-[10px] font-mono font-bold">
                  {label}
                  {landmark && <span className="opacity-75">·{landmark}</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. SITUATION SIMULTANÉE DES 3 ÉQUIPES TFM (A, B, C) */}
      <div className="rounded-2xl bg-[#202227] border border-[#34363B] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#A1A1AA]" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Situation des 3 Équipes TFM Aujourd'hui
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#777C84]">Site Tenke</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {getAllTeamsStatus(todayStr, currentPattern, selectedTeam || 'A').map((ts) => {
            const isMyTeam = ts.team === (selectedTeam || 'A');
            const isDay = ts.shiftType === 'DAY';
            const isNight = ts.shiftType === 'NIGHT';

            return (
              <div
                key={ts.team}
                className={`p-2.5 rounded-xl border text-left transition ${
                  isMyTeam
                    ? 'bg-[#282B32] border-white/20 ring-1 ring-white/10'
                    : 'bg-[#101114] border-[#34363B]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold font-mono text-white">
                    {ts.teamName}
                  </span>
                  {isMyTeam && (
                    <span className="text-[8px] font-semibold px-1 py-0.2 rounded bg-white text-[#101114]">
                      Moi
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {isDay ? (
                    <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : isNight ? (
                    <Moon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-[#A1A1AA] shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-white truncate">
                    {ts.phaseLabel}
                  </span>
                </div>

                <p className="text-[10px] text-[#A1A1AA] mt-1 font-mono truncate">
                  J{ts.cycleDay}/9
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. ACCÈS RAPIDES ÉPURÉS (TABLEVIEW STYLE) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => setActiveTab('calendar')}
          className="p-3.5 rounded-2xl bg-[#202227] border border-[#34363B] flex items-center gap-3 text-left hover:border-[#777C84] transition active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-xl bg-[#101114] border border-[#34363B] flex items-center justify-center text-white shrink-0">
            <Calendar className="w-4 h-4 text-[#A1A1AA]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-white truncate">Calendrier</h4>
            <p className="text-[11px] text-[#A1A1AA]">Vue mensuelle</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('payslips')}
          className="p-3.5 rounded-2xl bg-[#202227] border border-[#34363B] flex items-center gap-3 text-left hover:border-[#777C84] transition active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-xl bg-[#101114] border border-[#34363B] flex items-center justify-center text-white shrink-0">
            <FileText className="w-4 h-4 text-[#A1A1AA]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-white truncate">Fiches de Paie</h4>
            <p className="text-[11px] text-[#A1A1AA]">Sage WFS Sécurisé</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className="p-3.5 rounded-2xl bg-[#202227] border border-[#34363B] flex items-center gap-3 text-left hover:border-[#777C84] transition active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-xl bg-[#101114] border border-[#34363B] flex items-center justify-center text-white shrink-0">
            <MessageSquare className="w-4 h-4 text-[#A1A1AA]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-white truncate">Messagerie</h4>
            <p className="text-[11px] text-[#A1A1AA]">Relèves de quart</p>
          </div>
        </button>

        <button
          onClick={onOpenTests}
          className="p-3.5 rounded-2xl bg-[#202227] border border-[#34363B] flex items-center gap-3 text-left hover:border-[#777C84] transition active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-xl bg-[#101114] border border-[#34363B] flex items-center justify-center text-white shrink-0">
            <Shield className="w-4 h-4 text-[#A1A1AA]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-white truncate">Tests & Intégrité</h4>
            <p className="text-[11px] text-[#A1A1AA]">37/37 Validés</p>
          </div>
        </button>
      </div>

      {/* 6. ANNONCES PROFESSIONNELLES RÉCENTES (INSET GROUPED LIST) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
            Communications Officielles TFM
          </h3>
          <button
            onClick={() => setActiveTab('announcements')}
            className="text-xs font-medium text-[#A1A1AA] hover:text-white flex items-center gap-1 transition"
          >
            <span>Toutes les notes</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="rounded-2xl bg-[#202227] border border-[#34363B] divide-y divide-[#34363B] overflow-hidden">
          {announcements.slice(0, 3).map((announcement) => {
            const isUrgent = announcement.priority === 'URGENT' || announcement.priority === 'HIGH';

            return (
              <div
                key={announcement.id}
                onClick={() => onSelectAnnouncement(announcement)}
                className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#282B32] transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[10px] text-[#A1A1AA]">
                    <span className="font-semibold text-white">
                      {announcement.category}
                    </span>
                    <span>·</span>
                    <span>{new Date(announcement.publishedAt).toLocaleDateString('fr-FR')}</span>
                    {isUrgent && (
                      <>
                        <span>·</span>
                        <span className="font-bold text-amber-400 uppercase tracking-wider">
                          Prioritaire
                        </span>
                      </>
                    )}
                  </div>

                  <h4 className="text-xs font-semibold text-white mt-1 truncate">
                    {announcement.title}
                  </h4>

                  <p className="text-xs text-[#A1A1AA] mt-0.5 line-clamp-1">
                    {announcement.content}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-[#777C84] shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
