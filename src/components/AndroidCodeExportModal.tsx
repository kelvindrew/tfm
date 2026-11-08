/**
 * TFM SCHEDULER — Visualiseur & Exportateur de Code Natif Android
 * Refonte visuelle complète : Monochromatique, Minimaliste.
 */

import React, { useState } from 'react';
import {
  Check,
  Copy,
  FileCode,
  Smartphone,
  X,
} from 'lucide-react';
import { ANDROID_PROJECT_FILES } from '../engine/nativeAndroidSource';

interface AndroidCodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidCodeExportModal: React.FC<AndroidCodeExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentFile = ANDROID_PROJECT_FILES[selectedFileIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-white dark:bg-[#18191D] border border-black/[0.08] dark:border-white/[0.1] shadow-2xl flex flex-col">
        {/* En-tête */}
        <div className="p-4 sm:p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-[#18191D] dark:text-[#F4F4F5]">
              <Smartphone className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#18191D] dark:text-[#F4F4F5]">
                Architecture Android Studio
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Code source Kotlin pur, Jetpack Compose Material 3 et tests JUnit
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

        {/* Sélecteur de fichiers */}
        <div className="px-4 py-2 border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-black/20 flex items-center gap-1.5 overflow-x-auto">
          {ANDROID_PROJECT_FILES.map((file, idx) => {
            const isSelected = idx === selectedFileIdx;
            const fileName = file.path.split('/').pop();

            return (
              <button
                key={file.path}
                onClick={() => setSelectedFileIdx(idx)}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114]'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18191D] dark:hover:text-[#F4F4F5]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>{fileName}</span>
              </button>
            );
          })}
        </div>

        {/* Détails du fichier & Bouton Copier */}
        <div className="px-4 py-2 bg-black/[0.02] dark:bg-black/30 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs">
          <div>
            <span className="font-mono text-[#71717A] dark:text-[#A1A1AA]">
              {currentFile.path}
            </span>
            <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
              {currentFile.description}
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="min-h-[32px] px-3 py-1 rounded-lg bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114] text-xs font-medium flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Copié</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Copier</span>
              </>
            )}
          </button>
        </div>

        {/* Visionneuse de code */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#0D0E12] text-[#D1D5DB] font-mono text-xs leading-relaxed">
          <pre className="whitespace-pre overflow-x-auto">{currentFile.content}</pre>
        </div>

        {/* Pied de page */}
        <div className="p-3.5 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
          <span>Target SDK 35 · Room · Jetpack Compose</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[#18191D] dark:text-[#F4F4F5] font-medium hover:bg-black/[0.08]"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
