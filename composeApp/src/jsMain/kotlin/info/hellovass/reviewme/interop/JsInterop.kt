package info.hellovass.reviewme.interop

import kotlinx.browser.window

/**
 * JS 互操作工具函数 - Kotlin/JS 平台
 * 提供与 JavaScript 环境交互的通用方法
 */

/**
 * Base64 编码
 */
fun btoa(str: String): String = window.btoa(str)

/**
 * 调用 window.downloadImage 下载图片
 */
external fun downloadImage(base64Image: String, filename: String)
