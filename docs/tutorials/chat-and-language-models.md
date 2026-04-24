---
sidebar_position: 2
---

# 聊天模型与语言模型

:::note
本页介绍的是底层 LLM API。
高层 LLM API 请参阅 [AI Services](/tutorials/ai-services)。
:::

:::note
所有已支持的 LLM 可在[这里](/integrations/language-models)查看。
:::

LLM 目前主要通过两种 API 形式提供：
- `LanguageModel`。它的 API 非常简单，接受 `String` 作为输入，并返回 `String` 作为输出。
  随着聊天 API（第二种 API 形式）的普及，这套 API 正逐渐变得过时。
- `ChatModel`。它接受多个 `ChatMessage` 作为输入，并返回单个 `AiMessage` 作为输出。
  `ChatMessage` 通常包含文本，但某些 LLM 还支持其他模态（例如图片、音频等）。
  这类聊天模型的例子包括 OpenAI 的 `gpt-4o-mini` 和 Google 的 `gemini-1.5-pro`。

LangChain4j 不会继续扩展对 `LanguageModel` 的支持，
因此所有新特性都会基于 `ChatModel` API。

`ChatModel` 是 LangChain4j 中与 LLM 交互的底层 API，提供了最大的能力和灵活性。
另外还有一个高层 API（[AI Services](/tutorials/ai-services)），
我们会在讲完基础之后再介绍它。

除了 `ChatModel` 和 `LanguageModel` 之外，LangChain4j 还支持以下几类模型：
- `EmbeddingModel`：可将文本转换为 `Embedding`
- `ImageModel`：可生成和编辑 `Image`
- `ModerationModel`：可检查文本是否包含有害内容
- `ScoringModel`：可根据查询对多段文本打分（或排序），
  本质上是在判断每一段文本与查询的相关度。这对于 [RAG](/tutorials/rag) 非常有用。
这些内容会在后面继续介绍。

现在我们来更仔细地看看 `ChatModel` API。

```java
public interface ChatModel {

    String chat(String userMessage);
    
    ...
}
```
如你所见，这里有一个简单的 `chat` 方法，它接受 `String` 输入并返回 `String` 输出，和 `LanguageModel` 很像。
这只是一个便捷方法，让你无需先手动把 `String` 包装成 `UserMessage`，就能快速开始试验。

下面是其他 chat API 方法：
```java
    ...
    
    ChatResponse chat(ChatMessage... messages);

    ChatResponse chat(List<ChatMessage> messages);
        
    ...
```

这些版本的 `chat` 方法接受一个或多个 `ChatMessage` 作为输入。
`ChatMessage` 是表示聊天消息的基础接口。
下一节会更详细地介绍 chat messages。

如果你希望自定义请求（例如指定 model name、temperature、tools、JSON schema 等），
可以使用 `chat(ChatRequest)` 方法：
```java
    ...
    
    ChatResponse chat(ChatRequest chatRequest);
        
    ...
```

```java
ChatRequest chatRequest = ChatRequest.builder()
    .messages(...)
    .modelName(...)
    .temperature(...)
    .topP(...)
    .topK(...)
    .frequencyPenalty(...)
    .presencePenalty(...)
    .maxOutputTokens(...)
    .stopSequences(...)
    .toolSpecifications(...)
    .toolChoice(...)
    .responseFormat(...)
    .parameters(...) // 你也可以一次性设置通用参数或厂商专用参数
    .build();

ChatResponse chatResponse = chatModel.chat(chatRequest);
```

### `ChatMessage` 的类型 {#types-of-chatmessage}
目前一共有五种 chat message 类型，它们分别对应消息的不同“来源”：

