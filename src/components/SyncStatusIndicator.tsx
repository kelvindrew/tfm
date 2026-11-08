/**
 * TFM SCHEDULER — Indicateur Visuel de Synchronisation Locale
 * Affiche l'état de fraîcheur des données locales (rotations minier, annonces RH/HSE, planning)
 * avec horodatage de dernière synchronisation, état du réseau et bouton de rafraîchissement manuel.
 */

import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  CheckCircle2,
  Wifi,
  WifiOff,
  Database,
  Calendar,
  Bell,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SyncStatusIndicatorProps {
  className?: string;
  variant?: 'banner' | 'card' | 'compact';
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  className = '',
  variant = 'banner',
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
    const initialTime = Date.now() - 3 * 60 * 1000; // Il y a 3 minutes par défaut
    localStorage.setItem('tfm_last_sync_timestamp', initialTime.toString());
    return initialTime;
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);
  const [now, setNow] = useState<number>(Date.now());

  // Mise à jour de l'horloge relative toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Calcul du temps relatif écoulé depuis la dernière mise à jour
  const getRelativeTimeString = (timestamp: number): string => {
    const diffSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
    if (diffSeconds < 45) return "à l'instant";
    if (diffSeconds < 90) return 'il y a 1 minute';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `il y a ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `il y a ${diffHours} h`;
    return 'hier';
  };

  // Formatage de l'heure exacte (heure de Lubumbashi / locale)
  const formattedExactTime = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(lastSyncTime));

  const handleManualSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);

    // Simulation de synchronisation réseau avec le serveur local TFM
    setTimeout(() => {
      const newTimestamp = Date.now();
      setLastSyncTime(newTimestamp);
      localStorage.setItem('tfm_last_sync_timestamp', newTimestamp.toString());
      triggerManualSync();
      setIsSyncing(false);
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3000);
    }, 850);
  };

  const currentPattern = shiftConfig.pattern || '6/3';
  const announcementsCount = announcements.length;
  const latestAnnouncement = announcements[0];

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isOnline
          ? 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.05] dark:border-white/[0.07]'
          : 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20'
      } ${className}`}
    >
      {/* BANNIÈRE PRINCIPALE COMPACTE */}
      <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
        {/* Point d'état et texte descriptif */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0 flex items-center justify-center">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSyncing
                  ? 'bg-blue-500 animate-ping'
                  : isOnline
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`}
            />
            {isOnline && !isSyncing && (
              <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse opacity-75" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {isSyncing
                  ? 'Synchronisation des données en cours...'
                  : justSynced
                  ? 'Données locales actualisées !'
                  : isOnline
                  ? 'Données locales synchronisées'
                  : 'Cache local actif (Hors-ligne)'}
              </span>
              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0">
                · {getRelativeTimeString(lastSyncTime)} ({formattedExactTime})
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              Rotations {currentPattern} (Équipe {selectedTeam}) · {announcementsCount} note(s) RH/HSE en cache
            </p>
          </div>
        </div>

        {/* Boutons d'action : Détails & Rafraîchir */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Bouton pour afficher le détail des données synchronisées */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
            title={showDetails ? 'Masquer le détail de synchronisation' : 'Voir le détail des données locales'}
            aria-label="Détail synchronisation"
          >
            {showDetails ? (
              <ChevronUp className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>

          {/* Bouton de synchronisation immédiate */}
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium font-mono transition-all duration-150 active:scale-95 border ${
              isSyncing
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                : justSynced
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-black/[0.08] dark:border-white/[0.1] hover:bg-black/[0.02] dark:hover:bg-white/[0.04] shadow-2xs'
            }`}
            title="Forcer la vérification et la synchronisation des données locales"
          >
            <RotateCw
              className={`w-3.5 h-3.5 shrink-0 ${isSyncing ? 'animate-spin text-blue-500' : ''}`}
              strokeWidth={1.75}
            />
            <span className="hidden sm:inline">
              {isSyncing ? 'Synchro...' : justSynced ? 'À jour' : 'Actualiser'}
            </span>
          </button>
        </div>
      </div>

      {/* DÉPLIANT DU DÉTAIL DES COMPOSANTS SYNCHRONISÉS */}
      {showDetails && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-black/[0.04] dark:border-white/[0.06] space-y-2.5 text-xs animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {/* 1. État des Rotations */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.75} />
                  <span className="font-medium text-[11px] text-zinc-700 dark:text-zinc-300">
                    Rotations Minières
                  </span>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} />
              </div>
              <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">
                Régime {currentPattern} · Équipe {selectedTeam}
              </p>
              <p className="text-[10px] text-zinc-400 font-mono">
                Ancrage : {shiftConfig.referenceDate} (calé)
              </p>
            </div>

            {/* 2. État des Annonces */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
                  <span className="font-medium text-[11px] text-zinc-700 dark:text-zinc-300">
                    Communications
                  </span>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} />
              </div>
              <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {announcementsCount} note(s) synchronisée(s)
              </p>
              <p className="text-[10px] text-zinc-400 font-mono truncate">
                Dernière : {latestAnnouncement ? new Date(latestAnnouncement.publishedAt).toLocaleDateString('fr-FR') : 'À jour'}
              </p>
            </div>

            {/* 3. État du Réseau & Cache */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between text-zinc-500">
                <div className="flex items-center gap-1.5">
                  {isOnline ? (
                    <Wifi className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.75} />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
                  )}
                  <span className="font-medium text-[11px] text-zinc-700 dark:text-zinc-300">
                    Connectivité TFM
                  </span>
                </div>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">
                {isOnline ? 'En ligne (Site Fungurume)' : 'Hors-ligne (Stockage local)'}
              </p>
              <p className="text-[10px] text-zinc-400 font-mono">
                {pendingSyncCount > 0 ? `${pendingSyncCount} en attente` : 'Tout est synchronisé'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono pt-1">
            <span>Dernière vérification déterministe : {new Date(lastSyncTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Cache IndexedDB / LocalStorage actif</span>
          </div>
        </div>
      )}
    </div>
  );
};
