/**
 * TFM SCHEDULER — En-tête Épuré (Apple Minimal)
 * Conforme au système de tokens monochromatiques
 */

import React from 'react';
import {
  Bell,
  CheckCircle,
  FileCode2,
  Moon,
  RotateCw,
  Smartphone,
  Sun,
  SunMoon,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenTests: () => void;
  onOpenAndroidCode: () => void;
  onOpenPayrollPortal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTests,
  onOpenAndroidCode,
  onOpenPayrollPortal,
}) => {
  const {
    themeMode,
    setThemeMode,
    resolvedTheme,
    systemTheme,
    isSystemThemeActive,
    isOnline,
    pendingSyncCount,
    unreadAnnouncementsCount,
    setActiveTab,
    viewMode,
    setViewMode,
    orientation,
    toggleOrientation,
    user,
  } = useApp();

  const toggleTheme = () => {
    if (themeMode === 'system') setThemeMode('dark');
    else if (themeMode === 'dark') setThemeMode('light');
    else setThemeMode('system');
  };

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-6 pt-safe pb-2.5 bg-[#F4F4F5]/90 dark:bg-[#101114]/90 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.08] transition-colors">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
        {/* Marque TFM Scheduler minimaliste */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114] flex items-center justify-center font-bold text-xs tracking-wider select-none font-mono shadow-xs">
            TF
          </div>
          <div className="leading-tight">
            <span className="text-sm font-bold tracking-tight text-[#18191D] dark:text-[#F4F4F5] block">
              TFM Scheduler
            </span>
            <span className="text-[10px] text-zinc-500 font-mono block">
              Tenke Fungurume Mining
            </span>
          </div>
        </div>

        {/* Indicateur de statut réseau & synchronisation discret */}
        <div className="flex items-center gap-2 text-xs text-[#71717A] dark:text-[#A1A1AA]">
          <span className="flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.05]">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                isOnline ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="text-[10px] font-mono">{isOnline ? 'En ligne' : 'Hors-ligne'}</span>
          </span>
        </div>

        {/* Outils & Actions sobres */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Tests du moteur (discret sur desktop) */}
          <button
            onClick={onOpenTests}
            title="Exécuter les tests du moteur de rotation"
            className="hidden md:flex min-h-[36px] px-2.5 py-1 items-center gap-1.5 rounded-lg text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18191D] dark:hover:text-[#F4F4F5] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500/90" strokeWidth={1.5} />
            <span>Tests</span>
          </button>

          {/* Portail RH — Distribution des Bulletins */}
          {onOpenPayrollPortal && (
            <button
              onClick={onOpenPayrollPortal}
              title="Portail RH — Importation & Distribution des Bulletins"
              className="hidden sm:flex min-h-[36px] px-2.5 py-1 items-center gap-1.5 rounded-lg text-xs font-semibold text-[#18191D] dark:text-[#F4F4F5] bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Portail RH</span>
            </button>
          )}

          {/* Basculeur de thème avec détection automatique du système */}
          <button
            onClick={toggleTheme}
            title={
              themeMode === 'system'
                ? `Thème Automatique : suit le système (${systemTheme === 'dark' ? 'Sombre' : 'Clair'})`
                : `Thème Fixe : ${themeMode === 'dark' ? 'Sombre' : 'Clair'} (Cliquez pour basculer)`
            }
            className={`min-h-[38px] px-2 flex items-center gap-1 rounded-lg transition ${
              themeMode === 'system'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10'
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18191D] dark:hover:text-[#F4F4F5] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
            }`}
            aria-label="Basculer le thème"
          >
            {themeMode === 'system' ? (
              <>
                <SunMoon className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-[10px] font-mono font-semibold hidden sm:inline">
                  Auto
                </span>
              </>
            ) : themeMode === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
            ) : (
              <Moon className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>

          {/* Notifications discrètes */}
          <button
            onClick={() => setActiveTab('announcements')}
            title="Annonces professionnelles"
            className="relative min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18191D] dark:hover:text-[#F4F4F5] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
          >
            <Bell className="w-4 h-4" strokeWidth={1.5} />
            {unreadAnnouncementsCount > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#18191D] dark:bg-[#F4F4F5] ring-1 ring-white dark:ring-[#101114]" />
            )}
          </button>

          {/* Profil utilisateur rapide */}
          <button
            onClick={() => setActiveTab('profile')}
            title={`Profil de ${user.fullName}`}
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18191D] dark:hover:text-[#F4F4F5] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition ml-0.5"
          >
            <User className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
};