- `UserMessage`：来自用户的消息。
  这里的用户既可以是你应用的终端用户（人类），也可以是你的应用本身。
  它可以包含：
    - `contents()`：消息的内容。根据 LLM 支持的模态不同，
      它既可以只包含单个文本（`String`），
      也可以包含[其他模态](/tutorials/chat-and-language-models#multimodality)。
    - `name()`：用户名称。不是所有模型提供商都支持。
    - `attributes()`：附加属性。这些属性不会发送给模型，
      但会存储到 [`ChatMemory`](/tutorials/chat-memory) 中。
- `AiMessage`：AI 针对已发送消息所生成的响应。
  它可以包含：
    - `text()`：文本内容
    - `thinking()`：思考 / 推理内容
    - `toolExecutionRequests()`：执行工具的请求。我们会在
      [另一节](/tutorials/tools)中介绍 tools。
    - `attributes()`：附加属性，通常是厂商专用信息
- `ToolExecutionResultMessage`：`ToolExecutionRequest` 的执行结果。
- `SystemMessage`：来自系统的消息。
  通常应该由你这个开发者来定义它的内容。
  一般会在这里写明 LLM 在这段对话中的角色、行为方式、回答风格等指令。
  LLM 在训练时通常会更加重视 `SystemMessage`，因此你需要谨慎处理，
  最好不要让终端用户自由定义或注入 `SystemMessage` 的内容。
  它通常位于对话开头。
- `CustomMessage`：可包含任意属性的自定义消息类型。
  只有支持它的 `ChatModel` 实现才能使用这种消息（目前仅 Ollama 支持）。

现在我们已经了解了所有 `ChatMessage` 类型，接下来看看如何在对话中组合使用它们。

在最简单的场景下，我们只需要给 `chat` 方法传入一个 `UserMessage` 实例即可。
这和接受 `String` 输入的那个 `chat` 方法类似。
最大的区别在于，这里返回的不再是 `String`，而是 `ChatResponse`。
除了 `AiMessage` 之外，`ChatResponse` 还包含 `ChatResponseMetadata`。
`ChatResponseMetadata` 中有 `TokenUsage`，它会记录输入中包含了多少 token
（也就是你传给生成方法的所有 `ChatMessage` 的 token 数量）、
输出生成了多少 token（在 `AiMessage` 中），以及总计的 token 数（输入 + 输出）。
你会需要这些信息来计算一次 LLM 调用的成本。
此外，`ChatResponseMetadata` 还包含 `FinishReason`，
它是一个枚举，用于表示生成停止的原因。
通常，如果是 LLM 自己决定停止生成，那么它会是 `FinishReason.STOP`。

创建 `UserMessage` 有多种方式，取决于内容类型。
最简单的是 `new UserMessage("Hi")` 或 `UserMessage.from("Hi")`。

### 多个 `ChatMessage` {#multiple-chatmessages}
那么，为什么有时你需要传入多个 `ChatMessage`，而不只是一个？
这是因为 LLM 天生是无状态的，也就是说它并不会自己维护对话状态。
因此，如果你想支持多轮对话，就需要自己负责管理会话上下文。

假设你要构建一个聊天机器人。下面是一段简单的多轮对话示例：
- 用户：你好，我叫 Klaus
- AI：你好 Klaus，我能帮你什么？
- 用户：我叫什么名字？
- AI：Klaus

使用 `ChatModel` 时，交互会像这样：
```java
UserMessage firstUserMessage = UserMessage.from("你好，我叫 Klaus");
AiMessage firstAiMessage = model.chat(firstUserMessage).aiMessage(); // 你好 Klaus，我能帮你什么？
UserMessage secondUserMessage = UserMessage.from("我叫什么名字？");
AiMessage secondAiMessage = model.chat(firstUserMessage, firstAiMessage, secondUserMessage).aiMessage(); // Klaus
```
如你所见，在第二次调用 `chat` 方法时，我们传入的不只是单独的 `secondUserMessage`，
还包括了这段对话之前的消息。

手工维护和管理这些消息会非常繁琐。
因此才有了 `ChatMemory` 这个概念，我们会在[下一节](/tutorials/chat-memory)继续介绍。

### 多模态 {#multimodality}

`UserMessage` 不仅可以包含文本，还可以包含其他类型的内容。
`UserMessage` 内部持有的是一个 `List<Content> contents`。
`Content` 是一个接口，目前有以下实现：
- `TextContent`
- `ImageContent`
- `AudioContent`
- `VideoContent`
- `PdfFileContent`

你可以在[这里](/integrations/language-models)的对比表中查看不同 LLM 提供商分别支持哪些模态。

下面是一个同时向 LLM 发送文本和图片的例子：
```java
UserMessage userMessage = UserMessage.from(
    TextContent.from("请描述下面这张图片"),
    ImageContent.from("https://example.com/cat.jpg")
);
ChatResponse response = model.chat(userMessage);
```

#### 文本内容
`TextContent` 是最简单的一种 `Content`，它表示纯文本，并封装一个 `String`。
`UserMessage.from(TextContent.from("Hello!"))` 等价于 `UserMessage.from("Hello!")`。

你可以在一个 `UserMessage` 中放入一个或多个 `TextContent`：
```java
UserMessage userMessage = UserMessage.from(
    TextContent.from("你好！"),
    TextContent.from("你好吗？")
);
```

#### 图片内容
根据不同的 LLM 提供商，`ImageContent` 可以通过**远程**图片 URL 创建（见前面的例子），
也可以通过 Base64 编码后的二进制数据创建：
```java
byte[] imageBytes = readBytes("/home/me/cat.jpg");
String base64Data = Base64.getEncoder().encodeToString(imageBytes);
ImageContent imageContent = ImageContent.from(base64Data, "image/jpg");
UserMessage userMessage = UserMessage.from(imageContent);
```

你还可以指定 `DetailLevel` 枚举（`LOW` / `HIGH` / `AUTO`）来控制模型处理图片的精细程度。
更多细节请参阅[这里](https://platform.openai.com/docs/guides/vision#low-or-high-fidelity-image-understanding)。

#### 音频内容
`AudioContent` 与 `ImageContent` 类似，只不过表示的是音频内容。

#### 视频内容
`VideoContent` 与 `ImageContent` 类似，只不过表示的是视频内容。

#### PDF 文件内容
`PdfFileContent` 与 `ImageContent` 类似，只不过表示的是 PDF 文件的二进制内容。

### Kotlin 扩展

`ChatModel` 的 [Kotlin 扩展](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-kotlin/src/main/kotlin/dev/langchain4j/kotlin/model/chat/ChatModelExtensions.kt)
提供了基于 Kotlin [协程](https://kotlinlang.org/docs/coroutines-guide.html)的异步方法，
用于处理与语言模型的聊天交互。
`chatAsync` 方法可以对 `ChatRequest` 或 `ChatRequest.Builder` 配置进行非阻塞处理，
并返回包含模型回复的 `ChatResponse`。
类似地，`generateAsync` 也可以异步生成聊天消息的响应。
这些扩展能够帮助你在 Kotlin 应用中更高效地构建聊天请求和处理会话。
请注意，这些方法目前被标记为 experimental，后续可能发生变化。

**`ChatModel.chatAsync(request: ChatRequest)`**：
这是一个面向 Kotlin 协程设计的*异步*扩展函数。
它会在协程作用域内借助 `Dispatchers.IO` 包装同步的 `chat` 方法。
这样就能实现非阻塞操作，这对于保持应用响应性非常关键。
它之所以命名为 `chatAsync`，就是为了避免和现有同步版 `chat` 冲突。
它的函数签名是：`suspend fun ChatModel.chatAsync(request: ChatRequest): ChatResponse`。
关键字 `suspend` 表示这是一个协程函数。

**`ChatModel.chat(block: ChatRequestBuilder.() -> Unit)`**：
这是 `chat` 的另一种变体，通过 Kotlin 的 type-safe builder DSL 提供更简洁的写法。
它能够简化 `ChatRequest` 对象的构建，同时内部使用 `chatAsync` 实现异步执行。
这种形式兼顾了简洁性与基于协程的非阻塞特性。
