---
sidebar_position: 30
---

# 日志

LangChain4j 使用 [SLF4J](https://www.slf4j.org/) 作为日志门面，
因此你可以按自己的偏好接入任意日志后端，
例如 [Logback](https://logback.qos.ch/) 或 [Log4j](https://logging.apache.org/log4j/2.x/index.html)。

## 纯 Java

在创建模型实例时，可以通过设置 `.logRequests(true)` 和 `.logResponses(true)`，
启用对每次发给 LLM 的请求与响应的日志记录：
```java
OpenAiChatModel.builder()
    ...
    .logRequests(true)
    .logResponses(true)
    .build();
```

请确保你的依赖中包含某个 SLF4J 日志后端，例如 Logback：
```xml
<dependency>
    <groupId>ch.qos.logback</groupId>
    <artifactId>logback-classic</artifactId>
    <version>1.5.8</version>
</dependency>
```

## Quarkus 集成 {#quarkus}

当使用 [Quarkus 集成](/tutorials/quarkus-integration) 时，
日志通过 `application.properties` 文件配置：

```properties
...
quarkus.langchain4j.openai.chat-model.log-requests = true
quarkus.langchain4j.openai.chat-model.log-responses = true
quarkus.log.console.enable = true
quarkus.log.file.enable = false
```

当应用以 dev mode（`mvn quarkus:dev`）运行时，
这些属性也可以在 Quarkus Dev UI 中设置和修改。
届时 Dev UI 可通过 `http://localhost:8080/q/dev-ui` 访问。

## Spring Boot 集成 {#spring-boot}

当使用 [Spring Boot 集成](/tutorials/spring-boot-integration) 时，
日志同样通过 `application.properties` 文件配置：

```properties
...
langchain4j.open-ai.chat-model.log-requests = true
langchain4j.open-ai.chat-model.log-responses = true
logging.level.dev.langchain4j = DEBUG
```
