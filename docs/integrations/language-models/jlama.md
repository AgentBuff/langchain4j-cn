---
sidebar_position: 11
---

# Jlama
[Jlama 项目](https://github.com/tjake/Jlama)

## 项目配置

在 Maven 项目的 `pom.xml` 中添加以下依赖：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>1.13.0</version>
</dependency>

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-jlama</artifactId>
    <version>1.13.0-beta23</version>
</dependency>

<dependency>
    <groupId>com.github.tjake</groupId>
    <artifactId>jlama-native</artifactId>
    <!-- 用于更快的推理，支持 linux-x86_64、macos-x86_64/aarch_64、windows-x86_64
       使用 https://github.com/trustin/os-maven-plugin 检测操作系统和架构 -->
    <classifier>${os.detected.name}-${os.detected.arch}</classifier>
    <version>${jlama.version}</version> <!-- 版本来自 langchain4j-jlama pom -->
</dependency>

```

在 Gradle 项目的 `build.gradle` 中：

```groovy
implementation 'dev.langchain4j:langchain4j:1.13.0'
implementation 'dev.langchain4j:langchain4j-jlama:1.13.0-beta23'
```

Jlama 使用 Java 21 预览特性。可通过以下方式全局启用：

`export JDK_JAVA_OPTIONS="--add-modules jdk.incubator.vector --enable-preview"`

或通过配置 Maven 编译器和 failsafe 插件来启用预览特性。


### 模型选择
您可以使用 [HuggingFace](https://huggingface.co/models?library=safetensors&sort=trending) 上的大多数 safetensor 模型，并以 `owner/model-name` 格式指定。
Jlama 在 http://huggingface.co/tjake 维护了一份预量化的热门模型列表。

支持以下架构的模型：
- Gemma 模型
- Llama 模型
- Mistral 模型
- Mixtral 模型
- GPT-2 模型
- BERT 模型

## 对话补全
对话模型使用经过对话数据微调的模型生成类人回复。

### 同步模式
创建一个类并添加以下代码：

```java
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.jlama.JlamaChatModel;

public class HelloWorld {
    public static void main(String[] args) {
        ChatModel model = JlamaChatModel.builder()
                .modelName("tjake/TinyLlama-1.1B-Chat-v1.0-Jlama-Q4")
                .build();

        String response = model.chat("Say 'Hello World'");
        System.out.println(response);
    }
}
```
运行程序将生成类似如下的输出：

```plaintext
Hello World! How can I assist you today?
```

### 流式模式
创建一个类并添加以下代码：

```java
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import dev.langchain4j.model.jlama.JlamaStreamingChatModel;
import dev.langchain4j.model.output.Response;

import java.util.concurrent.CompletableFuture;

public class HelloWorld {
    public static void main(String[] args) {
        StreamingChatModel model = JlamaStreamingChatModel.builder()
                .modelName("tjake/TinyLlama-1.1B-Chat-v1.0-Jlama-Q4")
                .build();

        CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();         
        model.chat("Tell me a joke about Java", new StreamingChatResponseHandler() {

            @Override
            public void onPartialResponse(String partialResponse) {
                System.out.print(partialResponse);
            }

            @Override
            public void onCompleteResponse(ChatResponse completeResponse) {
                futureResponse.complete(completeResponse);
            }

            @Override
            public void onError(Throwable error) {
                futureResponse.completeExceptionally(error);
            }    
        });

        futureResponse.join();
    }
}
```
每个由 LLM 生成的文本块（token）都会通过 `onPartialResponse` 方法实时接收。

可以看到以下输出是实时流式传输的：

```plaintext
"Why do Java developers wear glasses? Because they can't C#"
```

当然，您可以将 Jlama 对话补全与其他功能结合使用，例如[设置模型参数](/tutorials/model-parameters)和[对话记忆](/tutorials/chat-memory)，以获得更精确的回复。

在[对话记忆](/tutorials/chat-memory)中，您将学习如何传递对话历史，以便 LLM 了解之前的内容。如果不传递历史（如本简单示例），LLM 将无法正确回答后续问题（如"我刚才问了什么？"）。

后台设置了许多参数，例如超时时间、模型类型和模型参数。
在[设置模型参数](/tutorials/model-parameters)中，您将学习如何显式设置这些参数。


Jlama 有一些特殊的模型参数可供设置：

 - `modelCachePath` 参数：指定模型下载后的缓存目录路径，默认为 `~/.jlama`。
 - `workingDirectory` 参数：为指定模型实例在磁盘上保留持久化对话记忆，比使用 Chat Memory 速度更快。
 - `quantizeModelAtRuntime` 参数：在运行时对模型进行量化，当前量化格式始终为 Q4。也可以使用 jlama 工具预先量化模型（详见 [Jlama 项目](https://github.com/tjake/jlama)）。

### 函数调用
Jlama 支持对支持函数调用的模型（Mistral、Llama-3.1 等）进行函数调用。
参见 [Jlama 示例](https://github.com/langchain4j/langchain4j-examples/tree/main/jlama-examples)

### JSON 模式
Jlama 暂不支持 JSON 模式，但可以在提示词中礼貌地要求模型返回 JSON。

## 示例

- [Jlama 示例](https://github.com/langchain4j/langchain4j-examples/tree/main/jlama-examples)
