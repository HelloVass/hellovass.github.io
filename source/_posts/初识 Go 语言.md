---
title: 初识 Go 语言
date: 2017-04-04 21:46:14
tags:
	- Go
	- 更好的 C 语言
---

## 前言

了解 Go 语言的特性，尽量轻松地掌握这门简洁、有趣却又强大的新语言。

<!-- more -->

## feature

### 函数定义

举栗，一个加法函数：

```go

package main

import "errors"

func Add(a int, b int) (result int, error error) {

	if a < 0 || b < 0 {
		error = errors.New("参数不能为负数")
		return
	}

	return a + b, nil // 支持多重返回

}

```

如果**参数列表**中若干个响铃的参数类型相同，比如上述栗子中的 a,b，则可以省略前面变量的**类型声明**，举栗：

```go

func Add(a, b int) (result int, error error) {
	//	...
}
```

如果返回值列表中多个返回值的类型相同，也可以用相同方式合并。
如果函数只有一个返回值，也可以这么写：

```go
func Add(a, b int) int {
	//	...
}
```

### 函数调用

> Note: 小写字母开头的函数只在本包内可见，大写字母开头的函数才能被其他包使用。
> **这个规则也适用于类型和变量**。

### 不定参数

#### 不定参数类型
不定参数是指函数传入的参数个数为不定数量。为了做到这点，首相需要将函数定义为接受不定参数类型：

```go

func myFunc(args ...int) {

	for _, arg := range args {

		fmt.Println(arg)

	}
}
```

调用方式，like：myFunc(2, 3 , 4)

像这种 ...type 格式的类型只能作为函数的参数类型存在，并且必须是最后一个参数。（这点和 Java 5 的特性蛮像的哎）

内部实现上来说，类型 ...type 本质上就是一个数组切片，也就是 []type。想象如果没有这个**语法糖**，我们应该这么写：

```go

func myFunc(args []int) {

	for _, arg := range args {
		fmt.Println(arg)
	}

}

```

其实看起来也还行，但是调用起来就比较麻烦了，形如：

```go
myFunc([]int{1, 3, 5, 7, 9})
```

我们不得不加上 []int{1,3,5,7,9} 来构造一个数组切片实例（烦

## 参考书籍

《Go语言编程》



