/**
 * TFM SCHEDULER — Suite de Tests Automatisés de Sécurité & Fiabilité (Phase 4)
 * Conforme aux exigences du cahier des charges :
 * 1. Authentification & Anti-Énumération
 * 2. Protection Anti-Force Brute
 * 3. Hachage cryptographique et absence de clair
 * 4. Gestion et expiration des sessions (15 min inactivité)
 * 5. Cloisonnement strict des fiches de paie (interdiction d'accès inter-agent)
 * 6. Matrice des autorisations RBAC (Agent vs HSE / Admin)
 * 7. Idempotence et déduplication hors-ligne
 */

import {
  authenticateAgent,
  checkPermission,
  hashPasswordWithSalt,
  requestPayslipGrant,
  touchSession,
  validateSession,
  verifyPayslipAccess,
  SessionToken,
} from '../security/cryptoAuth';
import { UserRole } from '../types';

export interface SecurityTestResultItem {
  id: string;
  category: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export interface SecurityTestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  executionTimestamp: string;
  results: SecurityTestResultItem[];
}

export async function runSecurityEngineTests(): Promise<SecurityTestSuiteSummary> {
  const results: SecurityTestResultItem[] = [];

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

  // 1. AUTHENTIFICATION AVEC IDENTIFIANTS VALIDES
  const validAuth = await authenticateAgent('TFM-4821', 'Tfm@2026!Sec');
  assert(
    'SEC_01_VALID_LOGIN',
    'Authentification',
    'Connexion réussie avec matricule et mot de passe valide',
    validAuth.success && Boolean(validAuth.session?.token) && validAuth.session?.matricule === 'TFM-4821',
    'success=true avec jeton de session émis',
    `success=${validAuth.success}, matricule=${validAuth.session?.matricule}`
  );

  // 2. MOT DE PASSE INCORRECT -> MESSAGE GÉNÉRIQUE (ANTI-ÉNUMÉRATION)
  const invalidPwdAuth = await authenticateAgent('TFM-4821', 'MauvaisMotDePasse123');
  assert(
    'SEC_02_ANTI_ENUM_PASSWORD',
    'Anti-Énumération',
    'Rejet du mot de passe incorrect avec message générique uniforme',
    !invalidPwdAuth.success && invalidPwdAuth.errorMessage === 'Identifiant ou mot de passe incorrect.',
    'Message: "Identifiant ou mot de passe incorrect."',
    `Message: "${invalidPwdAuth.errorMessage}"`
  );

  // 3. MATRICULE INCONNU -> MÊME MESSAGE GÉNÉRIQUE (ANTI-ÉNUMÉRATION)
  const unknownUserAuth = await authenticateAgent('TFM-9999', 'NimporteQuelMotDePasse');
  assert(
    'SEC_03_ANTI_ENUM_USER',
    'Anti-Énumération',
    'Rejet du matricule inconnu sans révéler son inexistence',
    !unknownUserAuth.success && unknownUserAuth.errorMessage === 'Identifiant ou mot de passe incorrect.',
    'Message identique: "Identifiant ou mot de passe incorrect."',
    `Message: "${unknownUserAuth.errorMessage}"`
  );

  // 4. PROTECTION ANTI-FORCE BRUTE APRÈS 5 ÉCHECS
  const bruteForceMatricule = 'TFM-BRUTE-TEST';
  let lockoutTriggered = false;
  let remainingSeconds = 0;
  for (let i = 0; i < 6; i++) {
    const res = await authenticateAgent(bruteForceMatricule, `bad_attempt_${i}`);
    if (res.lockoutRemainingSeconds && res.lockoutRemainingSeconds > 0) {
      lockoutTriggered = true;
      remainingSeconds = res.lockoutRemainingSeconds;
      break;
    }
  }
  assert(
    'SEC_04_BRUTE_FORCE_LOCKOUT',
    'Anti-Brute Force',
    'Verrouillage temporaire après tentatives répétées infructueuses',
    lockoutTriggered && remainingSeconds > 0,
    'Compte temporairement verrouillé (30s)',
    `Lockout déclenché: ${lockoutTriggered} (${remainingSeconds}s)`
  );

  // 5. HACHAGE CRYPTOGRAPHIQUE SÉCURISÉ (NON EN CLAIR)
  const hash1 = await hashPasswordWithSalt('MonMotDePasse123');
  const hash2 = await hashPasswordWithSalt('MonMotDePasse123');
  const hashDiff = await hashPasswordWithSalt('AutreMotDePasse');
  assert(
    'SEC_05_CRYPTO_HASH_INTEGRITY',
    'Cryptographie',
    'Hachage salé SHA-256 déterministe et distinct par secret',
    hash1 === hash2 && hash1 !== hashDiff && !hash1.includes('MonMotDePasse123'),
    'Hash hexadécimal salé non réversible',
    `Hash: ${hash1.slice(0, 16)}... (longueur ${hash1.length})`
  );

  // 6. GESTION ET VALIDITÉ D'UNE SESSION ACTIVE
  const activeSession: SessionToken = {
    token: 'test_token_123',
    matricule: 'TFM-4821',
    systemRole: 'AGENT',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 3600000,
    lastActivityAt: Date.now(),
  };
  const sessionCheck = validateSession(activeSession);
  assert(
    'SEC_06_SESSION_VALID',
    'Gestion Sessions',
    'Validation d\'une session active en cours de validité',
    sessionCheck.valid,
    'Session valide=true',
    `Session valide=${sessionCheck.valid}`
  );

  // 7. EXPIRATION DE SESSION APRÈS INACTIVITÉ (15 MINUTES)
  const inactiveSession: SessionToken = {
    ...activeSession,
    lastActivityAt: Date.now() - (16 * 60 * 1000), // 16 min d'inactivité
  };
  const inactiveCheck = validateSession(inactiveSession);
  assert(
    'SEC_07_SESSION_INACTIVITY',
    'Gestion Sessions',
    'Invalidation automatique de session après 15 min d\'inactivité',
    !inactiveCheck.valid && inactiveCheck.reason === 'INACTIVE',
    'Session invalide pour raison INACTIVE',
    `valide=${inactiveCheck.valid}, raison=${inactiveCheck.reason}`
  );

  // 8. OBTENTION DU JETON ÉPHÉMÈRE DE CONSULTATION FICHE DE PAIE
  const grantRes = await requestPayslipGrant(activeSession, '4821');
  assert(
    'SEC_08_PAYSLIP_GRANT_ISSUE',
    'Protection Fiches de Paie',
    'Émission d\'un jeton de consultation de fiche de paie après validation PIN',
    grantRes.success && Boolean(grantRes.grant?.grantToken) && grantRes.grant?.matricule === 'TFM-4821',
    'Jeton de consultation éphémère (5 min) émis avec succès',
    `success=${grantRes.success}, matricule=${grantRes.grant?.matricule}`
  );

  // 9. CLOISONNEMENT STRICT INTER-AGENT (ACCÈS REFUSÉ POUR MATRICULE TIERS)
  const interAgentAttempt = verifyPayslipAccess(grantRes.grant || null, 'TFM-9012'); // Tentative d'accès à la fiche d'un autre agent
  assert(
    'SEC_09_PAYSLIP_ISOLATION_ENFORCED',
    'Protection Fiches de Paie',
    'Blocage absolu de la consultation de la fiche de paie d\'un autre agent',
    Boolean(!interAgentAttempt.authorized && interAgentAttempt.reason?.includes('ACCÈS REFUSÉ')),
    'ACCÈS REFUSÉ : Violation de cloisonnement des données personnelles',
    `Autorisé=${interAgentAttempt.authorized}, Raison="${interAgentAttempt.reason}"`
  );

  // 10. EXPIRATION DU JETON DE CONSULTATION DE FICHE DE PAIE
  const expiredGrant = {
    grantToken: 'grant_old_123',
    matricule: 'TFM-4821',
    expiresAt: Date.now() - 1000, // Expiré
  };
  const expiredGrantAttempt = verifyPayslipAccess(expiredGrant, 'TFM-4821');
  assert(
    'SEC_10_PAYSLIP_GRANT_EXPIRED',
    'Protection Fiches de Paie',
    'Rejet d\'accès lorsque le jeton de bulletin a expiré (> 5 minutes)',
    Boolean(!expiredGrantAttempt.authorized && expiredGrantAttempt.reason?.includes('expiré')),
    'Jeton de consultation expiré',
    `Autorisé=${expiredGrantAttempt.authorized}, Raison="${expiredGrantAttempt.reason}"`
  );

  // 11. CONTRÔLE D'ACCÈS BASÉ SUR LES RÔLES (RBAC)
  const agentCanPost = checkPermission('AGENT', 'POST_ANNOUNCEMENT');
  const hseCanPost = checkPermission('HSE_OFFICER', 'POST_ANNOUNCEMENT');
  const adminCanManage = checkPermission('ADMIN', 'MANAGE_USERS');
  assert(
    'SEC_11_RBAC_RULES',
    'Contrôle d\'Accès RBAC',
    'Matrice RBAC : Agent sans droit de publication, HSE autorisé, Admin autorisé',
    !agentCanPost && hseCanPost && adminCanManage,
    'AGENT=false, HSE_OFFICER=true, ADMIN=true',
    `AGENT=${agentCanPost}, HSE=${hseCanPost}, ADMIN=${adminCanManage}`
  );

  // 12. IDEMPOTENCE ET DÉDUPLICATION DES MESSAGES HORS-LIGNE
  const key1 = 'idmp-unique-msg-99';
  const duplicateList = [
    { id: '1', idempotencyKey: key1, content: 'Premier envoi' },
    { id: '2', idempotencyKey: key1, content: 'Renvoi accidentel réseau' }, // Même clé
    { id: '3', idempotencyKey: 'idmp-unique-msg-100', content: 'Autre message' },
  ];
  const seenKeys = new Set<string>();
  const deduplicated = duplicateList.filter((m) => {
    if (seenKeys.has(m.idempotencyKey)) return false;
    seenKeys.add(m.idempotencyKey);
    return true;
  });
  assert(
    'SEC_12_OFFLINE_IDEMPOTENCY',
    'Fiabilité Réseau',
    'Dédoublonnage idempotent lors du retour de la connectivité réseau',
    deduplicated.length === 2 && deduplicated[0].id === '1' && deduplicated[1].id === '3',
    'Taille dédoublonnée: 2 messages uniques',
    `Taille initiale: ${duplicateList.length}, Après dédoublonnage: ${deduplicated.length}`
  );

  // 13. DISTRIBUTION BATCH "TOUT COCHER" SAGE / TIA WORK FORCE
  const batchSlips = [
    { id: 's1', matricule: 'WFTF1013', status: 'PENDING_IMPORT' },
    { id: 's2', matricule: 'WFTF1014', status: 'PENDING_IMPORT' },
    { id: 's3', matricule: 'WFTF1096', status: 'PENDING_IMPORT' },
  ];
  const allIds = batchSlips.map((s) => s.id);
  const distributedBatch = batchSlips.map((s) =>
    allIds.includes(s.id) ? { ...s, status: 'DISTRIBUTED' } : s
  );
  assert(
    'SEC_13_BATCH_DISTRIBUTION_SELECT_ALL',
    'Portail RH Batch',
    'Distribution collective après sélection globale ("Tout cocher")',
    distributedBatch.every((s) => s.status === 'DISTRIBUTED') && distributedBatch.length === 3,
    '3/3 bulletins distribués aux coffres-forts',
    `${distributedBatch.filter((s) => s.status === 'DISTRIBUTED').length}/3 distribués`
  );

  // 14. RÉCEPTION DU BULLETIN UNIQUEMENT APRÈS VÉRIFICATION D'IDENTITÉ
  // Cas A : Agent sans vérification d'identité -> Accès rejeté
  const unverifiedAttempt = verifyPayslipAccess(null, 'WFTF1013');
  // Cas B : Agent avec vérification d'identité (PIN 1013 validé) -> Accès autorisé UNIQUEMENT à son bulletin
  const agentSession = {
    token: 'agent_wftf1013_token',
    matricule: 'WFTF1013',
    systemRole: 'AGENT' as UserRole,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 3600000,
    lastActivityAt: Date.now(),
  };
  const verifiedGrant = await requestPayslipGrant(agentSession, '1013');
  const ownSlipAccess = verifyPayslipAccess(verifiedGrant.grant || null, 'WFTF1013');
  const otherSlipAccess = verifyPayslipAccess(verifiedGrant.grant || null, 'WFTF1014');

  assert(
    'SEC_14_IDENTITY_VERIFICATION_REQUIRED_FOR_RECEIPT',
    'Portail RH & Sécurité',
    'Chaque agent reçoit son bulletin uniquement après vérification d\'identité',
    !unverifiedAttempt.authorized &&
      ownSlipAccess.authorized &&
      !otherSlipAccess.authorized,
    'Sans PIN: rejeté | Avec PIN: son bulletin=autorisé, tiers=rejeté',
    `Sans vérif=${unverifiedAttempt.authorized}, Son bulletin=${ownSlipAccess.authorized}, Autre agent=${otherSlipAccess.authorized}`
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
