---
sidebar_position: 8
---

# Google Vertex AI Gemini

Vertex AI 是 Google Cloud 完全托管的 AI 开发平台，提供对 Google 大型生成式模型的访问，包括旧一代（PaLM2）和新一代（Gemini）模型。

使用 Vertex AI 前，必须先创建一个 Google Cloud Platform 账户。

## 快速开始

### 创建 Google Cloud 账户

如果您是 Google Cloud 新用户，可在以下页面的 `Get set up on Google Cloud` 下拉菜单中点击 `[create an account]` 按钮创建新账户：

[创建账户](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal#new-to-google-cloud)

### 在 Google Cloud Platform 账户中创建项目

在 Google Cloud 账户中创建新项目并按照以下步骤启用 Vertex AI API：

[创建新项目](https://cloud.google.com/vertex-ai/docs/start/cloud-environment#set_up_a_project)

请记录您的 `PROJECT_ID`，后续 API 调用将需要用到。

### 选择 Google Cloud 认证策略

您的应用向 Google Cloud 服务和 API 进行认证有多种方式。例如，可以创建一个[服务账户](https://cloud.google.com/docs/authentication/provide-credentials-adc#local-key)并将环境变量 `GOOGLE_APPLICATION_CREDENTIALS` 设置为 JSON 凭据文件的路径。

所有认证策略请参阅[此处](https://cloud.google.com/docs/authentication/provide-credentials-adc)。为简化本地测试，我们将使用 `gcloud` 工具进行认证。

### 安装 Google Cloud CLI（可选）

要在本地访问您的云项目，可按[安装说明](https://cloud.google.com/sdk/docs/install)安装 `gcloud` 工具。以 GNU/Linux 操作系统为例，安装步骤如下：

1. 下载 SDK：

```bash
curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-467.0.0-linux-x86_64.tar.gz
```

2. 解压存档：

```bash
tar -xf google-cloud-cli-467.0.0-linux-x86_64.tar.gz
```
3. 运行安装脚本：

```bash
cd google-cloud-sdk/
./install.sh
```

4. 运行以下命令设置默认项目和认证凭据：

```bash
gcloud auth application-default login
```

此认证方法与 `vertex-ai`（嵌入模型、PaLM2）和 `vertex-ai-gemini`（Gemini）两个包均兼容。

## 添加依赖

首先，将以下依赖添加到项目的 `pom.xml`：

```xml
<dependency>
  <groupId>dev.langchain4j</groupId>
  <artifactId>langchain4j-vertex-ai-gemini</artifactId>
  <version>1.13.0-beta23</version>
</dependency>
```

或项目的 `build.gradle`：

```groovy
implementation 'dev.langchain4j:langchain4j-vertex-ai-gemini:1.13.0-beta23'
```

### 尝试示例代码：

[使用对话模型进行文本预测的示例](https://github.com/langchain4j/langchain4j-examples/blob/main/vertex-ai-gemini-examples/src/main/java/VertexAiGeminiChatModelExamples.java)

[Gemini Pro Vision 图像输入示例](https://github.com/langchain4j/langchain4j/blob/657aac9519b57afc04ea434ddcfa70d701923b91/langchain4j-vertex-ai-gemini/src/test/java/dev/langchain4j/model/vertexai/VertexAiGeminiChatModelIT.java#L123)

`PROJECT_ID` 字段代表您在创建新 Google Cloud 项目时设置的变量。

```java
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ImageContent;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.model.vertexai.gemini.VertexAiGeminiChatModel;

public class GeminiProVisionWithImageInput {

    private static final String PROJECT_ID = "YOUR-PROJECT-ID";
    private static final String LOCATION = "us-central1";
    private static final String MODEL_NAME = "gemini-1.5-flash";
    private static final String CAT_IMAGE_URL = "https://upload.wikimedia.org/" +
        "wikipedia/commons/e/e9/" +
        "Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png";

    public static void main(String[] args) {
        ChatModel visionModel = VertexAiGeminiChatModel.builder()
            .project(PROJECT_ID)
            .location(LOCATION)
            .modelName(MODEL_NAME)
            .build();

        ChatResponse response = visionModel.chat(
            UserMessage.from(
                ImageContent.from(CAT_IMAGE_URL),
                TextContent.from("你看到了什么？")
            )
        );
        
        System.out.println(response.aiMessage().text());
    }
}
```

`VertexAiGeminiStreamingChatModel` 类也支持流式输出：

```java
var model = VertexAiGeminiStreamingChatModel.builder()
        .project(PROJECT_ID)
        .location(LOCATION)
        .modelName(GEMINI_1_5_PRO)
        .build();

model.chat("天空为什么是蓝色的？", new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(String partialResponse) {
        System.print(partialResponse);
    }

    @Override
    public void onCompleteResponse(ChatResponse completeResponse){
        System.print(completeResponse);
    }

    @Override
    public void onError(Throwable error) {
        error.printStackTrace();
    }
});
```

您也可以使用 `LambdaStreamingResponseHandler` 中的快捷方法 `onPartialResponse()` 和 `onPartialResponseAndError()`：

```java
model.chat("天空为什么是蓝色的？", onPartialResponse(System.out::print));
model.chat("天空为什么是蓝色的？", onPartialResponseAndError(System.out::print, Throwable::printStackTrace));
```

### 可用模型

| 模型名称 | 描述 | 输入 | 属性 |
|---|---|---|---|
| `gemini-1.5-flash` | 为大规模、高质量、低成本的应用提供速度与效率。 | 文本、代码、图片、音频、视频、带音频的视频、PDF | 最大输入 token：1,048,576，最大输出 token：8,192 |
| `gemini-1.5-pro` | 支持文本或对话提示以获取文本或代码响应，支持最大输入 token 限制内的长上下文理解。 | 文本、代码、图片、音频、视频、带音频的视频、PDF | 最大输入 token：2,097,152，最大输出 token：8,192 |
| `gemini-1.0-pro` | 针对各类纯文本任务性能最佳的模型。 | 文本 | 最大输入 token：32,760，最大输出 token：8,192 |
| `gemini-1.0-pro-vision` | 图片和视频理解能力最佳的模型，适用于广泛的应用场景。 | 文本、图片、音频、视频、带音频的视频、PDF | 最大输入 token：16,384，最大输出 token：2,048 |
| `gemini-1.0-ultra` | 最强大的文本模型，针对复杂任务（包括指令、代码和推理）进行了优化。 | 文本 | 最大输入 token：8,192，最大输出 token：2,048 |
| `gemini-1.0-ultra-vision` | 最强大的多模态视觉模型，针对文本、图片和视频联合输入进行了优化。 | 文本、代码、图片、音频、视频、带音频的视频、PDF | 最大输入 token：8,192，最大输出 token：2,048 |

更多模型信息请参阅 [Gemini 模型文档](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models)。

注意：2024 年 3 月，Ultra 版本仅对许可名单中的用户开放私人访问。如果您不在名单内，可能会收到类似以下的异常：

```text
Caused by: io.grpc.StatusRuntimeException:
 FAILED_PRECONDITION: Project `1234567890` is not allowed to use Publisher Model
  `projects/{YOUR_PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-ultra`
```

## 配置

```java
ChatModel model = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)        // 您的 Google Cloud 项目 ID
    .location(LOCATION)         // AI 推理的区域
    .modelName(MODEL_NAME)      // 使用的模型
    .logRequests(true)          // 记录输入请求
    .logResponses(true)         // 记录输出响应
    .maxOutputTokens(8192)      // 最大生成 token 数（最多 8192）
    .temperature(0.7)           // 温度（介于 0 和 2 之间）
    .topP(0.95)                 // topP（介于 0 和 1 之间）——最高概率 token 的累积概率
    .topK(3)                    // topK（正整数）——从最高概率的 token 中选择
    .seed(1234)                 // 随机数生成器的种子
    .maxRetries(2)              // 最大重试次数
    .responseMimeType("application/json") // 获取 JSON 结构化输出
    .responseSchema(/*...*/)    // 按提供的 Schema 进行结构化输出
    .safetySettings(/*...*/)    // 设置安全过滤器以过滤不当内容
    .useGoogleSearch(true)      // 使用 Google 搜索结果为响应提供基础
    .vertexSearchDatastore(name)// 使用 Vertex AI Search 数据库中的文档为响应提供基础
    .toolCallingMode(/*...*/)   // AUTO（自动）、ANY（从函数列表中选择）、NONE
    .allowedFunctionNames(/*...*/) // 使用 ANY 工具调用模式时，指定允许调用的函数名称
    .listeners(/*...*/)         // 接收模型事件的监听器列表
    .credentials(credentials)   // 自定义 Google Cloud 凭据
    .build();
```

流式对话模型也支持相同的参数。

## 更多示例

Gemini 是一个**多模态**模型，支持文本输入，也支持图片、音频、视频文件以及 PDF。

### 描述图片内容

```java
ChatModel model = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName(GEMINI_1_5_PRO)
    .build();

UserMessage userMessage = UserMessage.from(
    ImageContent.from(CAT_IMAGE_URL),
    TextContent.from("你看到了什么？用一个词回答。")
);

ChatResponse response = model.chat(userMessage);
```

URL 可以是网页 URL，也可以指向存储在 Google Cloud Storage 桶中的文件，例如 `gs://my-bucket/my-image.png`。

也可以将图片内容作为 Base64 编码字符串传入：

```java
String base64Data = Base64.getEncoder().encodeToString(readBytes(CAT_IMAGE_URL));
UserMessage userMessage = UserMessage.from(
        ImageContent.from(base64Data, "image/png"),
        TextContent.from("你看到了什么？用一个词回答。")
);
```

### 针对 PDF 文档提问

```java
var model = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName(GEMINI_1_5_PRO)
    .logRequests(true)
    .logResponses(true)
    .build();

UserMessage message = UserMessage.from(
    PdfFileContent.from(Paths.get("src/test/resources/gemini-doc-snapshot.pdf").toUri()),
    TextContent.from("提供这份文档的摘要")
);

ChatResponse response = model.chat(message);
```

### 工具调用

```java
ChatModel model = VertexAiGeminiChatModel.builder()
        .project(PROJECT_ID)
        .location(LOCATION)
        .modelName(GEMINI_1_5_PRO)
        .build();

ToolSpecification weatherToolSpec = ToolSpecification.builder()
        .name("getWeatherForecast")
        .description("获取某地点的天气预报")
        .parameters(JsonObjectSchema.builder()
                .addStringProperty("location", "需要获取天气预报的地点")
                .required("location")
                .build())
        .build();

ChatRequest request = ChatRequest.builder()
        .messages(UserMessage.from("巴黎的天气怎么样？"))
        .toolSpecifications(weatherToolSpec)
        .build();

ChatResponse response = model.chat(request);
```

模型将返回工具执行请求而非文本消息。您需要通过向模型发送 `ToolExecutionResultMessage` 提供该执行请求的结果，模型随后才能给出文本响应。

当模型在单个响应中发出多个工具执行请求时，也支持并行函数调用。

### 使用 AiServices 支持工具

可使用 `AiServices` 创建由工具驱动的自定义助手。以下示例展示了一个用于数学计算的 `Calculator` 工具，一个指定助手契约的 `Assistant` 接口，以及使用 Gemini、对话记忆和计算器工具配置 `AiServices` 的方式。

```java
static class Calculator {
    @Tool("将两个数字相加")
    double add(double a, double b) {
        return a + b;
    }

    @Tool("将两个数字相乘")
    String multiply(double a, double b) {
        return String.valueOf(a * b);
    }
}

interface Assistant {
    String chat(String userMessage);
}

Calculator calculator = new Calculator();

Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(model)
        .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
        .tools(calculator)
        .build();

String answer = assistant.chat("74589613588 加 4786521789 等于多少？");
```

### 使用 Google 搜索结果为响应提供基础

LLM 并不总能回答所有问题！尤其是训练截止日期之后发生的最新事件或信息。可以用 Google 搜索的新鲜结果为 Gemini 的回答提供**基础**：

```java
var modelWithSearch = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName("gemini-1.5-flash-001")
    .useGoogleSearch(true)
    .build();

String resp = modelWithSearch.chat("巴黎圣日耳曼昨天足球比赛的比分是多少？");
```

### 使用 Vertex AI Search 结果为响应提供基础

处理私密内部信息、文档和数据时，可使用 [Vertex AI Search 数据库](https://cloud.google.com/generative-ai-app-builder/docs/create-data-store-es)来存储这些文档，并以这些文档为 Gemini 的回答提供基础：

```java
var modelWithSearch = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName("gemini-1.5-flash-001")
    .vertexSearchDatastore("name_of_the_datastore")
    .build();
```

### JSON 结构化输出

可要求 Gemini 只返回有效的 JSON 输出：

```java
var modelWithResponseMimeType = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName("gemini-1.5-flash-001")
    .responseMimeType("application/json")
    .build();

String userMessage = "返回包含 Klaus Heisler 的 name 和 surname 两个字段的 JSON。";
String jsonResponse = modelWithResponseMimeType.chat(userMessage).content().text();
// {"name": "Klaus", "surname": "Heisler"}
```

### 使用 JSON Schema 进行严格的 JSON 结构化输出

使用 `responseMimeType("application/json")` 时，如果提示词没有精确描述期望的 JSON 输出格式，模型可能仍有一定的自由发挥空间。为确保更严格的 JSON 结构化输出，可为响应指定 JSON Schema：

```java
Schema schema = Schema.newBuilder()
    .setType(Type.OBJECT)
    .putProperties("name", Schema.newBuilder()
        .setType(Type.STRING)
        .build())
    .putProperties("address", Schema.newBuilder()
        .setType(Type.OBJECT)
        .putProperties("street", 
            Schema.newBuilder().setType(Type.STRING).build())
        .putProperties("zipcode",
           Schema.newBuilder().setType(Type.STRING).build())
    .build())
.build();

var model = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName(GEMINI_1_5_PRO)
    .responseMimeType("application/json")
    .responseSchema(Schema)
    .build();
```

还有一个便捷方法可为 Java 类生成 Schema：

```java
class Artist {
    public String artistName;
    int artistAge;
    protected boolean artistAdult;
    private String artistAddress;
    public Pet[] pets;
}

class Pet {
    public String name;
}

Schema schema = SchemaHelper.fromClass(Artist.class);

var model = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName(GEMINI_1_5_PRO)
    .responseMimeType("application/json")
    .responseSchema(schema)
    .build();
```

另一个方法支持从 JSON Schema 字符串创建 Schema：`SchemaHelper.fromJson(...)`。

Gemini 支持将 JSON 对象和数组作为结构化输出，同时还有一种特殊的 JSON 字符串枚举输出形式，对于让 Gemini 执行分类任务（如情感分析）特别有用：

```java
var model = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName(GEMINI_1_5_PRO)
    .logRequests(true)
    .logResponses(true)
    .responseSchema(Schema.newBuilder()
        .setType(Type.STRING)
        .addAllEnum(Arrays.asList("POSITIVE", "NEUTRAL", "NEGATIVE"))
        .build())
    .build();
```

在这种情况下，隐式响应 MIME 类型会被设置为 `text/x.enum`（这不是官方注册的 MIME 类型）。

### 指定安全设置

如果要过滤或屏蔽有害内容，可设置不同阈值级别的安全设置：

```java
HashMap<HarmCategory, SafetyThreshold> safetySettings = new HashMap<>();
safetySettings.put(HARM_CATEGORY_HARASSMENT, BLOCK_LOW_AND_ABOVE);
safetySettings.put(HARM_CATEGORY_DANGEROUS_CONTENT, BLOCK_ONLY_HIGH);
safetySettings.put(HARM_CATEGORY_SEXUALLY_EXPLICIT, BLOCK_MEDIUM_AND_ABOVE);

var model = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName("gemini-1.5-flash-001")
    .safetySettings(safetySettings)
    .logRequests(true)
    .logResponses(true)
    .build();
```

### 自定义认证

可提供自定义 Google Cloud 凭据：

```java
import com.google.auth.oauth2.GoogleCredentials;
import java.io.FileInputStream;

GoogleCredentials credentials = GoogleCredentials.fromStream(
    new FileInputStream("path/to/service-account-key.json"));

var model = VertexAiGeminiChatModel.builder()
    .project(PROJECT_ID)
    .location(LOCATION)
    .modelName("gemini-1.5-flash-001")
    .credentials(credentials)
    .build();
```

## 参考资料

[可用区域](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/locations#available-regions)

[多模态功能](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/overview#multimodal_models)


## 示例

- [Google Vertex AI Gemini 示例](https://github.com/langchain4j/langchain4j-examples/tree/main/vertex-ai-gemini-examples/src/main/java)
