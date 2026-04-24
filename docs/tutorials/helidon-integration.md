---
sidebar_position: 29
---

# Helidon 集成

[Helidon](https://helidon.io/) 提供了一个 LangChain4j 集成模块，
它可以在充分利用 Helidon 编程模型与风格的同时，简化 AI 驱动应用的构建。

关于 LangChain4j 集成功能的详细说明与使用方式，
可在[这里](https://helidon.io/docs/latest/se/integrations/langchain4j/langchain4j)查看。

## 支持的版本

Helidon 的 LangChain4j 集成要求 Java 21 和 Helidon 4.2。

## 示例

我们准备了若干示例应用供你探索。
这些示例展示了在 Helidon 应用中使用 LangChain4j 的各个方面。

### 咖啡馆助手 {#coffee-shop-assistant}
Coffee Shop Assistant 是一个演示应用，
展示了如何为咖啡店构建一个 AI 驱动助手。
该助手可以回答菜单问题、提供推荐并创建订单。
它使用了一个从 JSON 文件初始化的 embedding store。

主要特性：
- 与 OpenAI chat models 集成
- 使用 embedding models、embedding store、ingestor 和 content retriever
- 使用 Helidon Inject 进行依赖注入
- 从 JSON 文件初始化 embedding store
- 支持 callback functions，以增强交互体验

查看示例：
- [Helidon SE 版 Coffee Shop Assistant](https://github.com/helidon-io/helidon-examples/tree/helidon-4.x/examples/integrations/langchain4j/coffee-shop-assistant-se)
- [Helidon MP 版 Coffee Shop Assistant](https://github.com/helidon-io/helidon-examples/tree/helidon-4.x/examples/integrations/langchain4j/coffee-shop-assistant-mp)

### 实战练习 {#hands-on-lab}

我们还提供了一份 Hands-on Lab，
其中包含逐步搭建 Coffee Shop Assistant 的指导：

[HOL: 使用 Helidon 和 LangChain4j 构建 AI 驱动应用](https://github.com/helidon-io/helidon-labs/tree/main/hols/langchain4j)
