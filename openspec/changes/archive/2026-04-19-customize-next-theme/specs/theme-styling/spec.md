## ADDED Requirements

### Requirement: 自定义配色方案
博客 SHALL 使用统一的自定义配色方案，覆盖 NexT 默认颜色变量，包括主色调、链接色、选中色和代码块背景色。

#### Scenario: 页面使用自定义主色调
- **WHEN** 用户访问博客任意页面
- **THEN** 页面的主色调、链接色等 SHALL 使用 `variables.styl` 中定义的自定义颜色值

### Requirement: 中文友好字体方案
博客 SHALL 配置中文优先的字体栈，正文使用无衬线中文系统字体，代码块使用等宽字体。

#### Scenario: 中文内容使用系统字体渲染
- **WHEN** 页面包含中文内容
- **THEN** 正文 SHALL 优先使用 PingFang SC / Microsoft YaHei 等系统字体渲染

#### Scenario: 代码块使用等宽字体
- **WHEN** 页面包含代码块
- **THEN** 代码 SHALL 使用 Fira Code 或 Source Code Pro 等等宽字体渲染

### Requirement: 自定义 CSS 样式覆盖
博客 SHALL 通过 `source/_data/styles.styl` 文件提供额外的样式覆盖，包括圆角、阴影等细节调整。

#### Scenario: 自定义样式文件被加载
- **WHEN** 博客构建时
- **THEN** `source/_data/styles.styl` 中的样式 SHALL 被加载并覆盖默认主题样式
