package info.hellovass.reviewme.utils

/**
 * 浏览器工具 - 跨平台接口
 */
expect object BrowserUtils {
    /**
     * 在新窗口打开 URL
     */
    fun openUrl(url: String)
}