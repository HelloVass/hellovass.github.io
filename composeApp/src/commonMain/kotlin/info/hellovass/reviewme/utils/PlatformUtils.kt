package info.hellovass.reviewme.utils

/**
 * 平台工具类
 * 提供日志、base64 编码、下载、弹窗等平台相关功能
 */
expect object PlatformUtils {

    /**
     * 输出日志
     */
    fun log(message: String)

    /**
     * 输出错误日志
     */
    fun error(message: String)

    /**
     * Base64 编码
     */
    fun encodeBase64(binaryString: String): String

    /**
     * 下载图片
     */
    fun downloadImage(base64DataUrl: String, filename: String)
}
