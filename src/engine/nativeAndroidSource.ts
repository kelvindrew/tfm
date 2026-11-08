/**
 * TFM SCHEDULER — Architecture Native Android de Production (Kotlin & Jetpack Compose)
 * Configuration conforme aux exigences Phase 4 :
 * - Target SDK 35, Min SDK 26 (Android 8.0 Oreo à Android 15)
 * - Namespace & Package : cd.tfm.scheduler
 * - Séparation Build Types Debug & Release avec ProGuard / R8
 * - AndroidManifest avec interdiction de trafic en clair et désactivation d'adb backup
 * - Chiffrement matériel des jetons via AndroidX Security (EncryptedSharedPreferences)
 * - Base locale Room avec Clean Architecture
 */

export interface AndroidFileSource {
  path: string;
  language: 'kotlin' | 'groovy' | 'xml';
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidFileSource[] = [
  {
    path: 'app/src/main/java/cd/tfm/scheduler/engine/RotationEngine.kt',
    language: 'kotlin',
    description: 'Moteur indépendant de calcul de rotation 9 jours en Kotlin pur.',
    content: `package cd.tfm.scheduler.engine

import java.time.LocalDate
import java.time.temporal.ChronoUnit

/**
 * TFM SCHEDULER — Moteur de Rotation TFM (Tenke Fungurume Mining)
 * Cycle de 9 jours :
 * - Jours 1 à 3 : Travail de jour (06h00 - 18h00)
 * - Jours 4 à 6 : Travail de nuit (18h00 - 06h00)
 * - Jours 7 à 9 : Repos récupérateur
 * Date d'ancrage obligatoire : 13 mai 2026 (Jour 1 de travail de jour)
 */
object RotationEngine {

    val DEFAULT_REFERENCE_DATE: LocalDate = LocalDate.of(2026, 5, 13)
    const val CYCLE_LENGTH = 9

    enum class ShiftType {
        DAY, NIGHT, OFF
    }

    enum class Landmark {
        A, // 3e jour de repos (Jour 9)
        B, // 5e jour de travail (Jour 5 - 2e nuit)
        C  // 9e jour du cycle (Jour 9)
    }

    data class CycleDayResult(
        val date: LocalDate,
        val cycleDay: Int, // 1..9
        val shiftType: ShiftType,
        val landmarks: List<Landmark>,
        val daysFromReference: Long,
        val nextTransitionDays: Int,
        val nextShiftType: ShiftType
    )

    /**
     * Calcule la position dans le cycle pour n'importe quelle date (passée ou future).
     * Utilise le reste euclidien mathématique pour gérer les dates antérieures à la référence.
     */
    fun calculateDay(
        targetDate: LocalDate,
        referenceDate: LocalDate = DEFAULT_REFERENCE_DATE,
        referenceCycleDay: Int = 1
    ): CycleDayResult {
        val diffDays = ChronoUnit.DAYS.between(referenceDate, targetDate)
        
        // Reste mathématique non-négatif : (diff % 9 + 9) % 9
        val baseModulo = ((diffDays % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH
        val cycleDay = (((baseModulo + (referenceCycleDay - 1)) % CYCLE_LENGTH) + 1).toInt()

        val shiftType = when (cycleDay) {
            in 1..3 -> ShiftType.DAY
            in 4..6 -> ShiftType.NIGHT
            in 7..9 -> ShiftType.OFF
            else -> throw IllegalStateException("Jour de cycle invalide : $cycleDay")
        }

        val landmarks = mutableListOf<Landmark>()
        if (cycleDay == 5) landmarks.add(Landmark.B)
        if (cycleDay == 9) {
            landmarks.add(Landmark.A)
            landmarks.add(Landmark.C)
        }

        val (nextTransitionDays, nextShift) = when (cycleDay) {
            in 1..3 -> Pair(4 - cycleDay, ShiftType.NIGHT)
            in 4..6 -> Pair(7 - cycleDay, ShiftType.OFF)
            else -> Pair(10 - cycleDay, ShiftType.DAY)
        }

        return CycleDayResult(
            date = targetDate,
            cycleDay = cycleDay,
            shiftType = shiftType,
            landmarks = landmarks,
            daysFromReference = diffDays,
            nextTransitionDays = nextTransitionDays,
            nextShiftType = nextShift
        )
    }
}
`,
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    description: 'Manifeste Android durci : permissions ciblées, interdiction de trafic HTTP en clair.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="cd.tfm.scheduler">

    <!-- Permissions requises pour les communications sécurisées et notifications -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />

    <application
        android:name=".TFMSchedulerApp"
        android:allowBackup="false"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.TFMScheduler"
        android:usesCleartextTraffic="false"
        tools:targetApi="35">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.TFMScheduler">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`,
  },
  {
    path: 'app/build.gradle.kts',
    language: 'groovy',
    description: 'Configuration Gradle Android de production : BuildTypes Debug & Release avec R8/ProGuard.',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

android {
    namespace = "cd.tfm.scheduler"
    compileSdk = 35

    defaultConfig {
        applicationId = "cd.tfm.scheduler"
        minSdk = 26
        targetSdk = 35
        versionCode = 20400
        versionName = "2.4.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Clé de signature injectée via variables d'environnement CI/CD sécurisées
            signingConfig = signingConfigs.findByName("release")
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        isCoreLibraryDesugaringEnabled = true
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    
    // Sécurité matérielle & Keystore (AndroidX Security Crypto)
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("androidx.biometric:biometric:1.2.0-alpha05")

    // Persistance locale hors-ligne
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    // Synchronisation en arrière-plan
    implementation("androidx.work:work-runtime-ktx:2.9.1")

    testImplementation(libs.junit)
}
`,
  },
  {
    path: 'app/src/main/java/cd/tfm/scheduler/security/EncryptedStorageManager.kt',
    language: 'kotlin',
    description: 'Gestionnaire de stockage chiffré matériellement avec MasterKey AES-256 GCM.',
    content: `package cd.tfm.scheduler.security

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * TFM SCHEDULER — Stockage Sécurisé Matériel
 * Empêche l'extraction de jetons de session ou d'identifiants même en cas de root de l'appareil.
 */
class EncryptedStorageManager(context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val encryptedPrefs = EncryptedSharedPreferences.create(
        context,
        "tfm_secure_vault_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveSessionToken(token: String) {
        encryptedPrefs.edit().putString("KEY_SESSION_TOKEN", token).apply()
    }

    fun getSessionToken(): String? {
        return encryptedPrefs.getString("KEY_SESSION_TOKEN", null)
    }

    fun clearSession() {
        encryptedPrefs.edit().clear().apply()
    }
}
`,
  },
  {
    path: 'app/src/test/java/cd/tfm/scheduler/RotationEngineTest.kt',
    language: 'kotlin',
    description: 'Suite de tests unitaires JUnit 5 du moteur de rotation.',
    content: `package cd.tfm.scheduler

import cd.tfm.scheduler.engine.RotationEngine
import org.junit.Assert.*
import org.junit.Test
import java.time.LocalDate

class RotationEngineTest {

    @Test
    fun testReferenceDateIsDay1DayShift() {
        val res = RotationEngine.calculateDay(LocalDate.of(2026, 5, 13))
        assertEquals(1, res.cycleDay)
        assertEquals(RotationEngine.ShiftType.DAY, res.shiftType)
    }

    @Test
    fun testThreeDaysDayShift() {
        for (day in 13..15) {
            val res = RotationEngine.calculateDay(LocalDate.of(2026, 5, day))
            assertEquals(RotationEngine.ShiftType.DAY, res.shiftType)
        }
    }

    @Test
    fun testThreeDaysNightShift() {
        for (day in 16..18) {
            val res = RotationEngine.calculateDay(LocalDate.of(2026, 5, day))
            assertEquals(RotationEngine.ShiftType.NIGHT, res.shiftType)
        }
    }

    @Test
    fun testThreeDaysOffShift() {
        for (day in 19..21) {
            val res = RotationEngine.calculateDay(LocalDate.of(2026, 5, day))
            assertEquals(RotationEngine.ShiftType.OFF, res.shiftType)
        }
    }

    @Test
    fun testCycleRestartsAtDay1After9Days() {
        val day10 = RotationEngine.calculateDay(LocalDate.of(2026, 5, 22))
        assertEquals(1, day10.cycleDay)
        assertEquals(RotationEngine.ShiftType.DAY, day10.shiftType)
    }

    @Test
    fun testNegativeDatesBeforeReference() {
        val yesterday = RotationEngine.calculateDay(LocalDate.of(2026, 5, 12))
        assertEquals(9, yesterday.cycleDay)
        assertEquals(RotationEngine.ShiftType.OFF, yesterday.shiftType)
        assertTrue(yesterday.landmarks.contains(RotationEngine.Landmark.A))
        assertTrue(yesterday.landmarks.contains(RotationEngine.Landmark.C))
    }
}
`,
  },
];
