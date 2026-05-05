---
sidebar_position: 3
---

# Azure OpenAI

:::note

这是 `Azure OpenAI` 集成的文档，使用微软的 Azure SDK，最适合使用微软 Java 技术栈（包括高级 Azure 认证机制）的场景。

LangChain4j 提供 3 种不同的 OpenAI 嵌入模型集成，这是第 3 种：

- [OpenAI](/integrations/language-models/open-ai) 使用自定义的 OpenAI REST API Java 实现，最适合 Quarkus（使用 Quarkus REST 客户端）和 Spring（使用 Spring 的 RestClient）。
- [OpenAI Official SDK](/integrations/language-models/open-ai-official) 使用官方 OpenAI Java SDK。
- [Azure OpenAI](/integrations/language-models/azure-open-ai) 使用微软的 Azure SDK，最适合使用微软 Java 技术栈（包括高级 Azure 认证机制）的场景。

:::

Azure OpenAI 提供了一些嵌入模型（`text-embedding-3-small`、`text-embedding-ada-002` 等），
可将文本或图片转换为多维向量空间。

## Maven 依赖

### 纯 Java
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-azure-open-ai</artifactId>
    <version>1.13.0</version>
</dependency>
```

### Spring Boot
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-azure-open-ai-spring-boot-starter</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```


## 创建 `AzureOpenAiEmbeddingModel`

### 纯 Java
```java
EmbeddingModel model = AzureOpenAiEmbeddingModel.builder()
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .deploymentName("text-embedding-3-small")
        .endpoint("https://langchain4j.openai.azure.com/")
        ...
        .build();
```

### Spring Boot
在 `application.properties` 中添加：
```properties
langchain4j.azure-open-ai.embedding-model.endpoint=https://langchain4j.openai.azure.com/
langchain4j.azure-open-ai.embedding-model.service-version=...
langchain4j.azure-open-ai.embedding-model.api-key=${AZURE_OPENAI_KEY}
langchain4j.azure-open-ai.embedding-model.deployment-name=text-embedding-3-small
langchain4j.azure-open-ai.embedding-model.timeout=...
langchain4j.azure-open-ai.embedding-model.max-retries=...
langchain4j.azure-open-ai.embedding-model.log-requests-and-responses=...
langchain4j.azure-open-ai.embedding-model.user-agent-suffix=...
langchain4j.azure-open-ai.embedding-model.dimensions=...
langchain4j.azure-open-ai.embedding-model.customHeaders=...
```


## 示例

- [AzureOpenAiEmbeddingModelExamples](https://github.com/langchain4j/langchain4j-examples/blob/main/azure-open-ai-examples/src/main/java/AzureOpenAiEmbeddingModelExamples.java)
