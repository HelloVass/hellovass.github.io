@file:OptIn(ExperimentalWasmJsInterop::class)

package info.hellovass.reviewme.interop

import org.khronos.webgl.ArrayBuffer
import org.khronos.webgl.Int8Array
import kotlin.wasm.unsafe.UnsafeWasmMemoryApi
import kotlin.wasm.unsafe.withScopedMemoryAllocator

/**
 * JS Int8Array 到 Wasm 内存的拷贝函数
 * 使用 JsFun 实现高效的内存拷贝
 */
@JsFun(
    """ (src, size, dstAddr) => {
        const mem8 = new Int8Array(wasmExports.memory.buffer, dstAddr, size);
        mem8.set(src);
    }
"""
)
internal external fun copyInt8ArrayToWasm(src: Int8Array, size: Int, dstAddr: Int)

/**
 * Wasm 内存操作工具类
 * 提供 JS 和 Wasm 之间的数据转换功能
 */
internal class WasmMemoryUtils {

    /**
     * 将 JS Int8Array 转换为 Kotlin ByteArray
     * 通过 Wasm 内存分配和拷贝实现
     */
    fun int8ArrayToByteArray(jsArray: Int8Array): ByteArray {
        val size = jsArray.length

        // 在 Wasm 的内存中分配空间
        @OptIn(UnsafeWasmMemoryApi::class)
        return withScopedMemoryAllocator { allocator ->
            val memBuffer = allocator.allocate(size)
            val dstAddress = memBuffer.address.toInt()

            // 从 JS 拷贝数据到 Wasm 内存
            copyInt8ArrayToWasm(jsArray, size, dstAddress)

            // 从 Wasm 内存读取数据，包装成 ByteArray
            ByteArray(size) { i -> (memBuffer + i).loadByte() }
        }
    }

    /**
     * 将 ArrayBuffer 转换为 ByteArray
     */
    fun arrayBufferToByteArray(arrayBuffer: ArrayBuffer): ByteArray {
        val source = Int8Array(arrayBuffer, 0, arrayBuffer.byteLength)
        return int8ArrayToByteArray(source)
    }
}
