package info.hellovass.reviewme.di

import org.koin.core.module.Module

/**
 * All Koin modules for the application
 */
val allModules: List<Module> = listOf(
    resourceModule,
    serializableModule,
    dataModule,
    viewModelModule
)