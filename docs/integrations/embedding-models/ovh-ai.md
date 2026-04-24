---
sidebar_position: 17
---

# OVHcloud AI Endpoints

- [OVHcloud AI Endpoints 文档](https://labs.ovhcloud.com/en/ai-endpoints/)
- OVHcloud AI Endpoints API 参考：
  - [bge-base-en-v1.5](https://bge-base-en-v1-5.endpoints.kepler.ai.cloud.ovh.net/doc)
  - [multilingual-e5-base](https://multilingual-e5-base.endpoints.kepler.ai.cloud.ovh.net/doc)

## 项目设置

### Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-ovh-ai</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

### API 密钥配置 {#api-key-configuration}
将 OVHcloud AI API Key 添加到您的项目中。

```java
public static final String OVHAI_AI_API_KEY = System.getenv("OVHAI_AI_API_KEY");
```
请务必将 API Key 设置为环境变量。
```shell
export OVHAI_AI_API_KEY=your-api-key #Unix 系统
SET OVHAI_AI_API_KEY=your-api-key #Windows 系统
```
如何获取 OVHcloud AI API Key，详见[此处](https://endpoints.ai.cloud.ovh.net/)。

## 嵌入
OVHcloud AI 嵌入模型允许您对句子进行嵌入，在应用中使用非常简单。以下是一个快速入门示例。

创建一个类并添加如下代码：

```java
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.ovhai.OvhAiEmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;

import java.util.List;

public class OvhAiEmbeddingSimpleExample {

    public static void main(String[] args) {
        EmbeddingModel embeddingModel = OvhAiEmbeddingModel.builder()
                .apiKey(System.getenv("OVH_AI_API_KEY"))
                .baseUrl("https://multilingual-e5-base.endpoints.kepler.ai.cloud.ovh.net")
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

当然，您也可以将 OVHCloud 嵌入与 RAG（检索增强生成）技术结合使用。

在 [RAG](/tutorials/rag) 中，您将学习如何使用 RAG 技术进行数据摄取、检索和高级检索。

许多参数在后台已默认设置，如超时时间、模型类型和模型参数。
在[设置模型参数](/tutorials/model-parameters)中，您将学习如何显式设置这些参数。

### 更多示例
如需查看更多示例，请访问 [langchain4j-examples](https://github.com/langchain4j/langchain4j-examples) 项目。
