/**
 * TFM SCHEDULER — Suite de Tests Automatisés du Moteur de Rotation
 * Vérifie toutes les exigences obligatoires :
 * - Moteur 6/3 (9 jours)
 * - Moteur 5/2 (7 jours)
 * - Moteur 10/4 (14 jours sans poste de nuit)
 * - Calages réels des équipes A, B, C pour la date d'ancrage (2026-11-01)
 * - Repères A, B, C et arithmétique modulaire temporelle
 */

import {
  calculateCalendarGrid,
  calculateDay,
  calculateMonth,
  calculateMonthSummary,
  calculateRange,
  DEFAULT_ANCHOR_DATE,
  DEFAULT_SHIFT_CONFIG,
  getAllTeamsStatus,
  getCalibratedConfig,
  getCycleDay,
  getLandmarksForCycleDay,
  getPhaseProgress,
  getShiftType,
  TEAM_ANCHORS,
} from './rotationEngine';

export interface TestResultItem {
  id: string;
  category: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  executionTimestamp: string;
  results: TestResultItem[];
}

export function runRotationEngineTests(): TestSuiteSummary {
  const results: TestResultItem[] = [];

  function assert(
    id: string,
    category: string,
    name: string,
    condition: boolean,
    expected: string,
    actual: string,
    details?: string
  ) {
    results.push({
      id,
      category,
      name,
      passed: condition,
      expected,
      actual,
      details,
    });
  }

  // Configuration de référence historique (13 mai 2026 = Jour 1)
  const configMay13 = {
    ...DEFAULT_SHIFT_CONFIG,
    referenceDate: '2026-05-13',
    referenceCycleDay: 1,
  };

  // 1. DATE DE RÉFÉRENCE (13 MAI 2026)
  const refDay = calculateDay('2026-05-13', configMay13);
  assert(
    'T01_REF_DATE_DAY1',
    'Référence',
    '13 mai 2026 : Premier jour du cycle',
    refDay.cycleDay === 1 && refDay.shiftType === 'DAY',
    'cycleDay = 1, shiftType = DAY',
    `cycleDay = ${refDay.cycleDay}, shiftType = ${refDay.shiftType}`
  );

  // 2. TROIS JOURS DE JOUR (J1, J2, J3)
  const day1 = calculateDay('2026-05-13', configMay13);
  const day2 = calculateDay('2026-05-14', configMay13);
  const day3 = calculateDay('2026-05-15', configMay13);
  assert(
    'T02_DAY_SHIFT_SERIES',
    'Poste de Jour',
    'Jours 1 à 3 : Tous en travail de jour',
    day1.cycleDay === 1 && day1.shiftType === 'DAY' &&
    day2.cycleDay === 2 && day2.shiftType === 'DAY' &&
    day3.cycleDay === 3 && day3.shiftType === 'DAY',
    'J1=DAY, J2=DAY, J3=DAY',
    `J1=${day1.shiftType}, J2=${day2.shiftType}, J3=${day3.shiftType}`
  );

  // 3. TROIS JOURS DE NUIT (J4, J5, J6)
  const day4 = calculateDay('2026-05-16', configMay13);
  const day5 = calculateDay('2026-05-17', configMay13);
  const day6 = calculateDay('2026-05-18', configMay13);
  assert(
    'T03_NIGHT_SHIFT_SERIES',
    'Poste de Nuit',
    'Jours 4 à 6 : Tous en travail de nuit',
    day4.cycleDay === 4 && day4.shiftType === 'NIGHT' &&
    day5.cycleDay === 5 && day5.shiftType === 'NIGHT' &&
    day6.cycleDay === 6 && day6.shiftType === 'NIGHT',
    'J4=NIGHT, J5=NIGHT, J6=NIGHT',
    `J4=${day4.shiftType}, J5=${day5.shiftType}, J6=${day6.shiftType}`
  );

  // 4. TROIS JOURS DE REPOS (J7, J8, J9)
  const day7 = calculateDay('2026-05-19', configMay13);
  const day8 = calculateDay('2026-05-20', configMay13);
  const day9 = calculateDay('2026-05-21', configMay13);
  assert(
    'T04_REST_SERIES',
    'Repos Récupérateur',
    'Jours 7 à 9 : Tous en repos',
    day7.cycleDay === 7 && day7.shiftType === 'OFF' &&
    day8.cycleDay === 8 && day8.shiftType === 'OFF' &&
    day9.cycleDay === 9 && day9.shiftType === 'OFF',
    'J7=OFF, J8=OFF, J9=OFF',
    `J7=${day7.shiftType}, J8=${day8.shiftType}, J9=${day9.shiftType}`
  );

  // 5. RETOUR AU PREMIER JOUR APRÈS 9 JOURS
  const day10 = calculateDay('2026-05-22', configMay13);
  assert(
    'T05_CYCLE_RESTART_J10',
    'Boucle de Cycle',
    'Jour 10 (22 mai 2026) : Retour automatique au Jour 1',
    day10.cycleDay === 1 && day10.shiftType === 'DAY',
    'cycleDay = 1, shiftType = DAY',
    `cycleDay = ${day10.cycleDay}, shiftType = ${day10.shiftType}`
  );

  // 6. REPÈRES A, B, C
  const landmarksDay5 = getLandmarksForCycleDay(5, '6/3');
  const landmarksDay9 = getLandmarksForCycleDay(9, '6/3');
  const landmarksDay1 = getLandmarksForCycleDay(1, '6/3');
  assert(
    'T06_LANDMARK_B_DAY5',
    'Repères TFM',
    'Repère B : 5e jour de travail (CycleDay 5)',
    landmarksDay5.includes('B') && !landmarksDay5.includes('A'),
    'Contient [B]',
    JSON.stringify(landmarksDay5)
  );
  assert(
    'T07_LANDMARK_A_AND_C_DAY9',
    'Repères TFM',
    'Repères A et C : 3e jour de repos et 9e jour du cycle (CycleDay 9)',
    landmarksDay9.includes('A') && landmarksDay9.includes('C'),
    'Contient [A, C]',
    JSON.stringify(landmarksDay9)
  );
  assert(
    'T08_NO_LANDMARKS_OTHER_DAYS',
    'Repères TFM',
    'Absence de repères sur les autres jours (ex: Jour 1)',
    landmarksDay1.length === 0,
    '[] (vide)',
    JSON.stringify(landmarksDay1)
  );

  // 7. DATES ANTÉRIEURES AU 13 MAI 2026
  const dayMinus1 = calculateDay('2026-05-12', configMay13); // J-1 = 9 (OFF, repères A & C)
  assert(
    'T09_NEGATIVE_DATE_MINUS_1',
    'Dates Antérieures',
    '12 mai 2026 (J-1) : CycleDay = 9 (OFF, Repères A & C)',
    dayMinus1.cycleDay === 9 && dayMinus1.shiftType === 'OFF' && dayMinus1.landmarks.includes('A'),
    'cycleDay = 9, OFF, [A, C]',
    `cycleDay = ${dayMinus1.cycleDay}, ${dayMinus1.shiftType}, ${JSON.stringify(dayMinus1.landmarks)}`
  );

  const dayMinus5 = calculateDay('2026-05-08', configMay13); // J-5 = 5 (NIGHT, repère B)
  assert(
    'T10_NEGATIVE_DATE_MINUS_5',
    'Dates Antérieures',
    '08 mai 2026 (J-5) : CycleDay = 5 (NIGHT, Repère B)',
    dayMinus5.cycleDay === 5 && dayMinus5.shiftType === 'NIGHT' && dayMinus5.landmarks.includes('B'),
    'cycleDay = 5, NIGHT, [B]',
    `cycleDay = ${dayMinus5.cycleDay}, ${dayMinus5.shiftType}, ${JSON.stringify(dayMinus5.landmarks)}`
  );

  const dayMinus9 = calculateDay('2026-05-04', configMay13); // J-9 = 1 (DAY)
  assert(
    'T11_NEGATIVE_DATE_FULL_CYCLE',
    'Dates Antérieures',
    '04 mai 2026 (J-9) : CycleDay = 1 (DAY)',
    dayMinus9.cycleDay === 1 && dayMinus9.shiftType === 'DAY',
    'cycleDay = 1, DAY',
    `cycleDay = ${dayMinus9.cycleDay}, ${dayMinus9.shiftType}`
  );

  // 8. TRANSITIONS DE MOIS ET D'ANNÉE
  const rangeYearEnd = calculateRange('2026-12-30', 4, configMay13); // 30 Dec, 31 Dec, 01 Jan 2027, 02 Jan 2027
  let consecutiveCheck = true;
  for (let i = 1; i < rangeYearEnd.length; i++) {
    const prev = rangeYearEnd[i - 1].cycleDay;
    const curr = rangeYearEnd[i].cycleDay;
    const expected = prev === 9 ? 1 : prev + 1;
    if (curr !== expected) {
      consecutiveCheck = false;
      break;
    }
  }
  assert(
    'T12_YEAR_TRANSITION',
    'Continuité Calendrier',
    'Transition d\'année 2026 -> 2027 sans rupture de cycle',
    consecutiveCheck,
    'Séquence cyclique stricte',
    consecutiveCheck ? 'Séquence cyclique valide' : 'Rupture détectée'
  );

  // 9. ANNÉES BISSEXTILES (2028 est bissextile : 29 février 2028)
  const feb28 = calculateDay('2028-02-28', configMay13);
  const feb29 = calculateDay('2028-02-29', configMay13);
  const mar01 = calculateDay('2028-03-01', configMay13);
  const leapCycleValid =
    (feb29.cycleDay === (feb28.cycleDay === 9 ? 1 : feb28.cycleDay + 1)) &&
    (mar01.cycleDay === (feb29.cycleDay === 9 ? 1 : feb29.cycleDay + 1));
  assert(
    'T13_LEAP_YEAR_2028',
    'Année Bissextile',
    'Prise en compte du 29 février 2028 et transition au 1er mars',
    leapCycleValid,
    '28 Fév -> 29 Fév -> 01 Mars continus',
    `${feb28.cycleDay} -> ${feb29.cycleDay} -> ${mar01.cycleDay}`
  );

  // 10. DATES ÉLOIGNÉES (Ex: 2020 et 2030)
  const farPast = calculateDay('2020-01-01', configMay13);
  const farFuture = calculateDay('2030-12-31', configMay13);
  assert(
    'T14_FAR_DATES_INTEGRITY',
    'Dates Éloignées',
    'Calcul sans erreur sur 2020 et 2030 (1..9)',
    farPast.cycleDay >= 1 && farPast.cycleDay <= 9 &&
    farFuture.cycleDay >= 1 && farFuture.cycleDay <= 9,
    'cycleDay ∈ [1, 9] pour 2020 et 2030',
    `2020: J${farPast.cycleDay} (${farPast.shiftType}), 2030: J${farFuture.cycleDay} (${farFuture.shiftType})`
  );

  // 11. CALCUL D'UN MOIS ENTIER (Mai 2026 = 31 jours)
  const may2026 = calculateMonth(2026, 5, configMay13);
  assert(
    'T15_FULL_MONTH_MAY2026',
    'Mois Complet',
    'Mois de mai 2026 contient exactement 31 jours calculés',
    may2026.length === 31 && may2026[12].date === '2026-05-13' && may2026[12].cycleDay === 1,
    '31 jours, J13 = 2026-05-13 (CycleDay 1)',
    `Taille = ${may2026.length}, 13e = ${may2026[12]?.date} (CycleDay ${may2026[12]?.cycleDay})`
  );

  // 12. EXIGENCES HISTORIQUES (Mai 2026)
  const s6_d13 = calculateDay('2026-05-13', configMay13);
  const s6_d14 = calculateDay('2026-05-14', configMay13);
  const s6_d15 = calculateDay('2026-05-15', configMay13);
  const s6_d16 = calculateDay('2026-05-16', configMay13);
  const s6_d19 = calculateDay('2026-05-19', configMay13);
  const s6_d21 = calculateDay('2026-05-21', configMay13);
  const s6_d22 = calculateDay('2026-05-22', configMay13);
  const s6Valid =
    s6_d13.cycleDay === 1 && s6_d13.shiftType === 'DAY' &&
    s6_d14.cycleDay === 2 && s6_d14.shiftType === 'DAY' &&
    s6_d15.cycleDay === 3 && s6_d15.shiftType === 'DAY' &&
    s6_d16.cycleDay === 4 && s6_d16.shiftType === 'NIGHT' &&
    s6_d19.cycleDay === 7 && s6_d19.shiftType === 'OFF' &&
    s6_d21.cycleDay === 9 && s6_d21.shiftType === 'OFF' &&
    s6_d22.cycleDay === 1 && s6_d22.shiftType === 'DAY';
  assert(
    'T16_SECTION_6_EXPLICIT_SPEC',
    'Exigences Section 6',
    '13-15 mai (Jour), 16 mai (Nuit), 19 & 21 mai (Repos), 22 mai (Jour 1)',
    s6Valid,
    'Conformité exacte aux 7 dates clés',
    s6Valid ? 'Toutes les 7 dates clés vérifiées' : 'Divergence détectée'
  );

  // 13. RÉSUMÉ STATISTIQUE DU MOIS CIVIL
  const summaryMay = calculateMonthSummary(2026, 5, configMay13);
  const summaryValid =
    summaryMay.totalDays === 31 &&
    summaryMay.dayShiftsCount + summaryMay.nightShiftsCount + summaryMay.offDaysCount === 31 &&
    summaryMay.workDaysCount === summaryMay.dayShiftsCount + summaryMay.nightShiftsCount;
  assert(
    'T17_MONTH_SUMMARY_STATISTICS',
    'Statistiques Mensuelles',
    'Total 31j = Jour + Nuit + Repos, Jours travaillés = Jour + Nuit',
    summaryValid,
    'Somme = 31, Travail = Jour + Nuit',
    `Total=${summaryMay.totalDays}, Jour=${summaryMay.dayShiftsCount}, Nuit=${summaryMay.nightShiftsCount}, Repos=${summaryMay.offDaysCount}`
  );

  // 14. GRILLE MENSUELLE COMPLÈTE
  const gridMay = calculateCalendarGrid(2026, 5, configMay13);
  const gridValid =
    gridMay.length % 7 === 0 &&
    gridMay.filter((c) => c.isCurrentMonth).length === 31 &&
    gridMay[0].dayOfWeek === 1;
  assert(
    'T18_CALENDAR_GRID_CONTINUITY',
    'Grille Calendrier',
    'Grille mensuelle 7 colonnes continue avec jours de débordement alignés',
    gridValid,
    'Multiple de 7, 31 jours actuels, premier jour = Lundi',
    `Cellules=${gridMay.length}, Actuels=${gridMay.filter((c) => c.isCurrentMonth).length}, Premier=${gridMay[0]?.date}`
  );

  // 15. ROTATION 5/2 (Cycle 7j)
  const config52 = { ...DEFAULT_SHIFT_CONFIG, pattern: '5/2' as const, referenceCycleDay: 1, referenceDate: '2026-05-13' };
  const day1_52 = calculateDay('2026-05-13', config52); // J1
  const day5_52 = calculateDay('2026-05-17', config52); // J5
  const day6_52 = calculateDay('2026-05-18', config52); // J6 (Repos)
  const day7_52 = calculateDay('2026-05-19', config52); // J7 (Repos)
  const day8_52 = calculateDay('2026-05-20', config52); // J1 cycle suivant
  const pattern52Valid =
    day1_52.shiftType === 'DAY' &&
    day5_52.shiftType === 'DAY' &&
    day6_52.shiftType === 'OFF' &&
    day7_52.shiftType === 'OFF' &&
    day8_52.cycleDay === 1 &&
    day8_52.shiftType === 'DAY' &&
    day1_52.totalCycleDays === 7;

  assert(
    'T19_SHIFT_PATTERN_5_2',
    'Rotations Multi-Patterns',
    'Pattern 5/2 (Cycle 7j) : J1-J5 Jour, J6-J7 Repos, rebouclage J8=J1',
    pattern52Valid,
    'J1-J5 DAY, J6-J7 OFF, J8=J1 DAY, Total=7j',
    `J1=${day1_52.shiftType}, J5=${day5_52.shiftType}, J6=${day6_52.shiftType}, J7=${day7_52.shiftType}, J8_CycleDay=${day8_52.cycleDay}`
  );

  // 16. ROTATION 10/4 SANS POSTE DE NUIT (10 jours Jour + 4 jours Repos = 14 jours)
  const config104Ref = {
    ...DEFAULT_SHIFT_CONFIG,
    pattern: '10/4' as const,
    referenceDate: '2026-05-13',
    referenceCycleDay: 1,
  };
  const d1_104 = calculateDay('2026-05-13', config104Ref); // J1 Jour
  const d5_104 = calculateDay('2026-05-17', config104Ref); // J5 Jour
  const d10_104 = calculateDay('2026-05-22', config104Ref); // J10 Jour (aucun poste de nuit)
  const d11_104 = calculateDay('2026-05-23', config104Ref); // J11 Repos
  const d14_104 = calculateDay('2026-05-26', config104Ref); // J14 Repos
  const d15_104 = calculateDay('2026-05-27', config104Ref); // J15 reboucle J1 Jour
  const pattern104PureDayValid =
    d1_104.shiftType === 'DAY' &&
    d5_104.shiftType === 'DAY' &&
    d10_104.shiftType === 'DAY' &&
    d11_104.shiftType === 'OFF' &&
    d14_104.shiftType === 'OFF' &&
    d15_104.cycleDay === 1 &&
    d15_104.shiftType === 'DAY' &&
    d1_104.totalCycleDays === 14;

  assert(
    'T20_SHIFT_PATTERN_10_4_PURE_DAY',
    'Rotations Multi-Patterns',
    'Pattern 10/4 sans nuit : J1-J10 Jour (boulot), J11-J14 Repos (4j), rebouclage J15=J1',
    pattern104PureDayValid,
    'J1-J10 DAY, J11-J14 OFF, J15=J1 DAY, Total=14j (0 nuit)',
    `J1=${d1_104.shiftType}, J10=${d10_104.shiftType}, J11=${d11_104.shiftType}, J14=${d14_104.shiftType}, J15_CycleDay=${d15_104.cycleDay}`
  );

  // 17. CALAGE OFFICIEL DES ÉQUIPES EN 6/3 POUR LE 2026-11-01 :
  // - Équipe A : 2e jour de repos => J8/9 (OFF)
  // - Équipe B : 2e jour de boulot => J2/9 (DAY)
  // - Équipe C : 2e nuit => J5/9 (NIGHT)
  const cfg63_A = getCalibratedConfig('6/3', 'A');
  const cfg63_B = getCalibratedConfig('6/3', 'B');
  const cfg63_C = getCalibratedConfig('6/3', 'C');
  const day_63_A = calculateDay(DEFAULT_ANCHOR_DATE, cfg63_A);
  const day_63_B = calculateDay(DEFAULT_ANCHOR_DATE, cfg63_B);
  const day_63_C = calculateDay(DEFAULT_ANCHOR_DATE, cfg63_C);

  const calib63Valid =
    day_63_A.cycleDay === 8 && day_63_A.shiftType === 'OFF' && day_63_A.phaseLabel === '2e jour de repos' &&
    day_63_B.cycleDay === 2 && day_63_B.shiftType === 'DAY' && day_63_B.phaseLabel === '2e jour de boulot' &&
    day_63_C.cycleDay === 5 && day_63_C.shiftType === 'NIGHT' && day_63_C.phaseLabel === '2e nuit';

  assert(
    'T21_CALIBRATION_6_3_TEAMS_TODAY',
    'Calage Réel Équipes 6/3',
    '2026-11-01 en 6/3 : Équipe A = 2e jour repos (J8), Équipe B = 2e jour boulot (J2), Équipe C = 2e nuit (J5)',
    calib63Valid,
    'A=J8 (2e repos), B=J2 (2e boulot), C=J5 (2e nuit)',
    `A=J${day_63_A.cycleDay} (${day_63_A.phaseLabel}), B=J${day_63_B.cycleDay} (${day_63_B.phaseLabel}), C=J${day_63_C.cycleDay} (${day_63_C.phaseLabel})`
  );

  // 18. CALAGE OFFICIEL DES ÉQUIPES EN 10/4 POUR LE 2026-11-01 :
  // - Équipe A : 4e jour de boulot => J4/14 (DAY)
  // - Équipe B : 10e jour de boulot => J10/14 (DAY)
  // - Équipe C : 4e jour de repos => J14/14 (OFF)
  const cfg104_A = getCalibratedConfig('10/4', 'A');
  const cfg104_B = getCalibratedConfig('10/4', 'B');
  const cfg104_C = getCalibratedConfig('10/4', 'C');
  const day_104_A = calculateDay(DEFAULT_ANCHOR_DATE, cfg104_A);
  const day_104_B = calculateDay(DEFAULT_ANCHOR_DATE, cfg104_B);
  const day_104_C = calculateDay(DEFAULT_ANCHOR_DATE, cfg104_C);

  const calib104Valid =
    day_104_A.cycleDay === 4 && day_104_A.shiftType === 'DAY' && day_104_A.phaseLabel === '4e jour de boulot' &&
    day_104_B.cycleDay === 10 && day_104_B.shiftType === 'DAY' && day_104_B.phaseLabel === '10e jour de boulot' &&
    day_104_C.cycleDay === 14 && day_104_C.shiftType === 'OFF' && day_104_C.phaseLabel === '4e jour de repos';

  assert(
    'T22_CALIBRATION_10_4_TEAMS_TODAY',
    'Calage Réel Équipes 10/4',
    '2026-11-01 en 10/4 : Équipe A = 4e jour boulot (J4), Équipe B = 10e jour boulot (J10), Équipe C = 4e jour repos (J14)',
    calib104Valid,
    'A=J4 (4e boulot), B=J10 (10e boulot), C=J14 (4e repos)',
    `A=J${day_104_A.cycleDay} (${day_104_A.phaseLabel}), B=J${day_104_B.cycleDay} (${day_104_B.phaseLabel}), C=J${day_104_C.cycleDay} (${day_104_C.phaseLabel})`
  );

  // 19. ÉTAT SIMULTANÉ DES 3 ÉQUIPES VIA getAllTeamsStatus
  const allTeamsStatus = getAllTeamsStatus(DEFAULT_ANCHOR_DATE, '6/3', 'A');
  const allTeamsValid =
    allTeamsStatus.length === 3 &&
    allTeamsStatus[0].team === 'A' && allTeamsStatus[0].isUserTeam === true &&
    allTeamsStatus[1].team === 'B' && allTeamsStatus[1].cycleDay === 2 &&
    allTeamsStatus[2].team === 'C' && allTeamsStatus[2].cycleDay === 5;

  assert(
    'T23_ALL_TEAMS_STATUS_HELPER',
    'Vue Multi-Équipes',
    'getAllTeamsStatus calcule simultanément les 3 équipes avec détection de l\'équipe active',
    allTeamsValid,
    '3 équipes calculées avec A active',
    allTeamsValid ? '3 équipes synchronisées' : 'Erreur calcul multi-équipes'
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    executionTimestamp: new Date().toISOString(),
    results,
  };
}
