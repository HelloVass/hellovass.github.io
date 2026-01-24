package info.hellovass.reviewme.ui.screen

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import hellovass.composeapp.generated.resources.Res
import hellovass.composeapp.generated.resources.me
import hellovass.composeapp.generated.resources.wife
import info.hellovass.reviewme.data.Feature
import info.hellovass.reviewme.data.LoveMemoryData
import info.hellovass.reviewme.ui.viewmodel.LoveMemoryUiState
import info.hellovass.reviewme.ui.viewmodel.LoveMemoryViewModel
import kotlinx.coroutines.delay
import org.jetbrains.compose.resources.painterResource
import org.koin.compose.viewmodel.koinViewModel
import kotlin.time.Clock
import kotlin.time.Instant

@Composable
fun LoveMemoryScreen() {
    val viewModel: LoveMemoryViewModel = koinViewModel()
    val uiState by viewModel.uiState.collectAsState()

    when (val state = uiState) {
        is LoveMemoryUiState.Loading -> {
            LoadingState()
        }

        is LoveMemoryUiState.Success -> {
            LoveMemoryContent(data = state.data)
        }

        is LoveMemoryUiState.Error -> {
            ErrorState(
                message = state.message,
                onRetry = { viewModel.retry() }
            )
        }
    }
}

@Composable
private fun LoadingState() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            CircularProgressIndicator()
            Text(
                text = "Loading...",
                style = MaterialTheme.typography.bodyLarge
            )
        }
    }
}

@Composable
private fun ErrorState(
    message: String,
    onRetry: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = "Error",
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.error
            )
            Text(
                text = "加载失败",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.error
            )
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
            )
            Button(onClick = onRetry) {
                Text("重试")
            }
        }
    }
}

@Composable
private fun LoveMemoryContent(data: LoveMemoryData) {
    val meetingDate = remember(data.meetingDate) {
        Instant.parse(data.meetingDate)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // 顶部横幅
        BannerSection(data.banner.title)

        // 主体内容
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(40.dp))

            // 双人头像 + 爱心
            AvatarSection(
                meName = data.couple.me.name,
                wifeName = data.couple.wife.name
            )

            Spacer(modifier = Modifier.height(32.dp))

            // 标题
            Text(
                text = data.timeline.title,
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Bold
                ),
                color = MaterialTheme.colorScheme.onBackground
            )

            Spacer(modifier = Modifier.height(16.dp))

            // 时间计数器
            TimeCounterSection(
                startTime = meetingDate,
                subtitle = data.timeline.subtitle
            )

            Spacer(modifier = Modifier.height(48.dp))

            // 功能卡片
            FeatureCardsSection(data.features)
        }
    }
}

@Composable
private fun BannerSection(title: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(240.dp)
            .background(
                Brush.horizontalGradient(
                    colors = listOf(
                        MaterialTheme.colorScheme.primaryContainer,
                        MaterialTheme.colorScheme.secondaryContainer
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        // TODO: 如果 JSON 中提供了 backgroundImage，可以在这里加载
        Text(
            text = title,
            style = MaterialTheme.typography.displayMedium.copy(
                fontWeight = FontWeight.Bold,
                fontSize = 48.sp
            ),
            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
        )
    }
}

@Composable
private fun AvatarSection(
    meName: String,
    wifeName: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // 左侧头像（我）
        AvatarCircle(
            imageRes = Res.drawable.me,
            name = meName
        )

        Spacer(modifier = Modifier.width(32.dp))

        // 爱心动画
        HeartIcon()

        Spacer(modifier = Modifier.width(32.dp))

        // 右侧头像（老婆）
        AvatarCircle(
            imageRes = Res.drawable.wife,
            name = wifeName
        )
    }
}

@Composable
private fun AvatarCircle(
    imageRes: org.jetbrains.compose.resources.DrawableResource,
    name: String
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Box(
            modifier = Modifier
                .size(100.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.surfaceVariant)
                .border(3.dp, MaterialTheme.colorScheme.primary, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Image(
                painter = painterResource(imageRes),
                contentDescription = name,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
        }

        Text(
            text = name,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
        )
    }
}

@Composable
private fun HeartIcon() {
    // 爱心跳动动画
    val infiniteTransition = rememberInfiniteTransition()
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "heart animation"
    )

    Icon(
        imageVector = Icons.Default.Favorite,
        contentDescription = "Love",
        modifier = Modifier
            .size(48.dp)
            .scale(scale),
        tint = Color(0xFFFF4081)
    )
}

@Composable
private fun TimeCounterSection(
    startTime: Instant,
    subtitle: String
) {
    var currentTime by remember { mutableStateOf(Clock.System.now()) }

    // 每秒更新一次时间
    LaunchedEffect(Unit) {
        while (true) {
            delay(1000)
            currentTime = Clock.System.now()
        }
    }

    val diffMillis = (currentTime - startTime).inWholeMilliseconds
    val days = (diffMillis / (1000 * 60 * 60 * 24)).toInt()
    val hours = ((diffMillis % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toInt()
    val minutes = ((diffMillis % (1000 * 60 * 60)) / (1000 * 60)).toInt()
    val seconds = ((diffMillis % (1000 * 60)) / 1000).toInt()

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 主计数（天数）
        Text(
            text = "$days 天 $hours 时 $minutes 分 $seconds 秒",
            style = MaterialTheme.typography.headlineLarge.copy(
                fontWeight = FontWeight.Bold,
                fontSize = 32.sp
            ),
            color = MaterialTheme.colorScheme.primary
        )

        // 副标题
        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
        )
    }
}

@Composable
private fun FeatureCardsSection(features: List<Feature>) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        features.forEach { feature ->
            FeatureCard(
                icon = getIconByName(feature.icon),
                title = feature.title,
                description = feature.description,
                color = parseColor(feature.color),
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun FeatureCard(
    icon: ImageVector,
    title: String,
    description: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.height(180.dp),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    modifier = Modifier.size(32.dp),
                    tint = color
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold
                ),
                color = MaterialTheme.colorScheme.onSurface,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                textAlign = TextAlign.Center
            )
        }
    }
}

// 辅助函数：根据名称获取图标
private fun getIconByName(iconName: String): ImageVector {
    return when (iconName) {
        "favorite" -> Icons.Default.Favorite
        "chat" -> Icons.Default.ChatBubble
        "info" -> Icons.Default.Info
        else -> Icons.Default.Info
    }
}

// 辅助函数：解析颜色字符串（支持 #RRGGBB 格式）
private fun parseColor(colorString: String): Color {
    return try {
        val hex = colorString.removePrefix("#")
        val colorInt = hex.toLong(16)
        Color(0xFF000000 or colorInt)
    } catch (e: Exception) {
        Color(0xFF3F51B5) // 默认颜色
    }
}
