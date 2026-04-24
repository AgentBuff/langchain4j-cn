---
sidebar_position: 14
---

# Ollama

### Ollama 是什么？

Ollama 是一款先进的 AI 工具，允许用户在本地（CPU 和 GPU 模式）轻松搭建并运行大语言模型。
借助 Ollama，用户可以使用 Llama 2 等强大的语言模型，甚至可以自定义和创建自己的模型。
Ollama 将模型权重、配置和数据打包成单一包（由 Modelfile 定义），并对 GPU 使用等配置细节进行了优化。

了解更多关于 Ollama 的信息：

- https://ollama.ai/
- https://github.com/jmorganca/ollama

### 演讲

观看在 [Docker Con 23](https://www.dockercon.com/2023/program) 的演示：

<iframe width="640" height="480" src="https://www.youtube.com/embed/yPuhGtJT55o" title="Introducing Docker's Generative AI and Machine Learning Stack (DockerCon 2023)" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

观看 [Code to the Moon](https://www.youtube.com/@codetothemoon) 的入门介绍：

<iframe width="640" height="480" src="https://www.youtube.com/embed/jib1wjgIaa4" title="this open source project has a bright future" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

### 快速开始

在项目的 `pom.xml` 中添加以下依赖：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-ollama</artifactId>
    <version>1.13.0</version>
</dependency>

<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>ollama</artifactId>
    <version>1.19.1</version>
</dependency>
```

在 Testcontainers 中运行 Ollama 的简单对话示例：

```java
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Image;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.Container;
import org.testcontainers.ollama.OllamaContainer;
import org.testcontainers.utility.DockerImageName;

import java.io.IOException;
import java.util.List;

public class OllamaChatExample {

  private static final Logger log = LoggerFactory.getLogger(OllamaChatExample.class);

  static final String OLLAMA_IMAGE = "ollama/ollama:latest";
  static final String TINY_DOLPHIN_MODEL = "tinydolphin";
  static final String DOCKER_IMAGE_NAME = "tc-ollama/ollama:latest-tinydolphin";

  public static void main(String[] args) {
    // 创建并启动 Ollama 容器
    DockerImageName dockerImageName = DockerImageName.parse(OLLAMA_IMAGE);
    DockerClient dockerClient = DockerClientFactory.instance().client();
    List<Image> images = dockerClient.listImagesCmd().withReferenceFilter(DOCKER_IMAGE_NAME).exec();
    OllamaContainer ollama;
    if (images.isEmpty()) {
        ollama = new OllamaContainer(dockerImageName);
    } else {
        ollama = new OllamaContainer(DockerImageName.parse(DOCKER_IMAGE_NAME).asCompatibleSubstituteFor(OLLAMA_IMAGE));
    }
    ollama.start();

    // 拉取模型并基于所选模型创建镜像
    try {
        log.info("开始拉取 '{}' 模型……可能需要几分钟……", TINY_DOLPHIN_MODEL);
        Container.ExecResult r = ollama.execInContainer("ollama", "pull", TINY_DOLPHIN_MODEL);
        log.info("模型拉取完成！{}", r);
    } catch (IOException | InterruptedException e) {
        throw new RuntimeException("拉取模型时出错", e);
    }
    ollama.commitToImage(DOCKER_IMAGE_NAME);

    // 构建 ChatModel
    ChatModel model = OllamaChatModel.builder()
            .baseUrl(ollama.getEndpoint())
            .temperature(0.0)
            .logRequests(true)
            .logResponses(true)
            .modelName(TINY_DOLPHIN_MODEL)
            .build();

    // 示例用法
    String answer = model.chat("请列出 3 条说明 Java 很棒的简短要点");
    System.out.println(answer);

    // 停止 Ollama 容器
    ollama.stop();
  }
}

```

如果 Ollama 在本地运行，也可以尝试以下对话示例：

```java
class OllamaChatLocalModelTest {
  static String MODEL_NAME = "llama3.2"; // 可尝试其他本地 Ollama 模型名称
  static String BASE_URL = "http://localhost:11434"; // 本地 Ollama 基础 URL

  public static void main(String[] args) {
      ChatModel model = OllamaChatModel.builder()
              .baseUrl(BASE_URL)
              .modelName(MODEL_NAME)
              .build();
      String answer = model.chat("列出中国十大城市");
      System.out.println(answer);

      model = OllamaChatModel.builder()
              .baseUrl(BASE_URL)
              .modelName(MODEL_NAME)
              .responseFormat(JSON)
              .build();

      String json = model.chat("列出美国十大城市");
      System.out.println(json);
    }
}
```

在 Testcontainers 中运行 Ollama 的简单流式对话示例：

```java
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Image;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.ollama.OllamaStreamingChatModel;
import dev.langchain4j.model.output.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.Container;
import org.testcontainers.ollama.OllamaContainer;
import org.testcontainers.utility.DockerImageName;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CompletableFuture;

public class OllamaStreamingChatExample {

  private static final Logger log = LoggerFactory.getLogger(OllamaStreamingChatExample.class);

  static final String OLLAMA_IMAGE = "ollama/ollama:latest";
  static final String TINY_DOLPHIN_MODEL = "tinydolphin";
  static final String DOCKER_IMAGE_NAME = "tc-ollama/ollama:latest-tinydolphin";

  public static void main(String[] args) {
    DockerImageName dockerImageName = DockerImageName.parse(OLLAMA_IMAGE);
    DockerClient dockerClient = DockerClientFactory.instance().client();
    List<Image> images = dockerClient.listImagesCmd().withReferenceFilter(DOCKER_IMAGE_NAME).exec();
    OllamaContainer ollama;
    if (images.isEmpty()) {
        ollama = new OllamaContainer(dockerImageName);
    } else {
        ollama = new OllamaContainer(DockerImageName.parse(DOCKER_IMAGE_NAME).asCompatibleSubstituteFor(OLLAMA_IMAGE));
    }
    ollama.start();
    try {
        log.info("开始拉取 '{}' 模型……可能需要几分钟……", TINY_DOLPHIN_MODEL);
        Container.ExecResult r = ollama.execInContainer("ollama", "pull", TINY_DOLPHIN_MODEL);
        log.info("模型拉取完成！{}", r);
    } catch (IOException | InterruptedException e) {
        throw new RuntimeException("拉取模型时出错", e);
    }
    ollama.commitToImage(DOCKER_IMAGE_NAME);

    StreamingChatModel model = OllamaStreamingChatModel.builder()
            .baseUrl(ollama.getEndpoint())
            .temperature(0.0)
            .logRequests(true)
            .logResponses(true)
            .modelName(TINY_DOLPHIN_MODEL)
            .build();

    String userMessage = "写一首 100 字的关于 Java 和 AI 的诗";

    CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();
    model.chat(userMessage, new StreamingChatResponseHandler() {

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
    ollama.stop();
  }
}
```

如果 Ollama 在本地运行，也可以尝试以下流式对话示例：
```java
class OllamaStreamingChatLocalModelTest {
  static String MODEL_NAME = "llama3.2"; // 可尝试其他本地 Ollama 模型名称
  static String BASE_URL = "http://localhost:11434"; // 本地 Ollama 基础 URL

  public static void main(String[] args) {
      StreamingChatModel model = OllamaStreamingChatModel.builder()
              .baseUrl(BASE_URL)
              .modelName(MODEL_NAME)
              .temperature(0.0)
              .build();
      String userMessage = "写一首 100 字的关于 Java 和 AI 的诗";

      CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();
      model.chat(userMessage, new StreamingChatResponseHandler() {

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
  }
}
```

### 参数

`OllamaChatModel` 和 `OllamaStreamingChatModel` 类可通过构建器模式使用以下参数进行实例化：

| 参数 | 说明 | 类型 | 示例 |
|---|---|---|---|
| `httpClientBuilder` | 参见[可定制 HTTP 客户端](https://docs.langchain4j.dev/tutorials/customizable-http-client) | `HttpClientBuilder` | |
| `baseUrl` | Ollama 服务器的基础 URL | `String` | http://localhost:11434 |
| `defaultRequestParameters` | | `ChatRequestParameters` | |
| `modelName` | Ollama 服务器上使用的模型名称 | `String` | |
| `temperature` | 控制生成响应的随机性。较高值（如 1.0）产生更多样化的输出，较低值（如 0.2）产生更确定性的响应 | `Double` | |
| `topK` | 指定每步生成时考虑的最高概率 token 数量 | `Integer` | |
| `topP` | 通过设置顶级 token 累积概率阈值来控制生成响应的多样性 | `Double` | |
| `mirostat` | | `Integer` | |
| `mirostatEta` | | `Double` | |
| `mirostatTau` | | `Double` | |
| `repeatLastN` | | `Integer` | |
| `repeatPenalty` | 对模型在生成输出中重复相似 token 进行惩罚 | `Double` | |
| `seed` | 设置随机种子以保证生成响应的可复现性 | `Integer` | |
| `numPredict` | 每个输入提示词生成的预测数量 | `Integer` | |
| `numCtx` | | `Integer` | |
| `stop` | 若生成这些字符串，则标记响应结束的字符串列表 | `List<String>` | |
| `minP` | | `Double` | |
| `responseFormat` | 生成输出的所需格式，TEXT 或 JSON（可附带可选的 JSON Schema 定义） | `ResponseFormat` | |
| `think` | 控制[思考](https://ollama.com/blog/thinking)功能 | `Boolean` | |
| `returnThinking` | | `Boolean` | |
| `timeout` | API 调用允许的最长时间 | `Duration` | PT60S |
| `customHeaders` | 自定义 HTTP 请求头 | `Map<String, String>` | |
| `logRequests` | | `Boolean` | |
| `logResponses` | | `Boolean` | |
| `listeners` | 参见[聊天模型可观测性](https://docs.langchain4j.dev/tutorials/observability#chat-model-observability) | `List<ChatModelListener>` | |
| `supportedCapabilities` | `AiServices` API 使用的模型能力集合（仅 `OllamaChatModel` 支持） | `Set<Capability>` | RESPONSE_FORMAT_JSON_SCHEMA |
| `maxRetries` | API 调用失败时的最大重试次数 | `Integer` | |

#### 用法示例
```java
OllamaChatModel ollamaChatModel = OllamaChatModel.builder()
    .baseUrl("http://localhost:11434")
    .modelName("llama3.1")
    .temperature(0.8)
    .timeout(Duration.ofSeconds(60))
    .build();
```

#### Spring Boot 用法示例
```properties
langchain4j.ollama.chat-model.base-url=http://localhost:11434
langchain4j.ollama.chat-model.model-name=llama3.1
langchain4j.ollama.chat-model.temperature=0.8
langchain4j.ollama.chat-model.timeout=PT60S
```

### JSON 模式

```java
OllamaChatModel ollamaChatModel = OllamaChatModel.builder()
    .baseUrl("http://localhost:11434")
    .modelName("llama3.1")
    .responseFormat(ResponseFormat.JSON)    
    .temperature(0.8)
    .timeout(Duration.ofSeconds(60))
    .build();
```

### 结构化输出

#### 使用构建器定义 JSON Schema

```java
OllamaChatModel ollamaChatModel = OllamaChatModel.builder()
    .baseUrl("http://localhost:11434")
    .modelName("llama3.1")
    .responseFormat(ResponseFormat.builder()
            .type(ResponseFormatType.JSON)
            .jsonSchema(JsonSchema.builder().rootElement(JsonObjectSchema.builder()
                            .addProperty("name", JsonStringSchema.builder().build())
                            .addProperty("capital", JsonStringSchema.builder().build())
                            .addProperty(
                                    "languages",
                                    JsonArraySchema.builder()
                                            .items(JsonStringSchema.builder().build())
                                            .build())
                            .required("name", "capital", "languages")
                            .build())
                    .build())
            .build())
    .temperature(0.8)
    .timeout(Duration.ofSeconds(60))
    .build();
```

#### 使用 ChatRequest API 指定 JSON Schema

```java
OllamaChatModel ollamaChatModel = OllamaChatModel.builder()
    .baseUrl("http://localhost:11434")
    .modelName("llama3.1")
    .build();

ChatResponse chatResponse = ollamaChatModel.chat(ChatRequest.builder()
        .messages(userMessage("介绍一下加拿大。"))
        .responseFormat(ResponseFormat.builder()
                .type(ResponseFormatType.JSON)
                .jsonSchema(JsonSchema.builder().rootElement(JsonObjectSchema.builder()
                                .addProperty("name", JsonStringSchema.builder().build())
                                .addProperty("capital", JsonStringSchema.builder().build())
                                .addProperty(
                                        "languages",
                                        JsonArraySchema.builder()
                                                .items(JsonStringSchema.builder().build())
                                                .build())
                                .required("name", "capital", "languages")
                                .build())
                        .build())
                .build())
        .build());

String jsonFormattedResponse = chatResponse.aiMessage().text();

/* jsonFormattedResponse 值：

  {
    "capital" : "Ottawa",
    "languages" : [ "English", "French" ],
    "name" : "Canada"
  }

 */


```

### 在 AiServices 中使用 JSON Schema

当 `OllamaChatModel` 以支持的能力 `RESPONSE_FORMAT_JSON_SCHEMA` 创建时，`AIService` 将自动根据接口返回值生成 Schema。详情请参阅[结构化输出](/tutorials/structured-outputs.md#using-json-schema-with-ai-services)。

```java
OllamaChatModel ollamaChatModel = OllamaChatModel.builder()
    .baseUrl("http://localhost:11434")
    .modelName("llama3.1")
    .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA)    
    .build();
```

### 思考 / 推理

[思考](https://ollama.com/blog/thinking)功能受到支持，由以下参数控制：
- `think`：控制 LLM 是否思考及如何思考：
  - `true`：LLM 进行思考，并在单独的 `thinking` 字段中返回思考内容
  - `false`：LLM 不进行思考
  - `null`（未设置）：推理型 LLM（如 DeepSeek R1）将在实际响应前添加由 `<think>` 和 `</think>` 分隔的思考内容
- `returnThinking`：控制是否解析 API 响应中的 `thinking` 字段并在 `AiMessage.thinking()` 中返回，以及在使用 `OllamaStreamingChatModel` 时是否触发 `StreamingChatResponseHandler.onPartialThinking()` 和 `TokenStream.onPartialThinking()` 回调。默认禁用。

思考功能配置示例：
```java
ChatModel model = OllamaChatModel.builder()
        .baseUrl("http://localhost:11434")
        .modelName("qwen3:0.6b")
        .think(true)
        .returnThinking(true)
        .build();
```

### 自定义消息

`OllamaChatModel` 和 `OllamaStreamingChatModel` 除支持标准聊天消息类型外，还支持自定义聊天消息。
自定义消息可用于指定具有任意属性的消息，对于 [Granite Guardian](https://ollama.com/library/granite3-guardian) 等
利用非标准消息来评估检索增强生成（RAG）中检索到的上下文的模型非常有用。

下面展示如何使用 `CustomMessage` 指定带有任意属性的消息：

```java
OllamaChatModel ollamaChatModel = OllamaChatModel.builder()
    .baseUrl("http://localhost:11434")
    .modelName("granite3-guardian")
    .build();
 
String retrievedContext = "One significant part of treaty making is that signing a treaty implies recognition that the other side is a sovereign state and that the agreement being considered is enforceable under international law. Hence, nations can be very careful about terming an agreement to be a treaty. For example, within the United States, agreements between states are compacts and agreements between states and the federal government or between agencies of the government are memoranda of understanding.";

List<ChatMessage> messages = List.of(
    SystemMessage.from("context_relevance"),
    UserMessage.from("What is the history of treaty making?"),
    CustomMessage.from(Map.of(
        "role", "context",
        "content", retrievedContext
    ))
);

ChatResponse chatResponse = ollamaChatModel.chat(ChatRequest.builder().messages(messages).build());

System.out.println(chatResponse.aiMessage().text()); // "Yes"（表示 Granite Guardian 检测到风险）
```
