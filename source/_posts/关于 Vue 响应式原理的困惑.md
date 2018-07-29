---
title: 关于 Vue 响应式原理的困惑
date: 2018-07-29 14:11:41
tags:
---

## 需求描述

需要将**用户信息的 UI**（下文用 `UserInfo` 来代替） 写成一个 `Vue` 组件，达到**重用**的目的。

<!-- more -->


## UserInfo 组成

- 用户信息的模板
- 获取用户信息的逻辑
- 样式



## 大概长这样

请先忽略**丑陋的UI**，显示的元素主要就俩：

- **头像**
- **昵称**。

![UserInfo 组件](http://7xsq1h.com1.z0.glb.clouddn.com/UserInfo%20%E7%BB%84%E4%BB%B6.png)




## 服务端返回的数据格式

```json
{
    "data":{
        "id":"2",
        "type":"user",
        "attributes":{
            "nick_name":"HelloVass",
            "avatar":"https://wx.qlogo.cn/mmopen/vi_32/DYAIOgq83epZOhVL6QcUqJjEo7mqSpiamWRAaX1lB9dV79PzfOA5CMzBlBmCUfKibb2JyMQ0Rubic9OLMzjBRS9Gw/132",
            "score":0,
            "data":{
                "gender":1,
                "city":"Hangzhou",
                "province":"Zhejiang",
                "country":"China"
            }
        }
    }
}
```



## UserInfo 的代码非常简单

```vue
<template>

  <div class="user-container">
    <!--背景-->
    <image
      class="user-bg"
      mode="aspectFill"
      :src="userInfo.avatar"
    >
    </image>
     <!--用户信息-->
    <div class="user-info">
      <!--头像-->
      <image
        class="user-avatar"
        :src="userInfo.avatar"
      ></image>
      <!--昵称-->
      <div
        class="user-nickname"
      >{{userInfo.nick_name}}
      </div>
    </div>
  </div>
</template>

<script>
  // 用户Api
  import UsersApi from "@/network/users-api";

  export default {
      
    name: "UserHeader",

    data() {
      return {
        result: Object
      };
    },

    computed: {
      // 用户是否登录
      isLogin() {
        return this.$store.getters.isLogin;
      },
	  // 用户信息
      userInfo() {
        return this.result.data.attributes;
      }
    },

    created() {
        
      // 未登录，return
      if (!this.isLogin) {
        return;
      }
        
      // 已经登录，直接从服务器获取用户数据
      UsersApi.getUserInfo()
        .then(res => {
          this.result = res;
        });
    }
  };
</script>

// 省略样式
<style scoped lang="scss">
</style>
```



## 看起来似乎没什么问题，实验一下

哦豁，凉凉

```js
VM116:1 thirdScriptError
Cannot read property 'attributes' of undefined;at pages/users/main page lifeCycleMethod onReady function
TypeError: Cannot read property 'attributes' of undefined
    at VueComponent.userInfo (http://127.0.0.1:46848/appservice/static/js/pages/users/main.js:367:30)
    at Watcher.get (http://127.0.0.1:46848/appservice/static/js/vendor.js:2635:25)
    at Watcher.evaluate (http://127.0.0.1:46848/appservice/static/js/vendor.js:2742:21)
    at VueComponent.computedGetter [as userInfo] (http://127.0.0.1:46848/appservice/static/js/vendor.js:2971:17)
    at VueComponent.render (http://127.0.0.1:46848/appservice/static/js/pages/users/main.js:399:17)
    at VueComponent.Vue._render (http://127.0.0.1:46848/appservice/static/js/vendor.js:3785:22)
    at VueComponent.updateComponent (http://127.0.0.1:46848/appservice/static/js/vendor.js:2305:21)
    at Watcher.get (http://127.0.0.1:46848/appservice/static/js/vendor.js:2635:25)
    at new Watcher (http://127.0.0.1:46848/appservice/static/js/vendor.js:2624:12)
    at mountComponent (http://127.0.0.1:46848/appservice/static/js/vendor.js:2309:17)
```



console 里直接报错了，而 `UserInfo` 也没有正常渲染出来，why？



## 冷静分析

```js
 data() {
      return {
        result: Object
      };
    },
```

因为服务端返回的数据遵循标准 JSONApi 格式(有时候嵌套层级会比较深)，而我这里想偷懒，就定义了一个 result，并没有定义 result 里的具体字段，并给他们赋值。



### 按照我的思路

目前只需要 nick_name 和 avatar 两个字段的值，而这两个字段嵌套的比较深，我不希望在 template 里写这样的绑定代码：

```vue
<template>

  <div class="user-container">
    <!--背景-->
    <image
      class="user-bg"
      mode="aspectFill"
      :src="result.data.attributes.avatar"
    >
    </image>
     <!--用户信息-->
    <div class="user-info">
      <!--头像-->
      <image
        class="user-avatar"
        :src="result.data.attributes.avatar"
      ></image>
      <!--昵称-->
      <div
        class="user-nickname"
      >{{result.data.attributes.nick_name}}
      </div>
    </div>
  </div>
</template>
```

太丑陋了！！！



于是，我在计算属性中定义了一个 `userInfo()` 方法，将 `result.data.attributes` 作为它的返回值，当 `getUserInfo` 方法获取到服务器上的数据后，进行一个`this.result = res` 操作，这样，计算属性 `userInfo` 依赖的 `result` 更新了，`userInfo` 也会更新，也就完成了UI的渲染。这一切是多么美好啊！



### 但是为什么没有按照我的剧本演呢？

这就涉及我的知识盲区了，Vue 是如何追踪数据变化，实现响应式编程的？



遇事不顺找 Google，这里我找到三篇比较有参考价值的文章：

- [Vue 进阶 ------- 深入响应式原理](https://github.com/Corbusier/Awesome-Vue/issues/8)
- [对象更改检测注意事项](https://cn.vuejs.org/v2/guide/list.html#%E5%AF%B9%E8%B1%A1%E6%9B%B4%E6%94%B9%E6%A3%80%E6%B5%8B%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9)
- [vue2.0 初始化请求 JSON 多层嵌套问题](https://segmentfault.com/q/1010000009396332)



第一篇文章提到了变化检测的问题，

> 受限于JS及废弃的`Object.observe`，Vue不能检测到对象属性的添加或删除。由于Vue会在初始化实例时对属性执行`getter/setter`转化的过程，所以属性必须在`data`对象上保存才能被转换，如此，才可以让它是响应的。例如：
>
> ```js
> new Vue({
>         data:{
>             a:1
>         }
>     })
>     /* < !-- vm.a 是响应的 --> */
>     
>     vm.b = 2
>     /* < !-- vm.b 是非响应的 --> */
> ```
>
> Vue不允许在**已创建的实例**上动态添加新的根级响应式属性。但是可以使用`Vue.set(object,key,value)`方法将响应属性添加到嵌套的对象上：
>
> ```js
> /*< !-- 一定要在实例化之前添加！ -- > */
>     Vue.set(vm.someObject, 'b', 2)
> ```



第二篇，也就是vue官方的说明：

> 还是由于 JavaScript 的限制，**Vue 不能检测对象属性的添加或删除**：
>
> ```js
> var vm = new Vue({
>   data: {
>     a: 1
>   }
> })
> // `vm.a` 现在是响应式的
> 
> vm.b = 2
> // `vm.b` 不是响应式的
> ```
>
> 对于**已经创建的实例**，Vue 不能动态添加根级别的响应式属性。但是，可以使用 `Vue.set(object, key, value)` 方法向嵌套对象添加响应式属性。例如，对于：
>
> ```js
> var vm = new Vue({
>   data: {
>     userProfile: {
>       name: 'Anika'
>     }
>   }
> })
> ```
>
> 你可以添加一个新的 `age` 属性到嵌套的 `userProfile` 对象：
>
> ```javascript
> Vue.set(vm.userProfile, 'age', 27)
> ```
>



最后捋一捋思路，为什么会发生错误呢？

当页面中的 image、div 渲染是，userInfo 数据肯定还没获取到，但是这时候 userInfo() 方法里 result.data.attrbutes 的 result.data 还没有定义，所以就会报错 `Cannot read property 'attributes' `。



## 解决方案

别偷懒，按照后端返回的 JSON 的格式初始化 data 里的字段，如下：

```js
data() {
      return {
        result: {
          data: {
            id: Number,
            type: String,
            attributes: Object
          }
        }
      };
```