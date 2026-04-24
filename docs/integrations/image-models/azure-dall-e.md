---
sidebar_position: 1
---

# Azure OpenAI Dall·E

:::note

这是 `Azure OpenAI` 集成的文档，使用微软的 Azure SDK，最适合与微软 Java 技术栈结合使用，包括高级 Azure 身份验证机制。

LangChain4j 提供 3 种不同的 OpenAI 图像生成集成，这是第 3 种：

- [OpenAI](/integrations/language-models/open-ai) 使用 OpenAI REST API 的自定义 Java 实现，最适合 Quarkus（使用 Quarkus REST 客户端）和 Spring（使用 Spring 的 RestClient）。
- [OpenAI Official SDK](/integrations/language-models/open-ai-official) 使用官方 OpenAI Java SDK。
- [Azure OpenAI](/integrations/language-models/azure-open-ai) 使用微软的 Azure SDK，最适合与微软 Java 技术栈结合使用，包括高级 Azure 身份验证机制。

:::

Azure OpenAI 提供了一些图像模型（`dall-e-3` 等），可用于各种图像处理任务。

## Maven 依赖

### 纯 Java {#plain-java}

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-azure-open-ai</artifactId>
    <version>1.13.0</version>
</dependency>
```
