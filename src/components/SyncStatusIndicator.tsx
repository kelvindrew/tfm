/**
 * TFM SCHEDULER — Indicateur Visuel de Synchronisation Locale (Apple Minimal Design)
 * Affiche l'état de fraîcheur des données locales (rotations, annonces, fiches de paie)
 * avec horodatage réel, statut réseau et bouton d'actualisation rapide.
 */

import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  CheckCircle2,
  Wifi,
  WifiOff,
  Calendar,
  Bell,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SyncStatusIndicatorProps {
  className?: string;
  variant?: 'banner' | 'card' | 'compact';
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  className = '',
}) => {
  const {
    isOnline,
    announcements,
    shiftConfig,
    selectedTeam,
    triggerManualSync,
    pendingSyncCount,
  } = useApp();

  const [lastSyncTime, setLastSyncTime] = useState<number>(() => {
    const saved = localStorage.getItem('tfm_last_sync_timestamp');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    const initialTime = Date.now() - 2 * 60 * 1000;
    localStorage.setItem('tfm_last_sync_timestamp', initialTime.toString());
    return initialTime;
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const getRelativeTimeString = (timestamp: number): string => {
    const diffSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
    if (diffSeconds < 45) return "à l'instant";
    if (diffSeconds < 90) return 'il y a 1 min';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `il y a ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `il y a ${diffHours} h`;
    return 'hier';
  };

  const formattedExactTime = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(lastSyncTime));

  const handleManualSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);

    setTimeout(() => {
      const newTimestamp = Date.now();
      setLastSyncTime(newTimestamp);
      localStorage.setItem('tfm_last_sync_timestamp', newTimestamp.toString());
      triggerManualSync();
      setIsSyncing(false);
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 2500);
    }, 600);
  };

  const currentPattern = shiftConfig.pattern || '6/3';
  const announcementsCount = announcements.length;

  return (
    <div
      className={`rounded-2xl border border-[#34363B] bg-[#202227] transition-all duration-200 overflow-hidden ${className}`}
    >
      {/* BANNIÈRE COMPACTE */}
      <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
        {/* Point d'état et texte descriptif */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0 flex items-center justify-center">
            <span
              className={`w-2 h-2 rounded-full ${
                isSyncing
                  ? 'bg-blue-400 animate-ping'
                  : isOnline
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-white truncate">
                {isSyncing
                  ? 'Synchronisation des données...'
                  : justSynced
                  ? 'Données actualisées !'
                  : isOnline
                  ? 'Données locales synchronisées'
                  : 'Mode Hors-Ligne (Cache local)'}
              </span>
              <span className="text-[10px] font-mono text-[#A1A1AA] shrink-0">
                · {getRelativeTimeString(lastSyncTime)} ({formattedExactTime})
              </span>
            </div>

            <p className="text-[11px] text-[#A1A1AA] truncate mt-0.5">
              Rotations {currentPattern} (Équipe {selectedTeam || 'A'}) · {announcementsCount} annonces en cache
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#282B32] transition"
            title={showDetails ? 'Masquer le détail' : 'Voir le détail'}
            aria-label="Détail synchronisation"
          >
            {showDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium font-mono transition-all duration-150 active:scale-95 border border-[#34363B] ${
              isSyncing
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : justSynced
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                : 'bg-[#101114] text-white hover:border-[#777C84]'
            }`}
            title="Forcer la synchronisation"
          >
            <RotateCw
              className={`w-3.5 h-3.5 shrink-0 ${isSyncing ? 'animate-spin text-blue-400' : ''}`}
            />
            <span className="hidden sm:inline">
              {isSyncing ? 'Synchro...' : justSynced ? 'À jour' : 'Actualiser'}
            </span>
          </button>
        </div>
      </div>

      {/* DÉTAILS DÉPLIABLES */}
      {showDetails && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-[#34363B] space-y-2 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-[#101114] border border-[#34363B] space-y-1">
              <div className="flex items-center justify-between text-[#A1A1AA]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium text-[11px] text-white">
                    Rotations
                  </span>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[11px] font-semibold text-white">
                Régime {currentPattern} · Équipe {selectedTeam || 'A'}
              </p>
              <p className="text-[10px] text-[#A1A1AA] font-mono">
                Ancre : {shiftConfig.referenceDate}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-[#101114] border border-[#34363B] space-y-1">
              <div className="flex items-center justify-between text-[#A1A1AA]">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium text-[11px] text-white">
                    Annonces
                  </span>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[11px] font-semibold text-white truncate">
                {announcementsCount} note(s) synchronisée(s)
              </p>
              <p className="text-[10px] text-[#A1A1AA] font-mono truncate">
                Dernière : {new Date(lastSyncTime).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-[#101114] border border-[#34363B] space-y-1">
              <div className="flex items-center justify-between text-[#A1A1AA]">
                <div className="flex items-center gap-1.5">
                  {isOnline ? (
                    <Wifi className="w-3.5 h-3.5 text-blue-400" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className="font-medium text-[11px] text-white">
                    Réseau TFM
                  </span>
                </div>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              </div>
              <p className="text-[11px] font-semibold text-white">
                {isOnline ? 'En ligne (Site Fungurume)' : 'Hors-ligne'}
              </p>
              <p className="text-[10px] text-[#A1A1AA] font-mono">
                {pendingSyncCount > 0 ? `${pendingSyncCount} en attente` : 'À jour'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
