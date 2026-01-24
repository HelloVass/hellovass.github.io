package info.hellovass.reviewme.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import kotlinx.coroutines.delay
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.sin
import kotlin.random.Random

/**
 * 烟花粒子
 */
private data class FireworkParticle(
    var x: Float,
    var y: Float,
    var vx: Float,
    var vy: Float,
    val color: Color,
    var alpha: Float = 1f,
    var life: Float = 1f,
    val size: Float = 6f,
    val isSpark: Boolean = false
)

/**
 * 烟花状态
 */
private data class Firework(
    val centerX: Float,
    val centerY: Float,
    val particles: List<FireworkParticle>,
    var age: Float = 0f,
    var isAlive: Boolean = true
)

/**
 * 超绚丽日式烟花效果
 */
@Composable
fun FireworkEffect(
    modifier: Modifier = Modifier,
    particleCount: Int = 120,
    fireworkInterval: Long = 800,
    colors: List<Color> = listOf(
        Color(0xFFFF1744),
        Color(0xFFFF4081),
        Color(0xFFE040FB),
        Color(0xFF536DFE),
        Color(0xFF00E5FF),
        Color(0xFF76FF03),
        Color(0xFFFFEA00),
        Color(0xFFFF6E40),
        Color.White
    )
) {
    var fireworks by remember { mutableStateOf<List<Firework>>(emptyList()) }
    var canvasSize by remember { mutableStateOf(Offset.Zero) }

    LaunchedEffect(Unit) {
        while (true) {
            delay(fireworkInterval)

            if (canvasSize != Offset.Zero) {
                val count = Random.nextInt(1, 4)
                val newFireworks = List(count) {
                    val x = Random.nextFloat() * canvasSize.x
                    val y = Random.nextFloat() * canvasSize.y * 0.5f + canvasSize.y * 0.1f

                    createFirework(
                        centerX = x,
                        centerY = y,
                        particleCount = particleCount,
                        colors = colors
                    )
                }

                fireworks = fireworks + newFireworks
            }
        }
    }

    LaunchedEffect(Unit) {
        while (true) {
            delay(16)

            fireworks = fireworks.mapNotNull { firework ->
                updateFirework(firework)
                if (firework.isAlive) firework else null
            }
        }
    }

    Canvas(modifier = modifier.fillMaxSize()) {
        if (canvasSize == Offset.Zero) {
            canvasSize = Offset(size.width, size.height)
        }

        fireworks.forEach { firework ->
            drawFirework(firework)
        }
    }
}

private fun createFirework(
    centerX: Float,
    centerY: Float,
    particleCount: Int,
    colors: List<Color>
): Firework {
    val particles = mutableListOf<FireworkParticle>()

    val primaryColor = colors.random()
    val secondaryColor = colors.random()

    repeat(particleCount) { i ->
        val angle = (i.toFloat() / particleCount) * 2 * PI
        val speed = Random.nextFloat() * 4f + 3f

        val particleColor = when (i % 3) {
            0 -> primaryColor
            1 -> secondaryColor
            else -> Color.White
        }

        particles.add(
            FireworkParticle(
                x = centerX,
                y = centerY,
                vx = cos(angle).toFloat() * speed,
                vy = sin(angle).toFloat() * speed,
                color = particleColor,
                size = Random.nextFloat() * 4f + 6f,
                isSpark = false
            )
        )
    }

    repeat(50) {
        particles.add(
            FireworkParticle(
                x = centerX,
                y = centerY,
                vx = (Random.nextFloat() - 0.5f) * 10f,
                vy = (Random.nextFloat() - 0.5f) * 10f,
                color = Color.White,
                size = Random.nextFloat() * 6f + 8f,
                isSpark = false
            )
        )
    }

    repeat(particleCount / 2) {
        val angle = Random.nextFloat() * 2 * PI
        val speed = Random.nextFloat() * 6f + 4f

        particles.add(
            FireworkParticle(
                x = centerX,
                y = centerY,
                vx = cos(angle).toFloat() * speed,
                vy = sin(angle).toFloat() * speed,
                color = Color(0xFFFFD700),
                size = Random.nextFloat() * 2f + 3f,
                isSpark = true
            )
        )
    }

    return Firework(
        centerX = centerX,
        centerY = centerY,
        particles = particles
    )
}

private fun updateFirework(firework: Firework) {
    firework.age += 0.016f
    var aliveCount = 0

    firework.particles.forEach { particle ->
        particle.x += particle.vx
        particle.y += particle.vy

        particle.vy += 0.15f

        particle.vx *= 0.985f
        particle.vy *= 0.985f

        if (particle.isSpark) {
            particle.life -= 0.025f
        } else {
            particle.life -= 0.012f
        }

        particle.alpha = (particle.life.pow(1.5f)).coerceIn(0f, 1f)

        if (particle.life > 0) {
            aliveCount++
        }
    }

    firework.isAlive = aliveCount > 0
}

private fun DrawScope.drawFirework(firework: Firework) {
    firework.particles.forEach { particle ->
        if (particle.life > 0) {
            val currentSize = particle.size * (0.5f + particle.alpha * 0.5f)

            val tailLength = if (particle.isSpark) 15f else 25f
            val tailStart = Offset(
                particle.x - particle.vx * tailLength,
                particle.y - particle.vy * tailLength
            )

            drawLine(
                brush = Brush.linearGradient(
                    colors = listOf(
                        particle.color.copy(alpha = 0f),
                        particle.color.copy(alpha = particle.alpha * 0.3f),
                        particle.color.copy(alpha = particle.alpha * 0.7f)
                    ),
                    start = tailStart,
                    end = Offset(particle.x, particle.y)
                ),
                start = tailStart,
                end = Offset(particle.x, particle.y),
                strokeWidth = currentSize * 0.8f
            )

            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        particle.color.copy(alpha = particle.alpha * 0.4f),
                        particle.color.copy(alpha = 0f)
                    ),
                    center = Offset(particle.x, particle.y),
                    radius = currentSize * 5f
                ),
                radius = currentSize * 5f,
                center = Offset(particle.x, particle.y)
            )

            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        particle.color.copy(alpha = particle.alpha * 0.7f),
                        particle.color.copy(alpha = particle.alpha * 0.2f)
                    ),
                    center = Offset(particle.x, particle.y),
                    radius = currentSize * 2.5f
                ),
                radius = currentSize * 2.5f,
                center = Offset(particle.x, particle.y)
            )

            drawCircle(
                color = Color.White.copy(alpha = particle.alpha * 0.9f),
                radius = currentSize * 0.8f,
                center = Offset(particle.x, particle.y)
            )

            drawCircle(
                color = particle.color.copy(alpha = particle.alpha),
                radius = currentSize,
                center = Offset(particle.x, particle.y)
            )
        }
    }
}
