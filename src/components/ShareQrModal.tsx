/**
 * TFM SCHEDULER — Modale Partage de Contact & Groupe par Lien et Code QR
 * Permet de :
 * - Partager un Contact (Agent TFM, VCard, Lien direct de messagerie)
 * - Partager un Groupe / Canal (Lien d'invitation sécurisé + QR Code scannable)
 * - Copier le lien en 1 clic avec feedback visuel
 * - Partager via Web Share API native (WhatsApp, SMS, etc.)
 * - Télécharger l'image PNG haute résolution du QR Code
 */

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Check,
  Copy,
  Download,
  Link as LinkIcon,
  QrCode,
  Share2,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';

export interface ShareEntity {
  type: 'group' | 'contact';
  id: string;
  name: string;
  roleOrDesc: string;
  department?: string;
  matricule?: string;
  phone?: string;
  email?: string;
  channelId?: string;
}

interface ShareQrModalProps {
  entity: ShareEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenChat?: (channelId: string) => void;
}

export const ShareQrModal: React.FC<ShareQrModalProps> = ({
  entity,
  isOpen,
  onClose,
  onOpenChat,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Générer le lien de partage officiel
  const shareUrl = React.useMemo(() => {
    if (!entity) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tfm-scheduler.cd';
    if (entity.type === 'group') {
      return `${origin}/join/${entity.id}`;
    }
    return `${origin}/contact/${entity.id}`;
  }, [entity]);

  // Contenu encodé dans le QR Code
  const qrContent = React.useMemo(() => {
    if (!entity) return '';
    if (entity.type === 'group') {
      // Pour un groupe, le lien direct d'invitation
      return shareUrl;
    }
    // Pour un contact, une carte vCard ou lien direct
    return `BEGIN:VCARD
VERSION:3.0
FN:${entity.name}
ORG:Tenke Fungurume Mining (TFM)
TITLE:${entity.roleOrDesc}
NOTE:Matricule ${entity.matricule || 'TFM'} - ${entity.department || 'Opérations'}
URL:${shareUrl}
END:VCARD`;
  }, [entity, shareUrl]);

  // Génération du QR Code haute résolution avec qrcode
  useEffect(() => {
    if (!isOpen || !qrContent) {
      setQrDataUrl('');
      return;
    }

    QRCode.toDataURL(qrContent, {
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url: string) => {
        setQrDataUrl(url);
      })
      .catch((err: unknown) => {
        console.error('Erreur génération QR Code:', err);
      });
  }, [isOpen, qrContent]);

  if (!isOpen || !entity) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback input
        const tempInput = document.createElement('input');
        tempInput.value = shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleNativeShare = async () => {
    const isGroup = entity.type === 'group';
    const title = isGroup
      ? `Rejoindre le canal TFM : ${entity.name}`
      : `Fiche Contact TFM : ${entity.name}`;
    const text = isGroup
      ? `Rejoignez notre canal opérationnel « ${entity.name} » sur l'application TFM Scheduler via ce lien sécurisé :`
      : `Voici le contact TFM de ${entity.name} (${entity.roleOrDesc} - ${entity.department || 'TFM'}). Scannez le QR Code ou cliquez :`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: `${text}\n${shareUrl}`,
          url: shareUrl,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2500);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback : copier directement dans le presse-papier
    handleCopyLink();
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `TFM_QR_${entity.type}_${entity.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isGroup = entity.type === 'group';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#18191D] border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-5 space-y-4 my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Entête avec badge type */}
        <div className="flex items-start justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                isGroup
                  ? 'bg-blue-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {isGroup ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                    isGroup
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isGroup ? 'Canal / Groupe TFM' : 'Fiche Contact Agent'}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate mt-0.5">
                {entity.name}
              </h3>
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

        {/* Détails sommaires de l'entité */}
        <div className="px-3 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-black/[0.04] dark:border-white/[0.06] text-xs space-y-1">
          <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {entity.roleOrDesc}
          </p>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
            <span>{entity.department || 'Tenke Fungurume Mining'}</span>
            {entity.matricule && <span>Mat. {entity.matricule}</span>}
          </div>
        </div>

        {/* Conteneur d'affichage du QR Code avec cadre blanc officiel scannable */}
        <div className="flex flex-col items-center justify-center space-y-2 py-1">
          <div className="relative p-3.5 bg-white rounded-2xl shadow-lg border border-black/10 flex items-center justify-center group">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code pour ${entity.name}`}
                className="w-48 h-48 object-contain rounded-lg"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-zinc-400 text-xs font-mono">
                Génération du QR Code...
              </div>
            )}

            {/* Badge TFM central décoratif */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white dark:bg-zinc-900 border-2 border-white flex items-center justify-center text-[10px] font-black tracking-tighter shadow-md">
                TFM
              </div>
            </div>
          </div>

          <p className="text-[11px] text-center text-zinc-500 dark:text-zinc-400">
            Scannez ce QR Code avec l'appareil photo du smartphone pour {isGroup ? 'rejoindre le canal' : 'enregistrer le contact'}.
          </p>
        </div>

        {/* Champ Lien d'invitation avec bouton Copier */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>{isGroup ? "Lien d'invitation au canal" : 'Lien direct de contact'}</span>
            {copied && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold normal-case flex items-center gap-1">
                <Check className="w-3 h-3" /> Lien copié !
              </span>
            )}
          </label>

          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-100/70 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06]">
            <div className="flex items-center gap-1.5 pl-2 min-w-0 flex-1 text-xs text-zinc-700 dark:text-zinc-300 font-mono truncate">
              <LinkIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">{shareUrl}</span>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié' : 'Copier'}</span>
            </button>
          </div>
        </div>

        {/* Boutons d'action : Partager (WhatsApp/SMS) et Télécharger QR */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95 shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{shareSuccess ? 'Partagé !' : 'Partager'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadQr}
            className="w-full py-2.5 px-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95 border border-black/[0.04] dark:border-white/[0.06]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Image QR</span>
          </button>
        </div>

        {/* Optionnel : Ouvrir la discussion directement */}
        {entity.channelId && onOpenChat && (
          <div className="pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                onOpenChat(entity.channelId!);
                onClose();
              }}
              className="w-full py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition"
            >
              Ouvrir directement la conversation →
            </button>
          </div>
        )}

        {/* Note sécurité */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Lien et QR Code sécurisés sur l'intranet TFM</span>
        </div>
      </div>
    </div>
  );
};
