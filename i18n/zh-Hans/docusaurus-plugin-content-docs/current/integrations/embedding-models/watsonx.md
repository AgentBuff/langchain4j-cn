---
sidebar_position: 23
---

# watsonx.ai

- [watsonx.ai API 参考](https://cloud.ibm.com/apidocs/watsonx-ai#text-embeddings)
- [watsonx.ai Java SDK](https://github.com/IBM/watsonx-ai-java-sdk)

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-watsonx</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## 认证

Watsonx.ai 通过 `Authenticator` 接口支持多种认证方式，可根据部署情况选择：

- **IBMCloudAuthenticator** — 使用 API Key 在 **IBM Cloud** 上进行认证，是最简单的方式，通过 builder 的 `apiKey(...)` 方法使用。
- **CP4DAuthenticator** — 用于 **Cloud Pak for Data** 部署。
- **自定义 authenticator** — 任何实现了 `Authenticator` 接口的类均可使用。

`WatsonxEmbeddingModel` 及其他服务 builder 支持通过 `.apiKey(...)` 快速配置，或通过 `.authenticator(...)` 传入完整的 `Authenticator` 实例。

### 示例
```java
WatsonxEmbeddingModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key") // 简单 IBM Cloud 认证
    .projectId("your-project-id")
    .modelName("ibm/granite-embedding-278m-multilingual")
    .build();

WatsonxEmbeddingModel.builder()
    .baseUrl("https://my-instance-url")
    .authenticator( // Cloud Pak for Data 部署
        CP4DAuthenticator.builder()
            .baseUrl("https://my-instance-url")
            .username("username")
            .apiKey("api-key")
            .build()
    )
    .projectId("my-project-id")
    .modelName("ibm/granite-embedding-278m-multilingual")
    .build();
```

### 自定义 HttpClient 与 SSL 配置

#### 使用自定义 HttpClient

所有服务和 authenticator 均通过 builder 模式支持自定义 `HttpClient` 实例。这在 Cloud Pak for Data 环境中特别有用，您可能需要配置自定义 TLS/SSL 设置、代理或其他 HTTP 客户端属性。

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

> **注意：** 使用 Cloud Pak for Data 的自定义 `HttpClient` 时，请务必在服务 builder 和 authenticator builder 上都进行设置，以确保所有请求的 HTTP 行为一致。

#### 禁用 SSL 验证

如果只需禁用 SSL 证书验证，可使用 `verifySsl(false)` 选项，而无需提供自定义 `HttpClient`：

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

### 如何创建 IBM Cloud API Key

访问 [https://cloud.ibm.com/iam/apikeys](https://cloud.ibm.com/iam/apikeys)，点击 **Create +** 即可创建 API Key。

### 如何查找 Project ID

1. 访问 [https://dataplatform.cloud.ibm.com/projects/?context=wx](https://dataplatform.cloud.ibm.com/projects/?context=wx)
2. 打开您的项目
3. 进入 **Manage** 标签页
4. 在 **Details** 部分复制 **Project ID**

## WatsonxEmbeddingModel

`WatsonxEmbeddingModel` 允许您使用 IBM watsonx.ai 生成嵌入，并与 LangChain4j 的向量操作（如搜索、检索增强生成（RAG）和相似度比较）集成。

它实现了 LangChain4j 的 `EmbeddingModel` 接口。

```java
EmbeddingModel embeddingModel = WatsonxEmbeddingModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .modelName("ibm/granite-embedding-278m-multilingual")
    .build();

System.out.println(embeddingModel.embed("Hello from watsonx.ai"));
```
> 🔗 [查看可用嵌入模型 ID](https://dataplatform.cloud.ibm.com/docs/content/wsj/analyze-data/fm-models-embed.html?context=wx&audience=wdp#embed)

## 示例

- [WatsonxEmbeddingModelTest](https://github.com/langchain4j/langchain4j-examples/blob/main/watsonx-ai-examples/src/main/java/WatsonxEmbeddingModelTest.java)
