---
sidebar_position: 9
---

# Helidon 框架 {#helidon}

[Helidon](https://helidon.io/) 提供了一个 LangChain4j 集成模块，简化了在利用 Helidon 编程模型和风格构建 AI 驱动应用程序的过程。

与手动添加 LangChain4j 库相比，Helidon 的 LangChain4j 集成提供以下优势：

- 与 Helidon Inject 集成
    - 根据配置自动在 Helidon 服务注册表中创建和注册选定的 LangChain4j 组件。
- 约定优于配置
    - 通过提供合理的默认值简化配置，减少常见用例的手动设置。
- 声明式 AI 服务
    - 在声明式编程模型中支持 LangChain4j 的 AI 服务，允许使用简洁易管理的代码结构。
- 与 CDI 集成
    - 使用 Helidon Inject 到 CDI 的桥接，LangChain4j 组件可在 CDI 环境（如 Helidon MP MicroProfile 应用程序）中使用。

这些功能显著降低了将 LangChain4j 集成到 Helidon 应用程序中的复杂性。

有关 LangChain4j 集成功能的详细说明和使用方法，请参阅 [Helidon 文档](https://helidon.io/docs/latest/se/integrations/langchain4j/langchain4j)。
