## Why

博客当前使用 NexT 主题的默认样式（Mist scheme），视觉上缺乏个性化，无法体现个人品牌。需要自定义主题样式，包括配色、字体、布局细节和交互体验，使博客在视觉上更具辨识度和阅读舒适性。

## What Changes

- 自定义配色方案（主色调、链接色、代码块背景等）
- 配置中文友好的字体方案
- 开启并配置侧边栏头像、社交链接、目录等组件
- 开启代码块增强功能（复制按钮、代码折叠、语言标签）
- 配置阅读体验增强（阅读进度条、返回顶部、图片灯箱）
- 添加自定义 CSS 样式覆盖默认主题样式

## Capabilities

### New Capabilities
- `theme-styling`: 自定义 CSS 样式，包括配色方案、字体、间距等视觉定制
- `theme-config`: NexT 主题功能配置，包括侧边栏、代码块、阅读体验等功能开关与参数

### Modified Capabilities

## Impact

- `_config.next.yml`：主题功能配置
- `source/_data/variables.styl`：自定义 Stylus 变量（配色、字体）
- `source/_data/styles.styl`：自定义 CSS 样式覆盖
- `source/images/avatar.png`：个人头像图片
