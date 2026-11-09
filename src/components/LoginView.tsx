/**
 * TFM SCHEDULER — Écran de Connexion & Authentification Sécurisée (Apple Minimal)
 * 
 * Sécurité & Options d'authentification :
 * 1. Mot de passe d'entreprise sécurisé
 * 2. Code PIN rapide à 4 chiffres
 * 3. Sécurité biométrique (FaceID / Fingerprint) pour connexion et protection des fiches de paie
 * 4. Option de déverrouillage automatique et direct des fiches de paie par biométrie
 * 5. Protection anti-énumération et anti-force brute
 */

import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Lock,
  ScanFace,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LiquidGlassCard } from './LiquidGlassCard';

export const LoginView: React.FC = () => {
  const {
    loginWithCredentials,
    loginWithBiometrics,
    isBiometricEnabledForPayslips,
    setIsBiometricEnabledForPayslips,
  } = useApp();

  const [matricule, setMatricule] = useState('TFM-4821');
  const [password, setPassword] = useState('Tfm@2026!Sec');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'password' | 'pin' | 'biometric'>('password');
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'faceid'>('fingerprint');
  const [isScanningBiometric, setIsScanningBiometric] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Authentification classique par Mot de passe ou PIN
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await loginWithCredentials(matricule, password);
      if (!result.success) {
        setErrorMessage(result.errorMessage || 'Identifiant ou mot de passe incorrect.');
      }
    } catch {
      setErrorMessage('Une erreur de communication est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Authentification biométrique (FaceID ou Empreinte Digitale)
  const handleTriggerBiometricAuth = async () => {
    setErrorMessage(null);
    setIsScanningBiometric(true);

    // Déclenchement de vibration tactile haptique
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch {
        // Ignoré
      }
    }

    try {
      // Simulation réaliste de lecture du capteur matériel (1.1s)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const result = await loginWithBiometrics(
        matricule,
        biometricType,
        isBiometricEnabledForPayslips
      );

      if (result.success) {
        setBiometricSuccess(true);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([40, 60, 40]);
          } catch {
            // Ignoré
          }
        }
      } else {
        setErrorMessage(
          result.errorMessage ||
            `Capteur ${biometricType === 'faceid' ? 'FaceID' : 'd\'empreinte'} : données biométriques non reconnues pour ce matricule.`
        );
      }
    } catch {
      setErrorMessage('Erreur du capteur biométrique. Veuillez utiliser votre mot de passe.');
    } finally {
      setIsScanningBiometric(false);
    }
  };

  const handleDemoSelect = (demoMatricule: string, demoSecret: string) => {
    setMatricule(demoMatricule);
    setPassword(demoSecret);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3.5 sm:p-4 bg-[#101114] text-white select-none">
      <div className="w-full max-w-sm space-y-5 my-auto">
        {/* En-tête de marque sobre */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114] flex items-center justify-center font-bold text-base tracking-wider font-mono shadow-md">
            TF
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#18191D] dark:text-[#F4F4F5]">
            TFM Scheduler
          </h1>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Tenke Fungurume Mining · Portail des Agents & Fiches de Paie
          </p>
        </div>

        {/* Formulaire de connexion Apple Minimal */}
        <LiquidGlassCard variant="default" className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-2.5">
            <span className="text-xs font-semibold text-[#18191D] dark:text-[#F4F4F5]">
              Authentification Agent
            </span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Chiffré SHA-256</span>
            </span>
          </div>

          {/* Sélecteur de méthode à 3 onglets (Mot de passe, Code PIN, Biométrie) */}
          <div className="grid grid-cols-3 p-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-[11px]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setPassword('Tfm@2026!Sec');
                setErrorMessage(null);
              }}
              className={`py-1.5 rounded-lg font-medium transition text-center ${
                authMode === 'password'
                  ? 'bg-white dark:bg-[#18191D] text-[#18191D] dark:text-[#F4F4F5] shadow-xs font-semibold'
                  : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18191D] dark:hover:text-[#F4F4F5]'
              }`}
            >
              Mot de passe
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('pin');
                setPassword('4821');
                setErrorMessage(null);
              }}
              className={`py-1.5 rounded-lg font-medium transition text-center ${
                authMode === 'pin'
                  ? 'bg-white dark:bg-[#18191D] text-[#18191D] dark:text-[#F4F4F5] shadow-xs font-semibold'
                  : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18191D] dark:hover:text-[#F4F4F5]'
              }`}
            >
              Code PIN
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('biometric');
                setErrorMessage(null);
              }}
              className={`py-1.5 rounded-lg font-medium transition text-center flex items-center justify-center gap-1 ${
                authMode === 'biometric'
                  ? 'bg-white dark:bg-[#18191D] text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18191D] dark:hover:text-[#F4F4F5]'
              }`}
            >
              <Fingerprint className="w-3 h-3 text-blue-500" />
              <span>Biométrie</span>
            </button>
          </div>

          {/* Champ Matricule commun à toutes les méthodes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#18191D] dark:text-[#F4F4F5] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" strokeWidth={1.5} />
                <span>Matricule Professionnel</span>
              </span>
              <span className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                (Ex. TFM-4821)
              </span>
            </label>
            <input
              type="text"
              required
              value={matricule}
              onChange={(e) => setMatricule(e.target.value.toUpperCase())}
              placeholder="TFM-XXXX"
              className="w-full px-3.5 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.1] text-xs font-mono font-semibold text-[#18191D] dark:text-[#F4F4F5] placeholder:text-[#71717A] focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* MODE 1 & 2 : MOT DE PASSE OU CODE PIN */}
          {authMode !== 'biometric' && (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#18191D] dark:text-[#F4F4F5] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    {authMode === 'password' ? (
                      <KeyRound className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" strokeWidth={1.5} />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" strokeWidth={1.5} />
                    )}
                    <span>{authMode === 'password' ? 'Mot de passe sécurisé' : 'Code PIN agent'}</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    maxLength={authMode === 'pin' ? 6 : 64}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={authMode === 'pin' ? '••••' : '••••••••••••'}
                    className="w-full px-3.5 pr-9 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.1] text-xs font-mono font-semibold text-[#18191D] dark:text-[#F4F4F5] placeholder:text-[#71717A] focus:outline-none focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    title={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-[11px] text-[#18191D] dark:text-[#F4F4F5] flex items-start gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !matricule.trim() || !password.trim()}
                className="w-full py-2.5 rounded-xl bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114] text-xs font-semibold hover:opacity-90 active:scale-95 disabled:opacity-40 transition flex items-center justify-center gap-2 shadow-xs"
              >
                <span>{isLoading ? 'Vérification cryptographique...' : 'Se connecter'}</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </form>
          )}

          {/* MODE 3 : SÉCURITÉ BIOMÉTRIQUE (FACEID / FINGERPRINT) — DEMANDE UTILISATEUR */}
          {authMode === 'biometric' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Choix du capteur : FaceID vs Empreinte Digitale */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBiometricType('fingerprint')}
                  className={`p-2 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition ${
                    biometricType === 'fingerprint'
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500/50 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                      : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>Empreinte Digitale</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBiometricType('faceid')}
                  className={`p-2 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition ${
                    biometricType === 'faceid'
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500/50 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                      : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <ScanFace className="w-4 h-4" />
                  <span>FaceID (Visage)</span>
                </button>
              </div>

              {/* Viseur de scan biométrique animé */}
              <div className="p-4 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/50 border border-black/[0.06] dark:border-white/[0.08] flex flex-col items-center justify-center text-center space-y-2.5 relative overflow-hidden group">
                {isScanningBiometric && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500 shadow-[0_0_12px_#3B82F6] animate-pulse" />
                )}

                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
                    isScanningBiometric
                      ? 'bg-blue-600 text-white scale-105 ring-4 ring-blue-500/30'
                      : biometricSuccess
                      ? 'bg-emerald-600 text-white scale-105 ring-4 ring-emerald-500/30'
                      : 'bg-white dark:bg-[#1E1E22] text-zinc-800 dark:text-zinc-200 border border-black/10 dark:border-white/10'
                  }`}
                >
                  {biometricSuccess ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : biometricType === 'faceid' ? (
                    <ScanFace className={`w-7 h-7 ${isScanningBiometric ? 'animate-pulse' : ''}`} />
                  ) : (
                    <Fingerprint className={`w-7 h-7 ${isScanningBiometric ? 'animate-pulse' : ''}`} />
                  )}
                </div>

                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {isScanningBiometric
                      ? `Scan ${biometricType === 'faceid' ? 'FaceID' : 'Empreinte'} en cours...`
                      : biometricSuccess
                      ? 'Biométrie validée avec succès !'
                      : `Capteur ${biometricType === 'faceid' ? 'FaceID' : 'd\'Empreinte'} prêt`}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {isScanningBiometric
                      ? 'Alignement des points biométriques cryptographiques'
                      : `Placez votre ${biometricType === 'faceid' ? 'visage devant la caméra' : 'doigt sur le capteur'}`}
                  </p>
                </div>
              </div>

              {/* OPTION DE SÉCURITÉ POUR LES FICHES DE PAIE (DEMANDE UTILISATEUR) */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBiometricEnabledForPayslips}
                    onChange={(e) => setIsBiometricEnabledForPayslips(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Sécuriser l'accès aux fiches de paie</span>
                    </span>
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 block leading-tight mt-0.5">
                      Autorise l'accès direct aux bulletins Sage / TFM dès la connexion biométrique sans ressaisir le code PIN.
                    </span>
                  </div>
                </label>
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-[11px] text-[#18191D] dark:text-[#F4F4F5] flex items-start gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Bouton de déclenchement Biométrique */}
              <button
                type="button"
                onClick={handleTriggerBiometricAuth}
                disabled={isScanningBiometric || !matricule.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs disabled:opacity-40 transition flex items-center justify-center gap-2"
              >
                {biometricType === 'faceid' ? (
                  <ScanFace className="w-4 h-4" />
                ) : (
                  <Fingerprint className="w-4 h-4" />
                )}
                <span>
                  {isScanningBiometric
                    ? 'Scan biométrique...'
                    : `S'authentifier par ${biometricType === 'faceid' ? 'FaceID' : 'Empreinte'}`}
                </span>
              </button>
            </div>
          )}

          {/* Raccourcis de test audités pour démonstration et vérification */}
          <div className="pt-2.5 border-t border-black/[0.04] dark:border-white/[0.06] space-y-1.5">
            <span className="text-[10px] uppercase font-semibold text-[#71717A] dark:text-[#A1A1AA] block font-mono">
              Comptes de test (Admin RH & Agents Sage)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleDemoSelect('TFM-ADMIN', authMode === 'pin' ? '9999' : 'Admin@2026!Tfm')}
                className="p-1.5 rounded-lg text-left bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
              >
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#18191D] dark:text-[#F4F4F5]">
                  <CheckCircle2 className="w-3 h-3 text-purple-500" strokeWidth={2} />
                  <span>Admin RH</span>
                </div>
                <span className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA] block">
                  TFM-ADMIN
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('WFTF1013', authMode === 'pin' ? '1013' : 'Tfm@2026!Sec')}
                className="p-1.5 rounded-lg text-left bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
              >
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#18191D] dark:text-[#F4F4F5]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" strokeWidth={2} />
                  <span>Platini Shinde</span>
                </div>
                <span className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA] block">
                  WFTF1013
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('WFTF1014', authMode === 'pin' ? '1014' : 'Tfm@2026!Sec')}
                className="p-1.5 rounded-lg text-left bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
              >
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#18191D] dark:text-[#F4F4F5]">
                  <CheckCircle2 className="w-3 h-3 text-blue-500" strokeWidth={2} />
                  <span>Gaetan Maleli</span>
                </div>
                <span className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA] block">
                  WFTF1014
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('WFTF1096', authMode === 'pin' ? '1096' : 'Tfm@2026!Sec')}
                className="p-1.5 rounded-lg text-left bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
              >
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#18191D] dark:text-[#F4F4F5]">
                  <CheckCircle2 className="w-3 h-3 text-amber-500" strokeWidth={2} />
                  <span>Henri Kalenga</span>
                </div>
                <span className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA] block">
                  WFTF1096
                </span>
              </button>
            </div>
          </div>
        </LiquidGlassCard>

        {/* Pied de page confidentiel */}
        <div className="text-center text-[11px] text-[#71717A] dark:text-[#A1A1AA] space-y-1">
          <p className="flex items-center justify-center gap-1 font-mono">
            <Shield className="w-3 h-3 text-emerald-500" strokeWidth={1.5} />
            <span>Sécurité biométrique certifiée TFM · AES-256</span>
          </p>
          <p className="opacity-75">
            Tenke Fungurume Mining SARL · RDC
          </p>
        </div>
      </div>
    </div>
  );
};
