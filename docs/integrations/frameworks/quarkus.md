---
sidebar_position: 3
---

# Quarkus 框架 {#quarkus}

Quarkus [LangChain4j 扩展](https://quarkus.io/extensions/io.quarkiverse.langchain4j/quarkus-langchain4j-core/)与 Quarkus 编程模型和现有 Quarkus 运行时组件无缝集成。

与在 Quarkus 中使用原始 LangChain4j 库相比，该扩展提供以下优势：

- 与 Quarkus 编程模型集成
    - 用于声明式 AI 服务的新 `@RegisterAiService` 注解
    - LangChain4j 模型的可注入 CDI bean
- 能够编译为 GraalVM 原生二进制文件
- 用于配置模型的标准配置属性
- 内置可观测性（指标、追踪和审计）
- 构建时连接。在构建时执行更多工作可减少 LangChain4j 库的占用空间，并启用构建时可用性提示。

## 开发界面 {#dev-ui}

在 Dev 模式下，quarkus-langchain4j 项目在 Dev UI 中提供多个页面，以便于 LangChain4j 开发：

- AI Services 页面：提供应用程序中检测到的所有 AI 服务的表格，以及它们声明使用的工具列表。
- 嵌入存储访问：允许向嵌入存储添加嵌入并进行搜索。
- 工具页面：提供应用程序中检测到的工具列表。
- 聊天页面：允许您与聊天模型手动进行对话。此页面仅在应用程序包含聊天模型时可用。
- 图像页面：允许您测试图像模型的输出并调整其参数（对于支持的模型）。
- 审核页面：允许您测试审核模型的输出——您提交提示词并收到每个适宜性类别的分数列表（对于支持的模型）。

有关扩展功能的更详细说明，请参阅 langchain4j 扩展的 [Quarkus 文档](https://docs.quarkiverse.io/quarkus-langchain4j/dev/)。
