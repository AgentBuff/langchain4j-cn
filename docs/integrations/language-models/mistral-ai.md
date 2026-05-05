---
sidebar_position: 13
---

# MistralAI
[MistralAI 文档](https://docs.mistral.ai/)

## 项目配置

在项目中安装 langchain4j，添加以下依赖：

Maven 项目 `pom.xml`

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>1.13.0</version>
</dependency>

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-mistral-ai</artifactId>
    <version>1.13.0</version>
</dependency>
```

Gradle 项目 `build.gradle`

```groovy
implementation 'dev.langchain4j:langchain4j:1.13.0'
implementation 'dev.langchain4j:langchain4j-mistral-ai:1.13.0'
```
### API 密钥配置 {#api-key-configuration}
在项目中添加 MistralAI API Key，可创建 `ApiKeys.java` 类：

```java
public class ApiKeys {
    public static final String MISTRALAI_API_KEY = System.getenv("MISTRAL_AI_API_KEY");
}
```
别忘了将 API Key 设置为环境变量：
```shell
export MISTRAL_AI_API_KEY=your-api-key #Unix 系统
SET MISTRAL_AI_API_KEY=your-api-key #Windows 系统
```
获取 MistralAI API Key 的详细方法请参阅[此处](https://docs.mistral.ai/#api-access)。

### 模型选择
可使用 `MistralAiChatModelName` 和 `MistralAiFimModelName` Java 枚举类查找适合场景的模型名称。
MistralAI 根据性能与成本的权衡对模型进行了新的分类。

| 模型名称 | 部署 / 可用平台 | 说明 |
|---|---|---|
| open-mistral-7b | Mistral AI La Plateforme、云平台（Azure、AWS、GCP）、Hugging Face、自托管（本地、IaaS、Docker） | **开源**<br/>Mistral AI 发布的首个密集模型，适合实验、定制和快速迭代。<br/>最大 token 数 32K<br/>Java 枚举：`MistralAiChatModelName.OPEN_MISTRAL_7B` |
| open-mixtral-8x7b | Mistral AI La Plateforme、云平台（Azure、AWS、GCP）、Hugging Face、自托管 | **开源**<br/>适合多语言操作、代码生成和微调，兼具优秀的性价比。<br/>最大 token 数 32K<br/>Java 枚举：`MistralAiChatModelName.OPEN_MIXTRAL_8x7B` |
| open-mixtral-8x22b | Mistral AI La Plateforme、云平台（Azure、AWS、GCP）、Hugging Face、自托管 | **开源**<br/>具备 Mixtral-8x7B 的全部能力，并原生支持强大的数学运算、代码和函数调用。<br/>最大 token 数 64K<br/>Java 枚举：`MistralAiChatModelName.OPEN_MIXTRAL_8X22B` |
| open-mistral-nemo | Mistral AI La Plateforme、云平台（Azure、AWS、GCP）、Hugging Face、自托管 | **开源**<br/>与 NVIDIA 合作构建的 12B 模型，在同类规模中推理能力、世界知识和代码准确性均达到业界领先水平。<br/>最大 token 数 128K<br/>Java 枚举：`MistralAiChatModelName.OPEN_MISTRAL_NEMO` |
| open-codestral-mamba | Mistral AI La Plateforme、云平台（Azure、AWS、GCP）、Hugging Face、自托管 | **开源**<br/>专为代码生成任务设计的 Mamba2 语言模型，性能可与 SOTA Transformer 模型媲美。<br/>最大 token 数 256K<br/>Java 枚举：`MistralAiFimModelName.OPEN_CODESTRAL_MAMBA` |
| mistral-small-latest | Mistral AI La Plateforme、云平台（Azure、AWS、GCP） | **商业**<br/>适用于批量简单任务（分类、客户支持、文本生成）。<br/>最大 token 数 32K<br/>Java 枚举：`MistralAiChatModelName.MISTRAL_SMALL_LATEST` |
| mistral-medium-latest | Mistral AI La Plateforme、云平台（Azure、AWS、GCP） | **商业**<br/>适合需要中等推理能力的中间任务（数据提取、摘要、写邮件、写描述）。<br/>最大 token 数 32K<br/>Java 枚举：`MistralAiChatModelName.MISTRAL_MEDIUM_LATEST` |
| mistral-large-latest | Mistral AI La Plateforme、云平台（Azure、AWS、GCP） | **商业**<br/>适合需要强大推理能力或高度专业化的复杂任务（文本生成、代码生成、RAG 或 Agent）。<br/>最大 token 数 128K<br/>Java 枚举：`MistralAiChatModelName.MISTRAL_LARGE_LATEST` |
| mistral-embed | Mistral AI La Plateforme、云平台（Azure、AWS、GCP） | **商业**<br/>将文本转换为 1024 维的嵌入向量，适用于检索和 RAG 应用。<br/>最大 token 数 8K<br/>Java 枚举：`MistralAiEmbeddingModelName.MISTRAL_EMBED` |
| codestral-latest | Mistral AI La Plateforme、云平台（Azure、AWS、GCP）、Hugging Face、自托管 | **开源（非生产许可证）及商业**<br/>专为代码生成任务（含中间填充和代码补全）设计和优化的尖端模型。<br/>最大 token 数 32K<br/>Java 枚举：`MistralAiFimModelName.CODESTRAL_LATEST` |

`@Deprecated` 模型：
- mistral-tiny（`@Deprecated`）
- mistral-small（`@Deprecated`）
- mistral-medium（`@Deprecated`）

各模型适用场景的详细信息请参阅[此处](https://docs.mistral.ai/#model-selection)。

## 对话补全
对话模型通过在对话数据上微调，允许您生成类人响应。

### 同步模式
创建一个类并添加以下代码：

```java
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.mistralai.MistralAiChatModel;

public class HelloWorld {
    public static void main(String[] args) {
        ChatModel model = MistralAiChatModel.builder()
                .apiKey(ApiKeys.MISTRALAI_API_KEY)
                .modelName(MistralAiChatModelName.MISTRAL_SMALL_LATEST)
                .build();

        String response = model.chat("说'Hello World'");
        System.out.println(response);
    }
}
```
程序将生成类似如下的输出：

```plaintext
Hello World! 今天有什么可以帮助您的吗？
```

### 流式模式
创建一个类并添加以下代码：

```java
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import dev.langchain4j.model.mistralai.MistralAiStreamingChatModel;
import dev.langchain4j.model.output.Response;

import java.util.concurrent.CompletableFuture;

public class HelloWorld {
    public static void main(String[] args) {
        MistralAiStreamingChatModel model = MistralAiStreamingChatModel.builder()
                .apiKey(ApiKeys.MISTRALAI_API_KEY)
                .modelName(MistralAiChatModelName.MISTRAL_SMALL_LATEST)
                .build();

        CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();         
        model.chat("讲一个关于 Java 的笑话", new StreamingChatResponseHandler() {
            
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
每个文本块（token）在 LLM 生成时会通过 `onPartialResponse` 方法接收。

输出会以实时流式传输：

```plaintext
"Java 开发者为什么戴眼镜？因为他们 C# 不了！"
```

当然，可将 MistralAI 对话补全与[设置模型参数](/tutorials/model-parameters)和[对话记忆](/tutorials/chat-memory)等功能结合，获得更精准的响应。

在[对话记忆](/tutorials/chat-memory)中，您将学习如何传递聊天历史，使 LLM 了解之前的对话内容。

### 函数调用
函数调用允许 Mistral 对话模型（[同步](#同步模式)和[流式](#流式模式)）连接外部工具。例如，可以调用 `Tool` 获取支付交易状态，参见 Mistral AI 函数调用[教程](https://docs.mistral.ai/guides/function-calling/)。

<details>
<summary>支持函数调用的 Mistral 模型有哪些？</summary>

:::note
目前，以下模型支持函数调用：

- Mistral Small `MistralAiChatModelName.MISTRAL_SMALL_LATEST`
- Mistral Large `MistralAiChatModelName.MISTRAL_LARGE_LATEST`
- Mixtral 8x22B `MistralAiChatModelName.OPEN_MIXTRAL_8X22B`
- Mistral Nemo `MistralAiChatModelName.OPEN_MISTRAL_NEMO`
:::
</details>

#### 1. 定义 `Tool` 类并获取支付数据

假设有如下支付交易数据集（实际应用中应注入数据库或 REST API 客户端）：
```java
import java.util.*;

public class PaymentTransactionTool {

   private final Map<String, List<String>> paymentData = Map.of(
            "transaction_id", List.of("T1001", "T1002", "T1003", "T1004", "T1005"),
            "customer_id", List.of("C001", "C002", "C003", "C002", "C001"),
            "payment_amount", List.of("125.50", "89.99", "120.00", "54.30", "210.20"),
            "payment_date", List.of("2021.13.05", "2021.13.06", "2021.13.07", "2021.13.05", "2021.13.08"),
            "payment_status", List.of("Paid", "Unpaid", "Paid", "Paid", "Pending"));
   
    ...
}
```
然后定义 `retrievePaymentStatus` 和 `retrievePaymentDate` 方法：

```java
// 用于获取支付状态的工具
@Tool("获取交易的支付状态") // 函数描述
String retrievePaymentStatus(@P("用于查询支付数据的交易 ID") String transactionId) {
    return getPaymentData(transactionId, "payment_status");
}

// 用于获取支付日期的工具
@Tool("获取交易的支付日期") // 函数描述
String retrievePaymentDate(@P("用于查询支付数据的交易 ID") String transactionId) {
   return getPaymentData(transactionId, "payment_date");
}

private String getPaymentData(String transactionId, String data) {
    List<String> transactionIds = paymentData.get("transaction_id");
    List<String> paymentData = paymentData.get(data);

    int index = transactionIds.indexOf(transactionId);
    if (index != -1) {
        return paymentData.get(index);
    } else {
        return "未找到交易 ID";
    }
}
```
使用 `dev.langchain4j.agent.tool.*` 包中的 `@Tool` 注解定义函数描述，`@P` 注解定义参数描述。详情请参阅[此处](/tutorials/tools#high-level-tool-api)。

#### 2. 定义 `agent` 接口以发送聊天消息

创建 `PaymentTransactionAgent` 接口：

```java
import dev.langchain4j.service.SystemMessage;

interface PaymentTransactionAgent {
    @SystemMessage({
            "你是一位支付交易客服代理。",
            "你必须使用支付交易工具查询支付交易数据。",
            "如果有日期，请转换为人类可读格式。"
    })
    String chat(String userMessage);
}
```
#### 3. 定义主应用类与 MistralAI 对话模型交互

```java
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.mistralai.MistralAiChatModel;
import dev.langchain4j.model.mistralai.MistralAiChatModelName;
import dev.langchain4j.service.AiServices;

public class PaymentDataAssistantApp {

    ChatModel mistralAiModel = MistralAiChatModel.builder()
            .apiKey(System.getenv("MISTRAL_AI_API_KEY")) // 请使用您自己的 Mistral AI API Key
            .modelName(MistralAiChatModelName.MISTRAL_LARGE_LATEST)
            .logRequests(true)
            .logResponses(true)
            .build();
    
    public static void main(String[] args) {
        // 步骤 1：用户指定工具和查询
        PaymentTransactionTool paymentTool = new PaymentTransactionTool();
        String userMessage = "交易 T1005 的状态和支付日期是什么？";

        // 步骤 2：用户通过代理提问，AiServices 调用函数
        PaymentTransactionAgent agent = AiServices.builder(PaymentTransactionAgent.class)
                .chatModel(mistralAiModel)
                .tools(paymentTool)
                .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
                .build();
        
        // 步骤 3：用户获得最终响应
        String answer = agent.chat(userMessage);
        System.out.println(answer);
    }
}
```

预期的输出如下：

```shell
交易 T1005 的状态为待处理（Pending），支付日期为 2021 年 10 月 8 日。
```
### JSON 模式
可将 `responseFormat` 参数设置为 `ResponseFormat.JSON` 来获取 JSON 格式的响应。

同步示例：

```java
ChatModel model = MistralAiChatModel.builder()
                .apiKey(System.getenv("MISTRAL_AI_API_KEY")) // 请使用您自己的 Mistral AI API Key
                .responseFormat(ResponseFormat.JSON)
                .build();

String userMessage = "返回包含 transactionId 和 status 两个字段的 JSON，值分别为 T123 和 paid。";
String json = model.chat(userMessage);

System.out.println(json); // {"transactionId":"T123","status":"paid"}
```

流式示例：

```java
StreamingChatModel streamingModel = MistralAiStreamingChatModel.builder()
                .apiKey(System.getenv("MISTRAL_AI_API_KEY")) // 请使用您自己的 Mistral AI API Key
                .responseFormat(MistralAiResponseFormatType.JSON_OBJECT)
                .build();

String userMessage = "返回包含 transactionId 和 status 两个字段的 JSON，值分别为 T123 和 paid。";

CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();

streamingModel.chat(userMessage, new StreamingChatResponseHandler() {

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

String json = futureResponse.get().content().text();

System.out.println(json); // {"transactionId":"T123","status":"paid"}
```                

### 结构化输出

结构化输出确保模型的响应符合 JSON Schema。

:::note
LangChain4j 中关于结构化输出的文档请参阅[此处](/tutorials/structured-outputs)，以下部分包含 MistralAI 专属信息。
:::

如有需要，可为模型配置默认 JSON Schema，当请求中未提供 Schema 时将作为后备使用。

```java
ChatModel model = MistralAiChatModel.builder()
        .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
        .modelName(MISTRAL_SMALL_LATEST)
        .supportedCapabilities(Set.of(Capability.RESPONSE_FORMAT_JSON_SCHEMA)) // 启用结构化输出
        .responseFormat(ResponseFormat.builder() // 设置后备 JSON Schema（可选）
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
        .strictJsonSchema(true)
        .build();
```

### 内容安全防护
防护栏（Guardrails）是限制模型行为以防止生成有害或不当内容的一种方式。可在 `MistralAiChatModel` 或 `MistralAiStreamingChatModel` 构建器中设置 `safePrompt` 参数。

同步示例：

```java
ChatModel model = MistralAiChatModel.builder()
                .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
                .safePrompt(true)
                .build();

String userMessage = "最好的法国奶酪是什么？";
String response = model.chat(userMessage);
```

流式示例：

```java
StreamingChatModel streamingModel = MistralAiStreamingChatModel.builder()
                .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
                .safePrompt(true)
                .build();

String userMessage = "最好的法国奶酪是什么？";

CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();

streamingModel.chat(userMessage, new StreamingChatResponseHandler() {
    
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
启用安全提示后，将在您的消息前添加以下 `@SystemMessage`：

```plaintext
Always assist with care, respect, and truth. Respond with utmost utility yet securely. Avoid harmful, unethical, prejudiced, or negative content. Ensure replies promote fairness and positivity.
```

## 思考 / 推理

`MistralAiChatModel` 和 `MistralAiStreamingChatModel` 均支持使用
[Magistral 推理模型](https://docs.mistral.ai/capabilities/reasoning/)进行推理。

通过以下参数配置：
- `returnThinking`：启用后，模型生成的推理文本将从 API 响应中解析并存储在 `AiMessage.thinking()` 中。
  对于流式模式，`StreamingChatResponseHandler.onPartialThinking()` 和 `TokenStream.onPartialThinking()` 回调也将被触发。
  默认禁用。
- `sendThinking`：启用后，前序响应中的推理文本（存储在 `AiMessage.thinking()` 中）将包含在后续发给 LLM 的请求中。
  默认禁用。

推理功能配置示例：
```java
ChatModel model = MistralAiChatModel.builder()
        .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
        .modelName(MistralAiChatModelName.MAGISTRAL_MEDIUM_LATEST)
        .returnThinking(true)
        .sendThinking(true)
        .build();
```

## 内容审核

这是一个分类器模型，可用于检测文本中的有害内容。

内容审核示例：

```java
ModerationModel model = new MistralAiModerationModel.Builder()
    .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
    .modelName(MistralAiModerationModelName.MISTRAL_MODERATION_LATEST)
    .logRequests(true)
    .logResponses(false)
    .build();
// 检测文本是否包含有害内容
Moderation moderation = model.moderate("I want to kill them.").content();
```

## 代码补全
中间填充（FIM）模型允许生成代码补全，用户可通过 `prompt` 定义代码起始点，通过可选的 `suffix` 和 `stop` 定义结束点。

### FIM 同步模式
添加以下代码：

```java
import dev.langchain4j.model.mistralai.MistralAiFimModel;
import dev.langchain4j.model.output.Response;

public class HelloWorld {
    public static void main(String[] args) {
        MistralAiFimModel codestral = MistralAiFimModel.builder()
                .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
                .modelName(MistralAiFimModelName.CODESTRAL_LATEST)
                .stop(List.of("}")) // 必须在第一次出现 "}" 时停止
                .build();
        
        // 生成一个使用 LangChain4j MistralAI 框架的简单 Hello World 程序代码补全
        String codePrompt = """
                  public static void main(String[] args) {
                      // 创建一个将两个数相乘的函数
                """;
        String suffix = """
                    System.out.println(result);
                  }
                """;

        // 请求 Codestral 模型根据给定的 prompt 和 suffix 补全代码
        Response<String> response = codestral.generate(prompt, suffix);
        
        System.out.println(
                String.format(
                        "%s%s%s",
                        prompt, // 打印代码前缀
                        response.content(), // 打印中间填充的代码
                        suffix)); // 打印代码后缀
    }
}
```
程序将打印如下输出：

```console
public static void main(String[] args) {
      // 创建一个将两个数相乘的函数
      int result = multiply(5, 3);
      System.out.println(result);
  }
```

### FIM 流式模式

创建一个类并添加以下代码：

```java
import dev.langchain4j.model.StreamingResponseHandler;
import dev.langchain4j.model.language.StreamingLanguageModel;
import dev.langchain4j.model.mistralai.MistralAiStreamingFimModel;
import dev.langchain4j.model.output.Response;

import java.util.concurrent.CompletableFuture;

public class HelloWorld {
    public static void main(String[] args) {
        StreamingLanguageModel codestralStream = MistralAiStreamingFimModel.builder()
                .apiKey(ApiKeys.MISTRALAI_API_KEY)
                .modelName(MistralAiFimModelName.CODESTRAL_LATEST)
                .build();

        // 生成一个简单 Hello World 程序的代码补全
        String prompt = "public static void main(String[] args) {";

        CompletableFuture<Response<String>> futureResponse = new CompletableFuture<>();
        codestral.generate(prompt, new StreamingResponseHandler() {
            @Override
            public void onNext(String token) {
                System.out.print(token);
            }

            @Override
            public void onComplete(Response<String> response) {
                futureResponse.complete(response);
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
每个文本块（token）在 LLM 生成时会通过 onNext 方法接收，实时流式输出。

```console
public static void main(String[] args) {

        int[] arr = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
        int sum = 0;

        for (int i = 0; i < arr.length; i++) {
            sum += arr[i];
        }

        System.out.println("数组所有元素之和：" + sum);
    }
}
``` 

## 访问原始 HTTP 响应和服务器发送事件（SSE）

使用 `MistralAiChatModel` 时，可访问原始 HTTP 响应：
```java
SuccessfulHttpResponse rawHttpResponse = ((MistralAiChatResponseMetadata) chatResponse.metadata()).rawHttpResponse();
System.out.println(rawHttpResponse.body());
System.out.println(rawHttpResponse.headers());
System.out.println(rawHttpResponse.statusCode());
```

使用 `MistralAiStreamingChatModel` 时，可访问原始 HTTP 响应（同上）和原始服务器发送事件：
```java
List<ServerSentEvent> rawServerSentEvents = ((MistralAiChatResponseMetadata) chatResponse.metadata()).rawServerSentEvents();
System.out.println(rawServerSentEvents.get(0).data());
System.out.println(rawServerSentEvents.get(0).event());
```

## 示例
- [Mistral AI 示例](https://github.com/langchain4j/langchain4j-examples/tree/main/mistral-ai-examples/src/main/java)
