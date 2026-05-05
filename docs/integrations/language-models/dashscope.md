---
sidebar_position: 5
---

# DashScope（通义千问）

[DashScope](https://dashscope.aliyun.com/) 是[阿里云](https://www.alibabacloud.com/)开发的平台，
提供模型可视化、监控和调试接口，尤其适用于生产环境中的 AI/ML 模型。该平台支持性能指标可视化、行为追踪，以及在部署周期早期发现潜在问题。

[通义千问（Qwen）](https://tongyi.aliyun.com/) 模型是[阿里云](https://www.alibabacloud.com/)开发的一系列生成式 AI 模型，专为文本生成、摘要、问答和各类 NLP 任务设计。

详细信息请参阅 [DashScope 文档](https://help.aliyun.com/zh/model-studio/getting-started/?spm=a2c4g.11186623.help-menu-2400256.d_0.6655453aLIyxGp)。
LangChain4j 通过 [DashScope Java SDK](https://help.aliyun.com/zh/dashscope/java-sdk-best-practices?spm=a2c4g.11186623.0.0.272a1507Ne69ja) 与 DashScope 集成。

## Maven 依赖

DashScope 可在纯 Java 或 Spring Boot 应用中使用。

### 纯 Java

:::note
自 `1.0.0-alpha1` 起，`langchain4j-dashscope` 已迁移至 `langchain4j-community`，并更名为
`langchain4j-community-dashscope`。
:::

`1.0.0-alpha1` 之前：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-dashscope</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-alpha1` 及以上版本：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-dashscope</artifactId>
    <version>${latest version here}</version>
</dependency>
```

### Spring Boot

:::note
自 `1.0.0-alpha1` 起，`langchain4j-dashscope-spring-boot-starter` 已迁移至 `langchain4j-community`，并更名为
`langchain4j-community-dashscope-spring-boot-starter`。
:::

`1.0.0-alpha1` 之前：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-dashscope-spring-boot-starter</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-alpha1` 及以上版本：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-dashscope-spring-boot-starter</artifactId>
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

## 可配置参数

`langchain4j-community-dashscope` 提供 4 种模型：

- `QwenChatModel`
- `QwenStreamingChatModel`
- `QwenLanguageModel`
- `QwenStreamingLanguageModel`

`langchain4j-dashscope` 提供文本生成图像模型：
- `WanxImageModel`

### `QwenChatModel`

`QwenChatModel` 初始化时可配置以下参数：

| 属性                | 说明                                                                                                                                                                           | 默认值                                                                                                                                                                    |
|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| baseUrl           | 连接的 URL，可使用 HTTP 或 WebSocket 连接到 DashScope                                                                                                                           | [文本推理](https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation) 和 [多模态](https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation) |
| apiKey            | API Key                                                                                                                                                                       |                                                                                                                                                                          |
| modelName         | 使用的模型                                                                                                                                                                     | qwen-plus                                                                                                                                                                |
| topP              | 核采样的概率阈值，控制模型生成文本的多样性。`top_p` 越高，生成文本越多样，反之亦然。取值范围：(0, 1.0]。通常建议只调整 `top_p` 或 `temperature` 其中一个。                                     |                                                                                                                                                                          |
| topK              | 生成过程中采样候选集的大小                                                                                                                                                       |                                                                                                                                                                          |
| enableSearch      | 是否让模型在生成文本时参考互联网搜索结果                                                                                                                                           |                                                                                                                                                                          |
| seed              | 设置 seed 参数可使文本生成过程更具确定性，通常用于保证结果的一致性                                                                                                                    |                                                                                                                                                                          |
| repetitionPenalty | 模型生成过程中连续序列的重复惩罚。增大 `repetition_penalty` 可减少生成中的重复，1.0 表示不惩罚。取值范围：(0, +inf)                                                                        |                                                                                                                                                                          |
| temperature       | 采样温度，控制模型生成文本的多样性。温度越高，生成文本越多样，反之亦然。取值范围：[0, 2)                                                                                               |                                                                                                                                                                          |
| stops             | 停止词参数，当模型即将生成指定字符串或 token_id 时，将自动停止生成。                                                                                                                |                                                                                                                                                                          |
| maxTokens         | 本次请求返回的最大 token 数                                                                                                                                                     |                                                                                                                                                                          |
| listeners         | 监听请求、响应和错误的监听器                                                                                                                                                     |                                                                                                                                                                          |

### `QwenStreamingChatModel`

与 `QwenChatModel` 相同。

### `QwenLanguageModel`

与 `QwenChatModel` 相同，但不含 `listeners`。

### `QwenStreamingLanguageModel`

与 `QwenChatModel` 相同，但不含 `listeners`。

## 示例

### 纯 Java

使用以下代码初始化 `QwenChatModel`：

```java
ChatModel qwenModel = QwenChatModel.builder()
                    .apiKey("You API key here")
                    .modelName("qwen-max")
                    .build();
```

或更多自定义参数：

```java
ChatModel qwenModel = QwenChatModel.builder()
                    .apiKey("You API key here")
                    .modelName("qwen-max")
                    .enableSearch(true)
                    .temperature(0.7)
                    .maxTokens(4096)
                    .stops(List.of("Hello"))
                    .build();
```


文本生成图片的调用方式：

```java
WanxImageModel wanxImageModel = WanxImageModel.builder()
                    .modelName("wanx2.1-t2i-plus") 
                    .apiKey("阿里云百炼apikey")     
                    .build();
Response<Image> response = wanxImageModel.generate("美女");
System.out.println(response.content().url());

```

### Spring Boot

引入 `langchain4j-community-dashscope-spring-boot-starter` 依赖后，可通过以下配置注册 `QwenChatModel` Bean：

```properties
langchain4j.community.dashscope.chat-model.api-key=<You API Key here>
langchain4j.community.dashscope.chat-model.model-name=qwen-max
# 参数与 `QwenChatModel` 相同
# 例如：
# langchain4j.community.dashscope.chat-model.temperature=0.7
# langchain4j.community.dashscope.chat-model.max-tokens=4096
```

### 更多示例

可在 [LangChain4j Community](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-dashscope/src/test/java/dev/langchain4j/community/model/dashscope) 查看更多详情。
