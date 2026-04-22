---
sidebar_position: 3
---

# Azure OpenAI

:::note

本文档介绍 `Azure OpenAI` 集成，它使用微软 Azure SDK，最适合与微软 Java 技术栈配合使用，包括高级 Azure 认证机制。

LangChain4j 提供了 3 种不同的 OpenAI 集成方式，本文介绍的是第 3 种：

- [OpenAI](/integrations/language-models/open-ai) 使用自定义 Java 实现的 OpenAI REST API，最适合与 Quarkus（使用 Quarkus REST 客户端）和 Spring（使用 Spring 的 RestClient）配合使用。
- [OpenAI Official SDK](/integrations/language-models/open-ai-official) 使用官方 OpenAI Java SDK。
- [Azure OpenAI](/integrations/language-models/azure-open-ai) 使用微软的 Azure SDK，最适合使用微软 Java 技术栈（包括高级 Azure 认证机制）的场景。

:::

Azure OpenAI 提供托管在 Azure 上的 OpenAI 语言模型（`gpt-4`、`gpt-4o` 等），使用 [Azure OpenAI Java SDK](https://learn.microsoft.com/en-us/java/api/overview/azure/ai-openai-readme)。

## Azure OpenAI 文档

- [Azure OpenAI 文档](https://learn.microsoft.com/en-us/azure/ai-services/openai/)

## Maven 依赖

### 纯 Java

`langchain4j-azure-open-ai` 库已发布至 Maven Central。

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-azure-open-ai</artifactId>
    <version>1.13.0</version>
</dependency>
```

### Spring Boot

提供了 Spring Boot Starter，可更便捷地配置 `langchain4j-azure-open-ai` 库。

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-azure-open-ai-spring-boot-starter</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

:::note
在使用任何 Azure OpenAI 模型之前，需要先[部署](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/create-resource?pivots=web-portal)模型。
:::

## 使用 API Key 创建 `AzureOpenAiChatModel`

### 纯 Java

```java
ChatModel model = AzureOpenAiChatModel.builder()
        .endpoint(System.getenv("AZURE_OPENAI_URL"))
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .deploymentName("gpt-4o")
        ...
        .build();
```

此操作将使用指定的端点、API Key 和部署名称创建 `AzureOpenAiChatModel` 实例。
其他参数可通过构建器设置进行自定义。

### Spring Boot

在 `application.properties` 中添加：
```properties
langchain4j.azure-open-ai.chat-model.endpoint=${AZURE_OPENAI_URL}
langchain4j.azure-open-ai.chat-model.service-version=...
langchain4j.azure-open-ai.chat-model.api-key=${AZURE_OPENAI_KEY}
langchain4j.azure-open-ai.chat-model.non-azure-api-key=${OPENAI_API_KEY}
langchain4j.azure-open-ai.chat-model.deployment-name=gpt-4o
langchain4j.azure-open-ai.chat-model.max-completion-tokens=...
langchain4j.azure-open-ai.chat-model.max-tokens=...
langchain4j.azure-open-ai.chat-model.temperature=...
langchain4j.azure-open-ai.chat-model.top-p=
langchain4j.azure-open-ai.chat-model.logit-bias=...
langchain4j.azure-open-ai.chat-model.user=
langchain4j.azure-open-ai.chat-model.stop=...
langchain4j.azure-open-ai.chat-model.presence-penalty=...
langchain4j.azure-open-ai.chat-model.frequency-penalty=...
langchain4j.azure-open-ai.chat-model.seed=...
langchain4j.azure-open-ai.chat-model.strict-json-schema=...
langchain4j.azure-open-ai.chat-model.timeout=...
langchain4j.azure-open-ai.chat-model.max-retries=...
langchain4j.azure-open-ai.chat-model.log-requests-and-responses=...
langchain4j.azure-open-ai.chat-model.user-agent-suffix=
langchain4j.azure-open-ai.chat-model.custom-headers=...
langchain4j.azure-open-ai.chat-model.reasoningEffort=...
```
部分参数说明请参阅[此处](https://learn.microsoft.com/en-us/azure/ai-services/openai/reference#completions)。

该配置将创建一个 `AzureOpenAiChatModel` Bean（使用默认模型参数），
可供 [AI Service](/tutorials/spring-boot-integration/#langchain4j-spring-boot-starter) 使用，
也可在需要的地方自动注入，例如：

```java
@RestController
class ChatModelController {

    ChatModel chatModel;

    ChatModelController(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @GetMapping("/model")
    public String model(@RequestParam(value = "message", defaultValue = "Hello") String message) {
        return chatModel.chat(message);
    }
}
```

## 使用 Azure 凭证创建 `AzureOpenAiChatModel`

API Key 存在一些安全隐患（可能被提交到代码库、四处传递等）。
如需提升安全性，建议改用 Azure 凭证。
为此，需要在项目中添加 `azure-identity` 依赖。

```xml
<dependency>
    <groupId>com.azure</groupId>
    <artifactId>azure-identity</artifactId>
    <scope>compile</scope>
</dependency>
```

然后可使用 [DefaultAzureCredentialBuilder](https://learn.microsoft.com/en-us/java/api/com.azure.identity.defaultazurecredentialbuilder?view=azure-java-stable) API 创建 `AzureOpenAiChatModel`：

```java
ChatModel model = AzureOpenAiChatModel.builder()
        .deploymentName("gpt-4o")
        .endpoint(System.getenv("AZURE_OPENAI_URL"))
        .tokenCredential(new DefaultAzureCredentialBuilder().build())
        .build();
```

:::note
注意：您需要使用托管身份来部署模型。更多信息请参阅 [Azure CLI 部署脚本](https://github.com/langchain4j/langchain4j-examples/blob/main/azure-open-ai-examples/src/main/script/deploy-azure-openai-security.sh)。
:::

## 工具

工具（也称为"函数调用"）受到支持，允许模型调用 Java 代码中的方法，包括并行工具调用。
"函数调用"在 OpenAI 文档中的说明见[此处](https://platform.openai.com/docs/guides/function-calling)。

:::note
LangChain4j 中关于"函数调用"的完整教程请参阅[此处](/tutorials/tools/)。
:::

可使用 `ToolSpecification` 类或更便捷的 `@Tool` 注解来指定函数，示例如下：

```java
class StockPriceService {

    private Logger log = Logger.getLogger(StockPriceService.class.getName());

    @Tool("根据公司股票代码获取股价")
    public double getStockPrice(@P("公司股票代码") String ticker) {
        log.info("正在获取 " + ticker + " 的股价");
        if (Objects.equals(ticker, "MSFT")) {
            return 400.0;
        } else {
            return 0.0;
        }
    }
}
```

然后可在 AI `Assistant` 中使用 `StockPriceService`：

```java

interface Assistant {
    String chat(String userMessage);
}

public class Demo {
    String functionCalling(Model model) {
        String question = "微软当前股价是否高于 $450？";
        StockPriceService stockPriceService = new StockPriceService();

        Assistant assistant = AiServices.builder(Assistant.class)
                .chatModel(model)
                .tools(stockPriceService)
                .build();

        String answer = assistant.chat(question);

        model.addAttribute("answer", answer);
        return "demo";
    }
}
```

## 结构化输出

结构化输出确保模型的响应符合 JSON Schema。

:::note
LangChain4j 中关于结构化输出的文档请参阅[此处](/tutorials/structured-outputs)，以下部分包含 Azure OpenAI 专属信息。
:::

需要将模型的 `strictJsonSchema` 参数设置为 `true` 以强制遵循 JSON Schema：

```java
ChatModel model = AzureOpenAiChatModel.builder()
        .endpoint(System.getenv("AZURE_OPENAI_URL"))
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .deploymentName("gpt-4o")
        .strictJsonSchema(true)
        .supportedCapabilities(Set.of(RESPONSE_FORMAT_JSON_SCHEMA))
        .build();
```

:::note
如果 `strictJsonSchema` 设置为 `false` 且提供了 JSON Schema，模型仍会尝试生成符合 Schema 的响应，但若响应不符合 Schema 也不会报错。这样做的一个原因是获得更好的性能。
:::

然后可通过高级 `Assistant` API 或低级 `ChatModel` API 使用该模型，详见下文。
使用高级 `Assistant` API 时，请配置 `supportedCapabilities(Set.of(RESPONSE_FORMAT_JSON_SCHEMA))` 以启用带 JSON Schema 的结构化输出。

### 使用高级 `Assistant` API

与上一节的工具类似，结构化输出可与 AI `Assistant` 自动配合使用：

```java

interface PersonAssistant {
    Person extractPerson(String message);
}

class Person {
    private final String name;
    private final List<String> favouriteColors;

    public Person(String name, List<String> favouriteColors) {
        this.name = name;
        this.favouriteColors = favouriteColors;
    }

    public String getName() {
        return name;
    }

    public List<String> getFavouriteColors() {
        return favouriteColors;
    }
}
```

该 `Assistant` 将确保响应符合 `Person` 类对应的 JSON Schema，示例如下：

```java
String question = "Julien 喜欢蓝色、白色和红色";

PersonAssistant assistant = AiServices.builder(PersonAssistant.class)
                .chatModel(chatModel)
                .build();

Person person = assistant.extractPerson(question);
```

### 使用低级 `ChatModel` API

与高级 API 流程类似，但需要手动配置 JSON Schema，并将 JSON 响应映射到 Java 对象。

配置好模型后，需要在每次请求的 `ChatRequest` 对象中指定 JSON Schema。
模型将生成符合 Schema 的响应，示例如下：

```java
ChatRequest chatRequest = ChatRequest.builder()
    .messages(UserMessage.from("Julien 喜欢蓝色、白色和红色"))
    .responseFormat(ResponseFormat.builder()
        .type(JSON)
        .jsonSchema(JsonSchema.builder()
            .name("Person")
            .rootElement(JsonObjectSchema.builder()
                .addStringProperty("name")
                .addProperty("favouriteColors", JsonArraySchema.builder()
                    .items(new JsonStringSchema())
                    .build())
                .required("name", "favouriteColors")
                .build())
            .build())
        .build())
    .build();

String answer = chatModel.chat(chatRequest).aiMessage().text();
```

此示例中，`answer` 将为：
```json
{
  "name": "Julien",
  "favouriteColors": ["blue", "white", "red"]
}
```

此 JSON 响应通常会使用 Jackson 等库反序列化为 Java 对象。

## 创建 `AzureOpenAiStreamingChatModel` 以流式返回结果

该实现与上述 `AzureOpenAiChatModel` 类似，但逐 token 流式传输响应。

### 纯 Java
```java
StreamingChatModel model = AzureOpenAiStreamingChatModel.builder()
        .endpoint(System.getenv("AZURE_OPENAI_URL"))
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .deploymentName("gpt-4o")
        ...
        .build();
```

### Spring Boot
在 `application.properties` 中添加：
```properties
langchain4j.azure-open-ai.streaming-chat-model.endpoint=${AZURE_OPENAI_URL}
langchain4j.azure-open-ai.streaming-chat-model.service-version=...
langchain4j.azure-open-ai.streaming-chat-model.api-key=${AZURE_OPENAI_KEY}
langchain4j.azure-open-ai.streaming-chat-model.deployment-name=gpt-4o
langchain4j.azure-open-ai.streaming-chat-model.max-completion-tokens=...
langchain4j.azure-open-ai.streaming-chat-model.max-tokens=...
langchain4j.azure-open-ai.streaming-chat-model.temperature=...
langchain4j.azure-open-ai.streaming-chat-model.top-p=...
langchain4j.azure-open-ai.streaming-chat-model.logit-bias=...
langchain4j.azure-open-ai.streaming-chat-model.user=...
langchain4j.azure-open-ai.streaming-chat-model.stop=...
langchain4j.azure-open-ai.streaming-chat-model.presence-penalty=...
langchain4j.azure-open-ai.streaming-chat-model.frequency-penalty=...
langchain4j.azure-open-ai.streaming-chat-model.seed=...
langchain4j.azure-open-ai.streaming-chat-model.timeout=...
langchain4j.azure-open-ai.streaming-chat-model.max-retries=...
langchain4j.azure-open-ai.streaming-chat-model.log-requests-and-responses=...
langchain4j.azure-open-ai.streaming-chat-model.user-agent-suffix=...
langchain4j.azure-open-ai.streaming-chat-model.customHeaders=...
langchain4j.azure-open-ai.streaming-chat-model.reasoningEffort=...
```

## 音频转录

Azure OpenAI 现已支持音频转录功能，可使用 Azure 上托管的先进模型将音频文件中的语音转换为文本。

### Maven 依赖

音频转录功能已包含在主包 `langchain4j-azure-open-ai` 中：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-azure-open-ai</artifactId>
    <version>1.13.0</version>
</dependency>
```

### 纯 Java 用法

可使用 `AzureOpenAiAudioTranscriptionModel` 转录音频文件：

```java
import dev.langchain4j.data.audio.Audio;
import dev.langchain4j.model.audio.AudioTranscriptionRequest;
import dev.langchain4j.model.audio.AudioTranscriptionResponse;
import java.io.File;
import java.nio.file.Files;

AzureOpenAiAudioTranscriptionModel model = AzureOpenAiAudioTranscriptionModel.builder()
    .endpoint(System.getenv("AZURE_OPENAI_URL"))
    .apiKey(System.getenv("AZURE_OPENAI_KEY"))
    .deploymentName("your-audio-model-deployment-name") // 例如 "whisper"
    .build();

// 以二进制数据读取音频文件
File audioFile = new File("path/to/audio-file.wav");
byte[] audioData = Files.readAllBytes(audioFile.toPath());

// 使用二进制数据创建 Audio 对象
Audio audio = Audio.builder()
    .binaryData(audioData)
    .build();

// 创建转录请求
AudioTranscriptionRequest request = AudioTranscriptionRequest.builder()
    .audio(audio)
    .prompt("这是一个包含……的音频文件") // 可选
    .language("zh") // 可选
    .temperature(0.0) // 可选
    .build();

// 转录音频
AudioTranscriptionResponse response = model.transcribe(request);
String transcript = response.text();
System.out.println(transcript);
```

### 注意事项

- **部署**：您必须在 Azure OpenAI 资源中部署音频转录模型（如 Whisper）。详情请参阅 [Azure OpenAI 文档](https://learn.microsoft.com/en-us/azure/ai-services/openai/)。
- **支持的格式**：支持 WAV、MP3、FLAC 等常见音频格式。
- **配额与定价**：音频转录会消耗 Azure 订阅资源，请在 Azure 门户中查看相关配额和定价。

## 示例

- [Azure OpenAI 示例](https://github.com/langchain4j/langchain4j-examples/tree/main/azure-open-ai-examples/src/main/java)
- [AzureOpenAiSecurityExamples](https://github.com/langchain4j/langchain4j-examples/blob/main/azure-open-ai-examples/src/main/java/AzureOpenAiSecurityExamples.java)（含 [Azure CLI 部署脚本](https://github.com/langchain4j/langchain4j-examples/blob/main/azure-open-ai-examples/src/main/script/deploy-azure-openai-security.sh)）
