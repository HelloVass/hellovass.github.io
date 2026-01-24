package info.hellovass.reviewme.resource

import info.hellovass.reviewme.interop.WasmMemoryUtils
import kotlinx.browser.window
import kotlinx.coroutines.await
import org.khronos.webgl.ArrayBuffer
import org.w3c.fetch.Response

/**
 * 资源加载器 - Kotlin/Wasm 实现
 * 使用 fetch API 和 Wasm 内存操作实现资源加载
 */
actual class ResourceLoader {

    private val wasmMemoryUtils = WasmMemoryUtils()

    /**
     * 从指定 URL 加载资源，并返回其 ByteArray 内容
     *
     * @param url 资源的 URL
     * @return 资源的 ByteArray
     */
    actual suspend fun loadResource(url: String): ByteArray {
        val response: Response = window.fetch(url).await()
        val arrayBuffer: ArrayBuffer = response.arrayBuffer().await()
        return wasmMemoryUtils.arrayBufferToByteArray(arrayBuffer)
    }
}
