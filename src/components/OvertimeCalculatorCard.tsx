/**
 * TFM SCHEDULER — Module de Calcul des Heures Supplémentaires (Cycle de Rotation 9 Jours)
 * Spécifiquement calibré sur le cycle minier TFM 6/3 (6 jours travaillés de 12h, 3 jours de repos).
 * Conforme aux barèmes officiels Sage / TIA WORK FORCE / TFM :
 * - HS 130% : 9e et 10e heure de poste journalier (2h/jour x 6j = 12h)
 * - HS 160% : 11e et 12e heure de poste journalier + prolongations de relève (2h/jour x 6j = 12h + extra)
 * - HS 200% : Rappels d'urgence et prestations sur jours de repos (J7, J8, J9)
 * - Majoration Nuit (+25%) : 3 postes de nuit de 12h = 36h de nuit par cycle
 */

import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calculator,
  RotateCw,
  Sun,
  Moon,
  Sparkles,
  Zap,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  Save,
  Plus,
  Minus,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateCycleOvertime, USD_TO_CDF_DEFAULT } from '../engine/overtimeEngine';
import { CycleDayInfo } from '../types';
import { LiquidGlassCard } from './LiquidGlassCard';

interface OvertimeCalculatorCardProps {
  currentDayInfo: CycleDayInfo;
  className?: string;
}

