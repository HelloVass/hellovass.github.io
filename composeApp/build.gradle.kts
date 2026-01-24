// 开启 Wasm DSL 实验性功能支持
@file:OptIn(ExperimentalWasmDsl::class)

import org.jetbrains.kotlin.gradle.ExperimentalWasmDsl
import org.jetbrains.kotlin.gradle.targets.js.webpack.KotlinWebpackConfig

plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.composeMultiplatform)
    alias(libs.plugins.composeCompiler)
    alias(libs.plugins.kotlinx.serialization)
}

kotlin {

    // 配置 JavaScript 编译目标
    js {
        browser {
            // 获取项目根目录路径
            val rootDirPath = project.rootDir.path

            // 获取当前子项目目录路径
            val projectDirPath = project.projectDir.path

            // 配置 Webpack 打包工具
            commonWebpackConfig {
                // 指定输出文件名
                outputFileName = "composeApp.js"

                // 配置开发服务器
                devServer = (devServer ?: KotlinWebpackConfig.DevServer()).apply {
                    // 启动服务器时不自动打开浏览器
                    open = false

                    // 暴露静态资源目录
                    static(directory = rootDirPath, watch = false)
                    static(directory = projectDirPath, watch = false)
                }
            }
        }

        // 标记为可执行应用程序
        binaries.executable()
    }

    // 配置 WebAssembly with JavaScript interop 编译目标
    wasmJs {
        // 配置浏览器运行环境（区别于 Node.js 环境）
        browser {
            // 获取项目根目录路径（如：/path/to/tapsdk_bits_frontend）
            val rootDirPath = project.rootDir.path

            // 获取当前子项目目录路径（如：/path/to/tapsdk_bits_frontend/composeApp）
            val projectDirPath = project.projectDir.path

            // 配置 Webpack 打包工具的通用设置
            commonWebpackConfig {
                // 指定 Webpack 打包后的 JS 入口文件名
                // 这个文件负责加载 .wasm 文件并提供 JS/Wasm 互操作代码
                outputFileName = "composeApp.js"

                // 配置 Webpack 开发服务器（用于开发时的静态文件服务）
                // 注意：Kotlin/Wasm 目前不支持真正的热重载（HMR），修改代码后需要手动刷新浏览器
                devServer = (devServer ?: KotlinWebpackConfig.DevServer()).apply {

                    // 启动服务器时不自动打开浏览器（设为 true 则会自动打开）
                    open = false

                    // 配置静态资源目录，使用新的 static 函数（替代已废弃的 static 属性）
                    // 这些目录下的文件可以通过 HTTP 直接访问
                    // watch = false 避免过早触发浏览器重载（推荐设置）

                    // 暴露根目录（访问项目级别的资源，如字体文件）
                    // 例如：./ResourceHanRoundedCN-Regular.ttf 可以通过 http://localhost:8080/ResourceHanRoundedCN-Regular.ttf 访问
                    static(directory = rootDirPath, watch = false)

                    // 暴露当前模块目录（访问模块级别的资源和源代码，用于浏览器调试）
                    static(directory = projectDirPath, watch = false)
                }
            }
        }

        // 标记为可执行的应用程序（而不是库）
        // 会生成包含 main() 函数入口的完整应用
        binaries.executable()
    }

    // 配置源代码集（Source Sets）和依赖项
    sourceSets {
        // commonMain：所有平台共享的代码和依赖
        commonMain.dependencies {
            // Compose 核心库
            implementation(compose.runtime)
            // 基础 UI 组件（Column、Row、Box 等）
            implementation(compose.foundation)
            // Material 3 组件库
            implementation(compose.material3)
            // Material Icons Extended
            implementation(compose.materialIconsExtended)
            // UI 核心功能
            implementation(compose.ui)
            // 资源管理（字体、图片等）
            implementation(compose.components.resources)
            // UI 预览工具
            implementation(compose.preview)

            // Lifecycle ViewModel 与 Compose 集成
            implementation(libs.androidx.lifecycle.viewmodelCompose)
            // Lifecycle 与 Compose 集成
            implementation(libs.androidx.lifecycle.runtimeCompose)

            // Navigation Compose
            implementation(libs.androidx.navigation.compose)

            // Koin 依赖注入
            implementation(libs.koin.core)
            implementation(libs.koin.compose)
            implementation(libs.koin.compose.viewmodel)

            // Kotlinx Serialization
            implementation(libs.kotlinx.serialization.json)

            // Kotlinx DateTime
            implementation(libs.kotlinx.datetime)
        }

        // commonMain：所有平台共享的语言设置
        commonMain.languageSettings {
            // 启用 Material 3 实验性 API（如新的组件和功能）
            optIn("androidx.compose.material3.ExperimentalMaterial3Api")

            // 启用 Compose UI 实验性 API（如自定义绘制、手势等）
            optIn("androidx.compose.ui.ExperimentalComposeUiApi")
        }

        // jsMain：Kotlin/JS 平台特定的语言设置
        jsMain.languageSettings {
            // 启用 Material 3 实验性 API（如新的组件和功能）
            optIn("androidx.compose.material3.ExperimentalMaterial3Api")

            // 启用 Compose UI 实验性 API（如自定义绘制、手势等）
            optIn("androidx.compose.ui.ExperimentalComposeUiApi")
        }

        // wasmJsMain：Kotlin/Wasm 平台特定的语言设置
        wasmJsMain.languageSettings {
            // 启用 Material 3 实验性 API（如新的组件和功能）
            optIn("androidx.compose.material3.ExperimentalMaterial3Api")

            // 启用 Compose UI 实验性 API（如自定义绘制、手势等）
            optIn("androidx.compose.ui.ExperimentalComposeUiApi")
        }

        // webMain：Web 平台（JS + Wasm）共享的语言设置
        webMain.languageSettings {
            // 启用 Material 3 实验性 API（如新的组件和功能）
            optIn("androidx.compose.material3.ExperimentalMaterial3Api")

            // 启用 Compose UI 实验性 API（如自定义绘制、手势等）
            optIn("androidx.compose.ui.ExperimentalComposeUiApi")
        }
    }

    // 启用显式备用字段（Kotlin 2.0 实验性特性）
    compilerOptions {
        freeCompilerArgs.add("-Xexplicit-backing-fields")
    }
}


