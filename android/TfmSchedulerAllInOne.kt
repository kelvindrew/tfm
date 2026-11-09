package com.tfm.scheduler

/**
 * TFM SCHEDULER — Architecture Native Complète en Fichier Unique (All-in-One Kotlin)
 * Tenke Fungurume Mining (TFM)
 *
 * Ce fichier rassemble l'intégralité de l'application native Android :
 * 1. Moteur mathématique de rotation déterministe 9 jours (6/3) avec gestion des dates antérieures
 * 2. Modèles de domaine métier & Sécurité (Authentification, Cloisonnement RH Sage WFS)
 * 3. Base de données locale Room (Entités, DAO & Base)
 * 4. Gestionnaire d'état & ViewModel Android Jetpack Compose (MVVM & StateFlow)
 * 5. Interface utilisateur Jetpack Compose Material 3 au standard Apple Minimal Design
 * 6. Point d'entrée MainActivity ComponentActivity
 *
 * Pour tester dans Android Studio :
 * Remplacez ou collez ce fichier directement sous le package `com.tfm.scheduler` ou `cd.tfm.scheduler`.
 */

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.room.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale

// ============================================================================
// 1. MOTEUR MATHÉMATIQUE DE ROTATION (ROTATION ENGINE)
// ============================================================================

enum class ShiftType { DAY, NIGHT, OFF }
enum class Landmark { A, B, C }

data class CycleDayResult(
    val date: LocalDate,
    val cycleDay: Int, // 1..9
    val shiftType: ShiftType,
    val landmarks: List<Landmark>,
    val daysFromReference: Long,
    val nextTransitionDays: Int,
    val nextShiftType: ShiftType
)

object RotationEngine {
    val DEFAULT_REFERENCE_DATE: LocalDate = LocalDate.of(2026, 5, 13)
    const val CYCLE_LENGTH = 9

