/**
 * TFM SCHEDULER — Suite de Tests du Moteur d'Heures Supplémentaires (Cycle 9 Jours)
 */

import { calculateCycleOvertime } from './overtimeEngine';

export interface OvertimeTestResult {
  id: string;
  category: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export interface OvertimeTestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  results: OvertimeTestResult[];
}

export function runOvertimeEngineTests(): OvertimeTestSuiteSummary {
  const results: OvertimeTestResult[] = [];

  const record = (
    id: string,
    category: string,
    name: string,
    passed: boolean,
    expected: string,
    actual: string
  ) => {
    results.push({ id, category, name, passed, expected, actual });
  };

  // Test 1 : Cycle Standard 9 jours (72h au total, 48h base, 24h HS)
  const std = calculateCycleOvertime({
    baseHourlyRateUSD: 3.96,
    restDayCallIns: 0,
    handoverExtraHours: 0,
    includeNightBonus: true,
    projectionMode: 'cycle',
  });

  record(
    'OV-01',
    'Cycle 9j Standard',
    'Total des heures travaillées sur cycle 9j standard (6 postes x 12h = 72h)',
    std.totalHoursWorked === 72,
    '72h',
    `${std.totalHoursWorked}h`
  );

  record(
    'OV-02',
    'Cycle 9j Standard',
    'Base contractuelle légale (6 jours x 8h = 48h normales)',
    std.contractualBaseHours === 48,
    '48h',
    `${std.contractualBaseHours}h`
  );

  record(
    'OV-03',
    'Cycle 9j Standard',
    'Heures sup structurelles HS 130% (9e et 10e heure = 12h)',
    std.structuralHS130Hours === 12,
    '12h',
    `${std.structuralHS130Hours}h`
  );

  record(
    'OV-04',
    'Cycle 9j Standard',
    'Heures sup structurelles HS 160% (11e et 12e heure = 12h)',
    std.structuralHS160Hours === 12,
    '12h',
    `${std.structuralHS160Hours}h`
  );

  record(
    'OV-05',
    'Cycle 9j Standard',
    'Total des heures supplémentaires standard du cycle (12h + 12h = 24h)',
    std.totalOvertimeHours === 24,
    '24h',
    `${std.totalOvertimeHours}h`
  );

  record(
    'OV-06',
    'Cycle 9j Standard',
    'Heures de poste de nuit soumises à majoration (3 nuits x 12h = 36h)',
    std.nightHours === 36,
    '36h',
    `${std.nightHours}h`
  );

  // Test 2 : Rappel sur Jour de Repos (J7, J8 ou J9)
  const oneCallIn = calculateCycleOvertime({
    baseHourlyRateUSD: 3.96,
    restDayCallIns: 1,
    handoverExtraHours: 0,
    includeNightBonus: true,
    projectionMode: 'cycle',
  });

  record(
    'OV-07',
    'Rappels sur Repos',
    'Total heures travaillées avec 1 rappel sur repos (72h + 12h = 84h)',
    oneCallIn.totalHoursWorked === 84,
    '84h',
    `${oneCallIn.totalHoursWorked}h`
  );

  record(
    'OV-08',
    'Rappels sur Repos',
    'Heures payées à 200% pour 1 rappel sur repos (12h)',
    oneCallIn.restDayHS200Hours === 12,
    '12h',
    `${oneCallIn.restDayHS200Hours}h`
  );

  record(
    'OV-09',
    'Rappels sur Repos',
    'Montant financier HS 200% = 12h x 3.96 x 2.0 = $95.04',
    oneCallIn.amountHS200USD === 95.04,
    '$95.04',
    `$${oneCallIn.amountHS200USD}`
  );

  // Test 3 : Relève prolongée / Dépannage
  const withHandover = calculateCycleOvertime({
    baseHourlyRateUSD: 3.96,
    restDayCallIns: 0,
    handoverExtraHours: 4,
    includeNightBonus: true,
    projectionMode: 'cycle',
  });

  record(
    'OV-10',
    'Relève Prolongée',
    'Heures HS 160% avec 4h de relève prolongée (12h + 4h = 16h)',
    withHandover.totalHS160Hours === 16,
    '16h',
    `${withHandover.totalHS160Hours}h`
  );

  record(
    'OV-11',
    'Relève Prolongée',
    'Total heures supplémentaires avec relève (24h + 4h = 28h)',
    withHandover.totalOvertimeHours === 28,
    '28h',
    `${withHandover.totalOvertimeHours}h`
  );

  // Test 4 : Projection Mensuelle (30 jours)
  const monthly = calculateCycleOvertime({
    baseHourlyRateUSD: 3.96,
    restDayCallIns: 0,
    handoverExtraHours: 0,
    includeNightBonus: true,
    projectionMode: 'month',
  });

  record(
    'OV-12',
    'Projection Mensuelle',
    'Total heures travaillées projetées sur 30 jours (72h x 30/9 = 240h)',
    monthly.totalHoursWorked === 240,
    '240h',
    `${monthly.totalHoursWorked}h`
  );

  record(
    'OV-13',
    'Projection Mensuelle',
    'Total heures sup projetées sur 30 jours (24h x 30/9 = 80h)',
    monthly.totalOvertimeHours === 80,
    '80h',
    `${monthly.totalOvertimeHours}h`
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    results,
  };
}
