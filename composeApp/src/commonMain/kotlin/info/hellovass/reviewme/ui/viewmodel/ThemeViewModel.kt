package info.hellovass.reviewme.ui.viewmodel

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * 主题 ViewModel
 *
 * 管理应用的深色/浅色主题切换
 */
class ThemeViewModel : ViewModel() {

    private val _isDarkMode = MutableStateFlow(true)

    /**
     * 当前是否为深色模式
     */
    val isDarkMode: StateFlow<Boolean> = _isDarkMode.asStateFlow()

    /**
     * 切换主题
     */
    fun toggleTheme() {
        _isDarkMode.value = !_isDarkMode.value
    }
}
