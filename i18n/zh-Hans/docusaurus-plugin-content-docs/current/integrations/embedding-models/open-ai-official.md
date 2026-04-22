---
sidebar_position: 16
---

# OpenAI Official SDK

:::note

这是 `OpenAI Official SDK` 集成的文档，使用[官方 OpenAI Java SDK](https://github.com/openai/openai-java)。

LangChain4j 提供 3 种不同的 OpenAI 嵌入模型集成，这是第 2 种：

- [OpenAI](/integrations/language-models/open-ai) 使用自定义的 OpenAI REST API Java 实现，最适合 Quarkus（使用 Quarkus REST 客户端）和 Spring（使用 Spring 的 RestClient）。
- [OpenAI Official SDK](/integrations/language-models/open-ai-official) 使用官方 OpenAI Java SDK。
- [Azure OpenAI](/integrations/language-models/azure-open-ai) 使用微软的 Azure SDK，最适合使用微软 Java 技术栈（包括高级 Azure 认证机制）的场景。

:::

## 此集成的使用场景

本集成使用 [OpenAI Java SDK GitHub 仓库](https://github.com/openai/openai-java)，适用于以下来源提供的所有 OpenAI 模型：

- OpenAI
- Azure OpenAI
- GitHub Models

同时也适用于支持 OpenAI API 的模型。

## OpenAI 文档

- [OpenAI Java SDK GitHub 仓库](https://github.com/openai/openai-java)
- [OpenAI API 文档](https://platform.openai.com/docs/introduction)
- [OpenAI API 参考](https://platform.openai.com/docs/api-reference)

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai-official</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## 配置模型

使用 OpenAI 模型通常需要端点 URL、API Key 和模型名称，具体取决于模型的托管位置。本集成通过一些自动配置简化了这一过程：

### 通用配置

```java
import com.openai.models.embeddings.EmbeddingModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.openaiofficial.OpenAiOfficialEmbeddingModel;

import static com.openai.models.embeddings.EmbeddingModel.TEXT_EMBEDDING_3_SMALL;

// ....

EmbeddingModel model = OpenAiOfficialEmbeddingModel.builder()
        .baseUrl(System.getenv("AZURE_OPENAI_ENDPOINT"))
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .modelName(TEXT_EMBEDDING_3_SMALL)
        .build();
```

### Azure OpenAI 和 GitHub Models 的专项配置

与配置 [OpenAI Official Chat Model](/integrations/language-models/open-ai-official) 类似，可通过 `isAzure()` 和 `isGitHubModels()` 方法为 `OpenAiOfficialEmbeddingModel` 配置 Azure OpenAI 和 GitHub Models。

#### Azure OpenAI

```java
EmbeddingModel model = OpenAiOfficialEmbeddingModel.builder()
        .baseUrl(System.getenv("AZURE_OPENAI_ENDPOINT"))
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .modelName(TEXT_EMBEDDING_3_SMALL)
        .isAzure(true) // 如果 base URL 以 `openai.azure.com` 结尾则不必填写
        .build();
```

也可使用"无密码"认证，详见 [OpenAI Official Chat Model](/integrations/language-models/open-ai-official) 文档。

#### GitHub Models

```java
EmbeddingModel model = OpenAiOfficialEmbeddingModel.builder()
        .modelName(TEXT_EMBEDDING_3_SMALL)
        .isGitHubModels(true)
        .build();
```

## 使用模型

配置好模型后，即可用于生成嵌入：

```java
Response<Embedding> response = model.embed("请为这句话生成嵌入向量。");
```
