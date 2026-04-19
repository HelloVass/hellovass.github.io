---
title: palindrome-number#9
date: 2020-03-16 15:50:15
tags:
    - 算法
---

# 问题

[回文数#2](https://leetcode-cn.com/problems/palindrome-number/)

<!-- more -->

## Int#isPalindrome

给 `Int` 定义一个私有的扩展方法 `isPalindrome`:

```kotlin
// Solution9.kt
private fun Int.isPalindrome1(): Boolean {
    // 具体实现
}
```

## 单元测试

```kotlin
    @Test
    fun test() {
        assert(1234321.isPalindrome1())
        assert(!(-121).isPalindrome2())
        assert(!10.isPalindrome3())
    }
```

# 解法

## 暴力解法

通过 kotlin 提供的 api，我们可以这样：

```kotlin
 private fun Int.isPalindrome3(): Boolean {
        return toString().let {
            it == it.reversed()
        }
    }
```

## 解法2

通过取整和取余操作获取整数对应的数字逐一进行比较。

举🌰，1221：

- 1221 / 1000，得到首位 1
- 1221 % 10，得到末尾 1
- 首位和末尾比较
- 再将 22 取出来继续上述操作

动画：

![动画演示](https://pic.leetcode-cn.com/6df9cbf08ef47a1761e7426aab48228a8dcfc9c5f89c82b44148ad0e24efe511-file_1558924390360)

代码：

```kotlin
    /**
     * 解法 1
     */
    private fun Int.isPalindrome1(): Boolean {

        if (this < 0)
            return false

        var num = this
        var div = 1

        while (num / div >= 10)
            div *= 10

        while (num > 0) {

            val left = num / div
            val right = num % 10

            if (left != right)
                return false

            num = (num % div) / 10
            div /= 100
        }

        return true
    }
```

## 解法2的进阶版——解法3

回文数，将数字对折后看能否一一对应。

所以这个解法的操作就是**取出后半段数字进行翻转**

注意，回文数的位数存在奇数和偶数的情况：

- 如果长度为偶数，对折过来应该是相等的
- 如果长度为奇数，对折过来后，长的需要去掉一位数（除以 10 并取整）

具体做法如下：

- 每次进行取余操作（%10），取出最低位：`y = x % 10`
- 将最低位数字加到取出数的末尾：`revertNum = revertNum * 10 + y`
- 每取一个最低位数字，`x` 都要除以 10
- 判断 `x` 是不是小于 `revertNum`，如果小于，则说明数字已经对半或者过半了
- 最后，判断奇偶情况：如果是偶数，`revertNum` 和 `x` 相等；否则，最中间的数字就在 `revertNum` 的最低位上，将它除以 10 后应该和 `x` 相等

## 代码

```kotlin
    /**
     * 解法2
     */
    private fun Int.isPalindrome2(): Boolean {

        if ((this < 0) || (this != 0 && this % 10 == 0))
            return false

        var num = this
        var revertedNum = 0

        while (num > revertedNum) {
            revertedNum = revertedNum * 10 + num % 10
            num /= 10
        }

        return num == revertedNum || num == revertedNum / 10
    }
```

# 参考

- [精选题解](https://leetcode-cn.com/problems/palindrome-number/solution/dong-hua-hui-wen-shu-de-san-chong-jie-fa-fa-jie-ch/)