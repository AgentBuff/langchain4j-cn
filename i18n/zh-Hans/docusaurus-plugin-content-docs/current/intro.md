---
sidebar_position: 1
title: 简介
---

# 简介

欢迎！

LangChain4j 的目标，是让在 Java 应用中集成 LLM 变得更简单。

具体来说：
1. **统一 API：**
   LLM 提供商（例如 OpenAI 或 Google Vertex AI）以及 embedding（向量）存储（例如 Pinecone 或 Milvus）都使用各自专有的 API。LangChain4j 提供统一 API，让你无需分别学习和实现每一家厂商的专用接口。
   如果你想尝试不同的 LLM 或 embedding 存储，也可以轻松切换，而不必重写代码。
   LangChain4j 目前支持 [20+ 主流 LLM 提供商](/integrations/language-models/)
   和 [30+ embedding 存储](/integrations/embedding-stores/)。
2. **完整工具箱：**
   从 2023 年初开始，社区就在持续构建大量由 LLM 驱动的应用，并逐渐提炼出常见的抽象、模式和技术。LangChain4j 将这些经验打磨成一个开箱即用的工具包。
   我们的工具箱覆盖从底层的提示词模板、聊天记忆管理、函数调用，
   到高层的 Agents 与 RAG 等模式。
   对于每一种抽象，我们都提供接口以及多种基于常见技术的现成实现。
   无论你是在构建聊天机器人，还是在开发一条完整的数据摄取到检索链路的 RAG，
   LangChain4j 都能提供丰富的选择。
