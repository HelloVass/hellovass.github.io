## Why

博客缺少 SEO、订阅、搜索等基础功能，不利于内容被发现和读者留存。参考 johnsonlee/blog 的成熟配置，一次性补齐这些能力。

## What Changes

- 添加 RSS 订阅（atom.xml）
- 添加 Sitemap（sitemap.xml）利于搜索引擎收录
- 添加文章字数统计和预计阅读时间
- 配置 SEO keywords 和 description
- 配置 category_map 将中文分类映射为英文 URL
- 添加 favicon 网站图标
- 添加 robots.txt 搜索引擎爬虫规则
- 添加本地搜索功能（替代 Algolia，无需外部服务）
- 添加 PlantUML 图表支持
- 添加 MathJax 数学公式支持

## Capabilities

### New Capabilities
- `rss-sitemap`: RSS 订阅和 Sitemap 生成
- `word-counter`: 文章字数统计和阅读时间
- `seo-config`: SEO 关键词、描述、category_map、favicon、robots.txt
- `local-search`: 本地全文搜索功能
- `plantuml-mathjax`: PlantUML 图表和 MathJax 公式渲染支持

### Modified Capabilities

## Impact

- `package.json`：新增 6 个插件依赖
- `_config.yml`：添加 feed、sitemap、keywords、category_map 配置
- `_config.next.yml`：开启本地搜索、字数统计
- `source/`：添加 favicon.ico、robots.txt
