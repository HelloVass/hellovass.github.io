## Context

Hexo 8 + NexT 8.27.0 博客，已配置基础主题样式。需要补齐 SEO、订阅、搜索、图表公式等功能。所有功能通过 Hexo 插件 + 配置实现，不修改主题源码。

## Goals / Non-Goals

**Goals:**
- 通过 npm 插件添加 RSS、Sitemap、字数统计、本地搜索、PlantUML、MathJax
- 通过配置文件完成 SEO 优化（keywords、category_map、robots.txt、favicon）
- 所有功能开箱即用，无需外部服务依赖

**Non-Goals:**
- 不使用 Algolia 等需要外部服务的搜索方案
- 不做自定义主题开发

## Decisions

1. **搜索方案：本地搜索（hexo-generator-searchdb）而非 Algolia**
   - 理由：不需要注册外部服务、配置 API Key，NexT 内置支持本地搜索
   
2. **字数统计：hexo-word-counter 而非 hexo-wordcount**
   - 理由：hexo-word-counter 是 NexT 官方推荐的插件，与主题深度集成

3. **favicon：使用简单的 emoji favicon 而非图片文件**
   - 理由：无需设计图标，通过 SVG emoji 快速生成，后续可替换

## Risks / Trade-offs

- [本地搜索性能] → 文章数量在几百篇以内时性能良好，当前 57 篇无压力
- [PlantUML 需要外部渲染服务] → 使用 PlantUML Server 模式，依赖 plantuml.com 在线渲染
