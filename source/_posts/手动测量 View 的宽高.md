---
title: 手动测量 View 的宽高
date: 2016-10-04 16:24:57
categories: Android 小事
tags: 
    - Android
    - 所以然
---

## 简单说明

手动调用 View 的 `measure(int widthMeasureSpec,int heightMeasureSpec)` 方法来得到 View 的宽高。

<!-- more -->

## 根据 View 的 LayoutParams 以下几种情况

### 具体数值（dp/px）

举个栗子，宽高都是 100 px，这时候，有我们来手动拼装合适的 MeasureSpec：

``` java
/**
   * 手动测量 View 的宽高,当 View 的宽高是精确值时
   *
   * @param target 需要测量的 View
   * @param widthSize 宽度
   * @param heightSize 高度
   */
  public void meaureManually(View target, int widthSize, int heightSize) {
    int widthMeasureSpec = MeasureSpec.makeMeasureSpec(widthSize, MeasureSpec.EXACTLY);
    int heightMeasureSpec = MeasureSpec.makeMeasureSpec(heightSize, MeasureSpec.EXACTLY);
    target.measure(widthMeasureSpec, heightMeasureSpec);
  }
```

### wrap_content

``` java
/**
   * 手动测量 View 的宽高,当 View 的宽高是 wrap_content 时
   *
   * @param target 需要测量的View
   */
  public void measueManually(View target) {
    int widthMeasureSpec = MeasureSpec.makeMeasureSpec((1 << 30) - 1, MeasureSpec.AT_MOST);
    int heightMeasureSpec = MeasureSpec.makeMeasureSpec((1 << 30) - 1, MeasureSpec.AT_MOST);
    target.measure(widthMeasureSpec, heightMeasureSpec);
  }
```

这里有点儿小技巧，我将本来应该传入的 `widthSize` 和 `heightSize` 改为了 `(1<<30)-1` ,看过 MeasureSpec 的源码就可以知道，这个特殊的 int 值就是 View 理论上能支持的最大值。

> View 的尺寸使用 30 位二进制来表示，也就是说最大是 30 个 1（即 2^30 -1），也就是 (1<<30)-1。

### match_parent

上一段 ViewGroup 的源码：

``` java
/**
     * Does the hard part of measureChildren: figuring out the MeasureSpec to
     * pass to a particular child. This method figures out the right MeasureSpec
     * for one dimension (height or width) of one child view.
     *
     * The goal is to combine information from our MeasureSpec with the
     * LayoutParams of the child to get the best possible results. For example,
     * if the this view knows its size (because its MeasureSpec has a mode of
     * EXACTLY), and the child has indicated in its LayoutParams that it wants
     * to be the same size as the parent, the parent should ask the child to
     * layout given an exact size.
     *
     * @param spec The requirements for this view
     * @param padding The padding of this view for the current dimension and
     *        margins, if applicable
     * @param childDimension How big the child wants to be in the current
     *        dimension
     * @return a MeasureSpec integer for the child
     */
    public static int getChildMeasureSpec(int spec, int padding, int childDimension) {
        int specMode = MeasureSpec.getMode(spec);
        int specSize = MeasureSpec.getSize(spec);

        int size = Math.max(0, specSize - padding);

        int resultSize = 0;
        int resultMode = 0;

        switch (specMode) {
        // Parent has imposed an exact size on us
        case MeasureSpec.EXACTLY:
            if (childDimension >= 0) {
                resultSize = childDimension;
                resultMode = MeasureSpec.EXACTLY;
            } else if (childDimension == LayoutParams.MATCH_PARENT) {
                // Child wants to be our size. So be it.
                // 如果换我们来构造此时的 MeasureSpec，我们需要知道这个 size 的大小，然而并不能，所以放弃
                resultSize = size;
                resultMode = MeasureSpec.EXACTLY;
            } else if (childDimension == LayoutParams.WRAP_CONTENT) {
                // Child wants to determine its own size. It can't be
                // bigger than us.
                resultSize = size;
                resultMode = MeasureSpec.AT_MOST;
            }
            break;

        // Parent has imposed a maximum size on us
        case MeasureSpec.AT_MOST:
            if (childDimension >= 0) {
                // Child wants a specific size... so be it
                resultSize = childDimension;
                resultMode = MeasureSpec.EXACTLY;
            } else if (childDimension == LayoutParams.MATCH_PARENT) {
                // Child wants to be our size, but our size is not fixed.
                // Constrain child to not be bigger than us.
                // 如果换我们来构造此时的 MeasureSpec，我们需要知道这个 size 的大小，然而并不能，所以放弃
                resultSize = size;
                resultMode = MeasureSpec.AT_MOST;
            } else if (childDimension == LayoutParams.WRAP_CONTENT) {
                // Child wants to determine its own size. It can't be
                // bigger than us.
                resultSize = size;
                resultMode = MeasureSpec.AT_MOST;
            }
            break;

        // Parent asked to see how big we want to be
        case MeasureSpec.UNSPECIFIED:
            if (childDimension >= 0) {
                // Child wants a specific size... let him have it
                resultSize = childDimension;
                resultMode = MeasureSpec.EXACTLY;
            } else if (childDimension == LayoutParams.MATCH_PARENT) {
                // Child wants to be our size... find out how big it should
                // be
                resultSize = View.sUseZeroUnspecifiedMeasureSpec ? 0 : size;
                resultMode = MeasureSpec.UNSPECIFIED;
            } else if (childDimension == LayoutParams.WRAP_CONTENT) {
                // Child wants to determine its own size.... find out how
                // big it should be
                resultSize = View.sUseZeroUnspecifiedMeasureSpec ? 0 : size;
                resultMode = MeasureSpec.UNSPECIFIED;
            }
            break;
        }
        //noinspection ResourceType
        return MeasureSpec.makeMeasureSpec(resultSize, resultMode);
    }
```

发现如果要构造在 View 的宽高为 match_parent 时的 MeasureSpec，**需要**知道 parentSize，而此时因为无法知道 parentSize，所以**直接放弃**。

## NOTE
注意网上的一些**奇怪代码**，还是举两个常见的栗子：

### 栗子一

``` java
    view.measure(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
```

### 栗子二

``` java
    int widthMeasureSpec = MeasureSpec.makeMeasureSpec(-1, MeasureSpec.UNSPECIFIED);
    int heightMeasureSpec = MeasureSpec.makeMeasureSpec(-1, MeasureSpec.UNSPECIFIED);
    view.measure(widthMeasureSpec, heightMeasureSpec);
```

第二个栗子最搞，现在在 Android Studio 里这么写编译器会直接给出错误提示，但是我以前经常能看到这样的代码（~~不明白原理的时候，我以前也这么做2333~~）