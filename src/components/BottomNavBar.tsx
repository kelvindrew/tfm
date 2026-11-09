/**
 * TFM SCHEDULER — Barre de Navigation Inférieure (Apple Minimal Design)
 * Conforme à la Section 4 du Master Prompt :
 * Exactement 5 onglets : Accueil, Calendrier, Annonces, Messages, Profil.
 * Style iOS 16 TabBar avec micro-indicateur et icônes précises.
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
    { tab: 'messages', label: 'Messages', icon: MessageSquare },
    { tab: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#101114]/95 backdrop-blur-2xl border-t border-[#34363B] px-3 pb-safe pt-1 select-none">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center h-13">
        {navItems.map(({ tab, label, icon: Icon, badge }) => {
          const isActive = activeTab === tab || (tab === 'profile' && activeTab === 'payslips');

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="relative min-h-[44px] flex flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 group"
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  strokeWidth={isActive ? 2 : 1.5}
                  className={`w-[19px] h-[19px] transition-colors duration-150 ${
                    isActive ? 'text-white' : 'text-[#777C84] group-hover:text-white'
                  }`}
                />
                {badge && badge > 0 ? (
                  <span className="absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full bg-white ring-2 ring-[#101114]" />
                ) : null}
              </div>

              <span
                className={`text-[10px] tracking-tight mt-1 transition-colors duration-150 ${
                  isActive ? 'text-white font-semibold' : 'text-[#777C84] font-medium'
                }`}
              >
                {label}
              </span>

              {/* Indicateur de sélection iOS 16 discret */}
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
