/**
 * TFM SCHEDULER — Application Principale
 * Tenke Fungurume Mining (TFM)
 *
 * Refonte visuelle complète : Minimalisme Apple, visionOS Liquid Glass, palette monochromatique.
 */

import React, { useState } from 'react';
import {
  Battery,
  RotateCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { AndroidCodeExportModal } from './components/AndroidCodeExportModal';
import { AdminPayrollPortalModal } from './components/AdminPayrollPortalModal';
import { AnnouncementsView } from './components/AnnouncementsView';
import { BottomNavBar } from './components/BottomNavBar';
import { DesignSystemModal } from './components/DesignSystemModal';
import { FullCalendar } from './components/FullCalendar';
import { Header } from './components/Header';
import { HomeDashboard } from './components/HomeDashboard';
import { LoginView } from './components/LoginView';
import { MessagingView } from './components/MessagingView';
import { PaySlipsView } from './components/PaySlipsView';
import { ProfileView } from './components/ProfileView';
import { TestRunnerModal } from './components/TestRunnerModal';
import { AppProvider, useApp } from './context/AppContext';
import { Announcement } from './types';

function MainApp() {
  const {
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    orientation,
    toggleOrientation,
    setOrientation,
    isOnline,
    isLoggedIn,
    loginWithCredentials,
  } = useApp();

  const [isTestsModalOpen, setIsTestsModalOpen] = useState(false);
  const [isAndroidCodeModalOpen, setIsAndroidCodeModalOpen] = useState(false);
  const [isPayrollPortalOpen, setIsPayrollPortalOpen] = useState(false);
  const [isDesignSystemModalOpen, setIsDesignSystemModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Gestion prévisible du bouton Retour Android & historique de navigation
  React.useEffect(() => {
    // Initialise l'état d'historique initial
    window.history.replaceState({ tab: activeTab }, '');

    const handlePopState = (e: PopStateEvent) => {
      // 1. Fermer les modales actives si ouvertes
      if (isDesignSystemModalOpen) {
        setIsDesignSystemModalOpen(false);
        return;
      }
      if (isPayrollPortalOpen) {
        setIsPayrollPortalOpen(false);
        return;
      }
      if (isTestsModalOpen) {
        setIsTestsModalOpen(false);
        return;
      }
      if (isAndroidCodeModalOpen) {
        setIsAndroidCodeModalOpen(false);
        return;
      }
      if (selectedAnnouncement) {
        setSelectedAnnouncement(null);
        return;
      }
      // 2. Si on est sur une sous-vue secondaire comme fiches de paie, revenir à l'accueil
      if (activeTab === 'payslips') {
        setActiveTab('dashboard');
        return;
      }
      // 3. Restaurer le tab précédent ou retourner à l'accueil
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
      } else if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, isTestsModalOpen, isAndroidCodeModalOpen, selectedAnnouncement, setActiveTab]);

  const handleSelectAnnouncement = (announcement: Announcement | null) => {
    setSelectedAnnouncement(announcement);
    if (announcement && activeTab !== 'announcements') {
      window.history.pushState({ tab: 'announcements' }, '');
      setActiveTab('announcements');
    }
  };

  // Si l'utilisateur est déconnecté, afficher l'écran d'authentification
  if (!isLoggedIn) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#101114] text-white flex flex-col items-center">
      {/* Barre de contrôle supérieure épurée */}
      <Header
        onOpenTests={() => setIsTestsModalOpen(true)}
        onOpenAndroidCode={() => setIsAndroidCodeModalOpen(true)}
        onOpenPayrollPortal={() => setIsPayrollPortalOpen(true)}
      />

      {/* Bannière Hors-Ligne sobre si réseau indisponible */}
      {!isOnline && (
        <div className="w-full bg-[#18191D] text-[#F4F4F5] border-b border-white/[0.08] px-4 py-1.5 text-center text-xs font-mono flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5 opacity-80" strokeWidth={1.5} />
          <span>Mode Hors-Ligne actif — Données locales et moteur de rotation 100% disponibles.</span>
        </div>
      )}

      {/* Contenu de l'application natif sans faux cadre de smartphone */}
      <main className="w-full max-w-xl mx-auto px-3.5 sm:px-5 py-3 sm:py-5 flex-1 pb-24">
        {activeTab === 'dashboard' && (
          <HomeDashboard
            onSelectAnnouncement={handleSelectAnnouncement}
            onOpenTests={() => setIsTestsModalOpen(true)}
          />
        )}
        {activeTab === 'calendar' && <FullCalendar />}
        {activeTab === 'announcements' && (
          <AnnouncementsView
            selectedAnnouncement={selectedAnnouncement}
            onSelectAnnouncement={setSelectedAnnouncement}
          />
        )}
        {activeTab === 'messages' && <MessagingView />}
        {(activeTab === 'profile' || activeTab === 'payslips') && (
          <ProfileView
            initialSubSection={activeTab === 'payslips' ? 'payslips' : 'overview'}
            onOpenTests={() => setIsTestsModalOpen(true)}
            onOpenAndroidCode={() => setIsAndroidCodeModalOpen(true)}
            onOpenPayrollPortal={() => setIsPayrollPortalOpen(true)}
            onOpenDesignSystem={() => setIsDesignSystemModalOpen(true)}
          />
        )}
      </main>

      {/* Barre de navigation mobile inférieure (Exactement 5 destinations) */}
      <BottomNavBar />

      {/* Modale d'exécution des tests unitaires du moteur */}
      <TestRunnerModal
        isOpen={isTestsModalOpen}
        onClose={() => setIsTestsModalOpen(false)}
      />

      {/* Modale d'export du code source Android Studio */}
      <AndroidCodeExportModal
        isOpen={isAndroidCodeModalOpen}
        onClose={() => setIsAndroidCodeModalOpen(false)}
      />

      {/* Modale du Guide de Style & Design System (Components, Templates, Colors & Typo) */}
      <DesignSystemModal
        isOpen={isDesignSystemModalOpen}
        onClose={() => setIsDesignSystemModalOpen(false)}
      />

      {/* Portail RH — Distribution Sécurisée des Bulletins Sage / TIA WFS */}
      <AdminPayrollPortalModal
        isOpen={isPayrollPortalOpen}
        onClose={() => setIsPayrollPortalOpen(false)}
        onSwitchToAgent={(mat) => {
          loginWithCredentials(mat, mat.replace(/[^0-9]/g, '').slice(-4) || '4821');
          setActiveTab('payslips');
          setIsPayrollPortalOpen(false);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
