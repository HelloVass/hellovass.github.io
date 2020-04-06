---
title: Pipeline 扩展
date: 2020-03-04 14:27:02
tags:
    - Jenkins
    - pipeline
    - 共享函数库
---

# 前言

在 《Android持续集成实践·后篇》中阐述了为何使用 pipeline 并且展示了一个简单的通用构建脚本，但实际生产环境中，会发现 Jenkins 内置的功能还远不能满足我们所有的需求。

这时，我们就需要扩展 pipeline。

{% raw %}

<div style="position: relative; width: 100%; height: 0; padding-bottom: 75%;">
    <iframe src="//player.bilibili.com/player.html?aid=74144528&cid=126841545&page=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="position: absolute; width: 100%; height: 100%; left: 0; top: 0;">
    </iframe>
</div>

{% endraw %}

<!-- more -->

## 在 pipeline 中定义函数

pipeline 本质就是一个 groovy 脚本。所以，我们可以在 pipline 中定义函数，并使用 groovy 语言自带的特性。

``` groovy
pipeline {
    agent any

    stages{
        steps{
            echo "${getVersion(BUILD_NUMBER)}"
        }
    }

    def getVersion(String buildNum){
        return new Date().format('yyMMdd') + "-${buildNum}"
    }
}
```

上述这个例子，我们定义了一个 getVersion 函数，并使用了 Date 类。

> PS：当然不是所有的 `groovy 脚本`都能执行，有时候，我们需要用管理员身份登入 `Jenkins`，找到对应的 `groovy 脚本`，点击 `Approve` 给这个 `groovy 脚本`权限。

### 存在的问题

如果在一个 JenkinsFile 中定义一个函数，倒是无所谓。但是如果在 N 个 JenkinsFile 中重复定义这个函数，那干这个活的人就有**一句mmp不知当讲不当讲了！**

# 使用共享函数库

这又是啥勒？

Jenkins Pipline 很贴心，给我们提供了 `shared library` 这个功能，具体路径：Manage Jenkins -> Configure System -> Global Pipeline Libraries，如图：

![共享函数库配置](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/Jenkins%E5%85%B1%E4%BA%AB%E5%87%BD%E6%95%B0%E5%BA%93.png)

## 配置项说明

* Name：共享库唯一标识，在 Jenkinsfile 中会用到
* Default version：默认版本。可以是分支名、tag 等。
* Load implicitily：隐式加载。如果勾选此项，将自动加载全局共享库，在 Jenkinsfile 中不需要显式引用，就可以直接使用。
* Allow default version to be overidden：如果勾选此项，则表示允许“Default version”被 Jenkinsfile 中的配置覆盖。
* include @Library changes in job recent changes：如果勾选此项，那么共享库的最后变更信息会跟项目的变更信息一起被打印在构建日志中。
* Retrieval method：获取共享库代码的方法。这里我们选择`Modern SCM`，然后选择 Git。

## 创建共享库

创建一个共享库项目，目录结构如下：

![共享库目录结构](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/%E5%85%B1%E4%BA%AB%E5%87%BD%E6%95%B0%E5%BA%93%E7%9B%AE%E5%BD%95%E7%BB%93%E6%9E%84.png)

将代码推送到远程仓库中，然后将 ssh 地址填入到`Modern SCM`中。

## 使用共享库

```grovvy
@Library('global-shared-library)
pipeline{
    agent any
    stages{
        stage('build'){
            steps{
                say("Hello World")
            }
        }
    }
}
```

在 pipeline block 的顶部，我们使用 @Library 指定共享库。

> NOTE: global-shared-library 就是配置项中的共享库标识符。

引入共享库之后，我们可以直接在 pipeline 中使用 vars 目录下的 say 函数。

小结一下，如何定义和使用一个共享函数库：
1. 按照共享库约定的源码结构，实现自己的逻辑
2. 将共享库托管到代码仓库中
3. 在 Jenkins 全局配置中配置共享库，主要是配置共享库的仓库地址
4. 在 Jenkinsfile 中使用 @Library 引用共享库

## @Library

使用该注解可以指定引用的共享库版本。写法如下：

> @Library('global-shared-library@<version>') _

<version> 说明：

- 分支，如 @Library('global-shared-library@<version>') _
- tag 标签，如 @Library('global-shared-library@release1.0') _
- git commit id，如 @Library('global-shared-library@e6gfhsfsdf') _

Jenkins 支持同时添加多个共享库，所以 @Library 注解还允许同时引入多个共享库，如：@Library(['global-shared-library', 'other-shared-library']) _。

> NOTE：Jenkins 处理多个共享库出现同名函数的方式是先定义者生效。也就是说，如果 `global-shared-library` 与 `other-shared-library` 存在同名的函数 `say`，而 @Library 引入时 `global-shared-library` 在 `other-shared-library` 前面，那么只有 `global-shared-library` 的 `say` 生效。

## 共享函数库介绍

共享库的目录结构复习：

