---
sidebar_position: 7
---

# Google AI Gemini

https://ai.google.dev/gemini-api/docs

## 目录

- [Maven 依赖](#maven-依赖)
- [API Key](#api-key)
- [可用模型](#可用模型)
- [GoogleAiGeminiChatModel](#googleaigeminichatmodel)
    - [配置](#配置)
- [GoogleAiGeminiStreamingChatModel](#googleaigeministreamingchatmodel)
- [工具](#工具)
- [结构化输出](#structured-outputs)
- [Python 代码执行](#python-代码执行)
- [多模态](#多模态)
- [思考](#思考)
    - [Gemini 3 Pro](#gemini-3-pro)
- [Gemini Files API](#gemini-files-api)
    - [上传文件](#上传文件)
    - [管理文件](#管理文件)
    - [文件状态](#文件状态)
- [批量处理](#批量处理)
    - [GoogleAiBatchChatModel](#googleaibatchchatmodel)
    - [创建批量任务](#创建批量任务)
    - [处理批量响应](#处理批量响应)
    - [轮询结果](#轮询结果)
    - [管理批量任务](#管理批量任务)
    - [基于文件的批量处理](#基于文件的批量处理)

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-google-ai-gemini</artifactId>
    <version>1.13.0</version>
</dependency>
```

## API 密钥 {#api-key}

在此免费获取 API Key：https://ai.google.dev/gemini-api/docs/api-key

## 可用模型

请查阅文档中的[可用模型列表](https://ai.google.dev/gemini-api/docs/models/gemini)。

* `gemini-3-pro-preview`
* `gemini-2.5-pro`
* `gemini-2.5-flash`
* `gemini-2.5-flash-lite`
* `gemini-2.0-flash`
* `gemini-2.0-flash-lite`

## GoogleAiGeminiChatModel

常用的 `chat(...)` 方法均可使用：

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    ...
    .build();

String response = gemini.chat("Hello Gemini!");
```

以及 `ChatResponse chat(ChatRequest req)` 方法：

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .build();

ChatResponse chatResponse = gemini.chat(ChatRequest.builder()
    .messages(UserMessage.from(
        "'strawberry' 这个单词里有几个 R？"))
    .build());

String response = chatResponse.aiMessage().text();
```

### 配置

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .httpClientBuilder(...)
    .defaultRequestParameters(...)
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .baseUrl(...)
    .modelName("gemini-2.5-flash")
    .maxRetries(...)
    .temperature(1.0)
    .topP(0.95)
    .topK(64)
    .seed(42)
    .frequencyPenalty(...)
    .presencePenalty(...)
    .maxOutputTokens(8192)
    .timeout(Duration.ofSeconds(60))
    .responseFormat(ResponseFormat.JSON) // 或 .responseFormat(ResponseFormat.builder()...build())
    .stopSequences(List.of(...))
    .toolConfig(GeminiFunctionCallingConfig.builder()...build()) // 或见下方
    .toolConfig(GeminiMode.ANY, List.of("fnOne", "fnTwo"))
    .allowCodeExecution(true)
    .includeCodeExecution(true)
    .logRequestsAndResponses(true)
    .safetySettings(List<GeminiSafetySetting> 或 Map<GeminiHarmCategory, GeminiHarmBlockThreshold>)
    .thinkingConfig(...)
    .returnThinking(true)
    .sendThinking(true)
    .responseLogprobs(...)
    .logprobs(...)
    .enableEnhancedCivicAnswers(...)
    .mediaResolution(GeminiMediaResolutionLevel.MEDIA_RESOLUTION_HIGH)
    .mediaResolutionPerPartEnabled(true)
    .listeners(...)
    .supportedCapabilities(...)
    .build();
```

## GoogleAiGeminiStreamingChatModel
`GoogleAiGeminiStreamingChatModel` 支持逐 token 流式传输响应文本，响应需通过 `StreamingChatResponseHandler` 处理。

```java
StreamingChatModel gemini = GoogleAiGeminiStreamingChatModel.builder()
        .apiKey(System.getenv("GEMINI_AI_KEY"))
        .modelName("gemini-2.5-flash")
        .build();

CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();

gemini.chat("讲一个关于 Java 的笑话", new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(String partialResponse) {
        System.out.print(partialResponse);
    }

    @Override
    public void onCompleteResponse(ChatResponse completeResponse) {
        futureResponse.complete(completeResponse);
    }

    @Override
    public void onError(Throwable error) {
        futureResponse.completeExceptionally(error);
    }
});

        futureResponse.join();
```

## 工具

支持工具（即函数调用），包括并行调用。可使用接受配置了一个或多个 `ToolSpecification` 的 `ChatRequest` 的 `chat(ChatRequest)` 方法，让 Gemini 知道它可以请求调用函数。也可以使用 LangChain4j 的 `AiServices` 来定义工具。

以下是使用 `AiServices` 定义天气工具的示例：

```java
record WeatherForecast(
    String location,
    String forecast,
    int temperature) {}

class WeatherForecastService {
    @Tool("获取某地点的天气预报")
    WeatherForecast getForecast(
        @P("需要获取预报的地点") String location) {
        if (location.equals("Paris")) {
            return new WeatherForecast("Paris", "sunny", 20);
        } else if (location.equals("London")) {
            return new WeatherForecast("London", "rainy", 15);
        } else if (location.equals("Tokyo")) {
            return new WeatherForecast("Tokyo", "warm", 32);
        } else {
            return new WeatherForecast("Unknown", "unknown", 0);
        }
    }
}

interface WeatherAssistant {
    String chat(String userMessage);
}

WeatherForecastService weatherForecastService =
    new WeatherForecastService();

ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .temperature(0.0)
    .build();

WeatherAssistant weatherAssistant =
    AiServices.builder(WeatherAssistant.class)
        .chatModel(gemini)
        .tools(weatherForecastService)
        .build();

String tokyoWeather = weatherAssistant.chat(
        "东京的天气预报是什么？");

System.out.println("Gemini> " + tokyoWeather);
// Gemini> 东京的天气预报是温暖的，温度为 32 度。
```

## 结构化输出 {#structured-outputs}

有关结构化输出的更多信息，请参阅[此处](/tutorials/structured-outputs)。

### 从自由文本中进行类型安全的数据提取
大型语言模型非常擅长从非结构化文本中提取结构化信息。以下示例展示了如何借助 `AiServices`，从天气预报文本中提取类型安全的 `WeatherForecast` 对象：

```java
// 代表天气预报的类型安全 / 强类型对象

record WeatherForecast(
    @Description("最低温度")
    Integer minTemperature,
    @Description("最高温度")
    Integer maxTemperature,
    @Description("降雨概率")
    boolean rain
) { }

// 与 Gemini 交互的接口契约

interface WeatherForecastAssistant {
    WeatherForecast extract(String forecast);
}

// 提取数据：

ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA) // 启用结构化输出功能必需
    .build();

WeatherForecastAssistant forecastAssistant =
    AiServices.builder(WeatherForecastAssistant.class)
        .chatModel(gemini)
        .build();

WeatherForecast forecast = forecastAssistant.extract("""
    Morning: The day dawns bright and clear in Osaka, with crisp
    autumn air and sunny skies. Expect temperatures to hover
    around 18°C (64°F) as you head out for your morning stroll
    through Namba.
    Afternoon: The sun continues to shine as the city buzzes with
    activity. Temperatures climb to a comfortable 22°C (72°F).
    Enjoy a leisurely lunch at one of Osaka's many outdoor cafes,
    or take a boat ride on the Okawa River to soak in the beautiful
    scenery.
    Evening: As the day fades, expect clear skies and a slight chill
    in the air. Temperatures drop to 15°C (59°F). A cozy dinner at a
    traditional Izakaya will be the perfect way to end your day in
    Osaka.
    Overall: A beautiful autumn day in Osaka awaits, perfect for
    exploring the city's vibrant streets, enjoying the local cuisine,
    and soaking in the sights.
    Don't forget: Pack a light jacket for the evening and wear
    comfortable shoes for all the walking you'll be doing.
    """);
```

### 响应格式 / 响应 Schema {#response-json-schema}
可以在创建 `GoogleAiGeminiChatModel` 时或调用时指定 `ResponseFormat`。

对于 JSON 格式，尤其可以通过创建相应的 Java 对象或提供原始 JSON Schema 来以编程方式定义 Schema。

#### 响应 Schema
以下示例展示了在创建 `GoogleAiGeminiChatModel` 时为食谱定义 JSON Schema 的方式，使用 `JsonObjectSchema` 类声明 JSON Schema：

```java
ResponseFormat responseFormat = ResponseFormat.builder()
        .type(ResponseFormatType.JSON)
        .jsonSchema(JsonSchema.builder() // 参见下方 [1]
                .rootElement(JsonObjectSchema.builder()
                        .addStringProperty("title")
                        .addIntegerProperty("preparationTimeMinutes")
                        .addProperty("ingredients", JsonArraySchema.builder()
                                .items(new JsonStringSchema())
                                .build())
                        .addProperty("steps", JsonArraySchema.builder()
                                .items(new JsonStringSchema())
                                .build())
                        .build())
                .build())
        .build();

ChatModel gemini = GoogleAiGeminiChatModel.builder()
        .apiKey(System.getenv("GEMINI_AI_KEY"))
        .modelName("gemini-2.5-flash")
        .responseFormat(responseFormat)
        .build();

String recipeResponse = gemini.chat("推荐一道草莓甜点食谱");

System.out.println(recipeResponse);
```
注意：
- [1] - 可以使用 `JsonSchemas.jsonSchemaFrom()` 辅助方法从类自动生成 `JsonSchema`：
```java
JsonSchema jsonSchema = JsonSchemas.jsonSchemaFrom(TripItinerary.class).get();
```

以下示例展示了在调用 `GoogleAiGeminiChatModel` 时为食谱定义 JSON Schema 的方式：
```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
        .apiKey(System.getenv("GEMINI_AI_KEY"))
        .modelName("gemini-2.5-flash")
        .build();

ResponseFormat responseFormat = ...;

ChatRequest chatRequest = ChatRequest.builder()
        .messages(UserMessage.from("推荐一道草莓甜点食谱"))
        .responseFormat(responseFormat)
        .build();

ChatResponse chatResponse = gemini.chat(chatRequest);

System.out.println(chatResponse.aiMessage().text());
```

#### 原始响应 Schema
以下示例展示了如何使用 Gemini API 的 `responseJsonSchema`，通过 `JsonRawSchema` 类提供原始 JSON Schema。请注意仅使用 Gemini API [支持的类型](https://ai.google.dev/gemini-api/docs/structured-output?example=recipe#json_schema_support)。

```
String rawSchema = """
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "birthDate": {
      "type": "string",
      "format": "date"
    },
    "preferredContactTime": {
      "type": "string",
      "format": "time"
      },
    "height": {
      "type": "number",
      "minimum": 1.83,
      "maximum": 1.88
    },
    "role": {
      "type": "string",
      "enum": ["developer", "maintainer", "researcher"]
    },
    "isAvailable": { "type": "boolean" },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "minItems": 1,
      "maxItems": 5
    },
    "address": {
      "type": "object",
      "properties": {
        "city": { "type": "string" },
        "streetName": { "type": "string" },
        "streetNumber": { "type": "string" }
      },
      "required": ["city", "streetName", "streetNumber"],
      "additionalProperties": true
    }
  },
  "required": ["name", "birthDate", "height", "role", "tags", "address"]
}
""";

JsonRawSchema jsonRawSchema = JsonRawSchema.builder().schema(rawSchema).build();
JsonSchema jsonSchema = JsonSchema.builder().rootElement(jsonRawSchema).build();
        
ResponseFormat responseFormat = ResponseFormat.builder()
        .type(ResponseFormatType.JSON)
        .jsonSchema(jsonSchema)
        .build();

GoogleAiGeminiChatModel gemini = GoogleAiGeminiChatModel.builder()
        .apiKey(GOOGLE_AI_GEMINI_API_KEY)
        .modelName("gemini-2.5-flash-lite")
        .logRequests(true)
        .logResponses(true)
        .responseFormat(responseFormat)
        .build();
        
UserMessage userMessage = UserMessage.from(
        """
           告诉我关于一位名叫夏洛克·福尔摩斯的侦探，
           他出生于 1852 年 11 月 28 日，身高超过 6 英尺。
           他是一个惹麻烦的人，积极参与志愿活动，
           居住在伦敦贝克街 221B。
           他拉小提琴，喜欢进行各种物理和化学实验。
           他接受客户，或偏好在早上 09:00 联系。
           """);

ChatResponse response = gemini.chat(ChatRequest.builder()
        .messages(userMessage)
        .build());
```

### JSON 模式

可强制 Gemini 以 JSON 格式回复：

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .responseFormat(ResponseFormat.JSON)
    .build();

String roll = gemini.chat("掷一个 6 面骰子");

System.out.println(roll);
// {"roll": "3"}
```

系统提示词可进一步描述 JSON 输出应是什么样的。Gemini 通常会遵循建议的 Schema，但不保证。如需严格应用 JSON Schema，应如上一节所述定义响应格式。


## Python 代码执行

除函数调用外，Google AI Gemini 还允许在沙盒环境中创建和执行 Python 代码。这对于需要更复杂计算或逻辑的场景特别有用。

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .allowCodeExecution(true)
    .includeCodeExecutionOutput(true)
    .build();
```

有两个构建器方法：
* `allowCodeExecution(true)`：让 Gemini 知道它可以编写 Python 代码
* `includeCodeExecutionOutput(true)`：如果想查看它生成的实际 Python 脚本及其执行输出

```java
ChatResponse mathQuizz = gemini.chat(
    SystemMessage.from("""
        你是一位数学专家。
        当遇到数学或逻辑问题时，
        你可以通过编写 Python 程序并执行它来返回结果。
        """),
    UserMessage.from("""
        实现斐波那契和阿克曼函数。
        `fibonacci(22)` - ackermann(3, 4) 的结果是什么？
        """)
);
```

Gemini 将编写一个 Python 脚本，在其服务器上执行，并返回结果。
由于我们要求查看代码和执行输出，回答将如下所示：

~~~
执行的代码：
```python
def fibonacci(n):
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)

def ackermann(m, n):
    if m == 0:
        return n + 1
    elif n == 0:
        return ackermann(m - 1, 1)
    else:
        return ackermann(m - 1, ackermann(m, n - 1))

print(fibonacci(22) - ackermann(3, 4))
```
输出：
```
17586
```
`fibonacci(22) - ackermann(3, 4)` 的结果是 **17586**。

我用 Python 实现了斐波那契和阿克曼函数。
然后调用 `fibonacci(22) - ackermann(3, 4)` 并打印结果。
~~~

如果未要求查看代码/输出，则只会收到以下文本：

```
`fibonacci(22) - ackermann(3, 4)` 的结果是 **17586**。

我用 Python 实现了斐波那契和阿克曼函数。
然后调用 `fibonacci(22) - ackermann(3, 4)` 并打印结果。
```

## 多模态

Gemini 是一个多模态模型，这意味着它不仅能接受文本，还能接受和生成多种不同的**模态**。

### 输入模态

输入方面，Gemini 支持：
* 图片（`ImageContent`）
* 视频（`VideoContent`）
* 音频文件（`AudioContent`）
* PDF 文件（`PdfFileContent`）

以下示例展示了如何将文本提示与图片混合使用：

```java
// LangChain4j 项目可爱彩色鹦鹉吉祥物的 PNG 图片
String base64Img = b64encoder.encodeToString(readBytes(
  "https://avatars.githubusercontent.com/u/132277850?v=4"));

ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .build();

ChatResponse response = gemini.chat(
    UserMessage.from(
        ImageContent.from(base64Img, "image/png"),
        TextContent.from("""
            你认为这个 Logo 与项目描述搭配得好吗？
            """)
    )
);
```

### 图片生成输出

部分 Gemini 模型（如 `gemini-2.5-flash-image`）可在响应中生成图片。生成的图片存储在 `AiMessage` 的属性中，可通过 `GeneratedImageHelper` 工具类访问。

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey("Your API Key")
    .modelName("gemini-2.5-flash-image")
    .build();

ChatResponse response = gemini.chat(UserMessage.from("一张高分辨率、工作室打光的极简哑光黑色陶瓷咖啡杯产品照片"));

// 从响应中提取生成的图片
AiMessage aiMessage = response.aiMessage();
List<Image> generatedImages = GeneratedImageHelper.getGeneratedImages(aiMessage);

if (GeneratedImageHelper.hasGeneratedImages(aiMessage)) {
    System.out.println("生成了 " + generatedImages.size() + " 张图片");
    System.out.println("文本响应：" + aiMessage.text());

    for (Image image : generatedImages) {
        String base64Data = image.base64Data();
        String mimeType = image.mimeType();
        
        // 现在可以保存图片、显示它或进一步处理
        // 例如，保存到文件：
        byte[] imageBytes = Base64.getDecoder().decode(base64Data);
        Files.write(Paths.get("generated_image.png"), imageBytes);
    }
} else {
    System.out.println("文本响应：" + aiMessage.text());
}
```

### 媒体分辨率

可控制发送给模型的媒体（图片、视频、PDF）的分辨率，可以全局设置或按部件（每张图片）设置。

#### 全局媒体分辨率

使用 `.mediaResolution()` 构建器方法为请求中的所有媒体部件设置分辨率：

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .mediaResolution(GeminiMediaResolutionLevel.MEDIA_RESOLUTION_LOW) // 或 MEDIUM、HIGH、ULTRA_HIGH、UNSPECIFIED
    .build();
```

#### 按部件媒体分辨率（Gemini 3）

使用 Gemini 3 时，可通过 `ImageContent` 中的 `DetailLevel` 为单张图片指定分辨率。先在构建器中启用此功能，然后在 `ImageContent` 上设置详细级别：

```java
ChatModel gemini = GoogleAiGeminiChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-3-pro-preview")
    .mediaResolutionPerPartEnabled(true)
    .build();

ChatResponse response = gemini.chat(
    UserMessage.from(
        ImageContent.from(url1, ImageContent.DetailLevel.LOW),
        ImageContent.from(url2, ImageContent.DetailLevel.HIGH),
        TextContent.from("比较这两张图片")
    )
);
```

支持的 `DetailLevel` 值及其与 Gemini 分辨率级别的映射：
- `LOW` -> `MEDIA_RESOLUTION_LOW`
- `MEDIUM` -> `MEDIA_RESOLUTION_MEDIUM`
- `HIGH` -> `MEDIA_RESOLUTION_HIGH`
- `ULTRA_HIGH` -> `MEDIA_RESOLUTION_ULTRA_HIGH`（最高 token 数，适用于计算机使用等特定场景）
- `AUTO` -> `MEDIA_RESOLUTION_UNSPECIFIED`

## 思考

`GoogleAiGeminiChatModel` 和 `GoogleAiGeminiStreamingChatModel` 均支持[思考](https://ai.google.dev/gemini-api/docs/thinking)功能。

以下参数控制思考行为：
- `GeminiThinkingConfig.includeThoughts` 和 `thinkingBudget`：启用思考功能，详情参见[此处](https://ai.google.dev/gemini-api/docs/thinking)。
- `returnThinking`：控制是否在 `AiMessage.thinking()` 中返回思考内容（如果可用），以及在使用 `GoogleAiGeminiStreamingChatModel` 时是否触发 `StreamingChatResponseHandler.onPartialThinking()` 和 `TokenStream.onPartialThinking()` 回调。默认禁用。若启用，思考签名也将存储在 `AiMessage.attributes()` 中并随之返回。
- `sendThinking`：控制是否将存储在 `AiMessage` 中的思考内容和签名发送给后续请求中的 LLM。默认禁用。

:::note
请注意，当 `returnThinking` 未设置（为 `null`）且 `thinkingConfig` 已设置时，思考文本将被附加到 `AiMessage.text()` 字段中的实际响应之前，并触发 `StreamingChatResponseHandler.onPartialResponse()` 而非 `StreamingChatResponseHandler.onPartialThinking()`。
:::

思考功能配置示例：
```java
GeminiThinkingConfig thinkingConfig = GeminiThinkingConfig.builder()
        .includeThoughts(true)
        .thinkingBudget(250)
        .build();

ChatModel model = GoogleAiGeminiChatModel.builder()
        .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
        .modelName("gemini-2.5-flash")
        .thinkingConfig(thinkingConfig)
        .returnThinking(true)
        .sendThinking(true)
        .build();
```

### Gemini 3 Pro

使用 Gemini 3 Pro 时，思考配置引入了**思考级别**，可选 `"low"` 或 `"high"`（默认为 high）。可在思考配置中设置级别：

```java
GoogleAiGeminiChatModel modelHigh = GoogleAiGeminiChatModel.builder()
        .modelName("gemini-3-pro-preview")
        .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
        .thinkingConfig(GeminiThinkingConfig.builder()
                .thinkingLevel(LOW) // 或 HIGH
                .build())
        .sendThinking(true)
        .returnThinking(true)
        .build();
```

可以传入字符串 `"high"` / `"low"` 或 `GeminiThinkingConfig.GeminiThinkingLevel.HIGH` / `GeminiThinkingConfig.GeminiThinkingLevel.LOW` 枚举值。

使用 Gemini 3 Pro 时，必须将 `sendThinking()` 和 `returnThinking()` 设置为 `true`，以确保[思考签名](https://ai.google.dev/gemini-api/docs/thought-signatures)被正确传递给模型。

## Gemini 文件 API {#gemini-files-api}

Gemini Files API 允许您上传和管理媒体文件，供 Gemini 模型使用。当总请求大小超过 20 MB 时尤为有用，因为文件可以单独上传并在内容生成请求中引用。

### 主要特性

- **多模态支持**：可上传图片、音频、视频和文档
- **存储**：文件存储 48 小时
- **容量**：每个项目最多 20 GB 文件，单个文件最大 2 GB
- **免费**：Files API 免费使用

### 上传文件

有两种上传文件的方式：

**从文件路径上传：**

```java
GeminiFiles filesApi = GeminiFiles.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .build();

// 从文件路径上传
Path filePath = Paths.get("path/to/your/file.pdf");
GeminiFile uploadedFile = filesApi.uploadFile(filePath, "我的文档");

System.out.println("文件已上传：" + uploadedFile.name());
System.out.println("文件 URI：" + uploadedFile.uri());
```

**从字节数组上传：**

```java
byte[] fileBytes = Files.readAllBytes(Paths.get("path/to/file.jpg"));
GeminiFile uploadedFile = filesApi.uploadFile(
    fileBytes,
    "image/jpeg",
    "我的图片"
);
```

### 管理文件

**列出所有已上传文件：**

```java
List<GeminiFile> files = filesApi.listFiles();
for (GeminiFile file : files) {
    System.out.println("文件：" + file.displayName() + " (" + file.name() + ")");
}
```

**获取文件元数据：**

```java
GeminiFile file = filesApi.getMetadata("files/abc123");
System.out.println("文件大小：" + file.sizeBytes() + " 字节");
System.out.println("MIME 类型：" + file.mimeType());
System.out.println("创建时间：" + file.createTime());
System.out.println("过期时间：" + file.expirationTime());
```

**删除文件：**

```java
filesApi.deleteFile("files/abc123");
System.out.println("文件删除成功");
```

### 文件状态

文件在其生命周期中可处于不同状态：

```java
GeminiFile file = filesApi.getMetadata("files/abc123");

if (file.isActive()) {
    System.out.println("文件已就绪");
} else if (file.isProcessing()) {
    System.out.println("文件正在处理中");
} else if (file.isFailed()) {
    System.out.println("文件处理失败");
}
```

## 批量处理

### GoogleAiBatchChatModel

`GoogleAiBatchChatModel` 提供了以异步方式大批量处理聊天请求的接口，[成本降低 50%](https://ai.google.dev/gemini-api/docs/batch-api)。非常适合无时间紧迫性的大规模任务，SLO 为 24 小时。

### 创建批量任务

**内联批量创建：**

```java
GoogleAiBatchChatModel batchModel = GoogleAiBatchChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .build();

// 创建批量请求
List<ChatRequest> requests = List.of(
    ChatRequest.builder()
        .messages(UserMessage.from("法国的首都是哪里？"))
        .build(),
    ChatRequest.builder()
        .messages(UserMessage.from("德国的首都是哪里？"))
        .build(),
    ChatRequest.builder()
        .messages(UserMessage.from("意大利的首都是哪里？"))
        .build()
);

// 提交批量任务
BatchResponse response = batchModel.createBatchInline(
    "地理问题批次",   // 显示名称
    0L,             // 优先级（可选，默认为 0）
    requests
);
```

**基于文件的批量创建：**

对于较大的批次或需要对请求格式进行更多控制的场景，可从上传的文件创建批次：

```java
// 首先上传包含批量请求的文件
GeminiFiles filesApi = GeminiFiles.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .build();

GeminiFile uploadedFile = filesApi.uploadFile(
    Paths.get("batch_chat_requests.jsonl"),
    "批量聊天请求"
);

// 等待文件激活
while (uploadedFile.isProcessing()) {
    Thread.sleep(1000);
    uploadedFile = filesApi.getMetadata(uploadedFile.name());
}

// 从文件创建批次
BatchResponse response = batchModel.createBatchFromFile(
    "我的批量任务",
    uploadedFile
);
```

### 处理批量响应

`BatchResponse` 是一个密封接口，有三种可能的状态：

```java
BatchResponse response = batchModel.createBatchInline("我的批次", null, requests);

switch (response) {
    case BatchIncomplete incomplete -> {
        System.out.println("批次状态：" + incomplete.state());
        System.out.println("批次名称：" + incomplete.batchName().value());
    }
    case BatchSuccess success -> {
        System.out.println("批次成功完成！");
        
        // 处理成功的响应
        for (ChatResponse chatResponse : success.responses()) {
            System.out.println(chatResponse.aiMessage().text());
        }
        
        // 检查批次中单个请求的错误
        if (!success.errors().isEmpty()) {
            System.out.println("部分请求失败：");
            for (var error : success.errors()) {
                System.err.println("错误码：" + error.code() + "，消息：" + error.message());
            }
        }
    }
    case BatchError error -> {
        System.err.println("批次失败：" + error.message());
        System.err.println("错误码：" + error.code());
        System.err.println("状态：" + error.state());
    }
}
```

**注意：** `BatchSuccess` 响应表示批量任务已完成，但批次中的单个请求可能已失败。`success.errors()` 列表包含所有单个请求的失败（如超时、速率限制），而 `success.responses()` 包含成功的响应。请务必同时检查两个列表以优雅地处理部分失败。


### 轮询结果

由于批量处理是异步的，需要轮询结果（结果最多可能需要 24 小时）：

```java
BatchResponse initialResponse = batchModel.createBatchInline(
    "我的批次",
    null,
    requests
);

// 提取批次名称用于轮询
BatchName batchName = switch (initialResponse) {
    case BatchIncomplete incomplete -> incomplete.batchName();
    case BatchSuccess success -> success.batchName();
    case BatchError error -> throw new RuntimeException("批次创建失败");
};

// 轮询直到完成
BatchResponse result;
do {
    Thread.sleep(5000); // 每次轮询等待 5 秒
    result = batchModel.retrieveBatchResults(batchName);
} while (result instanceof BatchIncomplete);

// 处理最终结果
if (result instanceof BatchSuccess success) {
    System.out.println("成功响应数：" + success.responses().size());
    for (ChatResponse chatResponse : success.responses()) {
        System.out.println(chatResponse.aiMessage().text());
    }
    
    // 处理单个请求失败
    if (!success.errors().isEmpty()) {
        System.out.println("失败请求数：" + success.errors().size());
        for (var error : success.errors()) {
            System.err.println("错误：" + error.code() + " - " + error.message());
        }
    }
} else if (result instanceof BatchError error) {
    System.err.println("批次失败：" + error.message());
}
```

### 管理批量任务

**取消批量任务：**

```java
BatchName batchName = // ... 从 createBatchInline 获取

try {
    batchModel.cancelBatchJob(batchName);
    System.out.println("批次取消成功");
} catch (HttpException e) {
    System.err.println("批次取消失败：" + e.getMessage());
}
```

**删除批量任务：**

```java
batchModel.deleteBatchJob(batchName);
System.out.println("批次删除成功");
```

**列出批量任务：**

```java
// 列出第一页批量任务
BatchList<ChatResponse> batchList = batchModel.listBatchJobs(10, null);

for (BatchResponse<ChatResponse> batch : batchList.batches()) {
    System.out.println("批次：" + batch);
}

// 如果有下一页
if (batchList.nextPageToken() != null) {
    BatchList<ChatResponse> nextPage = batchModel.listBatchJobs(10, batchList.nextPageToken());
}
```

### 基于文件的批量处理

对于高级用例，可将批量请求写入 JSONL 文件并上传：

```java
// 创建包含批量请求的 JSONL 文件
Path batchFile = Files.createTempFile("batch", ".jsonl");

try (JsonLinesWriter writer = new StreamingJsonLinesWriter(batchFile)) {
    List<BatchFileRequest<ChatRequest>> fileRequests = List.of(
        new BatchFileRequest<>("request-1", ChatRequest.builder()
            .messages(UserMessage.from("问题 1"))
            .build()),
        new BatchFileRequest<>("request-2", ChatRequest.builder()
            .messages(UserMessage.from("问题 2"))
            .build())
    );
    
    batchModel.writeBatchToFile(writer, fileRequests);
}

// 上传文件
GeminiFiles filesApi = GeminiFiles.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .build();

GeminiFile uploadedFile = filesApi.uploadFile(batchFile, "批量聊天请求");

// 从文件创建批次
BatchResponse response = batchModel.createBatchFromFile(
    "基于文件的聊天批次",
    uploadedFile
);
```

### 批量任务状态

`BatchJobState` 枚举代表批量任务的可能状态：

- `BATCH_STATE_PENDING`：批次已排队，等待处理
- `BATCH_STATE_RUNNING`：批次正在处理中
- `BATCH_STATE_SUCCEEDED`：批次成功完成
- `BATCH_STATE_FAILED`：批次处理失败
- `BATCH_STATE_CANCELLED`：批次已被用户取消
- `BATCH_STATE_EXPIRED`：批次在完成前已过期
- `UNSPECIFIED`：状态未知或未提供

### 设置批次优先级

优先级较高的批次将优先于优先级较低的批次处理：

```java
// 高优先级批次
BatchResponse highPriorityResponse = batchModel.createBatchInline(
    "紧急批次",
    100L,  // 高优先级
    urgentRequests
);

// 低优先级批次
BatchResponse lowPriorityResponse = batchModel.createBatchInline(
    "后台批次",
    -50L,  // 低优先级
    backgroundRequests
);
```

### 配置

`GoogleAiBatchChatModel` 支持与 `GoogleAiGeminiChatModel` 相同的配置选项：

```java
GoogleAiBatchChatModel batchModel = GoogleAiBatchChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .temperature(0.7)
    .topP(0.95)
    .topK(40)
    .maxOutputTokens(2048)
    .maxRetries(3)
    .timeout(Duration.ofMinutes(5))
    .logRequestsAndResponses(true)
    .build();
```

### 重要限制

- **模型一致性**：批次中的所有请求必须使用相同的模型
- **大小限制**：内联 API 支持总请求大小不超过 20 MB
- **成本**：与实时请求相比，批量处理可节省 50% 成本
- **交付时间**：24 小时 SLO，实际完成通常更快
- **适用场景**：最适合大规模、非紧急的任务，如数据预处理或评估


### 示例：完整工作流

```java
GoogleAiBatchChatModel batchModel = GoogleAiBatchChatModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-2.5-flash")
    .build();

// 准备批量请求
List<ChatRequest> requests = new ArrayList<>();
for (int i = 0; i < 50; i++) {
    requests.add(ChatRequest.builder()
        .messages(UserMessage.from("生成一个创意故事点子 #" + i))
        .build());
}

// 提交批次
BatchResponse response = batchModel.createBatchInline(
    "故事点子批次",
    0L,
    requests
);

// 获取批次名称
BatchName batchName = switch (response) {
    case BatchIncomplete incomplete -> incomplete.batchName();
    case BatchSuccess success -> success.batchName();
    case BatchError error -> throw new RuntimeException("失败：" + error.message());
};

// 轮询直到完成
BatchResponse finalResult;
int attempts = 0;
int maxAttempts = 720; // 每 5 秒一次，共 1 小时

do {
    if (attempts++ >= maxAttempts) {
        throw new RuntimeException("批量处理超时");
    }
    Thread.sleep(5000);
    finalResult = batchModel.retrieveBatchResults(batchName);
    
    if (finalResult instanceof BatchIncomplete incomplete) {
        System.out.println("状态：" + incomplete.state());
    }
} while (finalResult instanceof BatchIncomplete);

// 处理结果
if (finalResult instanceof BatchSuccess success) {
    System.out.println("生成了 " + success.responses().size() + " 个故事");
    for (int i = 0; i < success.responses().size(); i++) {
        ChatResponse chatResponse = success.responses().get(i);
        System.out.println("故事 #" + i + "：" + chatResponse.aiMessage().text());
    }
    
    // 报告失败
    if (!success.errors().isEmpty()) {
        System.err.println(success.errors().size() + " 个请求失败：");
        for (var error : success.errors()) {
            System.err.println("  - 代码 " + error.code() + "：" + error.message());
        }
    }
} else if (finalResult instanceof BatchError error) {
    System.err.println("批次失败：" + error.message());
}
```

## 了解更多

如果您想了解更多关于 Google AI Gemini 模型的信息，请查阅其[文档](https://ai.google.dev/gemini-api/docs/models/gemini)。
