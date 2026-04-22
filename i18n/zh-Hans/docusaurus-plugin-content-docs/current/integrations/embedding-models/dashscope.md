---
sidebar_position: 5
---

# DashScope

[DashScope](https://dashscope.aliyun.com/) 是[阿里云](https://www.alibabacloud.com/)开发的平台，
提供模型可视化、监控和调试接口，尤其适用于生产环境中的 AI/ML 模型。该平台允许用户可视化性能指标、
追踪模型行为，并在部署周期早期发现潜在问题。

[通义千问](https://tongyi.aliyun.com/)是[阿里云](https://www.alibabacloud.com/)开发的一系列生成式 AI 模型，
专为文本生成、摘要、问答及各类 NLP 任务而设计。

更多详情请参阅 [DashScope 文档](https://help.aliyun.com/zh/model-studio/getting-started/?spm=a2c4g.11186623.help-menu-2400256.d_0.6655453aLIyxGp)。
LangChain4j 通过 [DashScope Java SDK](https://help.aliyun.com/zh/dashscope/java-sdk-best-practices?spm=a2c4g.11186623.0.0.272a1507Ne69ja) 与 DashScope 集成。

## Maven 依赖

:::note
自 `1.0.0-alpha1` 起，`langchain4j-dashscope` 已迁移到 `langchain4j-community` 并重命名为
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

或使用 BOM 统一管理依赖：

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

`QwenEmbeddingModel` 初始化时支持以下参数：

| 属性 | 描述 | 默认值 |
|---|---|---|
| baseUrl | 连接的 URL，可使用 HTTP 或 WebSocket 连接 DashScope | https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding |
| apiKey | API Key | |
| modelName | 使用的模型 | text-embedding-v2 |

## 示例

- [QwenEmbeddingModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-dashscope/src/test/java/dev/langchain4j/community/model/dashscope/QwenEmbeddingModelIT.java)
