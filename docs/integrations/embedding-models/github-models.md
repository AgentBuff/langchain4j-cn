---
sidebar_position: 6
---

# GitHub Models [已弃用]

此模块已弃用，请改用 [OpenAI Official SDK 模块](/integrations/language-models/open-ai-official)。

:::note

这是 `GitHub Models` 集成的文档，使用 Azure AI Inference API 访问 GitHub Models。

LangChain4j 提供 4 种不同的 OpenAI 嵌入模型集成，这是第 4 种：

- [OpenAI](/integrations/language-models/open-ai) 使用自定义的 OpenAI REST API Java 实现，最适合 Quarkus（使用 Quarkus REST 客户端）和 Spring（使用 Spring 的 RestClient）。
- [OpenAI Official SDK](/integrations/language-models/open-ai-official) 使用官方 OpenAI Java SDK。
- [Azure OpenAI](/integrations/language-models/azure-open-ai) 使用微软的 Azure SDK，最适合使用微软 Java 技术栈（包括高级 Azure 认证机制）的场景。
- [GitHub Models](/integrations/language-models/github-models) 使用 Azure AI Inference API 访问 GitHub Models。

:::

如果您想开发生成式 AI 应用，可以使用 GitHub Models 免费查找和试验 AI 模型。
准备好将应用投入生产后，可切换为付费 Azure 账户的 token。

## GitHub Models 文档

- [GitHub Models 文档](https://docs.github.com/en/github-models)
- [GitHub Models 市场](https://github.com/marketplace/models)

## Maven 依赖

### 纯 Java

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-github-models</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## GitHub 令牌 {#github-token}

要使用 GitHub Models，需要使用 GitHub token 进行认证。

Token 在 [GitHub 开发者设置 > Personal access tokens](https://github.com/settings/tokens) 中创建和管理。

获得 token 后，可将其设置为环境变量并在代码中使用：

```bash
export GITHUB_TOKEN="<your-github-token-goes-here>"
```

## 使用 GitHub Token 创建 `GitHubModelsEmbeddingModel`

```java
GitHubModelsEmbeddingModel model = GitHubModelsEmbeddingModel.builder()
        .gitHubToken(System.getenv("GITHUB_TOKEN"))
        .modelName(TEXT_EMBEDDING_3_SMALL)
        .logRequestsAndResponses(true)
        .build();
```

这将创建一个 `GitHubModelsEmbeddingModel` 实例。

## 使用模型

```java
Response<Embedding> response = model.embed("请为这句话生成嵌入向量。");
```

## 示例

- [GitHub Models 示例](https://github.com/langchain4j/langchain4j-examples/tree/main/github-models-examples/src/main/java)
