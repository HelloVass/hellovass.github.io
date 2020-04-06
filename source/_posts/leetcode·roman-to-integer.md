---
title: roman-to-integer#13
date: 2020-03-16 22:43:30
tags:
    - leetcode
    - 罗马数
---

# 问题

[罗马数字转整数#13](https://leetcode-cn.com/problems/roman-to-integer/)

<!-- more -->

## String#roman2Int

给 `String` 定义一个私有的扩展方法 `roman2Int`：

```kotlin
private fun String.roman2Int():Int{
    // 具体实现
}
```

## 单元测试

```kotlin
    @Test
    fun romanToInt() {
        assert("III".roman2Int() == 3)
        assert("IV".roman2Int() == 4)
        assert("IX".roman2Int() == 9)
        assert("LVIII".roman2Int() == 58)
        assert("MCMXCIV".roman2Int() == 1994)
    }
```

# 解法

由题目可以得出：

- 罗马数字由 `I、V、X、L、C、D、M` 构成
- 当小值在大值得左边，则减小值
- 当小值在大值的右边，则加小值

> 由以上结论可以得出，右值永远为正，最后一位必为正

码表：

| key  | value |
| :--- | ----- |
| I    | 1     |
| V    | 5     |
| X    | 10    |
| L    | 50    |
| C    | 100   |
| D    | 500   |
| M    | 1000  |

代码实现小技巧，从第1位开始遍历，比较 `cur` 和 `pre` 的大小，从而确定是做加法还是减法，然后更新 pre 的值。只有最后一位时，做加法。

代码如下：

```kotlin
    /**
     * 罗马数转换为十进制
     */
    private fun String.roman2Int(): Int {

        val dictionary = hashMapOf(
            'I' to 1,
            'V' to 5,
            'X' to 10,
            'L' to 50,
            'C' to 100,
            'D' to 500,
            'M' to 1000
        )

        var sum = 0

        var prev: Int = dictionary[first()] ?: throw IllegalStateException()

        for (index in 1 until length) {

            val cur = dictionary[get(index)] ?: throw IllegalStateException()

            when {
                cur > prev ->
                    sum -= prev
                else ->
                    sum += prev
            }

            prev = cur
        }

        sum += prev
        return sum
    }
```

# 参考

- [题解精选](https://leetcode-cn.com/problems/roman-to-integer/solution/yong-shi-9993nei-cun-9873jian-dan-jie-fa-by-donesp/)

