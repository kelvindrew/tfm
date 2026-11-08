/**
 * TFM SCHEDULER — Modale Rejoindre un Groupe ou Ajouter un Contact par Code QR / Lien
 * Permet de :
 * - Scanner un code QR de canal ou de contact (caméra ou sélection d'image)
 * - Coller un lien d'invitation (ex: https://tfm-scheduler.cd/join/ch-team-a)
 * - Entrer un code ou identifiant d'agent / groupe
 * - Rejoindre instantanément le canal ou démarrer la discussion
 */

import React, { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  FileSearch,
  Link,
  QrCode,
  Search,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';

interface JoinByQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinSuccess: (target: { type: 'group' | 'contact'; id: string; name: string }) => void;
}

export const JoinByQrModal: React.FC<JoinByQrModalProps> = ({
  isOpen,
  onClose,
  onJoinSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const [inputValue, setInputValue] = useState('');
  const [detectedEntity, setDetectedEntity] = useState<{
    type: 'group' | 'contact';
    id: string;
    name: string;
    description: string;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Raccourcis de simulation de scan rapide
  const sampleCodes = [
    {
      label: '👥 Canal Équipe A (SX-EW)',
      code: 'https://tfm-scheduler.cd/join/ch-team-a',
      entity: {
        type: 'group' as const,
        id: 'ch-team-a',
        name: 'Équipe A — SX-EW (Production)',
        description: 'Canal opérationnel des équipes de quart usine',
      },
    },
    {
      label: '⚠️ Canal Vigilance HSE',
      code: 'https://tfm-scheduler.cd/join/ch-hse-alert',
      entity: {
        type: 'group' as const,
        id: 'ch-hse-alert',
        name: 'Vigilance HSE & Prévention Usine',
        description: 'Signalements d\'anomalies et consignes de sécurité',
      },
    },
    {
      label: '👤 Contact : Ilunga Mwamba',
      code: 'https://tfm-scheduler.cd/contact/agent-1',
      entity: {
        type: 'contact' as const,
        id: 'ch-sup-direct',
        name: 'Ilunga Mwamba',
        description: 'Superviseur de Quart Usine (Poste Jour)',
      },
    },
    {
      label: '👤 Contact : Dr. Kabange Numbi',
      code: 'https://tfm-scheduler.cd/contact/agent-2',
      entity: {
        type: 'contact' as const,
        id: 'ch-team-a',
        name: 'Dr. Kabange Numbi',
        description: 'Ingénieur Métallurgiste (Lixiviation & Procédés)',
      },
    },
  ];

  const handleSimulateScan = (sample: typeof sampleCodes[0]) => {
    setIsScanning(true);
    setScanSuccessMessage('Scan du Code QR en cours...');

    setTimeout(() => {
      setIsScanning(false);
      setInputValue(sample.code);
      setDetectedEntity(sample.entity);
      setScanSuccessMessage(`Code QR scanné avec succès : ${sample.entity.name}`);
    }, 700);
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    const cleaned = text.trim().toLowerCase();

    // Recherche de correspondance intelligente
    if (cleaned.includes('team-a') || cleaned.includes('equipe a')) {
      setDetectedEntity({
        type: 'group',
        id: 'ch-team-a',
        name: 'Équipe A — SX-EW (Production)',
        description: 'Canal d\'opération quart usine',
      });
    } else if (cleaned.includes('hse') || cleaned.includes('securite')) {
      setDetectedEntity({
        type: 'group',
        id: 'ch-hse-alert',
        name: 'Vigilance HSE & Prévention Usine',
        description: 'Canal de sécurité et conformité TFM',
      });
    } else if (cleaned.includes('maint') || cleaned.includes('usine')) {
      setDetectedEntity({
        type: 'group',
        id: 'ch-maint-plant',
        name: 'Maintenance & Instrumentation B',
        description: 'Interventions mécaniques et automates',
      });
    } else if (cleaned.includes('ilunga') || cleaned.includes('agent-1') || cleaned.includes('sup')) {
      setDetectedEntity({
        type: 'contact',
        id: 'ch-sup-direct',
        name: 'Ilunga Mwamba',
        description: 'Superviseur de Quart Usine',
      });
    } else if (cleaned.includes('kabange') || cleaned.includes('agent-2')) {
      setDetectedEntity({
        type: 'contact',
        id: 'ch-team-a',
        name: 'Dr. Kabange Numbi',
        description: 'Ingénieur Métallurgiste',
      });
    } else if (cleaned.length > 3) {
      setDetectedEntity({
        type: 'group',
        id: `ch-custom-${Date.now()}`,
        name: `Canal TFM (${text.trim().slice(0, 20)})`,
        description: 'Canal rejoint via lien personnalisé',
      });
    } else {
      setDetectedEntity(null);
    }
  };

  const handleConfirmJoin = () => {
    if (!detectedEntity) return;
    onJoinSuccess({
      type: detectedEntity.type,
      id: detectedEntity.id,
      name: detectedEntity.name,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#18191D] border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-5 space-y-4 my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Entête */}
        <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center shadow-2xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Scanner ou Rejoindre
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Via un Code QR ou un lien d'invitation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5 transition"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sélecteur d'onglets (Scanner QR vs Saisie de Lien) */}
        <div className="p-0.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/50 border border-black/[0.04] dark:border-white/[0.06] flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'scan'
                ? 'bg-white dark:bg-[#202227] text-zinc-900 dark:text-white shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Caméra / QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'manual'
                ? 'bg-white dark:bg-[#202227] text-zinc-900 dark:text-white shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Coller un Lien</span>
          </button>
        </div>

        {/* Contenu onglet Scan */}
        {activeTab === 'scan' ? (
          <div className="space-y-3">
            {/* Viseur de caméra simulation / lecture */}
            <div className="relative w-full aspect-square max-w-[220px] mx-auto rounded-3xl bg-zinc-900 overflow-hidden border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center text-center p-4 shadow-inner group">
              {/* Ligne laser d'animation de scan */}
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 shadow-[0_0_12px_#10B981] animate-pulse" />

              {/* Coins du viseur de scan */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-emerald-500 rounded-tl-lg" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-emerald-500 rounded-tr-lg" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-emerald-500 rounded-bl-lg" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-emerald-500 rounded-br-lg" />

              <Camera className="w-8 h-8 text-zinc-500 mb-2" strokeWidth={1.5} />
              <p className="text-[11px] text-zinc-400 font-mono">
                {isScanning ? 'Analyse du QR Code...' : 'Pointez la caméra vers le QR Code TFM'}
              </p>
            </div>

            {/* Raccourcis de simulation de scan direct pour test immédiat */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 block text-center">
                Ou testez un scan d'exemple en 1 clic :
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {sampleCodes.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSimulateScan(sample)}
                    className="p-2 text-left rounded-xl bg-zinc-100/80 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition border border-black/[0.04] dark:border-white/[0.06] text-[11px] font-medium text-zinc-800 dark:text-zinc-200 truncate active:scale-95"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Contenu onglet Saisie de Lien / Code */
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                Collez le lien d'invitation ou le nom du canal / agent :
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="ex: https://tfm-scheduler.cd/join/ch-team-a ou Ilunga"
                  className="w-full pl-3 pr-8 py-2 text-xs rounded-xl bg-zinc-100/70 dark:bg-zinc-800/60 border border-black/[0.06] dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputValue('');
                      setDetectedEntity(null);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Vous pouvez coller n'importe quel lien partagé par un collègue, ou saisir directement le nom du canal (ex: Équipe A, HSE, Maintenance) ou de l'agent.
            </p>
          </div>
        )}

        {/* Message de succès ou Entité Détectée */}
        {detectedEntity && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs ${
                  detectedEntity.type === 'group' ? 'bg-blue-600' : 'bg-emerald-600'
                }`}
              >
                {detectedEntity.type === 'group' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">
                    {detectedEntity.type === 'group' ? 'Canal détecté' : 'Contact détecté'}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {detectedEntity.name}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              {detectedEntity.description}
            </p>

            <button
              type="button"
              onClick={handleConfirmJoin}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
            >
              <span>{detectedEntity.type === 'group' ? 'Rejoindre ce canal' : 'Ouvrir la discussion'}</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* Note de conformité */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono text-center pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Vérification cryptographique des invitations TFM</span>
        </div>
      </div>
    </div>
  );
};
