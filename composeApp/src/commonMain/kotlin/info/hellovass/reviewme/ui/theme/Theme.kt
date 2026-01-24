package info.hellovass.reviewme.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.font.FontFamily

@Composable
fun AppTheme(
    isDarkMode: Boolean = false,
    fontFamily: FontFamily = FontFamily.Default,
    content: @Composable () -> Unit
) {
    val colorScheme = if (isDarkMode) DarkColorScheme else LightColorScheme
    val typography = createTypography(fontFamily)

    MaterialTheme(
        colorScheme = colorScheme,
        typography = typography,
        content = content
    )
}
