/**
 * TFM SCHEDULER — Types de données du domaine
 * Tenke Fungurume Mining (TFM)
 */

export type ShiftType = 'DAY' | 'NIGHT' | 'OFF';

export type LandmarkCode = 'A' | 'B' | 'C';

export interface LandmarkDetail {
  code: LandmarkCode;
  label: string;
  description: string;
}

export interface NextTransitionInfo {
  targetDate: string;
  daysRemaining: number;
  nextShiftType: ShiftType;
  description: string;
}

export interface NextMilestoneInfo {
  targetDate: string;
  daysRemaining: number;
  isRest: boolean;
  description: string;
}

export type ShiftPattern = '6/3' | '5/2' | '10/4';

export type RotationTeamId = 'A' | 'B' | 'C';

export interface ShiftPhaseInfo {
  name: string;
  type: ShiftType;
  daysCount: number;
  startDay: number;
  endDay: number;
  hours: string;
}

export interface ShiftPatternDefinition {
  id: ShiftPattern;
  name: string;
  totalDays: number;
  workDays: number;
  offDays: number;
  dayShifts: number;
  nightShifts: number;
  badge: string;
  description: string;
  phases: ShiftPhaseInfo[];
}

export interface CycleDayInfo {
  date: string; // ISO format YYYY-MM-DD
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  cycleDay: number; // 1 to totalCycleDays
  totalCycleDays: number; // 9 (pour 6/3), 7 (pour 5/2), 14 (pour 10/4)
  pattern: ShiftPattern; // '6/3' | '5/2' | '10/4'
  shiftType: ShiftType;
  shiftLabel: string;
  phaseLabel?: string; // ex: "2e jour de repos", "2e jour de boulot", "2e nuit"
  landmarks: LandmarkCode[];
  isDayShift: boolean;
  isNightShift: boolean;
  isOffShift: boolean;
  daysFromReference: number;
  nextTransition: NextTransitionInfo;
  nextMilestone: NextMilestoneInfo;
}

export interface CalendarGridDay extends CycleDayInfo {
  isCurrentMonth: boolean;
  isLeadingDay: boolean;
  isTrailingDay: boolean;
}

export interface ShiftConfig {
  pattern?: ShiftPattern; // '6/3' (défaut TFM 9j) | '5/2' (7j) | '10/4' (14j)
  team?: RotationTeamId; // 'A' | 'B' | 'C'
  referenceDate: string; // Date de calage d'ancrage (ex: "2026-11-01")
  referenceCycleDay: number; // Position dans le cycle à la date de référence
  dayShiftStart: string; // "06:00"
  dayShiftEnd: string; // "18:00"
  nightShiftStart: string; // "18:00"
  nightShiftEnd: string; // "06:00"
  timeZone: string; // "Africa/Lubumbashi" (CAT UTC+2)
}

export type AnnouncementCategory = 'ADMIN' | 'HSE' | 'MAINT' | 'NEWS' | 'HOLIDAY';

export type AnnouncementPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'INFO';

export interface AnnouncementAttachment {
  name: string;
  size: string;
  type: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  publishedAt: string;
  priority: AnnouncementPriority;
  isRead: boolean;
  author: string;
  department: string;
  attachments?: AnnouncementAttachment[];
}

export type UserRole = 'AGENT' | 'SUPERVISOR' | 'HSE_OFFICER' | 'ADMIN';

export type MessageSyncStatus = 'sent' | 'delivered' | 'read' | 'pending_sync' | 'sync_error' | 'stale';

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  status: MessageSyncStatus;
  idempotencyKey?: string;
  messageType?: 'text' | 'voice' | 'attachment' | 'handover' | 'image';
  voiceDuration?: string;
  attachmentName?: string;
  attachmentSize?: string;
  imageUrl?: string;
  imageCaption?: string;
  reactions?: Record<string, number>;
  userReactions?: Record<string, string[]>;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  iconName: string;
  unreadCount: number;
  isGroup: boolean;
  isArchived?: boolean;
  isOnline?: boolean;
}

export interface PaySlipGain {
  description: string;
  hoursUnits?: number;
  amount: number;
}

export interface PaySlipDeduction {
  description: string;
  hoursUnits?: number;
  amount: number;
}

export interface PaySlip {
  id: string;
  matricule: string;
  agentName: string;
  period: string; // e.g., "Avril 2026"
  issueDate: string;
  department: string;
  grade: string;
  bankAccount: string;
  company?: string;
  companyAddress?: string;
  jobTitle?: string;
  clientId?: string;
  engagementDate?: string;
  cnssEmployeeNumber?: string;
  workCenter?: string;
  gains?: PaySlipGain[];
  deductions?: PaySlipDeduction[];
  totalGainsUSD?: number;
  totalDeductionsUSD?: number;
  baseSalaryCDF: number;
  nightShiftBonusCDF: number;
  productionBonusCDF: number;
  hazardBonusHSECDF: number;
  grossSalaryCDF: number;
  cnssDeductionCDF: number;
  iprTaxCDF: number;
  inppContributionCDF: number;
  netSalaryCDF: number;
  netSalaryUSD: number;
  daysWorkedDay: number;
  daysWorkedNight: number;
  daysOff: number;
  status: 'VALIDATED' | 'ARCHIVED';
  distributionStatus: 'PENDING_IMPORT' | 'DISTRIBUTED' | 'VIEWED_BY_AGENT';
  distributedAt?: string;
  viewedAt?: string;
  verifiedIdentityAt?: string;
  securityHash: string;
  qrVerificationUrl: string;
  pdfAssetUrl?: string;
}

export interface UserProfile {
  id: string;
  matricule: string;
  fullName: string;
  role: string;
  systemRole: UserRole;
  department: string;
  rotationTeam: string;
  phone: string;
  emergencyContact: string;
  siteLocation: string;
  securityClearance: string;
  medicalClearanceDate: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type ActiveTab = 'dashboard' | 'calendar' | 'announcements' | 'messages' | 'payslips' | 'profile';

