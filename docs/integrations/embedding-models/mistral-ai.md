---
sidebar_position: 12
---

# Mistral AI
[MistralAI 文档](https://docs.mistral.ai/)

### 项目设置

在 Maven 项目 `pom.xml` 中添加以下依赖：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>1.13.0</version>
</dependency>

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-mistral-ai</artifactId>
    <version>1.13.0</version>
</dependency>
```

Gradle 项目 `build.gradle`：

```groovy
implementation 'dev.langchain4j:langchain4j:1.13.0'
implementation 'dev.langchain4j:langchain4j-mistral-ai:1.13.0'
```

#### API Key 配置
将 MistralAI API Key 添加到项目中，可创建 `ApiKeys.java` 类：

```java
public class ApiKeys {
    public static final String MISTRALAI_API_KEY = System.getenv("MISTRAL_AI_API_KEY");
}
```
请务必将 API Key 设置为环境变量：
```shell
export MISTRAL_AI_API_KEY=your-api-key #Unix 系统
SET MISTRAL_AI_API_KEY=your-api-key #Windows 系统
```
如何获取 MistralAI API Key，详见[此处](https://docs.mistral.ai/#api-access)。

## 嵌入
MistralAI 嵌入模型允许您对句子进行嵌入，在应用中使用非常简单。以下是一个快速入门示例。

创建一个类并添加如下代码：

```java
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.mistralai.MistralAiEmbeddingModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;

import java.util.List;

public class HelloWorld {
    public static void main(String[] args) {
        EmbeddingModel embeddingModel = MistralAiEmbeddingModel.builder()
                .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
                .modelName("mistral-embed")
                .build();

        // 为简单起见，本示例使用内存存储，生产环境可选择任意外部兼容存储。
        EmbeddingStore<TextSegment> embeddingStore = new InMemoryEmbeddingStore<>();

        TextSegment segment1 = TextSegment.from("I like football.");
        Embedding embedding1 = embeddingModel.embed(segment1).content();
        embeddingStore.add(embedding1, segment1);
        
        TextSegment segment2 = TextSegment.from("The weather is good today.");
        Embedding embedding2 = embeddingModel.embed(segment2).content();
        embeddingStore.add(embedding2, segment2);
        
        String userQuery = "What is your favourite sport?";
        Embedding queryEmbedding = embeddingModel.embed(userQuery).content();
        EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .maxResults(1)
                .build();
        EmbeddingSearchResult<TextSegment> searchResult = embeddingStore.search(searchRequest);
        EmbeddingMatch<TextSegment> embeddingMatch = searchResult.matches().get(0);

        System.out.println("Question: " + userQuery); // What is your favourite sport?
        System.out.println("Response: " + embeddingMatch.embedded().text()); // I like football.
    }
}
```

本示例添加了 2 个文本段，但 LangChain4j 内置支持从多种来源加载文档：
文件系统、URL、Amazon S3、Azure Blob Storage、GitHub、腾讯云 COS。
同时支持多种文档类型的解析：text、pdf、doc、xls、ppt。

输出类似如下：

```plaintext
Question: What is your favourite sport?
Response: I like football.
```

当然，您也可以将 MistralAI 嵌入与 RAG（检索增强生成）技术结合使用。

在 [RAG](/tutorials/rag) 中，您将学习如何使用 RAG 技术进行数据摄取、检索和高级检索。

许多参数在后台已默认设置，如超时时间、模型类型和模型参数。
在[设置模型参数](/tutorials/model-parameters)中，您将学习如何显式设置这些参数。

### 更多示例
如需查看更多示例，请访问 [langchain4j-examples](https://github.com/langchain4j/langchain4j-examples) 项目。
