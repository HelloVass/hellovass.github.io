package info.hellovass.reviewme.di

import info.hellovass.reviewme.ui.viewmodel.LoveMemoryViewModel
import info.hellovass.reviewme.ui.viewmodel.ThemeViewModel
import org.koin.core.module.dsl.viewModel
import org.koin.dsl.module

/**
 * ViewModel 模块
 */
val viewModelModule = module {
    /**
     * 主题 ViewModel
     */
    viewModel {
        ThemeViewModel()
    }

    /**
     * 爱情纪念 ViewModel
     */
    viewModel {
        LoveMemoryViewModel(
            repository = get()
        )
    }
}