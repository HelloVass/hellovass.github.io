package info.hellovass.reviewme.utils

import kotlinx.browser.window

/**
 * 浏览器工具 - Kotlin/JS 实现
 */
actual object BrowserUtils {
    actual fun openUrl(url: String) {
        window.open(url, "_blank")
    }
}