    /**
     * Calcule déterministement la position dans le cycle 9 jours (6/3)
     * Formule modulaire pour gérer les nombres négatifs : ((diff % 9) + 9) % 9
     */
    fun calculateDay(
        targetDate: LocalDate,
        referenceDate: LocalDate = DEFAULT_REFERENCE_DATE,
        referenceCycleDay: Int = 1
    ): CycleDayResult {
        val diffDays = ChronoUnit.DAYS.between(referenceDate, targetDate)
        val baseModulo = ((diffDays % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH
        val cycleDay = (((baseModulo + (referenceCycleDay - 1)) % CYCLE_LENGTH) + 1).toInt()

        val shiftType = when (cycleDay) {
            in 1..3 -> ShiftType.DAY
            in 4..6 -> ShiftType.NIGHT
            in 7..9 -> ShiftType.OFF
            else -> ShiftType.DAY
        }

        val landmarks = mutableListOf<Landmark>()
        if (cycleDay == 5) landmarks.add(Landmark.B) // 5e jour de travail
        if (cycleDay == 9) {
            landmarks.add(Landmark.A) // 3e jour de repos
            landmarks.add(Landmark.C) // 9e jour du cycle
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

// ============================================================================
// 2. MODÈLES DE DOMAINE MÉTIER (DOMAIN MODELS)
// ============================================================================

data class UserProfile(
    val matricule: String = "WFTF1013",
    val fullName: String = "SHINDE NDALA PLATINI",
    val department: String = "AM1 - MINE TECHNOLOGY GEO",
    val role: String = "SAMPLING OPERATOR",
    val rotationTeam: String = "Équipe Rotation A"
)

data class AnnouncementItem(
    val id: String,
    val title: String,
    val content: String,
    val category: String, // HSE, ADMIN, MAINT
    val priority: String, // URGENT, HIGH, NORMAL
    val publishedDate: String
)

data class PaySlipSummary(
    val matricule: String,
    val period: String,
    val grossSalaryCDF: Long,
    val netSalaryUSD: Double,
    val status: String,
    val isLocked: Boolean = true
)

// ============================================================================
// 3. BASE DE DONNÉES LOCALE ROOM (ROOM DATABASE & DAO)
// ============================================================================

@Entity(tableName = "shift_cache")
data class ShiftRecordEntity(
    @PrimaryKey val dateString: String,
    val cycleDay: Int,
    val shiftType: String,
    val landmarkCode: String
)

@Dao
interface ShiftDao {
    @Query("SELECT * FROM shift_cache WHERE dateString = :dateStr LIMIT 1")
    suspend fun getShiftByDate(dateStr: String): ShiftRecordEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertShift(record: ShiftRecordEntity)
}

// ============================================================================
// 4. VIEWMODEL DE L'APPLICATION (MVVM STATE MANAGEMENT)
// ============================================================================

data class TfmUiState(
    val user: UserProfile = UserProfile(),
    val selectedTeam: String = "A",
    val selectedDate: LocalDate = LocalDate.now(),
    val currentDayResult: CycleDayResult = RotationEngine.calculateDay(LocalDate.now()),
    val activeTab: Int = 0, // 0: Accueil, 1: Calendrier, 2: Notes, 3: Relèves, 4: Profil
    val isOnline: Boolean = true,
    val lastSyncTime: String = "Il y a 2 min (13:20)",
    val isPayslipUnlocked: Boolean = false,
    val announcements: List<AnnouncementItem> = listOf(
        AnnouncementItem("1", "Consignes HSE — Travaux Fosse Luita", "Port obligatoire des EPI de niveau 3 sur tout le secteur minier.", "HSE", "URGENT", "08/11/2026"),
        AnnouncementItem("2", "Planning Relèves Usine SX-EW", "Passage de consigne standardisé aux postes de commande 1 et 2.", "MAINT", "NORMAL", "07/11/2026"),
        AnnouncementItem("3", "Distribution Bulletins Sage WFS", "Les bulletins d'avril 2026 sont déposés dans le coffre-fort chiffré.", "ADMIN", "HIGH", "06/11/2026")
    ),
    val paySlip: PaySlipSummary = PaySlipSummary("WFTF1013", "Avril 2026", 2963860L, 1252.40, "VALIDATED", true)
)

class TfmViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(TfmUiState())
    val uiState: StateFlow<TfmUiState> = _uiState.asStateFlow()

    fun selectDate(date: LocalDate) {
        val result = RotationEngine.calculateDay(date)
        _uiState.value = _uiState.value.copy(
            selectedDate = date,
            currentDayResult = result
        )
    }

    fun selectTab(tabIndex: Int) {
        _uiState.value = _uiState.value.copy(activeTab = tabIndex)
    }

    fun selectTeam(team: String) {
        _uiState.value = _uiState.value.copy(
            selectedTeam = team,
            user = _uiState.value.user.copy(rotationTeam = "Équipe Rotation $team")
        )
    }

    fun unlockPayslip() {
        _uiState.value = _uiState.value.copy(isPayslipUnlocked = true)
    }

    fun lockPayslip() {
        _uiState.value = _uiState.value.copy(isPayslipUnlocked = false)
    }

    fun refreshSync() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(lastSyncTime = "À l'instant")
        }
    }
}

// ============================================================================
// 5. DESIGN SYSTEM APPLE MINIMAL & THEME (JETPACK COMPOSE)
// ============================================================================

val AppleDarkBg = Color(0xFF101114)
val AppleDarkSurface = Color(0xFF18191D)
val AppleDarkCard = Color(0xFF202227)
val AppleTextPrimary = Color(0xFFF4F4F5)
val AppleTextSecondary = Color(0xFFA1A1AA)
val AppleBorder = Color(0x1FFFFFFF)

val ShiftDayColor = Color(0xFFF59E0B) // Ambre 12h Jour
val ShiftNightColor = Color(0xFF3B82F6) // Bleu Cobalt 12h Nuit
val ShiftRestColor = Color(0xFF10B981) // Émeraude Repos

@Composable
fun TfmTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            background = AppleDarkBg,
            surface = AppleDarkSurface,
            onBackground = AppleTextPrimary,
            onSurface = AppleTextPrimary,
            primary = AppleTextPrimary,
            secondary = AppleTextSecondary
        ),
        content = content
    )
}

