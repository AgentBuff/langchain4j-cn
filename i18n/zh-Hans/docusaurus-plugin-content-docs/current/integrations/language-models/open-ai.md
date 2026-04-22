---
sidebar_position: 15
---

# OpenAI

:::note

本文档介绍 `OpenAI` 集成，它使用自定义 Java 实现的 OpenAI REST API，最适合与 Quarkus（使用 Quarkus REST 客户端）和 Spring（使用 Spring 的 RestClient）配合使用。

如果您在使用 Quarkus，请参阅 [Quarkus LangChain4j 文档](https://docs.quarkiverse.io/quarkus-langchain4j/dev/openai.html)。

LangChain4j 提供了 3 种不同的 OpenAI 集成方式，本文介绍的是第 1 种：

- [OpenAI](/integrations/language-models/open-ai) 使用自定义 Java 实现的 OpenAI REST API，最适合与 Quarkus（使用 Quarkus REST 客户端）和 Spring（使用 Spring 的 RestClient）配合使用。
- [OpenAI Official SDK](/integrations/language-models/open-ai-official) 使用官方 OpenAI Java SDK。
- [Azure OpenAI](/integrations/language-models/azure-open-ai) 使用微软的 Azure SDK，最适合使用微软 Java 技术栈（包括高级 Azure 认证机制）的场景。

:::

## OpenAI 文档

- [OpenAI API 文档](https://platform.openai.com/docs/introduction)
- [OpenAI API 参考](https://platform.openai.com/docs/api-reference)

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

## API 密钥 {#api-key}

使用 OpenAI 模型需要 API Key，可在[此处](https://platform.openai.com/api-keys)创建。

<details>
<summary>如果我没有 API Key 怎么办？</summary>

如果您还没有自己的 OpenAI API Key，不用担心。
您可以临时使用我们免费提供的 `demo` Key 进行演示。
注意：使用 `demo` Key 时，所有发往 OpenAI API 的请求都需要经过我们的代理，
代理会在转发前注入真实的 Key。我们不会以任何方式收集或使用您的数据。
`demo` Key 有配额限制，仅支持 `gpt-4o-mini` 模型，且仅供演示使用。

```java
OpenAiChatModel model = OpenAiChatModel.builder()
    .baseUrl("http://langchain4j.dev/demo/openai/v1")
    .apiKey("demo")
    .modelName("gpt-4o-mini")
    .build();
```
</details>

## 创建 `OpenAiChatModel`

### 纯 Java
```java
ChatModel model = OpenAiChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .build();


// 也可使用 ChatRequestParameters 或 OpenAiChatRequestParameters 指定默认请求参数
ChatModel model = OpenAiChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .defaultRequestParameters(OpenAiChatRequestParameters.builder()
                .modelName("gpt-4o-mini")
                .build())
        .build();
```
这将使用指定的默认参数创建 `OpenAiChatModel` 实例。

### Spring Boot
在 `application.properties` 中添加：
```properties
# 必填属性：
langchain4j.open-ai.chat-model.api-key=${OPENAI_API_KEY}
langchain4j.open-ai.chat-model.model-name=gpt-4o-mini

# 可选属性：
langchain4j.open-ai.chat-model.base-url=...
langchain4j.open-ai.chat-model.custom-headers=...
langchain4j.open-ai.chat-model.frequency-penalty=...
langchain4j.open-ai.chat-model.log-requests=...
langchain4j.open-ai.chat-model.log-responses=...
langchain4j.open-ai.chat-model.logit-bias=...
langchain4j.open-ai.chat-model.max-retries=...
langchain4j.open-ai.chat-model.max-completion-tokens=...
langchain4j.open-ai.chat-model.max-tokens=...
langchain4j.open-ai.chat-model.metadata=...
langchain4j.open-ai.chat-model.organization-id=...
langchain4j.open-ai.chat-model.parallel-tool-calls=...
langchain4j.open-ai.chat-model.presence-penalty=...
langchain4j.open-ai.chat-model.project-id=...
langchain4j.open-ai.chat-model.reasoning-effort=...
langchain4j.open-ai.chat-model.response-format=...
langchain4j.open-ai.chat-model.return-thinking=...
langchain4j.open-ai.chat-model.seed=...
langchain4j.open-ai.chat-model.service-tier=...
langchain4j.open-ai.chat-model.stop=...
langchain4j.open-ai.chat-model.store=...
langchain4j.open-ai.chat-model.strict-schema=...
langchain4j.open-ai.chat-model.strict-tools=...
langchain4j.open-ai.chat-model.supported-capabilities=...
langchain4j.open-ai.chat-model.temperature=...
langchain4j.open-ai.chat-model.timeout=...
langchain4j.open-ai.chat-model.top-p=
langchain4j.open-ai.chat-model.user=...

# 可选属性：自定义参数（用户自定义键值对）
langchain4j.open-ai.chat-model.custom-parameters.<key>=<value>
```
大部分参数说明请参阅[此处](https://platform.openai.com/docs/api-reference/chat/create)。

该配置将创建一个 `OpenAiChatModel` Bean，
可供 [AI Service](https://docs.langchain4j.dev/tutorials/spring-boot-integration/#langchain4j-spring-boot-starter) 使用，
也可在需要的地方自动注入，例如：

```java
@RestController
class ChatModelController {

    ChatModel chatModel;

    ChatModelController(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @GetMapping("/model")
    public String model(@RequestParam(value = "message", defaultValue = "Hello") String message) {
        return chatModel.chat(message);
    }
}
```

## 结构化输出 {#structured-outputs}
[结构化输出](https://openai.com/index/introducing-structured-outputs-in-the-api/)功能支持
[工具](/tutorials/tools)和[响应格式](/tutorials/ai-services#json-mode)两种场景。

更多结构化输出信息请参阅[此处](/tutorials/structured-outputs)。

### 工具的结构化输出 {#structured-outputs-for-tools}
要为工具启用结构化输出功能，请在构建模型时设置 `.strictTools(true)`：
```java
OpenAiChatModel.builder()
    ...
    .strictTools(true)
    .build(),
```
请注意，这将自动使所有工具参数变为必填（json schema 中的 `required`），
并为 json schema 中每个 `object` 设置 `additionalProperties=false`。这是当前 OpenAI 的限制。

### 响应格式的结构化输出 {#structured-outputs-for-response-format}
要在使用 AI Services 时为响应格式启用结构化输出功能，
请在构建模型时设置 `.supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA)` 和 `.strictJsonSchema(true)`：
```java
OpenAiChatModel.builder()
    ...
    .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA)
    .strictJsonSchema(true)
    .build();
```
此时 AI Service 将自动从给定的 POJO 生成 JSON Schema 并传递给 LLM。

### 思考 / 推理
此设置适用于 [DeepSeek](https://api-docs.deepseek.com/guides/reasoning_model)。

在构建 `OpenAiChatModel` 或 `OpenAiStreamingChatModel` 时启用 `returnThinking` 参数，
DeepSeek API 响应中的 `reasoning_content` 字段将被解析并在 `AiMessage.thinking()` 中返回。

为 `OpenAiStreamingChatModel` 启用 `returnThinking` 参数后，
当 DeepSeek API 流式传输 `reasoning_content` 时，
将触发 `StreamingChatResponseHandler.onPartialThinking()` 和 `TokenStream.onPartialThinking()` 回调。

思考功能配置示例：
```java
ChatModel model = OpenAiChatModel.builder()
        .baseUrl("https://api.deepseek.com/v1")
        .apiKey(System.getenv("DEEPSEEK_API_KEY"))
        .modelName("deepseek-reasoner")
        .returnThinking(true)
        .build();
```

在构建 `OpenAiChatModel` 或 `OpenAiStreamingChatModel` 时启用 `sendThinking` 参数后，
`AiMessage.thinking()` 内容将随请求发送给 DeepSeek API。
可通过 `sendThinking(boolean, String)` 构建器方法配置字段名称。
默认使用 `reasoning_content` 字段名。

## 创建 `OpenAiStreamingChatModel`

### 纯 Java
```java
StreamingChatModel model = OpenAiStreamingChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .build();

// 也可使用 ChatRequestParameters 或 OpenAiChatRequestParameters 指定默认请求参数
StreamingChatModel model = OpenAiStreamingChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .defaultRequestParameters(OpenAiChatRequestParameters.builder()
                .modelName("gpt-4o-mini")
                .build())
        .build();
```

### Spring Boot
在 `application.properties` 中添加：
```properties
# 必填属性：
langchain4j.open-ai.streaming-chat-model.api-key=${OPENAI_API_KEY}
langchain4j.open-ai.streaming-chat-model.model-name=gpt-4o-mini

# 可选属性：
langchain4j.open-ai.streaming-chat-model.base-url=...
langchain4j.open-ai.streaming-chat-model.custom-headers=...
langchain4j.open-ai.streaming-chat-model.frequency-penalty=...
langchain4j.open-ai.streaming-chat-model.log-requests=...
langchain4j.open-ai.streaming-chat-model.log-responses=...
langchain4j.open-ai.streaming-chat-model.logit-bias=...
langchain4j.open-ai.streaming-chat-model.max-retries=...
langchain4j.open-ai.streaming-chat-model.max-completion-tokens=...
langchain4j.open-ai.streaming-chat-model.max-tokens=...
langchain4j.open-ai.streaming-chat-model.metadata=...
langchain4j.open-ai.streaming-chat-model.organization-id=...
langchain4j.open-ai.streaming-chat-model.parallel-tool-calls=...
langchain4j.open-ai.streaming-chat-model.presence-penalty=...
langchain4j.open-ai.streaming-chat-model.project-id=...
langchain4j.open-ai.streaming-chat-model.reasoning-effort=...
langchain4j.open-ai.streaming-chat-model.response-format=...
langchain4j.open-ai.streaming-chat-model.return-thinking=...
langchain4j.open-ai.streaming-chat-model.seed=...
langchain4j.open-ai.streaming-chat-model.service-tier=...
langchain4j.open-ai.streaming-chat-model.stop=...
langchain4j.open-ai.streaming-chat-model.store=...
langchain4j.open-ai.streaming-chat-model.strict-schema=...
langchain4j.open-ai.streaming-chat-model.strict-tools=...
langchain4j.open-ai.streaming-chat-model.temperature=...
langchain4j.open-ai.streaming-chat-model.timeout=...
langchain4j.open-ai.streaming-chat-model.top-p=...
langchain4j.open-ai.streaming-chat-model.user=...

# 可选属性：自定义参数（用户自定义键值对）
langchain4j.open-ai.streaming-chat-model.custom-parameters.<key>=<value>
```


## 创建 `OpenAiModerationModel`

### 纯 Java
```java
ModerationModel model = OpenAiModerationModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("text-moderation-stable")
        .build();
```

### Spring Boot
在 `application.properties` 中添加：
```properties
# 必填属性：
langchain4j.open-ai.moderation-model.api-key=${OPENAI_API_KEY}
langchain4j.open-ai.moderation-model.model-name=text-moderation-stable

# 可选属性：
langchain4j.open-ai.moderation-model.base-url=...
langchain4j.open-ai.moderation-model.custom-headers=...
langchain4j.open-ai.moderation-model.log-requests=...
langchain4j.open-ai.moderation-model.log-responses=...
langchain4j.open-ai.moderation-model.max-retries=...
langchain4j.open-ai.moderation-model.organization-id=...
langchain4j.open-ai.moderation-model.project-id=...
langchain4j.open-ai.moderation-model.timeout=...
```


## 创建 `OpenAiTokenCountEstimator`

```java
TokenCountEstimator tokenCountEstimator = new OpenAiTokenCountEstimator("gpt-4o-mini");
```

## 设置自定义聊天请求参数

使用 `OpenAiChatModel` 和 `OpenAiStreamingChatModel` 时，
可在 HTTP 请求的 JSON 请求体中配置自定义参数。
以下示例展示如何启用网络搜索：
```java
record ApproximateLocation(String city) {}
record UserLocation(String type, ApproximateLocation approximate) {}
record WebSearchOptions(UserLocation user_location) {}
WebSearchOptions webSearchOptions = new WebSearchOptions(new UserLocation("approximate", new ApproximateLocation("London")));
Map<String, Object> customParameters = Map.of("web_search_options", webSearchOptions);

ChatRequest chatRequest = ChatRequest.builder()
    .messages(UserMessage.from("在哪里可以买到好咖啡？"))
    .parameters(OpenAiChatRequestParameters.builder()
        .modelName("gpt-4o-mini-search-preview")
        .customParameters(customParameters)
        .build())
    .build();

ChatModel model = OpenAiChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .logRequests(true)
        .build();

ChatResponse chatResponse = model.chat(chatRequest);
```

这将生成如下请求体的 HTTP 请求：
```json
{
  "model" : "gpt-4o-mini-search-preview",
  "messages" : [ {
    "role" : "user",
    "content" : "在哪里可以买到好咖啡？"
  } ],
  "web_search_options" : {
    "user_location" : {
      "type" : "approximate",
      "approximate" : {
        "city" : "London"
      }
    }
  }
}
```

自定义参数也可以用嵌套 Map 的方式指定：
```java
Map<String, Object> customParameters = Map.of(
    "web_search_options", Map.of(
        "user_location", Map.of(
            "type", "approximate",
            "approximate", Map.of("city", "London")
        )
    )
);
```

## 访问原始 HTTP 响应和服务器发送事件（SSE）

使用 `OpenAiChatModel` 时，可访问原始 HTTP 响应：
```java
SuccessfulHttpResponse rawHttpResponse = ((OpenAiChatResponseMetadata) chatResponse.metadata()).rawHttpResponse();
System.out.println(rawHttpResponse.body());
System.out.println(rawHttpResponse.headers());
System.out.println(rawHttpResponse.statusCode());
```

使用 `OpenAiStreamingChatModel` 时，可访问原始 HTTP 响应（同上）和原始服务器发送事件：
```java
List<ServerSentEvent> rawServerSentEvents = ((OpenAiChatResponseMetadata) chatResponse.metadata()).rawServerSentEvents();
System.out.println(rawServerSentEvents.get(0).data());
System.out.println(rawServerSentEvents.get(0).event());
```

## HTTP 客户端

### 纯 Java
使用 `langchain4j-open-ai` 模块时，默认使用 JDK 的 `java.net.http.HttpClient` 作为 HTTP 客户端。

可进行自定义或选用其他 HTTP 客户端，详情请参阅[此处](/tutorials/customizable-http-client)。

### Spring Boot
使用 `langchain4j-open-ai-spring-boot-starter` Spring Boot Starter 时，默认使用 Spring 的 `RestClient` 作为 HTTP 客户端。

可进行自定义或选用其他 HTTP 客户端，详情请参阅[此处](/tutorials/customizable-http-client)。

## OpenAI Responses API

:::note
此功能为实验性功能，未来版本可能发生变化。
:::

OpenAI 的 [Responses API](https://platform.openai.com/docs/api-reference/responses)（`/v1/responses`）是 Chat Completions API 的替代方案。

### 创建 `OpenAiResponsesChatModel`

```java
ChatModel model = OpenAiResponsesChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-5.4")
        .build();
```

### 创建 `OpenAiResponsesStreamingChatModel`

```java
StreamingChatModel model = OpenAiResponsesStreamingChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .build();
```

### `OpenAiResponsesChatRequestParameters`

`OpenAiResponsesChatRequestParameters` 继承 `DefaultChatRequestParameters`，并增加了 Responses API 专属字段：
`previousResponseId`、`maxToolCalls`、`parallelToolCalls`、`topLogprobs`、`truncation`、`include`、
`serviceTier`、`safetyIdentifier`、`promptCacheKey`、`promptCacheRetention`、`reasoningEffort`、
`reasoningSummary`、`textVerbosity`、`streamIncludeObfuscation`、`store`、`strictTools`、`strictJsonSchema`。

这些参数可在创建模型时作为默认值配置（通过构建器上的 `defaultRequestParameters`），
也可通过 `ChatRequest` 按请求传入（每次请求的参数会覆盖默认值）：
```java
ChatRequest chatRequest = ChatRequest.builder()
        .messages(UserMessage.from("Hello"))
        .parameters(OpenAiResponsesChatRequestParameters.builder()
                .modelName("gpt-4o-mini")
                .previousResponseId("resp_abc123")
                .store(true)
                .build())
        .build();
```

### 思考 / 推理
OpenAI 推理模型（如 `gpt-5.4`、`gpt-5-mini`）支持
[推理摘要](https://developers.openai.com/api/docs/guides/reasoning#reasoning-summaries)，
可展示模型内部推理的摘要。

要启用推理摘要，请在构建器上（或通过 `OpenAiResponsesChatRequestParameters`）将 `reasoningSummary` 设置为 `"auto"`。
也可通过 `reasoningEffort` 控制模型在推理上投入的精力。

```java
ChatModel model = OpenAiResponsesChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-5-mini")
        .reasoningEffort("low")
        .reasoningSummary("auto")
        .build();

ChatResponse response = model.chat("德国的首都是哪里？");
response.aiMessage().text();     // "德国的首都是柏林。"
response.aiMessage().thinking(); // 推理摘要文本
```

当为 `OpenAiResponsesStreamingChatModel` 设置 `reasoningSummary` 后，
在流式传输推理摘要 token 时将触发 `StreamingChatResponseHandler.onPartialThinking()` 回调：

```java
StreamingChatModel model = OpenAiResponsesStreamingChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-5-mini")
        .reasoningEffort("low")
        .reasoningSummary("auto")
        .build();
```

与某些其他提供商（如 DeepSeek）不同，OpenAI 推理 token 不会跨对话轮次持久化，
因此无需在后续请求中发回推理摘要。

#### 加密推理（在上下文中保留推理）

当 `store` 为 `false`（默认值）或您的组织启用了零数据保留时，
模型的推理上下文将在轮次间丢失。
可通过 `include` 参数请求[加密推理内容](https://developers.openai.com/api/docs/guides/reasoning#keeping-reasoning-items-in-context)来保留：

```java
ChatModel model = OpenAiResponsesChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-5-mini")
        .reasoningEffort("medium")
        .include(List.of("reasoning.encrypted_content"))
        .build();
```

当 `include` 包含 `"reasoning.encrypted_content"` 时，响应的推理项将包含一个不透明的加密数据块，
该数据块会自动存储在 `AiMessage.attributes()` 中，键名为 `"encrypted_reasoning"`。

当您在后续请求（如工具调用后）中传回该 `AiMessage` 时，
加密推理内容会自动包含在请求中，从而使模型能恢复推理上下文：

```java
// 第一轮：模型调用工具
ChatResponse response1 = model.chat(ChatRequest.builder()
        .messages(userMessage)
        .parameters(ChatRequestParameters.builder()
                .toolSpecifications(weatherTool)
                .build())
        .build());

AiMessage aiMessage1 = response1.aiMessage();
// aiMessage1.attribute("encrypted_reasoning", String.class) 不为 null

// 第二轮：发送工具结果——加密推理内容自动发送
ChatResponse response2 = model.chat(ChatRequest.builder()
        .messages(
                userMessage,
                aiMessage1, // attributes 中包含加密推理内容
                ToolExecutionResultMessage.from(aiMessage1.toolExecutionRequests().get(0), "sunny"))
        .parameters(ChatRequestParameters.builder()
                .toolSpecifications(weatherTool)
                .build())
        .build());
```

`OpenAiResponsesStreamingChatModel` 同样适用。

### `OpenAiResponsesChatResponseMetadata`

Responses API 的响应元数据在标准 `ChatResponseMetadata` 基础上提供了额外字段：

```java
OpenAiResponsesChatResponseMetadata metadata =
        (OpenAiResponsesChatResponseMetadata) chatResponse.metadata();

metadata.id();               // 响应 ID（可用作 previousResponseId）
metadata.modelName();        // 请求使用的模型名称
metadata.finishReason();     // 完成原因（STOP、LENGTH、TOOL_EXECUTION、OTHER）
metadata.tokenUsage();       // 返回包含详细 token 计数的 OpenAiTokenUsage
metadata.createdAt();        // 响应创建的时间戳
metadata.completedAt();      // 响应完成的时间戳
metadata.serviceTier();      // 请求使用的服务层级

// 原始 HTTP 访问（与 Chat Completions API 相同）
metadata.rawHttpResponse();
metadata.rawServerSentEvents();
```

## 示例
- [OpenAI 示例](https://github.com/langchain4j/langchain4j-examples/tree/main/open-ai-examples/src/main/java)