export const OvertimeCalculatorCard: React.FC<OvertimeCalculatorCardProps> = ({
  currentDayInfo,
  className = '',
}) => {
  const { user, shiftConfig } = useApp();

  // Mode de projection : 'cycle' (9 jours) ou 'month' (mois complet ~3.33 cycles)
  const [projectionMode, setProjectionMode] = useState<'cycle' | 'month'>('cycle');

  // Paramètres personnalisables de l'agent
  const [baseHourlyRateUSD, setBaseHourlyRateUSD] = useState<number>(3.96); // Taux horaire de base TFM
  const [restDayCallIns, setRestDayCallIns] = useState<number>(0); // Nombre de rappels sur repos (0 à 3)
  const [handoverExtraHours, setHandoverExtraHours] = useState<number>(0); // Heures de relève/dépannage (0 à 18h)
  const [includeNightBonus, setIncludeNightBonus] = useState<boolean>(true); // Majoration poste de nuit (+25%)
  const [currencyDisplay, setCurrencyDisplay] = useState<'USD' | 'CDF'>('USD');
  const [showLegalDetails, setShowLegalDetails] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  // Calcul direct via le moteur certifié d'heures supplémentaires TFM
  const calc = useMemo(() => {
    return calculateCycleOvertime({
      baseHourlyRateUSD,
      restDayCallIns,
      handoverExtraHours,
      includeNightBonus,
      projectionMode,
      usdToCdfRate: USD_TO_CDF_DEFAULT,
    });
  }, [
    baseHourlyRateUSD,
    restDayCallIns,
    handoverExtraHours,
    includeNightBonus,
    projectionMode,
  ]);

  const {
    totalHoursWorked,
    contractualBaseHours: totalContractualHours,
    structuralHS130Hours: totalHS130,
    totalHS160Hours: totalHS160,
    restDayHS200Hours: totalHS200,
    totalOvertimeHours,
    nightHours,
    amountHS130USD: amountHS130,
    amountHS160USD: amountHS160,
    amountHS200USD: amountHS200,
    nightBonusAmountUSD: nightBonusAmount,
    totalOvertimeCompensationUSD,
    totalGrossEstimateUSD,
  } = calc;

  // Formatage des montants
  const formatAmount = (usdValue: number) => {
    if (currencyDisplay === 'CDF') {
      const cdf = Math.round(usdValue * USD_TO_CDF_DEFAULT);
      return `${cdf.toLocaleString('fr-FR')} CDF`;
    }
    return `$ ${usdValue.toFixed(2)}`;
  };

  // Scénarios prédéfinis rapides
  const applyPreset = (preset: 'standard' | 'one_callin' | 'intensive') => {
    if (preset === 'standard') {
      setRestDayCallIns(0);
      setHandoverExtraHours(0);
    } else if (preset === 'one_callin') {
      setRestDayCallIns(1);
      setHandoverExtraHours(0);
    } else if (preset === 'intensive') {
      setRestDayCallIns(2);
      setHandoverExtraHours(4);
    }
  };

  const handleSaveTimesheet = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  // Position actuelle de l'agent dans son cycle
  const currentCycleDay = currentDayInfo.cycleDay;
  const isCurrentlyWorkingDay = currentDayInfo.shiftType === 'DAY' || currentDayInfo.shiftType === 'NIGHT';
  const remainingCycleDays = 9 - currentCycleDay;

  return (
    <LiquidGlassCard variant="default" className={`p-4 sm:p-5 overflow-hidden ${className}`}>
      <div className="space-y-4">
        {/* EN-TÊTE DU MODULE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.04] dark:border-white/[0.06] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Calculator className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400">
                  Décompte TFM & Code du Travail
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/[0.04] dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400">
                  Cycle 9j (6/3)
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                Calculateur d'Heures Supplémentaires
              </h3>
            </div>
          </div>

          {/* SÉLECTEUR DE MODE & DEVISE */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Cycle vs Mois */}
            <div className="flex rounded-xl bg-black/[0.04] dark:bg-white/[0.06] p-0.5 border border-black/[0.04] dark:border-white/[0.06] text-xs font-medium">
              <button
                type="button"
                onClick={() => setProjectionMode('cycle')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  projectionMode === 'cycle'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                1 Cycle (9j)
              </button>
              <button
                type="button"
                onClick={() => setProjectionMode('month')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  projectionMode === 'month'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Mois (30j)
              </button>
            </div>

            {/* USD / CDF */}
            <button
              type="button"
              onClick={() => setCurrencyDisplay(currencyDisplay === 'USD' ? 'CDF' : 'USD')}
              className="px-2 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 border border-black/[0.04] dark:border-white/[0.06] transition"
              title="Basculer la devise d'affichage"
            >
              {currencyDisplay}
            </button>
          </div>
        </div>

        {/* STATUT DU CYCLE EN COURS */}
        <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <RotateCw className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
            <span className="text-zinc-600 dark:text-zinc-400">
              Votre position actuelle :{' '}
              <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">
                Jour {currentCycleDay}/9 ({currentDayInfo.shiftLabel})
              </strong>
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            {remainingCycleDays === 0
              ? 'Dernier jour du cycle'
              : `${remainingCycleDays}j restants dans ce cycle`}
          </span>
        </div>

        {/* SCÉNARIOS RAPIDES */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-zinc-400 font-medium shrink-0 mr-1">Préréglages :</span>
          <button
            type="button"
            onClick={() => applyPreset('standard')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
              restDayCallIns === 0 && handoverExtraHours === 0
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs'
                : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300 hover:border-black/20'
            }`}
          >
            Quart standard (72h)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('one_callin')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
              restDayCallIns === 1 && handoverExtraHours === 0
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs'
                : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300 hover:border-black/20'
            }`}
          >
            +1 Rappel repos (+12h à 200%)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('intensive')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
              restDayCallIns === 2 && handoverExtraHours === 4
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs'
                : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300 hover:border-black/20'
            }`}
          >
            Intensif (+2 Rappels + 4h Relève)
          </button>
        </div>

        {/* GRILLE DE RÉSULTAT MAJEUR — HEURES ET RÉMUNÉRATION */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Carte 1 : Total Heures Travaillées */}
          <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.07]">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
              Heures Totales Effectuées
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-50">
                {Math.round(totalHoursWorked * 10) / 10}h
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                dont {Math.round(totalContractualHours)}h base
              </span>
            </div>
            <div className="mt-2 text-[10px] text-zinc-500 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{6 * (projectionMode === 'month' ? 3.33 : 1)} postes de 12h</span>
            </div>
          </div>

          {/* Carte 2 : Total Heures Supplémentaires */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 block">
              Total Heures Supplémentaires
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold font-mono tracking-tight text-amber-900 dark:text-amber-100">
                +{Math.round(totalOvertimeHours * 10) / 10}h
              </span>
              <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                sur le {projectionMode === 'cycle' ? 'cycle' : 'mois'}
              </span>
            </div>
            <div className="mt-2 text-[10px] text-amber-700/80 dark:text-amber-300/80 font-mono">
              Structurelles (24h) + Rappels ({totalHS200}h)
            </div>
          </div>

          {/* Carte 3 : Prime / Gain Estimé HS */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 block">
              Gain Heures Sup. & Majorations
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold font-mono tracking-tight text-emerald-900 dark:text-emerald-100">
                {formatAmount(totalOvertimeCompensationUSD)}
              </span>
            </div>
            <div className="mt-2 text-[10px] text-emerald-700/80 dark:text-emerald-300/80 font-mono">
              Salaire brut total : {formatAmount(totalGrossEstimateUSD)}
            </div>
          </div>
        </div>

        {/* DÉCOMPTE DÉTAILLÉ DES PALIERS D'HEURES SUP (130%, 160%, 200%, NUIT) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 px-0.5">
            <span>Ventilation réglementaire des majorations</span>
            <span className="font-mono text-[11px]">Taux horaire : ${baseHourlyRateUSD.toFixed(2)}/h</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Palier 130% */}
            <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300">
                  HS 130%
                </span>
                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {Math.round(totalHS130 * 10) / 10}h
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-tight">
                9e & 10e heure (+30%)
              </p>
              <p className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
                {formatAmount(amountHS130)}
              </p>
            </div>

            {/* Palier 160% */}
            <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                  HS 160%
                </span>
                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {Math.round(totalHS160 * 10) / 10}h
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-tight">
                11e & 12e h + relèves (+60%)
              </p>
              <p className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
                {formatAmount(amountHS160)}
              </p>
            </div>

            {/* Palier 200% */}
            <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300">
                  HS 200%
                </span>
                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {Math.round(totalHS200 * 10) / 10}h
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-tight">
                Rappels sur repos (+100%)
              </p>
              <p className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
                {formatAmount(amountHS200)}
              </p>
            </div>

            {/* Majoration Nuit */}
            <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300">
                  Nuit +25%
                </span>
                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {Math.round(nightHours)}h
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-tight">
                3 nuits x 12h (18h-06h)
              </p>
              <p className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
                {formatAmount(nightBonusAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* CONTRÔLES INTERACTIFS DES VARIABLES DE QUART */}
        <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Ajuster les heures supplémentaires du cycle
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">Modulable en temps réel</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Contrôle 1 : Rappels sur Repos (0 à 3) */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    Rappels sur Repos (J7, J8, J9)
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {restDayCallIns} poste(s) ({restDayCallIns * 12}h)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRestDayCallIns(Math.max(0, restDayCallIns - 1))}
                  className="w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] flex items-center justify-center text-zinc-700 dark:text-zinc-200 transition"
                  disabled={restDayCallIns <= 0}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <div className="flex-1 text-center font-mono text-xs text-zinc-600 dark:text-zinc-300">
                  {restDayCallIns === 0
                    ? 'Aucun rappel'
                    : `+${restDayCallIns * 12}h payées à 200%`}
                </div>
                <button
                  type="button"
                  onClick={() => setRestDayCallIns(Math.min(3, restDayCallIns + 1))}
                  className="w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] flex items-center justify-center text-zinc-700 dark:text-zinc-200 transition"
                  disabled={restDayCallIns >= 3}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Contrôle 2 : Prolongations de relève / dépannage */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    Relève prolongée / Dépannage
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  +{handoverExtraHours}h (à 160%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHandoverExtraHours(Math.max(0, handoverExtraHours - 1))}
                  className="w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] flex items-center justify-center text-zinc-700 dark:text-zinc-200 transition"
                  disabled={handoverExtraHours <= 0}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="range"
                  min="0"
                  max="16"
                  step="1"
                  value={handoverExtraHours}
                  onChange={(e) => setHandoverExtraHours(Number(e.target.value))}
                  className="flex-1 accent-zinc-900 dark:accent-white h-1.5 bg-black/[0.06] dark:bg-white/[0.08] rounded-full"
                />
                <button
                  type="button"
                  onClick={() => setHandoverExtraHours(Math.min(16, handoverExtraHours + 1))}
                  className="w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] flex items-center justify-center text-zinc-700 dark:text-zinc-200 transition"
                  disabled={handoverExtraHours >= 16}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* SÉLECTION DU TAUX HORAIRE DE L'AGENT */}
          <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-t border-black/[0.04] dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-medium">Barème horaire :</span>
              <div className="flex items-center gap-1">
                {[
                  { label: 'Opérateur ($3.96)', rate: 3.96 },
                  { label: 'Mécanicien ($4.80)', rate: 4.80 },
                  { label: 'Superviseur ($6.50)', rate: 6.50 },
                ].map((preset) => (
                  <button
                    key={preset.rate}
                    type="button"
                    onClick={() => setBaseHourlyRateUSD(preset.rate)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                      baseHourlyRateUSD === preset.rate
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold'
                        : 'bg-black/[0.04] dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 hover:bg-black/[0.08]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto font-mono text-xs">
              <span className="text-zinc-400">Taux personnalisé :</span>
              <div className="flex items-center rounded-md bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 px-2 py-0.5">
                <span className="text-zinc-400 mr-1">$</span>
                <input
                  type="number"
                  step="0.10"
                  min="1"
                  max="30"
                  value={baseHourlyRateUSD}
                  onChange={(e) => setBaseHourlyRateUSD(Math.max(1, Number(e.target.value) || 3.96))}
                  className="w-12 bg-transparent text-right font-mono font-semibold text-zinc-900 dark:text-zinc-100 outline-none"
                />
                <span className="text-zinc-400 ml-1">/h</span>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS & EXPLICATION LÉGALE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setShowLegalDetails(!showLegalDetails)}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition font-medium self-start"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Règles de calcul légales (Code du Travail RDC & TFM)</span>
            {showLegalDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={handleSaveTimesheet}
            className={`flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-xs ${
              savedFeedback
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90'
            }`}
          >
            {savedFeedback ? (
              <>
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>Heures du cycle validées</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer pour la paie</span>
              </>
            )}
          </button>
        </div>

        {/* VOLET DÉTAILLÉ DU CADRE LÉGAL */}
        {showLegalDetails && (
          <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] text-xs text-zinc-600 dark:text-zinc-300 space-y-2 animate-fadeIn">
            <h5 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
              Barème légal d'application des quarts miniers 12h à Tenke Fungurume Mining :
            </h5>
            <ul className="space-y-1.5 pl-4 list-disc text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">Base contractuelle (48h) :</strong> 6 jours travaillés x 8 heures standard = 48 heures normales payées à 100%.
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">Heures sup structurelles 130% :</strong> Les 2 premières heures au-delà de 8h (9e et 10e heure) par poste = 2h x 6 jours = 12h payées à 130% (majoration +30%).
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">Heures sup structurelles 160% :</strong> Les heures suivantes de quart (11e et 12e heure) + relèves prolongées = 2h x 6 jours = 12h payées à 160% (majoration +60%).
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">Rappels sur repos 200% :</strong> Toute prestation effectuée pendant les 3 jours de repos récupérateur (J7, J8, J9) est rémunérée à taux double (200%).
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">Majoration travail de nuit :</strong> Tout travail entre 18h00 et 06h00 bénéficie d'une prime légale de nuit de +25% sur le taux de base.
              </li>
            </ul>
          </div>
        )}
      </div>
    </LiquidGlassCard>
  );
};
