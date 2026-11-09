package cd.tfm.scheduler.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cd.tfm.scheduler.model.Channel
import cd.tfm.scheduler.ui.components.AppleCard
import cd.tfm.scheduler.ui.theme.*
import cd.tfm.scheduler.ui.viewmodel.TfmViewModel

@Composable
fun MessagingScreen(
    viewModel: TfmViewModel
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedChannel by remember { mutableStateOf<Channel?>(null) }
    var messageText by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AppleMainBackground)
            .padding(horizontal = 20.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Messages",
            style = MaterialTheme.typography.headlineLarge
        )

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            items(uiState.channels) { channel ->
                AppleCard(
                    modifier = Modifier.clickable { selectedChannel = channel }
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = channel.name,
                                    style = MaterialTheme.typography.titleMedium
                                )
                                if (channel.unreadCount > 0) {
                                    Box(
                                        modifier = Modifier
                                            .clip(CircleShape)
                                            .background(ShiftNightIndicator)
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = "${channel.unreadCount}",
                                            color = AppleTextPrimary,
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(3.dp))
                            Text(
                                text = channel.lastMessagePreview,
                                style = MaterialTheme.typography.bodyMedium,
                                maxLines = 1
                            )
                        }

                        Text(
                            text = channel.lastMessageTime,
                            color = AppleTextSecondary,
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }
    }

    // Channel Chat Sheet
    selectedChannel?.let { ch ->
        AlertDialog(
            onDismissRequest = { selectedChannel = null },
            confirmButton = {
                TextButton(onClick = { selectedChannel = null }) {
                    Text("Fermer", color = AppleTextPrimary)
                }
            },
            title = {
                Text(text = ch.name, style = MaterialTheme.typography.titleMedium)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(text = ch.description, color = AppleTextSecondary, fontSize = 12.sp)

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(AppleSurface)
                            .padding(12.dp)
                    ) {
                        Text(
                            text = "Canal de coordination opérationnelle interne sécurisé.",
                            color = AppleTextSecondary,
                            fontSize = 12.sp
                        )
                    }
                }
            },
            containerColor = AppleSurfaceElevated,
            shape = RoundedCornerShape(16.dp)
        )
    }
}
