---
sidebar_position: 1
---

# Amazon Bedrock

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-bedrock</artifactId>
    <version>1.13.0</version>
</dependency>
```

## AWS 凭证
使用 Amazon Bedrock 模型需要配置 AWS 凭证。
一种方式是设置 `AWS_ACCESS_KEY_ID` 和 `AWS_SECRET_ACCESS_KEY` 环境变量，详情请参阅[此处](https://docs.aws.amazon.com/bedrock/latest/userguide/security-iam.html)。
也可在本地设置 `AWS_BEARER_TOKEN_BEDROCK` 环境变量以进行 API Key 认证，更多 API Key 详情请参阅[文档](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html)。

## BedrockChatModel
:::note
当前实现不支持 Guardrails。
:::

支持的模型及其功能可在[此处](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference-supported-models-features.html)查找。

模型 ID 可在[此处](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html)查找。

### 配置
```java
ChatModel model = BedrockChatModel.builder()
        .client(BedrockRuntimeClient)
        .region(...)
        .modelId("us.amazon.nova-lite-v1:0")
        .returnThinking(...)
        .sendThinking(...)
        .timeout(...)
        .maxRetries(...)
        .logRequests(...)
        .logResponses(...)
        .listeners(...)
        .defaultRequestParameters(BedrockChatRequestParameters.builder()
                .modelName(...)
                .temperature(...)
                .topP(...)
                .maxOutputTokens(...)
                .stopSequences(...)
                .toolSpecifications(...)
                .toolChoice(...)
                .additionalModelRequestFields(...)
                .additionalModelRequestField(...)
                .enableReasoning(...)
                .promptCaching(...)
                .build())
        .build();
```

### 示例

- [BedrockChatModelExample](https://github.com/langchain4j/langchain4j-examples/blob/main/bedrock-examples/src/main/java/converse/BedrockChatModelExample.java)

## BedrockStreamingChatModel

:::note
当前实现不支持 Guardrails。
:::

支持的模型及其功能可在[此处](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference-supported-models-features.html)查找。

模型 ID 可在[此处](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html)查找。

### 配置
```java
StreamingChatModel model = BedrockStreamingChatModel.builder()
        .client(BedrockRuntimeAsyncClient)
        .region(...)
        .modelId("us.amazon.nova-lite-v1:0")
        .returnThinking(...)
        .sendThinking(...)
        .timeout(...)
        .logRequests(...)
        .logResponses(...)
        .listeners(...)
        .defaultRequestParameters(BedrockChatRequestParameters.builder()
                .modelName(...)
                .temperature(...)
                .topP(...)
                .maxOutputTokens(...)
                .stopSequences(...)
                .toolSpecifications(...)
                .toolChoice(...)
                .additionalModelRequestFields(...)
                .additionalModelRequestField(...)
                .enableReasoning(...)
                .promptCaching(...)
                .build())
        .build();
```

### 示例

- [BedrockStreamingChatModelExample](https://github.com/langchain4j/langchain4j-examples/blob/main/bedrock-examples/src/main/java/converse/BedrockStreamingChatModelExample.java)


## 附加模型请求字段

`BedrockChatRequestParameters` 中的 `additionalModelRequestFields` 字段类型为 `Map<String, Object>`。
如[此处](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html#bedrock-runtime_Converse-request-additionalModelRequestFields)所述，
它允许为特定模型添加通用 `InferenceConfiguration` 未涵盖的推理参数。


## 思考 / 推理

要启用 Claude 的思考过程，请在 `BedrockChatRequestParameters` 上调用 `enableReasoning`，
并在构建模型时通过 `defaultRequestParameters` 传入：
```java
BedrockChatRequestParameters parameters = BedrockChatRequestParameters.builder()
        .enableReasoning(1024) // token 预算
        .build();

ChatModel model = BedrockChatModel.builder()
        .modelId("us.anthropic.claude-sonnet-4-20250514-v1:0")
        .defaultRequestParameters(parameters)
        .returnThinking(true)
        .sendThinking(true)
        .build();
