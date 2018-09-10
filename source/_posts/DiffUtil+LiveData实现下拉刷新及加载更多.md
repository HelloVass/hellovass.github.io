---
title: DiffUtil、LiveData 的应用
date: 2018-09-10 20:10:19
tags:
---

## Vue 里实现一个列表

so easy，Vue 为我们提供了 v-for 指令，可以绑定数组的数据来渲染一个项目列表：

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

只需要 todos.push(items)，你就会发现列表最后添加新的项目。

### 下拉刷新功能

只需要 todos = items，就能实现页面的刷新功能

记住，在 Vue 里更新数据，似乎只需要操作数据（VM 里的 state），我们就可以优雅地更新 UI 了，实际上，连更新 UI 的事情，也是 Vue 帮我们做的，真爽！

可是，问题来了，如果我 Android 也想爽一把，该怎么做呢？我们也能只操作数据，不去碰什么 adapter.notifyItemXXX 方法就实现列表的 CURD 吗？

当然是可以的咯，兄 dei

## Android 的 MVVM

> 注意，我并不会用什么 databinding 来实现。即使用了，你也会发现，似乎并不能实现。

### 前提情要

#### DiffUtil&LiveData

- [DiffUtil](https://developer.android.com/reference/android/support/v7/util/DiffUtil)，为我们提供了计算差异值的能力。具体啥意思呢，就是提供当前的数据项，之后的数据项，就能计算出一个 DiffUtil.DiffResult，这里我称之为差异值。
- [LiveData](https://developer.android.com/topic/libraries/architecture/livedata)，我们可以先把它看成 RxJava 里的 PublishSubject，只不过 LiveData 具有生命周期感知能力。

#### MVVM 怎么划分

这个模式我就不介绍了，也属于懒得介绍系列。这里讲下，MVVM 具体对应 Android 里的哪些东西。

- V=> Activity/Fragment，对标视图层，没啥可讲的
- M=>XXXRepo，对标数据层，就是获取**内存数据/网络数据/本地数据**的数据仓库
- VM，这个是 MVVM 的核心，链接着 V 和 M。但是和 MVP 明显不同，V 持有 VM，而不是 VM 持有 V，V 订阅 VM 里的数据（其实就是 LiveData 包裹的对象），当这些数据发生变化，V 就会被更新

如图：

![Android 里的 MVVM](http://7xsq1h.com1.z0.glb.clouddn.com/Android%20%E9%87%8C%E7%9A%84%20MVVM.png)

### 注意，开始实现了

#### VM 的创建

##### 数据域

有点儿类似 Vue 里的 data 字段，不过，我们这里需要把真正的数据用 LiveData 包裹起来，像这样：

```kotlin
	// 列表数据项
    private val _uiStateModel = MutableLiveData<UIStateModel>()

    private val _refreshStateModel = MutableLiveData<RefreshStateModel>()

    private val _footerStateModel = MutableLiveData<FooterStateModel>()
```

##### 方法域

有点儿类似 Vue 里的 methods，定义一些业务方法，这里只有一个 loadData 方法，等下会详解这个方法。

##### 计算属性

对标 Vue 里的 computed 属性，这里，我们将数据域暴露出去，方便 V 层的订阅/ 绑定：

```kotlin
    fun getUIStateModel() = _uiStateModel

    fun getRefreshStateModel() = _refreshStateModel

    fun getFooterStateModel() = _footerStateModel
```

#### V 的创建

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



#### step4. 在合适的生命周期函数中，调用 VM 里的方法

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

到这一步，我们基本算完成了一个页面的 mvvm 了。

### 来谈谈核心，数据和视图的绑定是如何实现的

先来谈谈旧石器时代的事情吧，那时候的我们是如何实现**加载更多**和**下拉刷新**的：

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

在 Android 里，我们会时常与 adapter.notifyXXX 这个系列的 api 打交道，有时候 position 计算错误，gg。和 Vue 的代码相比，这也，太不方便了吧？！

#### 新石器时代

有木有屏蔽 adapter.notifyXXX api 细节，只是通过对数据项的操作就实现 RecyclerView 的变化的呢？答案当然是有的，也就是这篇文章想要给大家分享的方案。

是时候贴出 loadData 方法的代码了：

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
文章开头也说了，通过 Google 提供的 DiffUtil 方案，我们将对 RecyclerView 的**增删改**封装为一个 DiffUtil.DiffResult  数据域，每次有新的修改操作发生时，我们在工作线程计算出差异值，然后发布差异值，最后，V 层的订阅代码就会收到通知，列表数据项至此就和 RecyclerView 实现了绑定！

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

本例中，我们实现了加载更多和下拉刷新的操作，真实项目中，我们可能还会涉及到 RecyclerView 修改 item，当然，理解了上面论述的原理之后，实现这样的需求绑定也不是太难了。这篇文章把关键代码都列出来了，部分细节不明白的话，可以参考 github 上的[完整实现](https://github.com/HelloVass/LiteMVVM)



### 参考

- [how-to-visually-stay-on-same-scroll-position-upon-unknown-number-of-recyclervie](https://stackoverflow.com/questions/47458429/how-to-visually-stay-on-same-scroll-position-upon-unknown-number-of-recyclervie/47522246#47522246)
- [Vue 列表渲染](https://cn.vuejs.org/v2/guide/list.html)