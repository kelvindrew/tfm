/**
 * TFM SCHEDULER — Exécuteur Principal de Toutes les Suites de Tests (30 tests)
 */

import { runOvertimeEngineTests } from './overtimeEngine.test';
import { runRotationEngineTests } from './rotationEngine.test';
import { runSecurityEngineTests } from './securityEngine.test';

async function main() {
  console.log('========================================================================');
  console.log('TFM SCHEDULER — EXÉCUTION DES SUITES DE TESTS AUTOMATISÉES');
  console.log('========================================================================\n');

  const rotSummary = runRotationEngineTests();
  console.log(`[SUITE 1/3] Moteur de Rotation 9 jours : ${rotSummary.passed}/${rotSummary.total} tests validés.`);

  const secSummary = await runSecurityEngineTests();
  console.log(`[SUITE 2/3] Sécurité, RBAC & Cloisonnement : ${secSummary.passed}/${secSummary.total} tests validés.`);

  const ovSummary = runOvertimeEngineTests();
  console.log(`[SUITE 3/3] Calculateur Heures Sup. & Cycle 9j : ${ovSummary.passed}/${ovSummary.total} tests validés.\n`);

  const total = rotSummary.total + secSummary.total + ovSummary.total;
  const passed = rotSummary.passed + secSummary.passed + ovSummary.passed;
  const failed = rotSummary.failed + secSummary.failed + ovSummary.failed;

  console.log('------------------------------------------------------------------------');
  console.log(`BILAN GLOBAL : ${passed}/${total} TESTS VALIDÉS (Échecs : ${failed})`);
  console.log('------------------------------------------------------------------------\n');

  if (failed > 0) {
    console.error('Certains tests ont échoué.');
    process.exit(1);
  } else {
    console.log('Tous les tests sont au vert. Intégrité vérifiée.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Erreur inattendue durant les tests:', err);
  process.exit(1);
});
