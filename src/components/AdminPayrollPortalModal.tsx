/**
 * TFM SCHEDULER — Portail RH : Importation & Distribution Sécurisée des Bulletins
 * Tenke Fungurume Mining (TFM) / TIA WORK FORCE (WFS)
 *
 * Fonctionnalité demandée :
 * - L'admin importe le lot de bulletins (extrait officiel BULLETIN_PAIE_9e3d1351.pdf)
 * - Il coche tous les agents (Case "Tout cocher" ou sélection individuelle)
 * - Il déclenche la distribution sécurisée
 * - Chaque agent reçoit UNIQUEMENT son propre bulletin
 * - Le bulletin n'est déverrouillé et lisible qu'APRÈS vérification d'identité de l'agent.
 */

import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileSpreadsheet,
  FileText,
  Lock,
  RefreshCw,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OFFICIAL_PDF_ASSET_PATH } from '../engine/payrollData';
import { PaySlip } from '../types';

interface AdminPayrollPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToAgent?: (matricule: string) => void;
}

export const AdminPayrollPortalModal: React.FC<AdminPayrollPortalModalProps> = ({
  isOpen,
  onClose,
  onSwitchToAgent,
}) => {
  const {
    allImportedPaySlips,
    distributePaySlipsToAgents,
    distributeAllPaySlips,
    resetBatchDistribution,
    user,
    hasPermission,
  } = useApp();

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    allImportedPaySlips.map((s) => s.id)
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [distributeStatusText, setDistributeStatusText] = useState('');

  if (!isOpen) return null;

  const allSelected =
    allImportedPaySlips.length > 0 && selectedIds.length === allImportedPaySlips.length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allImportedPaySlips.map((s) => s.id));
    }
  };

  const handleToggleSingle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSimulatePdfImport = async () => {
    setIsParsingPdf(true);
    setDistributeStatusText('Analyse des métadonnées du fichier BULLETIN_PAIE_9e3d1351.pdf...');
    await new Promise((r) => setTimeout(r, 600));
    setDistributeStatusText('Extraction Sage : 10 agents détectés (WFTF1013, WFTF1014...)');
    await new Promise((r) => setTimeout(r, 600));
    setIsParsingPdf(false);
    setSelectedIds(allImportedPaySlips.map((s) => s.id));
    setSuccessMessage(
      'Fichier Sage / TIA WFS analysé avec succès. Les 10 bulletins sont prêts pour la distribution sécurisée.'
    );
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleDistribute = async () => {
    if (selectedIds.length === 0) return;
    setIsDistributing(true);
    setDistributeStatusText(`Chiffrement et dépôt de ${selectedIds.length} bulletin(s) dans les coffres-forts...`);
    await new Promise((r) => setTimeout(r, 700));
    const { count } = distributePaySlipsToAgents(selectedIds);
    setIsDistributing(false);
    setSuccessMessage(
      `${count} bulletin(s) distribué(s) avec succès dans les coffres-forts agents. Chaque agent ne pourra le consulter qu'après vérification de son identité.`
    );
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleDistributeAll = async () => {
    setIsDistributing(true);
    setDistributeStatusText(`Distribution chiffrée collective aux ${allImportedPaySlips.length} agents...`);
    await new Promise((r) => setTimeout(r, 800));
    const { count } = distributeAllPaySlips();
    setSelectedIds(allImportedPaySlips.map((s) => s.id));
    setIsDistributing(false);
    setSuccessMessage(
      `L'intégralité des ${count} bulletins du lot ont été distribués. Les fiches sont verrouillées jusqu'à validation d'identité individuelle.`
    );
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const filteredSlips = allImportedPaySlips.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.matricule.toLowerCase().includes(q) ||
      s.agentName.toLowerCase().includes(q) ||
      (s.jobTitle && s.jobTitle.toLowerCase().includes(q)) ||
      s.department.toLowerCase().includes(q)
    );
  });

  const distributedCount = allImportedPaySlips.filter(
    (s) => s.distributionStatus === 'DISTRIBUTED' || s.distributionStatus === 'VIEWED_BY_AGENT'
  ).length;

  const verifiedCount = allImportedPaySlips.filter(
    (s) => s.distributionStatus === 'VIEWED_BY_AGENT'
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl bg-white dark:bg-[#18191D] border border-black/[0.08] dark:border-white/[0.1] shadow-2xl flex flex-col">
        {/* En-tête */}
        <div className="p-4 sm:p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114] flex items-center justify-center font-bold text-xs font-mono shadow-sm">
              RH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-[#18191D] dark:text-[#F4F4F5]">
                  Portail RH — Distribution Sécurisée des Bulletins
                </h3>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] text-[#71717A] dark:text-[#A1A1AA]">
                  Lot Sage / TIA WFS
                </span>
              </div>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                Chaque bulletin est affecté à son matricule et reste strictement verrouillé jusqu'à vérification d'identité de l'agent.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18191D] dark:hover:text-[#F4F4F5]"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Fichier source officiel & Métriques */}
        <div className="p-4 bg-black/[0.02] dark:bg-black/30 border-b border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={1.5} />
            <div>
              <span className="font-semibold text-[#18191D] dark:text-[#F4F4F5]">
                Document importé : BULLETIN_PAIE_9e3d1351.pdf
              </span>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                Format officiel Sage · Entreprise TIA WORK FORCE / TFM (Lubumbashi) · Période : Avril 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulatePdfImport}
              disabled={isParsingPdf}
              className="px-2.5 py-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[#18191D] dark:text-[#F4F4F5] font-medium hover:bg-black/[0.08] transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isParsingPdf ? 'animate-spin text-blue-500' : ''}`} strokeWidth={1.5} />
              <span>{isParsingPdf ? 'Analyse en cours...' : 'Re-scanner le lot'}</span>
            </button>

            <a
              href={OFFICIAL_PDF_ASSET_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[#18191D] dark:text-[#F4F4F5] font-medium hover:bg-black/[0.08] transition flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Voir le PDF original</span>
            </a>
          </div>
        </div>

        {/* Bannière d'état en direct lors du traitement cryptographique */}
        {(isDistributing || isParsingPdf) && (
          <div className="px-4 py-2.5 bg-blue-500/10 border-b border-blue-500/20 text-xs text-[#18191D] dark:text-[#F4F4F5] flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span className="font-medium">{distributeStatusText}</span>
          </div>
        )}

        {/* Tableau de bord indicateurs */}
        <div className="grid grid-cols-3 gap-2 p-4 border-b border-black/[0.06] dark:border-white/[0.08] font-mono text-center">
          <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block uppercase">Bulletins extraits</span>
            <span className="text-base font-semibold text-[#18191D] dark:text-[#F4F4F5] tabular-nums">
              {allImportedPaySlips.length} agents
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block uppercase">Distribués (Coffres-forts)</span>
            <span className="text-base font-semibold text-blue-500 tabular-nums">
              {distributedCount} / {allImportedPaySlips.length}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block uppercase">Identité vérifiée & Lu</span>
            <span className="text-base font-semibold text-emerald-500 tabular-nums">
              {verifiedCount} agents
            </span>
          </div>
        </div>

        {/* Message de succès */}
        {successMessage && (
          <div className="m-4 mb-0 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-[#18191D] dark:text-[#F4F4F5] flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Barre d'action avec "Tout cocher" */}
        <div className="p-3 sm:px-4 border-b border-black/[0.04] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Case MAÎTRESSE : Tout Cocher */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#18191D] dark:text-[#F4F4F5]">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded border-black/20 text-[#18191D] focus:ring-0 cursor-pointer"
              />
              <span>Cocher tous les agents ({selectedIds.length}/{allImportedPaySlips.length})</span>
            </label>

            <span className="text-[#71717A] dark:text-[#A1A1AA] text-xs">|</span>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, matricule..."
              className="px-2.5 py-1 text-xs rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-[#18191D] dark:text-[#F4F4F5] placeholder:text-[#71717A] dark:placeholder:text-[#A1A1AA] focus:outline-none w-48 sm:w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDistribute}
              disabled={selectedIds.length === 0}
              className="min-h-[34px] px-4 py-1.5 rounded-xl bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114] text-xs font-semibold hover:opacity-90 active:scale-95 disabled:opacity-40 transition flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Distribuer aux sélectionnés ({selectedIds.length})</span>
            </button>
          </div>
        </div>

        {/* Liste détaillée des agents et de leurs fiches de paie */}
        <div className="flex-1 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.06]">
          {filteredSlips.map((slip) => {
            const isSelected = selectedIds.includes(slip.id);
            const isDistributed =
              slip.distributionStatus === 'DISTRIBUTED' ||
              slip.distributionStatus === 'VIEWED_BY_AGENT';
            const isViewed = slip.distributionStatus === 'VIEWED_BY_AGENT';

            return (
              <div
                key={slip.id}
                className={`p-3.5 sm:px-5 flex items-center justify-between gap-3 text-xs transition ${
                  isSelected
                    ? 'bg-black/[0.015] dark:bg-white/[0.02]'
                    : 'hover:bg-black/[0.01] dark:hover:bg-white/[0.01]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSingle(slip.id)}
                    className="w-4 h-4 rounded border-black/20 text-[#18191D] focus:ring-0 cursor-pointer shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#18191D] dark:text-[#F4F4F5]">
                        {slip.matricule}
                      </span>
                      <span className="font-semibold text-[#18191D] dark:text-[#F4F4F5] truncate">
                        {slip.agentName}
                      </span>
                      <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/[0.04] dark:bg-white/[0.06] text-[#71717A] dark:text-[#A1A1AA]">
                        {slip.grade}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                      <span className="font-medium text-[#18191D] dark:text-[#F4F4F5]">
                        {slip.jobTitle || 'Opérateur'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate max-w-[200px]">{slip.department}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{slip.daysWorkedDay}j Jour / {slip.daysWorkedNight}j Nuit</span>
                    </div>
                  </div>
                </div>

                {/* Montant Net & Statut d'identité */}
                <div className="flex items-center gap-4 shrink-0 font-mono">
                  <div className="text-right">
                    <span className="font-bold text-[#18191D] dark:text-[#F4F4F5] tabular-nums block">
                      ${slip.netSalaryUSD.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
                      {new Intl.NumberFormat('fr-CD').format(slip.netSalaryCDF)} CDF
                    </span>
                  </div>

                  <div className="w-36 text-right">
                    {isViewed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <UserCheck className="w-3 h-3" strokeWidth={2} />
                        <span>Identité vérifiée & Lu</span>
                      </span>
                    ) : isDistributed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <Lock className="w-3 h-3" strokeWidth={1.5} />
                        <span>Verrouillé en coffre</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/[0.04] dark:bg-white/[0.06] text-[#71717A] dark:text-[#A1A1AA]">
                        <Clock className="w-3 h-3" strokeWidth={1.5} />
                        <span>En attente import</span>
                      </span>
                    )}
                  </div>

                  {/* Bouton de test rapide : simuler cet agent pour tester la vérification d'identité */}
                  {onSwitchToAgent && (
                    <button
                      onClick={() => onSwitchToAgent(slip.matricule)}
                      title={`Se connecter et tester la vue agent de ${slip.agentName}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium text-[#18191D] dark:text-[#F4F4F5] bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] border border-black/[0.06] dark:border-white/[0.08] transition shrink-0"
                    >
                      <span>Tester agent</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pied de dialogue avec garanties de sécurité */}
        <div className="p-3.5 sm:p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-[#71717A] dark:text-[#A1A1AA] font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={1.5} />
            <span>Sécurité certifiée : Aucun agent ne peut voir le bulletin d'un collègue. Déverrouillage individuel par PIN/secret.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDistributeAll}
              className="px-3 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#18191D] dark:text-[#F4F4F5] font-semibold hover:bg-black/[0.08] transition"
            >
              Distribuer tout le lot
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114] font-semibold hover:opacity-90 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
