---
title: add-two-numbers#2
date: 2020-03-12 00:28:06
tags:
    - leetcode
    - 算法与数据结构
---

# 问题

[两数相加#2](https://leetcode-cn.com/problems/add-two-numbers/)

<!-- more -->

## addTwoNumbers

定义方法`#addTwoNumbers`:

```kotlin
    fun addTwoNumbers(l1: ListNode?, l2: ListNode?): ListNode? {
        // 具体实现
    }
```

## 单元测试

```kotlin
        val num1 = listOf(2, 4, 3).toLinkedList()
        val num2 = listOf(5, 6, 4).toLinkedList()
        val sum = addTwoNumbers(num1, num2)
        assert("${sum.toList()}" == "[7, 0, 8]")
```

# 解法

- 将 2个链表看成长度相同的链表进行遍历，如果一个链表较短，则在前面补 0，比如 `987 + 23 = 987 + 023 = 1010`
- 每一位的计算考虑上一位的进位，当前位计算结束后更新进位
- 两个链表遍历完成后，进位为 1，则在新链表最前放添加节点 1

> 小技巧：对于链表问题，返回结果为头结点时，通常需要先初始化一个预指针 pre，该指针的下一个节点指向真正的头节点 head。
> 使用预指针的目的在于，链表初始化时无可用节点，而链表构造过程需要移动指针，进而导致头指针丢失，无法返回结果。

# 代码

```kotlin
    /**
     * 两数相加
     */
    fun addTwoNumbers(l1: ListNode?, l2: ListNode?): ListNode? {

        // 初始化一个预指针
        val pre: ListNode? = ListNode(0)
        var cur: ListNode? = pre
        var carry = 0 // 进位

        var num1 = l1
        var num2 = l2

        while (num1 != null || num2 != null) {

            val x = when (num1 == null) {
                true -> 0
                else -> num1.`val`
            }
            val y = when (num2 == null) {
                true -> 0
                else -> num2.`val`
            }
            var sum = x + y + carry

            // 计算进位
            carry = sum / 10
            // 计算和
            sum %= 10

            // 将结果串联
            cur?.next = ListNode(sum)

            // 移动 cur 指针
            cur = cur?.next

            num1?.let {
                num1 = it.next
            }

            num2?.let {
                num2 = it.next
            }
        }

        if (carry == 1) {
            cur?.next = ListNode(carry)
        }

        // 返回 pre 的下一个节点
        return pre?.next
    }
```

# 参考

- [精选题解](https://leetcode-cn.com/problems/add-two-numbers/solution/hua-jie-suan-fa-2-liang-shu-xiang-jia-by-guanpengc/)