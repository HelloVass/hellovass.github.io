---
title: DiffUtil、LiveData 的应用
date: 2018-09-10 20:10:19
tags:
---

## Vue 里实现一个列表

so easy，Vue 为我们提供了`v-for` 指令，可以绑定数组的数据来渲染一个项目列表：

```html
<div id="app-4">
  <ol>
    <li v-for="todo in todos">
      {{ todo.text }}
    </li>
  </ol>
</div>

```

```js
var app4 = new Vue({
  el: '#app-4',
  data: {
    todos: [
      { text: '学习 JavaScript' },
      { text: '学习 Vue' },
      { text: '整个牛项目' }
    ]
  }
})
```

数据和视图的绑定就完成了。

<!-- more -->

### 加载更多功能

只需要 `todos.push(items)`，你就会发现**列表末尾**添加了新的项目。

### 下拉刷新功能

只需要 `todos = items`，刷新功能就完成了

在 Vue 里更新 UI，似乎只需要**对数据进行操作**就可以了，UI 就会**自动更新**，这不就是传说中响应式编程嘛？

> NOTE: 问题来了，如果 Android 也想**响应式**，**只对数据进行操作**，不去触碰 `adapter.notifyItemXXX` 系列 `api` 就完成 RecyclerView 的更新吗？

当然是可以的咯，兄 dei！

## Android 的 MVVM

> 注意，我并不会用 databinding 来实现。即使用了，你也会发现，似乎实现起来有困难。

### 前提情要

#### DiffUtil&LiveData

##### DiffUtil

