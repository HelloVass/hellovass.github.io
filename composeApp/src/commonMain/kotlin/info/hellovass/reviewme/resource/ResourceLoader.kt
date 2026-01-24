package info.hellovass.reviewme.resource

/**
 * 资源加载器，用于从网络加载各种资源
 * 这是一个跨平台接口，各平台需要提供具体实现
 */
expect class ResourceLoader() {
    /**
     * 从指定 URL 加载资源，并返回其 ByteArray 内容
     *
     * @param url 资源的 URL
     * @return 资源的 ByteArray
     */
    suspend fun loadResource(url: String): ByteArray
}