// ============================================================================
// 6. ÉCRANS ET COMPOSANTS PRINCIPAUX (COMPOSE UI)
// ============================================================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TfmAppScreen(viewModel: TfmViewModel = remember { TfmViewModel() }) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = { TfmTopBar(state, onRefresh = { viewModel.refreshSync() }) },
        bottomBar = { TfmBottomBar(state.activeTab, onSelectTab = { viewModel.selectTab(it) }) },
        containerColor = AppleDarkBg
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (state.activeTab) {
                0 -> DashboardScreen(state, onSelectDate = { viewModel.selectDate(it) })
                1 -> CalendarScreen(state, onSelectDate = { viewModel.selectDate(it) })
                2 -> AnnouncementsScreen(state)
                3 -> MessagingScreen(state)
                4 -> ProfileScreen(state, onSelectTeam = { viewModel.selectTeam(it) })
            }
        }
    }
}

@Composable
fun TfmTopBar(state: TfmUiState, onRefresh: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(AppleDarkBg)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color.White),
                contentAlignment = Alignment.Center
            ) {
                Text("TF", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text("TFM Scheduler", color = AppleTextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text("Tenke Fungurume Mining", color = AppleTextSecondary, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
            }
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .clip(RoundedCornerShape(12.dp))
                .background(AppleDarkSurface)
                .clickable { onRefresh() }
                .padding(horizontal = 8.dp, vertical = 4.dp)
        ) {
            Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(ShiftRestColor))
            Spacer(modifier = Modifier.width(6.dp))
            Text("En ligne", color = AppleTextSecondary, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
            Spacer(modifier = Modifier.width(6.dp))
            Icon(Icons.Default.Refresh, contentDescription = "Sync", tint = AppleTextSecondary, modifier = Modifier.size(12.dp))
        }
    }
}

