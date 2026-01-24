package info.hellovass.reviewme.resource

import kotlinx.browser.window
import kotlinx.coroutines.await
import org.khronos.webgl.ArrayBuffer
import org.khronos.webgl.Int8Array

/**
 * 资源加载器 - Kotlin/JS 实现
 */
actual class ResourceLoader {

    /**
     * 从指定 URL 加载资源，并返回其 ByteArray 内容
     *
     * @param url 资源的 URL
     * @return 资源的 ByteArray
     */
    actual suspend fun loadResource(url: String): ByteArray {
        val arrayBuffer = window.fetch(url)
            .await()
            .arrayBuffer()
            .await()

        return arrayBuffer.toByteArray()
    }

    /**
     * ArrayBuffer 到 ByteArray 的转换
     * Kotlin/JS 版本使用 asDynamic() 实现
     */
    private fun ArrayBuffer.toByteArray(): ByteArray {
        val source = Int8Array(this, 0, byteLength)
        return ByteArray(source.length) { index ->
            source.asDynamic()[index] as Byte
        }
    }
}
