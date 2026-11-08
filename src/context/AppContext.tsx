/**
 * TFM SCHEDULER — Contexte Global, Sécurité & Persistance Locale
 * Tenke Fungurume Mining (TFM)
 *
 * Conforme aux exigences des Phases 1 à 4 :
 * - Gestion rigoureuse des sessions d'authentification et expiration d'inactivité (15 min).
 * - Contrôle d'accès basé sur les rôles (RBAC).
 * - Portail RH de découpage, sélection collective ("Tout cocher") et distribution sécurisée.
 * - Cloisonnement strict des données personnelles et fiches de paie.
 * - Vérification d'identité préalable OBLIGATOIRE avant déverrouillage de chaque bulletin.
 * - Idempotence et déduplication des messages hors-ligne.
 * - Aucune persistance de mot de passe en clair.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { BATCH_IMPORTED_PAYSLIPS, OFFICIAL_PDF_ASSET_PATH } from '../engine/payrollData';
import { DEFAULT_SHIFT_CONFIG, getCalibratedConfig } from '../engine/rotationEngine';
import {
  authenticateAgent,
  checkPermission,
  Permission,
  requestPayslipGrant,
  touchSession,
  validateSession,
  verifyPayslipAccess,
  SessionToken,
  PayslipGrant,
} from '../security/cryptoAuth';
import {
  ActiveTab,
  Announcement,
  Channel,
  Message,
  MessageSyncStatus,
  PaySlip,
  RotationTeamId,
  ShiftConfig,
  ShiftPattern,
  ThemeMode,
  UserProfile,
  UserRole,
} from '../types';

interface AppContextType {
  // Navigation & View
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  viewMode: 'full' | 'phone_frame';
  setViewMode: (mode: 'full' | 'phone_frame') => void;
  orientation: 'portrait' | 'landscape';
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
  toggleOrientation: () => void;

  // Thème & Détection Automatique Système
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
  systemTheme: 'light' | 'dark';
  isSystemThemeActive: boolean;

  // Utilisateur & Authentification
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
  isLoggedIn: boolean;
  sessionToken: SessionToken | null;
  loginWithCredentials: (
    matricule: string,
    secret: string
  ) => Promise<{ success: boolean; errorMessage?: string }>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;

  // Inactivité
  lastActivityTimestamp: number;
  inactivityWarning: boolean;
  refreshActivity: () => void;

  // Configuration des rotations & Équipes
  shiftConfig: ShiftConfig;
  selectedTeam: RotationTeamId;
  setRotationTeam: (team: RotationTeamId) => void;
  setShiftPattern: (pattern: ShiftPattern) => void;
  updateShiftConfig: (updates: Partial<ShiftConfig>) => void;
  resetShiftConfigToDefault: () => void;

  // Connectivité & Hors-Ligne Idempotent
  isOnline: boolean;
  pendingSyncCount: number;
  triggerManualSync: () => void;

  // Annonces
  announcements: Announcement[];
  unreadAnnouncementsCount: number;
  markAnnouncementRead: (id: string) => void;
  markAllAnnouncementsRead: () => void;
  publishAnnouncement: (
    title: string,
    content: string,
    category: Announcement['category'],
    priority: Announcement['priority']
  ) => { success: boolean; errorMessage?: string };

  // Messagerie & Canaux
  channels: Channel[];
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;
  messages: Message[];
  sendMessage: (
    channelId: string,
    content: string,
    extra?: {
      messageType?: 'text' | 'voice' | 'attachment' | 'handover' | 'image';
      voiceDuration?: string;
      attachmentName?: string;
      attachmentSize?: string;
      imageUrl?: string;
      imageCaption?: string;
    }
  ) => void;
  toggleMessageReaction: (messageId: string, emoji: string) => void;
  archiveChannel: (channelId: string) => void;
  unarchiveChannel: (channelId: string) => void;
  toggleArchiveChannel: (channelId: string) => void;
  joinOrCreateChannel: (channel: Partial<Channel> & { id: string; name: string }) => void;

  // Fiches de paie sécurisées (Cloisonnement & Grant éphémère)
  paySlips: PaySlip[];
  allImportedPaySlips: PaySlip[];
  isPaySlipsUnlocked: boolean;
  payslipGrant: PayslipGrant | null;
  unlockPaySlips: (secret: string) => Promise<{ success: boolean; errorMessage?: string }>;
  lockPaySlips: () => void;
  selectedPaySlip: PaySlip | null;
  setSelectedPaySlip: (slip: PaySlip | null) => void;

  // Distribution groupée par l'Admin RH (Sage / TIA WFS)
  distributePaySlipsToAgents: (slipIds: string[]) => { count: number };
  distributeAllPaySlips: () => { count: number };
  resetBatchDistribution: () => void;
  markPaySlipViewed: (slipId: string) => void;
}

const DEFAULT_USER_AGENT: UserProfile = {
  id: 'usr-wftf1013',
  matricule: 'WFTF1013',
  fullName: 'SHINDE NDALA PLATINI',
  role: 'SAMPLING OPERATOR',
  systemRole: 'AGENT',
  department: 'AM1 - MINE TECHNOLOGY GEO',
  rotationTeam: 'Équipe Rotation A',
  phone: '+243 81 928 3740',
  emergencyContact: '+243 99 481 0293 (Famille)',
  siteLocation: 'Complexe Industriel Fungurume — Mine Technology',
  securityClearance: 'Zone Industrielle Niveau 3',
  medicalClearanceDate: '2026-03-15 (Apte)',
};

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Alerte HSE : Travaux de tir de mine secteur Fwaire 2',
    content:
      "Tirs de mine programmés le jeudi 15 mai à 12h30 secteur Fwaire 2. Évacuation totale du périmètre de sécurité de 500m à partir de 11h45. Port des EPI obligatoire et respect strict des sirènes d'alerte.",
    category: 'HSE',
    publishedAt: '2026-05-12T08:00:00Z',
    priority: 'URGENT',
    isRead: false,
    author: 'Direction HSE TFM',
    department: 'Santé, Sécurité et Environnement',
    attachments: [
      { name: 'Plan_Evacuation_Fwaire_S12.pdf', size: '1.4 Mo', type: 'application/pdf' },
      { name: 'Consignes_Tir_Controle.pdf', size: '420 Ko', type: 'application/pdf' },
    ],
  },
  {
    id: 'ann-2',
    title: 'Navettes de transport : Ajustement des circuits de nuit',
    content:
      "En raison des travaux d'entretien sur l'axe Tenke-Fungurume, les départs des bus de relève de nuit (poste 18h) sont avancés de 15 minutes au départ de la Cité des Cadres et de Fungurume Centre.",
    category: 'ADMIN',
    publishedAt: '2026-05-11T14:30:00Z',
    priority: 'HIGH',
    isRead: false,
    author: 'Logistique & Transport',
    department: 'Services Généraux',
  },
  {
    id: 'ann-3',
    title: "Maintenance préventive : Broyeur SAG N°2 à l'arrêt",
    content:
      "Arrêt planifié pour rechargement des blindages et inspection des moteurs synchrones sur le broyeur semi-autogène 2 durant la rotation du 17 au 19 mai. Équipes mécaniques mobilisées en poste de nuit.",
    category: 'MAINT',
    publishedAt: '2026-05-10T09:15:00Z',
    priority: 'NORMAL',
    isRead: true,
    author: 'Ing. Kabwe Serge',
    department: 'Maintenance Usine Concentratrice',
  },
  {
    id: 'ann-4',
    title: 'Fête du Travail : Primes exceptionnelles enregistrées',
    content:
      "La Direction Générale informe l'ensemble des agents que les primes de prestation des jours fériés légaux sont intégrées au bulletin de paie de mai. Les détails sont consultables dans l'espace sécurisé.",
    category: 'HOLIDAY',
    publishedAt: '2026-05-02T10:00:00Z',
    priority: 'INFO',
    isRead: true,
    author: 'Direction des Ressources Humaines',
    department: 'RH & Paie',
  },
];

const INITIAL_CHANNELS: Channel[] = [
  {
    id: 'ch-team-a',
    name: 'Équipe A — Salle de Contrôle SX-EW',
    description: 'Relèves de postes, consignes de conduite et débit réactifs',
    iconName: 'Users',
    unreadCount: 1,
    isGroup: true,
  },
  {
    id: 'ch-sup-direct',
    name: 'Ilunga Mwamba (Superviseur Direct)',
    description: 'Ligne directe opérationnelle avec le chef de quart',
    iconName: 'UserCheck',
    unreadCount: 0,
    isGroup: false,
  },
  {
    id: 'ch-hse-alert',
    name: 'Vigilance HSE & Prévention Usine',
    description: "Signalements d'anomalies, stop-work authority et EPI",
    iconName: 'ShieldAlert',
    unreadCount: 0,
    isGroup: true,
  },
  {
    id: 'ch-maint-plant',
    name: 'Maintenance & Instrumentation B',
    description: 'Coordination des interventions mécaniques et étalonnages',
    iconName: 'Wrench',
    unreadCount: 0,
    isGroup: true,
  },
  {
    id: 'ch-rh-help',
    name: 'Support RH & Planning TFM',
    description: 'Questions sur rotations, congés et attestations de service',
    iconName: 'HelpCircle',
    unreadCount: 0,
    isGroup: false,
    isArchived: false,
  },
  {
    id: 'ch-arret-mai',
    name: 'Arrêt Majeur Broyeur SAG (Mai 2026)',
    description: 'Historique des opérations de maintenance programmée et blindages',
    iconName: 'Archive',
    unreadCount: 0,
    isGroup: true,
    isArchived: true,
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    channelId: 'ch-team-a',
    senderId: 'usr-9012',
    senderName: 'Ilunga Mwamba',
    senderRole: 'Superviseur de Quart',
    content: "Bonjour Équipe A. Débit du broyeur SAG stable à 980 t/h. La relève de 18h se fera comme prévu avec vérification des pompes d'extraction.",
    timestamp: '2026-05-12T15:45:00Z',
    status: 'delivered',
    idempotencyKey: 'idmp-init-1',
    reactions: { '👍': 4, '✅': 2 },
  },
  {
    id: 'msg-voice-1',
    channelId: 'ch-team-a',
    senderId: 'usr-9012',
    senderName: 'Ilunga Mwamba',
    senderRole: 'Superviseur de Quart',
    content: 'Consigne vocale : Point de situation cuves lixiviation et circuits acides',
    timestamp: '2026-05-12T15:46:30Z',
    status: 'delivered',
    idempotencyKey: 'idmp-init-voice',
    messageType: 'voice',
    voiceDuration: '0:18',
    reactions: { '👌': 3 },
  },
  {
    id: 'msg-2',
    channelId: 'ch-team-a',
    senderId: 'usr-wftf1013',
    senderName: 'Platini Shinde',
    senderRole: 'Sampling Operator',
    content: 'Bien reçu superviseur. Niveaux de réactifs et analyse densitométrique en cours dans la cuve 3.',
    timestamp: '2026-05-12T16:02:00Z',
    status: 'read',
    idempotencyKey: 'idmp-init-2',
    reactions: { '👍': 2 },
  },
  {
    id: 'msg-3',
    channelId: 'ch-team-a',
    senderId: 'usr-3310',
    senderName: 'Kalonji Tshilumba',
    senderRole: 'Technicien Instrumentation',
    content: 'Capteur de débit sur la ligne B calibré avec succès.',
    timestamp: '2026-05-12T16:15:00Z',
    status: 'delivered',
    idempotencyKey: 'idmp-init-3',
  },
  {
    id: 'msg-doc-1',
    channelId: 'ch-team-a',
    senderId: 'usr-3310',
    senderName: 'Kalonji Tshilumba',
    senderRole: 'Technicien Instrumentation',
    content: 'Fiche technique d\'étalonnage débitmètre électromagnétique',
    timestamp: '2026-05-12T16:16:00Z',
    status: 'delivered',
    idempotencyKey: 'idmp-init-doc',
    messageType: 'attachment',
    attachmentName: 'Fiche_Etalonnage_LigneB_Mai2026.pdf',
    attachmentSize: '340 Ko',
  },
  {
    id: 'msg-img-1',
    channelId: 'ch-team-a',
    senderId: 'usr-3310',
    senderName: 'Kalonji Tshilumba',
    senderRole: 'Technicien Instrumentation',
    content: "Cliché d'inspection : Contrôle des vannes de régulation cuve 4",
    timestamp: '2026-05-12T16:20:00Z',
    status: 'delivered',
    idempotencyKey: 'idmp-init-img-1',
    messageType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Vanne de purge et tuyauterie cuve 4 étanches après inspection couple.',
    reactions: { '👍': 3, '👌': 1 },
  },
  {
    id: 'msg-handover-1',
    channelId: 'ch-team-a',
    senderId: 'usr-4821',
    senderName: 'Patrick Mukendi',
    senderRole: 'Opérateur Salle de Contrôle',
    content: 'Relève de poste validée — Paramètres SX-EW nominaux, stock organique suffisant.',
    timestamp: '2026-05-12T17:55:00Z',
    status: 'delivered',
    idempotencyKey: 'idmp-init-handover',
    messageType: 'handover',
    reactions: { '✅': 5 },
  },
  {
    id: 'msg-sup-1',
    channelId: 'ch-sup-direct',
    senderId: 'usr-9012',
    senderName: 'Ilunga Mwamba',
    senderRole: 'Superviseur de Quart',
    content: 'Bonjour Platini. Peux-tu effectuer un prélèvement de confirmation à 17h30 sur l\'échantillonneur automatique AM1 ?',
    timestamp: '2026-05-12T16:20:00Z',
    status: 'delivered',
    idempotencyKey: 'idmp-sup-1',
    reactions: { '👍': 1 },
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeTab, setActiveTabState] = useState<ActiveTab>('dashboard');
  const [viewMode, setViewMode] = useState<'full' | 'phone_frame'>('phone_frame');
  const [orientation, setOrientationState] = useState<'portrait' | 'landscape'>(() => {
    const saved = localStorage.getItem('tfm_orientation_mode');
    return saved === 'landscape' || saved === 'portrait' ? saved : 'portrait';
  });

  const setOrientation = (mode: 'portrait' | 'landscape') => {
    setOrientationState(mode);
    localStorage.setItem('tfm_orientation_mode', mode);
  };

  const toggleOrientation = () => {
    setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait');
  };

  // Thème & Détection Automatique du Thème Système (Real-time listener)
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('tfm_theme_mode') : null;
    return (saved as ThemeMode) || 'system';
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('tfm_theme_mode') : null;
    const mode = (saved as ThemeMode) || 'system';
    if (mode === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark';
    }
    return mode;
  });

  // Écouteur en continu du thème du système d'exploitation / navigateur
  useEffect(() => {
    localStorage.setItem('tfm_theme_mode', themeMode);

    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (isSystemDark: boolean) => {
      const detected: 'light' | 'dark' = isSystemDark ? 'dark' : 'light';
      setSystemTheme(detected);

      const effective: 'light' | 'dark' =
        themeMode === 'system' ? detected : themeMode;

      setResolvedTheme(effective);

      const root = document.documentElement;
      if (effective === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      // Synchroniser la balise meta theme-color pour la barre d'état système mobile
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', effective === 'dark' ? '#101114' : '#F4F5F7');
      }
    };

    // Application initiale
    applyTheme(mediaQuery.matches);

    // Écouteur réactif sur changement de thème de l'OS en temps réel
    const handleMediaChange = (e: MediaQueryListEvent) => {
      applyTheme(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleMediaChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else if ((mediaQuery as any).removeListener) {
        (mediaQuery as any).removeListener(handleMediaChange);
      }
    };
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => setThemeModeState(mode);

  // Connectivité
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  // Utilisateur & Session
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('tfm_user_profile');
    return saved ? JSON.parse(saved) : DEFAULT_USER_AGENT;
  });

  // Jeton de session éphémère
  const [sessionToken, setSessionToken] = useState<SessionToken | null>(() => {
    return {
      token: `tfm_init_sess_${Date.now()}`,
      matricule: 'WFTF1013',
      systemRole: 'AGENT',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 60 * 60 * 1000,
      lastActivityAt: Date.now(),
    };
  });

  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [lastActivityTimestamp, setLastActivityTimestamp] = useState<number>(Date.now());
  const [inactivityWarning, setInactivityWarning] = useState(false);

  // Rafraîchissement d'activité
  const refreshActivity = () => {
    const now = Date.now();
    setLastActivityTimestamp(now);
    setInactivityWarning(false);
    if (sessionToken) {
      setSessionToken(touchSession(sessionToken));
    }
  };

  // Écoute des interactions pour la sécurité de session
  useEffect(() => {
    const handleUserInteraction = () => refreshActivity();
    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [sessionToken]);

  // Surveillance périodique de l'inactivité (15 minutes max)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoggedIn || !sessionToken) return;

      const check = validateSession(sessionToken);
      if (!check.valid) {
        logout();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isLoggedIn, sessionToken]);

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('tfm_user_profile', JSON.stringify(next));
      return next;
    });
  };

  const loginWithCredentials = async (
    matricule: string,
    secret: string
  ): Promise<{ success: boolean; errorMessage?: string }> => {
    const res = await authenticateAgent(matricule, secret);
    if (!res.success || !res.session) {
      return {
        success: false,
        errorMessage: res.errorMessage || 'Identifiant ou mot de passe incorrect.',
      };
    }

    const session = res.session;
    setSessionToken(session);
    setIsLoggedIn(true);
    setLastActivityTimestamp(Date.now());

    // Mettre à jour le profil selon le compte authentifié
    let nextRole: UserRole = session.systemRole;
    let nextTitle = 'Opérateur';
    let nextName = session.matricule;
    let nextDept = 'Opérations Minières & Hydrométallurgie';

    // Recherche dans les bulletins batch Sage importés
    const foundInBatch = BATCH_IMPORTED_PAYSLIPS.find(
      (s) => s.matricule.toUpperCase() === session.matricule.toUpperCase()
    );

    if (foundInBatch) {
      nextName = foundInBatch.agentName;
      nextTitle = foundInBatch.jobTitle || foundInBatch.grade;
      nextDept = foundInBatch.department;
    } else if (session.matricule === 'TFM-ADMIN') {
      nextTitle = 'Administrateur RH & Rémunérations';
      nextName = 'Direction RH TFM / TIA WFS';
      nextDept = 'Ressources Humaines & Paie';
    } else if (session.matricule === 'TFM-9012') {
      nextTitle = 'Superviseur de Quart Usine';
      nextName = 'Ilunga Mwamba';
    } else if (session.matricule === 'TFM-1102') {
      nextTitle = 'Coordinateur Sécurité & Prévention';
      nextName = 'Direction Sécurité HSE';
    } else if (session.matricule === 'TFM-4821') {
      nextTitle = 'Opérateur Salle de Contrôle - Usine SX-EW';
      nextName = 'Patrick Mukendi Ilunga';
    }

    updateUser({
      matricule: session.matricule,
      systemRole: nextRole,
      role: nextTitle,
      fullName: nextName,
      department: nextDept,
    });

    return { success: true };
  };

  const logout = () => {
    setIsLoggedIn(false);
    setSessionToken(null);
    lockPaySlips();
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!sessionToken || !isLoggedIn) return false;
    return checkPermission(sessionToken.systemRole, permission);
  };

  // Shift config & Équipe
  const [shiftConfig, setShiftConfig] = useState<ShiftConfig>(() => {
    const saved = localStorage.getItem('tfm_shift_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Si l'ancienne configuration stockait la date obsolète, recalibrer automatiquement
        if (parsed.referenceDate !== '2026-11-01') {
          return getCalibratedConfig(parsed.pattern || '6/3', parsed.team || 'A');
        }
        return parsed;
      } catch {
        return DEFAULT_SHIFT_CONFIG;
      }
    }
    return DEFAULT_SHIFT_CONFIG;
  });

  const selectedTeam: RotationTeamId = shiftConfig.team || 'A';

  const setRotationTeam = (newTeam: RotationTeamId) => {
    const newCfg = getCalibratedConfig(shiftConfig.pattern || '6/3', newTeam);
    setShiftConfig(newCfg);
    localStorage.setItem('tfm_shift_config', JSON.stringify(newCfg));
    setUser((prev) => ({
      ...prev,
      rotationTeam: `Équipe Rotation ${newTeam}`,
    }));
  };

  const setShiftPattern = (newPattern: ShiftPattern) => {
    const newCfg = getCalibratedConfig(newPattern, shiftConfig.team || 'A');
    setShiftConfig(newCfg);
    localStorage.setItem('tfm_shift_config', JSON.stringify(newCfg));
  };

  const updateShiftConfig = (updates: Partial<ShiftConfig>) => {
    setShiftConfig((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('tfm_shift_config', JSON.stringify(next));
      return next;
    });
  };

  const resetShiftConfigToDefault = () => {
    setShiftConfig(DEFAULT_SHIFT_CONFIG);
    localStorage.removeItem('tfm_shift_config');
    setUser((prev) => ({
      ...prev,
      rotationTeam: 'Équipe Rotation A',
    }));
  };

  // Annonces
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('tfm_announcements');
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  useEffect(() => {
    localStorage.setItem('tfm_announcements', JSON.stringify(announcements));
  }, [announcements]);

  const markAnnouncementRead = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );
  };

  const markAllAnnouncementsRead = () => {
    setAnnouncements((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  const publishAnnouncement = (
    title: string,
    content: string,
    category: Announcement['category'],
    priority: Announcement['priority']
  ): { success: boolean; errorMessage?: string } => {
    if (!hasPermission('POST_ANNOUNCEMENT')) {
      return {
        success: false,
        errorMessage: 'Autorisation insuffisante : rôle HSE_OFFICER ou ADMIN requis pour publier.',
      };
    }

    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      category,
      priority,
      publishedAt: new Date().toISOString(),
      isRead: false,
      author: user.fullName,
      department: user.department,
    };

    setAnnouncements((prev) => [newAnn, ...prev]);
    return { success: true };
  };

  const unreadAnnouncementsCount = announcements.filter((a) => !a.isRead).length;

  // Messagerie & Canaux (avec gestion d'archivage)
  const [channels, setChannels] = useState<Channel[]>(() => {
    const saved = localStorage.getItem('tfm_channels');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return INITIAL_CHANNELS;
  });

  useEffect(() => {
    localStorage.setItem('tfm_channels', JSON.stringify(channels));
  }, [channels]);

  const archiveChannel = (channelId: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, isArchived: true } : c))
    );
  };

  const unarchiveChannel = (channelId: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, isArchived: false } : c))
    );
  };

  const toggleArchiveChannel = (channelId: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, isArchived: !c.isArchived } : c))
    );
  };

  const joinOrCreateChannel = (channel: Partial<Channel> & { id: string; name: string }) => {
    setChannels((prev) => {
      const existing = prev.find((c) => c.id === channel.id);
      if (existing) {
        return prev.map((c) => (c.id === channel.id ? { ...c, isArchived: false } : c));
      }
      const newChan: Channel = {
        id: channel.id,
        name: channel.name,
        description: channel.description || 'Canal rejoint via invitation TFM',
        iconName: channel.iconName || (channel.isGroup ? 'Users' : 'UserCheck'),
        unreadCount: 0,
        isGroup: channel.isGroup ?? true,
        isArchived: false,
      };
      return [...prev, newChan];
    });
    setActiveChannelId(channel.id);
  };

  const [activeChannelId, setActiveChannelId] = useState<string>('ch-team-a');
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('tfm_messages');
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });

  useEffect(() => {
    localStorage.setItem('tfm_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setMessages((prev) => {
        const seenKeys = new Set<string>();
        return prev.map((msg) => {
          const key = msg.idempotencyKey || msg.id;
          if (seenKeys.has(key)) {
            return { ...msg, status: 'stale' as MessageSyncStatus };
          }
          seenKeys.add(key);
          if (msg.status === 'pending_sync') {
            return { ...msg, status: 'delivered' as MessageSyncStatus };
          }
          return msg;
        });
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sendMessage = (
    channelId: string,
    content: string,
    extra?: {
      messageType?: 'text' | 'voice' | 'attachment' | 'handover' | 'image';
      voiceDuration?: string;
      attachmentName?: string;
      attachmentSize?: string;
      imageUrl?: string;
      imageCaption?: string;
    }
  ) => {
    if (!content.trim() && !extra?.imageUrl) return;

    const idempotencyKey = `idmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      channelId,
      senderId: user.id,
      senderName: user.fullName,
      senderRole: user.role,
      content: content.trim() || extra?.imageCaption || 'Photo de terrain',
      timestamp: new Date().toISOString(),
      status: isOnline ? 'sent' : 'pending_sync',
      idempotencyKey,
      messageType: extra?.messageType || 'text',
      voiceDuration: extra?.voiceDuration,
      attachmentName: extra?.attachmentName,
      attachmentSize: extra?.attachmentSize,
      imageUrl: extra?.imageUrl,
      imageCaption: extra?.imageCaption,
      reactions: {},
    };

    setMessages((prev) => [...prev, newMsg]);

    // Simulation de réception et de lecture dynamique (envoyé -> distribué -> lu)
    if (isOnline) {
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === newMsg.id && m.status === 'sent' ? { ...m, status: 'delivered' } : m))
        );
      }, 900);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === newMsg.id && (m.status === 'delivered' || m.status === 'sent')
              ? { ...m, status: 'read' }
              : m
          )
        );
      }, 2200);
    }
  };

  const toggleMessageReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;

        const currentReactions = { ...(msg.reactions || {}) };
        const currentUserReactions = { ...(msg.userReactions || {}) };
        const usersForEmoji = [...(currentUserReactions[emoji] || [])];
        const userHasReacted = usersForEmoji.includes(user.id);

        if (userHasReacted) {
          // Retire la réaction de l'utilisateur
          const updatedUsers = usersForEmoji.filter((uid) => uid !== user.id);
          const currentCount = currentReactions[emoji] || 1;
          const nextCount = Math.max(0, currentCount - 1);

          if (nextCount === 0) {
            delete currentReactions[emoji];
          } else {
            currentReactions[emoji] = nextCount;
          }

          if (updatedUsers.length === 0) {
            delete currentUserReactions[emoji];
          } else {
            currentUserReactions[emoji] = updatedUsers;
          }
        } else {
          // Ajoute la réaction de l'utilisateur
          currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
          currentUserReactions[emoji] = [...usersForEmoji, user.id];
        }

        return {
          ...msg,
          reactions: currentReactions,
          userReactions: currentUserReactions,
        };
      })
    );
  };

  const pendingSyncCount = messages.filter((m) => m.status === 'pending_sync').length;

  const triggerManualSync = () => {
    if (isOnline) {
      setMessages((prev) =>
        prev.map((m) => (m.status === 'pending_sync' ? { ...m, status: 'delivered' } : m))
      );
    }
  };

  // =========================================================================
  // GESTION DES BULLETINS SAGE / TIA WORK FORCE & DISTRIBUTION SÉCURISÉE
  // =========================================================================
  const [allImportedPaySlips, setAllImportedPaySlips] = useState<PaySlip[]>(() => {
    const saved = localStorage.getItem('tfm_batch_payslips');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    // Par défaut, nous distribuons les premiers bulletins pour l'évaluation immédiate
    return BATCH_IMPORTED_PAYSLIPS.map((slip, idx) => {
      if (idx === 0 || slip.matricule === 'WFTF1013' || slip.matricule === 'TFM-4821') {
        return {
          ...slip,
          distributionStatus: 'DISTRIBUTED' as const,
          distributedAt: new Date().toISOString(),
        };
      }
      return slip;
    });
  });

  useEffect(() => {
    localStorage.setItem('tfm_batch_payslips', JSON.stringify(allImportedPaySlips));
  }, [allImportedPaySlips]);

  // Distribution sélective d'agents choisis par l'Admin RH
  const distributePaySlipsToAgents = (slipIds: string[]): { count: number } => {
    const now = new Date().toISOString();
    let distributedCount = 0;

    setAllImportedPaySlips((prev) =>
      prev.map((slip) => {
        if (slipIds.includes(slip.id)) {
          distributedCount++;
          return {
            ...slip,
            distributionStatus:
              slip.distributionStatus === 'VIEWED_BY_AGENT'
                ? 'VIEWED_BY_AGENT'
                : ('DISTRIBUTED' as const),
            distributedAt: slip.distributedAt || now,
          };
        }
        return slip;
      })
    );

    // Publication automatique d'une note administrative d'information
    const newNote: Announcement = {
      id: `ann-pay-${Date.now()}`,
      title: 'Bulletins de paie disponibles dans vos coffres-forts',
      content: `${slipIds.length} bulletins individuels certifiés ont été distribués. Pour préserver la confidentialité, la consultation requiert obligatoirement la vérification de votre identité personnelle.`,
      category: 'ADMIN',
      priority: 'HIGH',
      publishedAt: now,
      isRead: false,
      author: 'Direction RH TFM / TIA WFS',
      department: 'Ressources Humaines & Paie',
    };
    setAnnouncements((prev) => [newNote, ...prev]);

    return { count: distributedCount };
  };

  // Distribution collective de tous les agents ("Tout cocher")
  const distributeAllPaySlips = (): { count: number } => {
    const allIds = allImportedPaySlips.map((s) => s.id);
    return distributePaySlipsToAgents(allIds);
  };

  const resetBatchDistribution = () => {
    setAllImportedPaySlips((prev) =>
      prev.map((slip) => ({
        ...slip,
        distributionStatus: 'PENDING_IMPORT' as const,
        distributedAt: undefined,
        viewedAt: undefined,
        verifiedIdentityAt: undefined,
      }))
    );
  };

  const markPaySlipViewed = (slipId: string) => {
    const now = new Date().toISOString();
    setAllImportedPaySlips((prev) =>
      prev.map((slip) =>
        slip.id === slipId
          ? {
              ...slip,
              distributionStatus: 'VIEWED_BY_AGENT' as const,
              viewedAt: now,
              verifiedIdentityAt: now,
            }
          : slip
      )
    );
  };

  // Fiches de paie sécurisées & Grant éphémère (5 min)
  const [payslipGrant, setPayslipGrant] = useState<PayslipGrant | null>(null);
  const [selectedPaySlip, setSelectedPaySlip] = useState<PaySlip | null>(null);

  useEffect(() => {
    if (!payslipGrant) return;
    const remainingMs = payslipGrant.expiresAt - Date.now();
    if (remainingMs <= 0) {
      setPayslipGrant(null);
      setSelectedPaySlip(null);
      return;
    }

    const timer = setTimeout(() => {
      setPayslipGrant(null);
      setSelectedPaySlip(null);
    }, remainingMs);

    return () => clearTimeout(timer);
  }, [payslipGrant]);

  const unlockPaySlips = async (
    secret: string
  ): Promise<{ success: boolean; errorMessage?: string }> => {
    if (!sessionToken) {
      return { success: false, errorMessage: 'Session invalide ou expirée.' };
    }

    const res = await requestPayslipGrant(sessionToken, secret);
    if (res.success && res.grant) {
      setPayslipGrant(res.grant);
      return { success: true };
    }
    return { success: false, errorMessage: res.errorMessage || 'Code de sécurité incorrect.' };
  };

  const lockPaySlips = () => {
    setPayslipGrant(null);
    setSelectedPaySlip(null);
  };

  const isPaySlipsUnlocked =
    payslipGrant !== null && Date.now() < (payslipGrant?.expiresAt || 0);

  const setActiveTab = (tab: ActiveTab) => {
    if (activeTab === 'payslips' && tab !== 'payslips') {
      lockPaySlips();
    }
    setActiveTabState(tab);
  };

  // CLOISONNEMENT INDIVIDUEL STRICT :
  // Un travailleur ne peut voir QUE les fiches correspondant à son matricule session ET distribuées
  const authorizedPaySlips = allImportedPaySlips.filter((slip) => {
    // 1. L'agent ne voit que son propre matricule
    if (slip.matricule.toUpperCase() !== user.matricule.toUpperCase()) return false;

    // 2. Le bulletin doit avoir été distribué par l'Admin RH
    if (slip.distributionStatus === 'PENDING_IMPORT') return false;

    // 3. Déverrouillage conditionné à la vérification d'identité préalable
    if (!isPaySlipsUnlocked || !payslipGrant) return false;

    const access = verifyPayslipAccess(payslipGrant, slip.matricule);
    return access.authorized;
  });

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        viewMode,
        setViewMode,
        orientation,
        setOrientation,
        toggleOrientation,
        themeMode,
        setThemeMode,
        resolvedTheme,
        systemTheme,
        isSystemThemeActive: themeMode === 'system',
        user,
        updateUser,
        isLoggedIn,
        sessionToken,
        loginWithCredentials,
        logout,
        hasPermission,
        lastActivityTimestamp,
        inactivityWarning,
        refreshActivity,
        shiftConfig,
        selectedTeam,
        setRotationTeam,
        setShiftPattern,
        updateShiftConfig,
        resetShiftConfigToDefault,
        isOnline,
        pendingSyncCount,
        triggerManualSync,
        announcements,
        unreadAnnouncementsCount,
        markAnnouncementRead,
        markAllAnnouncementsRead,
        publishAnnouncement,
        channels,
        activeChannelId,
        setActiveChannelId,
        messages,
        sendMessage,
        toggleMessageReaction,
        archiveChannel,
        unarchiveChannel,
        toggleArchiveChannel,
        joinOrCreateChannel,
        paySlips: authorizedPaySlips,
        allImportedPaySlips,
        isPaySlipsUnlocked,
        payslipGrant,
        unlockPaySlips,
        lockPaySlips,
        selectedPaySlip,
        setSelectedPaySlip,
        distributePaySlipsToAgents,
        distributeAllPaySlips,
        resetBatchDistribution,
        markPaySlipViewed,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp doit être utilisé au sein d\'un AppProvider');
  }
  return context;
};
