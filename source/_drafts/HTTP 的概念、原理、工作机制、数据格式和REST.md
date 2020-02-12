---
title: HTTP 的概念、原理、工作机制、数据格式和REST
date: 2020-02-08 13:50:59
tags:
    - HTTP
    - REST
---

## HTTP 概念

HyperText Transfer Protocol（超文本传输协议）

### HTTP 拆解

#### 请求报文

- 请求行
    - method
        - GET：获取资源，没有 body
        - POST：增加或者修改资源，有 body
        - PUT：修改资源，有 body
        - DELETE：删除资源，没有 body
    - path
    - http 版本
- headers
- body

#### 响应报文

- 状态行
    - http 版本
    - 状态码，对结果做出类型化描述（如获取成功、内容未找到）
        - 1xx：临时信息
        - 2xx：成功
        - 3xx：重定向
        - 4xx：客户端错误
        - 5xx：服务端错误
    - 状态信息
- headers
- body



