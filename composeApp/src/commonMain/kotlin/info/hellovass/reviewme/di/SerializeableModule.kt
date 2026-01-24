package info.hellovass.reviewme.di

import kotlinx.serialization.json.Json
import org.koin.dsl.module

/**
 * 序列化模块
 */
val serializableModule = module {
    /**
     * Json 序列化配置
     */
    single {
        Json {
            // 忽略 JSON 中存在但 data class 中不存在的字段
            ignoreUnknownKeys = true
            // 宽松解析（允许不规范的 JSON）
            isLenient = true
            // JSON 中缺少可空字段时，使用 data class 中定义的默认值
            explicitNulls = false
            // 遇到无效值时（如 null 赋给非空字段），使用默认值
            coerceInputValues = true
            // 编码时使用默认值（减少 JSON 体积）
            encodeDefaults = false
        }
    }
}