---
title: valid-parentheses#20
date: 2020-03-19 23:34:23
tags:
    - leetcode
    - 栈
---

# 问题

[有效的括号](https://leetcode-cn.com/problems/valid-parentheses/)

<!-- more -->

## String#isValid

定义扩展属性 `String#isValid`:

```kotlin
    @Test
    fun isValid() {
        assert("()".isValid)
        assert("()[]{}".isValid)
        assert(!"(]".isValid)
        assert(!"([)]".isValid)
        assert("{[]}".isValid)
    }
```

## 单元测试

```kotlin
class Solution {
    fun isValid(s: String): Boolean {
        return s.isValid
    }
}
```

# 解法

## 辅助栈法

这个方法大二的时候数据结构课老师上课有讲过，解这道题非常好用的。

- 初始化辅助站 helper
- 依次处理表达式的每个括号
- 如果遇到开括号，入栈
- 如果遇到的是闭括号，出栈
- 如果辅助栈不为空，则意味表达式无效

代码：

```kotlin
    /**
     * 字符串是否有效
     */
    private val String.isValid: Boolean
        get() {

            val helper = Stack<Char>()

            forEach { letter ->
                when {
                    letter == '(' ->
                        helper.push(')')
                    letter == '[' ->
                        helper.push(']')
                    letter == '{' ->
                        helper.push('}')
                    helper.isEmpty() || letter != helper.pop() ->
                        return false
                }
            }

            return helper.isEmpty()
        }
```




