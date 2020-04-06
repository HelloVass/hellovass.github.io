---
title: 写给面试的·StackTrace衍生篇
date: 2020-03-09 12:50:59
tags:
    - 监测工具
    - StackTrace
---

# 前言

面试中经常会被问到这样一个问题或者它的类似问题。

> 你如何用**程序的方式检测**导致**UI卡顿**的问题，并且**定位**？

<!-- more -->

# 思考

我个人觉得这其实是一个还不错的综合体，考察点也还算多，也可以衍生出一些题目。

先来拆解一下关键词，**程序的方式检测**、**UI卡顿**、**定位**：

- 程序的方式检测：不是通过图形工具、不是通过交互来检测，而是通过编写工具类在应用运行时来检测
- UI卡顿：UI线程做了一些耗时的操作
- 定位：通过日志打印出耗时超过阈值的方法

# 技术补完

## StackTrace&StackTraceElement

先来`堆栈追踪`部分的知识点，因为这块 api 用的多，但了解少。

### StackTrace

StackTrace（堆栈跟踪），用栈的形式保存方法的调用信息。

这个其实我们一点也不陌生，在处理异常的时候，经常会这么写一句：`e.printStackTrace()`，即打印调用异常的堆栈信息，方便我们在异常发生的时候能定位到具体的问题。

### StackTraceElement

```java
/**
 * An element in a stack trace, as returned by {@link
 * Throwable#getStackTrace()}.  Each element represents a single stack frame.
 * All stack frames except for the one at the top of the stack represent
 * a method invocation.  The frame at the top of the stack represents the
 * execution point at which the stack trace was generated.  Typically,
 * this is the point at which the throwable corresponding to the stack trace
 * was created.
 *
 * @since  1.4
 * @author Josh Bloch
 */
public final class StackTraceElement implements java.io.Serializable {
    // 省略 N行
}
```

获取`StackTraceElement`的方法有2种，返回值为`StackTraceElement[]`。

- Thread#getStackTrace()，常见代码`Thread.currentThread().getStackTrace()`
- Throwable#getStackTrace()

`StackTraceElement[]`包含了`StackTrace`的内容，遍历它可以得到方法见的调用过程，即可以得到当前方法以及其调用者的方法名、调用行数等信息。

```kotlin

// main 函数入口
fun main() {
    funA()
}

// 方法A
fun funA() {
    println("--->>> enter funA")
    funB()
}

// 方法B
fun funB() {
    println("--->>> enter funB")

    val elements = Thread.currentThread().stackTrace

    elements.forEachIndexed { index, e ->
        val className = e.className
        val funcName = e.methodName
        val fileName = e.fileName
        val lineNum = e.lineNumber
        println(
            "--->>> StackTraceElement index=>$index," +
                    " fileName=>$fileName, " +
                    "className=>$className, " +
                    "funcName=>$funcName, " +
                    "lineNum=>$lineNum"
        )
    }
}
```

输出，如图：

![StackTraceElement使用](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/StackTraceElement%E4%BD%BF%E7%94%A8.png)

## Looper

主线程里有个`Looper`，在`loop`方法中会不断取出`Message`，调用其绑定的 Handler 在主线程执行。

```java
loop(){
    final Looper me = myLooper();
    final MessageQueue queue = me.mQueue;

    // 省略 N行
    for (;;) {

        // might block
        Message msg = queue.next(); 

        // This must be in a local variable, in case a UI event sets the logger
        final Printer logging = me.mLogging;
        if (logging != null) {
            logging.println(">>>>> Dispatching to " + msg.target + " " +
                msg.callback + ": " + msg.what);
        }

        // 看这里
        msg.target.dispatchMessage(msg);

        if (logging != null) {
            logging.println("<<<<< Finished to " + msg.target + " " + msg.callback);
        }

        // 省略 N行
    }
}
```

关键点，我们只要有办法检测：`msg.target.dispatchMessage(msg)`的执行时间，判断执行时间是否大于我们设置的某个阈值就可以判断UI线程是否有耗时操作了。此代码执行前后，如果设置了`logging`，会分别打印出:`>>>>> Dispatching to`和 `<<<<< Finished to ` 这样的日志。

# 实操

## BlockCanary

```kotlin

private const val START = ">>>>> Dispatching"

private const val END = "<<<<< Finished"

class BlockCanary private constructor() {

    companion object {

        fun start() {
            Looper.getMainLooper()
                .setMessageLogging { str: String ->
                    when (str) {
                        START ->
                            LoggerMonitor.INSTANCE.start()
                        END ->
                            LoggerMonitor.INSTANCE.stop()
                    }
                }
        }
    }
}
```

## LoggerMonitor

```kotlin

private const val THRESHOLD = 1 * 1000L

class LoggerMonitor private constructor() {

    private val loggerThread: HandlerThread = HandlerThread("logger")

    private val ioHandler: Handler

    private val runnable = Runnable {
        val log = buildString {
            val stackTrace = Looper.getMainLooper().thread.stackTrace
            stackTrace.forEach { e: StackTraceElement ->
                append("$e\n")
            }
        }
        Log.e("TAG", log)
    }

    val isMonitor: Boolean
        get() = ioHandler.hasCallbacks(runnable)

    init {
        loggerThread.start()
        ioHandler = Handler(loggerThread.looper)
    }

    companion object {
        val INSTANCE by lazy { LoggerMonitor() }
    }

    fun start() {
        ioHandler.postDelayed(runnable, THRESHOLD)
    }

    fun stop() {
        ioHandler.removeCallbacks(runnable)
    }
}
```

