# AUDIT TECHNIQUE ET FONCTIONNEL COMPLET — TFM SCHEDULER
**Application :** TFM Scheduler (Tenke Fungurume Mining)  
**Rôle :** Architecte Logiciel Senior Android & Systèmes Embarqués  
**Date :** Novembre 2026  
**Version analysée :** 2.4.0  

---

## 1. RÉSUMÉ EXÉCUTIF

### État général du projet
TFM Scheduler se trouve actuellement dans une architecture hybride à deux composantes :
1. **Application opérationnelle réelle (Web / Capacitor Android)** : Construite en React 19, TypeScript 5.8, Tailwind CSS v4 et packagée sous Android via `@capacitor/android` avec `MainActivity.java`.
2. **Spécification native Kotlin / Jetpack Compose / Room** : Définie dans `src/engine/nativeAndroidSource.ts` et exportable via l'interface `AndroidCodeExportModal.tsx`.

### Synthèse des forces et faiblesses
* **Points forts** :
  * Déterminisme mathématique absolu du cycle 9 jours (6/3) sans dépendance réseau.
  * Suite de 37 tests unitaires automatisés validés à 100% (rotation, sécurité, anti-force brute, cloisonnement).
  * Cloisonnement individuel strict des fiches de paie conforme à la structure Sage / TIA WORK FORCE Lubumbashi.
  * Design épuré Apple Minimal, mode sombre profond (`#101114`), navigation conforme aux guidelines mobiles.
* **Risques majeurs identifiés** :
  * `android:allowBackup="true"` présent dans `AndroidManifest.xml` (risque d'extraction ADB des jetons).
  * Build release non obfusqué (`minifyEnabled false` dans `android/app/build.gradle`).
  * Incohérence d'Application ID (`com.tfm.scheduler` dans Gradle physique vs `cd.tfm.scheduler` dans la spécification Kotlin).
  * Stockage local des bulletins dans le `localStorage` de la WebView plutôt que dans le Keystore matériel d'Android.

---

## 2. INVENTAIRE DU PROJET

### Arborescence physique
* `android/` : Projet Android généré par Capacitor.
  * `app/build.gradle` : Configuration Gradle (SDK 35, Java 17, `com.tfm.scheduler`).
  * `app/src/main/AndroidManifest.xml` : Manifeste avec permissions Internet, Biométrie, Caméra, Vibreur.
  * `app/src/main/java/com/tfm/scheduler/MainActivity.java` : Point d'entrée Android BridgeActivity.
  * `app/src/main/assets/public/` : Bundle web de production injecté dans la WebView.
* `src/components/` : 18 composants et vues modulaires.
  * `HomeDashboard.tsx` : Tableau de bord opérationnel, progression 9j, situation des 3 équipes.
  * `FullCalendar.tsx` : Calendrier minimaliste 7 colonnes style WhatsApp, sans boutons dupliqués.
  * `PaySlipsView.tsx` : Espace sécurisé des fiches de paie avec sas biométrique et export PDF.
  * `MessagingView.tsx` : Salons de relève d'équipe, messages vocaux, images et QR code.
  * `AnnouncementsView.tsx` : Notes de service catégorisées (HSE, ADMIN, MAINT, NEWS).
  * `ProfileView.tsx` : Choix exclusif de l'équipe (A/B/C), régime de shift, biométrie.
  * `SyncStatusIndicator.tsx` : Voyant de synchronisation temps réel et horodatage dynamique.
  * `TestRunnerModal.tsx` : Console d'exécution en direct des 37 tests unitaires.
  * `AdminPayrollPortalModal.tsx` : Console RH de découpage et distribution de bulletins.
* `src/engine/` :
  * `rotationEngine.ts` : Moteur mathématique de rotation (6/3, 5/2, 10/4).
  * `payrollData.ts` : Données certifiées du document officiel `BULLETIN_PAIE_9e3d1351.pdf`.
  * `nativeAndroidSource.ts` : Code source cible Kotlin, Room, Compose et ProGuard.
* `src/security/cryptoAuth.ts` : Fonctions cryptographiques SHA-256, protection anti-force brute (verrouillage 15 min après 5 échecs), expiration de session éphémère (5 min pour la paie).

---

## 3. TABLEAU DES FONCTIONNALITÉS RÉELLES

| Fonctionnalité | Statut | Preuve dans le code |
| :--- | :--- | :--- |
| Connexion Matricule / PIN | **FONCTIONNELLE** | `LoginView.tsx`, `cryptoAuth.ts:authenticateAgent` |
| Anti-énumération & Anti-brute force | **FONCTIONNELLE** | Messages génériques identiques, lock 15 min (`cryptoAuth.ts:100-142`) |
| Biométrie (Fingerprint / FaceID) | **PARTIELLE** | Interface et simulation prêtes, permissions présentes, appel natif `BiometricPrompt` à lier |
| Moteur de rotation 9 jours (6/3) | **FONCTIONNELLE** | `rotationEngine.ts:getCycleDay()`, 23 tests unitaires validés |
| Repères A, B, C | **FONCTIONNELLE** | B au Jour 5, A et C au Jour 9 (`rotationEngine.ts:280-288`) |
| Calendrier mensuel minimaliste | **FONCTIONNELLE** | `FullCalendar.tsx`, grille WhatsApp 7 colonnes |
| Notes de service & HSE | **FONCTIONNELLE** | `AnnouncementsView.tsx`, contrôle RBAC pour publication |
| Messagerie d'équipes & Relèves | **FONCTIONNELLE** | `MessagingView.tsx`, vocal, texte, pièces jointes, QR share |
| Coffre-fort de fiches de paie | **FONCTIONNELLE** | `PaySlipsView.tsx`, cloisonnement inter-agent absolu, grant 5 min |
| Distribution RH en lot | **FONCTIONNELLE** | `AdminPayrollPortalModal.tsx`, sélection sélective ou collective |
| Choix d'équipe de rotation | **FONCTIONNELLE** | Centralisé dans `ProfileView.tsx`, 0 bouton dupliqué sur le calendrier |

---

## 4. AUDIT CRITIQUE DU MOTEUR DE ROTATION

### Formule modulaire
```kotlin
val diffDays = ChronoUnit.DAYS.between(referenceDate, targetDate)
val baseModulo = ((diffDays % 9) + 9) % 9
val cycleDay = (((baseModulo + (referenceCycleDay - 1)) % 9) + 1).toInt()
```
* **Dates futures** : Exactitude confirmée par tests automatisés.
* **Dates antérieures (modulo négatif)** : Géré mathématiquement par `((diff % 9) + 9) % 9`.
* **Années bissextiles & changements de mois** : Géré sans faille via les calculs en jours époques UTC.
* **Repères A et C au Jour 9** : Les repères A (fin de repos) et C (fin de cycle) tombent le même jour. C'est la règle métier TFM conforme au cahier des charges.

---

## 5. RECOMMANDATIONS TECHNIQUES & SÉCURITÉ

1. **Durcissement Android** :
   * Définir `android:allowBackup="false"` dans `AndroidManifest.xml`.
   * Activer R8/ProGuard avec `minifyEnabled true` et `shrinkResources true`.
   * Unifier l'application ID sur `cd.tfm.scheduler`.
2. **Persistance Matérielle** :
   * Remplacer le `localStorage` par `EncryptedSharedPreferences` (MasterKey AES-256) sur Android natif.
3. **Architecture Cible** :
   * Migration vers Jetpack Compose Material 3 avec Clean Architecture MVVM unifiée.
