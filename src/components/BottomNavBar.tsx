/**
 * TFM SCHEDULER — Barre de Navigation Inférieure (Apple Minimal)
 * Conforme à la Section 1 du Master Prompt :
 * 5 destinations uniques et claires : Accueil, Calendrier, Annonces, Messagerie, Profil.
 * Les fiches de paie et paramètres sont accessibles logiquement depuis le tableau de bord et le profil.
 */

import React from 'react';
import {
  Bell,
  Calendar,
  Home,
  MessageSquare,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';

export const BottomNavBar: React.FC = () => {
  const { activeTab, setActiveTab, unreadAnnouncementsCount } = useApp();

  const navItems: {
    tab: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    badge?: number;
  }[] = [
    { tab: 'dashboard', label: 'Accueil', icon: Home },
    { tab: 'calendar', label: 'Calendrier', icon: Calendar },
    { tab: 'announcements', label: 'Annonces', icon: Bell, badge: unreadAnnouncementsCount },
    { tab: 'messages', label: 'Messagerie', icon: MessageSquare },
    { tab: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#101114]/90 backdrop-blur-2xl border-t border-black/[0.06] dark:border-white/[0.08] px-3 pb-safe pt-1 transition-colors">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center h-13">
        {navItems.map(({ tab, label, icon: Icon, badge }) => {
          const isActive = activeTab === tab || (tab === 'profile' && activeTab === 'payslips');

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="relative min-h-[44px] flex flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 group select-none"
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  strokeWidth={isActive ? 2 : 1.5}
                  className={`w-[18px] h-[18px] transition-colors duration-150 ${
                    isActive
                      ? 'text-[#18191D] dark:text-[#F4F4F5]'
                      : 'text-[#71717A] dark:text-[#A1A1AA] group-hover:text-[#18191D] dark:group-hover:text-[#F4F4F5]'
                  }`}
                />
                {badge && badge > 0 ? (
                  <span className="absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full bg-[#18191D] dark:bg-[#F4F4F5]" />
                ) : null}
              </div>

              <span
                className={`text-[10px] tracking-tight mt-1 transition-colors duration-150 ${
                  isActive
                    ? 'text-[#18191D] dark:text-[#F4F4F5] font-semibold'
                    : 'text-[#71717A] dark:text-[#A1A1AA] font-medium'
                }`}
              >
                {label}
              </span>

              {/* Indicateur de sélection subtil */}
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#18191D] dark:bg-[#F4F4F5]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
