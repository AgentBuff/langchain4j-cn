---
sidebar_position: 7
title: Java 工具调用 Function Calling 教程 | LangChain4j
description: 用 @Tool 注解把 Java 方法暴露给 LLM，LangChain4j 自动生成 JSON Schema、调度工具调用并完成参数绑定，兼容 OpenAI、Gemini、Claude、通义千问、Ollama 等。
keywords:
  - LangChain4j Tools
  - Java Function Calling
  - Java 工具调用
  - "@Tool 注解"
  - LLM Tool Use
image: /img/docusaurus-social-card.jpg
---

# 工具调用

有些 LLM 除了生成文本之外，还可以触发动作。

:::note
所有支持 tools 的 LLM 可在[这里](/integrations/language-models)查看（参见 “Tools” 列）。
:::

:::note
并不是所有 LLM 对 tools 的支持都同样成熟。
模型是否能够理解、选择并正确使用工具，很大程度上取决于具体模型及其能力。
有些模型可能完全不支持 tools，而另一些模型则可能需要更精细的 prompt engineering
或额外的 system instructions。
:::

这里有一个概念叫做 “tools”，也叫 “function calling”。
它允许 LLM 在必要时调用一个或多个可用工具，而这些工具通常由开发者定义。
工具可以是任何东西：网页搜索、外部 API 调用，或者执行某段特定代码等。
LLM 本身并不能真正执行工具；相反，它会在响应中表达“想要调用某个工具”的意图
（而不是直接返回普通文本）。
随后，开发者需要根据它提供的参数真正执行这个工具，
并把工具执行结果再反馈给模型。

例如，我们知道 LLM 自身并不擅长数学。
如果你的场景里偶尔需要做数学计算，你可能会想给 LLM 提供一个“数学工具”。
当你在发给 LLM 的请求中声明一个或多个工具后，
模型就可以在它认为合适的时候决定调用其中之一。
给定一道数学题，再加上一组数学工具，LLM 可能会判断：
为了正确回答这个问题，它应该先调用其中某个数学工具。

下面看看实际效果（有工具和没有工具时的区别）。

没有工具时的消息交换示例：
```
Request:
- messages:
    - UserMessage:
        - text: 475695037565 的平方根是多少？

Response:
- AiMessage:
    - text: 475695037565 的平方根大约是 689710。
```
接近，但不正确。

如果提供如下工具：
```java
@Tool("对两个给定数字求和")
double sum(double a, double b) {
    return a + b;
}

@Tool("返回给定数字的平方根")
double squareRoot(double x) {
    return Math.sqrt(x);
}
```

```
Request 1:
- messages:
    - UserMessage:
        - text: 475695037565 的平方根是多少？
- tools:
    - sum(double a, double b): 对两个给定数字求和
    - squareRoot(double x): 返回给定数字的平方根

Response 1:
- AiMessage:
    - toolExecutionRequests:
        - squareRoot(475695037565)


... 此处我们执行了 squareRoot 方法，参数是 "475695037565"，得到结果 "689706.486532" ...


Request 2:
- messages:
    - UserMessage:
        - text: 475695037565 的平方根是多少？
    - AiMessage:
        - toolExecutionRequests:
            - squareRoot(475695037565)
    - ToolExecutionResultMessage:
        - text: 689706.486532

Response 2:
- AiMessage:
    - text: 475695037565 的平方根是 689706.486532。
```

如你所见，当 LLM 可以访问工具时，它就能在合适的时候决定调用其中某个工具。

这是一个非常强大的能力。
在这个简单示例中，我们提供的是基础数学工具；
但想象一下，如果我们给它 `googleSearch` 和 `sendEmail` 两个工具，
再给出这样的请求：
“我朋友想知道 AI 领域最近的新闻。把简短总结发到 friend@email.com。”
那么它就可以先调用 `googleSearch` 获取最新资讯，
然后进行总结，再通过 `sendEmail` 把总结发出去。

:::note
为了提高 LLM 用正确参数调用正确工具的概率，
我们应尽可能清晰、无歧义地提供以下信息：
- 工具名称
- 工具做什么，以及何时应该使用它
- 每个工具参数的说明

一个经验法则是：如果一个人类能理解这个工具的用途和用法，
那么 LLM 大概率也能理解。
:::

