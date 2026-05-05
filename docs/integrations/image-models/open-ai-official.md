---
sidebar_position: 5
---

# OpenAI Official SDK

:::note

这是 `OpenAI Official SDK` 集成的文档，使用[官方 OpenAI Java SDK](https://github.com/openai/openai-java)。

LangChain4j 提供 3 种不同的 OpenAI 图像生成集成，这是第 2 种：

- [OpenAI](/integrations/language-models/open-ai) 使用 OpenAI REST API 的自定义 Java 实现，最适合 Quarkus（使用 Quarkus REST 客户端）和 Spring（使用 Spring 的 RestClient）。
- [OpenAI Official SDK](/integrations/language-models/open-ai-official) 使用官方 OpenAI Java SDK。
- [Azure OpenAI](/integrations/language-models/azure-open-ai) 使用微软的 Azure SDK，最适合与微软 Java 技术栈结合使用，包括高级 Azure 身份验证机制。

:::

## 此集成的使用场景

此集成使用 [OpenAI Java SDK GitHub 仓库](https://github.com/openai/openai-java)，适用于以下平台提供的所有 OpenAI 模型：

- OpenAI
- Microsoft Foundry

也适用于支持 OpenAI API 的模型。

## OpenAI 文档

- [OpenAI Java SDK GitHub 仓库](https://github.com/openai/openai-java)
- [OpenAI API 文档](https://platform.openai.com/docs/introduction)
- [OpenAI API 参考](https://platform.openai.com/docs/api-reference)

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai-official</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## 配置模型

要使用 OpenAI 模型，通常需要提供端点 URL、API 密钥和模型名称。具体内容取决于模型的托管位置，此集成尝试通过一些自动配置简化这一过程。

### 通用配置

```java
import com.openai.models.images.ImageModel;
import dev.langchain4j.model.image.ImageModel;
import dev.langchain4j.model.openaiofficial.OpenAiOfficialImageModel;

import static com.openai.models.images.ImageModel.GPT_IMAGE_1_MINI;

// ....

ImageModel model = OpenAiOfficialImageModel.builder()
        .baseUrl(System.getenv("OPENAI_BASE_URL"))
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName(GPT_IMAGE_1_MINI)
        .build();
```

### Microsoft Foundry 和 GitHub Models 的专用配置

与配置 [OpenAI Official Chat Model](/integrations/language-models/open-ai-official) 类似，你可以使用 `isAzure()` 和 `isGitHubModels()` 方法为 Microsoft Foundry 和 GitHub Models 配置 `OpenAiOfficialImageModel`。

#### Microsoft Foundry

```java
ImageModel model = OpenAiOfficialImageModel.builder()
        .baseUrl(System.getenv("AZURE_OPENAI_ENDPOINT"))
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .modelName(GPT_IMAGE_1_MINI)
        .isAzure(true) // 如果 base URL 以 `openai.azure.com` 结尾则不必要
        .build();
```

也可以使用"无密码"身份验证，详情请参阅 [OpenAI Official Chat Model](/integrations/language-models/open-ai-official) 文档。

#### GitHub Models

```java
ImageModel model = OpenAiOfficialImageModel.builder()
        .modelName(GPT_IMAGE_1_MINI)
        .isGitHubModels(true)
        .build();
```

## 使用模型

配置好模型后，可以使用它来生成图像：

```java
String imageUrl = imageModel
        .generate("A coffee mug in Paris, France")
        .content()
        .base64Data();
```
