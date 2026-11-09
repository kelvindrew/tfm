package cd.tfm.scheduler.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cd.tfm.scheduler.model.Announcement
import cd.tfm.scheduler.ui.components.AppleCard
import cd.tfm.scheduler.ui.theme.*
import cd.tfm.scheduler.ui.viewmodel.TfmViewModel

@Composable
fun AnnouncementsScreen(
    viewModel: TfmViewModel
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedCategory by remember { mutableStateOf("TOUS") }
    var selectedAnnouncement by remember { mutableStateOf<Announcement?>(null) }

    val categories = listOf("TOUS", "HSE", "MAINT", "ADMIN", "NEWS")
    val filteredAnnouncements = if (selectedCategory == "TOUS") {
        uiState.announcements
    } else {
        uiState.announcements.filter { it.category == selectedCategory }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AppleMainBackground)
            .padding(horizontal = 20.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Annonces",
            style = MaterialTheme.typography.headlineLarge
        )

        // Segmented Category Filter Row
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            items(categories) { category ->
                val isSelected = category == selectedCategory
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (isSelected) AppleLightSurface else AppleSurface)
                        .clickable { selectedCategory = category }
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = category,
                        fontSize = 12.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                        color = if (isSelected) AppleMainBackground else AppleTextSecondary
                    )
                }
            }
        }

        // List of Inset Cards
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            items(filteredAnnouncements) { announcement ->
                AppleCard(
                    modifier = Modifier.clickable {
                        viewModel.markAnnouncementRead(announcement.id)
                        selectedAnnouncement = announcement
                    }
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            if (!announcement.isRead) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(ShiftNightIndicator)
                                )
                            }
                            Text(
                                text = announcement.category,
                                color = if (announcement.priority == "URGENT") HSEAlertRed else AppleAccent,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Text(
                            text = announcement.date,
                            color = AppleTextSecondary,
                            fontSize = 11.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = announcement.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = if (!announcement.isRead) FontWeight.Bold else FontWeight.SemiBold
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = announcement.summary,
                        style = MaterialTheme.typography.bodyMedium,
                        maxLines = 2
                    )
                }
            }
        }
    }

    // Detail Modal Dialog
    selectedAnnouncement?.let { ann ->
        AlertDialog(
            onDismissRequest = { selectedAnnouncement = null },
            confirmButton = {
                TextButton(onClick = { selectedAnnouncement = null }) {
                    Text("Fermer", color = AppleTextPrimary)
                }
            },
            title = {
                Text(text = ann.title, style = MaterialTheme.typography.titleMedium)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "${ann.category} • ${ann.date}",
                        color = AppleTextSecondary,
                        fontSize = 12.sp
                    )
                    Text(
                        text = ann.content,
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
            },
            containerColor = AppleSurfaceElevated,
            shape = RoundedCornerShape(16.dp)
        )
    }
}
