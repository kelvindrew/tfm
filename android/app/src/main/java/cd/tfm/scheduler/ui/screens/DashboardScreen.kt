package cd.tfm.scheduler.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.DateRange
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cd.tfm.scheduler.model.ShiftType
import cd.tfm.scheduler.ui.components.AppleCard
import cd.tfm.scheduler.ui.components.ShiftBadge
import cd.tfm.scheduler.ui.components.SyncStatusBadge
import cd.tfm.scheduler.ui.theme.*
import cd.tfm.scheduler.ui.viewmodel.TfmViewModel
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun DashboardScreen(
    viewModel: TfmViewModel,
    onNavigateToCalendar: () -> Unit,
    onNavigateToProfile: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val currentShift = viewModel.getCurrentShift()
    val fullCycle = viewModel.getCurrentCycleOverview()

    val dateFormatter = DateTimeFormatter.ofPattern("EEEE d MMMM yyyy", Locale.FRENCH)
    val todayFormatted = LocalDate.now().format(dateFormatter)
        .replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.FRENCH) else it.toString() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AppleMainBackground)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // 1. Employee Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Bonjour, ${uiState.userProfile.name.split(" ").first()}",
                    style = MaterialTheme.typography.headlineLarge
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "$todayFormatted • ${uiState.userProfile.id}",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            SyncStatusBadge(lastSyncTime = uiState.lastSyncTimestamp)
        }

        // 2. Current Shift Card (Apple Inset Grouped Card)
        AppleCard {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "POSTE ACTUEL",
                    color = AppleTextSecondary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.8.sp
                )
                ShiftBadge(shiftType = currentShift.shiftType)
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = currentShift.shiftType.labelFr,
                style = MaterialTheme.typography.headlineMedium
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Jour ${currentShift.cycleDay} du cycle de 9 jours • ${currentShift.shiftHours}",
                style = MaterialTheme.typography.bodyLarge,
                color = AppleTextSecondary
            )

            currentShift.landmark?.let { landmark ->
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(AppleSurfaceElevated)
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = landmark.label,
                            color = AppleTextPrimary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 14.dp),
                thickness = 0.5.dp,
                color = AppleDivider
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "PROCHAINE TRANSITION",
                        color = AppleTextSecondary,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "Dans ${currentShift.daysUntilNextTransition} jour(s) → ${currentShift.nextShiftType.shortCode}",
                        style = MaterialTheme.typography.titleMedium
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "ÉQUIPE / REPÈRE",
                        color = AppleTextSecondary,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "Groupe ${uiState.userProfile.assignedLandmark.code}",
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            }
        }

        // 3. 9-Day Rotation Strip
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = "CYCLE DE ROTATION EN COURS",
                color = AppleTextSecondary,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.6.sp
            )

            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(fullCycle) { dayResult ->
                    val isToday = dayResult.date == LocalDate.now()
                    val borderColor = if (isToday) AppleTextPrimary else AppleDivider
                    val bgColor = if (isToday) AppleSurfaceElevated else AppleSurface

                    Column(
                        modifier = Modifier
                            .width(62.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(bgColor)
                            .border(1.dp, borderColor, RoundedCornerShape(12.dp))
                            .padding(vertical = 10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "J${dayResult.cycleDay}",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isToday) AppleTextPrimary else AppleTextSecondary
                        )

                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(
                                    when (dayResult.shiftType) {
                                        ShiftType.DAY -> ShiftDayIndicator
                                        ShiftType.NIGHT -> ShiftNightIndicator
                                        ShiftType.REST -> ShiftRestIndicator
                                    }
                                )
                        )

                        Text(
                            text = dayResult.shiftType.shortCode,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium,
                            color = AppleTextSecondary
                        )
                    }
                }
            }
        }

        // 4. Important Announcements Snippet
        uiState.announcements.firstOrNull()?.let { topAnn ->
            AppleCard {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "COMMUNIQUÉ OFFICIEL",
                        color = AppleTextSecondary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = topAnn.category,
                        color = if (topAnn.priority == "URGENT") HSEAlertRed else AppleTextSecondary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = topAnn.title,
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = topAnn.summary,
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 2
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}
