---
title: longest-common-prefix#14
date: 2020-03-19 22:42:47
tags:
    - leetcode
    - 字符串
---

# 问题

[最长公共前缀#14](https://leetcode-cn.com/problems/longest-common-prefix/)

<!-- more -->

## Array<String>#findLongestCommonPrefix

定义扩展方法`Array<String>#findLongestCommonPrefix`:

```kotlin
    fun findLongestCommonPrefix(): String{
        // 具体实现
    }
```

## 单元测试

```kotlin
    @Test
    fun longestCommonPrefix() {
        assert(arrayOf("flower", "flow", "flight").findLongestCommonPrefix() == "fl")
    }
```

# 解法

- 当字符串数组为空时，直接返回 ""
- 令公共字符串前缀 `prefix` 为 `first()`
- 遍历从 1 到 `count()` 的字符串 `cur`，然后找出 `cur` 与 `prefix` 公共前缀，最终结果即为最长公共前缀
- 如果查找过程中 `prefix` 为空，则不存在公共前缀，直接返回 “”
- 时间复杂度：O(s)，s 为所有字符串长度之和

代码：

```kotlin
/**
 * 找出最长公共前缀
 */
fun Array<String>.findLongestCommonPrefix(): String {

    if (isEmpty())
        return ""

    var prefix: String = first()

    for (index in 1 until count()) {

        val cur = get(index)

        while (cur.indexOf(prefix) == -1) {

            prefix = prefix.substring(0, prefix.count() - 1)

            if (prefix.isEmpty())
                return ""
        }
    }

    return prefix
}
```

# 参考

- [精选题解](https://leetcode-cn.com/problems/longest-common-prefix/solution/hua-jie-suan-fa-14-zui-chang-gong-gong-qian-zhui-b/)






