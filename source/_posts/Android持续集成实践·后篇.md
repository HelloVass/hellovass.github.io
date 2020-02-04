---
title: Android持续集成实践·后篇
date: 2020-01-23 15:39:52
tags:
    - 持续集成
    - pipeline
    - Jenkins
---

## 前言

距离上篇《Android持续集成·前篇》已经有些时日，这次将会填上上篇留下的大坑，pipline 构建。
<!-- more -->

## Pipeline 

### pipline 是什么

> 从某种抽象层次上讲，部署流水线（Development pipeline）是指从软件版本控制库到用户手中这一过程的自动化表现形式。

按照[《持续交付》](https://item.jd.com/10843669.html)中的定义，Jenkins 本来就支持 pipeline（部署流水线），只是一开始不叫 pipeline，而叫 job（任务）。

Jenkins 1.x 只能通过手动操作（即各种UI选项设置）来描述 pipline。而 Jenkins 2.x 终于支持了 pipline as code 的特性，即我们可以通过代码来描述 pipline。

### 之前的问题

谈优点前，先来回顾下上篇中的构建方式，即自由风格软件的项目。这种构建方式是网上最常见的，对于单个项目的简单构建（比如大部分 Android开发就拿 Jenkins 做个打包）已经足够了。但是，问题来了，针对多个类似但又有区别的项目，就捉襟见肘了，需要大量的 job 来支持，这就会导致，如果主流程的构建变了，每个项目的 job 也得修改和测试，难以维护，噩梦啊。

### 优点

这里就来谈谈为什么要 pipline as code 而不是 UI：
- 更好的版本化：将 CI 作为一个项目提交到 SCM 中进行版本控制
- 更好的协作：CI 项目的修改对所有人都是可见的。而且，还可以对 CI 项目的代码做 code review
- 众所周知：code 可以复用，而手动操作没法复用，没人想每个新项目都去重新设置一遍

### 拥抱 pipline

所以后篇将放弃前篇的自由风格软件构建的方式，坚持 pipline 真香原则。

## 之前做不到的以及现在想要做的

需要开发和维护的 Android 项目不止一个，而且每个项目都需要 CI，但每个项目的构建流程非常相似，但又有些不同。大体上的流程如下：
- 克隆代码
- 编译打包出 Apk
- 静态代码检查（可选）
- 单元测试（可选）
- 归档（可选）
- 上传测试分发平台
- 通知相关人员构建结果（可选）

可以看到整体的流程是相同的，但又存在差异。有的构建可以跳过单元测试，有的构建可以跳过静态代码检查，通知的相关人员也会不同。如果使用自由风格构建的方式，也8是8可以。

但是，未来是不确定的，可能会添加新的构建流程（比如使用签名插件签名），而新添加的构建流程也可能出现bug。无论出现哪种情况，一旦修改主构建流程，每个项目的 job 都需要修改和测试，这必然会花费大量的时间。

所以，想有一种船新的构建方式，将整体的构建作为一个模板or框架，每个项目可以通过配置项目各自的 CI文件来决定自己的构建流程，这样岂不是美滋滋。

## 实践经验分享

### 使用 pipline 构建

新建一个 pipline 项目，然后选择 pipline script from SCM，像这样：

![新建一个 pipline 项目](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/%E6%96%B0%E5%BB%BApipline%E9%A1%B9%E7%9B%AE.png)

![pipeline script from SCM](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/%E6%88%AA%E5%B1%8F2020-02-03%E4%B8%8B%E5%8D%882.03.42.png)

这里我们选择将 pipline 脚本纳入到版本管理，理由如下：
- 可以多人维护、code review
- 可以多项目共用同一个脚本项目

这样，Jenkins 在启动 job 时，会先去脚本仓库里拉去脚本，然后运行这个脚本。这个脚本里，我们编写的构建方式和步骤就会按部就班的执行。

这样，大体的架子就搭建好了，但是，针对多项目，我们还有一些事情要做，于是：
![构建流程图](http://assets.processon.com/chart_image/5e37c237e4b0d27af1859b6b.png)

这里，我们可以清楚地看到，构建的参数其实有3部分：
- job 的 UI 界面
- 脚本仓库的里的脚本
- 项目特定的配置

### job UI 界面(参数化构建)

这里用过自由风格构建的童鞋都非常熟悉了，构建 job 的时候，勾选参数化构建过程，设置：
- 项目的仓库地址
- 分支
- 构建结果的通知人
- ...

当然，还可以根据项目的需求增加更多的参数，这些参数的特点，灵活、多变，需要经常被修改。

![job UI界面](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/job%20UI%E7%95%8C%E9%9D%A2.png)

### 项目特定配置

这个配置文件可以理解为与项目绑定的配置，一般是一些不经常修改的参数，比如项目的名字，如图：

![项目特定配置文件](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/%E9%A1%B9%E7%9B%AE%E7%89%B9%E5%AE%9A%E9%85%8D%E7%BD%AE.png)

### 脚本仓库

脚本仓库的脚本即是整个方案的灵魂，这里的脚本是将多个项目的构建抽象、泛化，遇到与项目有关的都需要定义为变量。

```groovy
pipeline{
    agent any
    stages{
        stage('检查环境'){
            steps{
                sh label: '输出环境变量', script: 'printenv'
            }
        }
        stage('检出代码'){
            steps{
                git branch: "${__branch}", credentialsId: 'fca179ba-0def-407c-8622-6bdef80dea85', url: "${__repo}"
            }
        }
        stage('加载配置'){
            steps{
                script{
                    def configPath = "./jenkins.groovy"
                    if(fileExists("${configPath}")){
                        load "${configPath}"
                        echo "找到配置文件${configPath}，加载成功"
                    } else {
                        echo "配置文件${configPath}不存在"
                        sh "exit 1"
                    }
                }
            }
        }
        stage('编译'){
            steps{
                sh label: "执行 ./gradlew clean assembleRelease", script: "./gradlew clean assembleRelease"
            }
        }
        stage('单元测试'){
            steps{
                script{
                    if(Boolean.valueOf("${__open_unit_test}")){
                        sh label: '执行 ./gradlew test', script: './gradlew test'
                    } else {
                        echo "跳过单元测试"
                    }
                }
            }
            post{
                always{
                    junit allowEmptyResults: true, testResults: '**/test-results/**/*.xml'
                }
            }
        }
        stage('lint 扫描'){
            steps{
                script{
                    if(Boolean.valueOf("${__open_lint}")){
                        sh label: '执行 ./gradlew lint', script: './gradlew lint'
                    } else { 
                        echo "跳过 lint 扫描"
                    }
                }
            }
            post{
                always{
                    androidLint canComputeNew: false, defaultEncoding: 'UTF-8', healthy: '', pattern: '**/lint-results*.xml', unHealthy: ''
                }
            }
        }
        stage('归档'){
            steps{
                archiveArtifacts '**/*.apk'
            }
        }
    }
}
```

pipline 实际上支持两种语法，脚本式和声明式，这里简单提一下，脚本式语法可以理解为，你就是在写 groovy，这里我使用的是社区推荐的声明式语法，比较简单、易读。当然，不是说用了声明式语法就8能写 groovy 了，在 `script` 闭包里仍然可以使用 groovy。

PS：因为我们需要从项目里读取特定的配置文件，并且加载文件里的参数，但是怎么做呢？这里我参考了美团兄 dei 的一个小技巧，判断项目中存在 `jenkins.groovy` 文件后，使用 groovy 的 `load` 函数加载配置文件，从而读取到里面的参数。

### 大功告成

这里点击参数化构建->开始构建，然后等个几分钟，就可以看到构建的结果。

![jenkins 构建结果](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/pipeline%20%E6%9E%84%E5%BB%BA%E7%BB%93%E6%9E%9C.png)

- 可以清楚地看到每个构建阶段的耗时，方便后期优化
- 构建出错时，使用 stage view 可以快速定位出出错的阶段

## pipeline 编写指南

### 使用 pipline 代码生成器学习

对于 pipeline 的新手来说，如何编写 pipeline 是一道坎，没越过的时候就会觉得 pipeline 这种构建真麻烦，转而继续使用自由风格的软件。迈过之后又会真香真香了2333

其实 Jenkins 为了减低编写 pipeline 的门槛，提供了一个 pipline 代码片段的生成器，通过界面操作就能生成相应代码。

![pipline语法入口](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/pipline%E8%AF%AD%E6%B3%95%E5%85%A5%E5%8F%A3.png)

![pipline代码生成器](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/pipline%E4%BB%A3%E7%A0%81%E7%94%9F%E6%88%90%E5%99%A8.png)

### Jenkinsfile 编写和语法校验

就这么说吧，JenkinsFile 真的就是个孤儿，从诞生以来就没有啥好的开发工具支持，矮中取长，这里推荐俩我正在使用的pa：

- 开发的时候只能用 VSCode 的 [Groovy 语法](https://marketplace.visualstudio.com/items?itemName=naco-siren.gradle-language)高亮进行开发
- 校验 Jenkinsfile 的语法可以使用 VSCode 的插件 [Jenkins Pipline Linter Connector](https://marketplace.visualstudio.com/items?itemName=janjoerke.jenkins-pipeline-linter-connector)

PS：别对那个校验插件做太多期待，该插件只能利用 Jenkins Api 进行语法校验。

## 凭证管理

### 为什么需要凭证

在 Jenkinsfile 中使用明文密码会造成安全隐患。凭证是 Jenkins 进行受限操作时的凭据。比如使用 SSH 登录远程机器时，用户名和密码或 SSH key 就是凭据。而这些凭据不可能以明文写在 Jenkinsfile 中。Jenkins 凭证管理指的就是对这些凭证进行管理。

为了最大限度地提高安全性，在 Jenkins master 节点对凭证进行加密存储（通过 Jenkins 实例 ID 加密），只有通过它们的凭证 ID 才能在 pipline 中使用，并且限制了将证书从一个 Jenkins实例赋值到另一个 Jenkins 实例的能力。

### 密钥保护（可选）

通过 Jenkins 我们可以把 Android 的签名文件保护起来。

#### 安装 Android Signing Plugin

在 Jenkins 上安装 [Android Signing Plugin](https://github.com/jenkinsci/android-signing-plugin) 插件

#### 格式转换

Android Signing Plugin 依赖 Credentials Plugin 只支持 PKSC#12 格式的证书，因此，需要将 JKS 证书转换为 PKCS#12 格式：

> keytool -importkeystore -srckeystore signing.jks -srcstoretype JKS -deststoretype PKCS12 -destkeystore signing.p12

然后将转换好的证书上传到 Credentials 并且配置好 ID，比如取名为 ANDROID_SIGN_KEY_STORE。

#### 编写对应的 pipline 代码
该插件并不支持 pipline自动生成代码，所以只能看官方文档手撸代码：

```groovy
stage('签名Apk'){
    steps{
        signAndroidApks(
            keyStoreId: "ANDROID_SIGN_KEY_STORE",
            keyAlias: "ANDROID",
            apksToSign: "**/*-unsigned.apk",
            archiveSignedApks: false,
            archiveUnsignedApks: false
        )               
    }
}
```

## 参考
- 《Jenkins 2.x 实践指南》，这本书是为数不多的不跟你瞎比比，教你怎么搭建 Jenkins 赚页数，而是单刀直入直接开始 pipline 开荒教学，不厚，但得细看，简单明了的阐述了很多概念，推荐跟着书上的操作实际操作下。
- [Jenkins的Pipeline脚本在美团餐饮SaaS中的实践](https://tech.meituan.com/2018/08/02/erp-cd-jenkins-pipeline.html)，这里也非常感谢美团兄dei 的文章指南，给了我很多启发。