[DiffUtil](https://developer.android.com/reference/android/support/v7/util/DiffUtil)，为我们提供了计算**差异值**的能力：

![DiffUtil 计算原理](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/DiffUtil%20%E8%AE%A1%E7%AE%97%E5%8E%9F%E7%90%86.png)

简单理解，`DiffUtil` 根据 `cur&next` ，就能计算出**差异值**，也就是 `DiffUtil.DiffResult`。

##### LiveData

[LiveData](https://developer.android.com/topic/libraries/architecture/livedata)，我们可以先把它看成 `RxJava` 里的 `PublishSubject`，只不过 `LiveData` 具有生命周期感知能力。

#### MVVM 的划分

这个模式我就不介绍了，也属于懒得介绍系列。这里讲下，MVVM 具体对应 Android 里的哪些东西。

- V=> Activity/Fragment，对标视图层，没啥可讲的
- M=>XXXRepo，对标数据层，就是获取**内存数据/网络数据/本地数据**的数据仓库
- VM=>XXXVM，这个是 MVVM 的核心，链接着 V 和 M。但是和 MVP 不同，是 V 持有 VM，而不是 VM 持有 V，V 订阅 VM 里的数据（LiveData 包裹的对象），当 `LiveData` 调用 `postValue/setValue`，V 就会收到数据变化通知

如图：

![Android 里的 MVVM](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/Android%20%E9%87%8C%E7%9A%84%20MVVM.png)

### 开始实现了

#### VM 层做的事情

##### 数据域

对标 Vue 里的 data ，不过，我们这里需要把真正的数据用 LiveData 包裹起来，像这样：

```kotlin
	// 列表数据项
    private val _uiStateModel = MutableLiveData<UIStateModel>()

    private val _refreshStateModel = MutableLiveData<RefreshStateModel>()

    private val _footerStateModel = MutableLiveData<FooterStateModel>()
```

##### 方法域

对标 Vue 里的 methods，定义一些业务方法，这里只有一个 `loadData` 方法，之后会详解。

##### 计算属性

对标 Vue 里的 computed ，这里，我们将**数据域**暴露出去，方便 V 层的订阅/ 绑定：

```kotlin
    fun getUIStateModel() = _uiStateModel

    fun getRefreshStateModel() = _refreshStateModel

    fun getFooterStateModel() = _footerStateModel
```

#### V 层做的事情

##### step1. 创建并获取 VM 的实例

```kotlin
    // create VM
    vm = obtainVM(JuVM::class.java)
```



##### step2. 初始化组件，并设置需要的回调

```kotlin
   // init Recyclerview
   initRecyclerViewComponent(rcvList)

   // init refresh component
   initRefreshComponent(refreshLayout)

   // init loadMore component
   initLoadMoreComponent(refreshLayout, rcvList)
```



##### step3. 订阅/观察 VM 里的计算属性

```kotlin
    private fun observeVMState(vm: JuVM?) {
        // 订阅列表数据项
        vm?.let { juVM ->
            juVM.getUIStateModel().observe(this, Observer { uiStateModel ->
                uiStateModel?.let { it ->
                    viewAdapter!!.setItems(it.latest)
                    it.diffResult!!.dispatchUpdatesTo(viewAdapter!!)
                }
            })
        }
    }
```



#### step4. 在合适的生命周期方法中，调用 VM 里的方法

```kotlin
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        // 省略...

        // 加载第一页
        vm?.loadData(false)
    }
```

#### 恭喜恭喜，基本完工

到这一步，我们算完成了一个页面的基本功能了。

### 数据和视图的绑定是如何实现的

首先得聊聊**旧石器时代**的事，那时候的我们是这么实现**加载更多**和**下拉刷新**的：

```kotlin
// 下拉刷新
@Override 
protected void onSucceed(List<Post> postList) {
       mPostList.clear();
       mPostList.addAll(postList);
       mAdapter.notifyDataSetChanged();
}

// 加载更多
@Override 
protected void onSucceed(List<Post> postList) {
       mPostList.addAll(postList);
       mAdapter.notifyItemRangeInserted(mPostList.size()-postList.size(),postList.size());
}
```

有什么问题呢？首先，刷新的代码太暴力了，直接 `notifyDataSetChanged` 导致所有 item 重新绑定一遍。接着，是加载更多，调用了 `notifyItemRangeInserted`，需要传入**起始位置**以及**新增项目的个数**，如果参数错误，凉凉╮(╯▽╰)╭

这简直没法和 web 世界的 mvvm 框架比嘛，太 low 了有木有！

#### 新石器时代

我想，屏蔽 `adapter.notifyXXX` 一系列 `api`，只通过**对数据项的操作**就实现 RecyclerView 的更新。

是时候贴出 `loadData` 的代码了：

```kotlin
        // 加载数据
        repo.getJus(pageNum)
                .map { it ->
                    // 1.当前数据
                    val cur = ArrayList(this.juList)
                    // 2.处理数据，增、删、改
                    actionHandler.handle(this.juList, it)
                    // 3.处理后的数据
                    val next = ArrayList(this.juList)
                    // 4.计算差异值
                    UIStateModel.success(cur, next, it.count())
                }
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe({ it ->
                    // 更新状态
                    actionHandler.succeed(it.hasMore())
                    // 发布差异值
                    _uiStateModel.value = it
                    // 页数加 1
                    pageNum++
                }, { _ ->
                    actionHandler.failed()
                })
```
正如同文章开头说的，通过 `Google` 提供的 `DiffUtil` ，我们将**对数据的操作**封装为 DiffUtil.DiffResult，而且是在工作线程做这些事，接着切换线程，在主线程发布 `DiffUtil.DiffResult`。最后，V 层就会收到**订阅通知**，至此，**列表数据项**与 `RecyclerView` 实现了绑定。

```kotlin
vm?.let { juVM ->
            juVM.getUIStateModel().observe(this, Observer { uiStateModel ->
                uiStateModel?.let { it ->
                    viewAdapter!!.setItems(it.latest)
                    it.diffResult!!.dispatchUpdatesTo(viewAdapter!!)
                }
            })
        }
```



### 最后

我们实现了**加载更多**和**下拉刷新**功能，真实项目中，我们可能还会涉及到 RecyclerView 修改 item。当然，理解了上面论述的原理之后，实现这样的需求也不是太难。这篇文章把**关键代码**都列出来了，部分细节不明白的话，可以参考 github 上的[完整实现](https://github.com/HelloVass/LiteMVVM)



### 参考

- [how-to-visually-stay-on-same-scroll-position-upon-unknown-number-of-recyclervie](https://stackoverflow.com/questions/47458429/how-to-visually-stay-on-same-scroll-position-upon-unknown-number-of-recyclervie/47522246#47522246)
- [Vue 列表渲染](https://cn.vuejs.org/v2/guide/list.html)