---
title: Java多线程和线程同步
date: 2020-02-10 20:11:27
tags:
    - Java 基础
---

## new Thread 

```kotlin
        Thread(
            Runnable {
                // ignore
            }
        ).start()
```

远古时期的写法，问题也很多：

- 每次通过 new Thread 新建对象性能差
- 线程缺乏统一管理，可能无限制新建线程，相互之间竞争，及可能占用过多系统资源导致死机或oom
- 缺乏更多功能，如定时执行、定期执行、线程中断

## 线程池

Java 提供的4种线程池好处：

- 重用存在的线程，减少对象创建、消亡的开销，性能佳
-  可有效控制最大并发线程数，提高系统资源的使用率，同时避免过多资源竞争，避免堵塞
- 提供定时执行、定期执行、单线程、并发数控制等功能

## 线程池介绍

Java 的 Executors 提供4种线程池，分别为：
- newCachedThreadPool
- newSingleThreadExecutor
- newFixedThreadPool

### ThreadPoolExecutor

先来看一下 ThreadPoolExecutor 构造方法签名：

```java
public ThreadPoolExecutor(
    int corePoolSize,
    int maximumPoolSize,
    long keepAliveTime,
    TimeUnit unit,
    BlockingQueue<Runnable> workQueue
) {
    // 省略N行代码  
} 
```

- `corePoolSize`，线程池最小线程数，
- `maximumPoolSize`，线程池最大线程数
- `keepAliveTime`，线程存活时间
- `workQueue`，线程容器，线程池满了之后用来存放线程

### newCachedThreadPool()

方法签名如下：

```java
public static ExecutorService newCachedThreadPool() {
        return new ThreadPoolExecutor(
            0,
            Integer.MAX_VALUE,
            60L,
            TimeUnit.SECONDS,
            new SynchronousQueue<Runnable>()
        )
    }       
```

创建一个可缓存线程池，如果线程长度超过处理需要，可灵活空闲线程，若无可回收，则新建线程。maximumPoolSize 参数为无限大，线程存活时间为 60S，如果当执行第二个任务时第一个任务已经完成，会复用第一个任务的线程，而不用新建线程。

### newSingleThreadExecutor()

```java
    public static ExecutorService newSingleThreadExecutor() {
        return new FinalizableDelegatedExecutorService (
            new ThreadPoolExecutor(
                1, 
                1,
                0L, 
                TimeUnit.MILLISECONDS,
                new LinkedBlockingQueue<Runnable>()
                )
            );
    }
```

创建只有一个线程的线程池，保证所有任务按照指定顺序（FIFO，LIFO，优先级）执行。适用于不适合并发但可能导致 IO 阻塞影响 UI 线程响应的操作：
- 数据库操作
- 文件操作
- 应用批量安装、删除

### newFixedThreadPool(int nThreads)

```java
public static ExecutorService newFixedThreadPool(int nThreads) {
        return new ThreadPoolExecutor(
            nThreads, 
            nThreads,
            0L, 
            TimeUnit.MILLISECONDS,
            new LinkedBlockingQueue<Runnable>()
            );
    }
```

创建一个指定长度的线程池，可控制线程最大并发数，超出的线程会在队列中等待。

### newScheduledThreadPool()

```java

public static ScheduledExecutorService newScheduledThreadPool(int corePoolSize) {
        return new ScheduledThreadPoolExecutor(corePoolSize);
    }

// 构造方法
public ScheduledThreadPoolExecutor(int corePoolSize) {
        super(
            corePoolSize,
            Integer.MAX_VALUE,
            DEFAULT_KEEPALIVE_MILLIS, 
            MILLISECONDS,
            new DelayedWorkQueue()
        );
    }
```

`ScheduledThreadPoolExecutor` 继承自 `ThreadPoolExecutor`，该方法创建一个定长线程池，支持定时以及周期性任务执行。

## 线程同步&线程安全

线程安全是一个在面试中经常被拿出来面试的点，题目也挺多的，如果只做题，似乎永远都做不完的样子，所以线程安全问题的本质是啥勒：

- 多个线程访问**共同资源**时，在某一个线程对资源进行写操作时（写入开始，未结束），其他线程对这个正在被写入的资源进行了读/写操作，造成数据不一致

锁机制解决问题的本质：

通过对**共享的资源**进行访问闲置，同一时间内只允许单个线程访问，保证了数据的一致性

结论：不论线程安全问题，还是针对这个问题提出的锁机制解决方案，核心都在于如何保护**共享资源**，而不是某个方法或者某几行代码。

### synchronized 注解

kotlin 没有 synchronized 关键字，但提供了 @Synchronized 注解。该注解和 Java 的 synchronized 有同样的效果：它将把 JVM 方法标记为同步。

```kotlin
@Synchronized
    fun add(){
        // 省略N行
    }
```

### volatile 注解

kotlin 也没有 volatile 关键字，但提供了 @Volatile 注解：

```kotlin
@Volatile private var running = false
```

该行为类似于 @Synchronized，注解会将 JVM 备份字段标记为 volatile：
- 保证添加了@Volatile 的字段操作性具有同步性，以及对 long、double 的操作的原子性
- 只对基本类型（byte、char、short、int、long、float、double、boolean）的复制操作和对象引用复制操作有效，要修改 User.name 是不能保证同步的
- 依然解决不了 ++ 的原子性问题

### java.util.concurrent.atomic 包：

提供蛮多好用的类 AtomicInteger、AtomicBoolean 等，作用和 volatile 基本一致

### synchronized 方法

对应同步代码块，kotlin 提供 synchronized 方法：

```kotlin
fun count(newValue: Int) {
        synchronized(this) {
            // 省略N行代码
        }
    }
```

### synchronized 的膜法

- 保证方法内或者代码块内部资源的互斥访问。即同一时刻、由同一个 Monitor 监视的代码，最多只能有一个线程访问。

![Java 多线程&同步1](http://assets.processon.com/chart_image/5e43fd10e4b06b291a6c0bf0.png)


- 保证线程之间对监视资源的数据同步。即任何线程在获取到 Monitor 后的第一时间，会先将共享内存中的数据复制到自己的缓存中；任何线程在释放 Monitor 的第一时间，会先将缓存中的数据复制到共享内存中

![Java 多线程&同步2](http://assets.processon.com/chart_image/5e43ffece4b021dc28a5270c.png)

## 参考

- [Java线程池](https://www.trinea.cn/android/java-android-thread-pool/)
- [hencoder](https://hencoder.com/)