```

以下参数也控制思考行为：
- `returnThinking`：控制是否在 `AiMessage.thinking()` 中返回思考内容（如果可用），以及在使用 `BedrockStreamingChatModel` 时是否触发 `StreamingChatResponseHandler.onPartialThinking()` 和 `TokenStream.onPartialThinking()` 回调。默认禁用。启用后，思考签名也会存储在 `AiMessage.attributes()` 中并随之返回。
- `sendThinking`：控制是否将存储在 `AiMessage` 中的思考内容和签名发送给后续请求中的 LLM。默认启用。

## 提示缓存

AWS Bedrock 支持提示缓存，可在使用相同提示重复调用 API 时提高性能并降低成本。此功能可将延迟降低最多 85%，缓存内容的成本降低最多 90%。

### 工作原理

提示缓存允许您在对话中标记特定节点进行缓存。当后续 API 调用包含相同的缓存内容时，Bedrock 可复用缓存部分，显著减少处理时间和成本。缓存的 TTL（生存时间）为 5 分钟，每次缓存命中时都会重置。

### 支持的模型

提示缓存支持以下模型：
- Claude Opus 4.5
- Claude Opus 4.1
- Claude Opus 4
- Claude Sonnet 4.5
- Claude Haiku 4.5
- Claude Sonnet 4
- Claude 3.7 Sonnet
- Claude 3.5 Sonnet
- Claude 3.5 Haiku
- Amazon Nova 系列模型

### 配置

使用 `BedrockChatRequestParameters` 中的 `promptCaching()` 方法启用提示缓存：

```java
import dev.langchain4j.model.bedrock.BedrockChatRequestParameters;
import dev.langchain4j.model.bedrock.BedrockCachePointPlacement;

BedrockChatRequestParameters params = BedrockChatRequestParameters.builder()
        .promptCaching(BedrockCachePointPlacement.AFTER_SYSTEM)
        .temperature(0.7)
        .maxOutputTokens(500)
        .build();

ChatModel model = BedrockChatModel.builder()
        .modelId("us.amazon.nova-micro-v1:0")
        .region(Region.US_EAST_1)
        .defaultRequestParameters(params)
        .build();
```

### 缓存点位置选项

`BedrockCachePointPlacement` 枚举提供三种缓存点位置选项：

- **`AFTER_SYSTEM`**：将缓存点放置在系统消息之后。适用于跨多次对话使用相同系统提示词的场景。
- **`AFTER_USER_MESSAGE`**：将缓存点放置在用户消息之后。适用于有标准用户提示词或上下文保持不变的场景。
- **`AFTER_TOOLS`**：将缓存点放置在工具定义之后。适用于有稳定工具集需要缓存的场景。

### 示例

#### 系统消息缓存的基本用法

```java
// 配置提示缓存，在系统消息之后缓存
BedrockChatRequestParameters params = BedrockChatRequestParameters.builder()
        .promptCaching(BedrockCachePointPlacement.AFTER_SYSTEM)
        .build();

ChatModel model = BedrockChatModel.builder()
        .modelId("us.anthropic.claude-3-7-sonnet-20250219-v1:0")
        .defaultRequestParameters(params)
        .build();

// 第一次请求 - 建立缓存
ChatRequest request1 = ChatRequest.builder()
        .messages(Arrays.asList(
                SystemMessage.from("You are a helpful coding assistant with expertise in Java."),
                UserMessage.from("What is dependency injection?")
        ))
        .build();

ChatResponse response1 = model.chat(request1);

// 第二次请求 - 受益于已缓存的系统消息
ChatRequest request2 = ChatRequest.builder()
        .messages(Arrays.asList(
                SystemMessage.from("You are a helpful coding assistant with expertise in Java."),
                UserMessage.from("What is the singleton pattern?")
        ))
        .build();

ChatResponse response2 = model.chat(request2); // 由于缓存，响应更快
```

#### 与其他功能组合使用

提示缓存可与其他 Bedrock 功能（如推理）组合使用：

```java
BedrockChatRequestParameters params = BedrockChatRequestParameters.builder()
        .promptCaching(BedrockCachePointPlacement.AFTER_SYSTEM)
        .enableReasoning(1000)  // 启用推理，token 预算为 1000
        .temperature(0.3)
        .maxOutputTokens(2000)
        .build();

ChatModel model = BedrockChatModel.builder()
        .modelId("us.anthropic.claude-3-7-sonnet-20250219-v1:0")
        .defaultRequestParameters(params)
        .build();
```

### 最佳实践

1. **缓存稳定内容**：对不常变化的内容使用缓存，如系统提示词、工具定义或通用上下文。
2. **选择合适的位置**：
   - 当系统提示词在各次对话中保持一致时，使用 `AFTER_SYSTEM`
   - 当有稳定的工具定义集时，使用 `AFTER_TOOLS`
   - 当存在重复的用户上下文时，使用 `AFTER_USER_MESSAGE`
3. **监控缓存命中**：5 分钟 TTL 在每次缓存命中时都会重置，因此频繁使用相同缓存内容的请求可保持缓存有效。
4. **成本优化**：对于重复使用的长系统提示词或工具定义，缓存尤为有益。

### 更多资源

- [AWS Bedrock 提示缓存文档](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html)
