package info.hellovass.reviewme.utils

import info.hellovass.reviewme.interop.btoa
import info.hellovass.reviewme.interop.downloadImage as jsDownloadImage

/**
 * 平台工具类 - Kotlin/JS 实现
 */
actual object PlatformUtils {

    actual fun log(message: String) {
        console.log(message)
    }

    actual fun error(message: String) {
        console.error(message)
    }

    actual fun encodeBase64(binaryString: String): String {
        return btoa(binaryString)
    }

    actual fun downloadImage(base64DataUrl: String, filename: String) {
        jsDownloadImage(base64DataUrl, filename)
    }
}
