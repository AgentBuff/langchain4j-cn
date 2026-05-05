---
title: OpenAI 兼容语言模型
sidebar_position: 17
---

# OpenAI 兼容语言模型

许多服务和工具都公开了与 OpenAI 兼容的 API。在 LangChain4j 中使用它们的通用方法如下：

1.  **确定基础 URL：** 找到服务的 API 端点，通常以 `/v1` 结尾。
2.  **获取 API Key：** 如果服务需要身份验证，请获取 API Key。如果服务在本地运行且不需要 Key，可在 `apiKey` 参数中填写占位符。
3.  **指定模型名称：** 确定服务所使用的正确模型名称（通常是必填项）。
4.  **配置 `OpenAiChatModel` 或 `OpenAiStreamingChatModel`：**

    ```java
    ChatModel model = OpenAiChatModel.builder()
            .baseUrl("YOUR_API_BASE_URL") // 例如 "http://localhost:8000/v1"
            .apiKey("YOUR_API_KEY_OR_PLACEHOLDER") // 例如 "sk-yourkey" 或 "none"
            .modelName("MODEL_NAME_AS_PER_PROVIDER_DOCS") // 例如 "gpt-3.5-turbo" 或自定义名称
            // 根据需要添加其他配置，如 temperature、timeout 等
            .logRequests(true)
            .logResponses(true)
            .build();
    ```

### 特定 OpenAI 兼容 API 的配置

某些 OpenAI 兼容 API 在流式响应（尤其是工具调用）方面可能存在差异。LangChain4j 提供了相应的配置选项来处理这些差异：

#### `accumulateToolCallId`（用于 `OpenAiStreamingChatModel`）

控制流式响应中工具调用 ID 的处理方式，默认为 `true`。

- **启用（`true`）**：跨流式块累积工具调用 ID（标准 OpenAI 行为）
    - 示例：块 1 发送 "abc"，块 2 发送 "def" → 最终 ID："abcdef"
- **禁用（`false`）**：每个块的工具调用 ID 替换前一个
    - 示例：块 1 发送 "abc"，块 2 发送 "abc" → 最终 ID："abc"
    - 适用于 DeepSeek、Qwen 等在每个块中都发送完整工具调用 ID 的 API

```java
StreamingChatModel model = OpenAiStreamingChatModel.builder()
        .baseUrl("https://api.deepseek.com/v1") // 或其他提供商
        .apiKey("YOUR_API_KEY")
        .modelName("deepseek-chat")
        .accumulateToolCallId(false) // 对于 DeepSeek、Qwen 等设置为 false
        .build();
```
以下提供了 Groq、Docker Model Runner、GPT4All、Ollama 和 LM Studio 等热门 OpenAI 兼容 API 的具体示例。

