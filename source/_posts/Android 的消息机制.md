---
title: Android 的消息机制
date: 2016-10-05 21:12:52
categories: Android 小事
tags:
    - Android
    - 所以然
---


## 先来谈谈 ThreadLocal

### 简介

> ThreadLocal 是一个线程内部的数据存储类，通过他可以在指定的线程中存储数据，数据存储以后，只有在指定线程中可以获取到存储的数据，对于其他线程来说则无法获取到数据。

### 使用场景

> 某些数据以线程为作用域并且不同线程具有不同的数据副本

<!-- more -->

#### 举个栗子

``` java
public final class Looper {
    /*
     * API Implementation Note:
     *
     * This class contains the code required to set up and manage an event loop
     * based on MessageQueue.  APIs that affect the state of the queue should be
     * defined on MessageQueue or Handler rather than on Looper itself.  For example,
     * idle handlers and sync barriers are defined on the queue whereas preparing the
     * thread, looping, and quitting are defined on the looper.
     */

    private static final String TAG = "Looper";

    // sThreadLocal.get() will return null unless you've called prepare().
    static final ThreadLocal<Looper> sThreadLocal = new ThreadLocal<Looper>();
```

Handler 需要获取**当前线程**的 Looper，这时候 Looper 的作用域就是线程并且不同线程具有不同的 Looper。


### 通过一个小 Demo 测试下

``` java
public class Main {

    private static ThreadLocal<String> mThreadLocal = new ThreadLocal<String>();


    public static void main(String[] args) {

        printInMainThread();

        printInThreadOne();

        printInThreadTwo();
    }

    private static void printInMainThread() {
        mThreadLocal.set("main thread");
        System.out.println("[Thread#main] mThreadLocal = " + mThreadLocal.get());
    }

    private static void printInThreadTwo() {
        new Thread("Thread#1") {
            @Override
            public void run() {
                mThreadLocal.set("thread 1");
                System.out.println("[Thread#1] mThreadLocal = " + mThreadLocal.get());
            }
        }.start();
    }

    private static void printInThreadOne() {
        new Thread("Thread#2") {
            @Override
            public void run() {
                mThreadLocal.set("thread 2");
                System.out.println("[Thread#2] mThreadLocal = " + mThreadLocal.get());
            }
        }.start();
    }

}
```

从控制台输出可以看到，虽然在不同的线程中访问的是**同一个** ThreadLocal，但是通过 ThreadLocal.get( ) 这个方法得到的**值**却是不一样的，这就很有趣了！


### 源码分析

ThreadLocal 的 set( ) 方法，如下：

``` java
    public void set(T value) {
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null)
            map.set(this, value);
        else
            createMap(t, value);
    }
```

根据**当前线程**调用 `getMap(Thread t)` 方法找到对应的 ThreadLocalMap，如果 map 不等于 null，则调用 ThreadLocalMap 的 `set(ThreadLocal<?> key, Object value)` 方法。

> NOTE: ThreadLocalMap 是 ThreadLocal 的一个静态内部类

看下这个 `set(ThreadLocal<?> key, Object value)` 方法：

``` java
    private void set(ThreadLocal<?> key, Object value) {
    
            Entry[] tab = table;
            int len = tab.length;
            int i = key.threadLocalHashCode & (len-1);

            for (Entry e = tab[i];
                 e != null;
                 e = tab[i = nextIndex(i, len)]) {
                ThreadLocal<?> k = e.get();

                if (k == key) {
                    e.value = value;
                    return;
                }

                if (k == null) {
                    replaceStaleEntry(key, value, i);
                    return;
                }
            }

            tab[i] = new Entry(key, value);
            int sz = ++size;
            if (!cleanSomeSlots(i, sz) && sz >= threshold)
                rehash();
        }
```

Entry 是 ThreadLocalMap 的一个静态内部类，如下：

``` java
    static class ThreadLocalMap {

     // ...省略N行注释

    static class Entry extends WeakReference<ThreadLocal<?>> {
      
            Object value;
            
            Entry(ThreadLocal<?> k, Object v) {
                super(k);
                value = v;
            }
        }
```

