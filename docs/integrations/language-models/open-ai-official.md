---
sidebar_position: 16
---

# OpenAI Official SDK

:::note

本文档介绍 `OpenAI Official SDK` 集成，它使用[官方 OpenAI Java SDK](https://github.com/openai/openai-java)。

LangChain4j 提供了 3 种不同的 OpenAI 集成方式，本文介绍的是第 2 种：

- [OpenAI](/integrations/language-models/open-ai) 使用自定义 Java 实现的 OpenAI REST API，最适合与 Quarkus（使用 Quarkus REST 客户端）和 Spring（使用 Spring 的 RestClient）配合使用。
- [OpenAI Official SDK](/integrations/language-models/open-ai-official) 使用官方 OpenAI Java SDK。
- [Azure OpenAI](/integrations/language-models/azure-open-ai) 使用微软的 Azure SDK，最适合使用微软 Java 技术栈（包括高级 Azure 认证机制）的场景。

:::

## 此集成的使用场景

本集成使用 [OpenAI Java SDK GitHub 仓库](https://github.com/openai/openai-java)，支持以下平台提供的所有 OpenAI 模型：

- OpenAI
- Microsoft Foundry
- GitHub Models

同时也支持兼容 OpenAI API 的模型，如 DeepSeek。

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

:::note
本节以及下一节的使用说明均针对非流式模式（也称为"阻塞"或"同步"模式）。
流式模式在两节之后详述：流式模式支持与模型的实时对话，但使用更复杂。
:::

使用 OpenAI 模型通常需要端点 URL、API Key 和模型名称。这取决于模型托管的位置，本集成提供了一些自动配置选项：

### 通用配置

```java
import com.openai.models.ChatModel;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openaiofficial.OpenAiOfficialChatModel;

import static com.openai.models.ChatModel.GPT_5_MINI;

// ....

ChatModel model = OpenAiOfficialChatModel.builder()
        .baseUrl(System.getenv("OPENAI_BASE_URL"))
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName(GPT_5_MINI)
        .build();
```

### OpenAI 配置

OpenAI 的 `baseUrl`（`https://api.openai.com/v1`）是默认值，可以省略：

```java
ChatModel model = OpenAiOfficialChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName(GPT_5_MINI)
        .build();
```

### Azure OpenAI 配置

#### 通用配置

对于 Azure OpenAI，必须设置 `baseUrl`，如果该 URL 以 `openai.azure.com` 结尾，将自动检测为 Azure OpenAI：

```java
ChatModel model = OpenAiOfficialChatModel.builder()
        .baseUrl(System.getenv("AZURE_OPENAI_ENDPOINT"))
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .modelName(GPT_5_MINI)
        .build();
```

若要强制使用 Azure OpenAI，也可以使用 `isAzure()` 方法：

```java
ChatModel model = OpenAiOfficialChatModel.builder()
        .baseUrl(System.getenv("AZURE_OPENAI_ENDPOINT"))
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .isAzure(true)
        .modelName(GPT_5_MINI)
        .build();
```

#### 无密码认证

您可以使用"无密码"认证方式连接 Azure OpenAI，更安全，无需管理 API Key。

首先需要将 Azure OpenAI 实例配置为支持托管身份，然后授予应用程序访问权限，例如：

```bash
# 为 Azure OpenAI 实例启用系统托管身份
az cognitiveservices account identity assign \
    --name <your-openai-instance-name> \
    --resource-group <your-resource-group>

# 获取当前登录的身份
az ad signed-in-user show \
    --query id -o tsv
    
# 授予 Azure OpenAI 实例的访问权限
az role assignment create \
    --role "Cognitive Services OpenAI User" \
    --assignee <your-logged-identity-from-the-previous-command> \
    --scope "/subscriptions/<your-subscription-id>/resourceGroups/<your-resource-group>"
```

然后，在 Maven `pom.xml` 中添加 `azure-identity` 依赖：

```xml
<dependency>
    <groupId>com.azure</groupId>
    <artifactId>azure-identity</artifactId>
</dependency>
```

未配置 API Key 时，LangChain4j 将自动对 Azure OpenAI 使用无密码认证。

### GitHub Models 配置

对于 GitHub Models，可以使用默认 `baseUrl`（`https://models.inference.ai.azure.com`）：

```java
ChatModel model = OpenAiOfficialChatModel.builder()
        .baseUrl("https://models.inference.ai.azure.com")
        .apiKey(System.getenv("GITHUB_TOKEN"))
        .modelName(GPT_5_MINI)
        .build();
```

或者使用 `isGitHubModels()` 方法强制使用 GitHub Models，它会自动设置 `baseUrl`：

```java
ChatModel model = OpenAiOfficialChatModel.builder()
        .apiKey(System.getenv("GITHUB_TOKEN"))
        .modelName(GPT_5_MINI)
        .isGitHubModels(true)
        .build();
```

由于 GitHub Models 通常使用 `GITHUB_TOKEN` 环境变量，该变量在 GitHub Actions 或 GitHub Codespaces 中会自动填充，因此会被自动检测到：

```java
ChatModel model = OpenAiOfficialChatModel.builder()
        .modelName(GPT_5_MINI)
        .isGitHubModels(true)
        .build();
```

最后一种配置更简便，也更安全，因为 `GITHUB_TOKEN` 环境变量不会暴露在代码或 GitHub 日志中。

## 使用模型

上一节创建的 `OpenAiOfficialChatModel` 对象实现了 `ChatModel` 接口。

可以由 [AI Service](https://docs.langchain4j.dev/tutorials/spring-boot-integration/#langchain4j-spring-boot-starter) 使用，也可直接在 Java 应用程序中使用。

以下示例展示了将其作为 Spring Bean 自动注入的方式：

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

## 结构化输出
[结构化输出](https://openai.com/index/introducing-structured-outputs-in-the-api/)功能支持
[工具](/tutorials/tools)和[响应格式](/tutorials/ai-services#json-mode)两种场景。

更多结构化输出信息请参阅[此处](/tutorials/structured-outputs)。

### 工具的结构化输出
要为工具启用结构化输出功能，请在构建模型时设置 `.strictTools(true)`：

```java
OpenAiOfficialChatModel.builder()
        // ...
        .strictTools(true)
        .build();
```

请注意，这将自动使所有工具参数变为必填（json schema 中的 `required`），
并为 json schema 中每个 `object` 设置 `additionalProperties=false`。这是当前 OpenAI 的限制。

### 响应格式的结构化输出
要在使用 AI Services 时为响应格式启用结构化输出功能，
请在构建模型时设置 `supportedCapabilities(Set.of(RESPONSE_FORMAT_JSON_SCHEMA))` 和 `.strictJsonSchema(true)`：

```java
import static dev.langchain4j.model.chat.Capability.RESPONSE_FORMAT_JSON_SCHEMA;

// ...

OpenAiChatModel.builder()
        // ...
        .supportedCapabilities(Set.of(RESPONSE_FORMAT_JSON_SCHEMA))
        .strictJsonSchema(true)
        .build();
```

此时 AI Service 将自动从给定的 POJO 生成 JSON Schema 并传递给 LLM。

## 配置流式模式的模型

:::note
以上两节详述了非流式模式（"阻塞"或"同步"模式）的配置。
本节介绍流式模式，它支持与模型的实时对话，但使用更复杂。
:::

与非流式模式类似，但需要使用 `OpenAiOfficialStreamingChatModel` 类代替 `OpenAiOfficialChatModel`：

```java
StreamingChatModel model = OpenAiOfficialStreamingChatModel.builder()
        .baseUrl(System.getenv("OPENAI_BASE_URL"))
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName(GPT_5_MINI)
        .build();
```

也可以使用 `isAzure()` 和 `isGitHubModels()` 方法强制使用 Azure OpenAI 或 GitHub Models，详见非流式配置节。

## OpenAI Responses API

:::note
此功能为实验性功能，未来版本可能发生变化。
:::

OpenAI 的 [Responses API](https://platform.openai.com/docs/api-reference/responses)（`/v1/responses`）是 Chat Completions API 的替代方案。
目前仅提供流式模型（`OpenAiOfficialResponsesStreamingChatModel`）。

### 创建 `OpenAiOfficialResponsesStreamingChatModel`

#### 纯 Java
```java
StreamingChatModel model = OpenAiOfficialResponsesStreamingChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName(GPT_5_MINI)
        .build();
```

也可以使用 `OpenAiOfficialResponsesChatRequestParameters` 配置默认请求参数：
```java
StreamingChatModel model = OpenAiOfficialResponsesStreamingChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .defaultRequestParameters(OpenAiOfficialResponsesChatRequestParameters.builder()
                .modelName("gpt-4o-mini")
                .previousResponseId("resp_abc123")
                .reasoningEffort("medium")
                .store(true)
                .build())
        .build();
```

### `OpenAiOfficialResponsesChatRequestParameters`

`OpenAiOfficialResponsesChatRequestParameters` 继承 `DefaultChatRequestParameters`，并增加了 Responses API 专属字段：
`previousResponseId`、`maxToolCalls`、`parallelToolCalls`、`topLogprobs`、`truncation`、`include`、
`serviceTier`、`safetyIdentifier`、`promptCacheKey`、`promptCacheRetention`、`reasoningEffort`、
`textVerbosity`、`streamIncludeObfuscation`、`store`、`strictTools`、`strictJsonSchema`。

这些参数可在创建模型时作为默认值配置（通过构建器上的 `defaultRequestParameters`），
也可通过 `ChatRequest` 按请求传入（每次请求的参数会覆盖默认值）：
```java
ChatRequest chatRequest = ChatRequest.builder()
        .messages(UserMessage.from("Hello"))
        .parameters(OpenAiOfficialResponsesChatRequestParameters.builder()
                .modelName("gpt-4o-mini")
                .previousResponseId("resp_abc123")
                .store(true)
                .build())
        .build();
```

### `OpenAiOfficialResponsesChatResponseMetadata`

Responses API 的响应元数据在标准 `ChatResponseMetadata` 基础上提供了额外字段：

```java
OpenAiOfficialResponsesChatResponseMetadata metadata =
        (OpenAiOfficialResponsesChatResponseMetadata) chatResponse.metadata();

metadata.id();               // 响应 ID（可用作 previousResponseId）
metadata.modelName();        // 请求使用的模型名称
metadata.finishReason();     // 完成原因（STOP、LENGTH、TOOL_EXECUTION、OTHER）
metadata.tokenUsage();       // 返回包含详细 token 计数的 OpenAiOfficialTokenUsage
metadata.createdAt();        // 响应创建的时间戳
metadata.completedAt();      // 响应完成的时间戳
metadata.serviceTier();      // 请求使用的服务层级
```
