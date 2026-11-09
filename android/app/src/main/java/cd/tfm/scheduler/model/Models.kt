package cd.tfm.scheduler.model

import java.time.LocalDate

enum class ShiftType(val labelFr: String, val shortCode: String, val startHour: Int, val endHour: Int) {
    DAY("Travail de Jour", "JOUR", 6, 18),
    NIGHT("Travail de Nuit", "NUIT", 18, 6),
    REST("Repos", "REPOS", 0, 0);

    val isWork: Boolean get() = this != REST
}

enum class Landmark(val code: String, val label: String, val cycleDay: Int) {
    A("A", "Repère A (Fin Repos)", 9),
    B("B", "Repère B (Nuit 2)", 5),
    C("C", "Repère C (Fin Repos)", 9)
}

data class CycleDayResult(
    val date: LocalDate,
    val cycleDay: Int, // 1 to 9
    val shiftType: ShiftType,
    val landmark: Landmark?,
    val isWork: Boolean,
    val shiftHours: String,
    val daysUntilNextTransition: Int,
    val nextShiftType: ShiftType
)

data class UserProfile(
    val id: String = "EMP-84920",
    val name: String = "Patrick Kalonji",
    val role: String = "Superviseur Extraction",
    val department: String = "Mining Operations - Zone Sud",
    val assignedLandmark: Landmark = Landmark.A,
    val biometricsEnabled: Boolean = true,
    val notificationsEnabled: Boolean = true
)

data class Announcement(
    val id: String,
    val title: String,
    val category: String, // "HSE", "ADMIN", "MAINT", "NEWS"
    val date: String,
    val summary: String,
    val content: String,
    val isRead: Boolean = false,
    val priority: String = "NORMAL" // "HIGH", "NORMAL", "URGENT"
)

data class Channel(
    val id: String,
    val name: String,
    val description: String,
    val unreadCount: Int = 0,
    val lastMessageTime: String,
    val lastMessagePreview: String
)

data class ChatMessage(
    val id: String,
    val channelId: String,
    val senderName: String,
    val senderRole: String,
    val text: String,
    val timestamp: String,
    val isMe: Boolean = false
)

data class PaySlip(
    val id: String,
    val month: String,
    val grossSalary: String,
    val netSalary: String,
    val daysWorked: Int,
    val overtimeHours: Double,
    val pdfUrl: String
)