> NOTE：这里 ThreadMap 在选择 key 的时候并没有直接选择 ThreadLocal 实例，而是 ThreadLocal 实例的弱引用

再看看 ThreadLocal 的 `get()` 方法和 ThreadLocalMap 的 `getEntry(ThreadLocal<?> key)` 方法

``` java
    public T get() {
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null) {
            ThreadLocalMap.Entry e = map.getEntry(this);
            if (e != null) {
                @SuppressWarnings("unchecked")
                T result = (T)e.value;
                return result;
            }
        }
        return setInitialValue();
    }

    private Entry getEntry(ThreadLocal<?> key) {
            int i = key.threadLocalHashCode & (table.length - 1);
            Entry e = table[i];
            if (e != null && e.get() == key)
                return e;
            else
                return getEntryAfterMiss(key, i, e);
    }
```

根据**当前线程**找到对应的 `ThreadLocalMap`，如果 map 不等于空，接着调用 ThreadLocalMap 的 `getEntry(ThreadLocal<?> key)` 方法得到对应的 ThreadLocalMap.Entry 。如果 map 等于空，则调用 `setInitialValue()` 提供的值（默认是 null）。

``` java
   protected T initialValue() {
        return null;
   }
```

该方法可以由开发者来**重写**，提供一个初始值。

## 搞基三剑客

开发者日常接触最多的可能是 Handler，而支撑 Handler 运行机制的实际上还有 MessageQueue 和 Looper 这两个好基友。

### MessageQueue

中文名称消息队列，实际上的数据结构并不是**队列**，而是一个**链表**，主要支持两个操作——消息入队和消息出队。

#### 入队操作对应的方法

``` java
boolean enqueueMessage(Message msg, long when) {

        if (msg.target == null) {
            throw new IllegalArgumentException("Message must have a target.");
        }
        if (msg.isInUse()) {
            throw new IllegalStateException(msg + " This message is already in use.");
        }

        synchronized (this) {
            if (mQuitting) {
                IllegalStateException e = new IllegalStateException(
                        msg.target + " sending message to a Handler on a dead thread");
                Log.w(TAG, e.getMessage(), e);
                msg.recycle();
                return false;
            }

            msg.markInUse();
            msg.when = when;
            Message p = mMessages;
            boolean needWake;
            if (p == null || when == 0 || when < p.when) {
                // New head, wake up the event queue if blocked.
                msg.next = p;
                mMessages = msg;
                needWake = mBlocked;
            } else {
                // Inserted within the middle of the queue.  Usually we don't have to wake
                // up the event queue unless there is a barrier at the head of the queue
                // and the message is the earliest asynchronous message in the queue.
                needWake = mBlocked && p.target == null && msg.isAsynchronous();
                Message prev;
                for (;;) {
                    prev = p;
                    p = p.next;
                    if (p == null || when < p.when) {
                        break;
                    }
                    if (needWake && p.isAsynchronous()) {
                        needWake = false;
                    }
                }
                msg.next = p; // invariant: p == prev.next
                prev.next = msg;
            }

            // We can assume mPtr != 0 because mQuitting is false.
            if (needWake) {
                nativeWake(mPtr);
            }
        }
        return true;
    }
```

#### 出队操作对应的方法

