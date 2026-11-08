/**
 * TFM SCHEDULER — Moteur de Calcul de Rotation
 * Tenke Fungurume Mining (TFM)
 *
 * Moteur indépendant de toute interface utilisateur ou connexion réseau.
 * Conçu pour être directement portable vers Kotlin / Android Room.
 */

import {
  CalendarGridDay,
  CycleDayInfo,
  LandmarkCode,
  NextMilestoneInfo,
  NextTransitionInfo,
  RotationTeamId,
  ShiftConfig,
  ShiftPattern,
  ShiftPatternDefinition,
  ShiftType,
} from '../types';

export const SHIFT_PATTERNS: Record<ShiftPattern, ShiftPatternDefinition> = {
  '6/3': {
    id: '6/3',
    name: 'Rotation 6/3 (9 jours)',
    totalDays: 9,
    workDays: 6,
    offDays: 3,
    dayShifts: 3,
    nightShifts: 3,
    badge: 'TFM Standard (9j)',
    description: '3 postes Jour (12h) · 3 postes Nuit (12h) · 3 jours Repos récupérateur',
    phases: [
      { name: 'Poste de Jour', type: 'DAY', daysCount: 3, startDay: 1, endDay: 3, hours: '06h — 18h' },
      { name: 'Poste de Nuit', type: 'NIGHT', daysCount: 3, startDay: 4, endDay: 6, hours: '18h — 06h' },
      { name: 'Repos Récupérateur', type: 'OFF', daysCount: 3, startDay: 7, endDay: 9, hours: '72h repos' },
    ],
  },
  '5/2': {
    id: '5/2',
    name: 'Rotation 5/2 (7 jours)',
    totalDays: 7,
    workDays: 5,
    offDays: 2,
    dayShifts: 5,
    nightShifts: 0,
    badge: 'Régime Continu / Admin (7j)',
    description: '5 jours de travail opérationnel consécutifs · 2 jours de repos hebdomadaire',
    phases: [
      { name: 'Poste de Jour', type: 'DAY', daysCount: 5, startDay: 1, endDay: 5, hours: '06h — 18h' },
      { name: 'Repos Récupérateur', type: 'OFF', daysCount: 2, startDay: 6, endDay: 7, hours: '48h repos' },
    ],
  },
  '10/4': {
    id: '10/4',
    name: 'Rotation 10/4 (14 jours)',
    totalDays: 14,
    workDays: 10,
    offDays: 4,
    dayShifts: 10,
    nightShifts: 0, // Pas de poste de nuit pour le moment
    badge: 'Régime Minier 10/4 (14j)',
    description: '10 postes Jour (12h) consécutifs · 4 jours Repos récupérateur (aucun poste de nuit)',
    phases: [
      { name: 'Poste de Jour', type: 'DAY', daysCount: 10, startDay: 1, endDay: 10, hours: '06h — 18h' },
      { name: 'Repos Récupérateur', type: 'OFF', daysCount: 4, startDay: 11, endDay: 14, hours: '96h repos' },
    ],
  },
};

export const DEFAULT_ANCHOR_DATE = '2026-11-01';

/**
 * Calage d'ancrage officiel pour les équipes TFM (Équipe A, Équipe B, Équipe C) le 2026-11-01 :
 *
 * 1) En Shift 6/3 (Cycle de 9 jours) :
 *    - Équipe A : 2e jour de repos => J8/9 (Repos J2/3)
 *    - Équipe B : 2e jour de boulot => J2/9 (Jour J2/3)
 *    - Équipe C : 2e nuit => J5/9 (Nuit J2/3)
 *
 * 2) En Shift 10/4 (Cycle de 14 jours, sans poste de nuit) :
 *    - Équipe A : 4e jour de boulot => J4/14 (Jour J4/10)
 *    - Équipe B : 10e jour de boulot => J10/14 (Jour J10/10)
 *    - Équipe C : 4e jour de repos => J14/14 (Repos J4/4)
 *
 * 3) En Shift 5/2 (Cycle de 7 jours) :
 *    - Équipe A : J1/7
 *    - Équipe B : J3/7
 *    - Équipe C : J5/7
 */
