package info.hellovass.reviewme.di

import info.hellovass.reviewme.data.repository.LoveMemoryRepository
import org.koin.dsl.module

/**
 * 数据模块
 */
val dataModule = module {
    /**
     * 爱情纪念数据仓库
     */
    single {
        LoveMemoryRepository(
            resourceLoader = get(),
            json = get()
        )
    }
}