假设我们的阈值设置为 1000ms，当`str`匹配到`>>> Dispatching`时，调用`LoggerMonitor.INSTANCE.start()`，在 1000ms后执行一个任务，打印出UI线程的堆栈信息（这次在子线程中执行）。正常情况，我们的`msg.target.dispatchMessage(msg)`执行耗时小于 1000ms，所以`str`匹配到`<<<<< Finished`，就会调用`LoggerMonitor.INSTANCE.remove()`移除任务。

这里还用到了 HandlerThread，也利用了 Looper，只不过这个 Looper 在子线程中。

## 测试环节

### Application#onCreate

```kotlin
class DemoApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        BlockCanary.start()
    }
}
```

### 耗时模拟

```kotlin
 btn_test.setOnClickListener {
            try {
                Thread.sleep(2000L)
            } catch (e: Throwable) {
                e.printStackTrace()
            }
        }
```

点击按钮，打印出 log：

```java
2020-03-10 01:40:10.509 4740-4765/info.hellovass.build_example E/TAG: java.lang.Thread.sleep(Native Method)
    java.lang.Thread.sleep(Thread.java:373)
    java.lang.Thread.sleep(Thread.java:314)
    info.hellovass.build_example.MainActivity$onCreate$1.onClick(MainActivity.kt:15)
    android.view.View.performClick(View.java:6597)
    android.view.View.performClickInternal(View.java:6574)
    android.view.View.access$3100(View.java:778)
    android.view.View$PerformClick.run(View.java:25885)
    android.os.Handler.handleCallback(Handler.java:873)
    android.os.Handler.dispatchMessage(Handler.java:99)
    android.os.Looper.loop(Looper.java:193)
    android.app.ActivityThread.main(ActivityThread.java:6669)
    java.lang.reflect.Method.invoke(Native Method)
    com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:493)
    com.android.internal.os.ZygoteInit.main(ZygoteInit.java:858)
```

会打印出耗时相关的代码信息，然后可以通过日志定位到耗时的方法。

# Choreographer???

> 2020-03-10 01:40:11.516 4740-4740/info.hellovass.build_example I/Choreographer: Skipped 119 frames!  The application may be doing too much work on its main thread.

这个日志似乎怎么感觉那么熟悉呢？其实日常开发中，如果我们操作不当（UI线程里执行耗时的操作）就能看到。而这个`Choreographer`，好像和啥 `Android`、`16ms绘制一帧`等关键词有着说不清的关系。

没错，正是在下。

Android 系统每隔 16ms 发出 VSYNC 信号，触发对 UI 的渲染。Android SDK 包含了一个相关类，以及相应的回调。理论上来说，两次回调的时间周期应该在 16ms以内，超过了，我们则认为是一次造成卡顿的耗时操作，于是：

```kotlin
class BlockCanary2 private constructor() {

    companion object {
        fun start() {
            Choreographer.getInstance()
                .postFrameCallback(object : Choreographer.FrameCallback {
                    override fun doFrame(frameTimeNanos: Long) {
                        if (LoggerMonitor.INSTANCE.isMonitor){
                            LoggerMonitor.INSTANCE.stop()
                        }
                        LoggerMonitor.INSTANCE.start()
                        Choreographer.getInstance()
                            .postFrameCallback(this)
                    }
                })
        }
    }
}
```

第一次的时候开始检测，如果超过阈值则输出相关堆栈信息；否则移除。

# 衍生

这就完了嘛？兄dei，想多了，如果生产环境的性能检测工具这么写，那真的就是面向离职编程了2333。

实际要考虑的问题简直不要太多！

- Handler#hasCallbacks 方法仅支持 Android Q 及以上
- 阈值为1000ms，第一个方法耗时980ms，第二个方法耗时20ms，这时候打印的堆栈是20ms的方法的堆栈
- 阈值还是为1000ms，第一个方法耗时500ms，第二个方法耗时500ms，这时候只打印了第二个方法的堆栈
- 怎么把这些堆栈信息同步到远端
- ...

# 写在最后

突然想起好久之前看到过[@markzhai](https://github.com/markzhai)发布过一个检测UI卡顿的[工具](https://github.com/markzhai/AndroidPerformanceMonitor)，但当时年轻不懂其中的奥秘，连随手star都忘了。

这次一定!

# 参考

- [Android UI性能优化 检测应用中的UI卡顿](https://blog.csdn.net/lmj623565791/article/details/58626355)
- [StackTrace简述以及StackTraceElement使用实例](https://blog.csdn.net/lfdfhl/article/details/39499569)
- [卡顿监测之真正轻量级的卡顿监测工具BlockDetectUtil（仅一个类）](https://blog.csdn.net/u012874222/article/details/79400154)
