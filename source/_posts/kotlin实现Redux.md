---
title: kotlin 实现 redux
date: 2020-03-30 17:19:34
categories: 技术
tags:
    - Kotlin
---

# 前言

从刚接触 Android 的时候有一些业务场景真的让人蛋疼，虽说不是无解，但问题是解决了，但看着这堆代码总觉得哪里怪怪的。

那么，是什么问题呢？

{% raw %}

<div style="position: relative; width: 100%; height: 0; padding-bottom: 75%;">
    <iframe src="//player.bilibili.com/player.html?aid=73040039&bvid=BV1hE41127pY&cid=124939237&page=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="position: absolute; width: 100%; height: 100%; left: 0; top: 0;">
    </iframe>
</div>

{% endraw %}

<!-- more -->

# State Management

React 的理念里有这么一个公式：

> UI = render(data)

UI 即用户看到的界面，是一个 `render`（函数）的执行结果，只接受 `data`（数据）作为参数。这个函数是一个**纯函数**，所谓纯函数，指的是没有任何副作用，输出完全依赖于输入的函数，两次函数调用，如果输入相同，得到的结果也绝对相同。如此一来，最终的用户界面，在 `render` 函数确定的情况下完全取决于输入数据。

对于开发者来说，重要的是区分开哪些属于 `data`，哪些属于 `render`，想要更新用户界面，要做的就是更新 `data`，用户界面自然会做出响应，所以 React 实践的也是“响应式编程”（Reactive Programming）的思想。

## React 的 state

驱动组件渲染过程的除了 prop，还有 state， state 代表组件的内部状态。由于 React 组件不能修改传入的 prop，所以需要记录自身数据变化，就要使用 state。

## 状态分类

状态分 2 种：

- 局部状态：这种由 Component 管理，比如：
    - Progressbar 的当前进度
    - TabIndicator 的当前选中 tab

这种状态不需要使用复杂的状态管理方案，靠 Component 维护就好了。

- 全局状态：需要在2个及以上的地方共享的状态。比如：
    - 用户信息
    - 用户设置
    - 购物车
    - ...

