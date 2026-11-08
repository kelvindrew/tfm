/**
 * TFM SCHEDULER — Exécuteur Principal de Toutes les Suites de Tests (30 tests)
 */

import { runRotationEngineTests } from './rotationEngine.test';
import { runSecurityEngineTests } from './securityEngine.test';

async function main() {
  console.log('========================================================================');
  console.log('TFM SCHEDULER — EXÉCUTION DES SUITES DE TESTS AUTOMATISÉES');
  console.log('========================================================================\n');

  const rotSummary = runRotationEngineTests();
  console.log(`[SUITE 1/2] Moteur de Rotation 9 jours : ${rotSummary.passed}/${rotSummary.total} tests validés.`);

  const secSummary = await runSecurityEngineTests();
  console.log(`[SUITE 2/2] Sécurité, RBAC & Cloisonnement : ${secSummary.passed}/${secSummary.total} tests validés.\n`);

  const total = rotSummary.total + secSummary.total;
  const passed = rotSummary.passed + secSummary.passed;
  const failed = rotSummary.failed + secSummary.failed;

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
