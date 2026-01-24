import org.gradle.kotlin.dsl.withType
import org.jetbrains.kotlin.gradle.targets.js.nodejs.NodeJsEnvSpec
import org.jetbrains.kotlin.gradle.targets.js.nodejs.NodeJsPlugin
import org.jetbrains.kotlin.gradle.targets.js.yarn.YarnPlugin
import org.jetbrains.kotlin.gradle.targets.js.yarn.YarnRootEnvSpec
import kotlin.apply

plugins {
    alias(libs.plugins.composeMultiplatform) apply false
    alias(libs.plugins.composeCompiler) apply false
    alias(libs.plugins.kotlinMultiplatform) apply false
}

// 配置 Node.js（使用新的 API）
plugins.withType<NodeJsPlugin> {
    the<NodeJsEnvSpec>().apply {
        // 指定 Node.js 版本
        version.set(libs.versions.nodejs.get())
        // 或者使用淘宝镜像
        downloadBaseUrl.set("https://registry.npmmirror.com/-/binary/node")
    }
}

// 配置 Yarn
plugins.withType<YarnPlugin> {
    the<YarnRootEnvSpec>().apply {
        // 指定 Yarn 版本
        version.set(libs.versions.yarn.get())
    }
}