---
title: reverse-integer#7
date: 2020-03-15 23:16:41
tags:
    - leetcode
    - 算法与数据结构
---

# 问题

[整数反转#7](https://leetcode-cn.com/problems/reverse-integer/)

<!-- more -->

## Int#reverse

给`Int`定义一个私有的扩展方法`reverse`：

```kotlin
    // Solution7.kt
    private fun Int.reverse(): Int {
        // 具体实现
    }
```

## 单元测试

```kotlin
    // Soulution7.kt
    @Test
    fun reverse() {
        // "123" 反转之后为 "321"
        assert(123.reverse() == 321)
        // "-123" 反转之后为 "-321"
        assert((-123).reverse() == -321)
        // "120" 反转之后为 "21"
        assert((120).reverse() == 21)
    }
```

# 解法

反转整数可以与反转字符串进行类比。

我们想重复**弹出**`num`的最后一位数字，并将它**推入**到`result`的后面。最后，`result`与`num`相反。

要在没有辅助堆栈/数组的帮助下**弹出**和**推入**数字，我们可以使用数学方法。

## 数学方法

```kotlin
// pop
pop = num % 10
num /= 10

// push
temp = result * 10 + pop
result = temp
```

但是，这种方法很危险，因为当`temp = result*10 + pop`时会导致溢出。

假设`result`是正整数：

- 如果`temp = result*10 + pop`导致溢出，那么`result >= Int.MAX_VALUE/10`
- 如果`result > Int.MAX_VALUE/10`，那么`temp = result * 10 + pop`一定会溢出
- 如果`result = Int.MAX_VALUE/10`，那么只要`pop > 7，temp = result * 10 + pop`就会溢出

当`result`为负整数时同理。

## 代码

```kotlin
    /**
     * 整数反转
     */
    private fun Int.reverse(): Int {
        
        // 要反转的整数
        var value = this
        
        // 结果
        var result = 0

        while (value != 0) {
            // 计算进位，注意 pop 是带符号的
            val pop = value % 10
            when {
                // 7 是 Int.MAX_VALUE 的第2位
                (result > Int.MAX_VALUE / 10) || (result == Int.MAX_VALUE / 10 && pop > 7) ->
                    return 0
                // 8 是 Int.MIN_VALUE 的第2位
                (result < Int.MIN_VALUE / 10) || (result == Int.MIN_VALUE / 10 && pop < -8) ->
                    return 0
            }
            result = result * 10 + pop
            value /= 10
        }

        return result
    }
```

# 参考

- [题解1](https://leetcode-cn.com/problems/reverse-integer/solution/hua-jie-suan-fa-7-zheng-shu-fan-zhuan-by-guanpengc/)
- [题解2](https://leetcode-cn.com/problems/reverse-integer/solution/zheng-shu-fan-zhuan-by-leetcode/)










