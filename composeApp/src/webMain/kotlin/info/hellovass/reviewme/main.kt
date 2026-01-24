package info.hellovass.reviewme

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.unit.dp
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFontFamilyResolver
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.platform.Font
import androidx.compose.ui.window.ComposeViewport
import info.hellovass.reviewme.di.allModules
import info.hellovass.reviewme.resource.ResourceLoader
import org.koin.compose.KoinApplication
import org.koin.compose.koinInject

fun main() {
    ComposeViewport {
        // 初始化 Koin
        KoinApplication(
            application = {
                modules(allModules)
            }
        ) {
            var fontFamily by remember { mutableStateOf<FontFamily?>(null) }
            val fontFamilyResolver = LocalFontFamilyResolver.current
            val resourceLoader: ResourceLoader = koinInject()

            when (fontFamily != null) {
                true -> {
                    // 字体加载完成，启动应用（主题在 App 中管理）
                    App(fontFamily = checkNotNull(fontFamily))
                }

                else -> {
                    // 显示加载中界面
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            CircularProgressIndicator()
                            Text("loading...")
                        }
                    }
                }
            }

            LaunchedEffect(resourceLoader) {
                try {
                    // 从 resources 目录加载字体文件
                    val fontBytes = resourceLoader.loadResource("./font/ResourceHanRoundedCN-Regular.ttf")
                    val loadedFontFamily = FontFamily(listOf(Font("ResourceHanRounded", fontBytes)))

                    // 预加载字体
                    fontFamilyResolver.preload(loadedFontFamily)

                    // 标记字体加载完成
                    fontFamily = loadedFontFamily
                } catch (_: Throwable) {
                    // 即使字体加载失败，也显示应用（使用默认字体）
                    fontFamily = FontFamily.Default
                }
            }
        }
    }
}