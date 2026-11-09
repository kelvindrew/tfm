package cd.tfm.scheduler.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cd.tfm.scheduler.model.ShiftType
import cd.tfm.scheduler.ui.theme.*

@Composable
fun AppleCard(
    modifier: Modifier = Modifier,
    backgroundColor: Color = AppleSurface,
    content: @Composable ColumnScope.() -> Unit
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .border(1.dp, AppleDivider, RoundedCornerShape(16.dp)),
        shape = RoundedCornerShape(16.dp),
        color = backgroundColor
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            content = content
        )
    }
}

@Composable
fun ShiftBadge(
    shiftType: ShiftType,
    modifier: Modifier = Modifier
) {
    val (bgColor, textColor) = when (shiftType) {
        ShiftType.DAY -> Pair(ShiftDayIndicator.copy(alpha = 0.18f), ShiftDayIndicator)
        ShiftType.NIGHT -> Pair(ShiftNightIndicator.copy(alpha = 0.20f), ShiftNightIndicator)
        ShiftType.REST -> Pair(AppleDivider.copy(alpha = 0.5f), AppleTextSecondary)
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(bgColor)
            .padding(horizontal = 8.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = shiftType.shortCode,
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp
        )
    }
}

@Composable
fun SyncStatusBadge(
    lastSyncTime: String,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(AppleSurfaceElevated)
            .padding(horizontal = 10.dp, vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Box(
            modifier = Modifier
                .size(7.dp)
                .clip(CircleShape)
                .background(SuccessGreen)
        )
        Text(
            text = "Synchro : $lastSyncTime",
            color = AppleTextSecondary,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

enum class NavigationDestination(val label: String, val icon: ImageVector, val selectedIcon: ImageVector) {
    ACCUEIL("Accueil", Icons.Outlined.Home, Icons.Filled.Home),
    CALENDRIER("Calendrier", Icons.Outlined.DateRange, Icons.Filled.DateRange),
    ANNONCES("Annonces", Icons.Outlined.Notifications, Icons.Filled.Notifications),
    MESSAGES("Messages", Icons.Outlined.Email, Icons.Filled.Email),
    PROFIL("Profil", Icons.Outlined.Person, Icons.Filled.Person)
}

@Composable
fun AppleBottomNavigation(
    currentDestination: NavigationDestination,
    onNavigate: (NavigationDestination) -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .border(width = 0.5.dp, color = AppleDivider),
        color = AppleSurface.copy(alpha = 0.98f)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            NavigationDestination.values().forEach { dest ->
                val isSelected = dest == currentDestination
                val iconColor by animateColorAsState(if (isSelected) AppleTextPrimary else AppleAccent)
                
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier
                        .clickable { onNavigate(dest) }
                        .padding(horizontal = 12.dp, vertical = 4.dp)
                ) {
                    Icon(
                        imageVector = if (isSelected) dest.selectedIcon else dest.icon,
                        contentDescription = dest.label,
                        tint = iconColor,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.height(3.dp))
                    Text(
                        text = dest.label,
                        color = iconColor,
                        fontSize = 10.sp,
                        fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal
                    )
                }
            }
        }
    }
}
