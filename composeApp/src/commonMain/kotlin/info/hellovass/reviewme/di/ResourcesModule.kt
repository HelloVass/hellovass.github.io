package info.hellovass.reviewme.di

import info.hellovass.reviewme.resource.ResourceLoader
import org.koin.dsl.module

/**
 *
 */
val resourceModule = module {
    single {
        ResourceLoader()
    }
}