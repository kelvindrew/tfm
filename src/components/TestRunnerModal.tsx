/**
 * TFM SCHEDULER — Panneau de Vérification des Tests & Sécurité (Apple Minimal)
 * Conforme aux exigences des Phases 1 à 4 :
 * - 18 tests unitaires du moteur de rotation 9 jours
 * - 12 tests automatisés de sécurité, anti-brute force, RBAC et cloisonnement
 * - Total : 30 tests automatisés avec relance en temps réel
 */

import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle,
  RotateCcw,
  Shield,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import {
  runRotationEngineTests,
  TestSuiteSummary,
} from '../engine/rotationEngine.test';
import {
  runSecurityEngineTests,
  SecurityTestSuiteSummary,
} from '../engine/securityEngine.test';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UnifiedTestItem {
  id: string;
  suite: 'ROTATION' | 'SECURITY';
  category: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose }) => {
  const [rotationSummary, setRotationSummary] = useState<TestSuiteSummary>(() =>
    runRotationEngineTests()
  );
  const [securitySummary, setSecuritySummary] = useState<SecurityTestSuiteSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ROTATION' | 'SECURITY'>('ALL');
  const [filter, setFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');
  const [isRunning, setIsRunning] = useState(false);

  const executeAllTests = async () => {
    setIsRunning(true);
    const rot = runRotationEngineTests();
    const sec = await runSecurityEngineTests();
    setRotationSummary(rot);
    setSecuritySummary(sec);
    setIsRunning(false);
  };

  useEffect(() => {
    if (isOpen && !securitySummary) {
      executeAllTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Unification des résultats pour affichage fluide
  const allTests: UnifiedTestItem[] = [
    ...rotationSummary.results.map((r) => ({
      ...r,
      suite: 'ROTATION' as const,
    })),
    ...(securitySummary?.results || []).map((r) => ({
      ...r,
      suite: 'SECURITY' as const,
    })),
  ];

  const totalCount = allTests.length;
  const passedCount = allTests.filter((t) => t.passed).length;
  const failedCount = allTests.filter((t) => !t.passed).length;

  const filteredResults = allTests.filter((t) => {
    if (activeTab === 'ROTATION' && t.suite !== 'ROTATION') return false;
    if (activeTab === 'SECURITY' && t.suite !== 'SECURITY') return false;
    if (filter === 'PASSED') return t.passed;
    if (filter === 'FAILED') return !t.passed;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#18191D] border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-5 sm:p-6 space-y-4">
        {/* En-tête sobre */}
        <div className="flex items-start justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] text-[#18191D] dark:text-[#F4F4F5]">
                {passedCount}/{totalCount} Validés
              </span>
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
                {new Date().toLocaleTimeString('fr-FR')}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-[#18191D] dark:text-[#F4F4F5] mt-1">
              Suite de Tests Automatisés TFM
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              18 tests de rotation 9 jours + 14 tests de sécurité, anti-brute force, RBAC et distribution de bulletins.
            </p>
          </div>

          <button
            onClick={onClose}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18191D] dark:hover:text-[#F4F4F5]"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Scorecard sobre */}
        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block uppercase">Total</span>
            <span className="text-lg font-semibold text-[#18191D] dark:text-[#F4F4F5] tabular-nums">
              {totalCount}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block uppercase">Succès</span>
            <span className="text-lg font-semibold text-emerald-500 tabular-nums">
              {passedCount}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block uppercase">Échecs</span>
            <span className="text-lg font-semibold text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
              {failedCount}
            </span>
          </div>
        </div>

        {/* Sélecteur de suite (Tous / Moteur / Sécurité) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                activeTab === 'ALL'
                  ? 'bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114]'
                  : 'bg-black/[0.03] dark:bg-white/[0.04] text-[#71717A] dark:text-[#A1A1AA]'
              }`}
            >
              Tous ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('ROTATION')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                activeTab === 'ROTATION'
                  ? 'bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114]'
                  : 'bg-black/[0.03] dark:bg-white/[0.04] text-[#71717A] dark:text-[#A1A1AA]'
              }`}
            >
              Moteur (18)
            </button>
            <button
              onClick={() => setActiveTab('SECURITY')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                activeTab === 'SECURITY'
                  ? 'bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114]'
                  : 'bg-black/[0.03] dark:bg-white/[0.04] text-[#71717A] dark:text-[#A1A1AA]'
              }`}
            >
              <Shield className="w-3 h-3" strokeWidth={1.5} />
              <span>Sécurité ({securitySummary?.total || 14})</span>
            </button>
          </div>

          <button
            onClick={executeAllTests}
            disabled={isRunning}
            className="min-h-[32px] px-3 py-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[#18191D] dark:text-[#F4F4F5] text-xs font-medium hover:bg-black/[0.08] dark:hover:bg-white/[0.1] flex items-center gap-1.5 active:scale-95 transition"
          >
            <RotateCcw className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            <span>{isRunning ? 'Exécution...' : 'Relancer tout'}</span>
          </button>
        </div>

        {/* Liste détaillée des tests */}
        <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredResults.map((t) => (
            <div
              key={t.id}
              className="p-3 rounded-xl bg-black/[0.01] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] text-xs space-y-1"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2} />
                  <span className="font-medium text-[#18191D] dark:text-[#F4F4F5]">
                    {t.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] text-[#71717A] dark:text-[#A1A1AA]">
                    {t.category}
                  </span>
                </div>
              </div>

              <div className="pl-5 text-[11px] text-[#71717A] dark:text-[#A1A1AA] font-mono space-y-0.5">
                <div>
                  <span className="opacity-70">Attendu : </span>
                  <span>{t.expected}</span>
                </div>
                <div>
                  <span className="opacity-70">Obtenu : </span>
                  <span className="text-[#18191D] dark:text-[#F4F4F5]">{t.actual}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end border-t border-black/[0.06] dark:border-white/[0.08]">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114] text-xs font-semibold hover:opacity-90 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
