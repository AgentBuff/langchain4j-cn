---
sidebar_position: 18
---

# Qianfan（千帆）

[百度智能云千帆大模型](https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application)
![image](https://github.com/langchain4j/langchain4j/assets/95265298/600f8006-4484-4a75-829c-c8c16a3130c2)


## Maven 依赖

千帆可在纯 Java 或 Spring Boot 应用中使用。

### 纯 Java

:::note
自 `1.0.0-alpha1` 起，`langchain4j-qianfan` 已迁移至 `langchain4j-community`，并更名为 `langchain4j-community-qianfan`。
:::

`1.0.0-alpha1` 之前：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-qianfan</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-alpha1` 及以上版本：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-qianfan</artifactId>
    <version>${latest version here}</version>
</dependency>
```

### Spring Boot

:::note
自 `1.0.0-alpha1` 起，`langchain4j-qianfan-spring-boot-starter` 已迁移至 `langchain4j-community`，并更名为
`langchain4j-community-qianfan-spring-boot-starter`。
:::

`1.0.0-alpha1` 之前：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-qianfan-spring-boot-starter</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-alpha1` 及以上版本：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-qianfan-spring-boot-starter</artifactId>
    <version>${latest version here}</version>
</dependency>
```

或者，使用 BOM 统一管理依赖版本：

```xml

<dependencyManagement>
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-community-bom</artifactId>
        <version>${latest version here}</version>
        <type>pom</type>
        <scope>import</scope>
    </dependency>
</dependencyManagement>
```

## QianfanChatModel

[千帆所有模型及付费状态](https://console.bce.baidu.com/qianfan/ais/console/onlineService)
```java
QianfanChatModel model = QianfanChatModel.builder()
        .apiKey("apiKey")
        .secretKey("secretKey")
        .modelName("Yi-34B-Chat") // 一个免费的模型名称 
        .build();

String answer = model.chat("雷军");

System.out.println(answer);
```
### 自定义配置

```java
QianfanChatModel model = QianfanChatModel.builder()
    .baseUrl(...)
    .apiKey(...)
    .secretKey(...)
    .temperature(...)
    .maxRetries(...)
    .topP(...)
    .modelName(...)
    .endpoint(...)
    .responseFormat(...)
    .penaltyScore(...)
    .logRequests(...)
    .logResponses()
    .build();
```

部分参数说明请参阅[此处](https://console.bce.baidu.com/tools/?u=qfdc#/api?product=QIANFAN&project=%E5%8D%83%E5%B8%86%E5%A4%A7%E6%A8%A1%E5%9E%8B%E5%B9%B3%E5%8F%B0&parent=Yi-34B-Chat&api=rpc%2F2.0%2Fai_custom%2Fv1%2Fwenxinworkshop%2Fchat%2Fyi_34b_chat&method=post)。

### 函数功能
**IAiService（重点）**
```java
public interface IAiService {
    /**
     * Ai Services 提供了一种更简单、更灵活的替代方案。您可以定义自己的 API（具有一个或多个方法的 Java 接口），
     * 并将为其提供实现。
     * @param userMessage
     * @return String
     */
    String chat(String userMessage);
}
```
#### QianfanChatWithOnePersonMemory（单人对话记忆）

```java

  QianfanChatModel model = QianfanChatModel.builder()
          .apiKey("apiKey")
          .secretKey("secretKey")
          .modelName("Yi-34B-Chat")
          .build();
  /* MessageWindowChatMemory
     类似滑动窗口，保留最新的 N 条消息，自动淘汰较旧的消息。
     但由于每条消息包含的 token 数量不同，MessageWindowChatMemory 主要适用于快速原型开发。
   */
  /* TokenWindowChatMemory
    也以滑动窗口方式工作，但关注的是保留最新的 N 个 token，按需淘汰旧消息。消息不可分割——
    如果一条消息放不下，整条消息将被淘汰。
    MessageWindowChatMemory 需要 TokenCountEstimator 来计算每条 ChatMessage 的 token 数。
  */
  ChatMemory chatMemory = MessageWindowChatMemory.builder()
          .maxMessages(10)
          .build();

  IAiService assistant = AiServices.builder(IAiService.class)
          .chatModel(model)
          .chatMemory(chatMemory)
          .build();
        String answer = assistant.chat("Hello,my name is xiaoyu");
        System.out.println(answer);

        String answerWithName = assistant.chat("What's my name?");
        System.out.println(answerWithName);

        String answer1 = assistant.chat("I like playing football.");
        System.out.println(answer1);

        String answer2 = assistant.chat("I want to go eat delicious food.");
        System.out.println(answer2);

        String answerWithLike = assistant.chat("What I like to do?");
        System.out.println(answerWithLike);
```

#### QianfanChatWithMorePersonMemory（多人对话记忆）

```java
  QianfanChatModel model = QianfanChatModel.builder()
          .apiKey("apiKey")
          .secretKey("secretKey")
          .modelName("Yi-34B-Chat")
          .build();
  IAiService assistant = AiServices.builder(IAiService.class)
          .chatModel(model)
          .chatMemoryProvider(memoryId -> MessageWindowChatMemory.withMaxMessages(10))
          .build();

  String answer = assistant.chat(1,"Hello, my name is xiaoyu");
  System.out.println(answer);
  String answer1 = assistant.chat(2,"Hello, my name is xiaomi");
  System.out.println(answer1);

  String answerWithName1 = assistant.chat(1,"What's my name?");
  System.out.println(answerWithName1);
  String answerWithName2 = assistant.chat(2,"What's my name?");
  System.out.println(answerWithName2);
```

#### QianfanChatWithPersistentMemory（持久化对话记忆）

```xml
    <dependency>
        <groupId>org.mapdb</groupId>
        <artifactId>mapdb</artifactId>
        <version>3.1.0</version>
    </dependency>
```
```java
class PersistentChatMemoryStore implements ChatMemoryStore {
    private final DB db = DBMaker.fileDB("chat-memory.db").transactionEnable().make();
    private final Map<String, String> map = db.hashMap("messages", STRING, STRING).createOrOpen();

    @Override
    public List<ChatMessage> getMessages(Object memoryId) {
        String json = map.get((String) memoryId);
        return messagesFromJson(json);
    }

    @Override
    public void updateMessages(Object memoryId, List<ChatMessage> messages) {
        String json = messagesToJson(messages);
        map.put((String) memoryId, json);
        db.commit();
    }

    @Override
    public void deleteMessages(Object memoryId) {
        map.remove((String) memoryId);
        db.commit();
    }
}

class PersistentChatMemoryTest{
  public void test(){
    QianfanChatModel chatModel = QianfanChatModel.builder()
            .apiKey("apiKey")
            .secretKey("secretKey")
            .modelName("Yi-34B-Chat")
            .build();
    
    ChatMemory chatMemory = MessageWindowChatMemory.builder()
            .maxMessages(10)
            .chatMemoryStore(new PersistentChatMemoryStore())
            .build();
    
    IAiService assistant = AiServices.builder(IAiService.class)
            .chatModel(chatModel)
            .chatMemory(chatMemory)
            .build();
    
    String answer = assistant.chat("My name is xiaoyu");
    System.out.println(answer);
    // 运行一次后注释上面运行下面
    // String answerWithName = assistant.chat("What is my name?");
    // System.out.println(answerWithName);
  }
}

```

#### QianfanStreamingChatModel（流式回复）
LLM 逐 token 生成文本，因此许多 LLM 提供商支持逐 token 流式传输响应，而无需等待完整文本生成。
这极大改善了用户体验，用户无需等待不确定的时间，几乎可以立即开始阅读响应。

以下通过 `StreamingChatResponseHandler` 实现：
```java
  QianfanStreamingChatModel qianfanStreamingChatModel = QianfanStreamingChatModel.builder()
          .apiKey("apiKey")
          .secretKey("secretKey")
          .modelName("Yi-34B-Chat")
          .build();

  qianfanStreamingChatModel.chat(userMessage, new StreamingChatResponseHandler() {

        @Override
        public void onPartialResponse(String partialResponse) {
            System.out.print(partialResponse);
        }
        @Override
        public void onCompleteResponse(ChatResponse completeResponse) {
            System.out.println("onCompleteResponse: " + completeResponse);
        }
        @Override
        public void onError(Throwable throwable) {
            throwable.printStackTrace();
        }
  });
```
以下通过 `TokenStream` 实现：
```java
  QianfanStreamingChatModel qianfanStreamingChatModel = QianfanStreamingChatModel.builder()
          .apiKey("apiKey")
          .secretKey("secretKey")
          .modelName("Yi-34B-Chat")
          .build();
  IAiService assistant = AiServices.create(IAiService.class, qianfanStreamingChatModel);
  
  TokenStream tokenStream = assistant.chatInTokenStream("Tell me a story.");
  tokenStream.onPartialResponse(System.out::println)
          .onError(Throwable::printStackTrace)
          .start();
```
#### QianfanRAG

程序自动将匹配的内容与用户问题组装成 Prompt，向大语言模型提问，大语言模型返回答案。

LangChain4j 提供了"Easy RAG"功能，让入门 RAG 尽可能简单。无需学习嵌入知识、选择向量存储、寻找合适的嵌入模型、研究如何解析和分割文档等——只需指向您的文档，LangChain4j 会自动完成其余工作。

- 引入依赖：langchain4j-easy-rag
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-easy-rag</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```
- 使用示例：
```java

  QianfanChatModel chatModel = QianfanChatModel.builder()
        .apiKey(API_KEY)
        .secretKey(SECRET_KEY)
        .modelName("Yi-34B-Chat")
        .build();
  // 加载目录中的所有文件，txt 格式速度较快
  List<Document> documents = FileSystemDocumentLoader.loadDocuments("/home/langchain4j/documentation");
  // 为简单起见，使用内存向量存储
  InMemoryEmbeddingStore<TextSegment> embeddingStore = new InMemoryEmbeddingStore<>();
  EmbeddingStoreIngestor.ingest(documents, embeddingStore);

  IAiService assistant = AiServices.builder(IAiService.class)
          .chatModel(chatModel)
          .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
          .contentRetriever(EmbeddingStoreContentRetriever.from(embeddingStore))
          .build();

  String answer = assistant.chat("The Question");
  System.out.println(answer);

```


## 示例

- [Qianfan 示例](https://github.com/langchain4j/langchain4j-community/tree/main/models/langchain4j-community-qianfan/src/test/java/dev/langchain4j/community/model/qianfan)