export const TEAM_ANCHORS: Record<ShiftPattern, Record<RotationTeamId, number>> = {
  '6/3': {
    A: 8, // 2e jour de repos
    B: 2, // 2e jour de boulot
    C: 5, // 2e nuit
  },
  '10/4': {
    A: 4,  // 4e jour de boulot
    B: 10, // 10e jour de boulot
    C: 14, // 4e jour de repos
  },
  '5/2': {
    A: 1,
    B: 3,
    C: 5,
  },
};

export const DEFAULT_SHIFT_CONFIG: ShiftConfig = {
  pattern: '6/3', // 6/3 par défaut (Cycle 9 jours TFM)
  team: 'A',
  referenceDate: DEFAULT_ANCHOR_DATE,
  referenceCycleDay: 8, // Équipe A par défaut le 2026-11-01 : 2e jour de repos (J8/9)
  dayShiftStart: '06:00',
  dayShiftEnd: '18:00',
  nightShiftStart: '18:00',
  nightShiftEnd: '06:00',
  timeZone: 'Africa/Lubumbashi', // UTC+2 CAT
};

/**
 * Génère une configuration synchronisée sur le calage d'ancrage officiel d'une équipe.
 */
export function getCalibratedConfig(
  pattern: ShiftPattern = '6/3',
  team: RotationTeamId = 'A',
  overrides?: Partial<ShiftConfig>
): ShiftConfig {
  const refCycleDay = TEAM_ANCHORS[pattern]?.[team] ?? 1;
  return {
    ...DEFAULT_SHIFT_CONFIG,
    pattern,
    team,
    referenceDate: DEFAULT_ANCHOR_DATE,
    referenceCycleDay: refCycleDay,
    ...overrides,
  };
}

/**
 * Retourne la longueur en jours d'un cycle donné.
 */
export function getCycleLength(pattern: ShiftPattern = '6/3'): number {
  switch (pattern) {
    case '5/2':
      return 7;
    case '10/4':
      return 14;
    case '6/3':
    default:
      return 9;
  }
}

/**
 * Convertit une date YYYY-MM-DD en nombre entier de jours UTC depuis l'époque 1970-01-01.
 * Évite les biais d'heures d'été, de fuseau horaire ou de décalages horaires locaux.
 */
export function dateStringToEpochDays(dateStr: string): number {
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    throw new Error(`Format de date invalide: "${dateStr}". Attendu: "YYYY-MM-DD"`);
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // 1-12
  const day = parseInt(parts[2], 10); // 1-31

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error(`Composantes de date non numériques: "${dateStr}"`);
  }

  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

/**
 * Convertit un nombre entier de jours UTC en chaîne ISO "YYYY-MM-DD".
 */
