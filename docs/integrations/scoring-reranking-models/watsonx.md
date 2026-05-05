---
sidebar_position: 7
---

# watsonx.ai

- [watsonx.ai API 参考](https://cloud.ibm.com/apidocs/watsonx-ai#text-rerank)
- [watsonx.ai Java SDK](https://github.com/IBM/watsonx-ai-java-sdk)

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-watsonx</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## 身份验证

Watsonx.ai 通过 `Authenticator` 接口支持身份验证。

这允许根据您的部署使用不同的身份验证机制：

- **IBMCloudAuthenticator** – 使用 API 密钥向 **IBM Cloud** 进行身份验证。这是最简单的方法，在使用 `apiKey(...)` builder 方法时使用。
- **CP4DAuthenticator** – 向 **Cloud Pak for Data** 部署进行身份验证。
- **自定义认证器** – 可以使用 `Authenticator` 接口的任何实现。

`WatsonxScoringModel` 和其他服务构建器接受通过 `.apiKey(...)` 的快捷方式或通过 `.authenticator(...)` 的完整 `Authenticator` 实例。

### 示例

```java
WatsonxScoringModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key") // 简单的 IBM Cloud 身份验证
    .projectId("your-project-id")
    .modelName("cross-encoder/ms-marco-minilm-l-12-v2")
    .build();

WatsonxScoringModel.builder()
    .baseUrl("https://my-instance-url")
    .authenticator( // 用于 Cloud Pak for Data 部署
        CP4DAuthenticator.builder()
            .baseUrl("https://my-instance-url")
            .username("username")
            .apiKey("api-key")
            .build()
    )
    .projectId("my-project-id")
    .modelName("cross-encoder/ms-marco-minilm-l-12-v2")
    .build();
```

### 自定义 HttpClient 和 SSL 配置

#### 使用自定义 HttpClient

所有服务和认证器都通过 builder 模式支持自定义 `HttpClient` 实例。这对于 Cloud Pak for Data 环境特别有用，您可能需要在这些环境中配置自定义 TLS/SSL 设置、代理配置或其他 HTTP 客户端属性。

```java
HttpClient httpClient = HttpClient.newBuilder()
    .sslContext(createCustomSSLContext())
    .executor(ExecutorProvider.ioExecutor())
    .build();

EmbeddingModel embeddingModel = WatsonxEmbeddingModel.builder()
    .baseUrl("https://my-instance-url")
    .modelName("ibm/granite-embedding-278m-multilingual")
    .projectId("project-id")
    .httpClient(httpClient) // 自定义 HttpClient
    .authenticator(
        CP4DAuthenticator.builder()
            .baseUrl("https://my-instance-url")
            .username("username")
            .apiKey("api-key")
            .httpClient(httpClient) // 自定义 HttpClient
            .build()
    )
    .build();
```

> **注意：** 在 Cloud Pak for Data 中使用自定义 `HttpClient` 时，请确保同时在服务构建器和认证器构建器上设置它，以确保所有请求的 HTTP 行为一致。

#### 禁用 SSL 验证

如果只需要禁用 SSL 证书验证，可以使用 `verifySsl(false)` 选项，而不是提供自定义 `HttpClient`：

```java
EmbeddingModel embeddingModel = WatsonxEmbeddingModel.builder()
    .baseUrl("https://my-instance-url")
    .modelName("ibm/granite-embedding-278m-multilingual")
    .projectId("project-id")
    .verifySsl(false) // 禁用 SSL 验证
    .authenticator(
        CP4DAuthenticator.builder()
            .baseUrl("https://my-instance-url")
            .username("username")
            .apiKey("api-key")
            .verifySsl(false) // 禁用 SSL 验证
            .build()
    )
    .build();
```

### 如何创建 IBM Cloud API 密钥

您可以在 [https://cloud.ibm.com/iam/apikeys](https://cloud.ibm.com/iam/apikeys) 点击 **Create +** 创建 API 密钥。

### 如何查找您的项目 ID

1. 访问 [https://dataplatform.cloud.ibm.com/projects/?context=wx](https://dataplatform.cloud.ibm.com/projects/?context=wx)
2. 打开您的项目
3. 转到 **Manage** 标签
4. 从 **Details** 部分复制 **Project ID**

## WatsonxScoringModel

`WatsonxScoringModel` 提供了使用 IBM watsonx.ai 模型的 LangChain4j `ScoringModel` 实现。

它特别适用于根据与用户查询的相关性对文档（或文本段落）列表进行排名。

### 示例

```java
ScoringModel scoringModel = WatsonxScoringModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .modelName("cross-encoder/ms-marco-minilm-l-12-v2")
    .build();

var scores = scoringModel.scoreAll(
    List.of(
        TextSegment.from("Example_1"),
        TextSegment.from("Example_2")
    ),
    "Hello from watsonx.ai"
);

System.out.println(scores);
```

> 🔗 [查看可用的重排序模型 ID](https://dataplatform.cloud.ibm.com/docs/content/wsj/analyze-data/fm-models-embed.html?context=wx&audience=wdp#rerank)

## 示例

- [WatsonxScoringModelTest](https://github.com/langchain4j/langchain4j-examples/blob/main/watsonx-ai-examples/src/main/java/WatsonxScoringModelTest.java)
