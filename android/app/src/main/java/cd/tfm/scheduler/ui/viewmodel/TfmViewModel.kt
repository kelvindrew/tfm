package cd.tfm.scheduler.ui.viewmodel

import androidx.lifecycle.ViewModel
import cd.tfm.scheduler.engine.RotationEngine
import cd.tfm.scheduler.model.*
import cd.tfm.scheduler.ui.components.NavigationDestination
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

data class TfmUiState(
    val currentDestination: NavigationDestination = NavigationDestination.ACCUEIL,
    val selectedDate: LocalDate = LocalDate.now(),
    val userProfile: UserProfile = UserProfile(),
    val lastSyncTimestamp: String = "Il y a 2 min",
    val announcements: List<Announcement> = listOf(
        Announcement(
            id = "ann-1",
            title = "Maintenance préventive Convoyeur C-04",
            category = "MAINT",
            date = "Aujourd'hui, 08:30",
            summary = "Arrêt programmé du convoyeur principal pour révision des tambours de commande.",
            content = "L'équipe mécanique interviendra entre 10h et 14h. Les opérateurs de la zone Sud doivent sécuriser les accès et basculer sur le circuit de déviation B.",
            isRead = false,
            priority = "HIGH"
        ),
        Announcement(
            id = "ann-2",
            title = "Alerte Météo & HSE — Pluies intenses",
            category = "HSE",
            date = "Hier, 16:15",
            summary = "Vigilance renforcée sur les pistes de roulage de la fosse Tenke.",
            content = "Réduction de la vitesse maximale à 25 km/h pour les dumpers CAT 793. Distance de sécurité minimale : 50 mètres.",
            isRead = true,
            priority = "URGENT"
        ),
        Announcement(
            id = "ann-3",
            title = "Note administrative : Clôture pointage paie",
            category = "ADMIN",
            date = "05 Nov 2026",
            summary = "Validation obligatoire des fiches de présence avant le 10 du mois.",
            content = "Les superviseurs de quart sont priés de finaliser la validation des heures dans Sage People avant vendredi 18h.",
            isRead = true,
            priority = "NORMAL"
        )
    ),
    val channels: List<Channel> = listOf(
        Channel(
            id = "ch-hse",
            name = "HSE & Sécurité Mine",
            description = "Canal prioritaire urgences et protocoles",
            unreadCount = 2,
            lastMessageTime = "09:42",
            lastMessagePreview = "Vérification des EPI terminée au poste de contrôle."
        ),
        Channel(
            id = "ch-shift",
            name = "Équipe Extraction - Quart B",
            description = "Coordination journalière du quart",
            unreadCount = 0,
            lastMessageTime = "08:15",
            lastMessagePreview = "Relève effectuée avec l'équipe A."
        ),
        Channel(
            id = "ch-admin",
            name = "RH & Paie TFM",
            description = "Informations administratives et plannings",
            unreadCount = 0,
            lastMessageTime = "Hier",
            lastMessagePreview = "Les bulletins d'octobre sont disponibles."
        )
    ),
    val paySlips: List<PaySlip> = listOf(
        PaySlip(
            id = "PAY-2026-10",
            month = "Octobre 2026",
            grossSalary = "3,450.00 USD",
            netSalary = "2,890.50 USD",
            daysWorked = 20,
            overtimeHours = 12.0,
            pdfUrl = "/assets/aistudio/BULLETIN_PAIE_9e3d1351.pdf"
        ),
        PaySlip(
            id = "PAY-2026-09",
            month = "Septembre 2026",
            grossSalary = "3,450.00 USD",
            netSalary = "2,912.00 USD",
            daysWorked = 21,
            overtimeHours = 8.5,
            pdfUrl = "/assets/aistudio/BULLETIN_PAIE_9e3d1351.pdf"
        )
    )
)

class TfmViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(TfmUiState())
    val uiState: StateFlow<TfmUiState> = _uiState.asStateFlow()

    fun navigateTo(dest: NavigationDestination) {
        _uiState.value = _uiState.value.copy(currentDestination = dest)
    }

    fun selectDate(date: LocalDate) {
        _uiState.value = _uiState.value.copy(selectedDate = date)
    }

    fun updateAssignedLandmark(landmark: Landmark) {
        val currentProfile = _uiState.value.userProfile
        _uiState.value = _uiState.value.copy(
            userProfile = currentProfile.copy(assignedLandmark = landmark)
        )
    }

    fun toggleBiometrics(enabled: Boolean) {
        val currentProfile = _uiState.value.userProfile
        _uiState.value = _uiState.value.copy(
            userProfile = currentProfile.copy(biometricsEnabled = enabled)
        )
    }

    fun toggleNotifications(enabled: Boolean) {
        val currentProfile = _uiState.value.userProfile
        _uiState.value = _uiState.value.copy(
            userProfile = currentProfile.copy(notificationsEnabled = enabled)
        )
    }

    fun markAnnouncementRead(id: String) {
        val updated = _uiState.value.announcements.map {
            if (it.id == id) it.copy(isRead = true) else it
        }
        _uiState.value = _uiState.value.copy(announcements = updated)
    }

    fun getCurrentShift(): CycleDayResult {
        return RotationEngine.evaluate(LocalDate.now(), _uiState.value.userProfile.assignedLandmark)
    }

    fun getSelectedDayResult(): CycleDayResult {
        return RotationEngine.evaluate(_uiState.value.selectedDate, _uiState.value.userProfile.assignedLandmark)
    }

    fun getCurrentCycleOverview(): List<CycleDayResult> {
        return RotationEngine.getFullCycle(LocalDate.now())
    }
}
