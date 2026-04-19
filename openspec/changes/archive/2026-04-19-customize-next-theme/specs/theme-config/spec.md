## ADDED Requirements

### Requirement: 代码块增强功能
博客 SHALL 开启代码块的复制按钮、代码折叠和语言标签显示功能。

#### Scenario: 用户复制代码
- **WHEN** 用户在代码块上点击复制按钮
- **THEN** 代码内容 SHALL 被复制到剪贴板，按钮样式为 Mac 风格

#### Scenario: 长代码块自动折叠
- **WHEN** 代码块高度超过 500px
- **THEN** 代码块 SHALL 自动折叠并显示展开按钮

### Requirement: 阅读体验增强
博客 SHALL 开启阅读进度条、返回顶部按钮和图片灯箱功能。

#### Scenario: 显示阅读进度条
- **WHEN** 用户滚动文章页面
- **THEN** 页面顶部 SHALL 显示阅读进度条，指示当前阅读位置

#### Scenario: 图片点击放大
- **WHEN** 用户点击文章中的图片
- **THEN** 图片 SHALL 以 mediumzoom 灯箱效果放大显示

### Requirement: 侧边栏配置
博客 SHALL 在侧边栏显示圆形头像、GitHub 社交链接和文章目录。

#### Scenario: 显示圆形头像
- **WHEN** 用户访问博客
- **THEN** 侧边栏 SHALL 显示圆形裁剪的个人头像

#### Scenario: 文章页显示目录
- **WHEN** 用户阅读文章
- **THEN** 侧边栏 SHALL 自动展开目录（Table of Contents），显示自动编号