export function epochDaysToDateString(epochDays: number): string {
  const date = new Date(epochDays * 86400000);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calcule la position dans le cycle (1 à totalDays) pour n'importe quelle date.
 * Gère correctement les dates antérieures à la référence (restes négatifs en arithmétique modulaire).
 */
export function getCycleDay(dateStr: string, config: ShiftConfig = DEFAULT_SHIFT_CONFIG): {
  cycleDay: number;
  daysFromReference: number;
} {
  const pattern = config.pattern || '6/3';
  const cycleLength = getCycleLength(pattern);

  const targetEpoch = dateStringToEpochDays(dateStr);
  const refEpoch = dateStringToEpochDays(config.referenceDate);
  const diffDays = targetEpoch - refEpoch;

  // Formule modulaire pour gérer les nombres négatifs avec exactitude
  const baseModulo = ((diffDays % cycleLength) + cycleLength) % cycleLength;

  // Si referenceCycleDay = 1, diffDays = 0 donne baseModulo = 0 -> cycleDay = 1.
  const cycleDay = ((baseModulo + (config.referenceCycleDay - 1)) % cycleLength) + 1;

  return { cycleDay, daysFromReference: diffDays };
}

/**
 * Détermine le type de poste selon la position dans le cycle et le modèle (6/3, 5/2, 10/4).
 */
export function getShiftType(cycleDay: number, pattern: ShiftPattern = '6/3'): ShiftType {
  if (pattern === '5/2') {
    // 5 jours de jour (J1-J5), 2 jours de repos (J6-J7)
    if (cycleDay >= 1 && cycleDay <= 5) return 'DAY';
    if (cycleDay >= 6 && cycleDay <= 7) return 'OFF';
    throw new Error(`Position de cycle 5/2 invalide : ${cycleDay}. Doit être entre 1 et 7.`);
  }

  if (pattern === '10/4') {
    // 10 jours Jour (J1-J10), 4 jours Repos (J11-J14) — Aucun poste de nuit
    if (cycleDay >= 1 && cycleDay <= 10) return 'DAY';
    if (cycleDay >= 11 && cycleDay <= 14) return 'OFF';
    throw new Error(`Position de cycle 10/4 invalide : ${cycleDay}. Doit être entre 1 et 14.`);
  }

  // Modèle 6/3 par défaut (3J Jour, 3J Nuit, 3J Repos)
  if (cycleDay >= 1 && cycleDay <= 3) {
    return 'DAY';
  } else if (cycleDay >= 4 && cycleDay <= 6) {
    return 'NIGHT';
  } else if (cycleDay >= 7 && cycleDay <= 9) {
    return 'OFF';
  }
  throw new Error(`Position de cycle 6/3 invalide : ${cycleDay}. Doit être entre 1 et 9.`);
}

/**
 * Libellé en français du poste.
 */
export function getShiftLabel(shiftType: ShiftType): string {
  switch (shiftType) {
    case 'DAY':
      return 'Poste de Jour (06h - 18h)';
    case 'NIGHT':
      return 'Poste de Nuit (18h - 06h)';
    case 'OFF':
      return 'Repos Récupérateur';
  }
}

/**
 * Retourne les repères A, B, C applicables à une position de cycle donnée.
 * - Repère B : 5e jour de travail
 * - Repère A : Dernier jour de repos
 * - Repère C : Dernier jour du cycle
 */
export function getLandmarksForCycleDay(cycleDay: number, pattern: ShiftPattern = '6/3'): LandmarkCode[] {
  const landmarks: LandmarkCode[] = [];

  if (pattern === '5/2') {
    if (cycleDay === 5) landmarks.push('B'); // 5e jour de travail
    if (cycleDay === 7) {
      landmarks.push('A'); // 2e jour de repos
      landmarks.push('C'); // 7e jour du cycle
    }
    return landmarks;
  }

  if (pattern === '10/4') {
    if (cycleDay === 5 || cycleDay === 10) landmarks.push('B'); // 5e et 10e jours de travail
    if (cycleDay === 14) {
      landmarks.push('A'); // 4e jour de repos
      landmarks.push('C'); // 14e jour du cycle
    }
    return landmarks;
  }

  // 6/3 par défaut
  if (cycleDay === 5) {
    landmarks.push('B'); // 5e jour de travail
  }
  if (cycleDay === 9) {
    landmarks.push('A'); // 3e jour de repos
    landmarks.push('C'); // 9e jour du cycle
  }
  return landmarks;
}

/**
 * Calcule la prochaine transition de statut selon le modèle de shift.
 */
export function calculateNextTransition(
  dateStr: string,
  cycleDay: number,
  config: ShiftConfig = DEFAULT_SHIFT_CONFIG
): NextTransitionInfo {
  const pattern = config.pattern || '6/3';
  let daysToTransition = 0;
  let nextShiftType: ShiftType = 'DAY';
  let description = '';

  if (pattern === '5/2') {
    if (cycleDay >= 1 && cycleDay <= 5) {
      daysToTransition = 6 - cycleDay;
      nextShiftType = 'OFF';
      description = daysToTransition === 1
        ? 'Début du repos hebdomadaire demain'
        : `Début du repos dans ${daysToTransition} jours`;
    } else {
      daysToTransition = 8 - cycleDay;
      nextShiftType = 'DAY';
      description = daysToTransition === 1
        ? 'Reprise du poste de jour demain'
        : `Reprise du poste de jour dans ${daysToTransition} jours`;
    }
  } else if (pattern === '10/4') {
    if (cycleDay >= 1 && cycleDay <= 10) {
      daysToTransition = 11 - cycleDay;
      nextShiftType = 'OFF';
      description = daysToTransition === 1
        ? 'Début du repos récupérateur (4j) demain'
        : `Début du repos dans ${daysToTransition} jours`;
    } else {
      daysToTransition = 15 - cycleDay;
      nextShiftType = 'DAY';
      description = daysToTransition === 1
        ? 'Reprise du poste de jour demain'
        : `Reprise du poste de jour dans ${daysToTransition} jours`;
    }
  } else {
    // 6/3 par défaut
    if (cycleDay >= 1 && cycleDay <= 3) {
      daysToTransition = 4 - cycleDay;
      nextShiftType = 'NIGHT';
      description = daysToTransition === 1
        ? 'Bascule en poste de nuit demain'
        : `Bascule en poste de nuit dans ${daysToTransition} jours`;
    } else if (cycleDay >= 4 && cycleDay <= 6) {
      daysToTransition = 7 - cycleDay;
      nextShiftType = 'OFF';
      description = daysToTransition === 1
        ? 'Début du repos récupérateur demain'
        : `Début du repos dans ${daysToTransition} jours`;
    } else {
      daysToTransition = 10 - cycleDay;
      nextShiftType = 'DAY';
      description = daysToTransition === 1
        ? 'Reprise du poste de jour demain'
        : `Reprise du poste de jour dans ${daysToTransition} jours`;
    }
  }

  const currentEpoch = dateStringToEpochDays(dateStr);
  const targetDate = epochDaysToDateString(currentEpoch + daysToTransition);

  return {
    targetDate,
    daysRemaining: daysToTransition,
    nextShiftType,
    description,
  };
}

/**
 * Calcule la prochaine prise de poste ou le prochain repos selon le contexte.
 */
export function calculateNextMilestone(
  dateStr: string,
  cycleDay: number,
  config: ShiftConfig = DEFAULT_SHIFT_CONFIG
): NextMilestoneInfo {
  const pattern = config.pattern || '6/3';
  const currentEpoch = dateStringToEpochDays(dateStr);

  if (pattern === '5/2') {
    if (cycleDay >= 1 && cycleDay <= 5) {
      const daysToRest = 6 - cycleDay;
      const targetDate = epochDaysToDateString(currentEpoch + daysToRest);
      return {
        targetDate,
        daysRemaining: daysToRest,
        isRest: true,
        description: daysToRest === 1
          ? 'Prochain repos : demain'
          : `Prochain repos : dans ${daysToRest} jours (${targetDate})`,
      };
    } else {
      const daysToWork = 8 - cycleDay;
      const targetDate = epochDaysToDateString(currentEpoch + daysToWork);
      return {
        targetDate,
        daysRemaining: daysToWork,
        isRest: false,
        description: daysToWork === 1
          ? 'Prise de poste de jour : demain'
          : `Prise de poste de jour : dans ${daysToWork} jours (${targetDate})`,
      };
    }
  } else if (pattern === '10/4') {
    if (cycleDay >= 1 && cycleDay <= 10) {
      const daysToRest = 11 - cycleDay;
      const targetDate = epochDaysToDateString(currentEpoch + daysToRest);
      return {
        targetDate,
        daysRemaining: daysToRest,
        isRest: true,
        description: daysToRest === 1
          ? 'Prochain repos : demain'
          : `Prochain repos : dans ${daysToRest} jours (${targetDate})`,
      };
    } else {
      const daysToWork = 15 - cycleDay;
      const targetDate = epochDaysToDateString(currentEpoch + daysToWork);
      return {
        targetDate,
        daysRemaining: daysToWork,
        isRest: false,
        description: daysToWork === 1
          ? 'Prise de poste de jour : demain'
          : `Prise de poste de jour : dans ${daysToWork} jours (${targetDate})`,
      };
    }
  } else {
    // 6/3 par défaut
    if (cycleDay >= 1 && cycleDay <= 6) {
      const daysToRest = 7 - cycleDay;
      const targetDate = epochDaysToDateString(currentEpoch + daysToRest);
      return {
        targetDate,
        daysRemaining: daysToRest,
        isRest: true,
        description: daysToRest === 1
          ? 'Prochain repos : demain'
          : `Prochain repos : dans ${daysToRest} jours (${targetDate})`,
      };
    } else {
      const daysToWork = 10 - cycleDay;
      const targetDate = epochDaysToDateString(currentEpoch + daysToWork);
      return {
        targetDate,
        daysRemaining: daysToWork,
        isRest: false,
        description: daysToWork === 1
          ? 'Prise de poste de jour : demain'
          : `Prise de poste de jour : dans ${daysToWork} jours (${targetDate})`,
      };
    }
  }
}

/**
 * Progression dans la phase active (boulot, nuit, repos).
 */
export interface PhaseProgress {
  phaseName: string;
  dayInPhase: number;
  totalDaysInPhase: number;
  label: string;
}

/**
 * Retourne la description exacte et la progression dans la phase active :
 * - 6/3 : "2e jour de repos", "2e jour de boulot", "2e nuit", etc.
 * - 10/4 : "4e jour de boulot", "10e jour de boulot", "4e jour de repos", etc.
 * - 5/2 : "2e jour de travail", "1er jour de repos", etc.
 */
export function getPhaseProgress(cycleDay: number, pattern: ShiftPattern = '6/3'): PhaseProgress {
  if (pattern === '10/4') {
    if (cycleDay >= 1 && cycleDay <= 10) {
      return {
        phaseName: 'Poste de Jour',
        dayInPhase: cycleDay,
        totalDaysInPhase: 10,
        label: `${cycleDay}${cycleDay === 1 ? 'er' : 'e'} jour de boulot`,
      };
    } else {
      const restDay = cycleDay - 10;
      return {
        phaseName: 'Repos Récupérateur',
        dayInPhase: restDay,
        totalDaysInPhase: 4,
        label: `${restDay}${restDay === 1 ? 'er' : 'e'} jour de repos`,
      };
    }
  }

  if (pattern === '5/2') {
    if (cycleDay >= 1 && cycleDay <= 5) {
      return {
        phaseName: 'Poste de Jour',
        dayInPhase: cycleDay,
        totalDaysInPhase: 5,
        label: `${cycleDay}${cycleDay === 1 ? 'er' : 'e'} jour de travail`,
      };
    } else {
      const restDay = cycleDay - 5;
      return {
        phaseName: 'Repos Hebdomadaire',
        dayInPhase: restDay,
        totalDaysInPhase: 2,
        label: `${restDay}${restDay === 1 ? 'er' : 'e'} jour de repos`,
      };
    }
  }

  // 6/3 par défaut (3J Jour, 3J Nuit, 3J Repos)
  if (cycleDay >= 1 && cycleDay <= 3) {
    return {
      phaseName: 'Poste de Jour',
      dayInPhase: cycleDay,
      totalDaysInPhase: 3,
      label: `${cycleDay}${cycleDay === 1 ? 'er' : 'e'} jour de boulot`,
    };
  } else if (cycleDay >= 4 && cycleDay <= 6) {
    const nightDay = cycleDay - 3;
    return {
      phaseName: 'Poste de Nuit',
      dayInPhase: nightDay,
      totalDaysInPhase: 3,
      label: `${nightDay}${nightDay === 1 ? 're' : 'e'} nuit`,
    };
  } else {
    const restDay = cycleDay - 6;
    return {
      phaseName: 'Repos Récupérateur',
      dayInPhase: restDay,
      totalDaysInPhase: 3,
      label: `${restDay}${restDay === 1 ? 'er' : 'e'} jour de repos`,
    };
  }
}

export interface TeamStatusSummary {
  team: RotationTeamId;
  teamName: string;
  cycleDay: number;
  totalCycleDays: number;
  shiftType: ShiftType;
  shiftLabel: string;
  phaseLabel: string;
  isUserTeam: boolean;
}

/**
 * Calcule l'état opérationnel simultané des 3 équipes (A, B, C) pour une date donnée.
 */
export function getAllTeamsStatus(
  dateStr: string,
  pattern: ShiftPattern = '6/3',
  userTeam: RotationTeamId = 'A'
): TeamStatusSummary[] {
  const teams: RotationTeamId[] = ['A', 'B', 'C'];
  return teams.map((t) => {
    const teamCfg = getCalibratedConfig(pattern, t);
    const dayInfo = calculateDay(dateStr, teamCfg);
    return {
      team: t,
      teamName: `Équipe ${t}`,
      cycleDay: dayInfo.cycleDay,
      totalCycleDays: dayInfo.totalCycleDays,
      shiftType: dayInfo.shiftType,
      shiftLabel: dayInfo.shiftLabel,
      phaseLabel: dayInfo.phaseLabel || `${dayInfo.cycleDay}/${dayInfo.totalCycleDays}`,
      isUserTeam: t === userTeam,
    };
  });
}

/**
 * Calcule les informations complètes d'un jour donné.
 */
export function calculateDay(
  dateStr: string,
  config: ShiftConfig = DEFAULT_SHIFT_CONFIG
): CycleDayInfo {
  const pattern = config.pattern || '6/3';
  const totalCycleDays = getCycleLength(pattern);

  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const { cycleDay, daysFromReference } = getCycleDay(dateStr, config);
  const shiftType = getShiftType(cycleDay, pattern);
  const shiftLabel = getShiftLabel(shiftType);
  const landmarks = getLandmarksForCycleDay(cycleDay, pattern);
  const nextTransition = calculateNextTransition(dateStr, cycleDay, config);
  const nextMilestone = calculateNextMilestone(dateStr, cycleDay, config);
  const phaseInfo = getPhaseProgress(cycleDay, pattern);

  // Jour de la semaine (0 = Dimanche, 1 = Lundi, etc.)
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  return {
    date: dateStr,
    year,
    month,
    day,
    dayOfWeek,
    cycleDay,
    totalCycleDays,
    pattern,
    shiftType,
    shiftLabel,
    phaseLabel: phaseInfo.label,
    landmarks,
    isDayShift: shiftType === 'DAY',
    isNightShift: shiftType === 'NIGHT',
    isOffShift: shiftType === 'OFF',
    daysFromReference,
    nextTransition,
    nextMilestone,
  };
}

/**
 * Calcule une série de jours consécutifs à partir d'une date de départ.
 */
export function calculateRange(
  startDateStr: string,
  daysCount: number,
  config: ShiftConfig = DEFAULT_SHIFT_CONFIG
): CycleDayInfo[] {
  const startEpoch = dateStringToEpochDays(startDateStr);
  const result: CycleDayInfo[] = [];

  for (let i = 0; i < daysCount; i++) {
    const curDateStr = epochDaysToDateString(startEpoch + i);
    result.push(calculateDay(curDateStr, config));
  }

  return result;
}

/**
 * Calcule tous les jours d'un mois civil donné.
 * @param year Année (ex: 2026)
 * @param month Mois de 1 à 12
 */
export function calculateMonth(
  year: number,
  month: number,
  config: ShiftConfig = DEFAULT_SHIFT_CONFIG
): CycleDayInfo[] {
  // Déterminer le nombre de jours dans le mois
  // En UTC, jour 0 du mois suivant donne le dernier jour du mois courant
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const result: CycleDayInfo[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    result.push(calculateDay(dStr, config));
  }

  return result;
}

/**
  * Retourne la date courante au format "YYYY-MM-DD" selon l'heure locale ou UTC.
  */
export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface MonthSummary {
  year: number;
  month: number;
  totalDays: number;
  dayShiftsCount: number;
  nightShiftsCount: number;
  offDaysCount: number;
  workDaysCount: number;
}

/**
 * Calcule le résumé statistique d'un mois civil, calculé strictement sur les dates appartenant au mois.
 */
export function calculateMonthSummary(
  year: number,
  month: number,
  config: ShiftConfig = DEFAULT_SHIFT_CONFIG
): MonthSummary {
  const monthDays = calculateMonth(year, month, config);
  const dayShiftsCount = monthDays.filter((d) => d.shiftType === 'DAY').length;
  const nightShiftsCount = monthDays.filter((d) => d.shiftType === 'NIGHT').length;
  const offDaysCount = monthDays.filter((d) => d.shiftType === 'OFF').length;

  return {
    year,
    month,
    totalDays: monthDays.length,
    dayShiftsCount,
    nightShiftsCount,
    offDaysCount,
    workDaysCount: dayShiftsCount + nightShiftsCount,
  };
}

/**
 * Calcule la grille mensuelle complète (semaines de 7 jours, du Lundi au Dimanche).
 * Inclut les jours de débordement du mois précédent et du mois suivant en gris discret,
 * assurant une continuité visuelle parfaite sans cellules manquantes.
 */
export function calculateCalendarGrid(
  year: number,
  month: number,
  config: ShiftConfig = DEFAULT_SHIFT_CONFIG
): CalendarGridDay[] {
  // Premier jour du mois civil en UTC
  const firstDayDate = new Date(Date.UTC(year, month - 1, 1));
  const firstDayUTCDay = firstDayDate.getUTCDay(); // 0 = Dimanche, 1 = Lundi, ...
  const leadingBlanks = (firstDayUTCDay + 6) % 7; // Lun = 0, Mar = 1, ..., Dim = 6

  // Nombre total de jours dans ce mois civil
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  // Date de départ (Lundi précédant ou coïncidant avec le 1er du mois)
  const firstDayStr = `${year}-${String(month).padStart(2, '0')}-01`;
  const firstDayEpoch = dateStringToEpochDays(firstDayStr);
  const startEpoch = firstDayEpoch - leadingBlanks;

  // Lignes complètes de 7 jours (35 ou 42 cases)
  const totalDaysRequired = leadingBlanks + daysInMonth;
  const totalGridCells = Math.ceil(totalDaysRequired / 7) * 7;

  const grid: CalendarGridDay[] = [];

  for (let i = 0; i < totalGridCells; i++) {
    const epoch = startEpoch + i;
    const dateStr = epochDaysToDateString(epoch);
    const dayInfo = calculateDay(dateStr, config);

    const isCurrentMonth = dayInfo.year === year && dayInfo.month === month;
    const isLeadingDay = i < leadingBlanks;
    const isTrailingDay = i >= leadingBlanks + daysInMonth;

    grid.push({
      ...dayInfo,
      isCurrentMonth,
      isLeadingDay,
      isTrailingDay,
    });
  }

  return grid;
}
