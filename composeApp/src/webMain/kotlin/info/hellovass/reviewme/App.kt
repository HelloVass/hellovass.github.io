package info.hellovass.reviewme

import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.IntOffset
import androidx.navigation.ExperimentalBrowserHistoryApi
import androidx.navigation.bindToBrowserNavigation
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import info.hellovass.reviewme.navigation.HomeRoute
import info.hellovass.reviewme.ui.screen.LoveMemoryScreen
import info.hellovass.reviewme.ui.theme.AppTheme
import info.hellovass.reviewme.ui.viewmodel.ThemeViewModel
import org.koin.compose.viewmodel.koinViewModel

@OptIn(ExperimentalBrowserHistoryApi::class)
@Composable
fun App(fontFamily: FontFamily) {
    val navController = rememberNavController()
    val themeViewModel: ThemeViewModel = koinViewModel()
    val isDarkMode by themeViewModel.isDarkMode.collectAsState()

    // 绑定浏览器导航（支持前进/后退按钮）
    LaunchedEffect(navController) {
        navController.bindToBrowserNavigation()
    }

    // Material Design 3 Shared Axis 转换（X 轴）- 纯滑动版本（无淡入淡出）
    // 前进动画配置：舒适的速度（300ms）
    val forwardSpec = tween<IntOffset>(
        durationMillis = 300,
        easing = CubicBezierEasing(0.2f, 0.0f, 0.2f, 1.0f)
    )

    // 前进动画：从右侧滑入
    val enterTransition = slideInHorizontally(animationSpec = forwardSpec) { fullWidth -> fullWidth / 20 }

    // 前进时旧页面：向左滑出
    val exitTransition = slideOutHorizontally(animationSpec = forwardSpec) { fullWidth -> -fullWidth / 20 }

    // 返回动画：禁用（避免卡顿，返回时用户期望快速回到之前页面）
    val popEnterTransition = EnterTransition.None

    // 返回时旧页面：禁用
    val popExitTransition = ExitTransition.None

    // 使用 AppTheme 包裹，支持动态主题切换
    AppTheme(
        isDarkMode = isDarkMode,
        fontFamily = fontFamily
    ) {
        NavHost(
            navController = navController,
            startDestination = HomeRoute,
            enterTransition = { enterTransition },
            exitTransition = { exitTransition },
            popEnterTransition = { popEnterTransition },
            popExitTransition = { popExitTransition }
        ) {
            // 首页 - 爱情纪念网站
            composable<HomeRoute> {
                LoveMemoryScreen()
            }
        }
    }
}