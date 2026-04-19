## ADDED Requirements

### Requirement: 图片按文章归类存储
所有博客图片 SHALL 存储在 COS 的 `blog/{文章标题}/` 目录下，文件名使用有意义的中文描述。

#### Scenario: 图片路径符合规则
- **WHEN** 查看任意文章的图片链接
- **THEN** 链接格式 SHALL 为 `https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/blog/{文章标题}/{图片描述}.{ext}`

### Requirement: Markdown 中使用可读的中文 URL
文章中的图片链接 SHALL 使用未编码的中文 URL，保证 Markdown 源码可读。

#### Scenario: 源码中无 URL 编码
- **WHEN** 查看文章 Markdown 源码中的图片链接
- **THEN** 链接中 SHALL 不包含 `%E5%` 等 URL 编码字符
