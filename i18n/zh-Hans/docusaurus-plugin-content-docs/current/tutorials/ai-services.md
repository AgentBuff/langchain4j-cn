---
sidebar_position: 6
---

# AI 服务

到目前为止，我们一直在介绍 `ChatModel`、`ChatMessage`、`ChatMemory` 等底层组件。
在这个层级上工作非常灵活，你拥有完全的控制权，但同时也意味着需要编写大量样板代码。
而由 LLM 驱动的应用通常不仅仅依赖单个组件，而是多个组件协同工作
（例如提示词模板、聊天记忆、LLM、输出解析器，以及 RAG 组件：嵌入模型和嵌入存储），
并且往往涉及多轮交互，因此将这些能力编排起来会更加繁琐。

我们希望你把注意力放在业务逻辑上，而不是底层实现细节上。
因此，LangChain4j 目前提供了两个能够解决这个问题的高层概念：AI Services 和 Chains。

## Chains（遗留方案）

Chains 的概念起源于 Python 的 LangChain（在 LCEL 引入之前）。
它的思路是为每一种常见用例提供一个 `Chain`，例如聊天机器人、RAG 等。
Chains 会将多个底层组件组合起来，并负责编排它们之间的交互。
它最大的问题在于，一旦你需要做定制化，就会显得过于僵硬。
LangChain4j 目前只实现了两个 Chain（`ConversationalChain` 和 `ConversationalRetrievalChain`），
并且我们暂时没有继续扩展更多 Chain 的计划。

## AI 服务 {#ai-services}

我们提出了另一种更适合 Java 的方案，叫做 AI Services。
它的思路是：用一个简单的 API，将与 LLM 及其他组件交互的复杂性隐藏起来。

这种方式与 Spring Data JPA 或 Retrofit 非常相似：你以声明式方式定义一个接口，
说明你希望暴露怎样的 API，而 LangChain4j 会提供一个实现这个接口的对象（代理）。
你可以把 AI Service 理解为应用中服务层的一个组件。
它提供的是 _AI_ 服务，这也正是它名称的由来。

AI Services 会处理最常见的操作：
- 为 LLM 格式化输入
- 解析 LLM 输出

它们也支持更高级的能力：
- 聊天记忆
- Tools
- RAG

AI Services 既可以用来构建支持多轮往返交互的有状态聊天机器人，
也可以用来自动化那些每次调用 LLM 都彼此独立的流程。

下面先来看一个最简单的 AI Service。然后我们再逐步进入更复杂的示例。

## 最简单的 AI Service

首先，定义一个只有一个方法的接口 `chat`，它接受 `String` 输入并返回 `String`：
```java
interface Assistant {

    String chat(String userMessage);
}
```

然后，创建底层组件。这些组件会在 AI Service 的内部被使用。
这里我们只需要 `ChatModel`：
```java
ChatModel model = OpenAiChatModel.builder()
    .apiKey(System.getenv("OPENAI_API_KEY"))
    .modelName(GPT_4_O_MINI)
    .build();
```

