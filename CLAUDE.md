# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

HelloVass 的个人博客，基于 **Hexo 8 + NexT 8.27 (Mist)** 主题，托管在 GitHub Pages（hellovass.github.io）。内容以中文为主，涵盖 Android 开发、算法、面试、生活随笔等。

## Commands

- `npx hexo server` — 本地预览（http://localhost:4000），支持热更新
- `npx hexo generate` — 生成静态文件到 `public/`，用于验证构建
- `npx hexo clean` — 清理缓存和已生成文件
- `npx hexo new post "title"` — 创建新文章
- `npx hexo new draft "title"` — 创建草稿

## Architecture

```
source/_posts/          # 博客文章（Markdown）
source/_data/           # 自定义样式覆盖
  variables.styl        # 配色、字体变量（Kotlin 紫 #7F52FF）
  styles.styl           # 自定义 CSS
  head.njk              # 自定义 head 注入（favicon）
  post-body-end.njk     # 文章末尾注入（打赏组件）
source/donate/          # 自定义打赏页面（iframe 嵌入，3D 翻转动画）
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

- 主题色：Kotlin 紫 #7F52FF
- 代码块：复制按钮（Mac 风格）、折叠、语言标签
- 阅读进度条、返回顶部、mediumzoom 图片灯箱
- Utterances 评论系统（基于 GitHub Issues，repo: HelloVass/hellovass.github.io）
- 本地搜索
- Creative Commons BY-NC-SA 版权声明
- 自定义打赏组件（支付宝/微信，3D 翻转动画）

## Deployment

推送到 `main` 分支自动触发 GitHub Actions，构建并部署到 GitHub Pages。

- 站点地址：https://hellovass.github.io
- 仓库：HelloVass/hellovass.github.io
- 部署方式：`actions/deploy-pages`（官方方案，无需额外 token）
- Node.js 22 (LTS)

## Writing Rules

写博客时必须遵守以下规则。详细的写作风格见 blog-writer Skill。

### 绝对不编造

**不要编造用户没有提供的经历、场景、细节。** 用户没说的事情，不要自己脑补。不知道那天天气如何，就不要写"晴"。不知道用户在产房里还是外面，就不要写"站在产房外面"。

如果文章需要场景细节而用户没提供，**问用户**，不要编。

### 立场一致性

HelloVass 已有的博客观点必须保持一致。涉及他写过的主题，先确认之前的立场。如果不确定，问。不要默认写一个"安全的"中间立场。

### 语言

- **中文为主**，技术术语保留英文
- 中英混用是自然的
- 非技术博客不要强行往技术人身份上靠
- 自称偶尔用"轲爷"，带自嘲感
- 老婆叫"大猪"，猫叫"redux"

### 禁忌清单

- 不用"首先……其次……最后……"这种教科书结构
- 不用"众所周知"、"不言而喻"、"让我们拭目以待"这类套话
- 不写"本文将介绍..."这种开头
- 不写"希望对大家有帮助"这种结尾
- 不自称"笔者"，用"我"
- 不写冷冰冰的正式文字
- 不过度使用 emoji

## Notes

- 文章文件名使用中文，Hexo 的 permalink 基于 front-matter 的 title 字段生成 URL
- 主题定制通过 `_config.next.yml` 和 `source/_data/` 实现，不修改 node_modules 中的主题源码
- 仓库为 public（Utterances 评论系统要求）