3. **大量示例：**
   这些[示例](https://github.com/langchain4j/langchain4j-examples)展示了如何开始构建各种由 LLM 驱动的应用，
   既能提供灵感，也能帮助你快速起步。

LangChain4j 于 2023 年初在 ChatGPT 热潮中启动开发。
我们注意到，在众多 Python 和 JavaScript 的 LLM 库与框架之外，Java 生态中缺少相应的高质量方案，
于是我们决定补上这一块。

:::note 不是 LangChain（Python）的移植版
尽管名字相似，**LangChain4j 并不是 [LangChain](https://github.com/langchain-ai/langchain)（Python）的 Java 移植版，而是为 Java 原生设计的库**。
它是一套**符合 Java 习惯**的库，从一开始就围绕 Java 的开发约定构建：
类型安全、POJO、注解、接口、依赖注入、流式 API，以及对
[Quarkus](/tutorials/quarkus-integration)、[Spring Boot](/tutorials/spring-boot-integration)、
[Helidon](/tutorials/helidon-integration) 和 [Micronaut](/tutorials/micronaut-integration) 的一等集成支持。
它的 API、内部实现和发布节奏都独立于 Python LangChain 项目。
:::

我们持续关注社区的新进展，并尽可能快速地引入新的技术和集成能力，
确保你能够跟上最新实践。
这个库仍在积极演进中。虽然部分特性还在持续完善，
但核心能力已经可用，你现在就可以开始构建由 LLM 驱动的应用。

为了便于集成，LangChain4j 还提供了对
[Quarkus](/tutorials/quarkus-integration)、[Spring Boot](/tutorials/spring-boot-integration)、[Helidon](/tutorials/helidon-integration) 和 [Micronaut](/tutorials/micronaut-integration) 的集成支持。


## LangChain4j 特性
- 集成 [20+ LLM 提供商](/integrations/language-models)
- 集成 [30+ embedding（向量）存储](/integrations/embedding-stores)
- 集成 [20+ embedding 模型](/category/embedding-models)
- 集成 [5+ 聊天记忆存储](/category/chat-memory-stores)
- 集成 [5+ 图像生成模型](/category/image-models)
- 集成 [5+ 打分（重排序）模型](/category/scoring-reranking-models)
- 集成一个内容审核模型（OpenAI）
- 支持文本和图像作为输入（多模态）
- [AI Services](/tutorials/ai-services)（高层 LLM API）
- [Agents 与 Agentic AI](/tutorials/agents)
- [Skills](/tutorials/skills)
- 提示词模板
- 持久化和内存型 [聊天记忆](/tutorials/chat-memory) 算法实现：消息窗口和 token 窗口
- [LLM 响应流式输出](/tutorials/response-streaming)
- 面向常见 Java 类型和自定义 POJO 的输出解析器
- [Tools（函数调用）](/tutorials/tools)
- Dynamic Tools（执行动态生成的 LLM 代码）
- [RAG（检索增强生成）](/tutorials/rag)：
  - Ingestion：
    - 从多种来源导入多种类型的文档（TXT、PDF、DOC、PPT、XLS 等），例如文件系统、URL、GitHub、Azure Blob Storage、Amazon S3 等
    - 使用多种切分算法将文档拆分为更小的片段
    - 对文档和片段进行后处理
    - 使用 embedding 模型为片段生成向量
    - 将向量存入 embedding（向量）存储
  - Retrieval（简单与高级）：
    - 查询变换（扩展、压缩）
    - 查询路由
    - 从向量存储和/或任意自定义来源进行检索
    - 重排序
    - Reciprocal Rank Fusion
    - 定制 RAG 流程中的每一个环节
- 文本分类
- Token 切分与数量估算工具
- [Kotlin 扩展](/tutorials/kotlin)：借助 Kotlin 协程能力异步、非阻塞地处理聊天交互。

## 两个抽象层级
LangChain4j 提供两个抽象层级：
- 低层。这个层级提供最大自由度，并允许你访问所有底层组件，例如
[ChatModel](/tutorials/chat-and-language-models)、`UserMessage`、`AiMessage`、`EmbeddingStore`、`Embedding` 等。
这些都是构建 LLM 应用的“原语”。
你可以完全控制它们的组合方式，但也需要自己编写更多胶水代码。
- 高层。这个层级通过 [AI Services](/tutorials/ai-services) 这样的高级 API 与 LLM 交互，
从而隐藏底层复杂性和样板代码。
你依然可以灵活调整和细化行为，只是方式变成了声明式。

[![](/img/langchain4j-components.png)](/intro)


## LangChain4j 库结构
LangChain4j 采用模块化设计，主要包括：
- `langchain4j-core` 模块：定义核心抽象（例如 `ChatModel` 和 `EmbeddingStore`）及其 API。
- 主模块 `langchain4j`：包含文档加载器、[聊天记忆](/tutorials/chat-memory) 实现，以及 [AI Services](/tutorials/ai-services) 等高级功能。
- 大量 `langchain4j-{integration}` 模块：为各类 LLM 提供商和 embedding 存储提供 LangChain4j 集成。
  你可以单独使用 `langchain4j-{integration}` 模块；如果需要更多功能，再额外引入主 `langchain4j` 依赖即可。


## LangChain4j 相关仓库
- [主仓库](https://github.com/langchain4j/langchain4j)
- [Micronaut integration](https://github.com/micronaut-projects/micronaut-langchain4j)
- [Quarkus extension](https://github.com/quarkiverse/quarkus-langchain4j)
- [Spring Boot integration](https://github.com/langchain4j/langchain4j-spring)
- [Community integrations](https://github.com/langchain4j/langchain4j-community)
- [Examples](https://github.com/langchain4j/langchain4j-examples)
- [Community resources](https://github.com/langchain4j/langchain4j-community-resources)


## 使用场景
你可能会问，为什么我会需要这些？
下面是一些例子：

- 你想实现一个可访问自身数据、并按你期望方式运行的定制化 AI 聊天机器人：
  - 客服机器人，可以：
    - 礼貌地回答客户问题
    - 接收 / 修改 / 取消订单
  - 教学助手，可以：
    - 教授各种学科内容
    - 解释不清楚的部分
    - 评估用户的理解程度 / 知识掌握情况
- 你想处理大量非结构化数据（文件、网页等），并从中提取结构化信息。
  例如：
  - 从客户评价和客服聊天记录中提炼洞察
  - 从竞争对手网站中提取有价值的信息
  - 从求职者简历中提取关键信息
- 你想生成信息，例如：
  - 为不同客户量身定制邮件
  - 为应用或网站生成内容：
    - 博客文章
    - 故事
- 你想变换信息，例如：
  - 总结
  - 校对与改写
  - 翻译

## 社区集成
LangChain4j 在 [community repo](https://github.com/langchain4j/langchain4j-community) 中维护了一部分集成。
它们支持与主仓库集成相同的功能。
两者的区别仅在于，community 仓库中的 artifact 和 package 名称与主仓库不同（即 artifact 和 package 名称里带有 `community` 前缀）。
建立 community 仓库的目的，是将部分集成的维护工作拆分出去，从而让主仓库更易维护。
