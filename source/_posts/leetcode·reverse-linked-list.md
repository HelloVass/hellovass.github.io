---
title: reverse-linked-list#206
date: 2020-03-10 23:00:46
tags:
    - leetcode
    - 算法与数据结构
---

# 问题

[反转单链表#206](https://leetcode-cn.com/problems/reverse-linked-list/)

<!-- more -->

# 工程化

`leetcode`提交运行等待结果是一件很漫长的事情，而我们从编写代码到`debug`成功期间可能会失败 N次，所以本地有一个方便我们运行测试的环境还是蛮重要的。

这里我选择建立了一个[工程](https://github.com/HelloVass/leetcode_resolver)，将题解代码放在里面。

`leetcode`题解调试过程中自定义的数据结构、方法有很多都是可以复用的，

所以，我们尽可能地复（tou）用（lan）。

## 节点类定义

```kotlin
class ListNode(var `val`: Int) {
    var next: ListNode? = null
}
```

> 吐槽，`val`与`kotlin`的关键字冲突，所以要通过\` \`来转义(😢)。

## ListNode?#reverse

kotlin 基操，给`ListNode?`定义一个扩展方法`reverse`，将具体的实现写在这里。

```kotlin
// ListNode.kt
fun ListNode?.reverse(): ListNode? {
    // 这里给出具体的代码实现
}
```

## 单元测试

```kotlin
// Solution206.kt
class Solution206 {

    @Test
    fun reverse() {
        // 从顺序表生成一个单链表
        val head = listOf(1, 2, 3, 4, 5).toLinkedList()
        // 反转单链表，得到新的头结点
        val newHead = head.reverse()
        // 打印链表
        newHead.toList().forEach {
            print("$it")
        }
    }
}
```

这里用到了两个我自定义的扩展方法：

- List#toLinkedList，将`List`转换为单链表
- ListNode#toList，将单链表转换为`List`

> PS: 目前题解还不多，日后完善了可能会开源回馈社区

# 解法

## 双指针迭代法

要反转链表，核心就是将节点的`next`指针指向前驱
但当前节点无法访问**过去的节点**（前驱）
因此需要保存前驱节点

![反转单链表](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/%E5%8F%8D%E8%BD%AC%E5%8D%95%E9%93%BE%E8%A1%A8.gif)

申请两个指针：

- `prev`，最初指向`NULL`；`cur`，最初指向`HEAD`
- 不断遍历`cur`，每次迭代到`cur`，将`cur.next -> prev`（指针反指），然后`prev`和`cur`前进一格
- `cur`迭代完成（`cur`为`NULL`），`prev`所在的就是最后一个节点

核心代码如下：

```kotlin
while(cur != null){
    // 先保存`cur`的下一个节点，否则"prev"、"cur"前进的时找不到下个节点
    val next = cur.next
    cur.next = prev
    prev = cur
    cur = next
}
```

### reverse 实现

```kotlin
fun ListNode?.reverse(): ListNode? {

    if (this == null || next == null)
        return this

    var prev: ListNode? = null
    var cur: ListNode? = this

    while (cur != null) {
        val next = cur.next
        cur.next = prev
        prev = cur
        cur = next
    }

    return prev
}
```

### 边界情况

`kotlin` 在语言层面支持空安全，结合`IDE`的提醒，时刻提醒我们注意边界！

```kotlin
// 如果当前链表为空或者只有一个节点，直接返回自身
if (this == null || next == null)
    return this
```

## 递归解法

TODO

# 参考

- [题解1](https://leetcode-cn.com/problems/reverse-linked-list/solution/dong-hua-yan-shi-206-fan-zhuan-lian-biao-by-user74/)