![共享函数库目录结构](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/%E5%85%B1%E4%BA%AB%E5%87%BD%E6%95%B0%E5%BA%93%E7%9B%AE%E5%BD%95%E7%BB%93%E6%9E%84.png)

放在 vars 目录下的是可以供 pipeline 直接调用的全局变量（真的很想吐槽“变量”这个名称）。变量的文件名即为在 pipline 中调用的函数名，文件名为驼峰式。

使用 var 目录下的全局变量可以调用 Jenkins pipeline 的步骤。比如 say.groovy，使用了 echo 步骤。

```groovy
def call(String value = "hello world")
    echo "$value"
}
```

当我们在 `Jenkinsfile` 中调用 `say("hello world")` 时，它实际调用的是 `say.groovy` 文件中的 `call` 函数。

`call` 函数还支持 Closure（闭包）。举🌰：

定义一个 mvm.grrovy。

```grovvy
def call(Closure<String> closure){
    configFileProvider([configFile(fileId: 'maven-global-settings', variable: 'MAVEN_GLOBAL_ENV')]){
        closure("${MAVEN_GLOBAL_ENV}")
    }
}
```

通过 call 函数里的内容就可以将 configFileProvider 啰嗦的写法封装到 mvm 变量。于是，我们可以这么用：

```grovvy
@Library('global-shared-library@master') _
pipeline {
    agent any
    tools {
        maven 'mvn-3.5.4'
    }
    stages {
        stage('Build'){
            steps{
                mvn{ settings->
                    sh "mvn -s ${settings} clean install"
                }
            }
        }
    }
}
```

接着来看 src 目录：

src 目录是以一个标准的 Java 源码结构，目录中的类被称为 Library class（库类）。而 @Library('global-shared-library@dev') _ 中的 _ 代表一次性静态加载 src 目录下的所有代码 classpath 中。

Utils.groovy 代码：

```groovy
package info.hellovass

class Utils implements Serializable {
    def getVersion(String buildNum, String commitId){
        return new Date().format('yyMMdd') + "-${buildNum}" + "-${commitId}"
    }
}
```

> NOTE：Utils 实现了 Serializable 接口，是为了确保当 pipeline 被 Jenkins 挂起后能正确恢复。

在使用 src 目录中的类时，需要使用全包名。同时，因为写的是 Groovy 代码，所以还需要使用 script 闭包抱起来。举栗子：

```groovy

@Library(['global-shared-library']) _
pipeline {
    agent any
    stages('Build') {
        steps {
            script {
                def util = new info.hellovass.Utils()
                def version = util.getVersion("${BUILD_NUMBER}", "${GIT_COMMIT}")
                echo "${version}"
            }
        }
    }
}
```

# 应用

比如，我们需要在构建成功时通过钉钉机器人发送消息到群里。

## 方案一，集成钉钉机器人插件

这个是网上能搜到的比较常见的方案，需要 jenkins 安装 DingTalk 插件，路径：Manage Jenkins -> Manage Plugins -> 可选插件。

但是 2.0 版本似乎不支持 pipeline 特性，只能通过 UI选项配置。

> PS: 网上很多文章，可以参考

## 方案二，共享函数库登场

钉钉机器人可以看做一个比较通用的功能，于是，我们的共享函数库派上用场了。

### 新建一个 DingTalk.groovy

在 src 目录下新建一个 DingTalk.groovy，根据自己的需求编写函数：

```groovy
class DingTalk implements Serializable {
    /**
     * 发送文字消息
     * @param webHook
     * @param contentType
     * @param content 消息内容
     * @return
     */
    def sendTextMessage(
            String webHook,
            String contentType,
            String content
    ) {
        def template = "{\n" +
                "    \"msgtype\": \"text\", \n" +
                "    \"text\": {\n" +
                "        \"content\": \"$content\"\n" +
                "    }, \n" +
                "    \"at\": {\n" +
                "        \"atMobiles\": [], \n" +
                "        \"isAtAll\": true\n" +
                "    }\n" +
                "}"
        try {
            def cmd = ["curl", "$webHook", "-H", "Content-Type: $contentType", "-d", "$template"]
            def process = cmd.execute()
            process.waitFor()
            return process.text
        } catch (Exception e) {
            return e.message
        }
    }
}
```

上述代码定义了一个 `sendTextMessage` 函数，参数为:

- webHook：钉钉机器人 Webhook 地址
- contentType：application/json
- content：想要发送的文本内容