而这些状态的划分，emmm，没有一个清晰的界限，主要还是靠程序员的经验。但是，单靠 Component 的 setState() 来管理所有的状态是有[极限](https://weread.qq.com/web/reader/a0b327005d185ca0b5a7803k6ea321b021d6ea9ab1ba605)的！


上述的状态管理方案，对前端童鞋来说已经 8 是问题了，并且还给出了许多优秀的开源框架：

- redux
- mobx
- vuex
- ...

## Android 的状态管理方案

严格来说，从事 Android 开发的童鞋似乎很少在官方文档或者社区上看到**State Management**相关的介绍，实践就更少了，首先，Android 是命令式的（imperative），通过 `setText()` 类似的命令式 API 来改变 UI，所以大部分 Android 看到上述 `UI = render(data)` 这样的公式，都会有点摸不着头脑。然后，在那个还没有 Kotlin 的年代，Android 的主流开发语言是 Java，大家最熟悉的就是 OOP 编程， 什么函数式编程，什么纯函数啊，不可变特性啊。。。天顶星人科技？最后的结果就是，大家在这方面思考的少，而现有的系统API、第三方库甚至自己稍微捣鼓捣鼓，也能解决，所以，Android 的 UI 开发体验一直都不如前端。而我本人，也在近些年的工作学习中不断质疑（接触了前端之后），为毛 Android 这些业务代码写起来就是没有前端的香呢？

虽然 Android 上没有**状态管理**，但是有类似的东东！

### 组件间通信

Android 采取的思路是基于**模块化**的分冶思路，即 App 只是一个壳，按照业务划分为多个子模块，业务与业务之间隔离。在组件化的工程中，由于我们的业务模块间是物理隔离（模块间无法在编译期间访问各自的代码）的，模块间想获取不属于自己的数据（状态）时就会有问题，例如：

- **模块A**里的某个 `Activity/Fragment` 想获取到**模块B**购物车的信息
- **模块C**里的某个 `Activity` 想跳转到**模块A**的某个 `Activity`
- **模块D**里的某个 `Activity` 想调用**模块E**里的某个**方法**
- 。。。

Android 里面对的和”状态管理“类似的往往是这些问题。

#### 路由库

下面以阿里的 [ARouter](https://github.com/alibaba/ARouter) 为🌰具体进行说明是如何解决**组件间通信**的问题：

##### 发起路由请求

```java
// 跳转并携带参数
ARouter.getInstance().build("/test/1")
            .withLong("key1", 666L)
            .withString("key3", "888")
            .withObject("key4", new Test("Jack", "Rose"))
            .navigation();
```

##### 通过服务注册&发现

1. 通过依赖注入解耦:服务管理(一) 暴露服务

```java

// 声明接口,其他组件通过接口来调用服务
public interface HelloService extends IProvider {
    String sayHello(String name);
}

// 实现接口
@Route(path = "/yourservicegroupname/hello", name = "测试服务")
public class HelloServiceImpl implements HelloService {

    @Override
    public String sayHello(String name) {
    return "hello, " + name;
    }

    @Override
    public void init(Context context) {

    }
}
```

2. 通过依赖注入解耦：服务管理(二) 发现服务

```java
public class Test {
    @Autowired
    HelloService helloService;

    @Autowired(name = "/yourservicegroupname/hello")
    HelloService helloService2;

    HelloService helloService3;

    HelloService helloService4;

    public Test() {
    ARouter.getInstance().inject(this);
    }

    public void testService() {
    // 1. (推荐)使用依赖注入的方式发现服务,通过注解标注字段,即可使用，无需主动获取
    // Autowired注解中标注name之后，将会使用byName的方式注入对应的字段，不设置name属性，会默认使用byType的方式发现服务(当同一接口有多个实现的时候，必须使用byName的方式发现服务)
    helloService.sayHello("Vergil");
    helloService2.sayHello("Vergil");

    // 2. 使用依赖查找的方式发现服务，主动去发现服务并使用，下面两种方式分别是byName和byType
    helloService3 = ARouter.getInstance().navigation(HelloService.class);
    helloService4 = (HelloService) ARouter.getInstance().build("/yourservicegroupname/hello").navigation();
    helloService3.sayHello("Vergil");
    helloService4.sayHello("Vergil");
    }
}
```

#### 事件总线

以 [EventBus](https://github.com/greenrobot/EventBus) 为代表的事件总线库，简化了使用原生通信的复杂度：

- startActivityForResult & onActivityResult
- Broadcast
- LocalBroadcast
- ...

也看似让我们的代码得到解耦？但是，使用不当的同时也为项目埋下了一颗[定时💣](https://zhuanlan.zhihu.com/p/26160377)。

## Android 端 redux 实现

Android 组件间通信的方案给人的感觉更偏向**通信**而没有**前端状态管理**的那个味儿。那，能不能。。。

能！

受到 [redux](https://github.com/johnpryan/redux.dart) 这个项目的启发，我用 `kotlin&rxjava` 也实现了一个 `redux`，也可以认为和 Android 平台无关的 redux（没有用到 Android 的类），当然之后也可以像 [flutter_redux](https://github.com/brianegan/flutter_redux) 一样，包一层 Android 相关的类，实现一个 Android 平台的 redux。

### 原理简述

首先非常感谢 kotlin 和 rxjava，kotlin 和 dart 还是蛮相近的，看下 dart 版的 redux 大概就能想出如果用 kotlin 咋实现的，而对着 JavaScript 写有时候就会😳。而 rxjava 基本可以等价于 flutter stream api，所以，实现一个 kt 版的 redux，难度系数大大降低！

1. 定义函数

```kotlin
// store.kt
typealias Middleware<State> = (store: IStore<State>, action: Any, next: NextDispatcher) -> Any

typealias NextDispatcher = (action: Any) -> Any

typealias Reducer<State> = (state: State, action: Any) -> State
```

2. 定义 Store 接口

```kotlin
// store.kt
interface IStore<State> {

    var _state: State

    var reducer: Reducer<State>

    var middleware: List<Middleware<State>>

    var changeController: Subject<State>

    val state: State

    val onChange: Observable<State>

    fun dispatch(action: Any)
}
```

注意这几点：

- changeController 使用 Subject<State> 类型
- onChange 使用 Observeable<State> 类型，其实这里我犯了个错，最早的版本用的 aac 里的 LiveData，因为之前一直以为 ~~LiveData≈Subject~~ 。但后来看到了[把 LiveData 用于事件传递那些坑](https://juejin.im/post/5cdff0de5188252f5e019bea)，结合源码后，我意识到，出事了，这个场景下 LiveData 是不适用的，它会丢失事件，它就不是被设计出来干这件事的！

3. Store 实现

```kotlin
// store.kt
class Store<State> private constructor(
    override var _state: State,
    override var reducer: Reducer<State>,
    override var middleware: List<Middleware<State>>,
    override var changeController: Subject<State>
) : IStore<State> {

    override val state: State
        get() = _state

    override val onChange: Observable<State>
        get() = changeController

    private var dispatchers: List<NextDispatcher> = createDispatchers(
        middleware, createReduceAndNotify()
    )

    override fun dispatch(action: Any) {
        dispatchers[0](action)
    }

    private fun createDispatchers(
        middleware: List<Middleware<State>>,
        reduceAndNotify: NextDispatcher
    ): List<NextDispatcher> {

        val dispatchers = mutableListOf(reduceAndNotify)

        middleware.reversed()
            .map { nextMiddleware: Middleware<State> ->
                val next = dispatchers.last()
                dispatchers += { action: Any ->
                    nextMiddleware.invoke(
                        this,
                        action,
                        next
                    )
                }
            }

        return dispatchers.reversed()
    }

    private fun createReduceAndNotify(): NextDispatcher {
        return { action: Any ->
            val state = reducer.invoke(_state, action)
            _state = state
            changeController.onNext(state)
        }
    }

    companion object {
        fun <State> create(
            initialState: State,
            reducer: Reducer<State>,
            middleware: List<Middleware<State>> = emptyList(),
            changeController: Subject<State> = PublishSubject.create()
        ): IStore<State> = Store(
            _state = initialState,
            reducer = reducer,
            middleware = middleware,
            changeController = changeController
        )
    }
}
```

得益于 Kotlin 的函数式特性，这段实现和原版的 dart 相比也没有啰嗦多少😀。这里将 Store 设计为一个不可继承的 class，并且将构造函数的车门也焊死了，创建这个 Store 实例的方法只有 `Store#create` 函数，通过命名参数，使用者能很清晰的知道传些啥值，不过还是要介绍下 reducer 这个参数。

reducer:List<Reducer> 合并成的一个 Reducer 对象，这里参考了 JavaScript版 redux 的 combine 函数，贴下代码：

```kotlin
// reducer.kt
fun <State> combineReducers(reducers: List<Reducer<State>>): Reducer<State> {
    return { state: State, action: Any ->
        reducers.fold(initial = state) { acc: State, func: Reducer<State> ->
            return@fold func(acc, action)
        }
    }
}
```

# Demo

有空再补，算了，还是先补上一些吧。

## AppStore

创建一个单例 Store（因为该 Store 里的状态是全局的），配置好对应的参数：

- reducer，之前介绍过，略
- middleware，中间件，这里只添加了一个日志中间件

```kotlin
// AppStore.kt
private fun createStore(): IStore<AppState> = Store.create(
    initialState = AppState(),
    reducer = combineReducers(listOf(countReducer)),
    middleware = listOf(loggerMiddleware)
)

class AppStore private constructor(
    store: IStore<AppState> = createStore()
) : IStore<AppState> by store {

    companion object {
        val INSTANCE: AppStore by lazy { AppStore() }
    }
}
```

# 参考

- [redux](https://github.com/johnpryan/redux.dart)
- [flutter_redux](https://github.com/brianegan/flutter_redux)
- [把 LiveData 用于事件传递那些坑](https://juejin.im/post/5cdff0de5188252f5e019bea)
- [为了弄懂Flutter的状态管理, 我用10种方法改造了counter app](https://www.cnblogs.com/mengdd/p/flutter-state-management.html)
- [深入浅出 React 和 Redux](https://weread.qq.com/web/reader/a0b327005d185ca0b5a7803k6ea321b021d6ea9ab1ba605)