---
sidebar_position: 8
---

# ZhiPu AI

[ZhiPu AI](https://www.zhipuai.cn/) 是一个提供模型服务的平台，包括文本生成、文本嵌入、图像生成等。详情请参阅 [ZhiPu AI 开放平台](https://open.bigmodel.cn/)。LangChain4j 通过 [HTTP 接口](https://bigmodel.cn/dev/api/normal-model/glm-4) 集成 ZhiPu AI，目前正在考虑从 HTTP 接口迁移到官方 SDK，欢迎贡献！

## Maven 依赖

你可以在普通 Java 或 Spring Boot 应用中结合 LangChain4j 使用 ZhiPu AI。

### 纯 Java {#plain-java}

:::note
自 `1.0.0-alpha1` 起，`langchain4j-zhipu-ai` 已迁移至 `langchain4j-community`，并重命名为 `langchain4j-community-zhipu-ai`
:::

`1.0.0-alpha1` 之前：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-zhipu-ai</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-alpha1` 及更高版本：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-zhipu-ai</artifactId>
    <version>${latest version here}</version>
</dependency>
```

或者，可以使用 BOM 统一管理依赖：

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

## API 列表 {#apis}

- `ZhipuAiImageModel`

## 示例

- [ZhipuAiImageModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-zhipu-ai/src/test/java/dev/langchain4j/community/model/zhipu/ZhipuAiImageModelIT.java)
