---
title: Android组件化实践与探索
date: 2019-04-02 11:56:53
tags:
- Android
- 组件化
---

## 为什么需要组件化

### 组件化之前的项目结构

![组件化之前的项目结构](http://assets.processon.com/chart_image/5ca44870e4b035b243c08eab.png)

- App 工程
  - 多个业务组件
  - 一个静态的路由，依赖了所有的业务组件，业务组件可以通过 Router 暴露出来的方法跳转到其他业务组件
- CommonLibrary
  - 多个技术组件

<!-- more -->

#### 存在的问题

- 随着业务的逐渐迭代，App 工程内的业务组件逐渐增多，工程膨胀
- 缺少编译隔离，模块之间存在相互依赖的可能
- 静态路由，需要手动维护，增加开发成本

### 业务组件通信

仔细思考，业务组件间的通信会有哪几种情况

- 跳转需求，通常情况下是组件A跳转到组件B，并且可能需要返回值
- 方法调用需求，组件A调用组件B的方法，并且可能有返回值

#### 跨组件方法调用

##### 被调用的业务组件下沉![组件下沉](http://assets.processon.com/chart_image/5ca46752e4b08743436256b6.png)

这种方案最暴力直接，但是问题也最大。只要其他业务组件需要调用，就移动到不合理的层级，容易导致下层越来越臃肿，也就失去了组件化的灵魂。

##### 原生提供的方案

- LocalBroadcast
- AIDL
- ContentProvider

##### 消息总线

EventBus、Otto、RxBus，甚至自己造一个轮子。![EventBus](http://assets.processon.com/chart_image/5ca469cce4b0874343625ea8.png)

EventBus 的问题也很明显，解耦太彻底，控制不当，事件满天飞。一个 Event 通常会导致多处 state 的变化，这种变化只能反映在UI上，而没有一个统一的地方可以看到这些 state 的变化，导致 debug 异常困难。

##### SOA 思想![SOA](http://assets.processon.com/chart_image/5ca46d75e4b031d0225bfc60.png)

这种思想来源于服务端的 SOA设计思路，原理就是将模块间的依赖导致，变为功能的提供与使用。服务提供者可以看作是一个中间件（代理），代理了所有组件能提供的服务（方法），然后组件需要调用某个服务，只需要获取到服务提供者，然后调用服务提供者提供的方法就行了。

##### Redux

该思想来源于前端著名的状态管理库 [Redux](<https://www.redux.org.cn/>)，![Redux](http://assets.processon.com/chart_image/5ca471e0e4b034408dec0606.png)

看上去似乎和之前分享的 EventBus 没什么区别，但实际上，Redux 还做了这些事情：

- 对状态的集中管理，整个 App 里只有一个挂载了多个 state 的扁平树 AppState
- dispatch action => AppState changed，可以打印 action、AppState，实现了状态的追踪

#### 组件间跳转

这就涉及到近年来移动端最火热的话题之一了，移动端路由设计。

##### 蛮荒时代-静态路由

静态路由，简单来说，就是：

```kotlin
object Router{
    fun navigateToA()
    fun navigateToB()
    fun navigateToC()
    // ...
}
```

需要开发者手动维护对业务组件的依赖，多人协作时容易起冲突，Router 还必须与业务组件在同一个工程，局限性非常大，也可以说是最惨的时代。

##### 旧石器时代-apt路由

这类栗子非常多，网上大部分开源框架也是基于这个方案来实现，核心就是 [APT](<https://joyrun.github.io/2016/07/19/AptHelloWorld/>)。但是，使用 Apt 也有一些问题，每个 module library 需要手动注册，原因是 Apt 是在 javacompile 任务前插入了一个 task，所以只对自己的 module library 的注解做处理。

##### 新石器时代-plugin路由

这个就更厉害了，通过编写 gradle 插件实现路由表的自动加载，大概原理：

>在编译时，扫描所有类，将符合条件的类收集起来，并通过修改字节码生成注册代码到指定的管理类中，从而实现编译时自动注册的功能，不用再关心项目中有哪些组件类了。不会增加新的 class，不需要反射，运行时直接调用组件的构造方法。

## 组件化演进

### 业务组件插拔

- TODO

### Git 多仓库管理

- TODO

### 业务组件开发流程

- TODO

## 参考资料

- [Android组件自动注册方案](<http://app.zhenzikj.com/blog/300000023/10128.html>)
- [二维火掌柜Android模块化架构实践](<https://dmanager.github.io/android/2017/12/30/androud-mo-kuai-hua/>)
- [Android APT （编译时代码生成）最佳实践](<https://joyrun.github.io/2016/07/19/AptHelloWorld/>)
- [Android模块化平台设计-讲稿](<https://xiaozhuanlan.com/topic/7095341862>)
- [Android组件化核心之路由实现](<http://www.10tiao.com/html/169/201612/2650821633/1.html>)
- [Android 组件化 —— 路由设计最佳实践](<https://www.jianshu.com/p/8a3eeeaf01e8>)