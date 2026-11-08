/**
 * TFM SCHEDULER — Messagerie Opérationnelle Moderne (Apple Minimal & Industrial Design)
 * 
 * Fonctionnalités & Résolution des bugs :
 * 1. Hauteur adaptative fluide pour smartphones Android (évite le rognage et le double scrollbar)
 * 2. Défilement tactile fluide : le défilement n'active plus par erreur le menu de réaction par appui long
 * 3. Partage de Contact & Groupe par Lien et Code QR scannable dynamique (ShareQrModal)
 * 4. Scanner et Rejoindre un canal ou un contact par QR Code ou lien d'invitation (JoinByQrModal)
 * 5. Mon QR Code de contact pour l'agent connecté
 * 6. Gestion propre des réponses simulées et indicateurs de frappe
 * 7. Envoi de texte, notes vocales, photos de terrain avec Lightbox et documents techniques
 * 8. Mode Portrait (1 panneau) et Paysage (split-screen 2 colonnes)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Camera,
  Check,
  CheckCheck,
  Clock,
  Columns,
  Download,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Info,
  Link as LinkIcon,
  Maximize2,
  Mic,
  Pause,
  PhoneCall,
  Play,
  Plus,
  QrCode,
  Radio,
  Search,
  Send,
  Share2,
  Shield,
  ShieldAlert,
  Smartphone,
  Smile,
  User,
  UserCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Channel, Message } from '../types';
import { ShareEntity, ShareQrModal } from './ShareQrModal';
import { JoinByQrModal } from './JoinByQrModal';

// Émojis de réactions rapides style iOS / WhatsApp
const PRIMARY_REACTION_EMOJIS = [
  { emoji: '👍', label: 'J\'aime' },
  { emoji: '❤️', label: 'Cœur' },
  { emoji: '🔥', label: 'Super' },
  { emoji: '✅', label: 'Validé' },
  { emoji: '⚠️', label: 'Vigilance HSE' },
  { emoji: '😂', label: 'Rire' },
  { emoji: '🙏', label: 'Merci' },
];

// Émojis complémentaires de quart et opérations de site
const EXTENDED_REACTION_EMOJIS = [
  { emoji: '⚒️', label: 'Opération' },
  { emoji: '👌', label: 'Parfait' },
  { emoji: '💡', label: 'Idée' },
  { emoji: '👏', label: 'Bravo' },
  { emoji: '👀', label: 'Surveillance' },
  { emoji: '💪', label: 'Force' },
  { emoji: '⚡', label: 'Urgent' },
  { emoji: '🎯', label: 'Cible atteinte' },
];

export const MessagingView: React.FC = () => {
  const {
    channels,
    activeChannelId,
    setActiveChannelId,
    messages,
    sendMessage,
    toggleMessageReaction,
    archiveChannel,
    unarchiveChannel,
    toggleArchiveChannel,
    joinOrCreateChannel,
    user,
    isOnline,
    pendingSyncCount,
    triggerManualSync,
    orientation,
    setOrientation,
  } = useApp();

  // Navigation mobile : liste des conversations vs chat ouvert
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [inputContent, setInputContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'teams' | 'hse' | 'direct' | 'archived'>('all');
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Modales de Partage et de Scan QR Code / Liens
  const [shareEntity, setShareEntity] = useState<ShareEntity | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // État de réaction par appui long sur bulle de message
  const [reactionBarMsgId, setReactionBarMsgId] = useState<string | null>(null);
  const [isExtendedEmojiOpen, setIsExtendedEmojiOpen] = useState(false);
  const [pressingMsgId, setPressingMsgId] = useState<string | null>(null);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isTouchScrollingRef = useRef(false);

  // Gestion du toucher tactile avec détection de mouvement pour éviter tout conflit avec le scroll
  const handleTouchStart = (msgId: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    isTouchScrollingRef.current = false;
    setPressingMsgId(msgId);

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    longPressTimerRef.current = setTimeout(() => {
      // Déclencher uniquement si l'utilisateur n'est pas en train de faire défiler l'écran
      if (!isTouchScrollingRef.current) {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(35);
          } catch {
            // Ignoré si permission non accordée
          }
        }
        setReactionBarMsgId(msgId);
        setIsExtendedEmojiOpen(false);
        setPressingMsgId(null);
      }
    }, 480);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current) return;
    const touch = e.touches[0];
    const diffX = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const diffY = Math.abs(touch.clientY - touchStartPosRef.current.y);

    // Si le doigt bouge de plus de 8 pixels, c'est un défilement -> annuler l'appui long
    if (diffX > 8 || diffY > 8) {
      isTouchScrollingRef.current = true;
      setPressingMsgId(null);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    setPressingMsgId(null);
    touchStartPosRef.current = null;
    isTouchScrollingRef.current = false;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // État d'insertion d'images & appareil photo mobile
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<{
    url: string;
    caption?: string;
    sender?: string;
  } | null>(null);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImagePreview(reader.result);
        setSelectedImageFile(file);
        setShowAttachMenu(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearImagePreview = () => {
    setSelectedImagePreview(null);
    setSelectedImageFile(null);
  };

  // État d'enregistrement vocal
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // État de lecture vocale
  const [playingVoiceMsgId, setPlayingVoiceMsgId] = useState<string | null>(null);

  // Alerte radio walkie-talkie
  const [radioBannerText, setRadioBannerText] = useState<string | null>(null);

  // Indicateur de frappe simulé 'En train d'écrire...'
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [typingPartnerName, setTypingPartnerName] = useState<string>('Ilunga Mwamba');
  const partnerReplyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const activeChannel: Channel =
    channels.find((c) => c.id === activeChannelId) || channels[0] || {
      id: 'ch-team-a',
      name: 'Équipe A — SX-EW (Production)',
      description: 'Canal opérationnel',
      iconName: 'Users',
      unreadCount: 0,
      isGroup: true,
    };

  // Auto-scroll vers le dernier message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChannelId, mobileView]);

  // Timer enregistrement vocal
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecordingVoice) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecordingVoice]);

  // Messages du canal actif triés par chronologie
  const currentChannelMessages = useMemo(() => {
    return messages
      .filter((m) => m.channelId === activeChannelId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, activeChannelId]);

  // Messages affichés (filtrés si recherche dans la conversation)
  const displayedMessages = useMemo(() => {
    const q = (inChatSearchQuery || (showInChatSearch ? '' : searchQuery)).trim().toLowerCase();
    if (!q) return currentChannelMessages;
    return currentChannelMessages.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q) ||
        m.senderRole.toLowerCase().includes(q) ||
        (m.attachmentName && m.attachmentName.toLowerCase().includes(q))
    );
  }, [currentChannelMessages, searchQuery, inChatSearchQuery, showInChatSearch]);

  // Agents en service aujourd'hui
  const onlineAgents = useMemo(() => [
    {
      id: 'agent-1',
      name: 'Ilunga Mwamba',
      shortName: 'Ilunga M.',
      role: 'Superviseur de Quart',
      department: 'Extraction SX-EW',
      matricule: 'TFM-84920',
      initials: 'IM',
      channelId: 'ch-sup-direct',
    },
    {
      id: 'agent-2',
      name: 'Dr. Kabange Numbi',
      shortName: 'Dr. Kabange',
      role: 'Ing. Métallurgiste',
      department: 'Procédés Chimiques',
      matricule: 'TFM-71044',
      initials: 'KN',
      channelId: 'ch-team-a',
    },
    {
      id: 'agent-3',
      name: 'Kalonji Tshilumba',
      shortName: 'Kalonji T.',
      role: 'Instrumentation B',
      department: 'Maintenance Industrielle',
      matricule: 'TFM-65129',
      initials: 'KT',
      channelId: 'ch-maint-plant',
    },
    {
      id: 'agent-4',
      name: 'Direction HSE TFM',
      shortName: 'Poste HSE',
      role: 'Vigilance Mine & Usine',
      department: 'Sécurité & Environnement',
      matricule: 'TFM-HSE-01',
      initials: 'HS',
      channelId: 'ch-hse-alert',
    },
    {
      id: 'agent-5',
      name: user.fullName || 'Patrick Mukendi',
      shortName: 'Moi (Connecté)',
      role: user.role || 'Opérateur SX-EW',
      department: 'Usine Hydrométallurgie',
      matricule: user.matricule || 'TFM-58219',
      initials: (user.fullName || 'PM')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      channelId: 'ch-team-a',
    },
  ], [user]);

  // Nombre de canaux archivés
  const archivedChannelsCount = useMemo(() => {
    return channels.filter((c) => c.isArchived).length;
  }, [channels]);

  // Canaux filtrés selon la catégorie ET recherche
  const filteredChannels = useMemo(() => {
    return channels.filter((chan) => {
      if (categoryFilter === 'archived') {
        if (!chan.isArchived) return false;
      } else {
        if (chan.isArchived) return false;
      }

      if (categoryFilter === 'teams' && (!chan.isGroup || !chan.id.includes('team'))) return false;
      if (categoryFilter === 'hse' && !chan.id.includes('hse')) return false;
      if (categoryFilter === 'direct' && chan.isGroup && !chan.id.includes('sup')) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      if (chan.name.toLowerCase().includes(q) || chan.description.toLowerCase().includes(q)) {
        return true;
      }

      const chanMsgs = messages.filter((m) => m.channelId === chan.id);
      return chanMsgs.some(
        (m) =>
          m.content.toLowerCase().includes(q) ||
          m.senderName.toLowerCase().includes(q) ||
          m.senderRole.toLowerCase().includes(q) ||
          (m.attachmentName && m.attachmentName.toLowerCase().includes(q))
      );
    });
  }, [channels, categoryFilter, searchQuery, messages]);

  const handleSelectChannel = (channelId: string) => {
    setActiveChannelId(channelId);
    if (orientation === 'portrait') {
      setMobileView('chat');
    }
    setShowAttachMenu(false);
  };

  const triggerSimulatedPartnerReply = (targetChannelId: string) => {
    if (partnerReplyTimeoutRef.current) {
      clearTimeout(partnerReplyTimeoutRef.current);
    }

    let responderName = 'Ilunga Mwamba';
    let responseText = 'Bien reçu. Consigne enregistrée sur le carnet de quart usine.';

    if (targetChannelId === 'ch-team-a') {
      responderName = 'Kalonji Tshilumba';
      responseText = 'Reçu 5/5. Paramètres nominaux vérifiés sur la ligne d\'extraction.';
    } else if (targetChannelId === 'ch-hse-alert') {
      responderName = 'Dr. Kabeya Mutombo';
      responseText = 'Signalement pris en compte par la patrouille de sécurité du secteur.';
    } else if (targetChannelId === 'ch-maint-plant') {
      responderName = 'Éric Kazadi';
      responseText = 'Intervention programmée sur la ligne lors du prochain arrêt de quart.';
    } else if (targetChannelId === 'ch-rh-help') {
      responderName = 'Support RH & Planning';
      responseText = 'Votre demande a été enregistrée auprès de l\'administration du personnel.';
    }

    setTypingPartnerName(responderName);

    partnerReplyTimeoutRef.current = setTimeout(() => {
      setIsPartnerTyping(true);

      partnerReplyTimeoutRef.current = setTimeout(() => {
        setIsPartnerTyping(false);
        sendMessage(targetChannelId, responseText, { messageType: 'text' });
      }, 1600);
    }, 600);
  };

  const handleSendTextMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim() && !selectedImagePreview) return;

    if (selectedImagePreview) {
      const caption = inputContent.trim();
      sendMessage(activeChannelId, caption || 'Photo de terrain', {
        messageType: 'image',
        imageUrl: selectedImagePreview,
        imageCaption: caption || undefined,
        attachmentName: selectedImageFile?.name || 'Photo_Mobile_TFM.jpg',
        attachmentSize: selectedImageFile
          ? `${Math.round(selectedImageFile.size / 1024)} Ko`
          : '950 Ko',
      });
      setSelectedImagePreview(null);
      setSelectedImageFile(null);
      setInputContent('');
      triggerSimulatedPartnerReply(activeChannelId);
      return;
    }

    sendMessage(activeChannelId, inputContent.trim(), { messageType: 'text' });
    setInputContent('');
    triggerSimulatedPartnerReply(activeChannelId);
  };

  const handleSendQuickChip = (text: string, type: 'text' | 'handover' = 'text') => {
    sendMessage(activeChannelId, text, { messageType: type });
    triggerSimulatedPartnerReply(activeChannelId);
  };

  const handleSendVoiceNote = () => {
    setIsRecordingVoice(false);
    const durationStr = `0:${recordingSeconds.toString().padStart(2, '0')}`;
    sendMessage(
      activeChannelId,
      'Note vocale de relève opérationnelle',
      {
        messageType: 'voice',
        voiceDuration: recordingSeconds > 0 ? durationStr : '0:08',
      }
    );
  };

  const handleSendAttachment = (docName: string, size: string) => {
    setShowAttachMenu(false);
    sendMessage(
      activeChannelId,
      `Document officiel transmis : ${docName}`,
      {
        messageType: 'attachment',
        attachmentName: docName,
        attachmentSize: size,
      }
    );
  };

  const toggleVoicePlayback = (msgId: string) => {
    if (playingVoiceMsgId === msgId) {
      setPlayingVoiceMsgId(null);
    } else {
      setPlayingVoiceMsgId(msgId);
      setTimeout(() => {
        setPlayingVoiceMsgId((curr) => (curr === msgId ? null : curr));
      }, 5000);
    }
  };

  const handleRadioCall = () => {
    setRadioBannerText(
      `Liaison Radio VHF TFM enclenchée · Canal ${activeChannel.name} · Fréquence sécurisée 162.450 MHz`
    );
    setTimeout(() => setRadioBannerText(null), 5500);
  };

  // Ouverture de la modale de partage pour le canal actif
  const handleShareCurrentGroup = () => {
    setShareEntity({
      type: 'group',
      id: activeChannel.id,
      name: activeChannel.name,
      roleOrDesc: activeChannel.description,
      channelId: activeChannel.id,
    });
    setIsShareModalOpen(true);
  };

  // Ouverture de la modale de partage pour un agent spécifique
  const handleShareAgentContact = (agent: typeof onlineAgents[0]) => {
    setShareEntity({
      type: 'contact',
      id: agent.id,
      name: agent.name,
      roleOrDesc: agent.role,
      department: agent.department,
      matricule: agent.matricule,
      channelId: agent.channelId,
    });
    setIsShareModalOpen(true);
  };

  // Partager mon propre contact
  const handleShareMyContact = () => {
    setShareEntity({
      type: 'contact',
      id: user.id || 'usr-me',
      name: user.fullName || 'Patrick Mukendi',
      roleOrDesc: user.role || 'Opérateur SX-EW',
      department: 'Extraction Usine TFM',
      matricule: user.matricule || 'TFM-58219',
      channelId: 'ch-team-a',
    });
    setIsShareModalOpen(true);
  };

  // Rejoindre un canal ou ouvrir contact après scan
  const handleJoinSuccess = (target: { type: 'group' | 'contact'; id: string; name: string }) => {
    joinOrCreateChannel({
      id: target.id,
      name: target.name,
      isGroup: target.type === 'group',
    });
    if (orientation === 'portrait') {
      setMobileView('chat');
    }
  };

  const getChannelIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldAlert':
        return ShieldAlert;
      case 'HelpCircle':
        return HelpCircle;
      case 'Wrench':
        return Wrench;
      case 'Archive':
        return Archive;
      case 'UserCheck':
        return UserCheck;
      default:
        return Users;
    }
  };

  // Membres détaillés du groupe
  const channelMembers = useMemo(() => {
    if (activeChannelId === 'ch-team-a') {
      return [
        { name: 'Ilunga Mwamba', role: 'Superviseur de Quart', team: 'Poste Jour 06h-18h', status: 'En poste' },
        { name: user.fullName, role: user.role, team: user.rotationTeam, status: 'Moi (Connecté)' },
        { name: 'Kalonji Tshilumba', role: 'Technicien Instrumentation', team: 'Poste Jour', status: 'En poste' },
        { name: 'Dr. Kabange Numbi', role: 'Ingénieur Métallurgiste', team: 'Astreinte SX-EW', status: 'Disponible' },
      ];
    } else if (activeChannelId === 'ch-sup-direct') {
      return [
        { name: 'Ilunga Mwamba', role: 'Superviseur de Quart Usine', team: 'Poste Jour', status: 'En ligne' },
        { name: user.fullName, role: user.role, team: user.rotationTeam, status: 'Moi (Connecté)' },
      ];
    } else if (activeChannelId === 'ch-hse-alert') {
      return [
        { name: 'Direction HSE TFM', role: 'Coordinateur Sécurité Mine', team: 'Permanence 24/7', status: 'Actif' },
        { name: 'Chef de Quart Fwaire', role: 'Superviseur Mine', team: 'Poste Jour', status: 'En poste' },
        { name: user.fullName, role: user.role, team: user.rotationTeam, status: 'Membre accrédité' },
      ];
    } else {
      return [
        { name: 'Assistance RH & Paie', role: 'Ressources Humaines', team: 'Bureau Lubumbashi / TFM', status: '08h - 17h' },
        { name: user.fullName, role: user.role, team: user.rotationTeam, status: 'Agent demandeur' },
      ];
    }
  }, [activeChannelId, user]);

  // Sélecteur d'orientation segmented control
  const renderOrientationSegmentedControl = () => (
    <div className="inline-flex items-center p-0.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] shrink-0">
      <button
        type="button"
        onClick={() => setOrientation('portrait')}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
          orientation === 'portrait'
            ? 'bg-white dark:bg-[#202227] text-zinc-900 dark:text-white shadow-2xs font-semibold'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
        title="Mode smartphone 1 colonne"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden xs:inline">Portrait</span>
      </button>

      <button
        type="button"
        onClick={() => setOrientation('landscape')}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
          orientation === 'landscape'
            ? 'bg-white dark:bg-[#202227] text-zinc-900 dark:text-white shadow-2xs font-semibold'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
        title="Mode double panneau split-screen"
      >
        <Columns className="w-3.5 h-3.5" />
        <span className="hidden xs:inline">Paysage</span>
      </button>
    </div>
  );

  // =========================================================================
  // PANNEAU 1 : LISTE DES CONVERSATIONS
  // =========================================================================
  const renderConversationList = () => (
    <div className="flex flex-col h-full bg-white dark:bg-[#151619] overflow-hidden select-none">
      {/* 1. En-tête */}
      <div className="p-3 sm:p-3.5 border-b border-black/[0.04] dark:border-white/[0.06] space-y-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Messages
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>{isOnline ? 'Réseau opérationnel TFM' : 'Mode hors-ligne'}</span>
              {pendingSyncCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    onClick={triggerManualSync}
                    className="text-amber-600 dark:text-amber-400 font-mono hover:underline"
                  >
                    {pendingSyncCount} en attente
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Bouton Scanner / Rejoindre via QR ou lien */}
            <button
              type="button"
              onClick={() => setIsJoinModalOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-semibold flex items-center gap-1.5 transition active:scale-95 border border-black/[0.04] dark:border-white/[0.06] shadow-2xs"
              title="Scanner un QR Code ou coller un lien pour rejoindre un canal / contact"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Scanner / Rejoindre</span>
            </button>

            {/* Sélecteur d'orientation */}
            {renderOrientationSegmentedControl()}
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="space-y-1.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher (broyeur, relève, Ilunga, HSE...)"
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-zinc-100/70 dark:bg-zinc-800/50 border border-black/[0.04] dark:border-white/[0.06] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 rounded-full"
                title="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Rangée : Agents en service avec QR Code direct */}
        <div className="pt-0.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
              Agents en service · Poste Jour
            </span>
            {/* Bouton Mon QR Code de contact */}
            <button
              type="button"
              onClick={handleShareMyContact}
              className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
              title="Afficher mon QR Code de contact pour mes collègues"
            >
              <QrCode className="w-3 h-3" />
              <span>Mon QR Code</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {onlineAgents.map((agent) => (
              <div
                key={agent.id}
                className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none relative"
              >
                <button
                  type="button"
                  onClick={() => handleSelectChannel(agent.channelId)}
                  className="relative focus:outline-none"
                  title={`${agent.name} (${agent.role}) - Cliquer pour ouvrir le chat`}
                >
                  <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-black/10 dark:border-white/10 font-semibold text-xs flex items-center justify-center transition group-hover:scale-105 group-hover:border-zinc-400 dark:group-hover:border-zinc-500 shadow-2xs font-mono">
                    {agent.initials}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#151619]" />
                </button>

                <div className="flex items-center gap-1">
                  <span
                    onClick={() => handleSelectChannel(agent.channelId)}
                    className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[50px] text-center cursor-pointer hover:underline"
                  >
                    {agent.shortName}
                  </span>
                  {/* Bouton miniature QR Code / Partage fiche de l'agent */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareAgentContact(agent);
                    }}
                    className="text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                    title={`Partager la fiche contact & QR Code de ${agent.name}`}
                  >
                    <QrCode className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filtres de catégories */}
        <div className="p-0.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/40 border border-black/[0.04] dark:border-white/[0.06] flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'teams', label: 'Équipes' },
            { id: 'hse', label: 'HSE' },
            { id: 'direct', label: 'Directs' },
            { id: 'archived', label: `Archivées (${archivedChannelsCount})` },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-medium transition text-center whitespace-nowrap ${
                categoryFilter === cat.id
                  ? 'bg-white dark:bg-[#202227] text-zinc-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Liste scrollable des conversations */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-0.5 divide-y divide-black/[0.02] dark:divide-white/[0.02]">
        {/* Dossier 'Conversations archivées' */}
        {archivedChannelsCount > 0 && categoryFilter !== 'archived' && (
          <button
            type="button"
            onClick={() => setCategoryFilter('archived')}
            className="w-full p-2.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/60 border border-black/[0.03] dark:border-white/[0.05] flex items-center justify-between text-left transition group select-none mb-1 shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-200/70 dark:bg-zinc-700/60 flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:scale-105 transition">
                <Archive className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                  Conversations archivées
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
                  {archivedChannelsCount} discussion{archivedChannelsCount > 1 ? 's' : ''} mise{archivedChannelsCount > 1 ? 's' : ''} de côté
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                {archivedChannelsCount}
              </span>
            </div>
          </button>
        )}

        {/* Bannière mode Archives */}
        {categoryFilter === 'archived' && (
          <div className="p-2.5 mb-1 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Archive className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="min-w-0 text-[11px]">
                <strong className="block font-semibold">Boîte des archives ({archivedChannelsCount})</strong>
                <span className="text-zinc-500 dark:text-zinc-400">
                  L'historique complet est préservé.
                </span>
              </div>
            </div>
            <button
              onClick={() => setCategoryFilter('all')}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 shadow-2xs hover:bg-zinc-100 dark:hover:bg-zinc-700 shrink-0"
            >
              Retour actif
            </button>
          </div>
        )}

        {filteredChannels.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {searchQuery.trim()
                ? `Aucune conversation trouvée pour « ${searchQuery} »`
                : 'Aucun canal dans cette catégorie'}
            </p>
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Réinitialiser la recherche
              </button>
            )}
          </div>
        ) : (
          filteredChannels.map((chan) => {
            const Icon = getChannelIcon(chan.iconName);
            const isSelected = chan.id === activeChannelId;
            const chanMsgs = messages.filter((m) => m.channelId === chan.id);
            const lastMsg = chanMsgs[chanMsgs.length - 1];

            return (
              <div
                key={chan.id}
                onClick={() => handleSelectChannel(chan.id)}
                className={`w-full p-2.5 sm:p-3 rounded-2xl flex items-center gap-3 text-left transition cursor-pointer select-none ${
                  isSelected && orientation === 'landscape'
                    ? 'bg-zinc-100 dark:bg-zinc-800/70 shadow-2xs'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                }`}
              >
                {/* Avatar du canal */}
                <div className="relative shrink-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition border ${
                      isSelected && orientation === 'landscape'
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-black/[0.04] dark:border-white/[0.06]'
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  {chan.isGroup && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#151619]" />
                  )}
                </div>

                {/* Métadonnées de la conversation */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {chan.name}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                        {lastMsg
                          ? new Date(lastMsg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '14:30'}
                      </span>
                      {/* Bouton Partager QR Code du canal */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareEntity({
                            type: chan.isGroup ? 'group' : 'contact',
                            id: chan.id,
                            name: chan.name,
                            roleOrDesc: chan.description,
                            channelId: chan.id,
                          });
                          setIsShareModalOpen(true);
                        }}
                        title="Partager ce canal par Code QR et lien"
                        className="p-1 rounded-lg text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate leading-tight">
                      {lastMsg ? (
                        <>
                          {lastMsg.senderId === user.id && (
                            <span className="font-medium text-zinc-800 dark:text-zinc-200 mr-1">
                              Vous:
                            </span>
                          )}
                          {lastMsg.messageType === 'voice' ? (
                            <span className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                              <Mic className="w-3 h-3 text-emerald-500" />
                              <span>Note vocale ({lastMsg.voiceDuration || '0:12'})</span>
                            </span>
                          ) : lastMsg.messageType === 'attachment' ? (
                            <span className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                              <FileText className="w-3 h-3 text-blue-500" />
                              <span>{lastMsg.attachmentName || 'Rapport PDF'}</span>
                            </span>
                          ) : lastMsg.messageType === 'handover' ? (
                            <span className="inline-flex items-center gap-1 font-medium text-zinc-800 dark:text-zinc-200">
                              <CheckCheck className="w-3 h-3 text-emerald-500" />
                              <span>Relève officielle</span>
                            </span>
                          ) : (
                            lastMsg.content
                          )}
                        </>
                      ) : (
                        chan.description
                      )}
                    </p>

                    {chan.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[9px] font-mono font-bold flex items-center justify-center shrink-0">
                        {chan.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // =========================================================================
  // PANNEAU 2 : SALLE DE DISCUSSION ACTIVE
  // =========================================================================
  const renderActiveChat = () => (
    <div className="flex flex-col h-full bg-[#F6F7F9] dark:bg-[#0D0E11] overflow-hidden select-none">
      {/* 1. Barre supérieure de conversation */}
      <div className="p-2.5 sm:p-3 border-b border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-[#151619] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {/* Bouton Retour en mode Portrait */}
          {orientation === 'portrait' && (
            <button
              onClick={() => setMobileView('list')}
              className="p-1.5 -ml-1 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition flex items-center gap-1 shrink-0"
              aria-label="Retour aux conversations"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-semibold hidden xs:inline">Retour</span>
            </button>
          )}

          {/* Squircle discret avec initiales */}
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center font-bold text-xs font-mono shadow-2xs">
              {activeChannel.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#151619]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                {activeChannel.name}
              </h3>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            </div>
            <p className="text-[10px] truncate">
              {isPartnerTyping ? (
                <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold animate-pulse">
                  <span>{typingPartnerName} est en train d'écrire...</span>
                </span>
              ) : activeChannel.isGroup ? (
                <span className="text-zinc-500 dark:text-zinc-400">
                  {channelMembers.length} agents · Relève TFM active
                </span>
              ) : (
                <span className="text-zinc-500 dark:text-zinc-400">
                  Ligne directe opérationnelle
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Actions d'en-tête (Partage QR Code & Lien, Recherche, Appel VHF, Infos) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* BOUTON OFFICIEL DE PARTAGE QR CODE & LIEN D'INVITATION (Demande utilisateur) */}
          <button
            type="button"
            onClick={handleShareCurrentGroup}
            title={activeChannel.isGroup ? "Inviter dans ce groupe par Code QR & Lien" : "Partager ce contact par Code QR & Lien"}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-2xs border border-blue-200/50 dark:border-blue-800/40"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inviter (QR & Lien)</span>
          </button>

          {/* Recherche dans cette conversation */}
          <button
            onClick={() => {
              setShowInChatSearch((prev) => !prev);
              if (showInChatSearch) setInChatSearchQuery('');
            }}
            title="Rechercher dans cette conversation"
            className={`p-1.5 rounded-xl transition ${
              showInChatSearch || inChatSearchQuery
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
            }`}
          >
            <Search className="w-4 h-4" strokeWidth={1.5} />
          </button>

          {/* Appel Radio Talkie-walkie VHF */}
          <button
            onClick={handleRadioCall}
            title="Lancer un appel radio VHF de quart"
            className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
          >
            <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
          </button>

          {/* Informations groupe et membres */}
          <button
            onClick={() => setShowGroupInfo(true)}
            title="Détails du groupe et membres"
            className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
          >
            <Info className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Barre de recherche interne au chat */}
      {showInChatSearch && (
        <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900/90 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={inChatSearchQuery}
              onChange={(e) => setInChatSearchQuery(e.target.value)}
              placeholder="Rechercher par mot-clé ou auteur..."
              className="w-full pl-8 pr-7 py-1 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
            {inChatSearchQuery && (
              <button
                type="button"
                onClick={() => setInChatSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-[11px] font-mono text-zinc-500 shrink-0">
            {displayedMessages.length} msg{displayedMessages.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => {
              setShowInChatSearch(false);
              setInChatSearchQuery('');
            }}
            className="text-xs text-zinc-500 hover:text-zinc-900 px-1 py-0.5"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Bandeau d'état 'En train d'écrire...' */}
      {isPartnerTyping && (
        <div className="px-3.5 py-1.5 bg-blue-50/90 dark:bg-blue-950/60 border-b border-blue-200/50 dark:border-blue-900/30 flex items-center justify-between gap-3 text-xs text-blue-700 dark:text-blue-300 animate-in fade-in shrink-0">
          <span className="text-[11px] font-medium truncate">
            <strong className="font-semibold text-blue-900 dark:text-blue-100">{typingPartnerName}</strong> est en train d'écrire...
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce" />
          </div>
        </div>
      )}

      {/* 2. Zone des messages (Défilement fluide, gestion tactile sans bug) */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 min-h-0 relative"
      >
        {/* Backdrop pour fermer la barre de réaction */}
        {reactionBarMsgId && (
          <div
            className="fixed inset-0 z-30 bg-black/5 dark:bg-black/20"
            onClick={() => {
              setReactionBarMsgId(null);
              setIsExtendedEmojiOpen(false);
            }}
          />
        )}

        <div className="flex items-center justify-center my-1">
          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 bg-black/[0.03] dark:bg-white/[0.04] px-3 py-0.5 rounded-full">
            Aujourd'hui · Quart TFM
          </span>
        </div>

        {displayedMessages.map((msg) => {
          const isMe = msg.senderId === user.id;
          const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
          const isReactionBarOpen = reactionBarMsgId === msg.id;
          const isBeingPressed = pressingMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'} mb-1`}
            >
              {/* Expéditeur */}
              {!isMe && (
                <div className="flex items-center gap-1.5 mb-0.5 px-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {msg.senderName}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    {msg.senderRole}
                  </span>
                </div>
              )}

              {/* Bulle de message */}
              <div className="relative max-w-[85%] sm:max-w-[72%]">
                {/* Dock de réactions flottant */}
                {isReactionBarOpen && (
                  <div
                    className={`absolute -top-12 ${
                      isMe ? 'right-0 origin-bottom-right' : 'left-0 origin-bottom-left'
                    } z-40 flex items-center gap-1 px-2 py-1.5 rounded-full bg-white/95 dark:bg-[#1E1E22]/95 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl animate-in zoom-in-90 duration-150 select-none`}
                  >
                    {PRIMARY_REACTION_EMOJIS.map((item) => {
                      const userHasReacted = msg.userReactions?.[item.emoji]?.includes(user.id);
                      return (
                        <button
                          key={item.emoji}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMessageReaction(msg.id, item.emoji);
                            setReactionBarMsgId(null);
                            setIsExtendedEmojiOpen(false);
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-lg hover:scale-125 transition ${
                            userHasReacted ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500/60' : 'hover:bg-black/5 dark:hover:bg-white/10'
                          }`}
                          title={item.label}
                        >
                          <span>{item.emoji}</span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExtendedEmojiOpen(!isExtendedEmojiOpen);
                      }}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10"
                      title="Plus d'émojis"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    {isExtendedEmojiOpen && (
                      <div
                        className={`absolute bottom-full mb-2 ${
                          isMe ? 'right-0' : 'left-0'
                        } p-2 rounded-2xl bg-white/95 dark:bg-[#1E1E22]/95 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl grid grid-cols-4 gap-1 z-50`}
                      >
                        {EXTENDED_REACTION_EMOJIS.map((item) => (
                          <button
                            key={item.emoji}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMessageReaction(msg.id, item.emoji);
                              setReactionBarMsgId(null);
                              setIsExtendedEmojiOpen(false);
                            }}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-lg hover:scale-125 transition"
                            title={item.label}
                          >
                            <span>{item.emoji}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Bulle avec gestion tactile sécurisée contre les faux déclenchements de scroll */}
                <div
                  onTouchStart={(e) => handleTouchStart(msg.id, e)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setReactionBarMsgId(msg.id);
                  }}
                  className={`relative p-2.5 sm:p-3 text-xs sm:text-[13px] leading-relaxed transition-all shadow-xs select-none ${
                    isMe
                      ? 'rounded-[20px] rounded-br-[4px] bg-[#007AFF] text-white shadow-sm'
                      : 'rounded-[20px] rounded-bl-[4px] bg-[#E9E9EB] text-zinc-950 dark:bg-[#26252A] dark:text-[#F4F4F5] border border-black/[0.02] dark:border-white/[0.04]'
                  } ${isBeingPressed ? 'scale-[0.98]' : ''}`}
                >
                  {/* TYPE NOTE VOCALE */}
                  {msg.messageType === 'voice' ? (
                    <div className="space-y-1.5 py-0.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleVoicePlayback(msg.id)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition active:scale-95 shadow-xs ${
                            isMe ? 'bg-white text-[#007AFF]' : 'bg-[#007AFF] text-white'
                          }`}
                        >
                          {playingVoiceMsgId === msg.id ? (
                            <Pause className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          )}
                        </button>

                        <div className="flex-1 flex items-center gap-0.5 h-5 px-1">
                          {[30, 65, 45, 90, 75, 40, 85, 95, 50, 70, 35, 65, 80, 45, 60].map(
                            (height, idx) => (
                              <span
                                key={idx}
                                style={{ height: `${height}%` }}
                                className={`w-0.5 sm:w-1 rounded-full transition-all ${
                                  playingVoiceMsgId === msg.id && idx % 3 === 0
                                    ? isMe
                                      ? 'bg-white animate-pulse'
                                      : 'bg-[#007AFF] animate-pulse'
                                    : isMe
                                    ? 'bg-white/60'
                                    : 'bg-zinc-400 dark:bg-zinc-500'
                                }`}
                              />
                            )
                          )}
                        </div>

                        <span className={`text-[10px] font-mono shrink-0 ${isMe ? 'text-blue-100' : 'text-zinc-500'}`}>
                          {msg.voiceDuration || '0:12'}
                        </span>
                      </div>
                      <p className={`text-[11px] italic ${isMe ? 'text-blue-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {msg.content}
                      </p>
                    </div>
                  ) : msg.messageType === 'attachment' ? (
                    /* TYPE PIÈCE JOINTE */
                    <div className="space-y-1.5">
                      <p>{msg.content}</p>
                      <div
                        className={`p-2 rounded-xl flex items-center gap-2 border ${
                          isMe
                            ? 'bg-white/15 border-white/25 text-white'
                            : 'bg-white/70 dark:bg-black/25 border-black/[0.06] dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        <FileText className={`w-4 h-4 shrink-0 ${isMe ? 'text-white' : 'text-blue-500'}`} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[11px] truncate">
                            {msg.attachmentName || 'Rapport_Technique.pdf'}
                          </p>
                          <span className={`text-[9px] font-mono ${isMe ? 'text-blue-100' : 'text-zinc-500'}`}>
                            {msg.attachmentSize || '1.2 Mo'} · Document certifié
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : msg.messageType === 'image' || msg.imageUrl ? (
                    /* TYPE PHOTO */
                    <div className="space-y-1 -m-0.5">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImageUrl({
                            url: msg.imageUrl!,
                            caption: msg.imageCaption || msg.content,
                            sender: msg.senderName,
                          });
                        }}
                        className="relative rounded-xl overflow-hidden cursor-pointer bg-black/10 shadow-2xs"
                      >
                        <img
                          src={msg.imageUrl}
                          alt="Inspection"
                          className="w-full max-h-64 object-cover rounded-xl"
                          loading="lazy"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <Maximize2 className="w-2.5 h-2.5" /> Agrandir
                        </div>
                      </div>
                      {msg.content && msg.content !== "Photo de terrain" && (
                        <p className={`px-1 text-xs ${isMe ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>
                          {msg.content}
                        </p>
                      )}
                    </div>
                  ) : msg.messageType === 'handover' ? (
                    /* TYPE RELÈVE */
                    <div className="space-y-1">
                      <div
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold text-[10px] font-mono uppercase ${
                          isMe ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>Relève officielle</span>
                      </div>
                      <p className="font-medium">{msg.content}</p>
                    </div>
                  ) : (
                    /* TEXTE */
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>

                {/* Horodatage & Statut */}
                <div
                  className={`flex items-center gap-1 mt-0.5 px-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 ${
                    isMe ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isMe && (
                    <span className="inline-flex items-center">
                      {msg.status === 'read' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-[#007AFF] dark:text-[#38BDF8]" strokeWidth={2.2} />
                      ) : msg.status === 'delivered' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.8} />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-zinc-400" strokeWidth={2} />
                      )}
                    </span>
                  )}
                </div>

                {/* Réactions */}
                {hasReactions && (
                  <div className={`flex flex-wrap items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {Object.entries(msg.reactions || {}).map(([emoji, count]) => {
                      const userHasReacted = msg.userReactions?.[emoji]?.includes(user.id);
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => toggleMessageReaction(msg.id, emoji)}
                          className={`px-1.5 py-0.5 rounded-full border text-[10px] font-medium flex items-center gap-0.5 shadow-2xs ${
                            userHasReacted
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                              : 'bg-white dark:bg-[#1E1E22] border-black/[0.08] dark:border-white/[0.1] text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="font-mono">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Puces de relève rapides */}
      <div className="px-3 py-1 bg-white dark:bg-[#151619] border-t border-black/[0.03] dark:border-white/[0.04] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {[
          { label: 'Relève conforme ✅', type: 'handover' as const },
          { label: 'Inspection terminée ⚒️', type: 'text' as const },
          { label: 'Paramètres nominaux', type: 'text' as const },
          { label: 'Signalement HSE ⚠️', type: 'text' as const },
        ].map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendQuickChip(chip.label, chip.type)}
            className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-medium border border-black/[0.04] dark:border-white/[0.06] whitespace-nowrap transition active:scale-95"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* 4. Barre de composition du message */}
      <div className="p-2 sm:p-2.5 border-t border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-[#151619] shrink-0 relative">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageFileSelected}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageFileSelected}
          className="hidden"
        />

        {/* Aperçu photo avant envoi */}
        {selectedImagePreview && (
          <div className="mb-2 p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={selectedImagePreview}
                alt="Aperçu"
                className="w-10 h-10 object-cover rounded-lg border border-black/10"
              />
              <span className="text-xs font-semibold truncate text-zinc-900 dark:text-zinc-100">
                {selectedImageFile?.name || 'Photo appareil mobile'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearImagePreview}
              className="text-xs text-red-500 font-medium px-2 py-1"
            >
              Supprimer
            </button>
          </div>
        )}

        {/* Menu Pièces Jointes */}
        {showAttachMenu && (
          <div className="absolute bottom-full mb-2 left-2 p-1.5 rounded-2xl bg-white dark:bg-[#202227] border border-black/[0.08] dark:border-white/[0.1] shadow-2xl space-y-1 text-xs z-30 w-64 animate-in zoom-in-95 duration-100">
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                cameraInputRef.current?.click();
              }}
              className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition"
            >
              <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Camera className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Prendre une photo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                galleryInputRef.current?.click();
              }}
              className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ImageIcon className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Galerie & Images</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendAttachment('Rapport_Relève_SXEW.pdf', '1.2 Mo')}
              className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition"
            >
              <div className="w-7 h-7 rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Rapport de Quart PDF</span>
            </button>

            {/* Partage QR Code du Groupe */}
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                handleShareCurrentGroup();
              }}
              className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition"
            >
              <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <QrCode className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Code QR & Lien d'invitation</span>
            </button>
          </div>
        )}

        {isRecordingVoice ? (
          <div className="flex items-center justify-between gap-3 p-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-600 font-mono">
            <div className="flex items-center gap-2 pl-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="font-bold text-[11px]">
                Enregistrement : 0:{recordingSeconds.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsRecordingVoice(false)}
                className="text-[11px] px-2 py-0.5 text-zinc-500 hover:text-zinc-900"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSendVoiceNote}
                className="px-3 py-1 rounded-full bg-red-500 text-white font-semibold flex items-center gap-1 text-[11px]"
              >
                <span>Envoyer</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendTextMessage} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition shrink-0 ${
                showAttachMenu
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rotate-45 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="Ajouter média ou inviter par QR Code"
            >
              <Plus className="w-4 h-4 transition-transform duration-200" strokeWidth={2.2} />
            </button>

            <input
              type="text"
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder={
                selectedImagePreview
                  ? 'Ajouter une légende...'
                  : isOnline
                  ? `Message pour ${activeChannel.name}...`
                  : 'Message placé dans la file locale...'
              }
              className="flex-1 px-3 py-2 rounded-full bg-zinc-100/70 dark:bg-zinc-800/50 border border-black/[0.04] dark:border-white/[0.06] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition min-w-0"
            />

            {inputContent.trim() || selectedImagePreview ? (
              <button
                type="submit"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs active:scale-95 hover:bg-blue-700 transition shrink-0"
                aria-label="Envoyer"
              >
                <Send className="w-4 h-4" strokeWidth={1.75} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecordingVoice(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition shrink-0"
                title="Enregistrer note vocale"
              >
                <Mic className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-2 h-full flex flex-col">
      {/* BANNIÈRE RADIO VOCALE MINING */}
      {radioBannerText && (
        <div className="p-2 rounded-2xl bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border border-black/10 dark:border-white/10 text-xs font-mono flex items-center justify-between gap-3 shadow-xl animate-in fade-in shrink-0">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500 shrink-0 animate-pulse" strokeWidth={2} />
            <span className="leading-tight text-[11px]">{radioBannerText}</span>
          </div>
          <button
            onClick={() => setRadioBannerText(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold px-1.5 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* CONTENEUR PRINCIPAL ADAPTATIF FLUIDE (Hauteur calculée sans déborder) */}
      {orientation === 'portrait' ? (
        <div className="w-full flex-1 h-[calc(100vh-175px)] min-h-[480px] max-h-[760px] flex flex-col rounded-3xl bg-white dark:bg-[#151619] border border-black/[0.06] dark:border-white/[0.08] shadow-sm overflow-hidden relative">
          {mobileView === 'list' ? renderConversationList() : renderActiveChat()}
        </div>
      ) : (
        <div className="w-full flex-1 h-[calc(100vh-175px)] min-h-[460px] max-h-[640px] flex rounded-3xl bg-white dark:bg-[#151619] border border-black/[0.06] dark:border-white/[0.08] shadow-sm overflow-hidden">
          <div className="w-[36%] min-w-[270px] max-w-[340px] shrink-0 border-r border-black/[0.06] dark:border-white/[0.08] flex flex-col h-full overflow-hidden">
            {renderConversationList()}
          </div>
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {renderActiveChat()}
          </div>
        </div>
      )}

      {/* MODALE D'INFORMATIONS DU GROUPE (Détails & Membres & Bouton Inviter QR Code) */}
      {showGroupInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#18191D] border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold text-xs font-mono shadow-2xs">
                  {activeChannel.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {activeChannel.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Canal industriel certifié TFM
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowGroupInfo(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {activeChannel.description}
            </p>

            {/* Bouton Inviter dans le groupe par Code QR & Lien */}
            <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Inviter par Code QR & Lien
                  </h4>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Partagez l'accès au canal avec vos collègues
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowGroupInfo(false);
                  handleShareCurrentGroup();
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
              >
                Partager
              </button>
            </div>

            {/* Liste des membres */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 block">
                Membres Actifs ({channelMembers.length})
              </span>
              <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06] rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-black/[0.06] dark:border-white/[0.08] overflow-hidden text-xs max-h-44 overflow-y-auto">
                {channelMembers.map((m, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{m.name}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {m.role} · {m.team}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowGroupInfo(false)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 active:scale-95 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE PARTAGE QR CODE & LIEN D'INVITATION (Groupes & Contacts) */}
      <ShareQrModal
        isOpen={isShareModalOpen}
        entity={shareEntity}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareEntity(null);
        }}
        onOpenChat={(channelId) => {
          setActiveChannelId(channelId);
          if (orientation === 'portrait') setMobileView('chat');
        }}
      />

      {/* MODALE SCANNER / REJOINDRE PAR QR CODE OU LIEN */}
      <JoinByQrModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoinSuccess={handleJoinSuccess}
      />

      {/* MODALE LIGHTBOX POUR PHOTOS D'INSPECTION */}
      {lightboxImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 select-none"
          onClick={() => setLightboxImageUrl(null)}
        >
          <div className="flex items-center justify-between text-white max-w-4xl mx-auto w-full pt-1 px-2">
            <span className="font-semibold text-xs sm:text-sm truncate">
              Photo par {lightboxImageUrl.sender || 'Opérateur TFM'}
            </span>
            <div className="flex items-center gap-2">
              <a
                href={lightboxImageUrl.url}
                download="Photo_Inspection_TFM.jpg"
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setLightboxImageUrl(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            className="flex-1 flex items-center justify-center p-2 max-w-4xl mx-auto w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImageUrl.url}
              alt="Inspection"
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />
          </div>

          <div className="text-center text-zinc-400 text-[11px] font-mono pb-1">
            Touchez pour fermer
          </div>
        </div>
      )}
    </div>
  );
};
