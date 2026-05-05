---
sidebar_position: 2
---

# Anthropic

- [Anthropic 文档](https://docs.anthropic.com/claude/docs)
- [Anthropic API 参考](https://docs.anthropic.com/claude/reference)

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-anthropic</artifactId>
    <version>1.13.0</version>
</dependency>
```

## AnthropicChatModel

```java
AnthropicChatModel model = AnthropicChatModel.builder()
    .apiKey(System.getenv("ANTHROPIC_API_KEY"))
    .modelName(CLAUDE_3_5_SONNET_20240620)
    .build();
String answer = model.chat("说'Hello World'");
System.out.println(answer);
```

### 自定义 AnthropicChatModel
```java
AnthropicChatModel model = AnthropicChatModel.builder()
    .httpClientBuilder(...)
    .baseUrl(...)
    .apiKey(...)
    .version(...)
    .beta(...)
    .modelName(...)
    .temperature(...)
    .topP(...)
    .topK(...)
    .maxTokens(...)
    .stopSequences(...)
    .toolSpecifications(...)
    .toolChoice(...)
    .toolChoiceName(...)
    .disableParallelToolUse(...)
    .serverTools(...)
    .returnServerToolResults(...)
    .toolMetadataKeysToSend(...)
    .cacheSystemMessages(...)
    .cacheTools(...)
    .thinkingType(...)
    .thinkingBudgetTokens(...)
    .returnThinking(...)
    .sendThinking(...)
    .timeout(...)
    .maxRetries(...)
    .logRequests(...)
    .logResponses(...)
    .listeners(...)
    .defaultRequestParameters(...)
    .userId(...)
    .customParameters(...)
    .build();
```
部分参数说明请参阅[此处](https://docs.anthropic.com/claude/reference/messages_post)。

## AnthropicStreamingChatModel
```java
AnthropicStreamingChatModel model = AnthropicStreamingChatModel.builder()
    .apiKey(System.getenv("ANTHROPIC_API_KEY"))
    .modelName(CLAUDE_3_5_SONNET_20240620)
    .build();

model.chat("说'Hello World'", new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(String partialResponse) {
        // 当新的部分响应可用时调用此方法，可包含一个或多个 token
    }

    @Override
    public void onCompleteResponse(ChatResponse completeResponse) {
        // 模型完成响应时调用此方法
    }

    @Override
    public void onError(Throwable error) {
        // 发生错误时调用此方法
    }
});
```

### 自定义 AnthropicStreamingChatModel

与 `AnthropicChatModel` 相同，参见上文。

## 工具

Anthropic 在流式和非流式模式下均支持[工具](/tutorials/tools)。

Anthropic 关于工具的文档请参阅[此处](https://docs.anthropic.com/claude/docs/tool-use)。


## 工具选择

Anthropic 的[工具选择](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implement-tool-use#forcing-tool-use)功能
在流式和非流式交互中均可使用，通过设置 `toolChoice(ToolChoice)` 或 `toolChoiceName(String)` 实现。

## 并行工具使用

默认情况下，Anthropic Claude 可能使用多个工具来回答用户查询，
但可通过设置 `disableParallelToolUse(true)` 禁用[并行工具](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implement-tool-use#parallel-tool-use)。

## 服务器工具

Anthropic 的[服务器工具](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview#server-tools)
通过 `serverTools` 参数支持，以下是使用[网络搜索工具](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)的示例：
```java
AnthropicServerTool webSearchTool = AnthropicServerTool.builder()
        .type("web_search_20250305")
        .name("web_search")
        .addAttribute("max_uses", 5)
        .addAttribute("allowed_domains", List.of("accuweather.com"))
        .build();

ChatModel model = AnthropicChatModel.builder()
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .modelName("claude-sonnet-4-5")
        .serverTools(webSearchTool)
        .logRequests(true)
        .logResponses(true)
        .build();

String answer = model.chat("慕尼黑的天气怎么样？");
```

通过 `serverTools` 指定的工具将包含在每次发往 Anthropic API 的请求中。

### 获取服务器工具结果

要访问服务器工具的原始结果（如网络搜索结果、代码执行输出、生成文件的 fileId 等），
请启用 `returnServerToolResults(true)`。
结果将在 `AiMessage.attributes()` 中以键 `"server_tool_results"` 存储：

```java
ChatModel model = AnthropicChatModel.builder()
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .modelName("claude-sonnet-4-5")
        .serverTools(webSearchTool)
        .returnServerToolResults(true)
        .build();

ChatResponse response = model.chat("慕尼黑的天气怎么样？");
AiMessage aiMessage = response.aiMessage();

List<AnthropicServerToolResult> results = aiMessage.attribute("server_tool_results", List.class);
for (AnthropicServerToolResult result : results) {
    System.out.println("类型：" + result.type());
    System.out.println("工具使用 ID：" + result.toolUseId());
    System.out.println("内容：" + result.content());
}
```

此功能默认禁用，以避免在 ChatMemory 中存储可能较大的数据。

## 工具搜索工具

Anthropic 的[工具搜索工具](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool)
通过 `serverTools`、工具 `metadata` 和 `toolMetadataKeysToSend` 参数支持。

以下是使用高级 AI Service 和 `@Tool` API 的示例：

```java
AnthropicServerTool toolSearchTool = AnthropicServerTool.builder()
        .type("tool_search_tool_regex_20251119")
        .name("tool_search_tool_regex")
        .build();

class Tools {

    @Tool(metadata = "{\"defer_loading\": true}")
    String getWeather(String location) {
        return "sunny";
    }

    @Tool
    String getTime(String location) {
        return "12:34:56";
    }
}

ChatModel chatModel = AnthropicChatModel.builder()
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .modelName(CLAUDE_SONNET_4_5_20250929)
        .beta("advanced-tool-use-2025-11-20")
        .serverTools(toolSearchTool)
        .toolMetadataKeysToSend("defer_loading") // 需要显式指定
        .logRequests(true)
        .logResponses(true)
        .build();

interface Assistant {

    @SystemMessage("如有需要，请使用工具搜索")
    String chat(String userMessage);
}

Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .tools(new Tools())
        .build();

assistant.chat("慕尼黑的天气怎么样？");
```

以下是使用低级 `ChatModel` 和 `ToolSpecification` API 的示例：
```java
AnthropicServerTool toolSearchTool = AnthropicServerTool.builder()
        .type("tool_search_tool_regex_20251119")
        .name("tool_search_tool_regex")
        .build();

Map<String, Object> toolMetadata = Map.of("defer_loading", true);

ToolSpecification weatherTool = ToolSpecification.builder()
        .name("get_weather")
        .parameters(JsonObjectSchema.builder()
                .addStringProperty("location")
                .required("location")
                .build())
        .metadata(toolMetadata)
        .build();

ToolSpecification timeTool = ToolSpecification.builder()
        .name("get_time")
        .parameters(JsonObjectSchema.builder()
                .addStringProperty("location")
                .required("location")
                .build())
        .build();

ChatModel model = AnthropicChatModel.builder()
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .modelName(CLAUDE_SONNET_4_5_20250929)
        .beta("advanced-tool-use-2025-11-20")
        .serverTools(toolSearchTool)
        .toolMetadataKeysToSend(toolMetadata.keySet()) // 需要显式指定
        .logRequests(true)
        .logResponses(true)
        .build();

ChatRequest chatRequest = ChatRequest.builder()
        .messages(UserMessage.from("慕尼黑的天气怎么样？如有需要请使用工具搜索。"))
        .toolSpecifications(weatherTool, timeTool)
        .build();

ChatResponse chatResponse = model.chat(chatRequest);
```

### 编程式工具调用

Anthropic 的[编程式工具调用](https://www.anthropic.com/engineering/advanced-tool-use)
通过 `serverTools`、工具 `metadata` 和 `toolMetadataKeysToSend` 参数支持。

以下是使用高级 AI Service 和 `@Tool` API 的示例：

```java
AnthropicServerTool codeExecutionTool = AnthropicServerTool.builder()
        .type("code_execution_20250825")
        .name("code_execution")
        .build();

class Tools {

    static final String TOOL_METADATA = "{\"allowed_callers\": [\"code_execution_20250825\"]}";
    static final String TOOL_DESCRIPTION = """
            返回指定城市指定天数内记录的每日最低和最高温度。
            响应格式：[{"min":0.0,"max":10.0},{"min":0.0,"max":20.0},{"min":0.0,"max":30.0}]
            """;

    record TemperatureRange(double min, double max) {}

    @Tool(value = TOOL_DESCRIPTION, metadata = TOOL_METADATA)
    List<TemperatureRange> getDailyTemperatures(String city, int days) {
        if ("Munich".equals(city) && days == 5) {
            return List.of(
                    new TemperatureRange(0.0, 1.0),
                    new TemperatureRange(0.0, 2.0),
                    new TemperatureRange(0.0, 3.0),
                    new TemperatureRange(0.0, 4.0),
                    new TemperatureRange(0.0, 5.0)
            );
        }

        throw new IllegalArgumentException("未知城市：" + city + " 或天数：" + days);
    }

    @Tool(value = "计算指定数字列表的平均值", metadata = TOOL_METADATA)
    Double average(List<Double> numbers) {
        return numbers.stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElseThrow();
    }
}

ChatModel chatModel = AnthropicChatModel.builder()
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .modelName(CLAUDE_SONNET_4_5_20250929)
        .beta("advanced-tool-use-2025-11-20")
        .serverTools(codeExecutionTool)
        .toolMetadataKeysToSend("allowed_callers") // 需要显式指定
        .logRequests(true)
        .logResponses(true)
        .build();

interface Assistant {

    String chat(String userMessage);
}

Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .tools(new Tools())
        .build();

assistant.chat("慕尼黑过去 5 天的平均最高温度是多少？");
```

有关在低级 `ToolSpecification` API 中指定工具 `metadata` 的示例，
请参阅[工具搜索工具](#工具搜索工具)部分。

### 工具使用示例

Anthropic 的[工具使用示例](https://www.anthropic.com/engineering/advanced-tool-use)
通过工具 `metadata` 和 `toolMetadataKeysToSend` 参数支持。

以下是使用高级 AI Service 和 `@Tool` API 的示例：

```java
enum Unit {
    CELSIUS, FAHRENHEIT
}

class Tools {

    // 注意：如果未启用 javac 的 "-parameters" 选项，需要将 TOOL_METADATA 中的 "location" 改为 "arg0"，"unit" 改为 "arg1"
    public static final String TOOL_METADATA = """
            {
                "input_examples": [
                    {
                        "location": "San Francisco, CA",
                        "unit": "FAHRENHEIT"
                    },
                    {
                        "location": "Tokyo, Japan",
                        "unit": "CELSIUS"
                    },
                    {
                        "location": "New York, NY"
                    }
                ]
            }
            """;

    @Tool(metadata = TOOL_METADATA)
    String getWeather(String location, @P(value = "温度单位", required = false) Unit unit) {
        return "sunny";
    }
}

ChatModel chatModel = AnthropicChatModel.builder()
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .modelName(CLAUDE_SONNET_4_5_20250929)
        .beta("advanced-tool-use-2025-11-20")
        .toolMetadataKeysToSend("input_examples") // 需要显式指定
        .logRequests(true)
        .logResponses(true)
        .build();

interface Assistant {

    String chat(String userMessage);
}

Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .tools(new Tools())
        .build();

assistant.chat("慕尼黑的天气（华氏温度）是多少？");
```

有关在低级 `ToolSpecification` API 中指定工具 `metadata` 的示例，
请参阅[工具搜索工具](#工具搜索工具)部分。

## 缓存

`AnthropicChatModel` 和 `AnthropicStreamingChatModel` 支持系统消息和工具的缓存。
缓存默认禁用，可分别通过设置 `cacheSystemMessages` 和 `cacheTools` 参数启用。

启用后，`cache_control` 块将分别添加到最后一条系统消息和工具中。

`AnthropicChatModel` 和 `AnthropicStreamingChatModel` 在响应中返回包含
`cacheCreationInputTokens` 和 `cacheReadInputTokens` 的 `AnthropicTokenUsage`。

更多缓存信息请参阅[此处](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)。

### 缓存用户消息

要为 `UserMessage` 启用提示缓存，需将 `cache_control` 属性设置为 `ephemeral`。
缓存控制标记将自动应用于消息的最后一个内容块。

```java
UserMessage userMessage = UserMessage.from("Hello cached world");
userMessage.attributes().put("cache_control", "ephemeral");
```

## 思考

`AnthropicChatModel` 和 `AnthropicStreamingChatModel` 均支持
[思考](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)功能。

由以下参数控制：
- `thinkingType` 和 `thinkingBudgetTokens`：启用思考功能，
  详情参见[此处](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)。
- `returnThinking`：控制是否在 `AiMessage.thinking()` 中返回思考内容（如果可用），
  以及在使用 `BedrockStreamingChatModel` 时是否触发 `StreamingChatResponseHandler.onPartialThinking()` 和 `TokenStream.onPartialThinking()` 回调。
  默认禁用。若启用，思考签名也将存储在 `AiMessage.attributes()` 中并随之返回。
- `sendThinking`：控制是否将存储在 `AiMessage` 中的思考内容和签名发送给后续请求中的 LLM。
  默认启用。

思考功能配置示例：
```java
ChatModel model = AnthropicChatModel.builder()
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .modelName("claude-sonnet-4-5-20250929")
        .thinkingType("enabled")
        .thinkingBudgetTokens(1024)
        .maxTokens(1024 + 100)
        .returnThinking(true)
        .sendThinking(true)
        .build();
```

## PDF 支持

Anthropic Claude 支持处理 PDF 文档，可通过 URL 或 Base64 编码数据发送 PDF。

### 通过 URL 发送 PDF
```java
UserMessage message = UserMessage.from(
    PdfFileContent.from(URI.create("https://example.com/document.pdf")),
    TextContent.from("这份文件的主要结论是什么？")
);

ChatResponse response = model.chat(message);
```

### 通过 Base64 发送 PDF
```java
String base64Data = Base64.getEncoder().encodeToString(Files.readAllBytes(Path.of("document.pdf")));

UserMessage message = UserMessage.from(
    PdfFileContent.from(base64Data, "application/pdf"),
    TextContent.from("总结这份文件。")
);

ChatResponse response = model.chat(message);
```

更多 PDF 支持信息请参阅[此处](https://docs.anthropic.com/en/docs/build-with-claude/pdf-support)。

## 设置自定义聊天请求参数

在构建 `AnthropicChatModel` 和 `AnthropicStreamingChatModel` 时，
可在 HTTP 请求的 JSON 请求体中配置自定义参数。
以下示例展示如何启用[上下文编辑](https://docs.claude.com/en/docs/build-with-claude/context-editing)：
```java
record Edit(String type) {}
record ContextManagement(List<Edit> edits) { }
Map<String, Object> customParameters = Map.of("context_management", new ContextManagement(List.of(new Edit("clear_tool_uses_20250919"))));

ChatModel model = AnthropicChatModel.builder()
    .apiKey(System.getenv("ANTHROPIC_API_KEY"))
    .modelName(CLAUDE_SONNET_4_5_20250929)
    .beta("context-management-2025-06-27")
    .customParameters(customParameters)
    .logRequests(true)
    .logResponses(true)
    .build();

String answer = model.chat("你好");
```

这将生成如下请求体的 HTTP 请求：
```json
{
    "model" : "claude-sonnet-4-5-20250929",
    "messages" : [ {
        "role" : "user",
        "content" : [ {
            "type" : "text",
            "text" : "你好"
        } ]
    } ],
    "context_management" : {
        "edits" : [ {
            "type" : "clear_tool_uses_20250919"
        } ]
    }
}
```

自定义参数也可以用嵌套 Map 的方式指定：
```java
Map<String, Object> customParameters = Map.of(
        "context_management",
        Map.of("edits", List.of(Map.of("type", "clear_tool_uses_20250919")))
);
```

## 访问原始 HTTP 响应和服务器发送事件（SSE）

使用 `AnthropicChatModel` 时，可访问原始 HTTP 响应：
```java
SuccessfulHttpResponse rawHttpResponse = ((AnthropicChatResponseMetadata) chatResponse.metadata()).rawHttpResponse();
System.out.println(rawHttpResponse.body());
System.out.println(rawHttpResponse.headers());
System.out.println(rawHttpResponse.statusCode());
```

使用 `AnthropicStreamingChatModel` 时，可访问原始 HTTP 响应（同上）和原始服务器发送事件：
```java
List<ServerSentEvent> rawServerSentEvents = ((AnthropicChatResponseMetadata) chatResponse.metadata()).rawServerSentEvents();
System.out.println(rawServerSentEvents.get(0).data());
System.out.println(rawServerSentEvents.get(0).event());
```

## AnthropicTokenCountEstimator

```java
TokenCountEstimator tokenCountEstimator = AnthropicTokenCountEstimator.builder()
        .modelName(CLAUDE_3_OPUS_20240229)
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .logRequests(true)
        .logResponses(true)
        .build();

List<ChatMessage> messages = List.of(...);

int tokenCount = tokenCountEstimator.estimateTokenCountInMessages(messages);
```

## Quarkus

详情请参阅[此处](https://docs.quarkiverse.io/quarkus-langchain4j/dev/anthropic.html)。

## Spring Boot

引入 Anthropic 的 Spring Boot Starter：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-anthropic-spring-boot-starter</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

配置 `AnthropicChatModel` Bean：
```
langchain4j.anthropic.chat-model.api-key = ${ANTHROPIC_API_KEY}
```

配置 `AnthropicStreamingChatModel` Bean：
```
langchain4j.anthropic.streaming-chat-model.api-key = ${ANTHROPIC_API_KEY}
```


## 示例

- [AnthropicChatModelTest](https://github.com/langchain4j/langchain4j-examples/blob/main/anthropic-examples/src/main/java/AnthropicChatModelTest.java)
- [AnthropicStreamingChatModelTest](https://github.com/langchain4j/langchain4j-examples/blob/main/anthropic-examples/src/main/java/AnthropicStreamingChatModelTest.java)
- [AnthropicToolsTest](https://github.com/langchain4j/langchain4j-examples/blob/main/anthropic-examples/src/main/java/AnthropicToolsTest.java)
- [AnthropicPdfExample](https://github.com/langchain4j/langchain4j-examples/blob/main/anthropic-examples/src/main/java/AnthropicPdfExample.java)
