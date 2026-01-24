package info.hellovass.reviewme.data.repository

import info.hellovass.reviewme.data.LoveMemoryData
import info.hellovass.reviewme.resource.ResourceLoader
import kotlinx.serialization.json.Json

/**
 * 爱情纪念数据仓库
 * 负责加载和缓存爱情纪念数据
 */
class LoveMemoryRepository(
    private val resourceLoader: ResourceLoader,
    private val json: Json
) {

    private var cachedData: LoveMemoryData? = null

    /**
     * 加载爱情纪念数据
     * 优先从缓存获取，缓存不存在时从资源加载
     */
    suspend fun loadLoveMemoryData(): Result<LoveMemoryData> {
        return try {
            // 如果有缓存，直接返回
            cachedData?.let {
                return Result.success(it)
            }

            // 从资源加载
            val jsonBytes = resourceLoader.loadResource("./data/love_memory.json")
            val jsonString = jsonBytes.decodeToString()
            val data = json.decodeFromString<LoveMemoryData>(jsonString)

            // 缓存数据
            cachedData = data

            Result.success(data)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * 清除缓存
     * 用于强制重新加载数据
     */
    fun clearCache() {
        cachedData = null
    }
}
