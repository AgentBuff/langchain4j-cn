---
sidebar_position: 3
---

# 聊天记忆

手动维护和管理 `ChatMessage` 会很繁琐。
因此，LangChain4j 提供了 `ChatMemory` 抽象，以及多个开箱即用的实现。

`ChatMemory` 可以作为独立的底层组件使用，
也可以作为 [AI Services](/tutorials/ai-services) 这类高层组件的一部分使用。

`ChatMemory` 本质上是一个 `ChatMessage` 容器（底层由 `List` 支撑），
同时还附带以下额外能力：
- 驱逐策略（Eviction policy）
- 持久化
- 对 `SystemMessage` 的特殊处理
- 对 [tool](/tutorials/tools) 消息的特殊处理

## Memory 与 History 的区别 {#memory-vs-history}

请注意，“memory”和“history”这两个概念相似，但并不相同。
- History 会将用户与 AI 之间的**所有**消息都**原样**保存下来。History 是用户在 UI 中看到的内容，它代表真实发生过的对话。
- Memory 保存的是**部分信息**，这些信息会被提供给 LLM，让它表现得像是“记住了”对话。

Memory 与 history 差别很大。根据所采用的 memory 算法不同，
它可能会以多种方式改写 history：
驱逐某些消息、总结多条消息、总结单条消息、从消息中删除不重要的细节、
向消息中注入额外信息（例如用于 RAG）或指令（例如用于结构化输出）等等。

LangChain4j 当前只提供 “memory”，不提供 “history”。
如果你需要保留完整 history，请自行手动维护。

## 驱逐策略 {#eviction-policy}

驱逐策略之所以必要，主要有以下几个原因：
- 为了适应 LLM 的上下文窗口。LLM 一次能处理的 token 数量是有上限的。
  随着对话变长，最终可能会超出这个限制。这时就必须驱逐掉一些消息。
  通常会优先驱逐最旧的消息，但如果有需要，也完全可以实现更复杂的算法。
- 为了控制成本。每个 token 都有成本，因此随着对话增长，每次调用 LLM 都会越来越贵。
  驱逐不必要的消息可以降低成本。
- 为了控制延迟。发送给 LLM 的 token 越多，它处理所需的时间也越长。

当前，LangChain4j 提供了两种开箱即用的实现：
- 更简单的是 `MessageWindowChatMemory`。它工作方式类似滑动窗口，
  只保留最近的 `N` 条消息，并驱逐那些不再适合保留的旧消息。
  但由于每条消息包含的 token 数量并不固定，
  `MessageWindowChatMemory` 更适合快速原型验证。
- 更成熟的一种是 `TokenWindowChatMemory`。
  它同样采用滑动窗口思路，但关注的是保留最近的 `N` 个**token**，
  并在需要时驱逐较早的消息。
  消息是不可分割的；如果某条消息放不下，就会整条被驱逐。
  `TokenWindowChatMemory` 需要一个 `TokenCountEstimator`，
  用于统计每条 `ChatMessage` 的 token 数量。

## 持久化 {#persistence}

默认情况下，`ChatMemory` 的实现会把 `ChatMessage` 保存在内存中。

如果需要持久化，可以实现一个自定义 `ChatMemoryStore`，
把 `ChatMessage` 保存到你选择的任意持久化存储中：
```java
class PersistentChatMemoryStore implements ChatMemoryStore {

        @Override
        public List<ChatMessage> getMessages(Object memoryId) {
          // TODO: Implement getting all messages from the persistent store by memory ID.
          // ChatMessageDeserializer.messageFromJson(String) and 
          // ChatMessageDeserializer.messagesFromJson(String) helper methods can be used to
          // easily deserialize chat messages from JSON.
        }

        @Override
        public void updateMessages(Object memoryId, List<ChatMessage> messages) {
            // TODO: Implement updating all messages in the persistent store by memory ID.
            // ChatMessageSerializer.messageToJson(ChatMessage) and 
            // ChatMessageSerializer.messagesToJson(List<ChatMessage>) helper methods can be used to
            // easily serialize chat messages into JSON.
        }

        @Override
        public void deleteMessages(Object memoryId) {
          // TODO: Implement deleting all messages in the persistent store by memory ID.
        }
    }

ChatMemory chatMemory = MessageWindowChatMemory.builder()
        .id("12345")
        .maxMessages(10)
        .chatMemoryStore(new PersistentChatMemoryStore())
        .build();
```

