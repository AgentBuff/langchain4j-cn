---
sidebar_position: 20
---

# ZhiPu AI

[ZhiPu AI](https://www.zhipuai.cn/) 是一个提供模型服务的平台，包括文本生成、文本嵌入、图像生成等。详细信息请参考 [ZhiPu AI 开放平台](https://open.bigmodel.cn/)。
LangChain4j 通过 [HTTP 端点](https://bigmodel.cn/dev/api/normal-model/glm-4)与 ZhiPu AI 进行集成，目前正在考虑将其从 HTTP 端点迁移到官方 SDK，欢迎贡献！

## Maven 依赖

ZhiPu AI 可在纯 Java 或 Spring Boot 应用中使用。

### 纯 Java

:::note
自 `1.0.0-alpha1` 起，`langchain4j-zhipu-ai` 已迁移至 `langchain4j-community`，并更名为
`langchain4j-community-zhipu-ai`
:::

`1.0.0-alpha1` 之前：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-zhipu-ai</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-alpha1` 及以上版本：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-zhipu-ai</artifactId>
    <version>${latest version here}</version>
</dependency>
```

或者，使用 BOM 统一管理依赖版本：

```xml

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>dev.langchain4j</groupId>
            <artifactId>langchain4j-community-bom</artifactId>
            <version>${latest version here}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

## 可配置参数

### `ZhipuAiChatModel`

`ZhipuAiChatModel` 初始化时可配置以下参数：

| 属性             | 说明                                                                                                                                                                           | 默认值                    |
|----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------|
| baseUrl        | 连接的 URL，可使用 HTTP 或 WebSocket 连接到 DashScope                                                                                                                           | https://open.bigmodel.cn/ |
| apiKey         | API Key                                                                                                                                                                       |                          |
| model          | 使用的模型                                                                                                                                                                     | glm-4-flash              |
| topP           | 核采样的概率阈值，控制模型生成文本的多样性。`top_p` 越高，生成文本越多样，反之亦然。取值范围：(0, 1.0]。通常建议只调整 `top_p` 或 `temperature` 其中一个。                                     |                          |
| maxRetries     | 最大重试次数                                                                                                                                                                   | 3                        |
| temperature    | 采样温度，控制模型生成文本的多样性。温度越高，生成文本越多样，反之亦然。取值范围：[0, 2)                                                                                               | 0.7                      |
| stops          | 停止词参数，当模型即将生成指定字符串或 token_id 时，将自动停止生成。                                                                                                                |                          |
| maxToken       | 本次请求返回的最大 token 数                                                                                                                                                     | 512                      |
| listeners      | 监听请求、响应和错误的监听器                                                                                                                                                     |                          |
| callTimeout    | OKHttp 请求超时配置                                                                                                                                                           |                          |
| connectTimeout | OKHttp 连接超时配置                                                                                                                                                           |                          |
| writeTimeout   | OKHttp 写入超时配置                                                                                                                                                           |                          |
| readTimeout    | OKHttp 读取超时配置                                                                                                                                                           |                          |
| logRequests    | 是否记录请求日志                                                                                                                                                               | false                    |
| logResponses   | 是否记录响应日志                                                                                                                                                               | false                    |

### `ZhipuAiStreamingChatModel`

与 `ZhipuAiChatModel` 相同，但不含 `maxRetries`。

## 示例

### 纯 Java

使用以下代码初始化 `ZhipuAiChatModel`：

```java
ChatModel qwenModel = ZhipuAiChatModel.builder()
                    .apiKey("You API key here")
                    .callTimeout(Duration.ofSeconds(60))
                    .connectTimeout(Duration.ofSeconds(60))
                    .writeTimeout(Duration.ofSeconds(60))
                    .readTimeout(Duration.ofSeconds(60))
                    .build();
```

或更多自定义参数：

```java
ChatModel qwenModel = ZhipuAiChatModel.builder()
                    .apiKey("You API key here")
                    .model("glm-4")
                    .temperature(0.6)
                    .maxToken(1024)
                    .maxRetries(2)
                    .callTimeout(Duration.ofSeconds(60))
                    .connectTimeout(Duration.ofSeconds(60))
                    .writeTimeout(Duration.ofSeconds(60))
                    .readTimeout(Duration.ofSeconds(60))
                    .build();
```

### 更多示例

可在以下链接查看更多示例：

- [ZhipuAiChatModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-zhipu-ai/src/test/java/dev/langchain4j/community/model/zhipu/ZhipuAiChatModelIT.java)
- [ZhipuAiStreamingChatModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-zhipu-ai/src/test/java/dev/langchain4j/community/model/zhipu/ZhipuAiStreamingChatModelIT.java)
