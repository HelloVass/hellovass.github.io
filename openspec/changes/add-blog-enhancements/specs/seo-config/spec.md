## ADDED Requirements

### Requirement: SEO 关键词和描述
博客 SHALL 在 _config.yml 中配置 keywords 和 description，用于搜索引擎展示。

#### Scenario: 页面包含 meta 标签
- **WHEN** 搜索引擎爬取博客页面
- **THEN** HTML head 中 SHALL 包含 keywords 和 description 的 meta 标签

### Requirement: 分类 URL 英文化
博客 SHALL 通过 category_map 将中文分类名映射为英文 URL 路径。

#### Scenario: 中文分类使用英文 URL
- **WHEN** 用户访问分类页面
- **THEN** URL 路径 SHALL 使用英文而非中文编码

### Requirement: Favicon 网站图标
博客 SHALL 显示自定义的网站图标。

#### Scenario: 浏览器标签页显示图标
- **WHEN** 用户在浏览器中打开博客
- **THEN** 标签页 SHALL 显示自定义图标

### Requirement: robots.txt 爬虫规则
博客 SHALL 提供 robots.txt 文件，指引搜索引擎爬虫。

#### Scenario: 爬虫可访问 robots.txt
- **WHEN** 搜索引擎爬虫访问 /robots.txt
- **THEN** SHALL 返回包含 Sitemap 地址的爬虫规则文件
