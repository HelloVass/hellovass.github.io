---
title: Android持续集成实践·前篇
date: 2019-04-04 11:56:36
tags:
---

## 为什么要持续集成

> 人肉构建太累了

### 我们想做的事情

- clone 仓库的代码
- 静态代码检查（可选）
- 单元测试（可选）
- 编译打包 apk
- 上传到测试分发平台
- 自动化测试（可选）
- 通知相关人员构建结果等

救救孩子吧！！！

<!-- more -->

## Jenkins构建

使用的比较多的是自由风格的软件项目（Jenkins 构建的一种方式，会结合 SCM 和构建系统来构建项目，甚至可以构建软件以外的系统）。目前的构建就是基于**自由风格的软件项目**来做的，简单，基本满足需求，但也有不方便的地方，之后会说到。

### 安装

win 下非常简单，选择安装版（不需要依赖 Tomcat），安装完成之后就可以 `ip:port` 启动。

### 自由风格的软件项目

#### 安装插件

- Git Plugin
- Gradle Plugin
- Android Signing Plugin
- Build Name Setter
- Date Parameter Plugin
- Dynamic Parameter Plugin
- Git Parameter Plugin

#### 配置

##### Manage Jenkins-Global Tool Configuration

如果插件安装成功，可以看到这三个插件：

- jdk 插件![jdk_plugin](http://assets.processon.com/chart_image/5cb024cae4b09ccab355c702.png)
- git 插件![git_plugin](http://assets.processon.com/chart_image/5cb024c5e4b09a003b2e412f.png)
- gradle 插件![gradle_plugin](http://assets.processon.com/chart_image/5ca5b6bde4b031d0225d5d52.png)

> 注意：Jenkins 机器上的 Gradle 的版本必须>=项目中的 Gradle 的版本，否则就会编译失败。

##### Configure System

配置 Android SDK 路径![android_sdk_plugin](http://assets.processon.com/chart_image/5ca5c81ee4b029f6dae74553.png)

注意这里的 Name 必须与本机的**环境变量Key值**一致

##### 创建项目

点击 **new item**，选择 **Freestyle project**

##### 项目配置

选择 **Source Code ManageMent**![源码管理](http://assets.processon.com/chart_image/5cab22e1e4b06765f088f007.png)

##### 构建步骤

点击 **Add build step**，选择 **Invoke Gradle script**，配置构建时 Gradle 版本，如图：![invoke_gradle_script](http://assets.processon.com/chart_image/5cb02752e4b02a2858e8f87c.png)

> 再啰嗦一遍，注意 ci 机器上的 gradle 版本和工程里的 gradle 版本必须一致！！！
>
> 然后配置一下需要执行的 tasks，先 clean 工程，然后根据 FLAVOR（渠道）和 BuildType（构建类型）来打包，生成的 apk 数目 = 渠道数*构建类型数

##### 恭喜，简单配置完成

点击 save，就算配置完成了。当然，以上只是最基础的 Jenkins 配置，接下来看看如何进行参数化构建。

#### 参数化构建

我们想要构建的产物个性化一些，比如:`#工程名${分支名}_${渠道}_${构建类型}_${构建时间}_${Jenkins构建时的序列号}`，所以，我们需要的参数有：

- BRANCH
- FLAVOR
- BUILD_TYPE
- BUILD_TIME
- BUILD_NUMBER

然后，需要能在本地打包也能在 Jenkins 机器上打包，所以，我们还需要 `CI_BUILD` 来区别是否在 CI 机器上构建:

- CI_BUILD

本地构建类型为 debug 的时候，默认会使用 Android Studio 自己生成的 debug.keystore，而不同机器上的 debug.keystore 的 sha-1 是不一样的！这会导致诸如高德地图这样的第三方 SDK 无法正常运行，所以，我们还需要同一份 debug.keystore，于是脚本应该这么写：

```groovy
signingConfigs {
    config {
        if (CI_BUILD == "true") {
            keyAlias KEY_ALIAS
            keyPassword KEY_PASSWORD
            storeFile file(STORE_FILE)
            storePassword STORE_PASSWORD
        } else { // 读取本地 keystore.properties 文件
            def keystoreProperties = new Properties()
   			keystoreProperties.load(new FileInputStream(rootProject.file("keystore.properties")))
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFilePath'])
            storePassword keystoreProperties['storePassword']
        }
    }
}
```

> 当 CI_BUILD == false && 本地构建，使用本地同样的 debug.keystore 来签名！

##### 勾选 This project is parameterized，然后开始添加参数：

| 参数名         | 参数类型         | 可选值                 |
| -------------- | ---------------- | ---------------------- |
| CI_BUILD       | Choice Parameter | true、false            |
| BRANCH         | Git Parameter    | tag、branch            |
| BUILD_TYPE     | Choice Parameter | Release、Debug         |
| BUILD_FLAVOR   | Choice Parameter | envStaging、envTesting |
| BUILD_TIME     | Date Parameter   | 当前时间               |
| KEY_ALIAS      | String Parameter | ---------------------- |
| KEY_PASSWORD   | String Parameter | ---------------------- |
| STORE_PASSWORD | String Parameter | ---------------------- |
| STORE_FILE     | String Parameter | ---------------------- |

**勾选 Pass job parameters as Gradle properties**，该选项会帮我们把参数注入到 gradle.properties，替换文件中的对应值。

```groovy
# 是否为 CI 环境
CI_BUILD=false
```

##### 参数化构建完成

左侧出现了 `Build with Parameters`，右侧：![右侧面板](http://assets.processon.com/chart_image/5cb03a21e4b0b62750f80baf.png)

### Pipline构建
- TODO