---
sidebar_position: 12
toc_max_heading_level: 5
---

import useBaseUrl from '@docusaurus/useBaseUrl';
import ThemedImage from '@theme/ThemedImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 护栏

:::note
Guardrails 是一项实验性功能。它的 API 和行为在未来版本中可能会发生变化。
:::

Guardrails 是一类机制，允许你验证 LLM 的输入和输出是否符合预期。
借助 guardrails，你可以做下面这些事情：
- 验证用户输入没有超出作用域
- 在调用 LLM 之前确保输入满足某些条件（例如防御 [prompt injection attack](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)）
- 确保输出格式正确（例如它是一个具有正确 schema 的 JSON 文档）
- 确保 LLM 输出符合业务规则和约束（例如，如果这是公司 X 的 chatbot，响应中不应该提到竞争对手 Y）
- 检测 hallucinations

这些都只是例子。你还可以用 guardrails 做很多其他事情。

:::note
Guardrails 仅在使用 [AI Services](/tutorials/ai-services) 时可用。
它属于更高层的抽象，不能直接应用到 `ChatModel` 或 `StreamingChatModel` 上。
:::

<ThemedImage
  alt="Guardrails"
  sources={{
    light: useBaseUrl('/img/guardrails-light-bg.png'),
    dark: useBaseUrl('/img/guardrails-dark-bg.png'),
  }}
/>

