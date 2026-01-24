package info.hellovass.reviewme.utils

/**
 * 跨平台的 ByteArray 转 String 扩展函数
 */
expect fun ByteArray.toUtf8String(): String

/**
 * 将 ByteArray 转换为二进制字符串
 * 用于 base64 编码前的预处理
 */
expect fun ByteArray.toBinaryString(): String