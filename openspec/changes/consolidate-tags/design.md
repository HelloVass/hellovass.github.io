## Context

57 篇博客文章，68 个 tags。需要批量修改所有文章的 front-matter tags。

## Goals / Non-Goals

**Goals:**
- 将 tags 精简到 9 个：Android、算法、CI/CD、Kotlin、Java、前端、面试、随笔、DIY

**Non-Goals:**
- 不修改文章内容，只修改 front-matter 中的 tags

## Decisions

Tag 合并映射：
- leetcode, 算法与数据结构, 栈, 回文数, 罗马数, 字符串 → 算法
- Android, Activity, 组件化, Glide, 异步, 签名机制, 多渠道 → Android
- 持续集成, pipeline, Jenkins, 共享函数库 → CI/CD
- redux, rxjava → Kotlin 或 前端（按内容判断）
- 年终总结, 感想, 吐槽 → 随笔
- 面试, StackTrace, 监测工具, 构建 → 面试
- 办公, 游戏, itx → DIY
- Java 基础 → Java
- 删除：大猪蹄子、所以然

## Risks / Trade-offs

- 无
