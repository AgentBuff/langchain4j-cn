---
sidebar_position: 35
---

# Payara Micro 集成

LangChain4j 可以无缝集成到 Payara Micro 应用中，
并充分利用 Jakarta EE 与 MicroProfile 在依赖注入和配置方面的标准能力。

本指南演示了如何创建 JAX-RS 资源，
让它们直接实例化并使用 LangChain4j 模型，
而配置则由 MicroProfile Config 负责管理。

## Maven 依赖

首先，在 `pom.xml` 中加入核心 `langchain4j` 依赖，
以及你需要使用的具体模型集成模块：
```xml
<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.release>21</maven.compiler.release>
    <jakartaee-api.version>10.0.0</jakartaee-api.version>
    <payara.version>6.2025.5</payara.version>
    <version.langchain4j>1.13.0</version.langchain4j>
</properties>

<dependencies>
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-open-ai</artifactId>
        <version>${version.langchain4j}</version>
    </dependency>
    
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-google-ai-gemini</artifactId>
        <version>${version.langchain4j}</version>
    </dependency>
    
    <dependency>
        <groupId>jakarta.platform</groupId>
        <artifactId>jakarta.jakartaee-api</artifactId>
        <version>${jakartaee-api.version}</version>
        <scope>provided</scope>
    </dependency>
</dependencies>
```

## 配置多个模型

你可以在 MicroProfile 配置文件中为多个 AI 模型分别提供参数。
该配置文件通常位于 `src/main/resources/META-INF/microprofile-config.properties`：
```
openai.api.key=${OPENAI_API_KEY}
openai.chat.model=gpt-4o-mini

google-ai-gemini.chat-model.api-key=${GEMINI_KEY}
google-ai-gemini.chat-model.model-name=gemini-2.0-flash-lite

deepseek.api.key=${DEEPSEEK_API_KEY}
deepseek.chat.model=deepseek-reasoner
```

## 实现聊天资源

在这种方式下，每个 JAX-RS 资源类都自行负责它所使用的 AI 模型实例。
同样的模式可以对每个 provider 重复使用。

`RestConfiguration` 类继承 `jakarta.ws.rs.core.Application`，
并为所有 REST endpoint 定义 `/api` 作为基础路径：

```java
import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;

@ApplicationPath("api")
public class RestConfiguration extends Application {
}
```
对于每个模型，我们都会有一个 JAX-RS Resource 类，它负责：

- 使用 `@Inject` 和 `@ConfigProperty` 注入配置项。
- 使用带有 `@PostConstruct` 注解的方法，在属性注入完成后构建模型实例。
- 创建一个 `@GET` endpoint 用于与模型交互。

```java
@Path("openai")
public class OpenAiChatModelResource {

    @Inject
    @ConfigProperty(name = "openai.api.key")
    private String openAiApiKey;

    @Inject
    @ConfigProperty(name = "openai.chat.model")
    private String modelName;

    private OpenAiChatModel chatModel;

    @PostConstruct
    public void init() {
        chatModel = OpenAiChatModel.builder()
                .apiKey(openAiApiKey)
                .modelName(modelName)
                .build();
    }

    @GET
    @Path("chat")
    @Produces(MediaType.TEXT_PLAIN)
    public String chat(@QueryParam("message") @DefaultValue("Hello") String message) {
        return chatModel.generate(message);
    }
}
```

同样的模式也适用于 `GeminiChatModelResource` 和 `DeepSeekChatModelResource`。

需要注意的是，最后一个资源类复用了 `OpenAiChatModel` 类，
只是把 `baseUrl` 改成了 [deepseek API](https://api.deepseek.com)，
这也展示了该库在接入不同 provider 时的灵活性。

## API 文档

该示例项目包含 Swagger UI，
可用于交互式浏览和测试 API endpoint。

webapp 目录中的 `index.html` 文件配置了 Swagger UI，
使其加载由 Payara Micro 自动在 `/openapi` endpoint 生成的 OpenAPI 规范：
```json
openapi: 3.0.0
info:
  title: Deployed Resources
  version: 1.0.0
...
        
endpoints:/
- /api/deepseek/chat
- /api/gemini/chat
- /api/openai/chat
components: {}
```

## 运行示例应用

该项目已配置好使用 Payara Micro Maven plugin 运行。

### 前置要求：
- Java SE 21+
- Maven 执行环境

### 执行方式
1. 在项目根目录打开终端。
2. 设置所需的 API key 环境变量。应用需要这些变量来与 AI 服务完成鉴权。你必须配置：
   - OPENAI_API_KEY
   - GEMINI_KEY
   - DEEPSEEK_API_KEY
3. 执行以下 Maven 命令：`mvn clean package payara-micro:start`

服务启动后，你可以通过两种方式测试这些 endpoint：

1. 如果你使用的是 **IntelliJ IDEA**（Ultimate Edition）或其他具备类似能力的 IDE，
   你可以直接从 `.http` 文件中执行请求：

    a. 打开位于 `src/test/resources/` 下的 `test.http` 文件。
    
    b. IDE 会在每个请求定义旁边显示一个绿色的 “play” 图标： 
    ![](/img/payara-micro-test-http.png)

    c. 点击你要执行的请求旁边的图标，API 的响应会直接显示在 IDE 的工具窗口中：
    ![](/img/payara-micro-test-results.png)

2. 使用 AI 聊天界面

    在浏览器中访问 http://localhost:8080/ 。
    这会打开一个交互式 **Chat Page**，
    你可以直接在浏览器中探索并测试可用 endpoint：
    ![](/img/payara-micro-ai-chat.png)
