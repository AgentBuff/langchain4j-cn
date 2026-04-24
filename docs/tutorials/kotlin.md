---
sidebar_position: 29
---

# Kotlin 支持

[Kotlin](https://kotlinlang.org) 是一种面向 JVM（以及其他平台）的静态类型语言，
它以简洁、优雅的语法以及与 Java 库的无缝[互操作性](https://kotlinlang.org/docs/reference/java-interop.html)而著称。
LangChain4j 通过 Kotlin [extensions](https://kotlinlang.org/docs/extensions.html)
和 [type-safe builders](https://kotlinlang.org/docs/type-safe-builders.html)，
为 Java API 增加了 Kotlin 专属的便利能力。
这使得用户可以为现有 Java 类扩展出更适合 Kotlin 的附加功能。
    
## 快速开始

将 `langchain4j-kotlin` 模块加入项目依赖：
```xml
 <dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-kotlin</artifactId>
    <version>[LATEST_VERSION]</version>
</dependency>
```

如果你希望使用 data class，请确保 classpath 中包含 [Jackson module kotlin](https://github.com/FasterXML/jackson-module-kotlin)。
对于 Maven，可以添加如下 runtime 依赖：

```xml
 <dependency>
    <groupId>com.fasterxml.jackson.module</groupId>
    <artifactId>jackson-module-kotlin</artifactId>
    <version>[LATEST_VERSION]</version>
    <scope>runtime</scope>
</dependency>
```

## ChatModel 扩展

下面这段 Kotlin 代码演示了如何利用 [coroutines and suspend functions](https://kotlinlang.org/docs/coroutines-basics.html)
以及 [type-safe builders](https://kotlinlang.org/docs/type-safe-builders.html)
来与 LangChain4j 中的 [`ChatModel`](https://docs.langchain4j.dev/tutorials/chat-and-language-models) 交互。

```kotlin
val model = OpenAiChatModel.builder()
    .apiKey("YOUR_API_KEY")
    // more configuration parameters here ...
    .build()

CoroutineScope(Dispatchers.IO).launch {
    val response = model.chat {
        messages += systemMessage("You are a helpful assistant")
        messages += userMessage("Hello!")
        parameters {
            temperature = 0.7
        }
    }
    println(response.aiMessage().text())
}
```

整个交互通过 Kotlin 的 **coroutines** 异步完成：
- `CoroutineScope(Dispatchers.IO).launch`：在 [IO dispatcher](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/-i-o.html) 上执行流程，它适合网络或文件 I/O 这类阻塞任务。这样可以避免阻塞调用线程，从而保持系统响应性。
- `model.chat` 是一个 suspend function，它通过 builder block 来组织 chat request。这样的写法可以减少样板代码，并使代码更易读、更易维护。

在更高级的场景下，如果要支持自定义 `ChatRequestParameters`，
这个 type-safe builder 函数也可以接受自定义 builder：
```kotlin
fun <B : DefaultChatRequestParameters.Builder<*>> parameters(
    builder: B = DefaultChatRequestParameters.builder() as B,
    configurer: ChatRequestParametersBuilder<B>.() -> Unit
)
```
使用示例：
```kotlin
 model.chat {
    messages += systemMessage("You are a helpful assistant")
    messages += userMessage("Hello!")
    parameters(OpenAiChatRequestParameters.builder()) {
        temperature = 0.7 // DefaultChatRequestParameters.Builder property
        builder.seed(42) // OpenAiChatRequestParameters.Builder property
    }
}
```

## 流式场景

`StreamingChatModel` 扩展适用于那些需要随着 AI 模型生成过程逐步处理响应的场景。
这类能力对于需要实时反馈的应用尤其有用，
例如聊天界面、实时编辑器，或需要 token-by-token 流式交互的系统。
借助 Kotlin coroutines，`chatFlow` 扩展函数可以把语言模型的流式响应转换成结构化、可取消的 `Flow` 序列，
从而实现更符合协程风格的非阻塞处理。


下面是一个使用 `chatFlow` 的完整交互示例：
```kotlin
val flow = model.chatFlow { // similar to non-streaming scenario
    messages += userMessage("Can you explain how streaming works?")
    parameters { // ChatRequestParameters
        temperature = 0.7
        maxOutputTokens = 42
    }
}

runBlocking { // must run in a coroutine context 
    flow.collect { reply ->
        when (reply) {
            is StreamingChatModelReply.PartialResponse -> {
                print(reply.partialResponse) // Stream output as it arrives
            }
            is StreamingChatModelReply.CompleteResponse -> {
                println("\nComplete: ${reply.response.aiMessage().text()}")
            }
            is StreamingChatModelReply.Error -> {
                println("Error occurred: ${reply.cause.message}")
            }
        }
    }
}
```

可以参考[这个测试](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-kotlin/src/test/kotlin/dev/langchain4j/kotlin/model/chat/StreamingChatModelExtensionsKtTest.kt)作为示例。

## 编译器兼容性

当你在 Kotlin 中定义 tools 时，
请确保 Kotlin 编译配置中启用了 [`javaParameters`](https://kotlinlang.org/docs/gradle-compiler-options.html#attributes-specific-to-jvm)，
以便为 Java 反射保留方法参数的元数据。
这个设置对于在 tool specification 中保留正确参数名是必要的。

如果你使用 Gradle，可以通过如下配置实现：
```kotlin
kotlin {
    compilerOptions {
        javaParameters = true
    }
}
```
