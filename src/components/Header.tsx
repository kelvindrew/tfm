/**
 * TFM SCHEDULER — En-tête Épuré (Apple Minimal Design)
 * Conforme à la charte monochromatique Joey Banks iOS 16 :
 * - Fond flouté #101114/90, bordure ultra-fine #34363B
 * - Typographie San Francisco épurée
 * - Indicateur de statut réseau & synchronisation discret
 */

import React from 'react';
import {
  Bell,
  CheckCircle,
  Moon,
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
    systemTheme,
    isOnline,
    unreadAnnouncementsCount,
    setActiveTab,
    user,
  } = useApp();

  const toggleTheme = () => {
    if (themeMode === 'system') setThemeMode('dark');
    else if (themeMode === 'dark') setThemeMode('light');
    else setThemeMode('system');
  };

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-6 pt-safe pb-2.5 bg-[#101114]/90 backdrop-blur-2xl border-b border-[#34363B] transition-colors select-none">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Titre officiel */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-white text-[#101114] flex items-center justify-center font-bold text-xs tracking-wider select-none font-mono shadow-sm">
            TF
          </div>
          <div className="leading-tight">
            <span className="text-sm font-bold tracking-tight text-white block">
              TFM Scheduler
            </span>
            <span className="text-[10px] text-[#A1A1AA] font-mono block">
              Tenke Fungurume Mining
            </span>
          </div>
        </div>

        {/* Indicateur de connectivité en ligne */}
        <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
          <span className="flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full bg-[#202227] border border-[#34363B]">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                isOnline ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="text-[10px] font-mono text-white">{isOnline ? 'En ligne' : 'Hors-ligne'}</span>
          </span>
        </div>

        {/* Actions & Raccourcis */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Portail RH */}
          {onOpenPayrollPortal && (
            <button
              onClick={onOpenPayrollPortal}
              title="Portail RH — Importation & Distribution des Bulletins"
              className="hidden sm:flex min-h-[34px] px-2.5 py-1 items-center gap-1.5 rounded-lg text-xs font-semibold text-white bg-[#202227] border border-[#34363B] hover:border-[#777C84] transition"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>RH</span>
            </button>
          )}

          {/* Tests du moteur */}
          <button
            onClick={onOpenTests}
            title="Exécuter les tests du moteur de rotation"
            className="hidden md:flex min-h-[34px] px-2.5 py-1 items-center gap-1.5 rounded-lg text-xs font-medium text-[#A1A1AA] hover:text-white hover:bg-[#202227] transition border border-transparent hover:border-[#34363B]"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
            <span>37 Tests</span>
          </button>

          {/* Notifications */}
          <button
            onClick={() => setActiveTab('announcements')}
            title="Annonces professionnelles"
            className="relative min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-[#202227] border border-[#34363B] text-[#A1A1AA] hover:text-white hover:border-[#777C84] transition"
          >
            <Bell className="w-4 h-4" />
            {unreadAnnouncementsCount > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-white ring-2 ring-[#202227]" />
            )}
          </button>

          {/* Profil */}
          <button
            onClick={() => setActiveTab('profile')}
            title={`Profil de ${user.fullName}`}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-[#202227] border border-[#34363B] text-[#A1A1AA] hover:text-white hover:border-[#777C84] transition"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
