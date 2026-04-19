# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

HelloVass 的个人技术博客，基于 **Hexo 8 + NexT 8.27 (Mist)** 主题，托管在 GitHub Pages（hellovass.github.io）。内容以中文为主，涵盖 Android 开发、算法、面试、生活随笔等。

## Commands

- `npx hexo server` — 本地预览（http://localhost:4000）
- `npx hexo generate` / `npm run build` — 生成静态文件到 `public/`
- `npx hexo clean` — 清理缓存和已生成文件
- `npx hexo new post "title"` — 创建新文章
- `npx hexo new draft "title"` — 创建草稿

## Architecture

```
source/_posts/          # 博客文章（57 篇，Markdown）
source/_data/           # 自定义样式覆盖
  variables.styl        # 配色、字体变量
  styles.styl           # 自定义 CSS
  head.njk              # 自定义 head 注入（favicon）
source/about/           # 关于页面
source/tags/            # 标签页
source/categories/      # 分类页
source/robots.txt       # 爬虫规则
_config.yml             # Hexo 主配置（站点信息、插件、SEO）
_config.next.yml        # NexT 主题配置（样式、功能开关）
.github/workflows/      # GitHub Actions 自动部署到 Pages
scaffolds/              # hexo new 模板
```

## Post Frontmatter Format

```yaml
---
title: 文章标题
date: YYYY-MM-DD HH:MM:SS
categories: 分类名
tags:
    - 标签名
---
```

**分类**（5 个，每篇文章只属于一个分类）：
- 技术 — Android、Java、Kotlin、前端、CI/CD 等技术文章
- 算法 — leetcode 题解、数据结构
- 面试 — Interview 系列
- 生活 — 年终总结、随笔、旅行、ACG
- 折腾 — DIY、游戏

**标签**（9 个）：Android、算法、CI/CD、Kotlin、Java、前端、面试、随笔、DIY

**分类 URL 映射**（在 `_config.yml` 的 `category_map` 中）：
技术→tech、算法→algorithm、面试→interview、生活→life、折腾→tinkering

## Plugins

- `hexo-generator-feed` — RSS 订阅（atom.xml）
- `hexo-generator-sitemap` — Sitemap（sitemap.xml）
- `hexo-word-counter` — 文章字数统计和阅读时间
- `hexo-generator-searchdb` — 本地全文搜索
- `hexo-filter-mathjax` — LaTeX 数学公式
- `hexo-filter-plantuml` — PlantUML 图表

## Theme Features (NexT Mist)

- 自定义配色和中文友好字体（source/_data/variables.styl）
- 代码块：复制按钮（Mac 风格）、折叠、语言标签
- 阅读进度条、返回顶部、mediumzoom 图片灯箱
- Utterances 评论系统（基于 GitHub Issues，repo: HelloVass/hellovass.github.io）
- 本地搜索

## Deployment

推送到 `main` 分支自动触发 GitHub Actions，构建并部署到 GitHub Pages。

- 站点地址：https://hellovass.github.io
- 部署方式：`actions/deploy-pages`（官方方案，无需额外 token）
- Node.js 22 (LTS)

## Notes

- 文章文件名使用中文，Hexo 的 permalink 基于 front-matter 的 title 字段生成 URL
- 主题定制通过 `_config.next.yml` 和 `source/_data/` 实现，不修改 node_modules 中的主题源码
- 仓库为 public（Utterances 评论系统要求）
