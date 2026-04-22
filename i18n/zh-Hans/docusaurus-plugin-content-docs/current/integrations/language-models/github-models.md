---
sidebar_position: 6
---

# GitHub Models [已弃用]

此模块已弃用，请改用 [OpenAI Official SDK 模块](/integrations/language-models/open-ai-official)。

:::note

本文档介绍 `GitHub Models` 集成，它使用 Azure AI Inference API 访问 GitHub Models。

LangChain4j 提供了 4 种不同的 OpenAI 集成方式，本文介绍的是第 4 种：

- [OpenAI](/integrations/language-models/open-ai) 使用自定义 Java 实现的 OpenAI REST API，最适合与 Quarkus（使用 Quarkus REST 客户端）和 Spring（使用 Spring 的 RestClient）配合使用。
- [OpenAI Official SDK](/integrations/language-models/open-ai-official) 使用官方 OpenAI Java SDK。
- [Azure OpenAI](/integrations/language-models/azure-open-ai) 使用微软的 Azure SDK，最适合使用微软 Java 技术栈（包括高级 Azure 认证机制）的场景。
- [GitHub Models](/integrations/language-models/github-models) 使用 Azure AI Inference API 访问 GitHub Models。

:::

如果您想开发生成式 AI 应用，可以使用 GitHub Models 免费查找和体验 AI 模型。
一旦准备好将应用投入生产，可以切换到付费 Azure 账号的令牌。

## GitHub Models 文档

- [GitHub Models 文档](https://docs.github.com/en/github-models)
- [GitHub Models 市场](https://github.com/marketplace/models)

## Maven 依赖

### 纯 Java

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-github-models</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## GitHub 令牌

使用 GitHub Models 需要通过 GitHub 令牌进行身份验证。

令牌可在 [GitHub 开发者设置 > 个人访问令牌](https://github.com/settings/tokens) 中创建和管理。

获取令牌后，将其设置为环境变量并在代码中使用：

```bash
export GITHUB_TOKEN="<your-github-token-goes-here>"
```

## 使用 GitHub 令牌创建 `GitHubModelsChatModel`

### 纯 Java

```java
GitHubModelsChatModel model = GitHubModelsChatModel.builder()
        .gitHubToken(System.getenv("GITHUB_TOKEN"))
        .modelName("gpt-4o-mini")
        .build();
```

这将创建一个 `GitHubModelsChatModel` 实例。
可以在 `GitHubModelsChatModel` 的构建器中自定义模型参数（如 `temperature`）。

### Spring Boot

创建一个 `GitHubModelsChatModelConfiguration` Spring Bean：

```Java
package com.example.demo.configuration.github;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.github.GitHubModelsChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("github")
public class GitHubModelsChatModelConfiguration {

    @Value("${GITHUB_TOKEN}")
    private String gitHubToken;

    @Bean
    ChatModel gitHubModelsChatModel() {
        return GitHubModelsChatModel.builder()
                .gitHubToken(gitHubToken)
                .modelName("gpt-4o-mini")
                .logRequestsAndResponses(true)
                .build();
    }
}
```

该配置将创建一个 `GitHubModelsChatModel` Bean，
可由 [AI Service](https://docs.langchain4j.dev/tutorials/spring-boot-integration/#langchain4j-spring-boot-starter) 使用，
也可在需要时自动装配，例如：

```java
@RestController
class ChatModelController {

    ChatModel chatModel;

    ChatModelController(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @GetMapping("/model")
    public String model(@RequestParam(value = "message", defaultValue = "Hello") String message) {
        return chatModel.chat(message);
    }
}
```

## 使用 GitHub 令牌创建 `GitHubModelsStreamingChatModel`

### 纯 Java

```java
GitHubModelsStreamingChatModel model = GitHubModelsStreamingChatModel.builder()
        .gitHubToken(System.getenv("GITHUB_TOKEN"))
        .modelName("gpt-4o-mini")
        .logRequestsAndResponses(true)
        .build();
```

### Spring Boot

创建一个 `GitHubModelsStreamingChatModelConfiguration` Spring Bean：
```Java
package com.example.demo.configuration.github;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.github.GitHubModelsChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("github")
public class GitHubModelsStreamingChatModelConfiguration {

    @Value("${GITHUB_TOKEN}")
    private String gitHubToken;

    @Bean
    GitHubModelsStreamingChatModel gitHubModelsStreamingChatModel() {
        return GitHubModelsStreamingChatModel.builder()
                .gitHubToken(System.getenv("GITHUB_TOKEN"))
                .modelName("gpt-4o-mini")
                .logRequestsAndResponses(true)
                .build();
    }
}
```

## 示例

- [GitHub Models 示例](https://github.com/langchain4j/langchain4j-examples/tree/main/github-models-examples/src/main/java)
