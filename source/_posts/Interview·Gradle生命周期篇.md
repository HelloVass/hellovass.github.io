---
title: 写给面试的·Gradle 生命周期篇
date: 2020-04-03 16:28:11
tags:
    - Gradle
    - 构建
---

# 前言

> 兄dei，Gradle 生命周期有了解过嘛？
> emmmmmm....
> 那么，来说说 Configuration 阶段 Gradle 干了什么吧
> emmmmmm....

<!-- more -->

# Gradle 生命周期

Gradle 在编译项目时有着它自己的生命周期，从编译开始编译完毕 Gradle 一共要经历 3 个阶段：

- Initialization

初始化阶段，即执行 Gradle 的初始化配置选项，即执行项目中的 settings.gradle 脚本。

- Configuration

解析每个 Project 中的 build.gradle 脚本，即解析所有 Project 中的编译选项。解析完成后，Gradle 就生成了一张有向关系图——taskgraph，这面包含了整个 Task 的依赖关系。

- Build

该阶段是最后的编译运行阶段，即按照 taskgraph 执行编译。

这三个阶段是宏观把握 Gradle 的核心所在，运行任何 Gradle 指令都会经过这样三个阶段。

默认的输出是在配置阶段，这时候 Gradle 会执行所有 Task 的配置脚本，即使你执行一个指定的 Task，也有到 Build 阶段，才能够开始执行。

# Gradle 生命周期的监听

## Gradle 耗时 Task 统计

统计 Task 耗时，收集耗时超过100ms 的 Task，排序之后输出到 build 目录下的xxx.txt 文件中。

## 实现

```kotlin
/**
 * 分析 Task，收集耗时超过 100ms 的task，并将日志输出到 build 文件夹下
 */
fun Gradle.analyzeTask() {

    val clock = Clock()

    val execution = mutableListOf<TaskInfo>()

    addTaskExecutionLifecycle {
        _beforeExecute { task ->
            task.extensions.add("startAt", System.currentTimeMillis())
        }
        _afterExecute { task, _ ->
            // 计算 Task 的执行时间
            val duration = System.currentTimeMillis() - (task.extensions["startAt"] as Long)
            // 收集超过耗时超过 100ms 的 Task
            if (duration >= 100) {
                execution += TaskInfo(task, duration)
            }
        }
    }

    addBuildLifecycle {
        _buildFinished {

            // 没有超过 100ms 的 Task，忽略
            if (execution.isEmpty())
                return@_buildFinished

            // 按照耗时排序
            execution.sortBy { taskInfo ->
                taskInfo.duration
            }

            // 输出内容
            val outputStr = buildString {

                // 构建总耗时
                val buildTimeInSeconds = clock.timesInMs / 1000
                val minutes = buildTimeInSeconds / 60
                val seconds = buildTimeInSeconds % 60

                // 构建字符串模板
                val timeStr = when (minutes) {
                    0L ->
                        "${seconds}s"
                    else ->
                        "${minutes}m ${seconds}s (${buildTimeInSeconds}s)"
                }

                // 文本头
                append("Build finished in ${timeStr}\n")

                // 添加耗时超过 100ms 的 Task
                execution.forEach { taskInfo ->
                    append(
                        String.format(
                            "%7sms %s\n",
                            taskInfo.duration,
                            taskInfo.task.path
                        )
                    )
                }
            }

            // 创建文件，并将内容写入
            val file = File(
                gradle.rootProject.buildDir.absolutePath,
                "build_time_records_${Date().format("yyyy-MM-dd-HH-mm-ss")}.txt"
            )
            file.parentFile.mkdirs()
            file.write(outputStr)
        }
    }
}
```

1. 监听 TaskExecutionListener 的 beforeExecute 和 afterExecute，计算每一个 Task 的耗时，并且将耗时大于 100ms 的 Task 收集到 execution 中
2. 监听 BuildListener 的 buildFinished， build 结束之后将 execution 排序，并且计算总耗时
3. 最后，将信息写入到 build 目录下的 xxx.txt 文件

> PS:这里使用 kotlin 带接收器的扩展函数特性对 addListener 做了简化，让代码看起来更 DSL 一些

# 参考

- Android 群英传 神兵利器
  - 4.8章，Gradle 思考
- [Blankj Auc 中统计 Task 耗时的代码](https://github.com/Blankj/AucFrameTemplate)


