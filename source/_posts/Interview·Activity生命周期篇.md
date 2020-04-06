---
title: 写给面试的·Activity生命周期篇
date: 2020-03-08 16:19:34
tags:
    - Activity
    - 面试
---

# 前言

大厂面试比较喜欢问，看起来简单，没梳理过就会踩坑的题

<!-- more -->

# 问题

- onStart 和 onResume，onPause 和 onStop 从描述上来看差不多，对开发者来说有什么实质性的不同呢？
- 假设当前 Activity 为 A，如果这时用户打开一个新 Activity B，那么 B 的 onResume 和 A 的 onPause 哪个先执行呢？

## 问题1.

从实际使用过程来说，onStart 和 onResume、onPause 和 onStop 看起来的确差不多，甚至我们可以只保留其中一对，比如只保留 onStart 和 onStop。既然如何，那为什么系统还要提供看起来重复的接口呢？

这两个配对的接口表示的意义不同：

- onStart 和 onStop 从 Activity 是否可见
- onResume 和 onPause 从 Activity 是否位于前台

## 问题2.

涉及到 Activity 的启动流程，启动流程实际上非常复杂，包含 Instrumentation、ActivityThread 和 ActivityManagerService（经常说的AMS就是它了）。

简述流程：

- 启动 `Activity` 的请求由 `Instrumentation` 处理，然后它通过 Binder 向 AMS 发送请求
- AMS 内部维护了一个 ActivityStack 并负责栈内的 `Activity` 的状态同步，AMS 通过 `ActivityThread` 去同步 `Activity` 的状态从而完成生命周期方法的调用

在 `ActivityStack` 中的 `resumeTopActivityInnerLocked` 关键代码：

```java
        // If the flag RESUME_WHILE_PAUSING is set, then continue to schedule the previous activity
        // to be paused, while at the same time resuming the new resume activity only if the
        // previous activity can't go into Pip since we want to give Pip activities a chance to
        // enter Pip before resuming the next activity.
        final boolean resumeWhilePausing = (next.info.flags & FLAG_RESUME_WHILE_PAUSING) != 0
                && !lastResumedCanPip;

        boolean pausing = getDisplay().pauseBackStacks(userLeaving, next, false);
        if (mResumedActivity != null) {
            if (DEBUG_STATES) Slog.d(TAG_STATES,
                    "resumeTopActivityLocked: Pausing " + mResumedActivity);
            pausing |= startPausingLocked(userLeaving, false, next, false);
        }
```

从注释里可以看到，在新 Activity 启动之前，栈顶的 Activity 需要先 onPause，新 Activity 才能启动。最终，在 ActivityStackSupervisor 中的 realStartActivityLocked 方法会调用如下代码：

```java
// Schedule transaction.
mService.getLifecycleManager().scheduleTransaction(clientTransaction);

// frameworks/base/services/core/java/com/android/server/am/ClientLifecycleManager.java 
void scheduleTransaction(ClientTransaction transaction) throws RemoteException {
    final IApplicationThread client = transaction.getClient();
    transaction.schedule();
    // 省略N行
}

// frameworks/base/core/java/android/app/servertransaction/ClientTransaction.java
public void schedule() throws RemoteException {
    mClient.scheduleTransaction(this);
}
```

`ClientTransaction#schedule`方法中的`mClient`是一个`IApplicationThread`接口，`ActivityThread$ApplicationThread`派生这个接口并实现了对应的方法。所以直接到`ApplicationThread#scheduleTransaction`方法。`ActivityThread` 类中没有定义 `scheduleTransaction` 方法，所以调用的是他父类的 `ClientTransactionHandler#scheduleTransaction` 方法。

```java
    // frameworks/base/core/java/android/app/ActivityThread.java
    private class ApplicationThread extends IApplicationThread.Stub {
        ..
        @Override
        public void scheduleTransaction(ClientTransaction transaction) throws RemoteException {
            ActivityThread.this.scheduleTransaction(transaction);
        }
    }

    // frameworks/base/core/java/android/app/ClientTransactionHandler.java
    void scheduleTransaction(ClientTransaction transaction) {
        transaction.preExecute(this);
        sendMessage(ActivityThread.H.EXECUTE_TRANSACTION, transaction);
    }
```

在 ClientTransactionHandler#scheduleTransaction 中调用了 sendMessage 方法，该方法是一个抽象方法，实现在 ClientTransactionHandler 的派生类 ActivityThread 中，ActivityThread#sendMessage 方法会把消息发给内部名为`H`的`Handler`。

```java
    // frameworks/base/core/java/android/app/ActivityThread.java
    void sendMessage(int what, Object obj) {
        sendMessage(what, obj, 0, 0, false);
    }

    private void sendMessage(int what, Object obj, int arg1) {
        sendMessage(what, obj, arg1, 0, false);
    }

    private void sendMessage(int what, Object obj, int arg1, int arg2) {
        sendMessage(what, obj, arg1, arg2, false);
    }

    private void sendMessage(int what, Object obj, int arg1, int arg2, boolean async) {
        if (DEBUG_MESSAGES) Slog.v(
            TAG, "SCHEDULE " + what + " " + mH.codeToString(what)
            + ": " + arg1 + " / " + obj);
        Message msg = Message.obtain();
        msg.what = what;
        msg.obj = obj;
        msg.arg1 = arg1;
        msg.arg2 = arg2;
        if (async) {
            msg.setAsynchronous(true);
        }
        mH.sendMessage(msg);
    }

    // ActivityThread$H
    public void handleMessage(Message msg) {
        // 省略 N行
        case EXECUTE_TRANSACTION: 
            final ClientTransaction transaction = (ClientTransaction) msg.obj;
            mTransactionExecutor.execute(transaction);
            // 省略 N行
            break;
        // 省略 N行
    }
```

