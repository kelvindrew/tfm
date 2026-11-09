package cd.tfm.scheduler.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cd.tfm.scheduler.engine.RotationEngine
import cd.tfm.scheduler.model.ShiftType
import cd.tfm.scheduler.ui.components.AppleCard
import cd.tfm.scheduler.ui.components.ShiftBadge
import cd.tfm.scheduler.ui.theme.*
import cd.tfm.scheduler.ui.viewmodel.TfmViewModel
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun CalendarScreen(
    viewModel: TfmViewModel
) {
    val uiState by viewModel.uiState.collectAsState()
    var currentYearMonth by remember { mutableStateOf(YearMonth.now()) }
    val selectedDayResult = viewModel.getSelectedDayResult()

    val monthTitleFormatter = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.FRENCH)
    val displayMonth = currentYearMonth.format(monthTitleFormatter)
        .replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.FRENCH) else it.toString() }

    val daysInMonth = currentYearMonth.lengthOfMonth()
    val firstDayOfWeek = currentYearMonth.atDay(1).dayOfWeek.value // 1 (Mon) to 7 (Sun)
    val leadingEmptyDays = firstDayOfWeek - 1

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AppleMainBackground)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        // Top Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Calendrier",
                style = MaterialTheme.typography.headlineLarge
            )

            // Month navigation controls
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                IconButton(
                    onClick = { currentYearMonth = currentYearMonth.minusMonths(1) },
                    modifier = Modifier.size(36.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.ChevronLeft,
                        contentDescription = "Mois précédent",
                        tint = AppleTextPrimary
                    )
                }
                Text(
                    text = displayMonth,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                IconButton(
                    onClick = { currentYearMonth = currentYearMonth.plusMonths(1) },
                    modifier = Modifier.size(36.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = "Mois suivant",
                        tint = AppleTextPrimary
                    )
                }
            }
        }

        // Calendar Grid Card
        AppleCard {
            // Days of Week Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                listOf("LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM").forEach { dayLabel ->
                    Text(
                        text = dayLabel,
                        color = AppleTextSecondary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.width(38.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Month Days Grid
            val totalCells = leadingEmptyDays + daysInMonth
            val rows = (totalCells + 6) / 7

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                for (rowIndex in 0 until rows) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        for (colIndex in 0 until 7) {
                            val cellIndex = rowIndex * 7 + colIndex
                            val dayNumber = cellIndex - leadingEmptyDays + 1

                            if (dayNumber in 1..daysInMonth) {
                                val cellDate = currentYearMonth.atDay(dayNumber)
                                val isSelected = cellDate == uiState.selectedDate
                                val isToday = cellDate == LocalDate.now()
                                val cycleDay = RotationEngine.getCycleDay(cellDate)
                                val shiftType = RotationEngine.getShiftType(cycleDay)

                                Column(
                                    modifier = Modifier
                                        .width(38.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(if (isSelected) AppleSurfaceElevated else Color.Transparent)
                                        .border(
                                            width = if (isSelected) 1.dp else if (isToday) 0.5.dp else 0.dp,
                                            color = if (isSelected) AppleTextPrimary else if (isToday) AppleAccent else Color.Transparent,
                                            shape = RoundedCornerShape(10.dp)
                                        )
                                        .clickable { viewModel.selectDate(cellDate) }
                                        .padding(vertical = 6.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Text(
                                        text = "$dayNumber",
                                        fontSize = 14.sp,
                                        fontWeight = if (isSelected || isToday) FontWeight.Bold else FontWeight.Normal,
                                        color = if (isSelected) AppleTextPrimary else if (isToday) AppleLightSurface else AppleTextSecondary
                                    )

                                    // Shift Dot Indicator
                                    Box(
                                        modifier = Modifier
                                            .size(5.dp)
                                            .clip(CircleShape)
                                            .background(
                                                when (shiftType) {
                                                    ShiftType.DAY -> ShiftDayIndicator
                                                    ShiftType.NIGHT -> ShiftNightIndicator
                                                    ShiftType.REST -> ShiftRestIndicator
                                                }
                                            )
                                    )
                                }
                            } else {
                                Box(modifier = Modifier.width(38.dp))
                            }
                        }
                    }
                }
            }
        }

        // Selected Date Detail Inset Card
        AppleCard {
            val selectedDateFormatted = selectedDayResult.date.format(
                DateTimeFormatter.ofPattern("EEEE d MMMM yyyy", Locale.FRENCH)
            ).replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.FRENCH) else it.toString() }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "DÉTAILS DU JOUR SÉLECTIONNÉ",
                        color = AppleTextSecondary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 0.6.sp
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = selectedDateFormatted,
                        style = MaterialTheme.typography.titleMedium
                    )
                }
                ShiftBadge(shiftType = selectedDayResult.shiftType)
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(text = "Poste", color = AppleTextSecondary, fontSize = 12.sp)
                    Text(text = selectedDayResult.shiftType.labelFr, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
                }
                Column {
                    Text(text = "Jour du cycle", color = AppleTextSecondary, fontSize = 12.sp)
                    Text(text = "Jour ${selectedDayResult.cycleDay} / 9", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(text = "Horaires", color = AppleTextSecondary, fontSize = 12.sp)
                    Text(text = selectedDayResult.shiftHours, style = MaterialTheme.typography.bodyMedium)
                }
            }

            selectedDayResult.landmark?.let { landmark ->
                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = AppleDivider, thickness = 0.5.dp)
                Text(
                    text = "Repère associé : ${landmark.label}",
                    color = AppleTextPrimary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}
