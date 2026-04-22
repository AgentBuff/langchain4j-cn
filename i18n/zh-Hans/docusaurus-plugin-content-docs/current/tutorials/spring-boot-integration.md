---
sidebar_position: 27
---

# Spring Boot 集成

LangChain4j 为以下场景提供了 [Spring Boot starters](https://github.com/langchain4j/langchain4j-spring)：
- 常用集成
- 声明式 [AI Services](/tutorials/ai-services)


## Spring Boot 启动器

Spring Boot starter 可以帮助你通过配置项创建并配置
[language models](/category/language-models)、
[embedding models](/category/embedding-models)、
[embedding stores](/category/embedding-stores)
以及其他 LangChain4j 核心组件。

要使用某个 [Spring Boot starter](https://github.com/langchain4j/langchain4j-spring)，
请引入对应依赖。

Spring Boot starter 依赖的命名约定如下：
- **Spring Boot 3** 使用 `langchain4j-{integration-name}-spring-boot-starter`
- **Spring Boot 4** 使用 `langchain4j-{integration-name}-spring-boot4-starter`

例如，对于 OpenAI（`langchain4j-open-ai`）：

**Spring Boot 3:**
 ```xml
 <dependency>
     <groupId>dev.langchain4j</groupId>
     <artifactId>langchain4j-open-ai-spring-boot-starter</artifactId>
     <version>1.13.0-beta23</version>
 </dependency>
```

**Spring Boot 4:**
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai-spring-boot4-starter</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

然后，你可以像下面这样在 `application.properties` 中配置模型参数：
```
langchain4j.open-ai.chat-model.api-key=${OPENAI_API_KEY}
langchain4j.open-ai.chat-model.model-name=gpt-4o
langchain4j.open-ai.chat-model.log-requests=true
langchain4j.open-ai.chat-model.log-responses=true
...
```

在这种情况下，会自动创建一个 `OpenAiChatModel` 实例
（它是 `ChatModel` 的一个实现），
你可以在需要的地方自动注入它：
```java
@RestController
public class ChatController {

    ChatModel chatModel;

    public ChatController(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @GetMapping("/chat")
    public String model(@RequestParam(value = "message", defaultValue = "Hello") String message) {
        return chatModel.chat(message);
    }
}
```

如果你需要的是 `StreamingChatModel` 实例，
请使用 `streaming-chat-model` 而不是 `chat-model` 这组配置项：
```
langchain4j.open-ai.streaming-chat-model.api-key=${OPENAI_API_KEY}
...
```

### LangChain4j Spring Boot Starter

这一兼容锚点对应下方的声明式 AI Services starter 小节。

<a id="langchain4j-spring-boot-starter"></a>

## 声明式 AI Services 的 Spring Boot starter {#spring-boot-starter-for-declarative-ai-services}

LangChain4j 提供了一个 Spring Boot starter，
可用于自动配置 [AI Services](/tutorials/ai-services)、[RAG](/tutorials/rag)、[Tools](/tutorials/tools) 等能力。

假设你已经导入了某个集成 starter（见上文），
请再引入 `langchain4j-spring-boot-starter`（Spring Boot 3）
或 `langchain4j-spring-boot4-starter`（Spring Boot 4）：

**Spring Boot 3:**
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-spring-boot-starter</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

**Spring Boot 4:**
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-spring-boot4-starter</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

现在你可以定义 AI Service 接口，并用 `@AiService` 进行标注：
```java
@AiService
interface Assistant {

    @SystemMessage("You are a polite assistant")
    String chat(String userMessage);
}
```

你可以把它理解为标准 Spring Boot `@Service` 的 AI 版本。

当应用启动时，LangChain4j starter 会扫描 classpath，
找到所有带有 `@AiService` 注解的接口。
对于每个找到的 AI Service，
它都会利用应用上下文中可用的 LangChain4j 组件为该接口创建实现，
并将其注册为 bean，
这样你就可以在需要的地方自动注入它：
```java
@RestController
class AssistantController {

    @Autowired
    Assistant assistant;

    @GetMapping("/chat")
    public String chat(String message) {
        return assistant.chat(message);
    }
}
```

### 自动组件装配
如果应用上下文中存在以下组件，
它们会被自动装配到 AI Service 中：
- `ChatModel`
- `StreamingChatModel`
- `ChatMemory`
- `ChatMemoryProvider`
- `ContentRetriever`
- `RetrievalAugmentor`
- `ToolProvider`
- 任意 `@Component` 或 `@Service` 类中所有带有 `@Tool` 注解的方法

示例：
```java
@Component
public class BookingTools {

    private final BookingService bookingService;

    public BookingTools(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @Tool
    public Booking getBookingDetails(String bookingNumber, String customerName, String customerSurname) {
        return bookingService.getBookingDetails(bookingNumber, customerName, customerSurname);
    }

    @Tool
    public void cancelBooking(String bookingNumber, String customerName, String customerSurname) {
        bookingService.cancelBooking(bookingNumber, customerName, customerSurname);
    }
}
```

:::note
如果应用上下文中存在多个同类型组件，应用将启动失败。
这时请使用显式装配模式（见下文）。
:::

### 显式组件装配

如果你有多个 AI Services，
并且希望为它们分别装配不同的 LangChain4j 组件，
可以使用显式装配模式指定要使用的组件
（`@AiService(wiringMode = EXPLICIT)`）。

假设我们配置了两个 `ChatModel`：
```properties
# OpenAI 配置 {#openai}
langchain4j.open-ai.chat-model.api-key=${OPENAI_API_KEY}
langchain4j.open-ai.chat-model.model-name=gpt-4o-mini

# Ollama 配置 {#ollama}
langchain4j.ollama.chat-model.base-url=http://localhost:11434
langchain4j.ollama.chat-model.model-name=llama3.1
```

```java
@AiService(wiringMode = EXPLICIT, chatModel = "openAiChatModel")
interface OpenAiAssistant {

    @SystemMessage("You are a polite assistant")
    String chat(String userMessage);
}

@AiService(wiringMode = EXPLICIT, chatModel = "ollamaChatModel")
interface OllamaAssistant {

    @SystemMessage("You are a polite assistant")
    String chat(String userMessage);
}
```

:::note
在这种情况下，你必须显式指定**所有**组件。
:::

更多细节可见[这里](https://github.com/langchain4j/langchain4j-spring/blob/main/langchain4j-spring-boot-starter/src/main/java/dev/langchain4j/service/spring/AiService.java)
（Spring Boot 4 变体使用同一套 API）。

### 监听 AI Service 注册事件

当你以声明式方式完成 AI Service 开发后，
可以通过实现 `ApplicationListener<AiServiceRegisteredEvent>` 接口来监听
`AiServiceRegisteredEvent`。
该事件会在 AI Service 注册到 Spring 上下文时触发，
从而让你在运行时获取所有已注册 AI Service 及其工具的信息。
示例如下：
```java
@Component
class AiServiceRegisteredEventListener implements ApplicationListener<AiServiceRegisteredEvent> {


    @Override
    public void onApplicationEvent(AiServiceRegisteredEvent event) {
        Class<?> aiServiceClass = event.aiServiceClass();
        List<ToolSpecification> toolSpecifications = event.toolSpecifications();
        for (int i = 0; i < toolSpecifications.size(); i++) {
            System.out.printf("[%s]: [Tool-%s]: %s%n", aiServiceClass.getSimpleName(), i + 1, toolSpecifications.get(i));
        }
    }
}
```

## Flux 反应流 {#flux}

在流式场景下，你可以把 `Flux<String>` 作为 AI Service 的返回类型：
```java
@AiService
interface Assistant {

    @SystemMessage("You are a polite assistant")
    Flux<String> chat(String userMessage);
}
```
为此，请引入 `langchain4j-reactor` 模块。
更多细节见[这里](/tutorials/ai-services#flux)。


## 可观测性 {#observability}

要为 `ChatModel` 或 `StreamingChatModel` bean 启用 observability，
你需要声明一个或多个 `ChatModelListener` bean：

```java
@Configuration
class MyConfiguration {
    
    @Bean
    ChatModelListener chatModelListener() {
        return new ChatModelListener() {

            private static final Logger log = LoggerFactory.getLogger(ChatModelListener.class);

            @Override
            public void onRequest(ChatModelRequestContext requestContext) {
                log.info("onRequest(): {}", requestContext.chatRequest());
            }

            @Override
            public void onResponse(ChatModelResponseContext responseContext) {
                log.info("onResponse(): {}", responseContext.chatResponse());
            }

            @Override
            public void onError(ChatModelErrorContext errorContext) {
                log.info("onError(): {}", errorContext.error().getMessage());
            }
        };
    }
}
```

应用上下文中的每个 `ChatModelListener` bean，
都会被自动注入到由我们的 Spring Boot starters 创建的
所有 `ChatModel` 和 `StreamingChatModel` bean 中。

### Micrometer 指标 {#micrometer-metrics}
将 `langchain4j-micrometer-metrics` 依赖加入你的项目：

对于 Maven：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-micrometer-metrics</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```
对于 Gradle：
```gradle
implementation 'dev.langchain4j:langchain4j-micrometer-metrics:1.13.0-beta23'
```

#### Micrometer（Actuator）配置 {#micrometer-actuator-configuration}
你的项目中还应包含必要的 Actuator 依赖。
例如，如果你使用 Spring Boot，可以把以下依赖加入 `pom.xml`：

对于 Maven：
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```
对于 Gradle：
```gradle
implementation 'org.springframework.boot:spring-boot-starter-actuator'
```

请在配置中启用 `/metrics` Actuator endpoint。

application.properties:
```properties
management.endpoints.web.exposure.include=metrics
```
application.yaml:
```yaml
management:
  endpoints:
    web:
      exposure:
        include: metrics
```

#### 配置 `MicrometerMetricsChatModelListener` bean

在 Spring Boot 应用中，你可以把 listener 定义为一个 bean，
并注入 `MeterRegistry`：

```java
import dev.langchain4j.micrometer.metrics.listeners.MicrometerMetricsChatModelListener;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MetricsConfig {

    @Bean
    public MicrometerMetricsChatModelListener listener(MeterRegistry meterRegistry) {
        return new MicrometerMetricsChatModelListener(meterRegistry);
    }
}
```

#### 查看 Metrics

你可以访问应用的 `/actuator/metrics` endpoint 查看这些 metrics。

例如，如果你的应用运行在 `localhost:8080`，
可以访问 http://localhost:8080/actuator/metrics 来查看指标。

##### Token Usage Metric

可通过以下地址查看 token usage 指标：
```
http://localhost:8080/actuator/metrics/gen_ai.client.token.usage
```

##### 按 Token Type 过滤

`gen_ai.token.type` tag 表示统计的是输入 token 还是输出 token：

| Token Type | Endpoint |
|------------|----------|
| Input tokens | `/actuator/metrics/gen_ai.client.token.usage?tag=gen_ai.token.type:input` |
| Output tokens | `/actuator/metrics/gen_ai.client.token.usage?tag=gen_ai.token.type:output` |

> **Note**: `gen_ai.client.token.usage` 指标是一个 histogram（DistributionSummary）。不带任何 tag 的 endpoint 会展示跨所有 token 类型、模型和 provider 聚合后的统计信息（count、total、max）。

### Micrometer 观测 {#micrometer-observation}

这一兼容锚点对应下方的 Micrometer Observation API 小节。

### Micrometer 观测 API {#micrometer-observation-api}

这里通过 [Micrometer Observation API](https://docs.micrometer.io/micrometer/reference/observation.html)
实现了 `ChatModelListener`，
只需添加以下依赖即可透明地产生 Metrics 和 Traces：

对于 Maven：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-observation</artifactId>
</dependency>
```
对于 Gradle：
```gradle
implementation 'dev.langchain4j:langchain4j-observation'
```

你需要像下面这样实例化 Observation listener......

#### 配置 `ObservationChatModelListener` bean

```java
@Configuration
public class ObservationConfig {

    @Bean
    public ObservationChatModelListener listener(ObservationRegistry observationRegistry, MeterRegistry meterRegistry) {
        return new ObservationChatModelListener(observationRegistry, meterRegistry);
    }
}
```

这个依赖要求你像上文所述那样，完成 [SpringBoot Actuator](spring-boot-integration.md#micrometer-actuator-configuration) 的配置。

关于 SpringBoot 应用中其他 observability 相关要求，请参阅：
[Building Your First Observed Application](https://spring.io/blog/2022/10/12/observability-with-spring-boot-3#building-your-first-observed-application)

关于 `langchain4j-observation` 库的更多细节，
请参阅 [Observability 文档](observability.md#micrometer-observation-api)。


## 测试

- [Customer Support Agent 集成测试示例](https://github.com/langchain4j/langchain4j-examples/blob/main/customer-support-agent-example/src/test/java/dev/langchain4j/example/CustomerSupportAgentIT.java)

## 支持的版本

LangChain4j 的 Spring Boot 集成要求 Java 17，并同时支持：
- **Spring Boot 3**（3.5+）: 使用带 `-spring-boot-starter` 后缀的 starter，符合 [Spring Boot OSS support policy](https://spring.io/projects/spring-boot#support)
- **Spring Boot 4**（4.0+）: 使用带 `-spring-boot4-starter` 后缀的 starter

这两条产品线会一起发布，并共享相同的版本号。
请选择与你项目中 Spring Boot 版本匹配的一组 starter。

## 示例
- 使用 [ChatModel API](/tutorials/chat-and-language-models) 的[低层 Spring Boot 示例](https://github.com/langchain4j/langchain4j-examples/blob/main/spring-boot-example/src/main/java/dev/langchain4j/example/lowlevel/ChatModelController.java)
- 使用 [AI Services](/tutorials/ai-services) 的[高层 Spring Boot 示例](https://github.com/langchain4j/langchain4j-examples/blob/main/spring-boot-example/src/main/java/dev/langchain4j/example/aiservice/AssistantController.java)
- [使用 Spring Boot 的 customer support agent 示例](https://github.com/langchain4j/langchain4j-examples/blob/main/customer-support-agent-example/src/main/java/dev/langchain4j/example/CustomerSupportAgentApplication.java)
