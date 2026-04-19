## Context

博客使用 Hexo 8 + NexT 8.27.0 主题（Mist scheme）。当前为默认样式，需要自定义视觉和交互体验。NexT 支持通过 `_config.next.yml` 配置功能开关，通过 `source/_data/variables.styl` 和 `source/_data/styles.styl` 覆盖样式。

## Goals / Non-Goals

**Goals:**
- 建立统一的配色方案，提升视觉辨识度
- 配置中文友好的字体方案
- 开启代码块增强、阅读进度条、图片灯箱等实用功能
- 通过自定义 Stylus 文件覆盖默认样式

**Non-Goals:**
- 不修改 NexT 主题源码（node_modules 中的文件）
- 不添加第三方评论系统或统计服务（后续单独处理）
- 不更换主题 scheme（保持 Mist）

## Decisions

1. **样式覆盖方式：使用 NexT 的 custom_file_path 机制**
   - 在 `_config.next.yml` 中启用 `custom_file_path` 的 `variable` 和 `style` 字段
   - 变量覆盖写入 `source/_data/variables.styl`，自定义样式写入 `source/_data/styles.styl`
   - 理由：这是 NexT 官方推荐的定制方式，升级主题时不会丢失自定义内容

2. **字体方案：使用系统字体栈 + Google Fonts 回退**
   - 中文使用系统字体（PingFang SC / Microsoft YaHei）
   - 英文/代码使用 Google Fonts 加载
   - 理由：系统字体加载快，中文 Web 字体体积过大

3. **图片灯箱：使用 mediumzoom 而非 fancybox**
   - 理由：mediumzoom 更轻量，交互风格更现代

## Risks / Trade-offs

- [Google Fonts 加载慢] → 使用 preconnect 优化，字体设为可选加载
- [自定义样式与主题升级冲突] → 仅覆盖变量和增量样式，不覆盖核心结构
