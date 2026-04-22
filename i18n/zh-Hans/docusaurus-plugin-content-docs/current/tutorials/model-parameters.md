---
sidebar_position: 4
---

# 模型参数

根据你选择的模型和 provider，
你可以调整大量参数，这些参数将决定：
- 模型输出：生成内容（文本、图像）的创造性或确定性程度、生成内容的长度等
- 连接相关：base URL、鉴权 key、超时、重试、日志等

通常，你都可以在模型提供商官网上找到完整参数说明及其含义。
例如，OpenAI API 的参数可在 https://platform.openai.com/docs/api-reference/chat 查看
（这是最新版本的说明），其中包含如下选项：

| Parameter          | Description                                                                                                                                                                                | Type      |
|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| `modelName`        | 要使用的模型名称（例如 `gpt-4o`、`gpt-4o-mini` 等）                                                                                                                                         | `String`  |
| `temperature`      | 采样温度，取值范围为 0 到 2。较高的值（如 0.8）会使输出更加随机，较低的值（如 0.2）会使输出更聚焦、更具确定性。       | `Double`  |
| `maxTokens`        | chat completion 中最多可生成的 token 数量。                                                                                                                 | `Integer` |
| `frequencyPenalty` | 取值范围为 -2.0 到 2.0。正值会根据某些 token 在当前文本中已经出现的频率对其进行惩罚，从而降低模型逐字重复同一行内容的概率。 | `Double`  |
| `...`              | ...                                                                                                                                                                                        | `...`     |

如需 OpenAI LLM 的完整参数列表，请参阅 [OpenAI Language Model 页面](/integrations/language-models/open-ai)。
不同模型的完整参数与默认值列表，可在对应模型页面中查看
（位于 Integration、Language Model 和 Image Model 各页面下）。

你可以通过两种方式创建 `*Model`：
- 使用静态工厂：只接收 API key 等必填参数，其余参数会自动采用合理的默认值
- 使用 builder 模式：可以逐项指定每个参数的值


## 模型构建器 {#model-builder}
我们可以像下面这样，通过 builder 模式设置模型的所有可用参数：
```java
OpenAiChatModel model = OpenAiChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .temperature(0.3)
        .timeout(ofSeconds(60))
        .logRequests(true)
        .logResponses(true)
        .build();
```

## 在 Quarkus 中设置参数
Quarkus 应用中的 LangChain4j 参数可以像下面这样在 `application.properties` 中配置：
```
quarkus.langchain4j.openai.api-key=${OPENAI_API_KEY}
quarkus.langchain4j.openai.chat-model.temperature=0.5
quarkus.langchain4j.openai.timeout=60s
```

有意思的是，如果是为了调试、微调，或者只是想了解有哪些可用参数，
你可以直接查看 Quarkus DEV UI。
在这个控制面板中，你做出的修改会立刻反映到运行中的实例里，
并且这些改动会自动回写到代码配置中。
你可以通过 `quarkus dev` 命令启动 Quarkus 应用，
然后在 localhost:8080/q/dev-ui（或者你的应用实际部署地址）访问 DEV UI。

![](/img/quarkus-dev-ui-parameters.png)

更多关于 Quarkus 集成的信息可在[这里](/tutorials/quarkus-integration)查看。

## 在 Spring Boot 中设置参数
如果你使用的是我们的某个 [Spring Boot starter](https://github.com/langchain4j/langchain4j-spring)，
可以像下面这样在 `application.properties` 中配置模型参数：
```
langchain4j.open-ai.chat-model.api-key=${OPENAI_API_KEY}
langchain4j.open-ai.chat-model.model-name=gpt-4-1106-preview
...
```
完整的受支持配置项列表可在
[这里](https://github.com/langchain4j/langchain4j-spring/blob/main/langchain4j-open-ai-spring-boot-starter/src/main/java/dev/langchain4j/openai/spring/AutoConfig.java)查看。

更多关于 Spring Boot 集成的信息可在[这里](/tutorials/spring-boot-integration)查看。
