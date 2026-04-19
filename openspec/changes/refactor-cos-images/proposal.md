## Why

博客文章中有 72 个 COS 图片链接分布在 28 篇文章里。图片名混乱：有中文编码（`%E5%92%8C%E6%95%99%E7%BB%83`）、随机 hash（`2b3e0556a256648d...`）、微信导出名（`WechatIMG49.jpeg`）等。Markdown 源码可读性差，图片也没有按文章组织。

需要统一整理：按文章归类到 `blog/{文章标题}/` 目录，用有意义的中文名命名，文章中的链接替换为可读的中文 URL。

## What Changes

- 下载 COS 上的 72 张图片
- 按 `blog/{文章标题}/{图片描述}.{ext}` 规则重命名并上传到 COS 新路径
- 替换 28 篇文章中的图片链接为新的中文 URL（不做 URL 编码）
- 旧图片保留（避免外部引用失效），后续可清理

## Capabilities

### New Capabilities
- `image-migration`: 将 COS 图片按文章归类重命名，更新文章中的链接

### Modified Capabilities

## Impact

- `source/_posts/` 中 28 篇文章的图片链接
- COS 存储桶 `hellovass-blog-1257365569` 新增 `blog/` 目录结构
