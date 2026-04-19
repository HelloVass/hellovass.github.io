## ADDED Requirements

### Requirement: RSS 订阅源生成
博客 SHALL 在构建时生成 atom.xml 文件，包含最近 100 篇文章的标题、摘要和全文内容。

#### Scenario: 生成 RSS 文件
- **WHEN** 执行 hexo generate
- **THEN** public 目录下 SHALL 生成 atom.xml 文件，包含文章列表

### Requirement: Sitemap 生成
博客 SHALL 在构建时生成 sitemap.xml 文件，列出所有页面的 URL。

#### Scenario: 生成 Sitemap 文件
- **WHEN** 执行 hexo generate
- **THEN** public 目录下 SHALL 生成 sitemap.xml 文件，包含所有文章和页面的 URL