H 的实例接收到 EXECUTE_TRANSACTION 消息后，调用`TransactionExecutor#execute`方法切换 Activity 的状态。`TransactionExecutor#execute` 方法里先执行 callbacks（如果不为null），然后改变 Activity 当前的生命周期状态。

```java
    // frameworks/base/core/java/android/app/servertransaction/TransactionExecutor.java
    public void execute(ClientTransaction transaction) {
        // 省略 N行
        executeCallbacks(transaction);
        executeLifecycleState(transaction);
        // 省略 N行
    }

    /** Transition to the final state if requested by the transaction. */
    private void executeLifecycleState(ClientTransaction transaction) {
        // 省略 N行
        // Cycle to the state right before the final requested state.
        cycleToPath(r, lifecycleItem.getTargetState(), true /* excludeLastState */);

        // Execute the final transition with proper parameters.
        lifecycleItem.execute(mTransactionHandler, token, mPendingActions);
        lifecycleItem.postExecute(mTransactionHandler, token, mPendingActions);
    }

```

在`executeLifecycleState`方法里:
- 先调用`TransactionExecutor#cycleToPath`方法执行当前生命周期状态之前的状态
- 然后执行`ActivityLifecycleItem#execute`方法，由于是从`ON_RESUME`状态到`ON_PAUSE`状态切换，中间没有其他状态，cycleToPath 这个情况下没有做什么实质性的事情，直接执行`lifecycleItem.execute`方法
- 之前在`ActivityStack.startPausingLocked`方法里面`scheduleTransaction`传递的是`PauseActivityItem`对象，所以`executeLifecycleState`方法里的`lifecycleItem`实际是`PauseActivityItem`对象

```java
 // frameworks/base/core/java/android/app/servertransaction/PauseActivityItem.java
 @Override
    public void execute(ClientTransactionHandler client, IBinder token,
            PendingTransactionActions pendingActions) {
        Trace.traceBegin(TRACE_TAG_ACTIVITY_MANAGER, "activityPause");
        client.handlePauseActivity(token, mFinished, mUserLeaving, mConfigChanges, pendingActions,
                "PAUSE_ACTIVITY_ITEM");
        Trace.traceEnd(TRACE_TAG_ACTIVITY_MANAGER);
    }
```

`PauseActivityItem#execute`方法中传入的`client`实际上是`ActivityThread`对象，所以我们又回到了`ActivityThread`。

```java
    // frameworks/base/core/java/android/app/ActivityThread.java
    @Override
    public void handlePauseActivity(IBinder token, boolean finished, boolean userLeaving,
            int configChanges, PendingTransactionActions pendingActions, String reason) {
            // 省略 N行
            performPauseActivity(r, finished, reason, pendingActions);
            // 省略 N行
        }
    }

    final Bundle performPauseActivity(IBinder token, boolean finished, String reason,
            PendingTransactionActions pendingActions) {
        ActivityClientRecord r = mActivities.get(token);
        return r != null ? performPauseActivity(r, finished, reason, pendingActions) : null;
    }

    /**
     * Pause the activity.
     * @return Saved instance state for pre-Honeycomb apps if it was saved, {@code null} otherwise.
     */
    private Bundle performPauseActivity(ActivityClientRecord r, boolean finished, String reason,
            PendingTransactionActions pendingActions) {
        // 省略 N行
        if (shouldSaveState) {
            callActivityOnSaveInstanceState(r);
        }

        performPauseActivityIfNeeded(r, reason);
        // 省略 N行
        return shouldSaveState ? r.state : null;
    }

    private void performPauseActivityIfNeeded(ActivityClientRecord r, String reason) {
        // 省略 N行
        try {
            r.activity.mCalled = false;
            mInstrumentation.callActivityOnPause(r.activity);
            // 省略 N行
        } catch (SuperNotCalledException e) {
            throw e;
        } catch (Exception e) {
            if (!mInstrumentation.onException(r.activity, e)) {
                throw new RuntimeException("Unable to pause activity "
                        + safeToComponentShortString(r.intent) + ": " + e.toString(), e);
            }
        }
        r.setState(ON_PAUSE);
    }
```

离终点总算不远了，`Instrumentation#callActivityOnPause` 方法中调用了`Activity#performPause`，在`performPause`中我们终于看到了熟悉的钩子函数`onPause`，至此栈顶`Activity`的`pause`流程完毕。

## 总结

这里的源码是根据 Android 9.0 来分析的，跟 5.0 相比，真的复杂了很多，看到一位老哥的 Activity启动流程源码分析写的不错，把 pause 这块的流程分析稍加整理放到了这道题目下，有兴趣的话可以自己翻阅源码。

思考，9.0 的源码里似乎多了很多`lifecycle`、状态切换相关的字眼，如果是熟悉`aac架构`的老哥们一定不陌生了，9.0 这块改动这么大应该就是加入了 LifeCycle 的特性（确信）。

综上，新启一个`Activity`的时候，旧`Activity`的`onPause`会先执行，然后才会启动新的`Activity`。

官网对 onPause 的解释：

> The foreground lifetime of an activity happens between a call to onResume() until a corresponding call to onPause(). During this time the activity is in visible, active and interacting with the user. An activity can frequently go between the resumed and paused states -- for example when the device goes to sleep, when an activity result is delivered, when a new intent is delivered -- so the code in these methods should be fairly lightweight.

别在 onPause 里做重量级操作，因为 onPause 执行完之后，新 Activity 才能 Resume！

# 参考

- [（Android 9.0）Activity启动流程源码分析](https://blog.csdn.net/lj19851227/article/details/82562115)
- [Android开发艺术探索](https://item.jd.com/11760209.html)