该实现最初来自 [Quarkus LangChain4j extension](https://docs.quarkiverse.io/quarkus-langchain4j/dev/)，后续被移植回了这里。

## 实现 Guardrails

理想情况下，guardrail 的实现应遵循[单一职责原则](https://en.wikipedia.org/wiki/Single-responsibility_principle)，
也就是说，每个 guardrail 类只验证一件事。
然后，把多个 guardrail 串联起来，以同时防护多类问题。

guardrail 链中的顺序非常重要。
链中第一个失败的 guardrail 会触发整体失败。
应当把最容易拦截失败场景的 guardrail 放在前面，
而把那些更具体、但很少失败的 guardrail 放在后面。

还要注意，guardrail 自身也可能调用其他服务，
甚至触发其他 LLM 交互。
如果这类 guardrail 带来执行开销或金钱成本，
请确保在设计时考虑进去。
你可能会希望把更昂贵的 guardrail 放到链路后面。

:::note
这里的 _expensive_ 既可能表示执行耗时，也可能表示需要额外付费。
:::

## 输入 Guardrails {#input-guardrails}

输入 guardrail 会在调用 LLM 之前执行。
输入 guardrail 一旦失败，就会阻止 LLM 被调用。
输入 guardrail 是调用 LLM 之前的最后一步。
它们会在所有 [RAG](/tutorials/rag) 操作完成之后才执行。

### 实现输入 Guardrails

输入 guardrail 通过实现 [`InputGuardrail`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/InputGuardrail.java)
接口来完成。
`InputGuardrail` 接口提供了 `validate` 方法的两个变体，至少需要实现其中一个：

```java
InputGuardrailResult validate(UserMessage userMessage);
InputGuardrailResult validate(InputGuardrailRequest params);
```

第一种变体适用于简单 guardrail，
或只需要访问 [`UserMessage`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/data/message/UserMessage.java)
的场景。

第二种变体适用于更复杂的 guardrail，
它需要更多信息，例如 chat memory / history、user message template、augmentation results，
或传给模板的 variables。
更多说明请参见 [`InputGuardrailRequest`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/InputGuardrailRequest.java)。

下面是一些你可以做的事情示例：
- 检查 augmentation results 中是否有足够多的文档
- 确保用户没有多次重复提问同一个问题
- 缓解潜在的 prompt injection attack
- 使用社区版 [Prompt Repetition](/integrations/prompt-repetition/) 模块，重写符合条件的单文本输入

无论操作是同步的还是异步 / 流式的，输入 guardrail 都可以使用。

### 输入 Guardrail 的结果

输入 guardrail 可能产生以下几类结果。
`InputGuardrail` 接口上提供了辅助方法来构造这些结果：

| Outcome                             | Helper method on `InputGuardrail`                 | Description                                                                                                                                                                |
|:------------------------------------|:--------------------------------------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **_success_**                       | `success()`                                       | - 输入有效。<br/> - 链中的下一个 guardrail 会继续执行。<br/> - 如果最后一个 guardrail 也通过，则会调用 LLM。                                           |
| **_success with alternate result_** | `successWith(String)`                             | 与 **_success_** 类似，不同之处在于继续进入下一步（链中的下一个 guardrail 或调用 LLM）前，用户消息会先被改写。                           |
| **_failure_**                       | `failure(String)` or `failure(String, Throwable)` | - 输入无效，但链中的后续 guardrail 仍会继续按顺序执行，以尽可能收集全部验证问题。<br/> - 不会调用 LLM。<br/> - 如果传入了 `Throwable`，调用方可以捕获 `InputGuardrailException` 并检查其中的 `cause`；它就是这里传入的 `Throwable`。 |
| **_fatal_**                         | `fatal(String)` or `fatal(String, Throwable)`     | - 输入无效，并会通过抛出 `InputGuardrailException` 立即终止执行。<br/> - 不会调用 LLM。<br/> - 如果传入了 `Throwable`，调用方可以捕获 `InputGuardrailException` 并检查其中的 `cause`；它就是这里传入的 `Throwable`。                                                        |

### 声明输入 Guardrails

声明输入 guardrail 有多种方式，下面按优先级从高到低列出：
1. 直接在 [`AiServices`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/AiServices.java) builder 上设置的 [`InputGuardrail`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/InputGuardrail.java) 实现类名或实例。
2. 放在单个 [AI Service](/tutorials/ai-services) 方法上的 [`@InputGuardrails` 注解](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/InputGuardrails.java)。
3. 放在 [AI Service](/tutorials/ai-services) 类上的 [`@InputGuardrails` 注解](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/InputGuardrails.java)。

无论以哪种方式声明，输入 guardrail 总是按照列表中出现的顺序执行。

#### `AiServices` builder

直接设置在 [`AiServices`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/AiServices.java) builder 上的
[`InputGuardrail`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/InputGuardrail.java)
实现类名或实例具有最高优先级，
也就是说，如果其他地方也声明了，最终会以 builder 上的声明为准。

```java
public interface Assistant {
    String chat(String question);
    String doSomethingElse(String question);
}

var assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .inputGuardrailClasses(FirstInputGuardrail.class, SecondInputGuardrail.class)
    .build();
```

或

```java
public interface Assistant {
    String chat(String question);
    String doSomethingElse(String question);
}

var assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .inputGuardrails(new FirstInputGuardrail(), new SecondInputGuardrail())
    .build();
```

:::info
如果你需要一个现成的实验性输入 guardrail，用于通过 prompt repetition 重写符合条件的单文本输入，
请查看社区版 [Prompt Repetition](/integrations/prompt-repetition/) 模块。
:::

在第一种场景中，传入的是实现了 `InputGuardrail` 的类。
这些类的新实例会通过反射动态创建。

:::info
类到实例的转换方式是可以自定义的。
例如，使用依赖注入的框架（如 [Quarkus](https://quarkus.io) 或 [Spring](https://spring.io)）
就可以利用[扩展点](#extension-points)，根据它们自己的实例管理方式来提供实例，
而不是每次都通过反射创建新实例。
:::

#### 单个 AI Service 方法上的注解

放在单个 [AI Service](/tutorials/ai-services) 方法上的
[`@InputGuardrails` 注解](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/InputGuardrails.java)
具有次高优先级。

```java
public interface Assistant {
    @InputGuardrails({ FirstInputGuardrail.class, SecondInputGuardrail.class })
    String chat(String question);
    
    String doSomethingElse(String question);
}

var assistant = AiServices.create(Assistant.class, chatModel);
```

在这个例子中，只有 `chat` 方法带有 guardrails。
- 在 `chat` 方法上，会先调用 `FirstInputGuardrail`。
- 只有它成功时，才会调用 LLM。
- 只有当 `FirstInputGuardrail` 没有产生 **_fatal_** 结果时，才会继续调用 `SecondInputGuardrail`。
- `FirstInputGuardrail` 或 `SecondInputGuardrail` 都可能改写用户消息。
- 如果 `FirstInputGuardrail` 改写了用户消息，那么 `SecondInputGuardrail` 收到的输入将是新的用户消息。

`doSomethingElse` 方法不带任何 guardrails。

#### AI Service 类上的注解

放在 [AI Service](/tutorials/ai-services) 类上的
[`@InputGuardrails` 注解](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/InputGuardrails.java)
优先级最低。

```java
@InputGuardrails({ FirstInputGuardrail.class, SecondInputGuardrail.class })
public interface Assistant {
    String chat(String question);
    String doSomethingElse(String question);
}

var assistant = AiServices.create(Assistant.class, chatModel);
```

在这个例子中，`chat` 和 `doSomethingElse` 两个方法都带有这些 guardrails。
- 和前一个例子一样，会先调用 `FirstInputGuardrail`。
- 只有它成功时，才会调用 LLM。
- 只有当 `FirstInputGuardrail` 没有产生 **_fatal_** 结果时，才会继续调用 `SecondInputGuardrail`。
- `FirstInputGuardrail` 或 `SecondInputGuardrail` 都可能改写用户消息。
- 如果 `FirstInputGuardrail` 改写了用户消息，那么 `SecondInputGuardrail` 收到的输入将是新的用户消息。

### 输入 Guardrails 的单元测试

`langchain4j-test` 模块中提供了一些基于 [AssertJ](https://assertj.github.io/doc/) 的单元测试工具。

<Tabs>
  <TabItem value="maven" label="Maven" default>
    ```xml
    <dependency>
      <groupId>dev.langchain4j</groupId>
      <artifactId>langchain4j-test</artifactId>
      <scope>test</scope>
    </dependency>
    ```
  </TabItem>
  <TabItem value="gradleGroovy" label="Gradle (Groovy)">
    ```groovy
    testImplementation 'dev.langchain4j:langchain4j-test'
    ```
  </TabItem>
  <TabItem value="gradleKotlin" label="Gradle (Kotlin)">
    ```kotlin
    testImplementation("dev.langchain4j:langchain4j-test")
    ```
  </TabItem>
</Tabs>

引入这个依赖后，你就可以执行下面这类校验：

```java
import static dev.langchain4j.test.guardrail.GuardrailAssertions.assertThat;

import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.guardrail.GuardrailResult.Result;

class Tests { 
    MyInputGuardrail inputGuardrail = new MyInputGuardrail();
    
    @Test 
    void test() {
        var userMessage = UserMessage.from("Some user message");
        var result = inputGuardrail.validate(userMessage);
        
        // 这里只是演示你可以做的一些断言
        assertThat(result)
                .isSuccessful()
                .hasResult(Result.FATAL)
                .hasFailures()
                .hasSingleFailureWithMessage("Prompt injection detected")
                .assertSingleFailureSatisfied(failure -> assertThat(failure)...)
                .withFailures().....
    }
}
```

:::info
更多细节请参见 [`GuardrailAssertions`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-test/src/main/java/dev/langchain4j/test/guardrail/GuardrailAssertions.java)
和 [`InputGuardrailResultAssert`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-test/src/main/java/dev/langchain4j/test/guardrail/InputGuardrailResultAssert.java)
这两个类。
:::

### 开箱即用的输入 Guardrails

对于若干常见用例，LangChain4j 已经提供了输入 guardrail 的实现：

| Guardrail class                                                                                                                                                                              | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`MessageModeratorInputGuardrail`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-guardrails/src/main/java/dev/langchain4j/guardrails/MessageModeratorInputGuardrail.java) | 一个输入 guardrail，它使用 [`ModerationModel`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/model/moderation/ModerationModel.java) 验证用户消息，以检测潜在的有害、不当或违反策略的内容。<br/> - 会检查输入消息中是否存在仇恨言论、暴力、自残、色情内容，或 moderation model 定义的其他类别。<br/> - 如果消息被标记，则会以 fatal 结果结束验证，从而阻止该消息继续被处理。<br/> - 适合在把用户输入发送给 LLM 之前，先确保其符合内容策略。 |

## 输出 Guardrails {#output-guardrails}

输出 guardrail 会在 LLM 生成输出之后执行。
输出 guardrail 失败时，可以支持更高级的场景，
例如[重试](#retry)或[重新提示](#reprompt)，从而帮助提升响应质量。
它们会在所有其他操作都完成之后才执行，
包括 function / tool calls。

### 实现输出 Guardrails

与输入 guardrail 类似，输出 guardrail 通过实现
[`OutputGuardrail`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/OutputGuardrail.java)
接口来完成。
`OutputGuardrail` 接口提供了 `validate` 方法的两个变体，至少需要实现其中一个：

```java
OutputGuardrailResult validate(AiMessage responseFromLLM);
OutputGuardrailResult validate(OutputGuardrailRequest params);
```

第一种变体适用于简单 guardrail，
或只需要访问最终 [`AiMessage`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/data/message/AiMessage.java)
的场景。

第二种变体适用于更复杂的 guardrail，
它需要更多信息，例如完整 chat response、chat memory / history、user message template，
或传给模板的 variables。
更多说明请参见 [`OutputGuardrailRequest`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/OutputGuardrailRequest.java)。

下面是一些你可以做的事情示例：
- 确保输出格式正确（例如它是一个具有正确 schema 的 JSON 文档）
- 检测 LLM 幻觉
- 验证 LLM 响应中是否包含某些信息

### 输出 Guardrail 的结果

输出 guardrail 可能产生以下几类结果。
`OutputGuardrail` 接口上提供了辅助方法来构造这些结果：

#### 重试 {#retry}

当输出 guardrail 返回 retry 结果时，会使用原始 prompt 和 chat history 再次调用 LLM。

#### 重新提示 {#reprompt}

当输出 guardrail 返回 reprompt 结果时，会追加一条新的提示消息后再次调用 LLM。

| Outcome                    | Helper method on `OutputGuardrail`                                  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
|:---------------------------|:--------------------------------------------------------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **_success_**              | `success()`                                                         | - 输出有效。<br/> - 链中的下一个 guardrail 会继续执行。如果最后一个 guardrail 通过，输出就会返回给调用方。                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **_success with rewrite_** | `successWith(String)` or `successWith(String, Object)`              | - 与 **_success_** 类似，不同之处在于输出原始形式并不合法，因此它会先被改写成合法形式。<br/> - 下一个 guardrail 会基于改写后的输出继续执行。如果最后一个 guardrail 通过，输出就会返回给调用方。                                                                                                                                                                                                                                                                                                                                                          |
| **_failure_**              | `failure(String)` or `failure(String, Throwable)`                   | - 输出无效，但链中的后续 guardrail 仍会继续按顺序执行，以尽可能收集全部验证问题。<br/> - 验证失败会以 `OutputGuardrailException` 的形式返回给用户。                                                                                                                                                                                                                                                                                                                                                                                 |
| **_fatal_**                | `fatal(String)` or `fatal(String, Throwable)`                       | 输出无效，并立即终止执行，向调用方抛出 `OutputGuardrailException`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **_fatal with retry_**     | `retry(String)` or `retry(String, Throwable)`                       | - 与 **_fatal_** 类似，不同之处在于 LLM 会使用与原始调用相同的 prompt 和 chat history 再次执行。<br/> - 如果失败在[可配置的重试次数](#configuration)耗尽后仍然存在，执行会终止，并向调用方抛出 `OutputGuardrailException`。<br/> - 如果某次重试后 guardrail 通过，则整个 guardrail 链会从头重新执行。                                                                                                                                                                                                        |
| **_fatal with reprompt_**  | `reprompt(String, String)` or `reprompt(String, Throwable, String)` | - 与 **_fatal with retry_** 类似，不同之处在于 LLM 会使用 guardrail 提供的新 prompt 再次调用。<br/> - 在这种情况下，guardrail 会提供一条附加消息并将其追加到之前的用户消息后，再使用新的用户消息和原始 chat history 向 LLM 发送新请求。<br/> - 如果失败在[可配置的重试次数](#configuration)耗尽后仍然存在，执行会终止，并向调用方抛出 `OutputGuardrailException`。<br/> - 如果某次 reprompt 后 guardrail 通过，则整个 guardrail 链会从头重新执行。 |

### 声明输出 Guardrails

声明输出 guardrail 有多种方式，下面按优先级从高到低列出：
1. 直接在 [`AiServices`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/AiServices.java) builder 上设置的 [`OutputGuardrail`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/OutputGuardrail.java) 实现类名或实例。
2. 放在单个 [AI Service](/tutorials/ai-services) 方法上的 [`@OutputGuardrails` 注解](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/OutputGuardrails.java)。
3. 放在 [AI Service](/tutorials/ai-services) 类上的 [`@OutputGuardrails` 注解](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/OutputGuardrails.java)。

无论以哪种方式声明，输出 guardrail 总是按照列表中出现的顺序执行。

#### `AiServices` builder

直接设置在 [`AiServices`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/AiServices.java) builder 上的
[`OutputGuardrail`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/OutputGuardrail.java)
实现类名或实例具有最高优先级，
也就是说，如果其他地方也声明了，最终会以 builder 上的声明为准。

```java
public interface Assistant {
    String chat(String question);
    String doSomethingElse(String question);
}

var assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .outputGuardrailClasses(FirstOutputGuardrail.class, SecondOutputGuardrail.class)
    .build();
```

或

```java
public interface Assistant {
    String chat(String question);
    String doSomethingElse(String question);
}

var assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .outputGuardrails(new FirstOutputGuardrail(), new SecondOutputGuardrail())
    .build();
```

在第一种场景中，传入的是实现了 `OutputGuardrail` 的类。
这些类的新实例会通过反射动态创建。

:::info
类到实例的转换方式是可以自定义的。
例如，使用依赖注入的框架（如 [Quarkus](https://quarkus.io) 或 [Spring](https://spring.io)）
就可以利用[扩展点](#extension-points)，根据它们自己的实例管理方式来提供实例，
而不是每次都通过反射创建新实例。
:::

#### 单个 AI Service 方法上的注解

放在单个 [AI Service](/tutorials/ai-services) 方法上的
[`@OutputGuardrails` 注解](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/OutputGuardrails.java)
具有次高优先级。

```java
public interface Assistant {
    @OutputGuardrails({ FirstOutputGuardrail.class, SecondOutputGuardrail.class })
    String chat(String question);
    
    String doSomethingElse(String question);
}

var assistant = AiServices.create(Assistant.class, chatModel);
```

在这个例子中，只有 `chat` 方法带有 guardrails。
- 在 `chat` 方法上，会先调用 `FirstOutputGuardrail`。
- 只有它成功时，结果才会返回给调用方。只有当 `FirstOutputGuardrail` 没有产生 **_fatal_**、**_fatal with retry_** 或 **_fatal with reprompt_** 结果时，才会继续调用 `SecondOutputGuardrail`。
- `SecondOutputGuardrail` 会接收 `FirstOutputGuardrail` 的输出作为输入。
- 如果 `SecondOutputGuardrail` 在某次 retry 或 reprompt 后成功，那么 `FirstOutputGuardrail` 和 `SecondOutputGuardrail` 都会被重新执行。

`doSomethingElse` 方法不带任何 guardrails。

#### AI Service 类上的注解

放在 [AI Service](/tutorials/ai-services) 类上的
[`@OutputGuardrails` 注解](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/OutputGuardrails.java)
优先级最低。

```java
@OutputGuardrails({ FirstOutputGuardrail.class, SecondOutputGuardrail.class })
public interface Assistant {
    String chat(String question);
    String doSomethingElse(String question);
}

var assistant = AiServices.create(Assistant.class, chatModel);
```

在这个例子中，`chat` 和 `doSomethingElse` 两个方法都带有这些 guardrails。
- 和前一个例子一样，会先调用 `FirstOutputGuardrail`。
- 只有它成功时，结果才会返回给调用方。只有当 `FirstOutputGuardrail` 没有产生 **_fatal_**、**_fatal with retry_** 或 **_fatal with reprompt_** 结果时，才会继续调用 `SecondOutputGuardrail`。
- `SecondOutputGuardrail` 会接收 `FirstOutputGuardrail` 的输出作为输入。
- 如果 `SecondOutputGuardrail` 在某次 retry 或 reprompt 后成功，那么 `FirstOutputGuardrail` 和 `SecondOutputGuardrail` 都会被重新执行。

#### 配置 {#configuration}

输出 guardrail 还支持以下附加配置：

| Configuration | Description                                                                                                                                                |
|:--------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| `maxRetries`  | - 执行 retry 或 reprompt 时，输出 guardrail 最多允许重试的次数。<br/> - 默认值为 `2`。<br/> - 设置为 `0` 可禁用重试。 |

##### 单个 AI Service 方法上的注解

```java
public interface MethodLevelAssistant {
    @OutputGuardrails(
            value = { FirstOutputGuardrail.class, SecondOutputGuardrail.class },
            maxRetries = 10
    )
    String chat(String question);
}

var assistant = AiServices.create(MethodLevelAssistant.class, chatModel);
```

##### AI Service 类上的注解

```java
@OutputGuardrails(
        value = { FirstOutputGuardrail.class, SecondOutputGuardrail.class },
        maxRetries = 10
)
public interface ClassLevelAssistant {
    String chat(String question);
}

var assistant = AiServices.create(ClassLevelAssistant.class, chatModel);
```

##### `AiServices` builder

```java
public interface Assistant {
    String chat(String message);
}

var outputGuardrailsConfig = OutputGuardrailsConfig.builder()
        .maxRetries(10)
        .build();

var assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .outputGuardrailsConfig(outputGuardrailsConfig)
        .outputGuardrailClasss(FirstOutputGuardrail.class, SecondOutputGuardrail.class)
        .build();
```

### 流式响应上的输出 Guardrails

输出 guardrail 同样适用于流式响应操作：

```java
public interface StreamingAssistant {
    @OutputGuardrails({ FirstOutputGuardrail.class, SecondOutputGuardrail.class })
    TokenStream streamingChat(String message);
}
```

在这种场景下，输出 guardrail 会在整个 stream 完成后执行；
更准确地说，是在调用 `TokenStream.onCompleteResponse` 时执行。
`onPartialResponse` 的内容会先被缓冲，
等 guardrails 成功后再重放出去。

如果链中的某次 **_retry_** 或 **_reprompt_** 最终成功，
那么整个链会被_同步地_重新执行。
每个 guardrail 都会按照原始顺序依次再次执行。
当链执行完成后，结果才会传入 `TokenStream.onCompleteResponse`。

### 开箱即用的输出 Guardrails

对于若干常见用例，LangChain4j 已经提供了输出 guardrail 的实现：

| Guardrail class                                                                                                                                                                         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`JsonExtractorOutputGuardrail`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-guardrails/src/main/java/dev/langchain4j/guardrails/JsonExtractorOutputGuardrail.java) | 一个输出 guardrail，用于检查响应能否从 JSON 成功反序列化为某个指定类型的对象。<br/> - 它使用 [Jackson ObjectMapper](https://github.com/FasterXML/jackson-databind) 尝试执行对象反序列化。<br/> - 如果响应无法被反序列化为预期对象类型，LLM 会被 reprompt。<br/> - 它既可以直接使用，也可以继承并扩展（内部有多个 `protected` 方法可被覆写，以便自定义行为）。 |

### 输出 Guardrails 的单元测试

`langchain4j-test` 模块中提供了一些基于 [AssertJ](https://assertj.github.io/doc/) 的单元测试工具。

<Tabs>
  <TabItem value="maven" label="Maven" default>
    ```xml
    <dependency>
      <groupId>dev.langchain4j</groupId>
      <artifactId>langchain4j-test</artifactId>
      <scope>test</scope>
    </dependency>
    ```
  </TabItem>
  <TabItem value="gradleGroovy" label="Gradle (Groovy)">
    ```groovy
    testImplementation 'dev.langchain4j:langchain4j-test'
    ```
  </TabItem>
  <TabItem value="gradleKotlin" label="Gradle (Kotlin)">
    ```kotlin
    testImplementation("dev.langchain4j:langchain4j-test")
    ```
  </TabItem>
</Tabs>

引入这个依赖后，你就可以执行下面这类校验：

```java
import static dev.langchain4j.test.guardrail.GuardrailAssertions.assertThat;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.guardrail.GuardrailResult.Result;

class Tests { 
    MyOutputGuardrail outputGuardrail = new MyOutputGuardrail();
    
    @Test 
    void test() {
        var aiMessage = AiMessage.from("Some output");
        var result = outputGuardrail.validate(aiMessage);
        
        // 这里只是演示你可以做的一些断言
        assertThat(result)
                .isSuccessful()
                .hasResult(Result.FATAL)
                .hasFailures()
                .hasSingleFailureWithMessage("Hallucination detected!")
                .hasSingleFailureWithMessageAndReprompt("Hallucination detected!", "Please LLM don't hallucinate!")
                .assertSingleFailureSatisfied(failure -> assertThat(failure)...)
                .withFailures().....
    }
}
```

:::info
更多细节请参见 [`GuardrailAssertions`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-test/src/main/java/dev/langchain4j/test/guardrail/GuardrailAssertions.java)
和 [`OutputGuardrailResultAssert`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-test/src/main/java/dev/langchain4j/test/guardrail/OutputGuardrailResultAssert.java)
这两个类。
:::

## 混合搭配使用

你完全可以自由组合输入 guardrail 和输出 guardrail！

```java
public class MyObjectJsonOutputGuardrail extends JsonExtractorOutputGuardrail<MyObject> {
    public MyObjectJsonOutputGuardrail() {
        super(MyObject.class);
    }
}

@InputGuardrails({ FirstInputGuardrail.class, SecondInputGuardrail.class })
@OutputGuardrails(value = SomeOutputGuardrail.class, maxRetries = 5)
public interface Assistant {
    String chat(String message);
    
    @InputGuardrails(PromptInjectionGuardrail.class)
    @OutputGuardrails(MyObjectJsonOutputGuardrail.class)
    MyObject chatAndReturnJson(String message);
}

var outputGuardrailsConfig = OutputGuardrailsConfig.builder()
        .maxRetries(10)
        .build();

var assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .inputGuardrails(new AnotherInputGuardrail())
        .outputGuardrailsConfig(outputGuardrailsConfig)
        .build();
```

在这个例子中，`Assistant` 上的所有方法都带有一个输入 guardrail，
即 `AnotherInputGuardrail`，因为它是在 `AiServices` builder 上设置的。
另外，所有输出 guardrail 的 `maxRetries` 都等于 `10`，
因为这个配置也是在 `AiServices` builder 上设置的。

`chat` 方法有一个输出 guardrail，即 `SomeOutputGuardrail`，
其 `maxRetries` 值为 `10`。

`chatAndReturnJson` 方法有一个输出 guardrail，
即 `MyObjectJsonOutputGuardrail`，其 `maxRetries` 值为 `10`。

## 扩展点 {#extension-points}

guardrail 系统在设计上是可组合的，
因此它可以被扩展，并在其他下游框架中复用
（例如 [Quarkus](https://quarkus.io) 或 [Spring Boot](https://spring.io/projects/spring-boot)）。
本节会说明部分可用的扩展点或 “hooks”。

所有这些扩展点都基于 [Java Service Provider Interface（Java SPI）](https://www.baeldung.com/java-spi)。

| Extension point interface                                                                                                                                                                                    | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`ClassInstanceFactory`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/spi/classloading/ClassInstanceFactory.java)                                     | 提供类实例。<br/> - 目标是把实例的创建 / 获取委托给其他机制。<br/> - 如果没有提供实现，则会使用反射，通过默认构造函数创建实例。<br/> - 其他框架（例如 Quarkus 或 Spring）可以利用自己的 bean 容器来提供类实例，并提供对应实现。<br/> - Quarkus 的实现大致可能类似于 [`CDIClassInstanceFactory`](https://github.com/langchain4j/langchain4j/blob/main/integration-tests/integration-tests-class-instance-loader/integration-tests-class-instance-loader-quarkus/src/main/java/com/example/CDIClassInstanceFactory.java)<br/> - Spring 的实现大致可能类似于 [`ApplicationContextClassInstanceFactory`](https://github.com/langchain4j/langchain4j/blob/main/integration-tests/integration-tests-class-instance-loader/integration-tests-class-instance-loader-spring/src/main/java/com/example/classes/ApplicationContextClassInstanceFactory.java) |
| [`ClassMetadataProviderFactory`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/spi/classloading/ClassMetadataProviderFactory.java)                     | 提供对类元数据的访问。<br/> - 用于扫描 `AiService` 接口上的方法，并查找和处理 `@InputGuardrails` / `@OutputGuardrails` 注解。<br/> - 如果没有发现其他实现，默认会使用 [`ReflectionBasedClassMetadataProviderFactory`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/classloading/ReflectionBasedClassMetadataProviderFactory.java)，通过反射提供类元数据。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| [`GuardrailServiceBuilderFactory`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/spi/GuardrailServiceBuilderFactory.java)                 | 提供用于构建 [`GuardrailService`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j/src/main/java/dev/langchain4j/service/guardrail/GuardrailService.java) 实例的 builder。若应用或框架需要自定义 `GuardrailService` 的构建方式，就可以实现这个扩展点。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| [`InputGuardrailsConfigBuilderFactory`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/spi/guardrail/config/InputGuardrailsConfigBuilderFactory.java)   | - 用于覆写和 / 或扩展默认的 [`InputGuardrailsConfigBuilder`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/config/InputGuardrailsConfigBuilder.java) 的 SPI。<br/> - 其他框架可以提供自己的实现，以支持额外的输入 guardrail 配置。<br/> - 这也允许其他框架通过其他机制（例如配置文件）来驱动输入 guardrail 的配置。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| [`OutputGuardrailsConfigBuilderFactory`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/spi/guardrail/config/OutputGuardrailsConfigBuilderFactory.java) | - 用于覆写和 / 或扩展默认的 [`OutputGuardrailsConfigBuilder`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/config/OutputGuardrailsConfigBuilder.java) 的 SPI。<br/> - 其他框架可以提供自己的实现，以支持额外的输出 guardrail 配置。<br/> - 这也允许其他框架通过其他机制（例如配置文件）来驱动输出 guardrail 的配置。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| [`InputGuardrailExecutorBuilderFactory`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/spi/guardrail/InputGuardrailExecutorBuilderFactory.java)        | - 用于覆写和 / 或扩展默认的 `InputGuardrailExecutorBuilder` 的 SPI；该 builder 负责构建 [`InputGuardrailExecutor`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/InputGuardrailExecutor.java) 实例。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| [`OutputGuardrailExecutorBuilderFactory`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/spi/guardrail/OutputGuardrailExecutorBuilderFactory.java)      | - 用于覆写和 / 或扩展默认的 `OutputGuardrailExecutorBuilder` 的 SPI；该 builder 负责构建 [`OutputGuardrailExecutor`](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/guardrail/OutputGuardrailExecutor.java) 实例。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
