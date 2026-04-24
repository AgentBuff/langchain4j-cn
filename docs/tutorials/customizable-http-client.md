---
sidebar_position: 33
---

# 可定制 HTTP 客户端

LangChain4j 的部分模块（当前为 OpenAI 和 Ollama）
支持对调用 LLM provider API 时使用的 HTTP client 进行定制。

`langchain4j-http-client` 模块实现了一个 `HttpClient` SPI，
受支持的模块会通过它调用 LLM provider 的 REST API。
这意味着底层 HTTP client 可以被自定义，
并且你也可以通过实现 `HttpClient` SPI 来接入其他任意 HTTP client。

当前开箱即用的实现包括：
- 来自 `langchain4j-http-client-jdk` 模块的 `JdkHttpClient`。
  当使用受支持模块（例如 `langchain4j-open-ai`）时，它默认会被使用。
- 来自 `langchain4j-http-client-spring-restclient` / `langchain4j-http-client-spring-boot4-restclient` 模块的 `SpringRestClient`。
  当使用受支持模块的 Spring Boot starter
  （例如 `langchain4j-open-ai-spring-boot-starter` / `langchain4j-open-ai-spring-boot4-starter`）时，它默认会被使用。
- 来自 `langchain4j-http-client-apache` 模块的 `ApacheHttpClient`。
- 来自 `langchain4j-http-client-okhttp` 模块的 `OkHttpClient`。

## 定制 JDK 的 `HttpClient`

```java
HttpClient.Builder httpClientBuilder = HttpClient.newBuilder()
        .sslContext(...);

JdkHttpClientBuilder jdkHttpClientBuilder = JdkHttpClient.builder()
        .httpClientBuilder(httpClientBuilder);

OpenAiChatModel model = OpenAiChatModel.builder()
        .httpClientBuilder(jdkHttpClientBuilder)
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .build();
```

## 定制 Spring 的 `RestClient`

```java
RestClient.Builder restClientBuilder = RestClient.builder()
        .requestFactory(new HttpComponentsClientHttpRequestFactory());

SpringRestClientBuilder springRestClientBuilder = SpringRestClient.builder()
        .restClientBuilder(restClientBuilder)
        .streamingRequestExecutor(new VirtualThreadTaskExecutor());

OpenAiChatModel model = OpenAiChatModel.builder()
        .httpClientBuilder(springRestClientBuilder)
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .build();
```

## 定制 Apache 的 `HttpClient`

```java
org.apache.hc.client5.http.impl.classic.HttpClientBuilder httpClientBuilder = org.apache.hc.client5.http.impl.classic.HttpClientBuilder.create();

ApacheHttpClientBuilder apacheHttpClientBuilder = ApacheHttpClient.builder()
        .httpClientBuilder(httpClientBuilder);

OpenAiChatModel model = OpenAiChatModel.builder()
        .httpClientBuilder(apacheHttpClientBuilder)
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .build();
```
