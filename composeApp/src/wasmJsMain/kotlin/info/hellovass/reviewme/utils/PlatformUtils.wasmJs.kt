package info.hellovass.reviewme.utils

import info.hellovass.reviewme.interop.btoa
import info.hellovass.reviewme.interop.consoleError
import info.hellovass.reviewme.interop.consoleLog
import info.hellovass.reviewme.interop.downloadImage as jsDownloadImage

/**
 * 平台工具类 - Kotlin/Wasm 实现
 */
actual object PlatformUtils {

    actual fun log(message: String) {
        consoleLog(message)
    }

    actual fun error(message: String) {
        consoleError(message)
    }

    actual fun encodeBase64(binaryString: String): String {
        return btoa(binaryString)
    }

    actual fun downloadImage(base64DataUrl: String, filename: String) {
        jsDownloadImage(base64DataUrl, filename)
    }
}
