package info.hellovass.reviewme.utils

/**
 * Kotlin/Wasm 实现 ByteArray 转 UTF-8 String
 */
actual fun ByteArray.toUtf8String(): String {
    return this.decodeToString()
}

/**
 * 将 ByteArray 转换为二进制字符串
 * 用于 base64 编码前的预处理
 */
actual fun ByteArray.toBinaryString(): String {
    return joinToString("") { byte ->
        (byte.toInt() and 0xFF).toChar().toString()
    }
}
