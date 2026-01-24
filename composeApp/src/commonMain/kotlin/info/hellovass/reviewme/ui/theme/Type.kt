package info.hellovass.reviewme.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

fun createTypography(fontFamily: FontFamily): Typography {
    return Typography(
        displayLarge = TextStyle(
            fontFamily = fontFamily,
            fontSize = 57.sp,
            lineHeight = 64.sp,
            fontWeight = FontWeight.Normal
        ),
        displayMedium = TextStyle(
            fontFamily = fontFamily,
            fontSize = 45.sp,
            lineHeight = 52.sp,
            fontWeight = FontWeight.Normal
        ),
        displaySmall = TextStyle(
            fontFamily = fontFamily,
            fontSize = 36.sp,
            lineHeight = 44.sp,
            fontWeight = FontWeight.Normal
        ),
        headlineLarge = TextStyle(
            fontFamily = fontFamily,
            fontSize = 32.sp,
            lineHeight = 40.sp,
            fontWeight = FontWeight.Normal
        ),
        headlineMedium = TextStyle(
            fontFamily = fontFamily,
            fontSize = 28.sp,
            lineHeight = 36.sp,
            fontWeight = FontWeight.Normal
        ),
        headlineSmall = TextStyle(
            fontFamily = fontFamily,
            fontSize = 24.sp,
            lineHeight = 32.sp,
            fontWeight = FontWeight.Normal
        ),
        titleLarge = TextStyle(
            fontFamily = fontFamily,
            fontSize = 22.sp,
            lineHeight = 28.sp,
            fontWeight = FontWeight.Medium
        ),
        titleMedium = TextStyle(
            fontFamily = fontFamily,
            fontSize = 16.sp,
            lineHeight = 24.sp,
            fontWeight = FontWeight.Medium
        ),
        titleSmall = TextStyle(
            fontFamily = fontFamily,
            fontSize = 14.sp,
            lineHeight = 20.sp,
            fontWeight = FontWeight.Medium
        ),
        bodyLarge = TextStyle(
            fontFamily = fontFamily,
            fontSize = 16.sp,
            lineHeight = 24.sp,
            fontWeight = FontWeight.Normal
        ),
        bodyMedium = TextStyle(
            fontFamily = fontFamily,
            fontSize = 14.sp,
            lineHeight = 20.sp,
            fontWeight = FontWeight.Normal
        ),
        bodySmall = TextStyle(
            fontFamily = fontFamily,
            fontSize = 12.sp,
            lineHeight = 16.sp,
            fontWeight = FontWeight.Normal
        ),
        labelLarge = TextStyle(
            fontFamily = fontFamily,
            fontSize = 14.sp,
            lineHeight = 20.sp,
            fontWeight = FontWeight.Medium
        ),
        labelMedium = TextStyle(
            fontFamily = fontFamily,
            fontSize = 12.sp,
            lineHeight = 16.sp,
            fontWeight = FontWeight.Medium
        ),
        labelSmall = TextStyle(
            fontFamily = fontFamily,
            fontSize = 11.sp,
            lineHeight = 16.sp,
            fontWeight = FontWeight.Medium
        )
    )
}