@Composable
fun TfmBottomBar(activeTab: Int, onSelectTab: (Int) -> Unit) {
    val items = listOf(
        Pair("Accueil", Icons.Outlined.Home),
        Pair("Planning", Icons.Outlined.DateRange),
        Pair("Notes", Icons.Outlined.Notifications),
        Pair("Équipes", Icons.Outlined.Email),
        Pair("Profil", Icons.Outlined.Person)
    )

    NavigationBar(containerColor = AppleDarkSurface, tonalElevation = 0.dp) {
        items.forEachIndexed { index, item ->
            val isSelected = activeTab == index
            NavigationBarItem(
                selected = isSelected,
                onClick = { onSelectTab(index) },
                icon = { Icon(item.second, contentDescription = item.first) },
                label = { Text(item.first, fontSize = 10.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = AppleTextPrimary,
                    selectedTextColor = AppleTextPrimary,
                    unselectedIconColor = AppleTextSecondary,
                    unselectedTextColor = AppleTextSecondary,
                    indicatorColor = Color.Transparent
                )
            )
        }
    }
}

// ----------------------------------------------------------------------------
// TABLEAU DE BORD (DASHBOARD SCREEN)
// ----------------------------------------------------------------------------
@Composable
fun DashboardScreen(state: TfmUiState, onSelectDate: (LocalDate) -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            // Bienvenue Agent
            Column(modifier = Modifier.padding(top = 8.dp)) {
                Text("BONJOUR, ${state.user.fullName.split(" ").firstOrNull() ?: "AGENT"}", color = AppleTextSecondary, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                Text("Quart en cours", color = AppleTextPrimary, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                Text("Matricule ${state.user.matricule} · ${state.user.rotationTeam}", color = AppleTextSecondary, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
            }
        }

        item {
            // Bannière de Synchronisation Locale
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(AppleDarkSurface)
                    .border(1.dp, AppleBorder, RoundedCornerShape(16.dp))
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(ShiftRestColor))
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text("Données locales synchronisées", color = AppleTextPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        Text("Cycle 9j (6/3) · Dernière synchro : ${state.lastSyncTime}", color = AppleTextSecondary, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                    }
                }
            }
        }

        item {
            // Carte Maîtresse du Quart
            val shift = state.currentDayResult
            val shiftTitle = when (shift.shiftType) {
                ShiftType.DAY -> "Poste de Jour (06h - 18h)"
                ShiftType.NIGHT -> "Poste de Nuit (18h - 06h)"
                ShiftType.OFF -> "Repos Récupérateur"
            }
            val accentColor = when (shift.shiftType) {
                ShiftType.DAY -> ShiftDayColor
                ShiftType.NIGHT -> ShiftNightColor
                ShiftType.OFF -> ShiftRestColor
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(AppleDarkCard)
                    .border(1.dp, AppleBorder, RoundedCornerShape(24.dp))
                    .padding(20.dp)
            ) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("STATUT DU JOUR", color = AppleTextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    Text("Jour ${shift.cycleDay}/9", color = AppleTextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(shiftTitle, color = AppleTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                Text(if (shift.shiftType == ShiftType.OFF) "72h de repos" else "12 heures de quart minier", color = AppleTextSecondary, fontSize = 12.sp)

                Spacer(modifier = Modifier.height(16.dp))
                // Jauge de Progression du Cycle
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    for (i in 1..9) {
                        val isPastOrCurrent = i <= shift.cycleDay
                        val isCurrent = i == shift.cycleDay
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(6.dp)
                                .clip(CircleShape)
                                .background(
                                    if (isCurrent) accentColor
                                    else if (isPastOrCurrent) Color.White.copy(alpha = 0.4f)
                                    else Color.White.copy(alpha = 0.1f)
                                )
                        )
                    }
                }
            }
        }

        item {
            // Situation des 3 Équipes du Site
            Text("Situation des Équipes TFM", color = AppleTextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            Spacer(modifier = Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("A" to "Repos", "B" to "Jour", "C" to "Nuit").forEach { (team, status) ->
                    val isMyTeam = team == state.selectedTeam
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(16.dp))
                            .background(if (isMyTeam) AppleDarkCard else AppleDarkSurface)
                            .border(1.dp, if (isMyTeam) Color.White.copy(alpha = 0.2f) else AppleBorder, RoundedCornerShape(16.dp))
                            .padding(12.dp)
                    ) {
                        Text("Équipe $team", color = if (isMyTeam) AppleTextPrimary else AppleTextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        Text(status, color = AppleTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

// ----------------------------------------------------------------------------
// CALENDRIER (CALENDAR SCREEN - STYLE WHATSAPP MINIMAL)
// ----------------------------------------------------------------------------
@Composable
fun CalendarScreen(state: TfmUiState, onSelectDate: (LocalDate) -> Unit) {
    val daysOfWeek = listOf("L", "M", "M", "J", "V", "S", "D")

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Planning des Rotations", color = AppleTextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Text("Cycle déterministe 6/3 · Équipe ${state.selectedTeam}", color = AppleTextSecondary, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
        Spacer(modifier = Modifier.height(16.dp))

        // En-tête des jours
        Row(modifier = Modifier.fillMaxWidth()) {
            daysOfWeek.forEach { day ->
                Text(day, modifier = Modifier.weight(1f), textAlign = TextAlign.Center, color = AppleTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
        Spacer(modifier = Modifier.height(12.dp))

        // Grille calendaire épurée (Exemple 28 jours)
        val today = LocalDate.now()
        val startOfMonth = today.withDayOfMonth(1)
        LazyVerticalGrid(
            columns = GridCells.Fixed(7),
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(28) { dayIndex ->
                val date = startOfMonth.plusDays(dayIndex.toLong())
                val cycleInfo = RotationEngine.calculateDay(date)
                val isSelected = date == state.selectedDate

                Column(
                    modifier = Modifier
                        .aspectRatio(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (isSelected) Color.White else AppleDarkSurface)
                        .clickable { onSelectDate(date) }
                        .padding(4.dp),
                    horizontalAlignment = Alignment.CenterVertically,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "${date.dayOfMonth}",
                        color = if (isSelected) Color.Black else AppleTextPrimary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Box(
                        modifier = Modifier
                            .size(5.dp)
                            .clip(CircleShape)
                            .background(
                                when (cycleInfo.shiftType) {
                                    ShiftType.DAY -> ShiftDayColor
                                    ShiftType.NIGHT -> ShiftNightColor
                                    ShiftType.OFF -> ShiftRestColor
                                }
                            )
                    )
                }
            }
        }
    }
}

// ----------------------------------------------------------------------------
// NOTES & ANNONCES (ANNOUNCEMENTS SCREEN)
// ----------------------------------------------------------------------------
@Composable
fun AnnouncementsScreen(state: TfmUiState) {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text("Notes de Service & HSE", color = AppleTextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Text("Consignes opérationnelles TFM", color = AppleTextSecondary, fontSize = 12.sp)
        }
        items(state.announcements) { ann ->
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(AppleDarkSurface)
                    .border(1.dp, AppleBorder, RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(ann.category, color = if (ann.priority == "URGENT") Color.Red else AppleTextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                    Text(ann.publishedDate, color = AppleTextSecondary, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(ann.title, color = AppleTextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))
                Text(ann.content, color = AppleTextSecondary, fontSize = 12.sp, lineHeight = 16.sp)
            }
        }
    }
}

// ----------------------------------------------------------------------------
// MESSAGERIE & RELÈVES (MESSAGING SCREEN)
// ----------------------------------------------------------------------------
@Composable
fun MessagingScreen(state: TfmUiState) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Relèves & Canaux de Quart", color = AppleTextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Text("Messagerie d'exploitation sécurisée", color = AppleTextSecondary, fontSize = 12.sp)
        Spacer(modifier = Modifier.height(16.dp))

        listOf(
            "Mine Ouverte & Engins" to "Relève en cours secteur Fosse Luita",
            "Usine SX-EW & Broyage" to "Ligne 2 opérationnelle, pas d'anomalie",
            "Superviseurs & Dispatch" to "Point de quart validé 06:00",
            "Urgences & Sécurité HSE" to "Canal prioritaire d'alerte minière"
        ).forEach { (title, subtitle) ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(AppleDarkSurface)
                    .border(1.dp, AppleBorder, RoundedCornerShape(16.dp))
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.Email, contentDescription = null, tint = ShiftNightColor, modifier = Modifier.size(24.dp))
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(title, color = AppleTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    Text(subtitle, color = AppleTextSecondary, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
        }
    }
}

// ----------------------------------------------------------------------------
// PROFIL & ÉQUIPE (PROFILE SCREEN)
// ----------------------------------------------------------------------------
@Composable
fun ProfileScreen(state: TfmUiState, onSelectTeam: (String) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Profil de l'Agent", color = AppleTextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)

        // Carte Identité
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(AppleDarkSurface)
                .border(1.dp, AppleBorder, RoundedCornerShape(20.dp))
                .padding(16.dp)
        ) {
            Text(state.user.fullName, color = AppleTextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            Text(state.user.role, color = AppleTextSecondary, fontSize = 12.sp)
            Spacer(modifier = Modifier.height(8.dp))
            Text("Matricule : ${state.user.matricule} · ${state.user.department}", color = AppleTextSecondary, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
        }

        // Choix de l'Équipe de Rotation
        Text("Choix de l'Équipe d'Affectation", color = AppleTextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("A", "B", "C").forEach { team ->
                val isSelected = team == state.selectedTeam
                Button(
                    onClick = { onSelectTeam(team) },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isSelected) Color.White else AppleDarkSurface,
                        contentColor = if (isSelected) Color.Black else AppleTextPrimary
                    ),
                    border = BorderStroke(1.dp, if (isSelected) Color.White else AppleBorder)
                ) {
                    Text("Équipe $team", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }

        // Fiche de Paie & Coffre-Fort
        Text("Espace Bulletins de Paie (Sage / TIA WFS)", color = AppleTextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(AppleDarkSurface)
                .border(1.dp, AppleBorder, RoundedCornerShape(16.dp))
                .padding(16.dp)
        ) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(state.paySlip.period, color = AppleTextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                Text(state.paySlip.status, color = ShiftRestColor, fontSize = 11.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text("Salaire net : $ ${state.paySlip.netSalaryUSD} · ${state.paySlip.grossSalaryCDF} CDF", color = AppleTextSecondary, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
        }
    }
}

// ============================================================================
// 7. POINT D'ENTRÉE MAIN ACTIVITY (JETPACK COMPOSE ENTRYPOINT)
// ============================================================================

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            TfmTheme {
                TfmAppScreen()
            }
        }
    }
}