每当有新的 `ChatMessage` 被加入 `ChatMemory` 时，都会调用 `updateMessages()` 方法。
在一次与 LLM 的交互过程中，这通常会发生两次：
一次是新增 `UserMessage` 时，
另一次是新增 `AiMessage` 时。
`updateMessages()` 方法应当更新与该 memory ID 关联的全部消息。
`ChatMessage` 可以单独存储（例如每条消息单独一条记录 / 一行 / 一个对象），
也可以整体存储（例如整个 `ChatMemory` 只对应一条记录 / 一行 / 一个对象）。

:::note
请注意，那些从 `ChatMemory` 中被驱逐出去的消息，
也会同步从 `ChatMemoryStore` 中移除。
当某条消息被驱逐时，会再次调用 `updateMessages()`，
并传入一个不再包含该消息的消息列表。
:::

每当 `ChatMemory` 的使用方请求获取全部消息时，就会调用 `getMessages()` 方法。
这通常在每次与 LLM 交互时发生一次。
参数 `Object memoryId` 的值，对应于创建 `ChatMemory` 时指定的 `id`。
它可以用来区分不同的用户和 / 或不同的会话。
`getMessages()` 方法应返回与该 memory ID 关联的全部消息。

每当调用 `ChatMemory.clear()` 时，就会调用 `deleteMessages()` 方法。
如果你没有使用这个能力，可以把这个方法留空。

## 对 `SystemMessage` 的特殊处理 {#special-treatment-of-systemmessage}

`SystemMessage` 是一种特殊类型的消息，因此它与其他消息类型的处理方式不同：
- 一旦加入，`SystemMessage` 会始终被保留。
- 同一时刻只能保留一条 `SystemMessage`。
- 如果新增的 `SystemMessage` 内容与当前相同，它会被忽略。
- 如果新增的 `SystemMessage` 内容不同，它会替换掉之前那条。
  默认情况下，新的 `SystemMessage` 会被添加到消息列表末尾。
  如果你希望改变这一点，可以在创建 `ChatMemory` 时设置 `alwaysKeepSystemMessageFirst` 属性。

## 对 tool 消息的特殊处理 {#special-treatment-of-tool-messages}

如果一条包含 `ToolExecutionRequest` 的 `AiMessage` 被驱逐，
那么紧随其后的孤立 `ToolExecutionResultMessage` 也会被自动一并驱逐，
以避免某些 LLM 提供商（例如 OpenAI）出现问题。
因为这些提供商不允许在请求中发送孤立的 `ToolExecutionResultMessage`。

## 示例 {#examples}
- 配合 `AiServices`：
  - [Chat memory](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithMemoryExample.java)
  - [Separate chat memory for each user](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithMemoryForEachUserExample.java)
  - [Persistent chat memory](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithPersistentMemoryExample.java)
  - [Persistent chat memory for each user](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithPersistentMemoryForEachUserExample.java)
- 配合遗留 `Chain`：
  - [Chat memory with ConversationalChain](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ChatMemoryExamples.java)
  - [Chat memory with ConversationalRetrievalChain](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ChatWithDocumentsExamples.java)

所有支持的 chat memory store 可在[这里](/integrations/chat-memory-stores/)查看。


## 相关教程 {#related-tutorials}
- [Generative AI Conversations using LangChain4j ChatMemory](https://www.sivalabs.in/generative-ai-conversations-using-langchain4j-chat-memory/) by [Siva](https://www.sivalabs.in/)
