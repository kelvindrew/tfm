/**
 * TFM SCHEDULER — Moteur de Calcul des Heures Supplémentaires (Cycle 9 Jours & Mines RDC)
 * Tenke Fungurume Mining (TFM)
 *
 * Spécifications légales & conventionnelles :
 * - Régime de travail : Cycle 6/3 (9 jours)
 * - 6 postes de 12h = 72 heures de travail par cycle
 * - Base contractuelle légale : 8h/jour x 6 jours = 48 heures normales (Code du Travail RDC)
 * - Heures supplémentaires structurelles du quart 12h :
 *   * 9e et 10e heure : 2h x 6 jours = 12h payées à 130%
 *   * 11e et 12e heure : 2h x 6 jours = 12h payées à 160%
 * - Prestations d'urgence sur repos (J7, J8, J9) : 12h/poste payées à 200%
 * - Heures de nuit : 3 postes de nuit x 12h = 36h avec majoration de +25%
 */

export interface OvertimeCalculationOptions {
  baseHourlyRateUSD: number;
  restDayCallIns: number; // 0 to 3 shifts
  handoverExtraHours: number; // additional extra hours (relève prolongée/dépannage)
  includeNightBonus: boolean;
  projectionMode: 'cycle' | 'month'; // 'cycle' = 9 days, 'month' = 30 days
  usdToCdfRate?: number; // default: 2500
}

export interface OvertimeCalculationResult {
  totalHoursWorked: number;
  contractualBaseHours: number;
  structuralHS130Hours: number;
  structuralHS160Hours: number;
  additionalHS160Hours: number;
  totalHS160Hours: number;
  restDayHS200Hours: number;
  totalOvertimeHours: number;
  nightHours: number;
  baseSalaryUSD: number;
  amountHS130USD: number;
  amountHS160USD: number;
  amountHS200USD: number;
  nightBonusAmountUSD: number;
  totalOvertimeCompensationUSD: number;
  totalGrossEstimateUSD: number;
  totalGrossEstimateCDF: number;
  totalOvertimeCompensationCDF: number;
}

export const USD_TO_CDF_DEFAULT = 2500;

export function calculateCycleOvertime(
  options: OvertimeCalculationOptions
): OvertimeCalculationResult {
  const {
    baseHourlyRateUSD,
    restDayCallIns,
    handoverExtraHours,
    includeNightBonus,
    projectionMode,
    usdToCdfRate = USD_TO_CDF_DEFAULT,
  } = options;

  const cycleMultiplier = projectionMode === 'month' ? 30 / 9 : 1;

  // Données de base d'un cycle 9j (6 jours travaillés de 12h)
  const baseContractualHoursPerCycle = 6 * 8; // 48h normales
  const structuralHS130PerCycle = 6 * 2; // 12h
  const structuralHS160PerCycle = 6 * 2; // 12h
  const additionalHS160PerCycle = Math.max(0, handoverExtraHours);
  const restDayHS200PerCycle = Math.max(0, restDayCallIns) * 12;
  const nightHoursPerCycle = 3 * 12; // 36h de nuit

  // Appliquer le coefficient de projection (cycle vs mois)
  const contractualBaseHours = baseContractualHoursPerCycle * cycleMultiplier;
  const structuralHS130Hours = structuralHS130PerCycle * cycleMultiplier;
  const structuralHS160Hours = structuralHS160PerCycle * cycleMultiplier;
  const additionalHS160Hours = additionalHS160PerCycle * cycleMultiplier;
  const totalHS160Hours = structuralHS160Hours + additionalHS160Hours;
  const restDayHS200Hours = restDayHS200PerCycle * cycleMultiplier;

  const totalOvertimeHours = structuralHS130Hours + totalHS160Hours + restDayHS200Hours;
  const totalHoursWorked = contractualBaseHours + totalOvertimeHours;
  const nightHours = nightHoursPerCycle * cycleMultiplier;

  // Calculs financiers
  const baseSalaryUSD = contractualBaseHours * baseHourlyRateUSD;
  const amountHS130USD = structuralHS130Hours * baseHourlyRateUSD * 1.30;
  const amountHS160USD = totalHS160Hours * baseHourlyRateUSD * 1.60;
  const amountHS200USD = restDayHS200Hours * baseHourlyRateUSD * 2.00;
  const nightBonusAmountUSD = includeNightBonus
    ? nightHours * baseHourlyRateUSD * 0.25
    : 0;

  const totalOvertimeCompensationUSD =
    amountHS130USD + amountHS160USD + amountHS200USD + nightBonusAmountUSD;

  const totalGrossEstimateUSD = baseSalaryUSD + totalOvertimeCompensationUSD;

  const totalGrossEstimateCDF = Math.round(totalGrossEstimateUSD * usdToCdfRate);
  const totalOvertimeCompensationCDF = Math.round(
    totalOvertimeCompensationUSD * usdToCdfRate
  );

  return {
    totalHoursWorked: Math.round(totalHoursWorked * 10) / 10,
    contractualBaseHours: Math.round(contractualBaseHours * 10) / 10,
    structuralHS130Hours: Math.round(structuralHS130Hours * 10) / 10,
    structuralHS160Hours: Math.round(structuralHS160Hours * 10) / 10,
    additionalHS160Hours: Math.round(additionalHS160Hours * 10) / 10,
    totalHS160Hours: Math.round(totalHS160Hours * 10) / 10,
    restDayHS200Hours: Math.round(restDayHS200Hours * 10) / 10,
    totalOvertimeHours: Math.round(totalOvertimeHours * 10) / 10,
    nightHours: Math.round(nightHours * 10) / 10,
    baseSalaryUSD: Math.round(baseSalaryUSD * 100) / 100,
    amountHS130USD: Math.round(amountHS130USD * 100) / 100,
    amountHS160USD: Math.round(amountHS160USD * 100) / 100,
    amountHS200USD: Math.round(amountHS200USD * 100) / 100,
    nightBonusAmountUSD: Math.round(nightBonusAmountUSD * 100) / 100,
    totalOvertimeCompensationUSD:
      Math.round(totalOvertimeCompensationUSD * 100) / 100,
    totalGrossEstimateUSD: Math.round(totalGrossEstimateUSD * 100) / 100,
    totalGrossEstimateCDF,
    totalOvertimeCompensationCDF,
  };
}