### 目录：
- [使用 OpenAI 兼容语言模型的前提条件](#prerequisites-for-using-openai-compatible-language-models)
- [Groq](#groq)
- [Docker Model Runner](#docker-model-runner)
- [GPT4All](#gpt4all)
- [Ollama](#ollama)
- [LM Studio](#lm-studio)

## 使用 OpenAI 兼容语言模型的前提条件 {#prerequisites-for-using-openai-compatible-language-models}

LangChain4j 的 OpenAI 模块可与各种 OpenAI 兼容 API 配合使用，包括本地和云端方案。以下每种模型都展示了如何创建 `ChatModel`，随后可以像[标准 OpenAI 示例](https://github.com/langchain4j/langchain4j-examples/blob/main/open-ai-examples/src/main/java/OpenAiChatModelExamples.java)一样与模型对话。

首先，请确保在 `pom.xml` 或 Gradle 构建文件中引入 OpenAI 模块：

### 纯 Java
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
    <version>1.13.0</version>
</dependency>
```

### Spring Boot
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai-spring-boot-starter</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## Groq

**部署方式：** SaaS（需要 Key）

**简介：** Groq 为大型语言模型提供极快的推理速度。

**配置步骤：**
要使用 Groq，需要从 [GroqCloud](https://console.groq.com/keys) 获取 API Key。

配置 LangChain4j 的 `OpenAiChatModel` 或 `OpenAiStreamingChatModel`：
```java
ChatModel model = OpenAiChatModel.builder()
        .baseUrl("https://api.groq.com/openai/v1")
        .apiKey(System.getenv("GROQ_API_KEY")) // 或实际的 Key
        .modelName("llama3-8b-8192") // 或 Groq 提供的其他模型，如 mixtral-8x7b-32768、llama3-70b-8192
        .temperature(0.0)
        .build();
```
可在 [Groq 模型页面](https://console.groq.com/docs/models)查找可用的模型名称。

## Docker Model Runner

**部署方式：** 本地

**简介：** Docker Model Runner 允许使用 Docker Desktop 在本地运行 LLM（底层使用 `llama.cpp`，可利用 CPU）。适合开发、测试或离线使用，支持 Mac 和 Windows。

**配置步骤：**

1. 安装 Docker Desktop
2. 在 Docker Desktop 中启用 Docker Model Runner 功能（设置 > 实验性功能 > 启用 Docker Model Runner）
3. 在该选项下方勾选"启用主机端 TCP 支持"。
4. 使用 Docker Model Runner CLI 拉取模型，例如 `docker model pull ai/qwen3` 或[此列表](https://hub.docker.com/u/ai)中的任意模型。

`ai/qwen3` 示例（更多信息见[模型页面](https://hub.docker.com/r/ai/qwen3)）：

```java
ChatModel model = OpenAiChatModel.builder()
        .baseUrl("http://localhost:12434/engines/llama.cpp/v1")
        .modelName("ai/qwen3")
        .build();
```
部分模型支持工具调用，详情见 Docker 模型页面。

## GPT4All

**部署方式：** 本地

**简介：** GPT4All 提供桌面应用，可在本机运行开源 LLM，并能公开 OpenAI 兼容 API。

**配置步骤：**
1. 从 [https://gpt4all.io/](https://gpt4all.io/) 下载并安装 GPT4All。
2. 启动 GPT4All 并通过 UI 下载所需模型，例如 `llama-3.2-1b-instruct`。
3. 在 GPT4All 设置中启用 "Web Server" 模式（"设置" > "应用程序" > 高级选项下："启用本地 API 服务器"）。
4. 记录 GPT4All 中显示的 IP 地址和端口（通常为 `http://localhost:4891/v1`）。
5. 配置 LangChain4j：
```java
ChatModel model = OpenAiChatModel.builder()
        .baseUrl("http://localhost:4891/v1")
        .modelName("llama-3.2-1b-instruct") // 模型名称可能来自 GPT4All UI 中加载的模型，详见 GPT4All 文档
        .build();
```

## Ollama

虽然 LangChain4j 有专用的 `langchain4j-ollama` 模块（见 [Ollama 文档](./ollama.md)），
也可以使用 OpenAI 模块连接 Ollama 的 OpenAI 兼容端点，如上所示。

**部署方式：** 本地

**简介：** Ollama 允许在本地运行 Llama 3、Mistral 等开源大型语言模型，并提供 OpenAI 兼容的 API 端点。

**配置步骤：**
1. 从 [https://ollama.ai/](https://ollama.ai/) 安装 Ollama。
2. 使用命令行拉取模型：`ollama pull <model_name>`（例如 `ollama pull gemma3`）。
3. 确保 Ollama 正在运行，它会在 `http://localhost:11434/v1/` 提供 OpenAI 兼容 API。
4. 配置 LangChain4j：
```java
ChatModel model = OpenAiChatModel.builder()
        .baseUrl("http://localhost:11434/v1/")
        .modelName("gemma3")
        .build();
```

**示例：**
*   OpenAI 兼容端点用法，可参考通用 OpenAI 示例进行调整。
*   使用专用 Ollama 模块：[langchain4j-examples/.../OllamaChatModelExamples.java](https://github.com/langchain4j/langchain4j-examples/blob/main/src/main/java/dev/langchain4j/model/ollama/OllamaChatModelExamples.java)


## LM Studio

**部署方式：** 本地

**简介：** LM Studio 提供 UI 用于发现、下载和运行本地 LLM，同时提供 OpenAI 兼容的本地服务器。

**配置步骤：**
1. 从 [https://lmstudio.ai/](https://lmstudio.ai/) 下载并安装 LM Studio。
2. 通过 LM Studio UI（搜索选项卡）下载所需模型，例如 `smollm2-135m-instruct`。
3. 进入"Developer"选项卡（左侧 `>_` 图标），将服务器状态切换为"运行中"。
4. 服务器运行时，右上角会显示地址（例如 `http://127.0.0.1:1234`），也可从 cURL 命令中获取完整 URL。
5. LM Studio 目前不支持 HTTP2，因此需要强制使用 HTTP1.1。为此需要添加正确的 Maven 或 Gradle 依赖：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-http-client-jdk</artifactId>
    <version>1.13.0</version>
</dependency>
```
6. 配置 LangChain4j 并指定 `httpClientBuilder`：
```java
import java.net.http.HttpClient;
import dev.langchain4j.http.client.jdk.JdkHttpClientBuilder;
import dev.langchain4j.http.client.jdk.JdkHttpClient;

...

HttpClient.Builder httpClientBuilder = HttpClient.newBuilder()
        .version(HttpClient.Version.HTTP_1_1) ;

JdkHttpClientBuilder jdkHttpClientBuilder = JdkHttpClient.builder()
        .httpClientBuilder(httpClientBuilder);

ChatModel model = OpenAiChatModel.builder()
        .baseUrl("http://127.0.0.1:1234/v1")
        .modelName("smollm2-135m-instruct")
        .httpClientBuilder(jdkHttpClientBuilder)
        .build();
```
