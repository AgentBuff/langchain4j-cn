---
sidebar_position: 11
---

# 结构化输出

:::note
“Structured Outputs” 这个术语有歧义，可能指两件事：
- LLM 以结构化格式生成输出的通用能力（本页介绍的是这一层含义）
- OpenAI 的 [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) 功能，
  它同时适用于 response format 和 tools（function calling）
:::

许多 LLM 和 LLM 提供商都支持以结构化格式生成输出，通常是 JSON。
这些输出可以很容易地映射为 Java 对象，并在应用的其他部分继续使用。

例如，假设我们有一个 `Person` 类：
```java
record Person(String name, int age, double height, boolean married) {
}
```
我们的目标，是从下面这种非结构化文本中提取出一个 `Person` 对象：
```
John is 42 years old and lives an independent life.
He stands 1.75 meters tall and carries himself with confidence.
Currently unmarried, he enjoys the freedom to focus on his personal goals and interests.
```

当前，根据具体的 LLM 和 LLM 提供商，通常有三种方式可以做到这一点
（从最可靠到最不可靠）：
- [JSON Schema 模式](/tutorials/structured-outputs#json-schema)
- [提示词 + JSON 模式](/tutorials/structured-outputs#prompting--json-mode)
- [提示词模式](/tutorials/structured-outputs#prompting)


## JSON Schema 模式 {#json-schema}
一些 LLM 提供商（目前包括 Amazon Bedrock、Azure OpenAI、Google AI Gemini、Mistral、Ollama 和 OpenAI）
允许为目标输出显式指定 [JSON schema](https://json-schema.org/overview/what-is-jsonschema)。
所有支持的 LLM 提供商可在[这里](/integrations/language-models)的 “JSON Schema” 列查看。

当请求中指定了 JSON schema 时，LLM 就会被期望生成符合该 schema 的输出。

:::note
请注意，JSON schema 是通过发给 LLM 提供商 API 的专用请求字段来指定的，
不需要再把任何自由文本形式的说明写进 prompt 中
（例如 system message 或 user message）。
:::

LangChain4j 在低层 `ChatModel` API 和高层 AI Service API 中都支持 JSON Schema 功能。

### 在 `ChatModel` 中使用 JSON Schema {#using-json-schema-with-chatmodel}

在低层 `ChatModel` API 中，可以在创建 `ChatRequest` 时，
通过与具体 LLM 提供商无关的 `ResponseFormat` 和 `JsonSchema` 来指定 JSON schema：
```java
ResponseFormat responseFormat = ResponseFormat.builder()
        .type(JSON) // type 可以是 TEXT（默认）或 JSON
        .jsonSchema(JsonSchema.builder()
                .name("Person") // OpenAI 要求必须为 schema 指定 name
                .rootElement(JsonObjectSchema.builder() // 见下方 [1]
                        .addStringProperty("name")
                        .addIntegerProperty("age")
                        .addNumberProperty("height")
                        .addBooleanProperty("married")
                        .required("name", "age", "height", "married") // 见下方 [2]
                        .build())
                .build())
        .build();

UserMessage userMessage = UserMessage.from("""
        John is 42 years old and lives an independent life.
        He stands 1.75 meters tall and carries himself with confidence.
        Currently unmarried, he enjoys the freedom to focus on his personal goals and interests.
        """);

ChatRequest chatRequest = ChatRequest.builder()
        .responseFormat(responseFormat)
        .messages(userMessage)
        .build();

ChatModel chatModel = OpenAiChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .logRequests(true)
        .logResponses(true)
        .build();
// OR
ChatModel chatModel = AzureOpenAiChatModel.builder()
        .endpoint(System.getenv("AZURE_OPENAI_URL"))
        .apiKey(System.getenv("AZURE_OPENAI_API_KEY"))
        .deploymentName("gpt-4o-mini")
        .logRequestsAndResponses(true)
        .build();
// OR
ChatModel chatModel = GoogleAiGeminiChatModel.builder()
        .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
        .modelName("gemini-1.5-flash")
        .logRequestsAndResponses(true)
        .build();
// OR
ChatModel chatModel = OllamaChatModel.builder()
        .baseUrl("http://localhost:11434")
        .modelName("llama3.1")
        .logRequests(true)
        .logResponses(true)
        .build();
// OR
ChatModel chatModel = MistralAiChatModel.builder()
        .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
        .modelName("mistral-small-latest")
        .logRequests(true)
        .logResponses(true)
        .build();
// OR
ChatModel chatModel = WatsonxChatModel.builder()
        .baseUrl(System.getenv("WATSONX_URL"))
        .projectId(System.getenv("WATSONX_PROJECT_ID"))
        .apiKey(System.getenv("WATSONX_API_KEY"))
        .modelName("ibm/granite-4-h-small")
        .logRequests(true)
        .logResponses(true)
        .build();
// OR
ChatModel chatModel = BedrockChatModel.builder()
        .modelId("us.anthropic.claude-haiku-4-5-20251001-v1:0")
        .logRequests(true)
        .logResponses(true)
        .build();

ChatResponse chatResponse = chatModel.chat(chatRequest);

String output = chatResponse.aiMessage().text();
System.out.println(output); // {"name":"John","age":42,"height":1.75,"married":false}

Person person = new ObjectMapper().readValue(output, Person.class);
System.out.println(person); // Person[name=John, age=42, height=1.75, married=false]
```
说明：
- [1] - 在大多数情况下，根元素必须是 `JsonObjectSchema` 类型，
  但也有例外：
  - Amazon Bedrock、Azure OpenAI、Mistral、Ollama、OpenAI 和 OpenAI Official 也允许把 `JsonRawSchema` 作为根元素
  - Gemini 还允许把 `JsonEnumSchema` 和 `JsonArraySchema` 作为根元素
- [2] - 必填属性必须显式声明，否则它们会被视为可选属性。

JSON schema 的结构通过 `JsonSchemaElement` 接口定义，
它包含以下子类型：
- `JsonObjectSchema`：用于对象类型
- `JsonStringSchema`：用于 `String`、`char` / `Character` 类型
- `JsonIntegerSchema`：用于 `int` / `Integer`、`long` / `Long`、`BigInteger` 类型
- `JsonNumberSchema`：用于 `float` / `Float`、`double` / `Double`、`BigDecimal` 类型
- `JsonBooleanSchema`：用于 `boolean` / `Boolean` 类型
- `JsonEnumSchema`：用于 `enum` 类型
- `JsonArraySchema`：用于数组和集合（例如 `List`、`Set`）
- `JsonReferenceSchema`：用于支持递归结构（例如 `Person` 中有一个 `Set<Person> children` 字段）
- `JsonAnyOfSchema`：用于支持多态（例如 `Shape` 可能是 `Circle` 或 `Rectangle`）
- `JsonNullSchema`：用于支持 nullable 类型
- `JsonRawSchema`：用于直接使用你自定义的完整 JSON schema

#### `JsonObjectSchema` {#jsonobjectschema}

`JsonObjectSchema` 表示一个带嵌套属性的对象。
它通常是 `JsonSchema` 的根元素。

向 `JsonObjectSchema` 添加属性有多种方式：
1. 通过 `properties(Map<String, JsonSchemaElement> properties)` 一次性添加全部属性：
```java
JsonSchemaElement citySchema = JsonStringSchema.builder()
        .description("The city for which the weather forecast should be returned")
        .build();

JsonSchemaElement temperatureUnitSchema = JsonEnumSchema.builder()
        .enumValues("CELSIUS", "FAHRENHEIT")
        .build();

Map<String, JsonSchemaElement> properties = Map.of(
        "city", citySchema,
        "temperatureUnit", temperatureUnitSchema
);

JsonSchemaElement rootElement = JsonObjectSchema.builder()
        .addProperties(properties)
        .required("city") // required 属性需要显式指定
        .build();
```

2. 通过 `addProperty(String name, JsonSchemaElement jsonSchemaElement)` 单独逐个添加属性：
```java
JsonSchemaElement rootElement = JsonObjectSchema.builder()
        .addProperty("city", citySchema)
        .addProperty("temperatureUnit", temperatureUnitSchema)
        .required("city")
        .build();
```

3. 通过 `add{Type}Property(String name)` 或 `add{Type}Property(String name, String description)` 一类的方法逐个添加：
```java
JsonSchemaElement rootElement = JsonObjectSchema.builder()
        .addStringProperty("city", "The city for which the weather forecast should be returned")
        .addEnumProperty("temperatureUnit", List.of("CELSIUS", "FAHRENHEIT"))
        .required("city")
        .build();
```

更多细节请参阅
[JsonObjectSchema](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/model/chat/request/json/JsonObjectSchema.java)
的 Javadoc。

#### `JsonStringSchema`

创建 `JsonStringSchema` 的示例：
```java
JsonSchemaElement stringSchema = JsonStringSchema.builder()
        .description("The name of the person")
        .build();
```

#### `JsonIntegerSchema`

创建 `JsonIntegerSchema` 的示例：
```java
JsonSchemaElement integerSchema = JsonIntegerSchema.builder()
        .description("The age of the person")
        .build();
```

#### `JsonNumberSchema`

创建 `JsonNumberSchema` 的示例：
```java
JsonSchemaElement numberSchema = JsonNumberSchema.builder()
        .description("The height of the person")
        .build();
```

#### `JsonBooleanSchema`

创建 `JsonBooleanSchema` 的示例：
```java
JsonSchemaElement booleanSchema = JsonBooleanSchema.builder()
        .description("Is the person married?")
        .build();
```

#### `JsonEnumSchema`

创建 `JsonEnumSchema` 的示例：
```java
JsonSchemaElement enumSchema = JsonEnumSchema.builder()
        .description("Marital status of the person")
        .enumValues(List.of("SINGLE", "MARRIED", "DIVORCED"))
        .build();
```

#### `JsonArraySchema`

下面是一个定义字符串数组的 `JsonArraySchema` 示例：
```java
JsonSchemaElement itemSchema = JsonStringSchema.builder()
        .description("The name of the person")
        .build();

JsonSchemaElement arraySchema = JsonArraySchema.builder()
        .description("All names of the people found in the text")
        .items(itemSchema)
        .build();
```

#### `JsonReferenceSchema`

`JsonReferenceSchema` 可用于支持递归结构：
```java
String reference = "person"; // reference 在当前 schema 内应保持唯一

JsonObjectSchema jsonObjectSchema = JsonObjectSchema.builder()
        .addStringProperty("name")
        .addProperty("children", JsonArraySchema.builder()
                .items(JsonReferenceSchema.builder()
                        .reference(reference)
                        .build())
                .build())
        .required("name", "children")
        .definitions(Map.of(reference, JsonObjectSchema.builder()
                .addStringProperty("name")
                .addProperty("children", JsonArraySchema.builder()
                        .items(JsonReferenceSchema.builder()
                                .reference(reference)
                                .build())
                        .build())
                .required("name", "children")
                .build()))
        .build();
```

:::note
`JsonReferenceSchema` 目前仅由 Azure OpenAI、Mistral 和 OpenAI 支持。
:::

#### `JsonAnyOfSchema`

`JsonAnyOfSchema` 可用于支持多态：
```java
JsonSchemaElement circleSchema = JsonObjectSchema.builder()
        .addNumberProperty("radius")
        .build();

JsonSchemaElement rectangleSchema = JsonObjectSchema.builder()
        .addNumberProperty("width")
        .addNumberProperty("height")
        .build();

JsonSchemaElement shapeSchema = JsonAnyOfSchema.builder()
        .anyOf(circleSchema, rectangleSchema)
        .build();

JsonSchema jsonSchema = JsonSchema.builder()
        .name("Shapes")
        .rootElement(JsonObjectSchema.builder()
                .addProperty("shapes", JsonArraySchema.builder()
                        .items(shapeSchema)
                        .build())
                .required(List.of("shapes"))
                .build())
        .build();

ResponseFormat responseFormat = ResponseFormat.builder()
        .type(ResponseFormatType.JSON)
        .jsonSchema(jsonSchema)
        .build();

UserMessage userMessage = UserMessage.from("""
        Extract information from the following text:
        1. A circle with a radius of 5
        2. A rectangle with a width of 10 and a height of 20
        """);

ChatRequest chatRequest = ChatRequest.builder()
        .messages(userMessage)
        .responseFormat(responseFormat)
        .build();

ChatResponse chatResponse = model.chat(chatRequest);

System.out.println(chatResponse.aiMessage().text()); // {"shapes":[{"radius":5},{"width":10,"height":20}]}
```

:::note
`JsonAnyOfSchema` 目前仅由 OpenAI、Azure OpenAI 和 Google AI Gemini 支持。
:::

#### `JsonRawSchema`

下面是根据已有 schema 字符串创建 `JsonRawSchema` 的示例：

```java
var rawSchema = """
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "city": {
            "type": "string"
        }
    },
    "required": ["city"],
    "additionalProperties": false
}
""";

JsonRawSchema schema = JsonRawSchema.from(rawSchema);
```

:::note
`JsonRawSchema` 目前仅由 Amazon Bedrock、Azure OpenAI、Mistral、Ollama、OpenAI、OpenAI Official 和 Google AI Gemini 支持。
对于 Google AI Gemini 的具体用法，请参阅
[Response JSON Schema](/integrations/language-models/google-ai-gemini/#response-json-schema) 中的示例。
:::


#### 添加 Description

除 `JsonReferenceSchema` 外，所有 `JsonSchemaElement` 子类型都带有 `description` 属性。
如果 LLM 没有产生你想要的输出，可以通过 description 为它提供更多指令和正确输出示例，例如：
```java
JsonSchemaElement stringSchema = JsonStringSchema.builder()
        .description("The name of the person, for example: John Doe")
        .build();
```

#### 限制

在 `ChatModel` 中使用 JSON Schema 时，有一些限制：
- 仅适用于受支持的 Amazon Bedrock、Azure OpenAI、Google AI Gemini、Mistral、Ollama 和 OpenAI 模型。
- 对于 OpenAI，它目前还不能在[流式模式](/tutorials/ai-services#streaming)下工作。
  对于 Google AI Gemini、Mistral 和 Ollama，则可以在创建 / 构建模型时通过 `responseSchema(...)` 指定 JSON Schema。
- `JsonReferenceSchema` 和 `JsonAnyOfSchema` 目前仅由 Azure OpenAI、Mistral 和 OpenAI 支持。


### 在 AI Services 中使用 JSON Schema {#using-json-schema-with-ai-services}

在使用 [AI Services](/tutorials/ai-services) 时，
实现同样的事情会简单得多，而且代码也更少：
```java
interface PersonExtractor {
    
    Person extractPersonFrom(String text);
}

ChatModel chatModel = OpenAiChatModel.builder() // 见下方 [1]
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA) // 见下方 [2]
        .strictJsonSchema(true) // 见下方 [2]
        .logRequests(true)
        .logResponses(true)
        .build();
// OR
ChatModel chatModel = AzureOpenAiChatModel.builder() // 见下方 [1]
        .endpoint(System.getenv("AZURE_OPENAI_URL"))
        .apiKey(System.getenv("AZURE_OPENAI_API_KEY"))
        .deploymentName("gpt-4o-mini")
        .strictJsonSchema(true)
        .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA) // 见下方 [3]
        .logRequestsAndResponses(true)
        .build();
// OR
ChatModel chatModel = GoogleAiGeminiChatModel.builder() // 见下方 [1]
        .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
        .modelName("gemini-1.5-flash")
        .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA) // 见下方 [4]
        .logRequestsAndResponses(true)
        .build();
// OR
ChatModel chatModel = OllamaChatModel.builder() // 见下方 [1]
        .baseUrl("http://localhost:11434")
        .modelName("llama3.1")
        .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA) // 见下方 [5]
        .logRequests(true)
        .logResponses(true)
        .build();
// OR
ChatModel chatModel = MistralAiChatModel.builder()
         .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
         .modelName("mistral-small-latest")
         .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA) // 见下方 [6]
         .strictJsonSchema(true) // 见下方 [6]
         .logRequests(true)
         .logResponses(true)
         .build();
// OR
ChatModel chatModel = WatsonxChatModel.builder()
        .baseUrl(System.getenv("WATSONX_URL"))
        .projectId(System.getenv("WATSONX_PROJECT_ID"))
        .apiKey(System.getenv("WATSONX_API_KEY"))
        .modelName("ibm/granite-4-h-small")
        .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA) // 见下方 [7]
        .logRequests(true)
        .logResponses(true)
        .build();
// OR
ChatModel chatModel = BedrockChatModel.builder()
        .modelId("us.anthropic.claude-haiku-4-5-20251001-v1:0")
        .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA) // 见下方 [8]
        .logRequests(true)
        .logResponses(true)
        .build();

PersonExtractor personExtractor = AiServices.create(PersonExtractor.class, chatModel); // 见下方 [1]

String text = """
        John is 42 years old and lives an independent life.
        He stands 1.75 meters tall and carries himself with confidence.
        Currently unmarried, he enjoys the freedom to focus on his personal goals and interests.
        """;

Person person = personExtractor.extractPersonFrom(text);

System.out.println(person); // Person[name=John, age=42, height=1.75, married=false]
```
说明：
- [1] - 在 Quarkus 或 Spring Boot 应用中，无需显式创建 `ChatModel` 和 AI Service，
  这些 Bean 会被自动创建。更多信息：
  [Quarkus](https://docs.quarkiverse.io/quarkus-langchain4j/dev/ai-services.html)，
  [Spring Boot](https://docs.langchain4j.dev/tutorials/spring-boot-integration#spring-boot-starter-for-declarative-ai-services)。
- [2] - 这是为 OpenAI 启用 JSON Schema 功能所必需的，更多细节见[这里](/integrations/language-models/open-ai#structured-outputs-for-response-format)。
- [3] - 这是为 [Azure OpenAI](/integrations/language-models/azure-open-ai) 启用 JSON Schema 功能所必需的。
- [4] - 这是为 [Google AI Gemini](/integrations/language-models/google-ai-gemini) 启用 JSON Schema 功能所必需的。
- [5] - 这是为 [Ollama](/integrations/language-models/ollama) 启用 JSON Schema 功能所必需的。
- [6] - 这是为 [Mistral](/integrations/language-models/mistral-ai) 启用 JSON Schema 功能所必需的。
- [7] - 这是为 [watsonx.ai](/integrations/language-models/watsonx) 启用 JSON Schema 功能所必需的。
- [8] - 这是为 [Amazon Bedrock](/integrations/language-models/amazon-bedrock) 启用 JSON Schema 功能所必需的。

当以下条件全部满足时：
- AI Service 方法返回的是一个 POJO
- 所使用的 `ChatModel` [支持](https://docs.langchain4j.dev/integrations/language-models/) JSON Schema 功能
- JSON Schema 功能已在所使用的 `ChatModel` 上启用

那么 `ResponseFormat` 和对应的 `JsonSchema` 就会根据声明的返回类型被自动生成。

:::note
请确保在配置 `ChatModel` 时显式启用 JSON Schema 功能，
因为它默认是关闭的。
:::

自动生成的 `JsonSchema` 的 `name`，
会直接使用返回类型的简单类名（`getClass().getSimpleName()`），
在本例中就是：`Person`。

当 LLM 返回结果后，输出会被解析为对象，并作为 AI Service 方法的返回值返回。

你可以在[这里](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/test/java/dev/langchain4j/service/AiServicesWithJsonSchemaIT.java)
和[这里](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/test/java/dev/langchain4j/service/AiServicesWithJsonSchemaWithDescriptionsIT.java)
看到许多支持场景的示例。

#### 必填与可选

默认情况下，自动生成的 `JsonSchema` 中，所有字段和子字段都被视为**可选**。
这是因为 LLM 在信息不足时，往往会通过幻觉补全字段并填入虚构数据
（例如在缺少名字时填入 `John Doe`）。

:::note
请注意，可选字段如果是基本类型（例如 `int`、`boolean` 等），
在 LLM 没有为其提供值时，会被初始化为默认值
（例如 `int` 的默认值是 `0`，`boolean` 的默认值是 `false`，等等）。
:::

:::note
还请注意，当 strict mode 开启（`strictJsonSchema(true)`）时，
可选的 `enum` 字段仍然有可能被填入幻觉值。
:::

如果要把某个字段改为必填，可以用 `@JsonProperty(required = true)` 注解：
```java
record Person(@JsonProperty(required = true) String name, String surname) {
}

interface PersonExtractor {
    
    Person extractPersonFrom(String text);
}
```

:::note
请注意，当它与 [tools](/tutorials/tools) 一起使用时，
所有字段和子字段默认都被视为**必填**。
:::

#### 添加 Description

如果 LLM 没有生成你想要的输出，
可以通过给类和字段添加 `@Description`，
为 LLM 提供更多指令和正确输出示例，例如：
```java
@Description("a person")
record Person(@Description("person's first and last name, for example: John Doe") String name,
              @Description("person's age, for example: 42") int age,
              @Description("person's height in meters, for example: 1.78") double height,
              @Description("is person married or not, for example: false") boolean married) {
}
```

:::note
请注意，放在 `enum` 枚举值上的 `@Description` **不会生效**，并且**不会**被包含进生成的 JSON schema 中：
```java
enum Priority {

    @Description("Critical issues such as payment gateway failures or security breaches.") // this is ignored
    CRITICAL,
    
    @Description("High-priority issues like major feature malfunctions or widespread outages.") // this is ignored
    HIGH,
    
    @Description("Low-priority issues such as minor bugs or cosmetic problems.") // this is ignored
    LOW
}
```
:::

#### 限制

在 AI Services 中使用 JSON Schema 时，有以下限制：
- 仅适用于受支持的 Amazon Bedrock、Azure OpenAI、Google AI Gemini、Mistral、Ollama 和 OpenAI 模型。
- 在配置 `ChatModel` 时，必须显式启用 JSON Schema 支持。
- 它不能在[流式模式](/tutorials/ai-services#streaming)下工作。
- 并非所有类型都受支持。支持类型列表见[这里](/tutorials/structured-outputs#supported-types)。
- POJO 可包含：
  - 标量 / 简单类型（例如 `String`、`int` / `Integer`、`double` / `Double`、`boolean` / `Boolean` 等）
  - `enum`
  - 嵌套 POJO
  - `List<T>`、`Set<T>` 和 `T[]`，其中 `T` 可以是标量、`enum` 或 POJO
- 递归目前仅由 Azure OpenAI、Mistral 和 OpenAI 支持。
- 多态暂时还不受支持。返回的 POJO 及其嵌套 POJO 必须是具体类；接口和抽象类不支持。
- 当 LLM 不支持 JSON Schema 功能，或该功能未启用，或返回类型不受支持时，
  AI Service 会回退到 [prompting](/tutorials/structured-outputs#prompting)。


## 提示词 + JSON 模式 {#prompting--json-mode}

更多内容即将补充。
在此之前，请先阅读 [这一节](/tutorials/ai-services#json-mode)
以及[这篇文章](https://glaforge.dev/posts/2024/11/18/data-extraction-the-many-ways-to-get-llms-to-spit-json-content/)。


## 提示词模式 {#prompting}

当使用 prompting 时（这也是默认方式，除非显式启用了 JSON schema 支持），
AI Service 会自动生成格式说明，并将其追加到 `UserMessage` 末尾，
告诉 LLM 应该按照什么格式返回结果。
在方法返回之前，AI Service 会把 LLM 的输出解析为目标类型。

你可以通过[启用日志](/tutorials/logging)来观察这些追加进去的说明。

:::note
这种方式并不可靠。
如果 LLM 和 LLM 提供商支持上面介绍的那些方式，优先使用它们会更好。
:::


## 支持的类型 {#supported-types}

| Type                          | JSON Schema | Prompting |
|-------------------------------|-------------|-----------|
| `POJO`                        | ✅           | ✅         |
| `List<POJO>`, `Set<POJO>`     | ✅           | ❌         |
| `Enum`                        | ✅           | ✅         |
| `List<Enum>`, `Set<Enum>`     | ✅           | ✅         |
| `List<String>`, `Set<String>` | ✅           | ✅         |
| `boolean`, `Boolean`          | ✅           | ✅         |
| `int`, `Integer`              | ✅           | ✅         |
| `long`, `Long`                | ✅           | ✅         |
| `float`, `Float`              | ✅           | ✅         |
| `double`, `Double`            | ✅           | ✅         |
| `byte`, `Byte`                | ❌           | ✅         |
| `short`, `Short`              | ❌           | ✅         |
| `BigInteger`                  | ❌           | ✅         |
| `BigDecimal`                  | ❌           | ✅         |
| `Date`                        | ❌           | ✅         |
| `LocalDate`                   | ❌           | ✅         |
| `LocalTime`                   | ❌           | ✅         |
| `LocalDateTime`               | ❌           | ✅         |
| `Map<?, ?>`                   | ❌           | ✅         |

几个示例：
```java
record Person(String firstName, String lastName) {}

enum Sentiment {
    POSITIVE, NEGATIVE, NEUTRAL
}

interface Assistant {

    Person extractPersonFrom(String text);

    Set<Person> extractPeopleFrom(String text);

    Sentiment extractSentimentFrom(String text);

    List<Sentiment> extractSentimentsFrom(String text);

    List<String> generateOutline(String topic);

    boolean isSentimentPositive(String text);

    Integer extractNumberOfPeopleMentionedIn(String text);
}
```

## 相关教程 {#related-tutorials}
- [Data extraction: The many ways to get LLMs to spit JSON content](https://glaforge.dev/posts/2024/11/18/data-extraction-the-many-ways-to-get-llms-to-spit-json-content/) by [Guillaume Laforge](https://glaforge.dev/about/)
