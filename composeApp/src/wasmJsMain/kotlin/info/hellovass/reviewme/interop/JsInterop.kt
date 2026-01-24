@file:OptIn(ExperimentalWasmJsInterop::class)

package info.hellovass.reviewme.interop

/**
 * Base64 编码
 */
@JsFun("(str) => btoa(str)")
external fun btoa(str: String): String

/**
 * 控制台日志输出
 */
@JsFun("(msg) => console.log(msg)")
external fun consoleLog(message: String)

/**
 * 控制台错误输出
 */
@JsFun("(msg) => console.error(msg)")
external fun consoleError(message: String)

/**
 * 调用 window.downloadImage 下载图片
 */
@JsFun("(base64, filename) => window.downloadImage(base64, filename)")
external fun downloadImage(base64Image: String, filename: String)
