# 日式烟花效果实现

## 效果预览

爱情纪念网站添加了浪漫的日式烟花动画效果，为页面增添氛围感。

## 技术实现

### 核心组件

**FireworkEffect.kt** - 烟花粒子系统

### 实现原理

#### 1. 粒子系统

每个烟花由多个粒子组成：

```kotlin
data class FireworkParticle(
    var x: Float,         // X 坐标
    var y: Float,         // Y 坐标
    var vx: Float,        // 水平速度
    var vy: Float,        // 垂直速度
    val color: Color,     // 颜色
    var alpha: Float,     // 透明度
    var life: Float,      // 生命值 (0-1)
    val size: Float       // 粒子大小
)
```

#### 2. 物理模拟

**初始爆炸**：
- 粒子从中心点向四周呈圆形扩散
- 速度随机分布（2-5 单位/帧）
- 角度均匀分布（360度）

**运动更新**：
```kotlin
// 位置更新
particle.x += particle.vx
particle.y += particle.vy

// 重力效果
particle.vy += 0.08f

// 空气阻力
particle.vx *= 0.98f
particle.vy *= 0.98f

// 生命衰减
particle.life -= 0.015f
```

#### 3. 视觉效果

**拖尾效果**：
- 使用 `Brush.linearGradient` 创建渐变拖尾
- 拖尾长度与速度相关

**光晕效果**：
- 外层：半透明大圆（光晕）
- 内层：实心小圆（粒子核心）

**颜色系统**：
- 主色调：粉色、金色、绿色、蓝色
- 每个烟花随机选择基础色
- 粒子颜色在基础色周围变化

## 使用方法

### 基础用法

```kotlin
FireworkEffect(
    modifier = Modifier.fillMaxSize(),
    particleCount = 60,           // 每个烟花的粒子数
    fireworkInterval = 2500,      // 发射间隔（毫秒）
    colors = listOf(              // 颜色方案
        Color(0xFFFF4081),
        Color(0xFFFFD740),
        Color(0xFF69F0AE),
        Color(0xFF536DFE)
    )
)
```

### 集成到页面

使用 Box 布局，烟花作为背景层：

```kotlin
Box(modifier = Modifier.fillMaxSize()) {
    // 背景层 - 烟花
    FireworkEffect(modifier = Modifier.fillMaxSize())

    // 前景层 - 内容（带半透明背景）
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White.copy(alpha = 0.7f))
    ) {
        // 页面内容
    }
}
```

## 性能优化

### 已实现的优化

1. **粒子生命周期管理**
   - 粒子生命值降到 0 后停止更新
   - 烟花完全消失后从列表移除

2. **帧率控制**
   - 固定 60 FPS（16ms 更新间隔）

3. **对象复用**
   - 使用 MutableList 减少对象创建

### 可调整参数

根据设备性能调整以下参数：

```kotlin
// 高性能模式
particleCount = 80
fireworkInterval = 2000

// 平衡模式（推荐）
particleCount = 60
fireworkInterval = 2500

// 低性能模式
particleCount = 40
fireworkInterval = 3000
```

### 简化版

提供了 `SimpleFireworkEffect` 组件：

```kotlin
SimpleFireworkEffect(modifier = Modifier.fillMaxSize())
// 等价于
FireworkEffect(
    particleCount = 40,
    fireworkInterval = 3000,
    colors = listOf(Color(0xFFFF4081), Color(0xFFFFD740))
)
```

## 自定义配置

### 颜色主题

**爱情主题（当前）**：
```kotlin
colors = listOf(
    Color(0xFFFF4081), // 粉色
    Color(0xFFFFD740), // 金色
    Color(0xFF69F0AE), // 浅绿
    Color(0xFF536DFE)  // 蓝色
)
```

**节日主题**：
```kotlin
colors = listOf(
    Color(0xFFFF0000), // 红色
    Color(0xFFFFD700), // 金色
)
```

**冷色调**：
```kotlin
colors = listOf(
    Color(0xFF00BCD4), // 青色
    Color(0xFF3F51B5), // 靛蓝
    Color(0xFF9C27B0)  // 紫色
)
```

### 发射位置

修改发射区域（默认在屏幕上半部分）：

```kotlin
// 全屏随机
val y = Random.nextFloat() * canvasSize.y

// 仅在顶部 1/3
val y = Random.nextFloat() * canvasSize.y * 0.33f

// 中心区域
val x = canvasSize.x * 0.5f + (Random.nextFloat() - 0.5f) * 100f
val y = canvasSize.y * 0.5f + (Random.nextFloat() - 0.5f) * 100f
```

## 视觉特性

### 日式烟花特点

1. **圆形扩散**：粒子呈完美圆形向外扩散
2. **拖尾效果**：模拟火花在空中的轨迹
3. **光晕效果**：核心粒子周围有柔和光晕
4. **生命周期**：从明亮到消失的自然过渡
5. **重力影响**：粒子受重力下坠

### 动画曲线

- **生命值衰减**：线性衰减 `life -= 0.015f`
- **透明度**：二次曲线 `alpha = life * life`（渐快消失）
- **速度衰减**：指数衰减 `velocity *= 0.98f`（逐渐减速）

## 最佳实践

### 页面集成

1. 烟花作为背景层
2. 内容层使用半透明背景（`alpha = 0.7f`）
3. 确保文字可读性

### 色彩搭配

- 与页面主题色协调
- 不超过 4-5 种颜色
- 至少包含一种明亮色（白色/金色）

### 性能考虑

- 移动端：particleCount <= 50
- 桌面端：particleCount <= 80
- 发射间隔 >= 2000ms

## 问题排查

### 性能问题

**症状**：动画卡顿、掉帧

**解决方案**：
1. 减少 `particleCount`
2. 增加 `fireworkInterval`
3. 使用 `SimpleFireworkEffect`

### 颜色不显示

**症状**：烟花为纯色或颜色单一

**解决方案**：
检查颜色配置，确保使用 `Color(0xFFRRGGBB)` 格式（带 Alpha 通道）

### 烟花位置异常

**症状**：烟花只在特定区域出现

**解决方案**：
检查 `canvasSize` 是否正确初始化，确保在 Canvas 绘制后设置

## 未来扩展

### 可添加的特性

1. **音效**：爆炸音效配合视觉效果
2. **互动**：点击位置发射烟花
3. **多层爆炸**：二次、三次爆炸效果
4. **特殊形状**：心形、星形等特殊烟花
5. **同步音乐**：随音乐节奏发射
6. **性能监控**：自动调整粒子数量

### 建议增强

```kotlin
// 点击发射烟花
Box(
    modifier = Modifier
        .fillMaxSize()
        .pointerInput(Unit) {
            detectTapGestures { offset ->
                // 在点击位置发射烟花
                launchFireworkAt(offset.x, offset.y)
            }
        }
)
```
