---
title: 编码、加密、Hash、序列化和字符集
date: 2020-02-09 12:45:16
tags:
---

### 加密

#### 对称加密

原理：使用密钥和加密算法对数据进行转换，得到的无意义数据即为密文；使用密钥和解密算法对密文进行逆向转换，得到原数据。

经典算法：DES、AES

缺点：

#### 非对称加密

原理：使用公钥对数据进行加密得到密文，使用私钥对数据进行解密得到原数据。

延伸用途：数字签名


Android：
- Android 签名机制
- 启动流程
- Handler 机制
- Java 基础（集合类、线程通信）
- [用程序检测界面是否卡顿](https://blog.csdn.net/lmj623565791/article/details/58626355)
- [等待子线程结束](https://blog.csdn.net/p106786860/article/details/52497215)
- ConcurrentHashMap 如何实现线程安全的？