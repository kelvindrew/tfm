/**
 * TFM SCHEDULER — Centre d'Annonces Professionnelles (Apple Minimal)
 * Conforme à la Section 2 du Master Prompt :
 * - Catégories : ADMIN, HSE, MAINT, NEWS, HOLIDAY
 * - Filtrage par catégorie et par état de lecture
 * - Tri chronologique (récent / ancien)
 * - Statut de lecture unifié avec compteur en temps réel
 * - Lecture détaillée avec pièces jointes et téléchargement sécurisé
 */

import React, { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  Check,
  CheckCheck,
  ChevronRight,
  Download,
  FileText,
  Filter,
  Paperclip,
  Radio,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Announcement, AnnouncementCategory } from '../types';

interface AnnouncementsViewProps {
  selectedAnnouncement: Announcement | null;
  onSelectAnnouncement: (announcement: Announcement | null) => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  selectedAnnouncement,
  onSelectAnnouncement,
}) => {
  const { announcements, markAnnouncementRead, markAllAnnouncementsRead } = useApp();

  const [activeCategory, setActiveCategory] = useState<'ALL' | AnnouncementCategory>('ALL');
  const [readFilter, setReadFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const categories: { key: 'ALL' | AnnouncementCategory; label: string }[] = [
    { key: 'ALL', label: 'Toutes' },
    { key: 'HSE', label: 'HSE Sécurité' },
    { key: 'ADMIN', label: 'Administration' },
    { key: 'MAINT', label: 'Maintenance' },
    { key: 'NEWS', label: 'Actualités' },
    { key: 'HOLIDAY', label: 'Jours Fériés' },
  ];

  // Filtrage et tri des annonces
  const filteredAndSortedAnnouncements = useMemo(() => {
    let result = announcements.filter((item) => {
      const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
      const matchesRead = readFilter === 'ALL' || (readFilter === 'UNREAD' && !item.isRead);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q);
      return matchesCategory && matchesRead && matchesSearch;
    });

    result.sort((a, b) => {
      const timeA = new Date(a.publishedAt).getTime();
      const timeB = new Date(b.publishedAt).getTime();
      return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [announcements, activeCategory, readFilter, searchQuery, sortOrder]);

  const unreadCount = announcements.filter((a) => !a.isRead).length;

  const handleOpenAnnouncement = (item: Announcement) => {
    markAnnouncementRead(item.id);
    onSelectAnnouncement(item);
  };

  const handleDownloadAttachment = (fileName: string) => {
    // Génération et téléchargement sécurisé d'un fichier texte/pdf factice pour l'agent
    const content = `TENKE FUNGURUME MINING (TFM)
Direction Générale · Sécurité & Opérations
Document Officiel : ${fileName}
Horodatage : ${new Date().toISOString()}
Agent Destinataire : TFM-4821
Usage strictement confidentiel et interne à la concession minière.`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(fileName);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="space-y-4 pb-24 pt-1">
      {/* 1. EN-TÊTE ÉPURÉ & COMPTEUR DE NON LUES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-0.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#18191D] dark:text-[#F4F4F5]">
              Communications TFM
            </h2>
            {unreadCount > 0 && (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114]">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Notes de service officielles, consignes HSE et opérations minières
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAnnouncementsRead}
            className="self-start sm:self-auto min-h-[38px] px-3.5 py-1.5 flex items-center gap-1.5 rounded-xl text-xs font-medium text-[#18191D] dark:text-[#F4F4F5] bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] active:scale-95 transition"
          >
            <CheckCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Tout marquer lu</span>
          </button>
        )}
      </div>

      {/* 2. RECHERCHE, FILTRES ET TRI */}
      <div className="space-y-2.5">
        {/* Champ de recherche */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" strokeWidth={1.5} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une consigne, un mot-clé ou un service..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white dark:bg-[#18191D] border border-black/[0.06] dark:border-white/[0.08] text-xs text-[#18191D] dark:text-[#F4F4F5] placeholder:text-[#71717A] dark:placeholder:text-[#A1A1AA] focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 min-h-[28px] min-w-[28px] flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18191D] dark:hover:text-[#F4F4F5]"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Barre de contrôle : État de lecture & Tri */}
        <div className="flex items-center justify-between gap-2 text-xs">
          {/* Filtre lecture */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setReadFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                readFilter === 'ALL'
                  ? 'bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114]'
                  : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#71717A] dark:text-[#A1A1AA]'
              }`}
            >
              Toutes ({announcements.length})
            </button>
            <button
              onClick={() => setReadFilter('UNREAD')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                readFilter === 'UNREAD'
                  ? 'bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114]'
                  : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#71717A] dark:text-[#A1A1AA]'
              }`}
            >
              Non lues ({unreadCount})
            </button>
          </div>

          {/* Tri chronologique */}
          <button
            onClick={() => setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18191D] dark:hover:text-[#F4F4F5] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] transition"
          >
            <ArrowDownUp className="w-3 h-3" strokeWidth={1.5} />
            <span>{sortOrder === 'DESC' ? 'Plus récentes' : 'Plus anciennes'}</span>
          </button>
        </div>

        {/* Catégories de communications (Boutons de filtre horizontaux) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 active:scale-95 ${
                  isActive
                    ? 'bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114] shadow-sm'
                    : 'bg-white dark:bg-[#18191D] border border-black/[0.06] dark:border-white/[0.08] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18191D] dark:hover:text-[#F4F4F5]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Message de succès téléchargement */}
      {downloadSuccess && (
        <div className="p-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-xs font-mono text-[#18191D] dark:text-[#F4F4F5] flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" strokeWidth={2} />
          <span>Document téléchargé avec succès : <strong>{downloadSuccess}</strong></span>
        </div>
      )}

      {/* 3. LISTE DES COMMUNICATIONS ÉPURÉE */}
      <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06] rounded-2xl bg-white dark:bg-[#18191D] border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
        {filteredAndSortedAnnouncements.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Radio className="w-7 h-7 mx-auto text-[#71717A] dark:text-[#A1A1AA] opacity-40" strokeWidth={1.5} />
            <p className="text-xs font-medium text-[#18191D] dark:text-[#F4F4F5]">
              Aucune communication trouvée
            </p>
            <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
              Aucune annonce ne correspond aux filtres ou à la recherche sélectionnée.
            </p>
            {(searchQuery || activeCategory !== 'ALL' || readFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('ALL');
                  setReadFilter('ALL');
                }}
                className="mt-2 text-xs font-semibold text-[#18191D] dark:text-[#F4F4F5] hover:underline"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedAnnouncements.map((item) => {
            const isUrgent = item.priority === 'URGENT' || item.priority === 'HIGH';

            return (
              <div
                key={item.id}
                onClick={() => handleOpenAnnouncement(item)}
                className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                    <span className="font-semibold text-[#18191D] dark:text-[#F4F4F5]">
                      {item.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">
                      {new Date(item.publishedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{item.department}</span>

                    {isUrgent && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[10px] uppercase font-semibold text-[#18191D] dark:text-[#F4F4F5] flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-amber-500/90" strokeWidth={1.5} />
                          <span>Prioritaire</span>
                        </span>
                      </>
                    )}

                    {!item.isRead && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-[#18191D] dark:bg-[#F4F4F5] ml-auto"
                        title="Non lu"
                      />
                    )}
                  </div>

                  <h3 className="text-xs sm:text-sm font-medium text-[#18191D] dark:text-[#F4F4F5] mt-1 truncate">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5 line-clamp-1">
                    {item.content}
                  </p>

                  {item.attachments && item.attachments.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#71717A] dark:text-[#A1A1AA] font-mono">
                      <Paperclip className="w-3 h-3" strokeWidth={1.5} />
                      <span>{item.attachments.length} document(s) joint(s)</span>
                    </div>
                  )}
                </div>

                <ChevronRight
                  className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] group-hover:text-[#18191D] dark:group-hover:text-[#F4F4F5] shrink-0 transition-colors"
                  strokeWidth={1.5}
                />
              </div>
            );
          })
        )}
      </div>

      {/* 4. MODALE DE LECTURE D'ANNONCE COMPLÈTE */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md">
          <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#18191D] border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-5 sm:p-6 space-y-4">
            {/* En-tête */}
            <div className="flex items-start justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  <span className="font-semibold text-[#18191D] dark:text-[#F4F4F5]">
                    {selectedAnnouncement.category}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">
                    {new Date(selectedAnnouncement.publishedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedAnnouncement.author}</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-[#18191D] dark:text-[#F4F4F5] mt-1 leading-snug">
                  {selectedAnnouncement.title}
                </h3>
              </div>

              <button
                onClick={() => onSelectAnnouncement(null)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18191D] dark:hover:text-[#F4F4F5]"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Contenu textuel */}
            <div className="text-xs sm:text-sm text-[#18191D] dark:text-[#F4F4F5] leading-relaxed whitespace-pre-line space-y-3 font-normal">
              <p>{selectedAnnouncement.content}</p>
            </div>

            {/* Pièces jointes téléchargeables */}
            {selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0 && (
              <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] space-y-2">
                <span className="text-xs font-semibold text-[#18191D] dark:text-[#F4F4F5] flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Documents & Consignes Associées
                </span>
                <div className="space-y-1.5">
                  {selectedAnnouncement.attachments.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-[#202227] border border-black/[0.06] dark:border-white/[0.08] text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] shrink-0" strokeWidth={1.5} />
                        <span className="font-medium text-[#18191D] dark:text-[#F4F4F5] truncate">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] shrink-0 font-mono">
                          ({file.size})
                        </span>
                      </div>
                      <button
                        onClick={() => handleDownloadAttachment(file.name)}
                        className="min-h-[30px] px-2.5 py-1 rounded-md bg-black/[0.04] dark:bg-white/[0.06] text-[#18191D] dark:text-[#F4F4F5] font-medium hover:bg-black/[0.08] dark:hover:bg-white/[0.1] flex items-center gap-1 shrink-0 active:scale-95 transition"
                      >
                        <Download className="w-3 h-3" strokeWidth={1.5} />
                        <span>Télécharger</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pied de modale */}
            <div className="pt-2 flex items-center justify-between border-t border-black/[0.06] dark:border-white/[0.08] text-xs text-[#71717A] dark:text-[#A1A1AA]">
              <span className="font-mono text-[11px]">Émis par : {selectedAnnouncement.department}</span>
              <button
                onClick={() => onSelectAnnouncement(null)}
                className="px-5 py-2 rounded-xl bg-[#18191D] dark:bg-[#F4F4F5] text-white dark:text-[#101114] text-xs font-semibold hover:opacity-90 transition active:scale-95"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
