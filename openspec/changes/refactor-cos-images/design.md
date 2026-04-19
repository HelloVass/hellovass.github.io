## Context

72 个图片分布在 28 篇文章中，存储在 COS 桶 `hellovass-blog-1257365569`（ap-shanghai）。需要按文章归类、重命名、更新链接。

## Goals / Non-Goals

**Goals:**
- 所有图片按 `blog/{文章标题}/{图片描述}.{ext}` 组织
- 文章中使用中文 URL，Markdown 源码可读
- 通过 tencent-cloud-cos Skill 上传

**Non-Goals:**
- 不删除旧路径的图片（避免外部引用失效）
- 不修改文章内容，只替换图片链接

## Decisions

1. **路径规则**：`blog/{文章标题}/{图片描述}.{ext}`
   - 文章标题直接用中文
   - 图片描述根据内容起有意义的中文名
   - 保持原始文件扩展名

2. **执行方式**：按文章批量处理
   - 每篇文章：下载图片 → 重命名 → 上传新路径 → 替换文章链接
   - 逐篇验证，避免批量出错

3. **链接格式**：`https://hellovass-blog-1257365569.cos.ap-shanghai.myqcloud.com/blog/{文章标题}/{图片描述}.{ext}`
   - 中文不做 URL 编码，直接写在 Markdown 里

## Risks / Trade-offs

- [图片下载失败] → 逐个检查，失败的跳过并记录
- [新路径冲突] → 图片名加序号区分
