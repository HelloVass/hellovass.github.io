## ADDED Requirements

### Requirement: PlantUML 图表渲染
博客 SHALL 支持在 Markdown 中使用 PlantUML 语法绘制 UML 图表。

#### Scenario: PlantUML 代码块被渲染为图片
- **WHEN** 文章中包含 plantuml 代码块
- **THEN** 构建后 SHALL 渲染为对应的 UML 图片

### Requirement: MathJax 数学公式
博客 SHALL 支持在文章中使用 LaTeX 语法渲染数学公式。

#### Scenario: 启用 MathJax 的文章渲染公式
- **WHEN** 文章 front-matter 中设置 mathjax: true
- **THEN** 文章中的 LaTeX 语法 SHALL 被渲染为数学公式
