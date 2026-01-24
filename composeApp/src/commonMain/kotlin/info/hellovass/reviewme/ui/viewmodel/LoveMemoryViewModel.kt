package info.hellovass.reviewme.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import info.hellovass.reviewme.data.LoveMemoryData
import info.hellovass.reviewme.data.repository.LoveMemoryRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * 爱情纪念页面 ViewModel
 * 管理页面状态和数据加载
 */
class LoveMemoryViewModel(
    private val repository: LoveMemoryRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<LoveMemoryUiState>(LoveMemoryUiState.Loading)

    /**
     * UI 状态
     */
    val uiState: StateFlow<LoveMemoryUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    /**
     * 加载数据
     */
    private fun loadData() {
        viewModelScope.launch {
            _uiState.value = LoveMemoryUiState.Loading

            repository.loadLoveMemoryData()
                .onSuccess { data ->
                    _uiState.value = LoveMemoryUiState.Success(data)
                }
                .onFailure { error ->
                    _uiState.value = LoveMemoryUiState.Error(
                        error.message ?: "Failed to load data"
                    )
                }
        }
    }

    /**
     * 重试加载
     */
    fun retry() {
        repository.clearCache()
        loadData()
    }
}

/**
 * UI 状态封装
 */
sealed class LoveMemoryUiState {
    /**
     * 加载中
     */
    data object Loading : LoveMemoryUiState()

    /**
     * 加载成功
     */
    data class Success(val data: LoveMemoryData) : LoveMemoryUiState()

    /**
     * 加载失败
     */
    data class Error(val message: String) : LoveMemoryUiState()
}
