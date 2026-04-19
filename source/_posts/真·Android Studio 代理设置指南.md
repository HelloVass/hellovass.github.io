---
title: 真·Android Studio 代理设置指南
date: 2017-04-04 13:13:47
categories: 技术
tags:
    - Android
---

## 误区

shadowsocks 在 windows 上是支持 socks 代理和 http 代理，但在 OSX 上只是支持 socks5 代理，属于局部代理。Android Studio 本身支持 socks5 代理，但是 gradle 只支持 http 代理，这也导致了虽然开着 shadowsocks 却无法更新 SDK 或者下载 gradle 依赖。

所以在 OSX 上这么设置，实际上是无效的。
![Android Studio Proxy Settings](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/blog/Android Studio代理指南/代理设置.jpg)

<!-- more -->

## 怎么破

当然是选择把 socks 代理转为 http 代理咯。

1. 最新版的 shadowsocks 已经支持将 socks 转为 http 的 feature 了，所以先去[官网](https://github.com/shadowsocks/ShadowsocksX-NG)下载最新的 shadowsocks 版本。

2. 安装好之后，启动 shadowsocks，查看**偏好设置**，选择 HTTP 一栏
![Shadowsocks 偏好设置](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/blog/Android Studio代理指南/Shadowsocks偏好设置.jpg)

3. 设置 Android Studio Proxy
![Android Studio 代理设置](https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/blog/Android Studio代理指南/Android Studio代理设置.jpg)

## 终于，在 OSX 上也可以愉快地更新 SDK 和下载依赖了。


