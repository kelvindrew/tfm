package cd.tfm.scheduler.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = AppleTextPrimary,
    onPrimary = AppleMainBackground,
    secondary = AppleAccent,
    onSecondary = AppleTextPrimary,
    background = AppleMainBackground,
    onBackground = AppleTextPrimary,
    surface = AppleSurface,
    onSurface = AppleTextPrimary,
    surfaceVariant = AppleSurfaceElevated,
    onSurfaceVariant = AppleTextSecondary,
    outline = AppleDivider
)

@Composable
fun TfmSchedulerTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = AppleTypography,
        content = content
    )
}