``` java
Message next() {
        // Return here if the message loop has already quit and been disposed.
        // This can happen if the application tries to restart a looper after quit
        // which is not supported.
        final long ptr = mPtr;
        if (ptr == 0) {
            return null;
        }

        int pendingIdleHandlerCount = -1; // -1 only during first iteration
        int nextPollTimeoutMillis = 0;
        for (;;) {
            if (nextPollTimeoutMillis != 0) {
                Binder.flushPendingCommands();
            }

            nativePollOnce(ptr, nextPollTimeoutMillis);

            synchronized (this) {
                // Try to retrieve the next message.  Return if found.
                final long now = SystemClock.uptimeMillis();
                Message prevMsg = null;
                Message msg = mMessages;
                if (msg != null && msg.target == null) {
                    // Stalled by a barrier.  Find the next asynchronous message in the queue.
                    do {
                        prevMsg = msg;
                        msg = msg.next;
                    } while (msg != null && !msg.isAsynchronous());
                }
                if (msg != null) {
                    if (now < msg.when) {
                        // Next message is not ready.  Set a timeout to wake up when it is ready.
                        nextPollTimeoutMillis = (int) Math.min(msg.when - now, Integer.MAX_VALUE);
                    } else {
                        // Got a message.
                        mBlocked = false;
                        if (prevMsg != null) {
                            prevMsg.next = msg.next;
                        } else {
                            mMessages = msg.next;
                        }
                        msg.next = null;
                        if (DEBUG) Log.v(TAG, "Returning message: " + msg);
                        msg.markInUse();
                        return msg;
                    }
                } else {
                    // No more messages.
                    nextPollTimeoutMillis = -1;
                }

                // Process the quit message now that all pending messages have been handled.
                if (mQuitting) {
                    dispose();
                    return null;
                }

                // If first time idle, then get the number of idlers to run.
                // Idle handles only run if the queue is empty or if the first message
                // in the queue (possibly a barrier) is due to be handled in the future.
                if (pendingIdleHandlerCount < 0
                        && (mMessages == null || now < mMessages.when)) {
                    pendingIdleHandlerCount = mIdleHandlers.size();
                }
                if (pendingIdleHandlerCount <= 0) {
                    // No idle handlers to run.  Loop and wait some more.
                    mBlocked = true;
                    continue;
                }

                if (mPendingIdleHandlers == null) {
                    mPendingIdleHandlers = new IdleHandler[Math.max(pendingIdleHandlerCount, 4)];
                }
                mPendingIdleHandlers = mIdleHandlers.toArray(mPendingIdleHandlers);
            }

            // Run the idle handlers.
            // We only ever reach this code block during the first iteration.
            for (int i = 0; i < pendingIdleHandlerCount; i++) {
                final IdleHandler idler = mPendingIdleHandlers[i];
                mPendingIdleHandlers[i] = null; // release the reference to the handler

                boolean keep = false;
                try {
                    keep = idler.queueIdle();
                } catch (Throwable t) {
                    Log.wtf(TAG, "IdleHandler threw exception", t);
                }

                if (!keep) {
                    synchronized (this) {
                        mIdleHandlers.remove(idler);
                    }
                }
            }

            // Reset the idle handler count to 0 so we do not run them again.
            pendingIdleHandlerCount = 0;

            // While calling an idle handler, a new message could have been delivered
            // so go back and look again for a pending message without waiting.
            nextPollTimeoutMillis = 0;
        }
    }
```


### Looper

字面意思，循环者，在 Android 的消息机制中扮演的是消息循环的角色。具体来说，是它负责从 MessageQueue 中查看是否有新的消息投递进来，如果有则立即处理；如果没有，就会阻塞在哪里。

#### 构造方法

``` java
    private Looper(boolean quitAllowed) {
        mQueue = new MessageQueue(quitAllowed);
        mThread = Thread.currentThread();
    }
```

在构造方法中创建了一个 MessageQueue。

#### prepare( ) 方法

初学 Android 的时候我们经常会写这样的一段代码，如下：

``` java
    new Thread() {
      @Override public void run() {
        Looper.prepare();
        Handler handler = new Handler() {
          @Override public void handleMessage(Message msg) {
            //  do some hard work
          }
        };
        Looper.loop();
      }
    }.start();
```

如果没有调用 Looper.prepare( ) 这个方法，应用就会 Crash。

``` java
    public static void prepare() {
        prepare(true);
    }

    private static void prepare(boolean quitAllowed) {
        if (sThreadLocal.get() != null) {
            throw new RuntimeException("Only one Looper may be created per thread");
        }
        sThreadLocal.set(new Looper(quitAllowed));
    }
```

很明显，每一个线程只允许有一个 Looper，否则就会抛出 `RuntimeException`。

接下来，Looper 中最重要的一个方法 `loop()`，如下所示：

