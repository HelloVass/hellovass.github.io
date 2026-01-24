# 项目架构文档

## 技术栈

- **Kotlin Multiplatform**: 支持 JS 和 WasmJS
- **Compose Multiplatform**: UI 框架
- **Koin**: 依赖注入
- **kotlinx.serialization**: JSON 序列化
- **kotlinx-datetime**: 时间处理
- **Material 3**: 设计系统

## 项目结构

```
composeApp/src/
├── commonMain/          # 跨平台共享代码
│   ├── kotlin/
│   │   └── info/hellovass/reviewme/
│   │       ├── data/             # 数据层
│   │       │   ├── model/        # 数据模型
│   │       │   └── repository/   # 数据仓库
│   │       ├── di/               # 依赖注入模块
│   │       ├── navigation/       # 导航路由
│   │       ├── resource/         # 资源加载器（expect/actual）
│   │       ├── ui/               # UI 层
│   │       │   ├── components/   # 可复用组件
│   │       │   ├── screen/       # 页面
│   │       │   ├── theme/        # 主题配置
│   │       │   └── viewmodel/    # ViewModel
│   │       └── utils/            # 工具类
│   └── composeResources/         # Compose 资源
│       └── drawable/             # 图片资源
├── webMain/             # Web 平台共享代码
│   ├── kotlin/          # Web 特定 Kotlin 代码
│   └── resources/       # Web 资源
│       └── data/        # JSON 配置文件
├── jsMain/              # Kotlin/JS 特定实现
└── wasmJsMain/          # Kotlin/Wasm 特定实现
```

## 架构分层

### 1. 数据层 (Data Layer)

#### Model
- `LoveMemoryData.kt`: 爱情纪念数据模型
  - `Couple`: 情侣信息
  - `Banner`: 横幅配置
  - `Timeline`: 时间线配置
  - `Feature`: 功能卡片配置

#### Repository
- `LoveMemoryRepository.kt`: 数据仓库
  - 职责：加载和缓存爱情纪念数据
  - 数据源：Web resources 中的 JSON 文件
  - 缓存策略：内存缓存

### 2. UI 层 (UI Layer)

#### ViewModel
- `LoveMemoryViewModel.kt`: 爱情纪念页面 ViewModel
  - 状态管理：`LoveMemoryUiState` (Loading/Success/Error)
  - 数据加载：通过 Repository 获取数据
  - 重试机制：清除缓存并重新加载

#### Screen
- `LoveMemoryScreen.kt`: 爱情纪念页面
  - 根据 UiState 渲染不同状态
  - 组件化设计：BannerSection、AvatarSection、TimeCounterSection 等

### 3. 依赖注入 (DI)

#### 模块

**resourceModule**
```kotlin
single { ResourceLoader() }
```

**serializableModule**
```kotlin
single {
    Json {
        ignoreUnknownKeys = true
        isLenient = true
        // ...
    }
}
```

**dataModule**
```kotlin
single {
    LoveMemoryRepository(
        resourceLoader = get(),
        json = get()
    )
}
```

**viewModelModule**
```kotlin
viewModel { ThemeViewModel() }
viewModel { LoveMemoryViewModel(repository = get()) }
```

## 数据驱动

### 配置文件
位置：`composeApp/src/webMain/resources/data/love_memory.json`

```json
{
  "meetingDate": "2020-01-01T00:00:00Z",
  "marriageDate": "2023-10-01T00:00:00Z",
  "couple": {
    "me": { "name": "轲爷", "avatar": "drawable/me.jpg" },
    "wife": { "name": "老婆", "avatar": "drawable/wife.jpg" }
  },
  "banner": {
    "title": "我们的故事"
  },
  "timeline": {
    "title": "从我们相识",
    "subtitle": "每一刻都值得珍藏"
  },
  "features": [...]
}
```

### 优势

1. **内容与代码分离**: 修改文案无需重新编译
2. **易于维护**: 所有配置集中在一个文件
3. **便于迁移**: 未来可轻松切换到后端 API

## 跨平台支持

使用 `expect/actual` 模式实现平台特定功能：

### ResourceLoader
```kotlin
// commonMain
expect class ResourceLoader() {
    suspend fun loadResource(url: String): ByteArray
}

// jsMain
actual class ResourceLoader {
    actual suspend fun loadResource(url: String): ByteArray {
        return window.fetch(url).await().arrayBuffer().await().toByteArray()
    }
}

// wasmJsMain
actual class ResourceLoader {
    actual suspend fun loadResource(url: String): ByteArray {
        // 使用 WasmMemoryUtils 进行内存操作
    }
}
```

## 状态管理

使用 Kotlin Flow + StateFlow 进行响应式状态管理：

```kotlin
// ViewModel
private val _uiState = MutableStateFlow<LoveMemoryUiState>(Loading)
val uiState: StateFlow<LoveMemoryUiState> = _uiState.asStateFlow()

// Screen
val uiState by viewModel.uiState.collectAsState()
```

## 主题系统

Material 3 动态主题：
- 支持深色/浅色模式切换
- 自定义字体 (ResourceHanRounded)
- 通过 ThemeViewModel 管理主题状态

## 开发指南

### 添加新页面

1. 在 `navigation/Routes.kt` 添加路由
2. 创建 Screen 在 `ui/screen/`
3. 如需状态管理，创建 ViewModel 在 `ui/viewmodel/`
4. 如需数据加载，创建 Repository 在 `data/repository/`
5. 在相应的 DI 模块中注册

### 修改内容

直接编辑 `webMain/resources/data/love_memory.json`

### 添加资源

图片资源放在 `commonMain/composeResources/drawable/`

## 运行项目

```bash
# Kotlin/Wasm (推荐)
./gradlew :composeApp:wasmJsBrowserDevelopmentRun

# Kotlin/JS
./gradlew :composeApp:jsBrowserDevelopmentRun

# 生产构建
./gradlew :composeApp:wasmJsBrowserProductionWebpack
```

## 未来扩展

### 后端 API 集成

只需修改 `LoveMemoryRepository`:

```kotlin
suspend fun loadLoveMemoryData(): Result<LoveMemoryData> {
    return try {
        // 从 API 获取数据而不是本地 JSON
        val response = httpClient.get("https://api.example.com/love-memory")
        Result.success(response.body())
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

### 添加更多功能

- 相册功能（Feature: love_channel）
- 留言板（Feature: message_board）
- 关于我们（Feature: about_us）

每个功能可独立开发，遵循相同的架构模式。
