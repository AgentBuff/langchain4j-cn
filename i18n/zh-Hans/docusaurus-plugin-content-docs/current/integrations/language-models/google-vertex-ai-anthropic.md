---
sidebar_position: 9
---

# Google Vertex AI Anthropic

## 简介

Google Cloud 的 Model Garden 提供了对 Anthropic Claude 系列模型的访问，包括 Claude Opus 4、Sonnet 4 和 Haiku 等。

## 前提条件

1. **Google Cloud 账号及项目**：确保拥有一个已启用计费功能的 Google Cloud 项目。
2. **启用 Vertex AI API**。
3. **在 Model Garden 中启用 Claude 模型**：
   - 访问 [Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden)
   - 搜索 "Claude"，选择需要使用的 Claude 模型
   - 点击 "Enable"

## 认证

可使用以下两种方式之一进行认证：

### 通过 gcloud CLI 认证

```bash
gcloud auth application-default login
```

### 通过服务账号认证

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-vertex-ai-anthropic</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## 使用 `VertexAiAnthropicChatModel`

```java
VertexAiAnthropicChatModel model = VertexAiAnthropicChatModel.builder()
        .project("your-project-id")
        .location("us-east5")
        .modelName("claude-sonnet-4-20250514")
        .maxTokens(1024)
        .build();

String response = model.chat("讲一个关于 Java 程序员的笑话");
System.out.println(response);
```

## 使用 `VertexAiAnthropicStreamingChatModel`

```java
VertexAiAnthropicStreamingChatModel model = VertexAiAnthropicStreamingChatModel.builder()
        .project("your-project-id")
        .location("us-east5")
        .modelName("claude-sonnet-4-20250514")
        .maxTokens(1024)
        .build();

model.chat("讲一个关于 Java 程序员的笑话", new StreamingChatResponseHandler() {
    @Override
    public void onPartialResponse(String partialResponse) {
        System.out.print(partialResponse);
    }

    @Override
    public void onCompleteResponse(ChatResponse completeResponse) {
        System.out.println("\n完成！");
    }

    @Override
    public void onError(Throwable error) {
        error.printStackTrace();
    }
});
```

### 使用 Lambda 简化流式处理

```java
model.chat("讲一个笑话",
        LambdaStreamingResponseHandler.onPartialResponse(System.out::print));
```

## 配置参数

| 参数 | 说明 |
|---|---|
| `project` | Google Cloud 项目 ID |
| `location` | 模型部署区域（如 `us-east5`） |
| `modelName` | Claude 模型名称 |
| `maxTokens` | 最大输出 token 数 |
| `temperature` | 采样温度（0 到 1） |
| `topP` | 核采样参数 |
| `topK` | 采样时考虑的候选 token 数 |
| `stopSequences` | 停止序列列表 |
| `enablePromptCaching` | 是否启用提示缓存 |
| `credentials` | 自定义 GoogleCredentials |

## 视觉能力

可通过 `ImageContent` 和 `TextContent` 传入图片：

```java
var imageContent = ImageContent.from(
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/JPEG_example_flower.jpg/800px-JPEG_example_flower.jpg",
        "image/jpeg"
);
var textContent = TextContent.from("这张图片里有什么？");

UserMessage userMessage = UserMessage.from(imageContent, textContent);
ChatResponse response = model.chat(userMessage);
```

## 工具调用

可使用 `ToolSpecification` 和 `JsonObjectSchema` 定义工具：

```java
ToolSpecification calculatorTool = ToolSpecification.builder()
        .name("calculator")
        .description("执行基本算术运算")
        .parameters(JsonObjectSchema.builder()
                .addStringProperty("expression", "要求值的数学表达式")
                .required("expression")
                .build())
        .build();

ChatRequest request = ChatRequest.builder()
        .messages(UserMessage.from("3 加 4 等于多少？"))
        .toolSpecifications(calculatorTool)
        .build();
```

## 使用 AiServices 和工具

```java
interface MathAssistant {
    String calculate(String expression);
}

static class Calculator {
    @Tool("执行基本算术运算")
    double evaluate(@P("要求值的数学表达式") String expression) {
        return new ExpressionParser().evaluate(expression);
    }
}

VertexAiAnthropicChatModel model = VertexAiAnthropicChatModel.builder()
        .project("your-project-id")
        .location("us-east5")
        .modelName("claude-sonnet-4-20250514")
        .build();

MathAssistant assistant = AiServices.builder(MathAssistant.class)
        .chatModel(model)
        .tools(new Calculator())
        .build();

String result = assistant.calculate("2 + 2");
```

## 提示缓存

通过设置 `enablePromptCaching(true)` 启用提示缓存，可降低长提示词的延迟和成本：

```java
VertexAiAnthropicChatModel model = VertexAiAnthropicChatModel.builder()
        .project("your-project-id")
        .location("us-east5")
        .modelName("claude-opus-4-20250514")
        .enablePromptCaching(true)
        .build();
```

## 自定义认证

```java
import com.google.auth.oauth2.GoogleCredentials;

GoogleCredentials credentials = GoogleCredentials.fromStream(
        new FileInputStream("/path/to/service-account.json"))
        .createScoped("https://www.googleapis.com/auth/cloud-platform");

VertexAiAnthropicChatModel model = VertexAiAnthropicChatModel.builder()
        .project("your-project-id")
        .location("us-east5")
        .modelName("claude-sonnet-4-20250514")
        .credentials(credentials)
        .build();
```

## 参考资料

- [可用区域](https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude#regions)
- [Claude 模型文档](https://docs.anthropic.com/en/docs/about-claude/models/all-models)
- [Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden)
