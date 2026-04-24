---
sidebar_position: 5
stableVersion: 1.13.0
betaVersion: 1.13.0-beta23
title: LangChain4j 快速开始 | Java 大模型应用入门教程
description: 5 分钟上手 LangChain4j：通过 Maven 或 Gradle 引入依赖，接入 OpenAI、通义千问、DeepSeek、Gemini、Claude、Ollama 等大模型，完成第一次 Java 调用 LLM。要求 JDK 17 及以上。
keywords:
  - LangChain4j 快速开始
  - LangChain4j 入门
  - LangChain4j Maven 依赖
  - LangChain4j Gradle
  - Java 调用 ChatGPT
  - Java 调用 OpenAI
  - Java 调用大模型
  - Java 调用 DeepSeek
  - Java 调用通义千问
image: /img/docusaurus-social-card.jpg
---

# 快速开始

:::note
如果你使用 Quarkus，请参阅 [Quarkus Integration](/tutorials/quarkus-integration/)。

如果你使用 Spring Boot，请参阅 [Spring Boot Integration](/tutorials/spring-boot-integration)。

如果你使用 Helidon，请参阅 [Helidon Integration](/tutorials/helidon-integration)
:::

LangChain4j 提供了对众多 [LLM 提供商](/integrations/language-models/)、
[embedding / 向量存储](/integrations/embedding-stores) 等的集成支持。
每一种集成都有自己对应的 Maven 依赖。

当前支持的最低 JDK 版本是 17。

下面以引入 OpenAI 依赖为例：

- Maven，在 `pom.xml` 中添加：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
    <version>1.13.0</version>
</dependency>
```

如果你想使用高层的 [AI Services](/tutorials/ai-services) API，还需要额外添加
下面这个依赖：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>1.13.0</version>
</dependency>
```

- Gradle，在 `build.gradle` 中添加：
```groovy
implementation 'dev.langchain4j:langchain4j-open-ai:1.13.0'
implementation 'dev.langchain4j:langchain4j:1.13.0'
```

<details>
<summary>Bill of Materials（BOM）</summary>

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>dev.langchain4j</groupId>
            <artifactId>langchain4j-bom</artifactId>
            <version>1.13.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

:::note
请注意，`langchain4j-bom` 始终包含所有 LangChain4j 模块的最新版本。
:::

:::note
还请注意，尽管 `langchain4j-bom` 的版本是 `1.13.0`，
很多模块的版本仍然是 `1.13.0-beta23`，
因此这些模块未来仍有可能发生 breaking changes。
:::
</details>

<details>
<summary>SNAPSHOT 依赖（最新特性）</summary>

如果你希望在正式发布前测试最新功能，
可以使用最新的 `SNAPSHOT` 依赖：
```xml
<repositories>
  <repository>
    <name>Central Portal Snapshots</name>
    <id>central-portal-snapshots</id>
    <url>https://central.sonatype.com/repository/maven-snapshots/</url>
    <releases>
      <enabled>false</enabled>
    </releases>
    <snapshots>
      <enabled>true</enabled>
    </snapshots>
  </repository>
</repositories>

<dependencies>
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j</artifactId>
        <version>1.13.0-SNAPSHOT</version>
    </dependency>
</dependencies>
```
</details>

然后，导入你的 OpenAI API Key。
建议将 API Key 保存在环境变量中，以降低意外泄露的风险。
```java
String apiKey = System.getenv("OPENAI_API_KEY");
```

<details>
<summary>如果我没有 API Key 怎么办？</summary>

如果你暂时没有自己的 OpenAI API Key，也不用担心。
你可以临时使用我们免费提供、仅用于演示的 `demo` key。
需要注意的是，使用 `demo` key 时，所有发往 OpenAI API 的请求都会先经过我们的代理，
由代理注入真实 key 后再转发给 OpenAI API。
我们不会以任何方式收集或使用你的数据。
`demo` key 带有配额限制，仅支持 `gpt-4o-mini` 模型，且应仅用于演示目的。

```java
OpenAiChatModel model = OpenAiChatModel.builder()
    .baseUrl("http://langchain4j.dev/demo/openai/v1")
    .apiKey("demo")
    .modelName("gpt-4o-mini")
    .build();
```
</details>

设置好 key 之后，下面创建一个 `OpenAiChatModel` 实例：
```java
OpenAiChatModel model = OpenAiChatModel.builder()
    .apiKey(apiKey)
    .modelName("gpt-4o-mini")
    .build();
```
现在，就可以开始聊天了：
```java
String answer = model.chat("Say 'Hello World'");
System.out.println(answer); // Hello World
```