LLM 在训练时通常会专门针对“什么时候该调用工具、该如何调用工具”做额外微调。
有些模型甚至可以一次调用多个工具，例如
[OpenAI](https://platform.openai.com/docs/guides/function-calling/parallel-function-calling)。

:::note
请注意，并不是所有模型都支持 tools。
具体哪些模型支持 tools，请查看[这个页面](https://docs.langchain4j.dev/integrations/language-models/)中的 “Tools” 列。
:::

:::note
还请注意，tools / function calling 和 [JSON mode](/tutorials/ai-services#json-mode) 并不是同一回事。
:::

# 两个抽象层级

LangChain4j 为 tools 提供了两个抽象层级：
- 低层：使用 `ChatModel` 与 `ToolSpecification` API
- 高层：使用 [AI Services](/tutorials/ai-services) 和带 `@Tool` 注解的 Java 方法

## 低层 Tool API {#low-level-tool-api}

在低层，你可以使用 `ChatModel` 的 `chat(ChatRequest)` 方法。
`StreamingChatModel` 中也提供了类似的方法。

在创建 `ChatRequest` 时，你可以指定一个或多个 `ToolSpecification`。

`ToolSpecification` 是一个对象，包含工具的全部信息：
- 工具的 `name`
- 工具的 `description`
- 工具的 `parameters` 及其说明
- 工具的 `metadata`
  默认情况下，这些 metadata 不会发给 LLM 提供商；
  你必须在创建 `ChatModel` 时显式指定哪些 metadata key 应该被发送。
  目前 tool metadata 仅由 `langchain4j-anthropic` 模块支持。
  当工具由 [McpToolProvider](/tutorials/mcp#mcp-tool-provider) 提供时，
  `metadata` 还可能包含 MCP 特有条目。

建议尽可能为工具提供充分的信息：
例如清晰的名称、完整的描述，以及每个参数的说明等。

### 创建 Tool Specification

创建 `ToolSpecification` 有两种方式：

1. 手工创建
```java
ToolSpecification toolSpecification = ToolSpecification.builder()
    .name("getWeather")
    .description("返回指定城市的天气预报")
    .parameters(JsonObjectSchema.builder()
        .addStringProperty("city", "需要返回天气预报的城市")
        .addEnumProperty("temperatureUnit", List.of("CELSIUS", "FAHRENHEIT"))
        .required("city") // 必填属性需要显式指定
        .build())
    .build();
```

关于 `JsonObjectSchema` 的更多信息，请参阅[这里](/tutorials/structured-outputs#jsonobjectschema)。

2. 使用辅助方法：
- `ToolSpecifications.toolSpecificationsFrom(Class)`
- `ToolSpecifications.toolSpecificationsFrom(Object)`
- `ToolSpecifications.toolSpecificationFrom(Method)`

```java
class WeatherTools { 
  
    @Tool("返回指定城市的天气预报")
    String getWeather(
            @P("需要返回天气预报的城市") String city,
            TemperatureUnit temperatureUnit
    ) {
        ...
    }
}

List<ToolSpecification> toolSpecifications = ToolSpecifications.toolSpecificationsFrom(WeatherTools.class);
```

### JSON 序列化

`ToolSpecification` 可以通过 `toJson()` 和 `fromJson()` 方法序列化为 JSON，并从 JSON 反序列化回来。
这在某些场景中会很有用，例如你想把 tool specification 存入数据库，或通过网络进行传输。

```java
String json = toolSpecification.toJson();

ToolSpecification deserialized = ToolSpecification.fromJson(json);
```

默认情况下，JSON 转换使用的是专门的 Jackson `ObjectMapper`。
你也可以通过 SPI 提供自己的 `ToolSpecificationJsonCodec` 实现：
实现 `ToolSpecificationJsonCodecFactory` 并将其注册到
`META-INF/services/dev.langchain4j.spi.agent.tool.ToolSpecificationJsonCodecFactory`。

### 使用 `ChatModel`

当你拿到 `List<ToolSpecification>` 之后，就可以调用模型了：
```java
ChatRequest request = ChatRequest.builder()
    .messages(UserMessage.from("明天伦敦天气怎么样？"))
    .toolSpecifications(toolSpecifications)
    .build();
ChatResponse response = model.chat(request);
AiMessage aiMessage = response.aiMessage();
```

如果 LLM 决定调用工具，返回的 `AiMessage` 就会在 `toolExecutionRequests` 字段里包含相关数据。
此时，`AiMessage.hasToolExecutionRequests()` 会返回 `true`。
根据不同的 LLM，它可能包含一个或多个 `ToolExecutionRequest` 对象
（有些 LLM 支持并行调用多个工具）。

每个 `ToolExecutionRequest` 通常应包含：
- 工具调用的 `id`。请注意，一些 LLM 提供商（例如 Google、Ollama）可能会省略这个 ID。
- 要调用的工具 `name`，例如：`getWeather`
- 工具参数 `arguments`，例如：`{ "city": "London", "temperatureUnit": "CELSIUS" }`

你需要根据 `ToolExecutionRequest` 中的信息，手动执行对应工具。

如果你想把工具执行结果再发送回 LLM，
需要创建一个 `ToolExecutionResultMessage`（每个 `ToolExecutionRequest` 对应一个），
并连同之前所有消息一起发送：
```java

String result = "明天伦敦预计有雨。";
ToolExecutionResultMessage toolExecutionResultMessage = ToolExecutionResultMessage.from(toolExecutionRequest, result);
ChatRequest request2 = ChatRequest.builder()
        .messages(List.of(userMessage, aiMessage, toolExecutionResultMessage))
        .toolSpecifications(toolSpecifications)
        .build();
ChatResponse response2 = model.chat(request2);
```

#### 多模态工具结果 {#returning-images-and-multimodal-content}
`ToolExecutionResultMessage` 也可以承载非文本内容，例如图片。
这时不使用 `text()`，而是使用带 `contents()` 的 builder：

```java
ToolExecutionResultMessage toolExecutionResultMessage = ToolExecutionResultMessage.builder()
        .id(toolExecutionRequest.id())
        .toolName(toolExecutionRequest.name())
        .contents(
                TextContent.from("这是一张照片"),
                ImageContent.from(Image.builder()
                        .base64Data(base64Data)
                        .mimeType("image/png")
                        .build())
        )
        .build();
```

:::note
并不是所有 LLM 提供商都支持多模态工具结果。
当前支持在工具结果中返回图片的提供商包括 Anthropic、Amazon Bedrock 和 Google AI Gemini。
其他提供商如果工具返回了非文本内容，会抛出 `UnsupportedFeatureException`。
:::

### 使用 `StreamingChatModel` {#using-streamingchatmodel}

拿到 `List<ToolSpecification>` 后，也可以调用流式模型：
```java
ChatRequest request = ChatRequest.builder()
    .messages(UserMessage.from("明天伦敦天气怎么样？"))
    .toolSpecifications(toolSpecifications)
    .build();

model.chat(request, new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(String partialResponse) {
        System.out.println("onPartialResponse: " + partialResponse);
    }

    @Override
    public void onPartialToolCall(PartialToolCall partialToolCall) {
        System.out.println("onPartialToolCall: " + partialToolCall);
    }

    @Override
    public void onCompleteToolCall(CompleteToolCall completeToolCall) {
        System.out.println("onCompleteToolCall: " + completeToolCall);
    }

    @Override
    public void onCompleteResponse(ChatResponse completeResponse) {
        System.out.println("onCompleteResponse: " + completeResponse);
    }

    @Override
    public void onError(Throwable error) {
        error.printStackTrace();
    }
});
```

如果 LLM 决定调用工具，`onPartialToolCall(PartialToolCall)` 回调通常会被多次触发，
随后才会触发一次 `onCompleteToolCall(CompleteToolCall)`，表示该工具调用的流式输出已经结束。

:::note
并不是所有 LLM 提供商都会流式返回“部分工具调用”。
一些提供商（例如 Bedrock、Google、Mistral、Ollama）只会返回完整的工具调用。
在这种情况下，不会触发 `onPartialToolCall`，只会触发 `onCompleteToolCall`。
:::

下面是一个单个工具调用的流式输出示例：
```
onPartialToolCall(index = 0, id = "call_abc", name = "get_weather", partialArguments = "{\"")
onPartialToolCall(index = 0, id = "call_abc", name = "get_weather", partialArguments = "city")
onPartialToolCall(index = 0, id = "call_abc", name = "get_weather", partialArguments = "\":\"")
onPartialToolCall(index = 0, id = "call_abc", name = "get_weather", partialArguments = "London")
onPartialToolCall(index = 0, id = "call_abc", name = "get_weather", partialArguments = "\"}")
onCompleteToolCall(index = 0, id = "call_abc", name = "get_weather", arguments = "{\"city\":\"London\"}")
```

如果 LLM 发起了多个工具调用，`index` 会递增，
从而便于你将不同的 `PartialToolCall` 与对应的最终 `CompleteToolCall` 关联起来。

当完整响应流结束并触发 `onCompleteResponse(ChatResponse)` 时，
`ChatResponse` 中的 `AiMessage` 会包含在整个流式过程中发生的全部工具调用。

## 高层 Tool API {#high-level-tool-api}
在高层抽象中，你可以给任意 Java 方法加上 `@Tool` 注解，
并在创建 [AI Service](/tutorials/ai-services#tools-function-calling) 时把它们传进去。

AI Service 会自动把这些方法转换为 `ToolSpecification`，
并在每次与 LLM 交互时把它们包含进请求中。
当 LLM 决定调用某个工具时，AI Service 会自动执行对应的方法，
并把方法的返回值（如果有）再发送给 LLM。
具体实现细节可以查看 `DefaultToolExecutor`。

下面是几个 tool 示例：
```java
@Tool("根据查询搜索 Google，返回相关 URL")
public List<String> searchGoogle(@P("搜索查询") String query) {
    return googleSearchService.search(query);
}

@Tool("根据 URL 返回网页内容")
public String getWebPageContent(@P("页面 URL") String url) {
    Document jsoupDocument = Jsoup.connect(url).get();
    return jsoupDocument.body().text();
}
```

### Tool 方法限制
带 `@Tool` 注解的方法：
- 可以是 static，也可以是非 static
- 可以有任意可见性（public、private 等）

### Tool 方法参数
带 `@Tool` 注解的方法可以接受任意数量、各种类型的参数：
- 基本类型：`int`、`double` 等
- 对象类型：`String`、`Integer`、`Double` 等
- 自定义 POJO（可包含嵌套 POJO）
- `enum`
- `List<T>` / `Set<T>`，其中 `T` 为上述任一类型
- `Map<K,V>`（你需要通过 `@P` 在参数描述中手动说明 `K` 和 `V` 的类型）

无参数的方法同样受支持。

#### 参数名称

默认情况下，如果 `@P` 的 `name` 属性没有指定，参数名会通过反射获取。
但如果 Java 编译时没有启用 `-parameters` 选项，反射只能拿到 `arg0`、`arg1` 这类通用名称。
参数的语义信息就丢失了，这可能会让 LLM 感到困惑。

在以下两种情况下，给 `@P` 指定 `name` 会很有帮助：

1. **缺少 `-parameters` javac 选项** —— 避免 LLM 看到 `arg0` / `arg1` 这样的无意义参数名。
   需要注意的是，Quarkus 和 Spring 这类框架默认都会启用 `-parameters`，
   因此在这些框架下通常不需要手动设置 `name`。
2. **为 LLM 提供自定义名称** —— 当你希望 LLM 看到的参数名与源代码中的变量名不同，
   例如为了匹配某个特定 API 契约，或为了提供一个更清晰的描述性名字。

**示例：**

```java
@Tool
void getTemperature(
        @P("温度数值") double value,
        @P("温度单位") Optional<String> unit) {
    ...
}
```

#### 必填与可选

默认情况下，所有 tool 方法参数都被视为**必填**。
这意味着 LLM 必须为这些参数生成一个值。
如果想把参数改为可选，可以用 `@P(required = false)`：
```java
@Tool
void getTemperature(String location, @P("温度单位", required = false) Unit unit) {
    ...
}
```

#### 另一种方式：使用 `Optional<T>` 表示可选参数

除了 `@P(required = false)`，你也可以直接把参数声明为 `Optional<T>`。
任何 `Optional<T>` 类型的参数都会自动被视为可选，即使 `@P` 中没有显式写 `required = false`。

**示例：**
```java
@Tool
void getTemperature(
    @P("温度数值") double value,
    @P("温度单位") Optional<String> unit
) {
    ...
}
```

复杂参数的字段和子字段默认也同样被视为**必填**。
如果要让某个字段可选，可以用 `@JsonProperty(required = false)`：
```java
record User(String name, @JsonProperty(required = false) String email) {}

@Tool
void add(User user) {
    ...
}
```

:::note
请注意，在与[结构化输出](/tutorials/structured-outputs)一起使用时，
所有字段和子字段默认都被视为**可选**。
:::

递归参数（例如 `Person` 类有一个 `Set<Person> children` 字段）
目前仅被 OpenAI 支持。

### Tool 方法返回类型
带 `@Tool` 注解的方法可以返回任意类型，包括 `void`。
如果方法返回类型是 `void`，只要方法成功执行，就会向 LLM 发送字符串 `"Success"`。

如果方法返回类型是 `String`，则会将返回值原样发送给 LLM，不做任何转换。

对于其他返回类型，返回值会先被转换成 JSON 字符串，再发送给 LLM。

#### 返回图片与多模态内容 {#returning-images-and-multimodal-content}

Tools 也可以返回图片和其他非文本内容。
当工具返回以下类型之一时，结果会以多模态内容（例如图片）的形式发送给 LLM，
而不是序列化为 JSON 文本：

- `Image` —— 作为单张图片发送
- `ImageContent` —— 作为单个图片内容发送
- `Content` —— 作为单个内容元素发送（例如 `TextContent`、`ImageContent`）
- `List<Content>` —— 作为多个内容元素发送
- `Content[]` —— 作为多个内容元素发送

例如，一个拍照并返回图片的工具：
```java
@Tool("拍一张照片并返回")
Image takePhoto() {
    byte[] imageBytes = camera.capture();
    return Image.builder()
            .base64Data(Base64.getEncoder().encodeToString(imageBytes))
            .mimeType("image/png")
            .build();
}
```

又或者，一个同时返回文本和图片的工具：
```java
@Tool("拍一张照片并连同描述一起返回")
List<Content> takePhoto() {
    Image image = camera.capture();
    return List.of(
            TextContent.from("拍摄时间：" + LocalDateTime.now()),
            ImageContent.from(image)
    );
}
```

:::note
并不是所有 LLM 提供商都支持多模态工具结果。
当前支持在工具结果中返回图片的提供商包括 Anthropic、Amazon Bedrock 和 Google AI Gemini。
其他提供商如果工具返回非文本内容，会抛出 `UnsupportedFeatureException`。
:::

### 把 AI services 当作其他 AI services 的工具

AI services 也可以被其他 AI services 当作工具使用。
这在许多 agentic 场景里都很有用：一个 AI service 可以向另一个更专业的 AI service 求助，
让它执行特定任务。
例如，假设你定义了下面这些 AI services：

```java
    interface RouterAgent {

        @dev.langchain4j.service.UserMessage("""
            分析下面的用户请求，并将其归类为 'legal'、'medical' 或 'technical'，
            然后把原始请求原封不动地转发给对应的专家工具。
            最后，把专家返回的答案不做任何修改地原样返回。

            用户请求是：'{{it}}'。
            """)
        String askToExpert(String request);
    }

    interface MedicalExpert {

        @dev.langchain4j.service.UserMessage("""
            你是一位医学专家。
            请从医学视角分析下面的用户请求，并给出尽可能好的回答。
            用户请求是 {{it}}。
            """)
        @Tool("一位医学专家")
        String medicalRequest(String request);
    }

    interface LegalExpert {

        @dev.langchain4j.service.UserMessage("""
            你是一位法律专家。
            请从法律视角分析下面的用户请求，并给出尽可能好的回答。
            用户请求是 {{it}}。
            """)
        @Tool("一位法律专家")
        String legalRequest(String request);
    }

    interface TechnicalExpert {

        @dev.langchain4j.service.UserMessage("""
            你是一位技术专家。
            请从技术视角分析下面的用户请求，并给出尽可能好的回答。
            用户请求是 {{it}}。
            """)
        @Tool("一位技术专家")
        String technicalRequest(String request);
    }
```

`RouterAgent` 可以被配置为把另外三个特定领域的 AI service 当作工具使用，
并根据用户请求把请求路由给它们中的一个。

```java
MedicalExpert medicalExpert = AiServices.builder(MedicalExpert.class)
        .chatModel(model)
        .build();
LegalExpert legalExpert = AiServices.builder(LegalExpert.class)
        .chatModel(model)
        .build();
TechnicalExpert technicalExpert = AiServices.builder(TechnicalExpert.class)
        .chatModel(model)
        .build();

RouterAgent routerAgent = AiServices.builder(RouterAgent.class)
        .chatModel(model)
        .tools(medicalExpert, legalExpert, technicalExpert)
        .build();

routerAgent.askToExpert("我摔断腿了，应该怎么办？");
```

:::note
把 AI services 当作其他 AI services 的工具，是一个非常强大的能力，可以帮助你构建复杂的 agentic 系统。
但这种方式也有一些重要的缺点需要注意：
- 这种实现要求 LLM 在工具调用中把用户请求原样复制过去，这本身就是一个容易出错的操作。
- 作为工具调用其他 LLM 的那个 LLM，还需要再次处理对方返回的结果；和其他工具调用一样，这可能会浪费时间和 token。
- 作为 agent-tool 的 AI service 是完全独立的，它无法访问调用方 agent 的 chat memory，因此也就无法利用这些上下文来给出更充分的回答。
:::


### `@Tool`
任何带有 `@Tool` 注解，
并且在构建 AI Service 时被_显式_传入的 Java 方法，都可以被 LLM 执行：
```java
interface MathGenius {
    
    String ask(String question);
}

class Calculator {
    
    @Tool
    double add(int a, int b) {
        return a + b;
    }

    @Tool
    double squareRoot(double x) {
        return Math.sqrt(x);
    }
}

MathGenius mathGenius = AiServices.builder(MathGenius.class)
    .chatModel(model)
    .tools(new Calculator())
    .build();

String answer = mathGenius.ask("475695037565 的平方根是多少？");

System.out.println(answer); // 475695037565 的平方根是 689706.486532。
```

当调用 `ask` 方法时，会发生两次与 LLM 的交互，就像前面介绍的那样。
在这两次交互之间，`squareRoot` 方法会被自动调用。

`@Tool` 注解包含以下字段：
- `name`：工具名称。如果不提供，则默认使用方法名作为工具名称。
- `value`：工具描述。
- `returnBehavior`：更多信息请参阅[这里](/tutorials/tools#returning-immediately-the-result-of-a-tool-execution-request)
- `metadata`：一个合法 JSON 字符串，用于包含 LLM 提供商专用的工具 metadata。
  默认情况下，这些 metadata 不会发送给 LLM 提供商；
  你必须在创建 `ChatModel` 时显式指定哪些 metadata key 应该被发送。
  目前 tool metadata 仅由 `langchain4j-anthropic` 模块支持。

根据工具的具体类型，即使没有描述，LLM 也可能理解得很好
（例如 `add(a, b)` 一看就知道做什么），
但通常还是更推荐提供清晰、有意义的名称和描述。
这样 LLM 就有更多信息来决定是否应该调用这个工具，以及如何调用。

### `@P`
方法参数可以选择性地用 `@P` 注解标注。

`@P` 注解包含以下可选字段：

- `name`：LLM 看到的参数名。如果未指定，则使用方法的真实参数名。
- `description`：参数描述（`value` 的别名），默认空。
- `value`：参数描述（`description` 的别名），默认空。
- `required`：参数是否必填，默认是 `true`。

#### 参数名称

`name` 属性会覆盖 LLM 最终看到的参数名。
在以下两种情况下，设置 `name` 很有价值：

1. **缺少 `-parameters` javac 选项。**
   如果没有启用 `-parameters`，Java 反射只会返回 `arg0`、`arg1` 这样的泛化名称。
   参数的语义信息就丢失了，这可能会让 LLM 迷惑。
   设置 `name` 可以恢复一个有意义的名称。
   需要注意的是，Quarkus 和 Spring 这类框架默认会启用 `-parameters`，
   所以在这些框架中通常不需要手动设置 `name`。

2. **为 LLM 提供自定义名称。**
   当你希望 LLM 看到的参数名和源码中的命名不同，
   例如为了匹配某个特定 API 契约，或者提供一个更具描述性的名字。


#### 参数描述

`description` 和 `value` 是等价的，它们都会设置 LLM 看到的参数描述。
当只需要描述时，可以使用简写的 `value` 形式：
```java
@Tool
void getWeather(@P("城市名称") String city) { ... }
```

当既需要名称又需要描述时，可以使用命名属性：
```java
@Tool
void getWeather(@P(name = "city", description = "城市名称") String city) { ... }
```

### `@Description`
类和字段的描述可以使用 `@Description` 注解指定：

```java
@Description("待执行的查询")
class Query {

  @Description("需要选择的字段")
  private List<String> select;

  @Description("筛选条件")
  private List<Condition> where;
}

@Tool
Result executeQuery(Query query) {
  ...
}
```

:::note
请注意，放在 `enum` 枚举值上的 `@Description` **不会生效**，并且**不会**被包含到生成的 JSON schema 中：
```java
enum Priority {

    @Description("致命问题，例如支付网关故障或安全事件。") // 这一项会被忽略
    CRITICAL,
    
    @Description("高优先级问题，例如主要功能异常或大面积故障。") // 这一项会被忽略
    HIGH,
    
    @Description("低优先级问题，例如轻微 bug 或界面问题。") // 这一项会被忽略
    LOW
}
```
:::

### `InvocationParameters` {#invocationparameters}
如果你希望在调用 AI Service 时，把额外数据传给工具，
可以使用 `InvocationParameters`：
```java

interface Assistant {
    String chat(@UserMessage String userMessage, InvocationParameters parameters);
}

class Tools {
    @Tool
    String getWeather(String city, InvocationParameters parameters) {
        String userId = parameters.get("userId");
        UserPreferences preferences = getUserPreferences(userId);
        return weatherService.getWeather(city, preferences.temperatureUnits());
    }
}

InvocationParameters parameters = InvocationParameters.from(Map.of("userId", "12345"));
String response = assistant.chat("伦敦现在天气怎么样？", parameters);
```

在这个场景里，LLM 并不知道这些参数的存在；
它们只对 LangChain4j 和你的应用代码可见。

`InvocationParameters` 也可以在其他 AI Service 组件中访问到，例如：
- [`ToolProvider`](/tutorials/tools#specifying-tools-dynamically)：通过 `ToolProviderRequest`
- [`ToolArgumentsErrorHandler`](/tutorials/tools#handling-tool-arguments-errors)
  和 [`ToolExecutionErrorHandler`](https://docs.langchain4j.dev/tutorials/tools#handling-tool-execution-errors)：
  通过 `ToolErrorContext`
- [RAG 组件](/tutorials/rag/)：通过 `Query` -> `Metadata`

这些参数会存储在一个可变的、线程安全的 `Map` 中。

在一次 AI Service 调用过程中，
你还可以通过 `InvocationParameters` 在不同 AI Service 组件之间传递数据
（例如从一个 tool 传给另一个 tool，或从 RAG 组件传给 tool）。

### `InvocationContext`

与 `InvocationParameters` 类似，带 `@Tool` 注解的方法
也可以接收 `InvocationContext` 参数，用来获取本次 AI Service 调用的相关信息。

```java
class Tools {
    @Tool
    String getWeather(String city, InvocationContext context) {
        UUID invocationId = context.invocationId();
        String aiServiceInterfaceName = context.interfaceName();
        ...
    }
}
```

同样地，LLM 并不知道这些参数；
它们只对 LangChain4j 和你的应用代码可见。

### `@ToolMemoryId`
如果你的 AI Service 方法带有 `@MemoryId` 标注的参数，
那么 `@Tool` 方法中的某个参数也可以用 `@ToolMemoryId` 标注：

```java
interface Assistant{
    String chat(@UserMessage String userMessage, @MemoryId memoryId);
}

class Tools {
    @Tool
    String addCalendarEvent(CalendarEvent event, @ToolMemoryId memoryId) {
        ...
    }
}

String answer = assistant.chat("我明天下午 14:00 要和 Klaus 开会", "12345");
```

传给 AI Service 方法的值，会被自动传递给 `@Tool` 方法。
如果你有多个用户，或者每个用户有多个 chat / memory，
并且希望在 `@Tool` 方法内部区分它们，这个能力就非常有用。

### 并发执行工具

默认情况下，当 LLM **同时**调用多个工具时（也就是 parallel tool calling），
AI Service 会按顺序依次执行它们。
如果你希望并发执行工具，
可以在构建 AI Service 时调用 `executeToolsConcurrently()` 或 `executeToolsConcurrently(Executor)`。
启用之后，工具会并发执行（有一个例外，见下文），
使用默认或你指定的 `Executor`。

#### 使用 `ChatModel` 时：
- 当 LLM 调用多个工具时，它们会借助 `Executor` 在不同线程中并发执行。
- 当 LLM 只调用一个工具时，它会在同一个（调用方）线程里执行，
  **不会**使用 `Executor`，以避免浪费资源。

#### 使用 `StreamingChatModel` 时：
- 当 LLM 调用多个工具时，它们会借助 `Executor` 在不同线程中并发执行。
  每个工具都会在 `StreamingChatResponseHandler.onCompleteToolCall(CompleteToolCall)` 被触发后立刻执行，
  无需等待其他工具，也无需等到整个响应流结束。
- 当 LLM 只调用一个工具时，它会借助 `Executor` 在单独线程中执行。
  这是因为在那个时刻，我们还不知道模型最终会调用多少个工具，
  因而不能安全地在同一线程里直接执行。

### 访问已执行的工具
如果你想访问 AI Service 调用过程中执行过的工具，
可以很方便地把返回类型包装成 `Result`：
```java
interface Assistant {

    Result<String> chat(String userMessage);
}

Result<String> result = assistant.chat("取消我的预订 123-456");

String answer = result.content();
List<ToolExecution> toolExecutions = result.toolExecutions();

ToolExecution toolExecution = toolExecutions.get(0);
ToolExecutionRequest request = toolExecution.request();
String result = toolExecution.result(); // 工具执行结果的文本形式
List<Content> resultContents = toolExecution.resultContents(); // 工具执行结果的内容列表（可能包含图片）
Object resultObject = toolExecution.resultObject(); // 工具实际返回的值
```

在流式模式下，也可以通过 `onToolExecuted` 回调来访问：
```java
interface Assistant {

    TokenStream chat(String message);
}

TokenStream tokenStream = assistant.chat("取消我的预订");

tokenStream
    .onToolExecuted((ToolExecution toolExecution) -> System.out.println(toolExecution))
    .onPartialResponse(...)
    .onCompleteResponse(...)
    .onError(...)
    .start();
```

### 以编程方式指定 Tools

在使用 AI Services 时，也可以通过编程方式指定 tools。
这种方式提供了极大的灵活性，因为工具可以从数据库、配置文件等外部来源动态加载。

工具名称、描述、参数名称和参数描述
都可以通过 `ToolSpecification` 配置：
```java
ToolSpecification toolSpecification = ToolSpecification.builder()
        .name("get_booking_details")
        .description("返回预订详情")
        .parameters(JsonObjectSchema.builder()
                .properties(Map.of(
                        "bookingNumber", JsonStringSchema.builder()
                                .description("格式为 B-12345 的预订编号")
                                .build()
                ))
                .build())
        .build();
```

对于每个 `ToolSpecification`，你都需要提供一个 `ToolExecutor` 实现，
用于处理 LLM 生成的工具执行请求：
```java
ToolExecutor toolExecutor = (toolExecutionRequest, memoryId) -> {
    Map<String, Object> arguments = fromJson(toolExecutionRequest.arguments());
    String bookingNumber = arguments.get("bookingNumber").toString();
    Booking booking = getBooking(bookingNumber);
    return booking.toString();
};
```

LangChain4j 还提供了 `DefaultToolExecutor`，
它可以自动调用 Java 对象上的方法并完成参数映射：
```java
class BookingTools {
    String getBookingDetails(String bookingNumber) {
        Booking booking = loadBookingFromDatabase(bookingNumber);
        return booking.toString();
    }
}

BookingTools tools = new BookingTools();
Method method = BookingTools.class.getMethod("getBookingDetails", String.class);
ToolExecutor toolExecutor = new DefaultToolExecutor(tools, method);
```

当我们拥有一个或多个 `（ToolSpecification, ToolExecutor）` 对之后，
就可以在创建 AI Service 时把它们传进去：
```java
Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .tools(Map.of(toolSpecification, toolExecutor))
    .build();
```

另外，你还可以传入一组 tool name，指定这些工具应当[立即 / 直接返回](/tutorials/tools#returning-immediately-the-result-of-a-tool-execution-request)结果，
而不是再交给 LLM 做二次处理。

```java
Set<String> immediateReturnToolNames = Set.of("get_booking_details");

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .tools(Map.of(toolSpecification, toolExecutor), immediateReturnToolNames)
    .build();
```

### 动态指定 Tools {#specifying-tools-dynamically}

使用 AI services 时，也可以为每次调用动态指定工具。
你可以配置一个 `ToolProvider`，
它会在每次 AI service 被调用时执行，
并提供当前请求里应该包含给 LLM 的工具。
`ToolProvider` 接收一个 `ToolProviderRequest`
（其中包含 `UserMessage`、chat memory ID 和 [`InvocationParameters`](/tutorials/tools#invocationparameters)），
并返回一个 `ToolProviderResult`。
后者以 `Map<ToolSpecification, ToolExecutor>` 的形式包含要使用的工具。

下面是一个示例：只有当用户消息中包含单词 `booking` 时，
才添加 `get_booking_details` 工具：
```java
ToolProvider toolProvider = (toolProviderRequest) -> {
    if (toolProviderRequest.userMessage().singleText().contains("booking")) {
        ToolSpecification toolSpecification = ToolSpecification.builder()
            .name("get_booking_details")
            .description("返回预订详情")
            .parameters(JsonObjectSchema.builder()
                .addStringProperty("bookingNumber")
                .build())
            .build();
        return ToolProviderResult.builder()
            .add(toolSpecification, toolExecutor)
            .build();
    } else {
        return null;
    }
};

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .toolProvider(toolProvider)
    .build();
```

#### 在动态工具中配置立即返回

在构建 `ToolProviderResult` 时，你也可以通过 `ToolProviderResult.builder()`
把某些工具标记为[立即返回](/tutorials/tools#returning-immediately-the-result-of-a-tool-execution-request)：

```java
ToolProvider toolProvider = (toolProviderRequest) -> {
    return ToolProviderResult.builder()
        .add(bookingToolSpec, bookingExecutor, ReturnBehavior.IMMEDIATE)
        .add(weatherToolSpec, weatherExecutor)
        .build();
};
```

也可以按名字一次标记多个工具：

```java
ToolProvider toolProvider = (toolProviderRequest) -> {
    return ToolProviderResult.builder()
        .addAll(allTools)
        .immediateReturnToolNames(Set.of("get_booking_details", "cancel_booking"))
        .build();
};
```

一个 AI service 在同一次调用中，
可以同时使用以编程方式指定的工具和动态指定的工具。

### 工具搜索 {#tool-search}

当工具数量很多时，
每次请求都把所有工具全部发给模型，会显著增加 token 消耗，并降低模型性能。
为了解决这个问题，LangChain4j 提供了 tool search 机制，
使得工具可以由 LLM 自己按需发现，
而不是一开始就全部暴露给它。

核心思路很简单：
- 初始时，LLM 只会看到一个或多个特殊的“工具搜索工具”
- LLM 可以调用这些工具搜索工具，去查找相关工具
- 一旦找到相关工具，它们就会被加入后续发给 LLM 的请求中

这样就实现了可扩展、节省 token、并且由模型驱动的工具发现机制。

#### Tool Search 的工作方式

一次典型的 tool search 流程如下：
1. 初始请求：
   - LLM 只会看到 tool-search tools，而不是完整工具集
2. 工具搜索：
   - LLM 调用某个 tool-search tool，并描述自己需要什么类型的工具
   - tool-search strategy 会将这个请求与可用工具进行匹配
4. 工具暴露：
   - 匹配到的工具会被加入发往 LLM 的下一次请求中
5. 工具执行：
   - 此时 LLM 就可以像正常工具一样调用这些已发现的工具

之前找到的工具会在多次 tool-search 调用之间逐步累积。
每次 LLM 调用 tool-search tool 时，
新匹配到的工具都会加入到模型当前可见的工具集合中（是合并，不是替换）。
这意味着 LLM 可见的工具列表会随着时间增长。
这些已发现工具会持续对 LLM 可见，直到对应的 `ToolExecutionResultMessage`
从 `ChatMemory` 中被移除，并且至少会保持到当前 AI Service 调用结束。

如果没有配置 `ChatMemory`，
那么这些已发现工具只会在当前 AI service 调用期间对 LLM 可见。

#### ToolSearchStrategy（工具搜索策略） {#toolsearchstrategy}

Tool search 通过 `ToolSearchStrategy` 接口实现：

```java
@Experimental
public interface ToolSearchStrategy {

    List<ToolSpecification> getToolSearchTools(InvocationContext invocationContext);

    ToolSearchResult search(ToolSearchRequest toolSearchRequest);
}
```

一个 `ToolSearchStrategy` 负责：
- 向 LLM 暴露 tool-search tools
- 执行由 LLM 发起的工具搜索请求
- 返回匹配到的工具名，随后这些工具会被解析并暴露给 LLM

LangChain4j 当前内置了两个实现：
- `SimpleToolSearchStrategy`：基于关键词匹配
- `VectorToolSearchStrategy`：基于 embedding 的语义搜索

更多细节请参考这些类的 Javadoc。

你也可以实现自定义策略。

#### 在 AI Services 中配置 Tool Search

Tool search 是在 AI Service 层面配置的：

```java
Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .chatMemory(chatMemory)
    .tools(tools) // tool search 可用于静态工具
    .toolProvider(mcpToolProvider) // tool search 也可用于动态提供的工具（例如 MCP）
    .toolSearchStrategy(new SimpleToolSearchStrategy())
    .build();
```

配置完成后：
- LLM 不再一开始就看到所有工具
- 工具发现会成为一个显式的、由模型驱动的步骤
- 在工具很多时，token 用量会显著降低

#### 什么时候适合使用 Tool Search

在以下场景中，tool search 尤其有用：
- 你拥有很多工具（几十个甚至上百个）
- 工具具有明确领域属性，或者很少使用
- 工具是否可用取决于上下文、用户或权限
- 你希望 LLM 先判断自己需要什么工具，而不是在一长串工具列表里盲猜

如果你只有很少的工具，或者所有工具始终都相关，
那么直接使用普通方式反而更简单。

#### 永远可见的工具

当启用了 tool search 后，工具默认会对 LLM 隐藏，
直到它们通过一次 tool-search 调用被发现。
但在某些情况下，你可能希望某些工具始终对 LLM 可见。

典型场景包括：
- 核心工具，应该始终可用
- 高频使用工具，不值得为其付出搜索开销
- 通用辅助工具

LangChain4j 通过 `ALWAYS_VISIBLE` 这一 tool search behavior 来支持这种需求。

##### 它是如何工作的

当某个工具被标记为 `ALWAYS_VISIBLE` 时：
- 它会在第一次请求中就对 LLM 可见
- 它不需要通过 tool search 才能被发现
- 它会在整个 AI Service 调用期间持续可见
- 它不会被纳入“可搜索工具候选集”中

其他工具则仍然遵循正常的 tool-search 流程。

##### 使用 `@Tool` 注解

你可以通过 `@Tool` 注解把某个工具标记为 always visible：
```java
@Tool(searchBehavior = ALWAYS_VISIBLE)
String getWeather(String city) {
    return weatherService.getWeather(city);
}
```

##### 使用 `McpToolProvider`

当使用 MCP tools（通过 `McpToolProvider`）时，
可以通过 `alwaysVisibleToolNames` 配置始终可见工具：

```java
McpToolProvider.builder()
    .mcpClients(mcpClient)
    .alwaysVisibleToolNames("getWeather")
    .build();
```

##### 使用 `ToolSpecification`

如果你以编程方式配置工具，
也可以通过 `metadata` 将其标记为 always visible：
```java
ToolSpecification toolSpecification = ToolSpecification.builder()
    .name("getWeather")
    .parameters(JsonObjectSchema.builder()
        .addStringProperty("city")
        .required("city")
        .build())
    .metadata(Map.of(ToolSpecification.METADATA_SEARCH_BEHAVIOR, SearchBehavior.ALWAYS_VISIBLE))
    .build();
```

#### 注意事项与限制

:::note
Tool search 的效果很大程度上依赖于 LLM 是否能正确理解“何时以及如何搜索工具”。
因此这个能力的实际效果非常依赖你所选用的模型。
:::

:::note
Tool search 当前仍被标记为 experimental，未来版本中可能会继续演进。
:::

### 立即返回工具执行结果 {#returning-immediately-the-result-of-a-tool-execution-request}

默认情况下，工具执行结果会被发回给 LLM，再由 LLM 基于这个结果继续处理。
但在某些场景里，某个工具执行出来的结果本身就已经是 AI Service 调用所期望的最终结果。
这时你可以把这个工具配置为“立即 / 直接返回”结果，
从而跳过一次既耗资源又浪费时间的 LLM 二次处理。
具体做法是为 `@Tool` 注解配置 `returnBehavior` 字段，例如：

```java
class CalculatorWithImmediateReturn {
    
    @Tool(returnBehavior = ReturnBehavior.IMMEDIATE)
    double add(int a, int b) {
        return a + b;
    }
}
```

:::note
这个特性仅支持返回类型为 `Result<T>` 的 AI Services。
如果把它用于其他返回类型的 AI Service，会抛出 `IllegalConfigurationException`。
关于 `Result<T>` 的更多信息，请参阅[返回类型](/tutorials/ai-services#return-types)。
:::

比如，像下面这样的 `Assistant`：

```java
interface Assistant {
    Result<String> chat(String userMessage);
}
```

如果它被配置为使用前面定义的 `CalculatorWithImmediateReturn` 工具：

```java
Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(model)
        .tools(new CalculatorWithImmediateReturn())
        .build();
```

那么它将直接返回来自工具调用的结果。例如，向 assistant 发出下面的请求：

```java
Result<String> result = assistant.chat("37 加 87 等于多少？");
```

最终会得到一个 `Result`，其中 `content` 为 `null`，
而真实的响应 `124` 需要从 `result.toolExecutions()` 中获取。
如果不启用 immediate return，LLM 就会再对 `add` 的执行结果进行二次处理，
于是最终返回的文本可能会是：`37 和 87 相加的结果是 124。`

还要注意，如果 LLM 调用了多个工具，而其中至少有一个工具不是 immediate，
那么依然会发生二次处理。

:::note
当使用编程式工具时，可以通过向 `.tools()` 方法传入一组 tool name，
把某些工具标记为 immediate return。
当通过 `ToolProvider` 使用动态工具时，
可以使用 `ToolProviderResult.builder()` 上的重载方法 `.add(ToolSpecification, ToolExecutor, ReturnBehavior)`。
对应示例请参见上文相关章节。
:::

### 错误处理

#### 处理 Tool Name 错误

有时 LLM 会在调用工具时产生幻觉，
换句话说，它会请求调用一个根本不存在的工具。
默认情况下，LangChain4j 会抛出异常来报告这个问题，
但你也可以为 AI Service 配置另一种处理策略。

这个策略是一个 `Function<ToolExecutionRequest, ToolExecutionResultMessage>` 实现，
用于定义：当 `ToolExecutionRequest` 请求了一个不存在的工具时，
应该生成怎样的 `ToolExecutionResultMessage`。
例如，你可以配置一个策略，向 LLM 返回一段错误说明，
希望它能意识到之前请求的工具不存在，并尝试换一个工具重试：

```java
AssistantHallucinatedTool assistant = AiServices.builder(AssistantHallucinatedTool.class)
        .chatModel(chatModel)
        .tools(new HelloWorld())
        .hallucinatedToolNameStrategy(toolExecutionRequest -> ToolExecutionResultMessage.from(
                toolExecutionRequest, "错误：不存在名为 " + toolExecutionRequest.name() + " 的工具"))
        .build();
```

#### 处理 Tool Arguments 错误 {#handling-tool-arguments-errors}

默认情况下，如果工具参数有问题（例如 LLM 生成了非法 JSON），
AI Service 就无法执行该工具，因此会抛出异常并失败。

你可以通过为 AI Service 配置 `ToolArgumentsErrorHandler` 来自定义这种行为：

```java
Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .tools(tools)
        .toolArgumentsErrorHandler((error, errorContext) -> ...)
        .build();
```

目前，在 `ToolArgumentsErrorHandler` 中处理错误有两种方式：

- 抛出异常：会中止整个 AI service 流程。
- 返回一段文本消息（例如错误描述），该文本会被发回给 LLM，
  使它能够据此做出响应（例如修正错误并重试）。

下面是第一种方式的示例：

```java
Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .tools(tools)
        .toolArgumentsErrorHandler((error, errorContext) -> { throw MyCustomException(error); })
        .build();

try {
    assistant.chat(...);
} catch (MyCustomException e) {
    // 处理 e
}
```

下面是第二种方式的示例：

```java
Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .tools(tools)
        .toolArgumentsErrorHandler((error, errorContext) -> ToolErrorHandlerResult.text("工具参数有问题：" + error.getMessage()))
        .build();
```

#### 处理 Tool Execution 错误 {#handling-tool-execution-errors}

默认情况下，如果带 `@Tool` 注解的方法抛出 `Exception`，
异常消息（`e.getMessage()`）会作为工具执行结果发回给 LLM。
这样做的目的是让 LLM 有机会理解错误、修正自己的行为，并在需要时重试。

你可以通过为 AI Service 配置 `ToolExecutionErrorHandler` 来自定义这个行为：

```java
Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .tools(tools)
        .toolExecutionErrorHandler((error, errorContext) -> ToolErrorHandlerResult.text("工具执行出错：" + error.getMessage()))
        .build();
```

和 `ToolArgumentsErrorHandler` 一样，`ToolExecutionErrorHandler` 中也有两种处理方式：
抛出异常，或者返回文本消息。

## 模型上下文协议（MCP）

你也可以从 [MCP server 导入 tools](https://modelcontextprotocol.io/docs/concepts/tools)。
更多信息请参阅[这里](/tutorials/mcp/#creating-an-mcp-tool-provider)。

## 相关教程

- [关于 Tools 的优秀指南](https://www.youtube.com/watch?v=cjI_6Siry-s)
  作者 [Tales from the jar side (Ken Kousen)](https://www.youtube.com/@talesfromthejarside)

## 示例

- [Tools 示例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithToolsExample.java)
- [动态 Tools 示例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithDynamicToolsExample.java)
