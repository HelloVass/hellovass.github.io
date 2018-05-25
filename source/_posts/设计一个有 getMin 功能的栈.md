---
title: 设计一个有 getMin 功能的栈
date: 2016-11-14 14:51:30
categories: 数据结构
tags:
	- 数据结构
	- 朝花夕拾
---


## 问题

实现一个特殊的栈，在实现栈的基本功能的基础上，再实现返回栈中最小元素的操作

<!-- more -->

## 要求

- pop、push、getMin 操作的时间复杂度都是 O(1)

- 设计的栈类型可以使用现成的栈结构


## 思路

这个类的设计上，采用两个栈，一个用来保存当前栈中的元素，其功能等同于一个正常的栈，记为 mStack;另一个栈用来保存每一步的最小值，记为 mMinStack.


### 方案一：

``` java

public class MyStack1<T extends Comparable<T>> {

    private Stack<T> mStack;

    private Stack<T> mMinStack;

    public MyStack1() {
        mStack = new Stack<>();
        mMinStack = new Stack<>();
    }


    public void push(T item) {

        if (mMinStack.isEmpty()) {
            mMinStack.push(item);
        } else if (item.compareTo(getMin()) <= 0) {
            mMinStack.push(item);
        }

        mStack.push(item);

    }

    public T pop() {

        if (mMinStack.isEmpty()) {
            throw new RuntimeException("your stack is empty.");
        }

        T item = mStack.pop();

        if (item.compareTo(getMin()) == 0) {
            return mMinStack.pop();
        }

        return item;
    }

    private T getMin() {
        if (mMinStack.isEmpty()) {
            throw new RuntimeException("your stack is empty.");
        }
        return mMinStack.peek();
    }

}


```

### 方案二

``` java

public class MyStack2<T extends Comparable<T>> {

    private Stack<T> mStack;

    private Stack<T> mMinStack;

    public void push(T item) {

        if (mMinStack.isEmpty()) {
            mMinStack.push(item);
        } else if (item.compareTo(getMin()) <= 0) {
            mMinStack.push(item);
        } else {
            T minItem = mMinStack.peek();
            mMinStack.push(minItem);
        }

        mStack.push(item);

    }

    public T pop() {

        if (mMinStack.isEmpty()) {
            throw new RuntimeException("your stack is empty.");
        }

        mMinStack.pop();

        return mStack.pop();
    }

    private T getMin() {
        if (mMinStack.isEmpty()) {
            throw new RuntimeException("your stack is empty.");
        }
        return mMinStack.peek();
    }
}


```





