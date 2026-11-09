package cd.tfm.scheduler.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cd.tfm.scheduler.model.Landmark
import cd.tfm.scheduler.ui.components.AppleCard
import cd.tfm.scheduler.ui.theme.*
import cd.tfm.scheduler.ui.viewmodel.TfmViewModel

@Composable
fun ProfileScreen(
    viewModel: TfmViewModel
) {
    val uiState by viewModel.uiState.collectAsState()
    val userProfile = uiState.userProfile
    var showPaySlipDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AppleMainBackground)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Text(
            text = "Profil & Paramètres",
            style = MaterialTheme.typography.headlineLarge
        )

        // Employee Identity Card
        AppleCard {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(54.dp)
                        .clip(CircleShape)
                        .background(AppleSurfaceElevated)
                        .border(1.dp, AppleDivider, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Person,
                        contentDescription = "Avatar",
                        tint = AppleTextPrimary,
                        modifier = Modifier.size(28.dp)
                    )
                }

                Column {
                    Text(
                        text = userProfile.name,
                        style = MaterialTheme.typography.titleMedium
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = userProfile.role,
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "${userProfile.department} • ${userProfile.id}",
                        color = AppleTextSecondary,
                        fontSize = 11.sp
                    )
                }
            }
        }

        // Section 1: Landmark Assignment (Repères A, B, C)
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = "ASSIGNATION DU REPÈRE OPÉRATIONNEL",
                color = AppleTextSecondary,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.6.sp
            )

            AppleCard {
                Text(
                    text = "Sélectionnez votre groupe d'équipe. Le repère détermine vos dates de repos et de nuit :",
                    style = MaterialTheme.typography.bodyMedium
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf(Landmark.A, Landmark.B, Landmark.C).forEach { landmark ->
                        val isSelected = userProfile.assignedLandmark == landmark
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isSelected) AppleLightSurface else AppleSurfaceElevated)
                                .clickable { viewModel.updateAssignedLandmark(landmark) }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Repère ${landmark.code}",
                                color = if (isSelected) AppleMainBackground else AppleTextPrimary,
                                fontSize = 13.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    }
                }
            }
        }

        // Section 2: Security & App Settings
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = "SÉCURITÉ & PRÉFÉRENCES",
                color = AppleTextSecondary,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.6.sp
            )

            AppleCard {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = "Verrouillage biométrique", style = MaterialTheme.typography.bodyLarge)
                        Text(text = "FaceID / Empreinte digitale", color = AppleTextSecondary, fontSize = 12.sp)
                    }
                    Switch(
                        checked = userProfile.biometricsEnabled,
                        onCheckedChange = { viewModel.toggleBiometrics(it) },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = AppleTextPrimary,
                            checkedTrackColor = AppleAccent,
                            uncheckedThumbColor = AppleTextSecondary,
                            uncheckedTrackColor = AppleSurfaceElevated
                        )
                    )
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = AppleDivider, thickness = 0.5.dp)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = "Notifications de quart", style = MaterialTheme.typography.bodyLarge)
                        Text(text = "Rappels 2h avant le début du poste", color = AppleTextSecondary, fontSize = 12.sp)
                    }
                    Switch(
                        checked = userProfile.notificationsEnabled,
                        onCheckedChange = { viewModel.toggleNotifications(it) },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = AppleTextPrimary,
                            checkedTrackColor = AppleAccent,
                            uncheckedThumbColor = AppleTextSecondary,
                            uncheckedTrackColor = AppleSurfaceElevated
                        )
                    )
                }
            }
        }

        // Section 3: Sage WFS Payroll Vault
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = "COFFRE-FORT RH (SAGE WFS)",
                color = AppleTextSecondary,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.6.sp
            )

            AppleCard(
                modifier = Modifier.clickable { showPaySlipDialog = true }
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(AppleSurfaceElevated),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Description,
                                contentDescription = "Fiches de paie",
                                tint = AppleTextPrimary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Column {
                            Text(text = "Bulletins de paie chiffrés", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
                            Text(text = "Dernier bulletin : Octobre 2026", color = AppleTextSecondary, fontSize = 12.sp)
                        }
                    }
                    Icon(imageVector = Icons.Outlined.Lock, contentDescription = "Sécurisé", tint = AppleAccent, modifier = Modifier.size(18.dp))
                }
            }
        }

        // App Footer & System Metadata
        Column(
            modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = "TFM Scheduler v1.0 • Build 2026.11",
                color = AppleTextSecondary,
                fontSize = 12.sp
            )
            Text(
                text = "Tenke Fungurume Mining S.A. • cd.tfm.scheduler",
                color = AppleAccent,
                fontSize = 11.sp
            )
        }
    }

    if (showPaySlipDialog) {
        AlertDialog(
            onDismissRequest = { showPaySlipDialog = false },
            confirmButton = {
                TextButton(onClick = { showPaySlipDialog = false }) {
                    Text("Fermer", color = AppleTextPrimary)
                }
            },
            title = {
                Text(text = "Bulletins de paie Sage WFS", style = MaterialTheme.typography.titleMedium)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    uiState.paySlips.forEach { slip ->
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(AppleSurface)
                                .padding(12.dp)
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(text = slip.month, fontWeight = FontWeight.Bold, color = AppleTextPrimary)
                                Text(text = "Salaire net : ${slip.netSalary}", color = AppleTextSecondary, fontSize = 12.sp)
                                Text(text = "Heures supplémentaires : ${slip.overtimeHours}h", color = AppleTextSecondary, fontSize = 11.sp)
                            }
                        }
                    }
                }
            },
            containerColor = AppleSurfaceElevated,
            shape = RoundedCornerShape(16.dp)
        )
    }
}
