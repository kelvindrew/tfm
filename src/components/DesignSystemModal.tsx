/**
 * TFM SCHEDULER — Guide de Style & Système de Design (Apple Minimal)
 * Présentation vivante et interactive des 3 piliers :
 * 1. Colors & Typography (Couleurs & Typographie)
 * 2. Components (Composants UI Atomiques & Moléculaires)
 * 3. Templates (Gabarits & Écrans Complets de l'Application)
 */

import React, { useState } from 'react';
import {
  X,
  Palette,
  Type,
  Layout,
  Component as ComponentIcon,
  Layers,
  Sparkles,
  Sun,
  Moon,
  CheckCircle2,
  Lock,
  RotateCw,
  Bell,
  MessageSquare,
  Calendar,
  User,
  Shield,
  Fingerprint,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { LiquidGlassCard } from './LiquidGlassCard';

interface DesignSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesignSystemModal: React.FC<DesignSystemModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'colors_typography' | 'components' | 'templates'>(
    'colors_typography'
  );
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(label);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-white dark:bg-[#18191D] border border-black/[0.08] dark:border-white/[0.1] shadow-2xl flex flex-col">
        {/* EN-TÊTE MODALE */}
        <div className="p-4 sm:p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center font-mono font-bold text-xs shadow-xs">
              DS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                  Design System TFM · Apple Minimal
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/[0.04] dark:bg-white/[0.06] text-zinc-500">
                  v2.4
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Spécifications : Components, Templates & Typo
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ONGLETS PRINCIPAUX */}
        <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center gap-2 overflow-x-auto shrink-0 bg-black/[0.01] dark:bg-white/[0.01]">
          <button
            onClick={() => setActiveTab('colors_typography')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'colors_typography'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>1. Colors & Typography</span>
          </button>

          <button
            onClick={() => setActiveTab('components')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'components'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <ComponentIcon className="w-3.5 h-3.5" />
            <span>2. Components</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'templates'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>3. Templates & Vues</span>
          </button>
        </div>

        {/* CONTENU DÉFILANT */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* ========================================================================= */}
          {/* ONGLET 1 : COLORS & TYPOGRAPHY */}
          {/* ========================================================================= */}
          {activeTab === 'colors_typography' && (
            <div className="space-y-6">
              {/* Nuancier Neutre Principal */}
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-zinc-500" />
                  <span>Nuances Neutres Principales (Light & Dark)</span>
                </h4>
                <p className="text-zinc-500 text-[11px] mb-3">
                  Palette monochromatique Apple stricte sans saturation superflue pour la lisibilité industrielle.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { label: 'Background Main', light: '#F4F4F5', dark: '#101114', desc: 'Fond principal de la page' },
                    { label: 'Surface Standard', light: '#FFFFFF', dark: '#18191D', desc: 'Cartes et barres de navigation' },
                    { label: 'Surface Elevated', light: '#FFFFFF', dark: '#202227', desc: 'Carte maîtresse & modales' },
                    { label: 'Text Primary', light: '#18191D', dark: '#F4F4F5', desc: 'Titres et textes dominants' },
                    { label: 'Text Secondary', light: '#71717A', dark: '#A1A1AA', desc: 'Métatroncs, sous-titres' },
                    { label: 'Border Subtle', light: 'rgba(0,0,0,0.08)', dark: 'rgba(255,255,255,0.08)', desc: 'Séparateurs délicats' },
                    { label: 'Liquid Glass Light', light: 'rgba(255,255,255,0.82)', dark: 'backdrop-blur 20px', desc: 'Effet verre liquide' },
                    { label: 'Liquid Glass Dark', light: 'rgba(24,25,29,0.78)', dark: 'backdrop-blur 20px', desc: 'Effet verre sombre' },
                  ].map((color) => (
                    <div
                      key={color.label}
                      onClick={() => copyToClipboard(color.dark, color.label)}
                      className="p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.02] cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition relative group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-4 h-4 rounded-md border border-black/10 shrink-0"
                          style={{ backgroundColor: color.light }}
                          title={`Light: ${color.light}`}
                        />
                        <div
                          className="w-4 h-4 rounded-md border border-white/20 shrink-0"
                          style={{ backgroundColor: color.dark.startsWith('#') ? color.dark : '#202227' }}
                          title={`Dark: ${color.dark}`}
                        />
                      </div>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 block truncate">
                        {color.label}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 block truncate mt-0.5">
                        {color.dark}
                      </span>
                      <p className="text-[9px] text-zinc-400 mt-1 line-clamp-1">{color.desc}</p>
                      {copiedToken === color.label && (
                        <span className="absolute top-2 right-2 text-[9px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1 rounded">
                          Copié!
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Accents Sémantiques des Quarts & Sécurité */}
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Couleurs Sémantiques Métier (Quarts & Sécurité)</span>
                </h4>
                <p className="text-zinc-500 text-[11px] mb-3">
                  Couleurs réservées exclusivement aux états de quart minier et aux notifications de sécurité.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-200">
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span>Poste de Jour (J)</span>
                      </div>
                      <span className="font-mono text-[10px] bg-amber-500/20 px-1.5 py-0.2 rounded text-amber-900 dark:text-amber-100">
                        #F59E0B
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-200/80">
                      06:00 — 18:00 (12h de quart). Tons chauds d'ambre minier.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-200">
                        <Moon className="w-4 h-4 text-blue-500" />
                        <span>Poste de Nuit (N)</span>
                      </div>
                      <span className="font-mono text-[10px] bg-blue-500/20 px-1.5 py-0.2 rounded text-blue-900 dark:text-blue-100">
                        #3B82F6
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-800/80 dark:text-blue-200/80">
                      18:00 — 06:00 (12h de quart). Bleu cobalt de nuit minière.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Repos Récupérateur (R)</span>
                      </div>
                      <span className="font-mono text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded text-emerald-900 dark:text-emerald-100">
                        #10B981
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800/80 dark:text-emerald-200/80">
                      24h repos complet & connexion en ligne active.
                    </p>
                  </div>
                </div>
              </div>

              {/* Échelle Typographique */}
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
                  <Type className="w-4 h-4 text-zinc-500" />
                  <span>Échelle Typographique & Polices Système</span>
                </h4>
                <p className="text-zinc-500 text-[11px] mb-3">
                  Famille de police : <code className="font-mono bg-black/[0.04] dark:bg-white/[0.06] px-1 py-0.5 rounded">-apple-system, SF Pro, Inter, sans-serif</code>. Règle absolue de chiffres : <code className="font-mono bg-black/[0.04] dark:bg-white/[0.06] px-1 py-0.5 rounded">tabular-nums font-mono</code> pour toutes les dates et montants.
                </p>

                <div className="space-y-2 p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.07]">
                  <div className="flex items-baseline justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-2">
                    <div>
                      <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Display 2XL (24-30px)
                      </span>
                      <p className="text-[10px] text-zinc-500">Titres de quart majeurs, salaires bruts</p>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400">font-bold tracking-tight</span>
                  </div>

                  <div className="flex items-baseline justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-2">
                    <div>
                      <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Title XL (18-20px)
                      </span>
                      <p className="text-[10px] text-zinc-500">En-têtes de sections et écrans de connexion</p>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400">font-semibold</span>
                  </div>

                  <div className="flex items-baseline justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-2">
                    <div>
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        Body Standard (13-14px)
                      </span>
                      <p className="text-[10px] text-zinc-500">Paragraphes, messages d'équipe et notes HSE</p>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400">text-sm font-normal/medium</span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-mono font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
                        Monospace Chiffré : 2026-11-08 · Jour 4/9 · 1,252.40 USD
                      </span>
                      <p className="text-[10px] text-zinc-500">Matricules, heures de relève, ratios de paie</p>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400">font-mono tabular-nums</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 2 : COMPONENTS */}
          {/* ========================================================================= */}
          {activeTab === 'components' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
                  <ComponentIcon className="w-4 h-4 text-zinc-500" />
                  <span>Composants Clés de l'Architecture TFM</span>
                </h4>
                <p className="text-zinc-500 text-[11px] mb-3">
                  Composants modulaires autonomes réutilisables à travers toute l'application.
                </p>
              </div>

              {/* 1. LiquidGlassCard */}
              <div className="p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    1. LiquidGlassCard (`src/components/LiquidGlassCard.tsx`)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06]">
                    Conteneur Maître
                  </span>
                </div>
                <p className="text-zinc-500 text-[11px]">
                  Conteneur avec réfraction optique visionOS, bordure spéculaire 1px et 3 variantes hiérarchiques : <code className="font-mono">default</code>, <code className="font-mono">elevated</code>, et <code className="font-mono">interactive</code>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <LiquidGlassCard variant="default" className="p-3 text-[11px]">
                    <strong>Variante Default</strong> : Conteneur de section sobre
                  </LiquidGlassCard>
                  <LiquidGlassCard variant="elevated" className="p-3 text-[11px]">
                    <strong>Variante Elevated</strong> : Relief pour la carte dominante
                  </LiquidGlassCard>
                </div>
              </div>

              {/* 2. SyncStatusIndicator */}
              <div className="p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    2. SyncStatusIndicator (`src/components/SyncStatusIndicator.tsx`)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06]">
                    Fraîcheur des Données
                  </span>
                </div>
                <p className="text-zinc-500 text-[11px]">
                  Indique en temps réel le dernier horodatage de synchronisation des rotations et des annonces, gère le mode hors-ligne et fournit un bouton d'actualisation manuelle avec dépliant de diagnostic.
                </p>
              </div>

              {/* 3. BottomNavBar */}
              <div className="p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    3. BottomNavBar (`src/components/BottomNavBar.tsx`)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06]">
                    Navigation 5 Destinations
                  </span>
                </div>
                <p className="text-zinc-500 text-[11px]">
                  Barre de navigation inférieure native Apple avec 5 onglets stricts : Dashboard, Calendrier, Notes, Équipes, Profil. Intègre le padding sécurisé <code className="font-mono">pb-safe</code> pour la barre de gestes Android.
                </p>
              </div>

              {/* 4. Badges de poste & Squircle Calendar */}
              <div className="p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    4. Badges de Poste & Squircles Déterministes
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06]">
                    Indicateurs
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-1 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-mono font-bold text-[10px]">
                    J (Jour)
                  </span>
                  <span className="px-2 py-1 rounded-lg border border-black/20 dark:border-white/20 font-mono font-bold text-[10px]">
                    N (Nuit)
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-[10px]">
                    R (Repos)
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono font-bold text-[10px]">
                    Repère A (Repos fin)
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 font-mono font-bold text-[10px]">
                    Repère B (Travail clé)
                  </span>
                </div>
              </div>

              {/* 5. Modales Spécialisées */}
              <div className="p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    5. Modales Système & RH
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06]">
                    Overlays
                  </span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-zinc-500 text-[11px]">
                  <li><strong className="text-zinc-800 dark:text-zinc-200">AdminPayrollPortalModal</strong> : Portail RH d'importation et distribution groupée de bulletins Sage.</li>
                  <li><strong className="text-zinc-800 dark:text-zinc-200">ShareQrModal & JoinByQrModal</strong> : Partage de lien et code QR pour contacts et groupes de relève.</li>
                  <li><strong className="text-zinc-800 dark:text-zinc-200">TestRunnerModal</strong> : Panneau d'audit en temps réel des 37 tests unitaires de sécurité et de rotation.</li>
                  <li><strong className="text-zinc-800 dark:text-zinc-200">AndroidCodeExportModal</strong> : Assistant d'exportation pour compilation APK sur Android Studio.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 3 : TEMPLATES */}
          {/* ========================================================================= */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
                  <Layout className="w-4 h-4 text-zinc-500" />
                  <span>Les 6 Gabarits d'Écrans Majeurs (Templates)</span>
                </h4>
                <p className="text-zinc-500 text-[11px] mb-3">
                  Architecture des écrans principaux assemblés dans le routeur épuré `src/App.tsx`.
                </p>
              </div>

              <div className="space-y-3">
                {/* Template 1 : HomeDashboard */}
                <div className="p-3.5 rounded-xl bg-black/[0.01] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      1. Tableau de Bord Principal (`HomeDashboard.tsx`)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold">
                      Vue Accueil
                    </span>
                  </div>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                    Composé de : En-tête d'accueil avec matricule et référence de calage, indicateur visuel de synchronisation locale, jauge de progression du cycle 9j (J1 à J9), situation simultanée des 3 équipes du site (A, B, C), carte maîtresse du quart avec décompte vers le prochain repos, aperçu horizontal des 7 prochains jours, raccourcis rapides et flux des communications urgentes.
                  </p>
                </div>

                {/* Template 2 : FullCalendar */}
                <div className="p-3.5 rounded-xl bg-black/[0.01] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      2. Calendrier & Rotations Minières (`FullCalendar.tsx`)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 rounded bg-blue-500/10 text-blue-600 font-semibold">
                      Planning Déterministe
                    </span>
                  </div>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                    Reproduction ultra-fidèle de l'agencement WhatsApp minimaliste : grille 7 colonnes (L-M-M-J-V-S-D), squircle noir sélectionné, voyants sous chaque date (plein pour Jour, contour pour Nuit, point discret pour Repos), repères A/B/C et carte de synthèse mensuelle (total jours, nuits, repos et heures effectives). Choix de l'équipe déplacé strictement dans le profil pour éviter toute duplication.
                  </p>
                </div>

                {/* Template 3 : PaySlipsView */}
                <div className="p-3.5 rounded-xl bg-black/[0.01] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      3. Coffre-Fort Fiches de Paie (`PaySlipsView.tsx`)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 rounded bg-amber-500/10 text-amber-600 font-semibold">
                      Sécurisé & Chiffré
                    </span>
                  </div>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                    Conforme au document officiel Sage / TIA WORK FORCE Lubumbashi. Sas de déverrouillage préalable obligatoire (Biométrie FaceID/Empreinte ou code secret PIN), compte à rebours d'expiration de session (5 minutes), traçabilité RH certifiée, ventilation exacte des gains/retenues (CNSS, IPR, HS 130%, HS 160%, HS 200%), code QR de vérification d'authenticité et export PDF.
                  </p>
                </div>

                {/* Template 4 : MessagingView */}
                <div className="p-3.5 rounded-xl bg-black/[0.01] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      4. Relèves de Quart & Messagerie (`MessagingView.tsx`)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 rounded bg-purple-500/10 text-purple-600 font-semibold">
                      Canaux de Terrain
                    </span>
                  </div>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                    Canaux opérationnels cloisonnés (Mine Ouverte, Usine SX-EW, Superviseurs, Urgences HSE). Prise en charge des messages texte, fiches de relève structurées, messages vocaux avec lecteur audio, envoi d'images, réactions emojis et partage de groupe par lien direct ou QR code.
                  </p>
                </div>

                {/* Template 5 : AnnouncementsView */}
                <div className="p-3.5 rounded-xl bg-black/[0.01] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      5. Notes de Service & HSE (`AnnouncementsView.tsx`)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 rounded bg-rose-500/10 text-rose-600 font-semibold">
                      Communications
                    </span>
                  </div>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                    Filtrage par catégorie (HSE, Maintenance, Administration, Actualités minières) et priorité (Urgent, Élevé, Normal). Marqueur de lecture synchronisé et formulaire de publication réservé aux rôles autorisés (HSE Officer & Admin RH).
                  </p>
                </div>

                {/* Template 6 : ProfileView & LoginView */}
                <div className="p-3.5 rounded-xl bg-black/[0.01] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      6. Profil Agent & Authentification (`ProfileView.tsx` & `LoginView.tsx`)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 rounded bg-zinc-500/10 text-zinc-600 font-semibold">
                      Identité & Config
                    </span>
                  </div>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                    Gestion de l'équipe de rotation (A, B ou C), sélection du régime de quart (6/3, 5/2, 10/4), bascule de thème d'affichage (Clair, Sombre, Système OS), activation de la biométrie (FaceID / Fingerprint) pour l'accès aux fiches de paie, contacts d'urgence de la mine et déconnexion sécurisée.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PIED DE MODALE */}
        <div className="p-3.5 sm:p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between text-xs shrink-0">
          <span className="text-zinc-400 font-mono text-[11px]">
            Conforme aux directives Apple Human Interface Guidelines & TFM Mining
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium hover:opacity-90 transition shadow-xs"
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>
  );
};
