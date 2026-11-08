/**
 * TFM SCHEDULER — Profil de l'Agent & Paramètres Système (Apple Minimal)
 * Conforme à la Section 5 du Master Prompt :
 * - Informations d'identité et de compte autorisées de l'agent
 * - Espace d'accès direct aux Fiches de Paie sécurisées
 * - Paramétrage des notifications et préférences de thème (Clair / Sombre / Système)
 * - Informations officielles de l'application et de sécurité
 * - Procédures et numéros d'urgence minière TFM
 * - Déconnexion réelle invalidant la session locale
 */

import React, { useEffect, useState } from 'react';
import {
  Bell,
  Calendar,
  Check,
  ChevronRight,
  FileText,
  HardDrive,
  HelpCircle,
  Info,
  Lock,
  LogOut,
  Moon,
  PhoneCall,
  RotateCcw,
  Shield,
  Smartphone,
  Sparkles,
  Sun,
  SunMoon,
  User,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEFAULT_SHIFT_CONFIG, SHIFT_PATTERNS } from '../engine/rotationEngine';
import { RotationTeamId, ShiftPattern } from '../types';
import { LiquidGlassCard } from './LiquidGlassCard';
import { PaySlipsView } from './PaySlipsView';

interface ProfileViewProps {
  onOpenTests?: () => void;
  onOpenAndroidCode?: () => void;
  onOpenPayrollPortal?: () => void;
  initialSubSection?: 'overview' | 'payslips';
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onOpenTests,
  onOpenAndroidCode,
  onOpenPayrollPortal,
  initialSubSection = 'overview',
}) => {
  const {
    user,
    shiftConfig,
    selectedTeam,
    setRotationTeam,
    setShiftPattern,
    updateShiftConfig,
    resetShiftConfigToDefault,
    isOnline,
    pendingSyncCount,
    themeMode,
    setThemeMode,
    resolvedTheme,
    systemTheme,
    isSystemThemeActive,
    setActiveTab,
    logout,
  } = useApp();

  const [subSection, setSubSection] = useState<'overview' | 'payslips'>(initialSubSection);

  useEffect(() => {
    if (initialSubSection) {
      setSubSection(initialSubSection);
    }
  }, [initialSubSection]);

  const [pattern, setPattern] = useState<ShiftPattern>(shiftConfig.pattern || '6/3');
  const [refDate, setRefDate] = useState(shiftConfig.referenceDate);
  const [dayStart, setDayStart] = useState(shiftConfig.dayShiftStart);
  const [dayEnd, setDayEnd] = useState(shiftConfig.dayShiftEnd);
  const [nightStart, setNightStart] = useState(shiftConfig.nightShiftStart);
  const [nightEnd, setNightEnd] = useState(shiftConfig.nightShiftEnd);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Synchroniser l'état local si shiftConfig change
  useEffect(() => {
    setPattern(shiftConfig.pattern || '6/3');
    setRefDate(shiftConfig.referenceDate);
    setDayStart(shiftConfig.dayShiftStart);
    setDayEnd(shiftConfig.dayShiftEnd);
    setNightStart(shiftConfig.nightShiftStart);
    setNightEnd(shiftConfig.nightShiftEnd);
  }, [shiftConfig]);

  // Préférences de notifications
  const [notifHse, setNotifHse] = useState(true);
  const [notifShifts, setNotifShifts] = useState(true);
  const [notifPay, setNotifPay] = useState(true);

  const handleSelectPattern = (newPattern: ShiftPattern) => {
    setPattern(newPattern);
    setShiftPattern(newPattern);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSelectTeam = (newTeam: RotationTeamId) => {
    setRotationTeam(newTeam);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateShiftConfig({
      pattern,
      referenceDate: refDate,
      dayShiftStart: dayStart,
      dayShiftEnd: dayEnd,
      nightShiftStart: nightStart,
      nightShiftEnd: nightEnd,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleReset = () => {
    resetShiftConfigToDefault();
    setPattern(DEFAULT_SHIFT_CONFIG.pattern || '6/3');
    setRefDate(DEFAULT_SHIFT_CONFIG.referenceDate);
    setDayStart(DEFAULT_SHIFT_CONFIG.dayShiftStart);
    setDayEnd(DEFAULT_SHIFT_CONFIG.dayShiftEnd);
    setNightStart(DEFAULT_SHIFT_CONFIG.nightShiftStart);
    setNightEnd(DEFAULT_SHIFT_CONFIG.nightShiftEnd);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  if (subSection === 'payslips') {
    return <PaySlipsView onBack={() => setSubSection('overview')} />;
  }

  return (
    <div className="space-y-5 pb-24 pt-1">
      {/* 1. EN-TÊTE ÉPURÉ */}
      <div className="px-0.5">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#18191D] dark:text-[#F4F4F5]">
          Profil & Paramètres
        </h2>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
          Identité agent, sécurité RH, préférences et assistance site
        </p>
      </div>

      {/* 2. CARTE D'IDENTITÉ DE L'AGENT TFM */}
      <LiquidGlassCard variant="default" className="p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114] flex items-center justify-center text-sm font-semibold tracking-wider font-mono shadow-sm">
            {user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-[#18191D] dark:text-[#F4F4F5]">
                {user.fullName}
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-black/[0.04] dark:bg-white/[0.06] text-[#71717A] dark:text-[#A1A1AA]">
                {user.matricule}
              </span>
            </div>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              {user.role} · {user.department}
            </p>
          </div>
        </div>

        {/* Détails complémentaires */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] text-xs">
          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
            <span className="text-[#71717A] dark:text-[#A1A1AA] font-medium block">Affectation Opérationnelle</span>
            <p className="font-semibold text-[#18191D] dark:text-[#F4F4F5] mt-0.5">{user.rotationTeam}</p>
            <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">{user.siteLocation}</p>
          </div>

          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
            <span className="text-[#71717A] dark:text-[#A1A1AA] font-medium block">Habilitation & Aptitude</span>
            <p className="font-semibold text-[#18191D] dark:text-[#F4F4F5] mt-0.5">{user.securityClearance}</p>
            <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">Aptitude médicale : {user.medicalClearanceDate}</p>
          </div>

          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
            <span className="text-[#71717A] dark:text-[#A1A1AA] font-medium block">Contact Professionnel</span>
            <p className="font-medium text-[#18191D] dark:text-[#F4F4F5] font-mono mt-0.5">{user.phone}</p>
          </div>

          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
            <span className="text-[#71717A] dark:text-[#A1A1AA] font-medium block">Contact d'Urgence</span>
            <p className="font-medium text-[#18191D] dark:text-[#F4F4F5] mt-0.5">{user.emergencyContact}</p>
          </div>
        </div>
      </LiquidGlassCard>

      {/* 3. ACCÈS DIRECT AUX BULLETINS DE PAIE SÉCURISÉS (DANS LE PROFIL) */}
      <LiquidGlassCard
        interactive
        onClick={() => setSubSection('payslips')}
        className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-[#18191D] dark:text-[#F4F4F5] shrink-0">
            <Lock className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#18191D] dark:text-[#F4F4F5]">
                Mes Bulletins de Paie Sécurisés
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-black/[0.04] dark:bg-white/[0.06] text-[#71717A] dark:text-[#A1A1AA]">
                Sécurisé SHA-256
              </span>
            </div>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              Consulter, imprimer et télécharger vos bulletins officiels après vérification d'identité
            </p>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-[#71717A] dark:text-[#A1A1AA] shrink-0" strokeWidth={1.5} />
      </LiquidGlassCard>

      {/* 3B. PORTAIL RH : DISTRIBUTION BATCH DES BULLETINS (SAGE / TIA WFS) */}
      <LiquidGlassCard
        interactive
        onClick={() => {
          if (onOpenPayrollPortal) onOpenPayrollPortal();
          else setSubSection('payslips');
        }}
        className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer border border-blue-500/20 bg-blue-500/[0.03]"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#18191D] dark:text-[#F4F4F5]">
                Portail RH — Distribution Groupée des Bulletins
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Sage / TIA WFS
              </span>
            </div>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              Importer le lot PDF global, cocher tous les agents et distribuer avec vérification d'identité préalable
            </p>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-[#71717A] dark:text-[#A1A1AA] shrink-0" strokeWidth={1.5} />
      </LiquidGlassCard>

      {/* 4. PRÉFÉRENCES D'AFFICHAGE & THÈME */}
      <LiquidGlassCard variant="default" className="p-5 sm:p-6 space-y-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
            Affichage & Ergonomie
          </span>
          <h3 className="text-base font-semibold text-[#18191D] dark:text-[#F4F4F5] mt-0.5">
            Thème de l'Application
          </h3>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Détection automatique du système ou sélection manuelle pour votre confort visuel.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setThemeMode('light')}
            className={`p-3 rounded-xl border text-center transition-all ${
              themeMode === 'light'
                ? 'bg-[#18191D] text-white dark:bg-[#F4F4F5] dark:text-[#101114] border-transparent shadow-sm'
                : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.08] text-[#18191D] dark:text-[#F4F4F5] hover:border-black/20 dark:hover:border-white/20'
            }`}
          >
            <Sun className="w-4 h-4 mx-auto mb-1 text-amber-500" strokeWidth={1.75} />
            <span className="text-xs font-semibold block">Clair</span>
            <span className="text-[10px] opacity-70 font-mono block">Fixe</span>
          </button>

          <button
            onClick={() => setThemeMode('dark')}
            className={`p-3 rounded-xl border text-center transition-all ${
              themeMode === 'dark'
                ? 'bg-[#18191D] text-white dark:bg-[#F4F4F5] dark:text-[#101114] border-transparent shadow-sm'
                : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.08] text-[#18191D] dark:text-[#F4F4F5] hover:border-black/20 dark:hover:border-white/20'
            }`}
          >
            <Moon className="w-4 h-4 mx-auto mb-1 text-indigo-400" strokeWidth={1.75} />
            <span className="text-xs font-semibold block">Sombre</span>
            <span className="text-[10px] opacity-70 font-mono block">Fixe</span>
          </button>

          <button
            onClick={() => setThemeMode('system')}
            className={`p-3 rounded-xl border text-center transition-all ${
              themeMode === 'system'
                ? 'bg-[#18191D] text-white dark:bg-[#F4F4F5] dark:text-[#101114] border-transparent shadow-sm ring-1 ring-blue-500/50'
                : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.08] text-[#18191D] dark:text-[#F4F4F5] hover:border-black/20 dark:hover:border-white/20'
            }`}
          >
            <SunMoon className="w-4 h-4 mx-auto mb-1 text-blue-500" strokeWidth={1.75} />
            <span className="text-xs font-semibold block">Automatique</span>
            <span className="text-[10px] opacity-80 font-mono block font-medium">Système</span>
          </button>
        </div>

        {/* État de détection en temps réel */}
        {themeMode === 'system' ? (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-between gap-3 text-xs text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
              <span className="truncate font-medium">
                Détection automatique active : votre système est actuellement en <strong className="font-semibold text-blue-900 dark:text-blue-100">mode {systemTheme === 'dark' ? 'sombre' : 'clair'}</strong>.
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 font-semibold shrink-0">
              Temps réel
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="truncate">
              Système détecté : {systemTheme === 'dark' ? 'Mode Sombre' : 'Mode Clair'}.
            </span>
            <button
              type="button"
              onClick={() => setThemeMode('system')}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
            >
              Activer l'auto-détection
            </button>
          </div>
        )}
      </LiquidGlassCard>

      {/* 5. PRÉFÉRENCES DE NOTIFICATIONS */}
      <LiquidGlassCard variant="default" className="p-5 sm:p-6 space-y-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
            Alertes
          </span>
          <h3 className="text-base font-semibold text-[#18191D] dark:text-[#F4F4F5] mt-0.5">
            Paramètres des Notifications
          </h3>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Gestion des notifications push conformément aux autorisations Android.
          </p>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">
            <div>
              <p className="font-semibold text-[#18191D] dark:text-[#F4F4F5]">Alertes HSE & Tirs de Mine</p>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Consignes prioritaires de sécurité sur le site</p>
            </div>
            <button
              onClick={() => setNotifHse(!notifHse)}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                notifHse ? 'bg-[#18191D] dark:bg-[#F4F4F5]' : 'bg-black/20 dark:bg-white/20'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                  notifHse
                    ? 'right-1 bg-white dark:bg-[#101114]'
                    : 'left-1 bg-white dark:bg-[#202227]'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">
            <div>
              <p className="font-semibold text-[#18191D] dark:text-[#F4F4F5]">Rappels de Relèves & Quarts</p>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Rappel 1h avant la prise de poste Jour ou Nuit</p>
            </div>
            <button
              onClick={() => setNotifShifts(!notifShifts)}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                notifShifts ? 'bg-[#18191D] dark:bg-[#F4F4F5]' : 'bg-black/20 dark:bg-white/20'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                  notifShifts
                    ? 'right-1 bg-white dark:bg-[#101114]'
                    : 'left-1 bg-white dark:bg-[#202227]'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">
            <div>
              <p className="font-semibold text-[#18191D] dark:text-[#F4F4F5]">Disponibilité des Fiches de Paie</p>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Alerte confidentielle dès publication par les RH</p>
            </div>
            <button
              onClick={() => setNotifPay(!notifPay)}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                notifPay ? 'bg-[#18191D] dark:bg-[#F4F4F5]' : 'bg-black/20 dark:bg-white/20'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                  notifPay
                    ? 'right-1 bg-white dark:bg-[#101114]'
                    : 'left-1 bg-white dark:bg-[#202227]'
                }`}
              />
            </button>
          </div>
        </div>
      </LiquidGlassCard>

      {/* 6. CONFIGURATION DU CALENDRIER & MODÈLE DE ROTATION */}
      <LiquidGlassCard variant="default" className="p-5 sm:p-6 space-y-5 border-blue-500/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono">
                Configuration du Calendrier
              </span>
            </div>
            <h3 className="text-base font-semibold text-[#18191D] dark:text-[#F4F4F5] mt-1">
              Paramètres de Rotation & Équipe
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">
              Toutes les configurations de votre calendrier sont centralisées ici : choix de votre équipe d'affectation (A, B, C), modèle de rotation TFM (10/4, 6/3, 5/2), date de référence et horaires de quart.
            </p>
          </div>
        </div>

        {/* Sélecteur de l'Équipe d'Affectation (A, B, C) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#18191D] dark:text-[#F4F4F5]">
              Équipe d'affectation opérationnelle
            </label>
            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              Actuelle : Équipe {selectedTeam || 'A'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {(['A', 'B', 'C'] as RotationTeamId[]).map((tId) => {
              const isSelected = (selectedTeam || 'A') === tId;
              return (
                <button
                  key={tId}
                  type="button"
                  onClick={() => handleSelectTeam(tId)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-transparent shadow-sm ring-2 ring-emerald-500/60 font-semibold'
                      : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 hover:border-black/20'
                  }`}
                >
                  <span className="text-sm font-bold font-mono block">Équipe {tId}</span>
                  <span className={`text-[10px] font-medium block mt-0.5 ${isSelected ? 'text-emerald-400 dark:text-emerald-600 font-bold' : 'opacity-60'}`}>
                    {isSelected ? 'Mon Équipe' : 'Basculer'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sélecteur des 3 modèles de shift (6/3, 5/2, 10/4) */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-[#18191D] dark:text-[#F4F4F5]">
            Régime de rotation actif
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(['6/3', '5/2', '10/4'] as ShiftPattern[]).map((patKey) => {
              const pat = SHIFT_PATTERNS[patKey];
              const isSelected = pattern === patKey;

              return (
                <button
                  key={patKey}
                  type="button"
                  onClick={() => handleSelectPattern(patKey)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'bg-[#18191D] text-white dark:bg-[#F4F4F5] dark:text-[#101114] border-transparent shadow-sm ring-2 ring-emerald-500/50'
                      : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.08] text-[#18191D] dark:text-[#F4F4F5] hover:border-black/20 dark:hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-base font-bold font-mono tracking-tight">
                      {patKey}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-white/20 dark:bg-black/20 text-inherit'
                          : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#71717A] dark:text-[#A1A1AA]'
                      }`}
                    >
                      {pat.totalDays} jours
                    </span>
                  </div>

                  <p className={`text-xs font-semibold truncate ${isSelected ? 'text-inherit' : 'text-[#18191D] dark:text-[#F4F4F5]'}`}>
                    {pat.badge}
                  </p>

                  <p className={`text-[11px] mt-1 line-clamp-2 leading-tight ${isSelected ? 'opacity-80' : 'text-[#71717A] dark:text-[#A1A1AA]'}`}>
                    {pat.description}
                  </p>

                  {isSelected && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Détail visuel des phases du modèle sélectionné */}
        <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#18191D] dark:text-[#F4F4F5]">
              Découpage du cycle {SHIFT_PATTERNS[pattern].name}
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              {SHIFT_PATTERNS[pattern].workDays}j travail · {SHIFT_PATTERNS[pattern].offDays}j repos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {SHIFT_PATTERNS[pattern].phases.map((phase, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-white dark:bg-[#18191D] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    {phase.type === 'DAY' && <Sun className="w-3.5 h-3.5 text-amber-500" strokeWidth={2} />}
                    {phase.type === 'NIGHT' && <Moon className="w-3.5 h-3.5 text-blue-500" strokeWidth={2} />}
                    {phase.type === 'OFF' && <Sparkles className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} />}
                    <span className="font-semibold text-[11px] text-[#18191D] dark:text-[#F4F4F5]">
                      {phase.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-mono block mt-0.5">
                    {phase.hours}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 shrink-0">
                  J{phase.startDay}–J{phase.endDay}
                </span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4 pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#18191D] dark:text-[#F4F4F5]">
                Date de référence (Jour 1)
              </label>
              <input
                type="date"
                value={refDate}
                onChange={(e) => setRefDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-xs font-mono font-medium text-[#18191D] dark:text-[#F4F4F5] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#18191D] dark:text-[#F4F4F5]">
                Fuseau horaire officiel
              </label>
              <input
                type="text"
                disabled
                value="Africa/Lubumbashi (CAT UTC+2)"
                className="w-full px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#18191D] dark:text-[#F4F4F5]">
                Poste de Jour (Début — Fin)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={dayStart}
                  onChange={(e) => setDayStart(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-xs font-mono text-[#18191D] dark:text-[#F4F4F5] focus:outline-none"
                />
                <input
                  type="time"
                  value={dayEnd}
                  onChange={(e) => setDayEnd(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-xs font-mono text-[#18191D] dark:text-[#F4F4F5] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#18191D] dark:text-[#F4F4F5]">
                Poste de Nuit (Début — Fin)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={nightStart}
                  onChange={(e) => setNightStart(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-xs font-mono text-[#18191D] dark:text-[#F4F4F5] focus:outline-none"
                />
                <input
                  type="time"
                  value={nightEnd}
                  onChange={(e) => setNightEnd(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-xs font-mono text-[#18191D] dark:text-[#F4F4F5] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18191D] dark:hover:text-[#F4F4F5] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" strokeWidth={1.5} />
              <span>Régime 6/3 par défaut</span>
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114] text-xs font-semibold hover:opacity-90 transition active:scale-95"
            >
              {saveSuccess ? (
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} />
                  <span>Rotation & Horaires Enregistrés</span>
                </span>
              ) : (
                <span>Enregistrer les Paramètres</span>
              )}
            </button>
          </div>
        </form>
      </LiquidGlassCard>

      {/* 7. CONTACTS D'URGENCE DU SITE TFM */}
      <LiquidGlassCard variant="default" className="p-5 sm:p-6 space-y-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
            Sécurité Minière
          </span>
          <h3 className="text-base font-semibold text-[#18191D] dark:text-[#F4F4F5] mt-0.5">
            Procédures & Contacts d'Urgence Site
          </h3>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Lignes prioritaires internes joignables 24h/24 sans connexion internet.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
            <span className="text-[#71717A] dark:text-[#A1A1AA] text-[10px] block uppercase">Dispatching Mine</span>
            <p className="font-semibold text-sm mt-0.5">Poste 2222</p>
            <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">+243 81 000 2222</p>
          </div>

          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
            <span className="text-[#71717A] dark:text-[#A1A1AA] text-[10px] block uppercase">Infirmerie Centrale</span>
            <p className="font-semibold text-sm mt-0.5">Poste 3333</p>
            <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">+243 81 000 3333</p>
          </div>

          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
            <span className="text-[#71717A] dark:text-[#A1A1AA] text-[10px] block uppercase">Pompiers & Sauvetage</span>
            <p className="font-semibold text-sm mt-0.5">Poste 4444</p>
            <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">Urgences Industrielles</p>
          </div>
        </div>
      </LiquidGlassCard>

      {/* 8. INFORMATIONS SYSTÈME & CODE NATIF ANDROID */}
      <LiquidGlassCard variant="default" className="p-5 sm:p-6 space-y-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
            Système & Outils
          </span>
          <h3 className="text-base font-semibold text-[#18191D] dark:text-[#F4F4F5] mt-0.5">
            Architecture & Validation
          </h3>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Version 2.4.0 · Android Target SDK 35 · Room Database · JUnit
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            onClick={onOpenTests}
            className="flex-1 min-h-[38px] px-3.5 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#18191D] dark:text-[#F4F4F5] border border-black/[0.06] dark:border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-2 hover:bg-black/[0.08] active:scale-95 transition"
          >
            <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Exécuter les Tests & Sécurité (32/32)</span>
          </button>

          <button
            onClick={onOpenAndroidCode}
            className="flex-1 min-h-[38px] px-3.5 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#18191D] dark:text-[#F4F4F5] border border-black/[0.06] dark:border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-2 hover:bg-black/[0.08] active:scale-95 transition"
          >
            <Smartphone className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Code Source Android Studio</span>
          </button>
        </div>
      </LiquidGlassCard>

      {/* 9. BOUTON DE DÉCONNEXION RÉELLE */}
      <div className="pt-2">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full min-h-[44px] py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-[#18191D] dark:text-[#F4F4F5] text-xs font-semibold hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition flex items-center justify-center gap-2 active:scale-95"
        >
          <LogOut className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" strokeWidth={1.5} />
          <span>Fermer la Session Agent</span>
        </button>
      </div>

      {/* MODALE DE CONFIRMATION DE DÉCONNEXION */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#18191D] border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center mx-auto text-[#18191D] dark:text-[#F4F4F5]">
              <LogOut className="w-5 h-5" strokeWidth={1.5} />
            </div>

            <div>
              <h3 className="text-base font-semibold text-[#18191D] dark:text-[#F4F4F5]">
                Fermer la session ?
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1.5 leading-relaxed">
                Vous devrez ressaisir votre matricule et code PIN personnel pour accéder à vos rotations et bulletins de paie.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#18191D] dark:text-[#F4F4F5] text-xs font-medium hover:bg-black/[0.08] transition"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmLogout}
                className="py-2.5 rounded-xl bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114] text-xs font-semibold hover:opacity-90 active:scale-95 transition"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
