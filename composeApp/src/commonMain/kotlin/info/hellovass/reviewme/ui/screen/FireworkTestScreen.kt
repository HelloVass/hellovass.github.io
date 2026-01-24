package info.hellovass.reviewme.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import info.hellovass.reviewme.ui.components.FireworkEffect

/**
 * 烟花效果测试页面
 * 用于调试和演示烟花效果
 */
@Composable
fun FireworkTestScreen() {
    Box(modifier = Modifier.fillMaxSize()) {
        // 深色背景，让烟花更明显
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF1A1A2E)) // 深蓝灰色背景
        )

        // 烟花效果
        FireworkEffect(
            modifier = Modifier.fillMaxSize(),
            particleCount = 80,        // 增加粒子数让效果更明显
            fireworkInterval = 1500,   // 缩短间隔以便快速看到效果
            colors = listOf(
                Color(0xFFFF4081),
                Color(0xFFFFD740),
                Color(0xFF69F0AE),
                Color(0xFF536DFE),
                Color.White
            )
        )

        // 提示文字
        Text(
            text = "烟花效果测试\n请等待 1-2 秒",
            modifier = Modifier.align(Alignment.Center),
            style = MaterialTheme.typography.headlineLarge.copy(
                fontWeight = FontWeight.Bold,
                fontSize = 32.sp
            ),
            color = Color.White.copy(alpha = 0.5f)
        )
    }
}
