---
title: Android持续集成实践·后篇
date: 2020-01-23 15:39:52
tags:
    - 持续集成
    - pipeline
    - Jenkins
---

## 前言

距离上篇《Android持续集成·前篇》已经有些时日，这次将会填上上篇留下的大坑，pipline 构建。
<!-- more -->

## Pipeline 

### pipline 是什么
> 从某种抽象层次上讲，部署流水线（Development pipeline）是指从软件版本控制库到用户手中这一过程的自动化表现形式。

按照[《持续交付》](https://item.jd.com/10843669.html)中的定义，Jenkins 本来就支持 pipeline（部署流水线），只是一开始不叫 pipeline，而叫 job（任务）。

Jenkins 1.x 只能通过手动操作（即各种UI选项设置）来描述 pipline。而 Jenkins 2.x 终于支持了 pipline as code 的特性，即我们可以通过代码来描述 pipline。

### 之前的问题
谈优点前，先来回顾下上篇中的构建方式，即自由风格软件的项目。这种构建方式是网上最常见的，对于单个项目的简单构建（比如大部分 Android开发就拿 Jenkins 做个打包）已经足够了。但是，问题来了，针对多个类似但又有区别的项目，就捉襟见肘了，需要添加大量的 job 来支持，这就会导致，一个小的改动会修改N个job（蛋疼）。

### 优点
这里就来谈谈为什么要 pipline as code 而不是 UI：
- 更好的版本化：将 CI 作为一个项目提交到 SCM 中进行版本控制
- 更好的协作：CI 项目的修改对所有人都是可见的。而且，还可以对 CI 项目的代码做 code review
- 众所周知：code 可以复用，而手动操作没法复用，没人想每个新项目都去重新设置一遍

### 拥抱 pipline
所以后篇将放弃前篇的自由风格软件构建的方式，坚持 pipline 真香原则。

## 实践

后篇将基于**Jenkins 2.x**进行实践