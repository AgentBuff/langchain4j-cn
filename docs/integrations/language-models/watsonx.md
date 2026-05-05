---
sidebar_position: 22
---

# watsonx.ai

- [watsonx.ai API 参考](https://cloud.ibm.com/apidocs/watsonx-ai#chat-completions)
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

Watsonx.ai 通过 `Authenticator` 接口支持多种认证方式，可根据部署环境选择不同机制：

- **IBMCloudAuthenticator** — 使用 API Key 在 **IBM Cloud** 上进行认证，是最简单的方式，通过 `apiKey(...)` 构建器方法使用。
- **CP4DAuthenticator** — 用于 **Cloud Pak for Data** 部署。
- **自定义认证器** — 可使用任何实现 `Authenticator` 接口的类。

`WatsonxChatModel`、`WatsonxStreamingChatModel` 等服务构建器既支持通过 `.apiKey(...)` 简写配置，也支持通过 `.authenticator(...)` 传入完整的 `Authenticator` 实例。

### 示例
```java
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.watsonx.WatsonxChatModel;
import com.ibm.watsonx.ai.core.auth.cp4d.CP4DAuthenticator;
import com.ibm.watsonx.ai.core.auth.cp4d.AuthMode;
import com.ibm.watsonx.ai.CloudRegion;

WatsonxChatModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key") // 简单的 IBM Cloud 认证
    .projectId("your-project-id")
    .modelName("ibm/granite-4-h-small")
    .build();

WatsonxChatModel.builder()
    .baseUrl("https://my-instance-url")
    .authenticator( // 用于 Cloud Pak for Data 部署
        CP4DAuthenticator.builder()
            .baseUrl("https://my-instance-url")
            .username("username")
            .apiKey("api-key")
            .authMode(AuthMode.LEGACY)
            .build()
    )
    .projectId("my-project-id")
    .modelName("ibm/granite-4-h-small")
    .build();
```

### 自定义 HttpClient 和 SSL 配置

#### 使用自定义 HttpClient

所有服务和认证器均支持通过构建器模式传入自定义 `HttpClient` 实例。在 Cloud Pak for Data 环境中尤其有用，可用于配置自定义 TLS/SSL 设置、代理配置或其他 HTTP 客户端属性。

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

> **注意：** 在 Cloud Pak for Data 中使用自定义 `HttpClient` 时，请确保在服务构建器和认证器构建器中均设置该实例，以保证所有请求的 HTTP 行为一致。

#### 禁用 SSL 验证

如果只需禁用 SSL 证书验证，可以使用 `verifySsl(false)` 选项，而无需提供自定义 `HttpClient`：

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

访问 [https://cloud.ibm.com/iam/apikeys](https://cloud.ibm.com/iam/apikeys)，点击 **Create +** 创建 API Key。

### 如何查找 Project ID

1. 访问 [https://dataplatform.cloud.ibm.com/projects/?context=wx](https://dataplatform.cloud.ibm.com/projects/?context=wx)
2. 打开您的项目
3. 进入 **Manage** 标签页
4. 从 **Details** 部分复制 **Project ID**

## WatsonxChatModel

`WatsonxChatModel` 类允许创建完全封装在 LangChain4j 内的 `ChatModel` 接口实例。
创建实例时必须指定以下必填参数：

- `baseUrl(...)` — IBM Cloud 端点 URL（可为 `String`、`URI` 或 `CloudRegion`）；
- `apiKey(...)` — IBM Cloud IAM API Key；
- `projectId(...)` — IBM Cloud 项目 ID（或使用 `spaceId(...)`）；
- `modelName(...)` — 用于推理的基础模型 ID；

> 可使用 `.apiKey(...)` 或通过 `.authenticator(...)` 传入完整的 `Authenticator` 实例进行认证。

### 示例

```java
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.watsonx.WatsonxChatModel;
import com.ibm.watsonx.ai.CloudRegion;

ChatModel chatModel = WatsonxChatModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .modelName("ibm/granite-4-h-small")
    .temperature(0.7)
    .maxOutputTokens(0)
    .build();

String answer = chatModel.chat("来自 watsonx.ai 的问好");
System.out.println(answer);
```

> 🔗 [查看可用模型](https://dataplatform.cloud.ibm.com/docs/content/wsj/analyze-data/fm-models.html?context=wx#ibm-provided)

## WatsonxStreamingChatModel

`WatsonxStreamingChatModel` 为 LangChain4j 中的 IBM watsonx.ai 提供流式支持。适用于需要在 token 生成时即处理的场景，非常适合聊天 UI 或长文本生成等实时应用。

流式模式使用与非流式 [`WatsonxChatModel`](#watsonxchatmodel) 相同的配置结构和参数，主要区别在于响应通过处理器接口增量传递。

### 示例

```java
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.StreamingChatResponseHandler;
import dev.langchain4j.model.chat.ChatResponse;
import dev.langchain4j.model.watsonx.WatsonxStreamingChatModel;
import com.ibm.watsonx.ai.CloudRegion;

StreamingChatModel model = WatsonxStreamingChatModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .modelName("ibm/granite-4-h-small")
    .maxOutputTokens(0)
    .build();

model.chat("意大利的首都是哪里？", new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(String partialResponse) {
        System.out.println("部分响应：" + partialResponse);
    }

    @Override
    public void onCompleteResponse(ChatResponse completeResponse) {
        System.out.println("完整响应：" + completeResponse);
    }

    @Override
    public void onError(Throwable error) {
        error.printStackTrace();
    }
});
```

> 🔗 [查看可用模型](https://dataplatform.cloud.ibm.com/docs/content/wsj/analyze-data/fm-models.html?context=wx#ibm-provided)

## 工具集成

`WatsonxChatModel` 和 `WatsonxStreamingChatModel` 均支持 **LangChain4j 工具**，允许模型调用使用 `@Tool` 注解的 Java 方法。

以下示例使用同步模型（`WatsonxChatModel`），但同样的方式也适用于流式变体。

```java
static class Tools {

    @Tool
    LocalDate currentDate() {
        return LocalDate.now();
    }

    @Tool
    LocalTime currentTime() {
        return LocalTime.now();
    }
}

interface AiService {
    String chat(String userMessage);
}

ChatModel chatModel = WatsonxChatModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .modelName("mistralai/mistral-small-3-1-24b-instruct-2503")
    .maxOutputTokens(0)
    .build();

AiService aiService = AiServices.builder(AiService.class)
        .chatModel(model)
        .tools(new Tools())
        .build();

String answer = aiService.chat("今天是几号？");
System.out.println(answer);
```

> **注意：** 请确保所选模型支持工具调用。

---

## 启用思考 / 推理输出

某些基础模型可以在响应中包含内部*推理*（也称为*思考*）步骤。
根据模型不同，该推理内容可能**与最终响应嵌入在同一文本中**，也可能**由 watsonx.ai 单独在专用字段中返回**。

为正确启用并捕获此行为，必须根据模型的输出格式配置 `thinking(...)` 构建器方法，
以便 LangChain4j 能自动从模型输出中提取推理和响应内容。

主要有两种配置模式：

- **`ExtractionTags`** → 适用于将推理和响应返回在同一文本块中的模型（如 **ibm/granite-3-3-8b-instruct**）。
- **`ThinkingEffort`** → 适用于已自动分离推理和响应的模型（如 **openai/gpt-oss-120b**）。

### 将推理和响应一并返回的模型

当模型将推理和响应输出在同一文本字符串中时，使用 **`ExtractionTags`**。
标签定义了用于分隔推理和最终响应的类 XML 标记。

**示例标签：**

- **推理标签：** `<think>` — 包含模型的内部推理。
- **响应标签：** `<response>` — 包含面向用户的答案。

#### 行为

- 若**同时指定两个标签**，则直接用于提取推理和响应段落。
- 若**只指定推理标签**，则该标签之外的所有内容均视为响应。

#### **ibm/granite-3-3-8b-instruct** 示例

```java
ChatModel chatModel = WatsonxChatModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .modelName("ibm/granite-3-3-8b-instruct")
    .maxOutputTokens(0)
    .thinking(ExtractionTags.of("think", "response"))
    .build();

ChatResponse chatResponse = chatModel.chat(
    UserMessage.userMessage("天空为什么是蓝色的？")
);

AiMessage aiMessage = chatResponse.aiMessage();

System.out.println(aiMessage.thinking());
System.out.println(aiMessage.text());
```

### 将推理和响应分开返回的模型

对于已将推理和响应作为单独字段返回的模型，使用 **`ThinkingEffort`** 控制模型在生成过程中应用的推理量。
也可使用布尔标志启用。

#### **openai/gpt-oss-120b** 示例

```java
ChatModel chatModel = WatsonxChatModel.builder()
    .baseUrl(CloudRegion.DALLAS)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .modelName("openai/gpt-oss-120b")
    .thinking(ThinkingEffort.HIGH)
    .build();
```

或

```java
ChatModel chatModel = WatsonxChatModel.builder()
    .baseUrl(CloudRegion.DALLAS)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .modelName("openai/gpt-oss-120b")
    .thinking(true)
    .build();
```

### 流式示例

```java
StreamingChatModel model = WatsonxStreamingChatModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .modelName("ibm/granite-3-3-8b-instruct")
    .thinking(ExtractionTags.of("think", "response"))
    .build();

List<ChatMessage> messages = List.of(
    UserMessage.userMessage("天空为什么是蓝色的？")
);

ChatRequest chatRequest = ChatRequest.builder()
    .messages(messages)
    .build();

model.chat(chatRequest, new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(String partialResponse) {
        ...
    }

    @Override
    public void onPartialThinking(PartialThinking partialThinking) {
        ...
    }
});
```

> **注意：**
> - 请确保所选模型支持推理输出。
> - 对于将推理和响应嵌入在同一文本字符串中的模型，使用 `ExtractionTags`。
> - 对于已自动分离推理和响应的模型，使用 `ThinkingEffort` 或 `thinking(true)`。

## WatsonxModelCatalog

`WatsonxModelCatalog` 提供了一种以编程方式发现和列出 IBM watsonx.ai 上所有可用基础模型的途径。
它实现了 LangChain4j 的 `ModelCatalog` 接口，允许检索每个模型的详细信息。

### 示例

```java
import dev.langchain4j.model.catalog.ModelCatalog;
import dev.langchain4j.model.catalog.ModelDescription;
import dev.langchain4j.model.watsonx.WatsonxModelCatalog;
import com.ibm.watsonx.ai.CloudRegion;

ModelCatalog modelCatalog = WatsonxModelCatalog.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .build();

var models = modelCatalog.listModels();
```

## WatsonxModerationModel

`WatsonxModerationModel` 提供了使用 IBM watsonx.ai 的 LangChain4j `ModerationModel` 接口实现。
可通过**检测器**自动检测和标记文本中的敏感、不安全或违规内容。

可以使用一个或多个**检测器**来识别不同类型的内容，例如：

- **Pii** — 检测个人身份信息（如邮箱、电话号码）
- **Hap** — 检测仇恨、滥用或亵渎内容
- **GraniteGuardian** — 检测有风险或有害的语言

### 示例

```java
ModerationModel model = WatsonxModerationModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .detectors(Hap.ofDefaults(), GraniteGuardian.ofDefaults())
    .build();

Response<Moderation> response = model.moderate("...");
```

### 元数据

每个审核响应都包含一个 `metadata` Map，提供关于检测结果的额外上下文。

| 键 | 说明 |
|-----|------|
| `detection` | 检测器分配的检测标签或类别 |
| `detection_type` | 触发标记的检测器类型 |
| `start` | 检测到的片段起始字符索引 |
| `end` | 检测到的片段结束字符索引 |
| `score` | 检测结果的置信度评分 |

这些元数据值可通过 `Response.metadata()` 获取：

```java
Map<String, Object> metadata = response.metadata();
System.out.println("检测类型：" + metadata.get("detection_type"));
System.out.println("评分：" + metadata.get("score"));
```

## 通过环境变量配置

LangChain4j watsonx 集成允许通过环境变量自定义内部 HTTP 行为。
这些设置是可选的，未显式定义时将使用合理的默认值。

### 重试配置

HTTP 请求在遇到瞬态故障或认证 token 过期时会自动重试。
可通过以下环境变量自定义重试行为：

| 环境变量 | 说明 | 默认值 |
|---|---|---|
| `WATSONX_RETRY_TOKEN_EXPIRED_MAX_RETRIES` | 认证 token 过期（HTTP 401 / 403）时的最大重试次数 | `1` |
| `WATSONX_RETRY_STATUS_CODES_MAX_RETRIES` | 瞬态 HTTP 状态码（`429`、`503`、`504`、`520`）的最大重试次数 | `10` |
| `WATSONX_RETRY_STATUS_CODES_BACKOFF_ENABLED` | 为瞬态重试启用指数退避 | `true` |
| `WATSONX_RETRY_STATUS_CODES_INITIAL_INTERVAL_MS` | 初始重试间隔（毫秒，用作指数退避的基数） | `20` |

### HTTP IO 执行器配置

流式响应和 HTTP 响应处理由内部 IO 执行器处理。
默认使用单线程执行器以确保流式事件的顺序处理。

可通过以下环境变量自定义此行为：

| 环境变量 | 说明 | 默认值 |
|---|---|---|
| `WATSONX_IO_EXECUTOR_THREADS` | 用于 HTTP IO 和 SSE 流解析的线程数 | `1` |

## Quarkus

详情请参阅[此处](https://docs.quarkiverse.io/quarkus-langchain4j/dev/watsonx-chat-model.html)。

## 示例

- [WatsonxChatModelTest](https://github.com/langchain4j/langchain4j-examples/blob/main/watsonx-ai-examples/src/main/java/WatsonxChatModelTest.java)
- [WatsonxChatModelReasoningTest](https://github.com/langchain4j/langchain4j-examples/blob/main/watsonx-ai-examples/src/main/java/WatsonxChatModelReasoningTest.java)
- [WatsonxStreamingChatModelTest](https://github.com/langchain4j/langchain4j-examples/blob/main/watsonx-ai-examples/src/main/java/WatsonxStreamingChatModelTest.java)
- [WatsonxStreamingChatModelReasoningTest](https://github.com/langchain4j/langchain4j-examples/blob/main/watsonx-ai-examples/src/main/java/WatsonxStreamingChatModelTest.java)
- [WatsonxToolsTest](https://github.com/langchain4j/langchain4j-examples/blob/main/watsonx-ai-examples/src/main/java/WatsonxToolsTest.java)
- [WatsonxTokenCounterEstimatorTest](https://github.com/langchain4j/langchain4j-examples/blob/main/watsonx-ai-examples/src/main/java/WatsonxTokenCounterEstimatorTest.java)
