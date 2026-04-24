---
sidebar_position: 15
---

# OpenAI

:::note

这是 `OpenAI` 集成的文档，使用自定义的 OpenAI REST API Java 实现，最适合 Quarkus（使用 Quarkus REST 客户端）和 Spring（使用 Spring 的 RestClient）。

LangChain4j 提供 3 种不同的 OpenAI 嵌入模型集成，这是第 1 种：

- [OpenAI](/integrations/language-models/open-ai) 使用自定义的 OpenAI REST API Java 实现，最适合 Quarkus（使用 Quarkus REST 客户端）和 Spring（使用 Spring 的 RestClient）。
- [OpenAI Official SDK](/integrations/language-models/open-ai-official) 使用官方 OpenAI Java SDK。
- [Azure OpenAI](/integrations/language-models/azure-open-ai) 使用微软的 Azure SDK，最适合使用微软 Java 技术栈（包括高级 Azure 认证机制）的场景。

:::

- https://platform.openai.com/docs/guides/embeddings
- https://platform.openai.com/docs/api-reference/embeddings

## Maven 依赖

### 纯 Java
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
    <version>1.13.0</version>
</dependency>
```

### Spring Boot
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai-spring-boot-starter</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## 创建 `OpenAiEmbeddingModel`

### 纯 Java
```java
EmbeddingModel model = OpenAiEmbeddingModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("text-embedding-3-small")
        .build();
```

### Spring Boot
在 `application.properties` 中添加：
```properties
# 必填属性：
langchain4j.open-ai.embedding-model.api-key=${OPENAI_API_KEY}
langchain4j.open-ai.embedding-model.model-name=text-embedding-3-small

# 可选属性：
langchain4j.open-ai.embedding-model.base-url=...
langchain4j.open-ai.embedding-model.custom-headers=...
langchain4j.open-ai.embedding-model.dimensions=...
langchain4j.open-ai.embedding-model.log-requests=...
langchain4j.open-ai.embedding-model.log-responses=...
langchain4j.open-ai.embedding-model.max-retries=...
langchain4j.open-ai.embedding-model.organization-id=...
langchain4j.open-ai.embedding-model.project-id=...
langchain4j.open-ai.embedding-model.timeout=...
langchain4j.open-ai.embedding-model.user=...
```

## 示例

- [OpenAiEmbeddingModelExamples](https://github.com/langchain4j/langchain4j-examples/blob/main/open-ai-examples/src/main/java/OpenAiEmbeddingModelExamples.java)