``` java
    public static void loop() {
        final Looper me = myLooper();
        if (me == null) {
            throw new RuntimeException("No Looper; Looper.prepare() wasn't called on this thread.");
        }
        final MessageQueue queue = me.mQueue;

        // Make sure the identity of this thread is that of the local process,
        // and keep track of what that identity token actually is.
        Binder.clearCallingIdentity();
        final long ident = Binder.clearCallingIdentity();

        for (;;) {
            Message msg = queue.next(); // might block
            if (msg == null) {
                // No message indicates that the message queue is quitting.
                return;
            }

            // This must be in a local variable, in case a UI event sets the logger
            final Printer logging = me.mLogging;
            if (logging != null) {
                logging.println(">>>>> Dispatching to " + msg.target + " " +
                        msg.callback + ": " + msg.what);
            }

            final long traceTag = me.mTraceTag;
            if (traceTag != 0) {
                Trace.traceBegin(traceTag, msg.target.getTraceName(msg));
            }
            try {
                msg.target.dispatchMessage(msg);
            } finally {
                if (traceTag != 0) {
                    Trace.traceEnd(traceTag);
                }
            }

            if (logging != null) {
                logging.println("<<<<< Finished to " + msg.target + " " + msg.callback);
            }

            // Make sure that during the course of dispatching the
            // identity of the thread wasn't corrupted.
            final long newIdent = Binder.clearCallingIdentity();
            if (ident != newIdent) {
                Log.wtf(TAG, "Thread identity changed from 0x"
                        + Long.toHexString(ident) + " to 0x"
                        + Long.toHexString(newIdent) + " while dispatching to "
                        + msg.target.getClass().getName() + " "
                        + msg.callback + " what=" + msg.what);
            }

            msg.recycleUnchecked();
        }
    }
```

`loop()` 方法内是一个死循环，唯一能跳出的条件是 `MessageQueue.next()` 返回了 null，否则 loop 将会无限循环下去。注意，loop 方法调用的 `MessageQueue.next()` 是一个阻塞操作，没有消息时，会阻塞在那里，这也是loop 会阻塞的原因。

> PS：关于 Looper 的阻塞，很多人还会产生这么一个[疑问](https://www.zhihu.com/question/34652589)。

注意，这里的 msg.target 就是**发送消息的 Handler 对象**，所以，最后 Handler 发送的消息又交给了它的 `dispatchMessage()` 方法处理！~~记得第一次看这个逻辑的时候我也是懵逼的，为毛绕这么大一个圈消息又交给自己处理，MDZZ！~~实际上，仔细看的话会发现，这时候 `msg.target.dispatchMessage()` 这个方法是在**创建 Handler 的子线程**中执行的！简单来说，**代码巧妙地切换到指定的这个新线程中去执行了**。


### Handler

#### 构造方法

``` java

    public Handler() {
        this(null, false);
    }

    public Handler(Callback callback, boolean async) {
        if (FIND_POTENTIAL_LEAKS) {
            final Class<? extends Handler> klass = getClass();
            if ((klass.isAnonymousClass() || klass.isMemberClass() || klass.isLocalClass()) &&
                    (klass.getModifiers() & Modifier.STATIC) == 0) {
                Log.w(TAG, "The following Handler class should be static or leaks might occur: " +
                    klass.getCanonicalName());
            }
        }

        mLooper = Looper.myLooper();
        if (mLooper == null) {
            throw new RuntimeException(
                "Can't create handler inside thread that has not called Looper.prepare()");
        }
        mQueue = mLooper.mQueue;
        mCallback = callback;
        mAsynchronous = async;
    }
```

Handler 默认的构造方法会检查 Looper 是否为空，如果为空则会报错 **Can't create handler inside thread that has not called Looper.prepare()**。

至于为毛在 Activity 我们创建 Handler 实例的时候没有报错呢？因为在 ActivityThread 中已经调用了 `Looper.prepareMainLooper()`，如下所示：

``` java
    public static void main(String[] args) {
        // 省略N行...
        
        Looper.prepareMainLooper();

        // 省略N行...
        Looper.loop();
    }
```

而 `prepareMainLooper()` 正调用了 `prepare()`，如下所示：

``` java
    public static void prepareMainLooper() {
        prepare(false);
        synchronized (Looper.class) {
            if (sMainLooper != null) {
                throw new IllegalStateException("The main Looper has already been prepared.");
            }
            sMainLooper = myLooper();
        }
    }
```










