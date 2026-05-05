---
sidebar_position: 5
---

# 响应流式传输

:::note
本页介绍的是低层 LLM API 中的 response streaming。
高层 LLM API 请参阅 [AI Services](/tutorials/ai-services#streaming)。
:::

LLM 是按 token 逐个生成文本的，
因此许多 LLM 提供商都支持按 token 流式返回响应，
而不是等整段文本全部生成完再一次性返回。
这能显著提升用户体验，因为用户不需要等待一段未知时长，
几乎可以立刻开始阅读返回内容。

对于 `ChatModel` 和 `LanguageModel` 接口，
LangChain4j 分别提供了对应的 `StreamingChatModel` 和 `StreamingLanguageModel` 接口。
它们的 API 形式相近，但支持流式返回响应。
调用时需要传入一个 `StreamingChatResponseHandler` 接口的实现。

```java
public interface StreamingChatResponseHandler {

    default void onPartialResponse(String partialResponse) {}
    default void onPartialResponse(PartialResponse partialResponse, PartialResponseContext context) {}

    default void onPartialThinking(PartialThinking partialThinking) {}
    default void onPartialThinking(PartialThinking partialThinking, PartialThinkingContext context) {}

    default void onPartialToolCall(PartialToolCall partialToolCall) {}
    default void onPartialToolCall(PartialToolCall partialToolCall, PartialToolCallContext context) {}

    default void onCompleteToolCall(CompleteToolCall completeToolCall) {}

    void onCompleteResponse(ChatResponse completeResponse);

    void onError(Throwable error);
}
```

通过实现 `StreamingChatResponseHandler`，
你可以为以下事件定义处理逻辑：
- 当生成下一段部分文本响应时，会调用 `onPartialResponse(String)`
  或 `onPartialResponse(PartialResponse, PartialResponseContext)`
  （你可以任选其一实现）。
  根据不同 LLM 提供商的实现，部分响应文本可能只包含一个 token，也可能包含多个 token。
  例如，你可以在 token 一可用时就立刻把它推送到 UI。
- 当生成下一段部分 thinking / reasoning 文本时，会调用 `onPartialThinking(PartialThinking)`
  或 `onPartialThinking(PartialThinking, PartialThinkingContext)`
  （你也可以任选其一实现）。
  根据不同 LLM 提供商的实现，部分 thinking 文本可能由一个或多个 token 组成。
- 当生成下一段[部分 tool call](/tutorials/tools#using-streamingchatmodel) 时，
  会调用 `onPartialToolCall(PartialToolCall)`
  或 `onPartialToolCall(PartialToolCall, PartialToolCallContext)`
  （同样任选其一实现即可）。
- 当 LLM 完成某一次单独 tool call 的流式输出时，会调用 `onCompleteToolCall(CompleteToolCall)`。
- 当 LLM 完成整个响应生成时，会调用 `onCompleteResponse(ChatResponse)`。
  其中 `ChatResponse` 包含完整响应（`AiMessage`）以及 `ChatResponseMetadata`。
- 当发生错误时，会调用 `onError(Throwable error)`。

下面是一个使用 `StreamingChatModel` 实现流式响应的示例：
```java
StreamingChatModel model = OpenAiStreamingChatModel.builder()
    .apiKey(System.getenv("OPENAI_API_KEY"))
    .modelName(GPT_4_O_MINI)
    .build();

String userMessage = "Tell me a joke";

model.chat(userMessage, new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(String partialResponse) {
        System.out.println("onPartialResponse: " + partialResponse);
    }

    @Override
    public void onPartialThinking(PartialThinking partialThinking) {
        System.out.println("onPartialThinking: " + partialThinking);
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

还有一种更紧凑的方式可以实现流式响应，即使用 `LambdaStreamingResponseHandler` 类。
这个工具类提供了一组静态方法，可以借助 lambda 表达式快速创建 `StreamingChatResponseHandler`。
使用 lambda 来处理流式响应非常直接：
只需调用 `onPartialResponse()` 静态方法，
并传入一个定义“如何处理部分响应”的 lambda 表达式即可：

```java
import static dev.langchain4j.model.LambdaStreamingResponseHandler.onPartialResponse;

model.chat("Tell me a joke", onPartialResponse(System.out::print));
```

`onPartialResponseAndError()` 方法允许你同时定义
`onPartialResponse()` 和 `onError()` 的处理逻辑：

```java
import static dev.langchain4j.model.LambdaStreamingResponseHandler.onPartialResponseAndError;

model.chat("Tell me a joke", onPartialResponseAndError(System.out::print, Throwable::printStackTrace));
```

## 流式取消 {#streaming-cancellation}

如果你希望主动取消流式输出，可以在以下任意方法内部执行取消：
- `onPartialResponse(PartialResponse, PartialResponseContext)`
- `onPartialThinking(PartialThinking, PartialThinkingContext)`
- `onPartialToolCall(PartialToolCall, PartialToolCallContext)`

context 对象中包含 `StreamingHandle`，
可以用它来取消流式输出：
```java
model.chat(userMessage, new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(PartialResponse partialResponse, PartialResponseContext context) {
        process(partialResponse);
        if (shouldCancel()) {
            context.streamingHandle().cancel();
        }
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

当调用 `StreamingHandle.cancel()` 后，LangChain4j 会关闭连接并停止流式输出。
一旦 `StreamingHandle.cancel()` 被调用，
`StreamingChatResponseHandler` 就不会再收到任何后续回调。