最后，使用 `AiServices` 类创建 AI Service 实例：
```java
Assistant assistant = AiServices.create(Assistant.class, model);
```
:::note
在 [Quarkus](https://docs.quarkiverse.io/quarkus-langchain4j/dev/ai-services.html)
和 [Spring Boot](/tutorials/spring-boot-integration#spring-boot-starter-for-declarative-ai-services) 应用中，
自动配置会负责创建 `Assistant` Bean。
这意味着你不需要手动调用 `AiServices.create(...)`，只需在需要的地方直接注入 / 自动装配 `Assistant` 即可。
:::

现在就可以使用 `Assistant` 了：
```java
String answer = assistant.chat("你好");
System.out.println(answer); // 你好，我可以帮你做什么？
```

## 它是如何工作的？

你将接口的 `Class` 和底层组件一起传给 `AiServices`，
`AiServices` 会创建一个实现该接口的代理对象。
目前它底层使用的是反射机制，不过我们也在考虑其他替代方案。
这个代理对象会负责处理输入和输出之间的全部转换。
在这个例子里，输入只是一个 `String`，但底层用的是接受 `ChatMessage` 的 `ChatModel`。
因此，`AiService` 会自动把这个输入转换成 `UserMessage` 并调用 `ChatModel`。
而由于 `chat` 方法的返回类型是 `String`，当 `ChatModel` 返回 `AiMessage` 后，
又会在返回给 `chat` 方法调用方之前自动转换回 `String`。

## Quarkus 应用中的 AI Services
[LangChain4j Quarkus extension](https://docs.quarkiverse.io/quarkus-langchain4j/dev/index.html)
极大简化了在 Quarkus 应用中使用 AI Services 的过程。

更多信息可参考[这里](https://docs.quarkiverse.io/quarkus-langchain4j/dev/ai-services.html)。

## Spring Boot 应用中的 AI Services
[LangChain4j Spring Boot starter](/tutorials/spring-boot-integration/#spring-boot-starter-for-declarative-ai-services)
极大简化了在 Spring Boot 应用中使用 AI Services 的过程。

## `@SystemMessage`

现在来看一个更复杂一点的例子。
我们希望强制 LLM 用俚语风格回复 😉

通常，这会通过在 `SystemMessage` 中提供指令来实现。

```java
interface Friend {

    @SystemMessage("你是我的好朋友。请用俚语风格回答。")
    String chat(String userMessage);
}

Friend friend = AiServices.create(Friend.class, model);

String answer = friend.chat("你好"); // 嘿！最近咋样？
```

在这个例子中，我们添加了 `@SystemMessage` 注解，并在其中提供了想使用的系统提示词模板。
它会在内部被转换为 `SystemMessage`，并和 `UserMessage` 一起发送给 LLM。

`@SystemMessage` 也可以从资源文件中加载提示词模板：
`@SystemMessage(fromResource = "my-prompt-template.txt")`

### 系统消息提供者 {#system-message-provider}
也可以通过 system message provider 动态定义系统消息：
```java
Friend friend = AiServices.builder(Friend.class)
    .chatModel(model)
    .systemMessageProvider(chatMemoryId -> "你是我的好朋友。请用俚语风格回答。")
    .build();
```
如你所见，你可以根据聊天记忆 ID（用户或会话）提供不同的系统消息。

### 系统消息转换器 {#system-message-transformer}

system message transformer 允许你在每次调用时动态修改 system message：
它发生在 `@SystemMessage` 或 `systemMessageProvider` 解析完成之后，
但在 [`chatRequestTransformer`](#programmatic-chatrequest-rewriting) 执行之前。
当你需要无论原始配置来自哪里，都统一在 system message 前后追加内容时，这个能力会很有用。

```java
Friend friend = AiServices.builder(Friend.class)
    .chatModel(model)
    .systemMessageProvider(chatMemoryId -> "你是我的好朋友。请用俚语风格回答。")
    .systemMessageTransformer(systemMessage -> systemMessage + " 今天的日期是 " + LocalDate.now() + "。")
    .build();
```

如果没有配置 system message，transformer 收到的值会是 `null`。

如果你还需要访问调用上下文（例如方法名或参数），
可以使用接受 `InvocationContext` 的双参数重载版本：

```java
Friend friend = AiServices.builder(Friend.class)
    .chatModel(model)
    .systemMessageProvider(chatMemoryId -> "你是我的好朋友。请用俚语风格回答。")
    .systemMessageTransformer((systemMessage, context) ->
            systemMessage + " Tenant: " + context.invocationParameters().get("tenant") + ".")
    .build();
```

## `@UserMessage`

现在假设我们使用的模型不支持 system message，
或者我们只是想用 `UserMessage` 来承载这部分提示。
```java
interface Friend {

    @UserMessage("你是我的好朋友。请用俚语风格回答。{{it}}")
    String chat(String userMessage);
}

Friend friend = AiServices.create(Friend.class, model);

String answer = friend.chat("你好"); // 嘿！最近咋样？
```
这里我们把 `@SystemMessage` 替换成了 `@UserMessage`，
并指定了一个包含变量 `it` 的提示词模板，它会引用方法的唯一参数。

也可以在 `String userMessage` 参数上使用 `@V` 注解，
为提示词模板变量指定一个自定义名称：
```java
interface Friend {

    @UserMessage("你是我的好朋友。请用俚语风格回答。{{message}}")
    String chat(@V("message") String userMessage);
}
```

:::note
请注意，在 Quarkus 或 Spring Boot 中使用 LangChain4j 时，通常不需要 `@V`。
只有在 Java 编译时没有启用 `-parameters` 选项时，这个注解才是必要的。
:::

`@UserMessage` 也可以从资源文件中加载提示词模板：
`@UserMessage(fromResource = "my-prompt-template.txt")`

## 以编程方式改写 ChatRequest {#programmatic-chatrequest-rewriting}

在某些场景下，在将 `ChatRequest` 发给 LLM 之前对其进行修改会很有用。
例如，你可能需要给 user message 追加一些上下文，
或者根据某些外部条件调整 system message。

可以通过为 AI Service 配置一个 `UnaryOperator<ChatRequest>` 来实现，
这个转换逻辑会被应用到 `ChatRequest` 上：

```java
Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .chatRequestTransformer(transformingFunction)  // 配置应用于 ChatRequest 的转换函数
    .build();
```

如果还需要访问 `ChatMemory` 以实现所需的 `ChatRequest` 转换，
也可以将 `chatRequestTransformer` 配置为 `BiFunction<ChatRequest, Object, ChatRequest>`。
在这种情况下，传给函数的第二个参数就是 memory ID。

## 聊天请求参数（ChatRequestParameters） {#chatrequest-parameters}

另一种更细粒度的控制能力，是在每次调用时动态配置参数
（例如 temperature、toolsChoice、maximum tokens 等）。
比如，你可能希望某些请求更“有创造性”（更高的 temperature），
而另一些请求更确定（更低的 temperature）。

为此，你可以定义一个 AI Service 方法，让它额外接收一个 `ChatRequestParameters`
（或某个厂商专用类型，如 `OpenAiChatRequestParameters`）参数。
这样 LangChain4j 就会在每次调用时接收并合并这些参数。

:::note
请注意，在 `ChatRequestParameters` 中指定的 `toolSpecifications` 和 `responseFormat`
会覆盖 AI Service 自动生成的对应配置。
:::

定义一个带第二个参数的接口：

```java
interface AssistantWithChatParams {

    String chat(@UserMessage String userMessage, ChatRequestParameters params);
}
```

构建 AI Service：

```java
AssistantWithChatParams assistant = AiServices.builder(AssistantWithChatParams.class)
    .chatModel(openAiChatModel)  // 或任何其他模型
    .build();
```

调用时传入按次生效的参数：

```java
ChatRequestParameters customParams = ChatRequestParameters.builder()
    .temperature(0.85)
    .build();

String answer = assistant.chat("你好！", customParams);
```

作为参数传入 AI Service 方法的 `ChatRequestParameters`，
也会传递给上一节提到的 `chatRequestTransformer`，因此必要时也可以在那里访问和修改。

## 合法 AI Service 方法示例

下面是一些合法的 AI Service 方法示例。

<details>
<summary>`UserMessage`</summary>

```java
String chat(String userMessage);

String chat(@UserMessage String userMessage);

String chat(@UserMessage String userMessage, ChatRequestParameters parameters);

String chat(@UserMessage String userMessage, @V("country") String country); // userMessage 中包含 "{{country}}" 模板变量

String chat(@UserMessage String userMessage, @UserMessage Content content); // content 可以是：TextContent、ImageContent、AudioContent、VideoContent、PdfFileContent 之一

String chat(@UserMessage String userMessage, @UserMessage ImageContent image); // 第二个参数也可以是：TextContent、ImageContent、AudioContent、VideoContent、PdfFileContent 之一

String chat(@UserMessage String userMessage, @UserMessage List<Content> contents);

String chat(@UserMessage String userMessage, @UserMessage List<ImageContent> images);

@UserMessage("德国的首都是哪里？")
String chat();

@UserMessage("{{it}} 的首都是哪里？")
String chat(String country);

@UserMessage("{{country}} 的首都是哪里？")
String chat(@V("country") String country);

@UserMessage("{{country}} 的 {{something}} 是什么？")
String chat(@V("something") String something, @V("country") String country);

@UserMessage("{{country}} 的首都是哪里？")
String chat(String country); // 仅在 Quarkus 和 Spring Boot 应用中可用
```
</details>

<details>
<summary>`SystemMessage` 与 `UserMessage`</summary>

```java
@SystemMessage("给定一个国家名称，请回答它的首都名称")
String chat(String userMessage);

@SystemMessage("给定一个国家名称，请回答它的首都名称")
String chat(@UserMessage String userMessage);

@SystemMessage("给定一个国家名称，{{answerInstructions}}")
String chat(@V("answerInstructions") String answerInstructions, @UserMessage String userMessage);

@SystemMessage("给定一个国家名称，请回答它的首都名称")
String chat(@UserMessage String userMessage, @V("country") String country); // userMessage 中包含 "{{country}}" 模板变量

@SystemMessage("给定一个国家名称，{{answerInstructions}}")
String chat(@V("answerInstructions") String answerInstructions, @UserMessage String userMessage, @V("country") String country); // userMessage 中包含 "{{country}}" 模板变量

@SystemMessage("给定一个国家名称，请回答它的首都名称")
@UserMessage("德国")
String chat();

@SystemMessage("给定一个国家名称，{{answerInstructions}}")
@UserMessage("德国")
String chat(@V("answerInstructions") String answerInstructions);

@SystemMessage("给定一个国家名称，请回答它的首都名称")
@UserMessage("{{it}}")
String chat(String country);

@SystemMessage("给定一个国家名称，请回答它的首都名称")
@UserMessage("{{country}}")
String chat(@V("country") String country);

@SystemMessage("给定一个国家名称，{{answerInstructions}}")
@UserMessage("{{country}}")
String chat(@V("answerInstructions") String answerInstructions, @V("country") String country);
```
</details>

## 多模态 {#multimodality}

除了文本内容之外，或者替代文本内容，
AI Service 方法也可以接收一个或多个 `Content` 或 `List<Content>` 参数：

```java
String chat(@UserMessage String userMessage, @UserMessage Content content);

String chat(@UserMessage String userMessage, @UserMessage ImageContent image);

String chat(@UserMessage String userMessage, @UserMessage ImageContent image, @UserMessage AudioContent audio);

String chat(@UserMessage String userMessage, @UserMessage List<Content> contents);

String chat(@UserMessage String userMessage, @UserMessage List<ImageContent> images);

String chat(Content content);

String chat(AudioContent content);

String chat(List<Content> contents);

String chat(List<AudioContent> contents);

String chat(@UserMessage Content content1, @UserMessage Content content2);

String chat(@UserMessage AudioContent audio, @UserMessage ImageContent image);
```

AI Service 会按照参数声明顺序，把所有内容放入最终的 `UserMessage` 中。

更多可用内容类型的说明，请参阅 [Content API](/tutorials/chat-and-language-models#multimodality)。


## 返回类型 {#return-types}

AI Service 方法可以返回下列类型之一：
- `String`：此时直接返回 LLM 生成的原始输出，不做任何处理 / 解析
- 任意 [结构化输出](/tutorials/structured-outputs#supported-types) 支持的类型：此时
AI Service 会先把 LLM 生成的输出解析为目标类型，再返回给调用方

任何返回类型都还可以进一步包装为 `Result<T>`，以便获取 AI Service 调用的额外元数据：
- `TokenUsage`：AI Service 调用过程中消耗的 token 总数。如果 AI Service 在过程中多次调用了
LLM（例如因为执行了工具），它会把所有调用的 token usage 累加起来。
- Sources：在 [RAG](/tutorials/ai-services#rag) 检索阶段获取到的 `Content`
- AI Service 调用过程中执行的全部 [tools](/tutorials/ai-services#tools-function-calling)（包括请求和结果）
- 最终聊天响应的 `FinishReason`
- 全部中间 `ChatResponse`
- 最终 `ChatResponse`

例如：
```java
interface Assistant {
    
    @UserMessage("为下面这个主题生成一份文章提纲：{{it}}")
    Result<List<String>> generateOutlineFor(String topic);
}

Result<List<String>> result = assistant.generateOutlineFor("Java");

List<String> outline = result.content();
TokenUsage tokenUsage = result.tokenUsage();
List<Content> sources = result.sources();
List<ToolExecution> toolExecutions = result.toolExecutions();
FinishReason finishReason = result.finishReason();
```

## 结构化输出 {#structured-outputs}

如果你希望从 LLM 获取结构化输出（例如一个复杂的 Java 对象），
而不是只得到 `String` 形式的非结构化文本，
你可以把 AI Service 方法的返回类型从 `String` 改为其他类型。

:::note
关于 Structured Outputs 的更多说明，请参阅[这里](/tutorials/structured-outputs)。
:::

几个示例：

### 返回类型为 `boolean`

```java
interface SentimentAnalyzer {

    @UserMessage("{{it}} 是否具有正向情感？")
    boolean isPositive(String text);

}

SentimentAnalyzer sentimentAnalyzer = AiServices.create(SentimentAnalyzer.class, model);

boolean positive = sentimentAnalyzer.isPositive("这太棒了！");
// true
```

### 返回类型为 `Enum`
```java
enum Priority {
    CRITICAL, HIGH, LOW
}

interface PriorityAnalyzer {
    
    @UserMessage("分析下面这个问题的优先级：{{it}}")
    Priority analyzePriority(String issueDescription);
}

PriorityAnalyzer priorityAnalyzer = AiServices.create(PriorityAnalyzer.class, model);

Priority priority = priorityAnalyzer.analyzePriority("主支付网关已宕机，客户无法完成交易。");
// CRITICAL
```

### 返回类型为 POJO
```java
class Person {

    @Description("一个人的名") // 你可以添加可选描述，帮助 LLM 更好地理解
    String firstName;
    String lastName;
    LocalDate birthDate;
    Address address;
}

@Description("一个地址") // 你可以添加可选描述，帮助 LLM 更好地理解
class Address {
    String street;
    Integer streetNumber;
    String city;
}

interface PersonExtractor {

    @UserMessage("从 {{it}} 中提取关于一个人的信息")
    Person extractPersonFrom(String text);
}

PersonExtractor personExtractor = AiServices.create(PersonExtractor.class, model);

String text = """
            1968 年，在独立日余韵尚未散去的时刻，
            一个名叫 John 的孩子在宁静的夜空下诞生。
            这个姓 Doe 的新生儿，就此开启了人生旅程。
            他出生在 Whispering Pines Avenue 345 号，
            那是一条安静的小街，位于 Springfield 的中心地带，
            仿佛回荡着郊区生活与梦想的温柔低鸣。
            """;

Person person = personExtractor.extractPersonFrom(text);

System.out.println(person); // Person { firstName = "John", lastName = "Doe", birthDate = 1968-07-04, address = Address { ... } }
```

## JSON 模式 {#json-mode}

当你要提取自定义 POJO（准确来说是先生成 JSON，再解析为 POJO）时，
建议在模型配置中启用“JSON mode”。
这样可以强制 LLM 以合法 JSON 的形式返回响应。

:::note
请注意，JSON mode 与 tools / function calling 是相似但不同的能力：
它们的 API 不同，用途也不同。

当你**总是**需要 LLM 以结构化格式（合法 JSON）返回结果时，JSON mode 非常适合。
而且这类场景通常不需要状态 / 记忆，因此每次交互都彼此独立。
例如，你可能想从一段文本中提取结构化信息，
比如提取文中提到的人物列表，
或把一段自由文本的商品评价转换为结构化对象，包含
`String productName`、`Sentiment sentiment`、`List<String> claimedProblems>` 等字段。

另一方面，当 LLM 需要能够执行某些动作时，tools / functions 会更适合
（例如查询数据库、搜索网页、取消用户预订等）。
在这种情况下，会把一组工具及其期望的 JSON schema 提供给 LLM，
并由它自主决定是否调用这些工具来满足用户请求。

过去，function calling 也常被用来提取结构化数据，
但现在我们有了更适合此用途的 JSON mode。
:::

启用 JSON mode 的方式如下：

- 对于 OpenAI：
  - 对支持 [Structured Outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) 的新模型（例如 `gpt-4o-mini`、`gpt-4o-2024-08-06`）：
    ```java
    OpenAiChatModel.builder()
        ...
        .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA)
        .strictJsonSchema(true)
        .build();
    ```
    更多细节请见[这里](/integrations/language-models/open-ai#structured-outputs)。
  - 对于较旧模型（例如 `gpt-3.5-turbo`、`gpt-4`）：
    ```java
    OpenAiChatModel.builder()
        ...
        .responseFormat("json_object")
        .build();
    ```

- 对于 Azure OpenAI：
```java
AzureOpenAiChatModel.builder()
    ...
    .responseFormat(new ChatCompletionsJsonResponseFormat())
    .build();
```

- 对于 Vertex AI Gemini：
```java
VertexAiGeminiChatModel.builder()
    ...
    .responseMimeType("application/json")
    .build();
```

也可以显式从 Java 类指定 schema：

```java
VertexAiGeminiChatModel.builder()
    ...
    .responseSchema(SchemaHelper.fromClass(Person.class))
    .build();
```

或者直接从 JSON schema 指定：

```java
VertexAiGeminiChatModel.builder()
    ...
    .responseSchema(Schema.builder()...build())
    .build();
```

- 对于 Google AI Gemini：
```java
GoogleAiGeminiChatModel.builder()
    ...
    .responseFormat(ResponseFormat.JSON)
    .build();
```

也可以显式从 Java 类指定 schema：

```java
GoogleAiGeminiChatModel.builder()
    ...
    .responseFormat(ResponseFormat.builder()
        .type(JSON)
        .jsonSchema(JsonSchemas.jsonSchemaFrom(Person.class).get())
        .build())
    .build();
```

或者直接从 JSON schema 指定：

```java
GoogleAiGeminiChatModel.builder()
    ...
    .responseFormat(ResponseFormat.builder()
        .type(JSON)
        .jsonSchema(JsonSchema.builder()...build())
        .build())
    .build();
```

- 对于 Mistral AI：
```java
MistralAiChatModel.builder()
    ...
    .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA)
    .strictJsonSchema(true)
    .build();
```

- 对于 Ollama：
```java
OllamaChatModel.builder()
    ...
    .responseFormat(JSON)
    .build();
```

- 对于其他模型提供商：如果底层厂商本身不支持 JSON mode，
最现实的选择就是 prompt engineering。同时，也建议适当降低 `temperature` 以获得更确定的输出。

[更多示例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/OtherServiceExamples.java)


## 流式输出 {#streaming}

当返回类型使用 `TokenStream` 时，AI Service 可以按 token 逐个[流式返回响应](/tutorials/response-streaming)：
```java

interface Assistant {

    TokenStream chat(String message);
}

StreamingChatModel model = OpenAiStreamingChatModel.builder()
    .apiKey(System.getenv("OPENAI_API_KEY"))
    .modelName(GPT_4_O_MINI)
    .build();

Assistant assistant = AiServices.create(Assistant.class, model);

TokenStream tokenStream = assistant.chat("讲个笑话");

CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();

tokenStream
    .onPartialResponse((String partialResponse) -> System.out.println(partialResponse))
    .onPartialThinking((PartialThinking partialThinking) -> System.out.println(partialThinking))
    .onRetrieved((List<Content> contents) -> System.out.println(contents))
    .onIntermediateResponse((ChatResponse intermediateResponse) -> System.out.println(intermediateResponse))
     // 当出现新的部分工具调用（通常只包含工具参数中的一个 token）时，会触发此回调。
    .onPartialToolCall((PartialToolCall partialToolCall) -> System.out.println(partialToolCall))
     // 在工具执行前触发。BeforeToolExecution 包含 ToolExecutionRequest（例如工具名、工具参数等）。
    .beforeToolExecution((BeforeToolExecution beforeToolExecution) -> System.out.println(beforeToolExecution))
     // 在工具执行后触发。ToolExecution 包含 ToolExecutionRequest 和工具执行结果。
    .onToolExecuted((ToolExecution toolExecution) -> System.out.println(toolExecution))
    .onCompleteResponse((ChatResponse response) -> futureResponse.complete(response))
    .onError((Throwable error) -> futureResponse.completeExceptionally(error))
    .start();

futureResponse.join(); // 阻塞主线程，直到另一个线程中的流式处理过程结束
```

### 流式取消

如果你希望取消流式输出，可以在以下任一回调中进行：
- `onPartialResponseWithContext(BiConsumer<PartialResponse, PartialResponseContext>)`
- `onPartialThinkingWithContext(BiConsumer<PartialThinking, PartialThinkingContext>)`

例如：
```java
tokenStream
    .onPartialResponseWithContext((PartialResponse partialResponse, PartialResponseContext context) -> {
        process(partialResponse);
        if (shouldCancel()) {
            context.streamingHandle().cancel();
        }
    })
    .onCompleteResponse((ChatResponse response) -> futureResponse.complete(response))
    .onError((Throwable error) -> futureResponse.completeExceptionally(error))
    .start();
```

当调用 `StreamingHandle.cancel()` 时，LangChain4j 会关闭连接并停止流式输出。
一旦调用了 `StreamingHandle.cancel()`，`TokenStream` 将不会再收到后续回调。

### Flux 反应流 {#flux}
你也可以使用 `Flux<String>` 代替 `TokenStream`。
为此，请引入 `langchain4j-reactor` 模块：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-reactor</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```
```java
interface Assistant {

  Flux<String> chat(String message);
}
```

[流式示例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithStreamingExample.java)


## 聊天记忆 {#chat-memory}

AI Service 可以使用[聊天记忆](/tutorials/chat-memory)来“记住”之前的交互：
```java
Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
    .build();
```
在这种情况下，同一个 `ChatMemory` 实例会被用于该 AI Service 的所有调用。
但如果你有多个用户，这种方式就不合适了，
因为每个用户都需要各自独立的 `ChatMemory` 实例来维护自己的会话状态。

解决方案是使用 `ChatMemoryProvider`：
```java

interface Assistant  {
    String chat(@MemoryId int memoryId, @UserMessage String message);
}

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .chatMemoryProvider(memoryId -> MessageWindowChatMemory.withMaxMessages(10))
    .build();

String answerToKlaus = assistant.chat(1, "你好，我叫 Klaus");
String answerToFrancine = assistant.chat(2, "你好，我叫 Francine");
```
在这个场景中，`ChatMemoryProvider` 会为每个 memory ID 提供不同的 `ChatMemory` 实例。

在这种方式下使用 `ChatMemory` 时，也要注意及时清理不再需要的会话记忆，
以避免内存泄漏。
如果你希望访问 AI Service 内部使用的 chat memory，只需要让定义接口继承 `ChatMemoryAccess`：
```java

interface Assistant extends ChatMemoryAccess {
    String chat(@MemoryId int memoryId, @UserMessage String message);
}
```
这样就可以既访问单个会话的 `ChatMemory`，也可以在会话结束时把它移除。

```java
String answerToKlaus = assistant.chat(1, "你好，我叫 Klaus");
String answerToFrancine = assistant.chat(2, "你好，我叫 Francine");

List<ChatMessage> messagesWithKlaus = assistant.getChatMemory(1).messages();
boolean chatMemoryWithFrancineEvicted = assistant.evictChatMemory(2);
```

:::note
请注意，如果某个 AI Service 方法没有参数标注 `@MemoryId`，
那么 `ChatMemoryProvider` 中的 `memoryId` 默认会是字符串 `"default"`。
:::

:::note
还请注意，不应针对同一个 `@MemoryId` 并发调用 AI Service，
否则可能导致 `ChatMemory` 被破坏。
目前 AI Service 并没有实现防止同一 `@MemoryId` 并发调用的机制。
:::

- [单个 ChatMemory 示例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithMemoryExample.java)
- [为每个用户使用 ChatMemory 的示例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithMemoryForEachUserExample.java)
- [单个持久化 ChatMemory 示例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithPersistentMemoryExample.java)
- [为每个用户使用持久化 ChatMemory 的示例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithPersistentMemoryForEachUserExample.java)


## Tools（函数调用） {#tools-function-calling}

AI Service 可以配置成让 LLM 使用工具：

```java

class Tools {
    
    @Tool
    int add(int a, int b) {
        return a + b;
    }

    @Tool
    int multiply(int a, int b) {
        return a * b;
    }
}

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .tools(new Tools())
    .build();

String answer = assistant.chat("1+2 和 3*4 分别是多少？");
```
在这个场景中，LLM 会先请求执行 `add(1, 2)` 和 `multiply(3, 4)` 方法，
然后再给出最终答案。
LangChain4j 会自动执行这些方法。

关于 tools 的更多细节，请参阅[这里](/tutorials/tools#high-level-tool-api)。


## RAG {#rag}

AI Service 可以通过配置 `ContentRetriever` 来启用[naive RAG](/tutorials/rag#naive-rag)：
```java

EmbeddingStore embeddingStore  = ...
EmbeddingModel embeddingModel = ...

ContentRetriever contentRetriever = new EmbeddingStoreContentRetriever(embeddingStore, embeddingModel);

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .contentRetriever(contentRetriever)
    .build();
```

如果配置 `RetrievalAugmentor`，则可以获得更大的灵活性，
支持[advanced RAG](/tutorials/rag#advanced-rag)中的能力，例如查询转换、重排序等：
```java
RetrievalAugmentor retrievalAugmentor = DefaultRetrievalAugmentor.builder()
        .queryTransformer(...)
        .queryRouter(...)
        .contentAggregator(...)
        .contentInjector(...)
        .executor(...)
        .build();

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .retrievalAugmentor(retrievalAugmentor)
    .build();
```

### RAG 作为 Tool

默认情况下，每个用户查询都会执行内容检索。
另一种做法是将检索视为一种类似工具的能力，仅当模型判断需要额外上下文时才触发。
这样一来，检索仍然属于 RAG 流程的一部分，但会按需执行，
从而避免对简单问题进行不必要的搜索。

要实现这一点，你可以把 `ContentRetriever` 封装进一个 `@Tool`，
并把它注册到 AiServices 中。
这样，LLM 就可以根据工具描述自主决定是否触发检索。

#### 1. 定义检索工具

创建一个包装 `ContentRetriever` 的类。
`@Tool` 的描述非常关键，因为它会告诉 LLM 在什么情况下应该发起搜索。

```java
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.query.Query;

import java.util.stream.Collectors;

static class SearchTool {

    private final ContentRetriever contentRetriever;

    SearchTool(ContentRetriever contentRetriever) {
        this.contentRetriever = contentRetriever;
    }

    @Tool("搜索与 LangChain4j 和 RAG 配置相关的技术信息")
    public String search(String query) {
        // 这段逻辑仅在 LLM 判断确实需要检索时才会执行
        return contentRetriever.retrieve(new Query(query)).stream()
                .map(content -> content.textSegment().text())
                .collect(Collectors.joining("\n\n"));
    }
}
```

#### 2. 将工具注册到 AiServices 中

不要使用全局 RetrievalAugmentor，而是把检索逻辑注册成一个 tool。

```java
Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(model)
        .tools(new SearchTool(contentRetriever))
        .build();
```

#### 3. 预期行为

LLM 会根据用户意图和工具描述，决定是否执行搜索。

**场景 A：普通对话**

- **输入：**  
  `Hello, how are you today?`

- **行为：**  
  LLM 直接基于自身内部知识作答，不调用该工具。


**场景 B：技术问题**

- **输入：**  
  `How do I configure a ContentRetriever?`

- **行为：**  
  LLM 识别到这是技术性问题，于是调用 `search()`，并基于检索到的文档生成回答。

这种方式使检索成为一种**按需能力**，更像一个工具，而不是每个查询都必须执行的固定步骤。

关于 RAG 的更多细节，请参阅[这里](/tutorials/rag)。

更多 RAG 示例可参考[这里](https://github.com/langchain4j/langchain4j-examples/tree/main/rag-examples/src/main/java)。


## 自动内容审核 {#auto-moderation}

AI Services 可以自动执行内容审核。
当检测到不合适内容时，会抛出 `ModerationException`，其中包含原始的 `Moderation` 对象。
该对象会包含被标记内容的相关信息，例如究竟是哪一段文本被标记了。

可以在构建 AI Service 时配置 auto-moderation：

```java
Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .moderationModel(moderationModel)  // 配置 moderation model
    .build();
```


[示例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithAutoModerationExample.java)

## 串联多个 AI Services
随着由 LLM 驱动的应用逻辑越来越复杂，
像传统软件开发那样把它拆成更小的部分，会变得越来越重要。

例如，把所有可能场景的说明都塞进 system prompt 往往既容易出错又低效。
当指令过多时，LLM 可能会忽略其中的一部分。
而且指令呈现的顺序也会影响结果，使得这个过程更加棘手。

这一原则同样适用于 tools、RAG 以及 `temperature`、`maxTokens` 等模型参数。

你的聊天机器人很可能并不需要在任何时候都知道你拥有的全部工具。
例如，当用户只是打招呼或者说再见时，
把几十甚至上百个工具全部暴露给 LLM 不仅成本高，而且有时还很危险
（每个工具都会消耗不少 token），
还可能导致意外结果（LLM 可能幻觉式地调用工具，或被诱导以非预期输入调用工具）。

RAG 也是一样：有些时候确实需要为 LLM 提供上下文，
但并不是所有时候都需要，因为这会增加额外成本（上下文越多，token 越多）
并提高响应延迟（上下文越多，延迟越高）。

关于模型参数也是类似：在某些情况下，你可能需要 LLM 高度确定，
因此会设置较低的 `temperature`。而在另一些场景下，你可能更希望它更具创造性，
于是就会提高 `temperature`，等等。

重点在于，更小、更专用的组件更容易开发、测试、维护和理解，成本也更低。

还需要考虑另一个维度的两种极端：
- 你是否希望应用本身高度确定，
由应用控制整个流程，而 LLM 只是其中一个组件？
- 或者你希望 LLM 拥有完全自主性，由它来驱动应用？

又或者根据场景混合使用这两种模式？
当你把应用拆解成更小、更可控的部分时，这些选择就都成为可能。

AI Services 可以与常规的（确定性的）软件组件一起使用，并且相互组合：
- 你可以一个接一个地调用 AI Service（也就是 chaining）。
- 你可以使用确定性的和 LLM 驱动的 `if` / `else` 逻辑（AI Services 可以返回 `boolean`）。
- 你可以使用确定性的和 LLM 驱动的 `switch` 逻辑（AI Services 可以返回 `enum`）。
- 你可以使用确定性的和 LLM 驱动的 `for` / `while` 循环（AI Services 可以返回 `int` 和其他数值类型）。
- 你可以在单元测试里 mock 一个 AI Service（因为它本质上是接口）。
- 你可以对每个 AI Service 单独做集成测试。
- 你可以分别评估并为每个 AI Service 找到最优参数。
- 等等。

来看一个简单例子。
我想为公司构建一个聊天机器人。
如果用户是在打招呼，
我希望它直接返回预定义的欢迎语，而不是依赖 LLM 来生成这句欢迎语。
如果用户提出问题，我希望 LLM 基于公司的内部知识库（也就是 RAG）来生成回答。

这个任务可以拆成两个独立的 AI Service：
```java
interface GreetingExpert {

    @UserMessage("下面这段文本是否是一句问候？文本：{{it}}")
    boolean isGreeting(String text);
}

interface ChatBot {

    @SystemMessage("你是 Miles of Smiles 公司的礼貌聊天机器人。")
    String reply(String userMessage);
}

class MilesOfSmiles {

    private final GreetingExpert greetingExpert;
    private final ChatBot chatBot;
    
    ...
    
    public String handle(String userMessage) {
        if (greetingExpert.isGreeting(userMessage)) {
            return "来自 Miles of Smiles 的问候！我可以怎样让你今天更开心一些？";
        } else {
            return chatBot.reply(userMessage);
        }
    }
}

GreetingExpert greetingExpert = AiServices.create(GreetingExpert.class, llama2);

ChatBot chatBot = AiServices.builder(ChatBot.class)
    .chatModel(gpt4)
    .contentRetriever(milesOfSmilesContentRetriever)
    .build();

MilesOfSmiles milesOfSmiles = new MilesOfSmiles(greetingExpert, chatBot);

String greeting = milesOfSmiles.handle("你好");
System.out.println(greeting); // 来自 Miles of Smiles 的问候！我可以怎样让你今天更开心一些？

String answer = milesOfSmiles.handle("你们提供哪些服务？");
System.out.println(answer); // 在 Miles of Smiles，我们提供种类丰富的服务……
```

注意这里：我们用更便宜的 Llama2 来完成“判断文本是否是问候语”这一简单任务，
而用更昂贵的 GPT-4 再配合内容检索器（RAG）来处理更复杂的任务。

这只是一个非常简单、也略显朴素的例子，但应该足以说明这个思路。

现在，我可以 mock 掉 `GreetingExpert` 和 `ChatBot`，并单独测试 `MilesOfSmiles`。
同时，我也可以分别对 `GreetingExpert` 和 `ChatBot` 做集成测试。
我还能分别评估它们，并为每个子任务找到最优参数，
长期来看，甚至可以为每个特定子任务微调一个更小、更专用的模型。


## 测试

- [Customer Support Agent 集成测试示例](https://github.com/langchain4j/langchain4j-examples/blob/main/customer-support-agent-example/src/test/java/dev/langchain4j/example/CustomerSupportAgentIT.java)


## 相关教程
- [LangChain4j AiServices Tutorial](https://www.sivalabs.in/langchain4j-ai-services-tutorial/)，作者 [Siva](https://www.sivalabs.in/)