具体可以参考[钉钉机器人开发文档](https://ding-doc.dingtalk.com/doc#/serverapi2/qf2nxq)，钉钉机器人发送的消息有多种类型：

- text 类型
- link 类型
- markdown 类型
- 整体跳转 ActionCard 类型

本文给出了发送 text类型消息的函数实现，其他几种类似，可以根据具体需求来实现。

### 核心原理

实际上，我们只需要执行一条 `curl` 命令就可以向钉钉机器人发送消息了，就这么简单。关键就是这条**命令**怎么写，以及如何执行了。

#### 写法一

```groovy
    /**
     * 发送文字消息
     * @param webHook
     * @param contentType
     * @param content 消息内容
     * @return
     */
    def sendTextMessage(
            String webHook,
            String contentType,
            String content
    ) {
        def template = "{\n" +
                "    \"msgtype\": \"text\", \n" +
                "    \"text\": {\n" +
                "        \"content\": \"$content\"\n" +
                "    }, \n" +
                "    \"at\": {\n" +
                "        \"atMobiles\": [], \n" +
                "        \"isAtAll\": true\n" +
                "    }\n" +
                "}"
        try {
            // 看这里
            def cmd = ["curl", "$webHook", "-H", "Content-Type: $contentType", "-d", "$template"]
            def process = cmd.execute()
            process.waitFor()
            return process.text
        } catch (Exception e) {
            return e.message
        }
    }
```

`cmd` 是一个数组，`cmd.execute` 最后调用了 `ProcessGroovyMethods#exec(String[] cmdarray, String[] envp, File dir)` 方法，相关方法如下：

```java

// 方法一
public static Process execute(final List commands) throws IOException {
    return execute(stringify(commands));
}

// 方法二
public static Process execute(final String[] commandArray) throws IOException {
    return Runtime.getRuntime().exec(commandArray);
}

// 方法三
public Process exec(String cmdarray[]) throws IOException {
    return exec(cmdarray, null, null);
}

// 方法四
public Process exec(String[] cmdarray, String[] envp, File dir) throws IOException {
    return new ProcessBuilder(cmdarray)
        .environment(envp)
        .directory(dir)
        .start();
}
```

#### 写法二

```groovy
    /**
     * 发送文字消息
     * @param webHook
     * @param contentType
     * @param content 消息内容
     * @return
     */
    def sendTextMessage2(
            String webHook,
            String contentType,
            String content
    ) {
        def template = "{\n" +
                "    \"msgtype\": \"text\", \n" +
                "    \"text\": {\n" +
                "        \"content\": \"$content\"\n" +
                "    }, \n" +
                "    \"at\": {\n" +
                "        \"atMobiles\": [], \n" +
                "        \"isAtAll\": true\n" +
                "    }\n" +
                "}"
        try {
            // 看这里
            def cmd = "curl '$webHook' -H 'Content-Type: $contentType' -d '$template'"
            def process = cmd.execute()
            process.waitFor()
            return process.text
        } catch (Exception e) {
            return e.message
        }
    }
```

cmd 是一个字符串，`cmd.execute` 最后调用了 `ProcessGroovyMethods#exec(String[] cmdarray, String[] envp, File dir)` 方法，相关方法如下：

```java

// 方法一
public static Process execute(final String self) throws IOException {
    return Runtime.getRuntime().exec(self);
}

// 方法二
public Process exec(String command) throws IOException {
    return exec(command, null, null);
}

// 方法三
 public Process exec(String command, String[] envp, File dir) throws IOException {
    
    if (command.length() == 0)
        throw new IllegalArgumentException("Empty command");

    StringTokenizer st = new StringTokenizer(command);
    String[] cmdarray = new String[st.countTokens()];

    for (int i = 0; st.hasMoreTokens(); i++)
        cmdarray[i] = st.nextToken();

    return exec(cmdarray, envp, dir);
}

// 方法四
public Process exec(String[] cmdarray, String[] envp, File dir) throws IOException {
    return new ProcessBuilder(cmdarray)
        .environment(envp)
        .directory(dir)
        .start();
}

```

### 困惑

理论上来说，两种实现是等价的。然鹅，测试之后，方法二执行耗时一万年，最后钉钉机器人发送消息失败。而方法一和直接在命令行里执行的速度差不多，并且能成功发送消息。

黑人问号？？？

### 打印命令

这里我们在 `exec(String[] cmdarray, String[] envp, File dir)` 这个方法里打上断点，来查看一下不同的写法，`cmdArray` 的值有什么区别？

#### 写法一

![写法一的cmdArray](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/%E5%86%99%E6%B3%95%E4%B8%80%E7%9A%84cmdArray.png)

#### 写法二

![写法二的cmdArray](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/%E5%86%99%E6%B3%95%E4%BA%8C%E7%9A%84cmdArray.png)

果然，写法一的 cmdArray 符合预期，一看就能理解；写法二的参数被错误分割了，这也就是为毛写法二执行耗时过长而且失败的原因了。那为什么参数会被错误分割呢？

原因大致是这样的，写法二是通过**空格**来分割参数的！

### 总结

去 stackoverflow 上逛了一下，发现很多老外兄dei也有类似的[问题](https://stackoverflow.com/questions/23742419/perfectly-working-curl-command-fails-when-executed-in-a-groovy-script/52987922#52987922)。

所以，如果遇到要通过 groovy 执行命令的时候，推荐使用写法一。

# 参考

- [Jenkins 2.x 实践指南](https://item.jd.com/45779671535.html)