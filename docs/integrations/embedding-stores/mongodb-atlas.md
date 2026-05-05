---
sidebar_position: 15
---

# MongoDB Atlas

[MongoDB Atlas](https://www.mongodb.com/docs/atlas/) 是一个全托管的云数据库，可在 AWS、Azure 和 GCP 上使用。它支持对 MongoDB 文档数据进行原生向量搜索和全文搜索（BM25 算法）。

[Atlas Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/) 功能允许您将嵌入存储在 MongoDB 文档中，创建向量搜索索引，并使用称为分层可导航小世界（Hierarchical Navigable Small Worlds）的近似最近邻算法执行 KNN 搜索。
LangChain4j 与 MongoDB 的集成在内部通过使用 [`$vectorSearch`](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-stage/#mongodb-pipeline-pipe.-vectorSearch) 聚合阶段来实现 Atlas Vector Search。

您可以将 Atlas Vector Search 与 LangChain4j 结合使用，对数据执行语义搜索并构建简单的 RAG 实现。关于执行这些任务的完整教程，请参阅 MongoDB Atlas 文档中的 [LangChain4j 集成入门](https://www.mongodb.com/docs/atlas/atlas-vector-search/ai-integrations/langchain4j/)教程。

## 前提条件

使用 Atlas Vector Search 需要运行以下 MongoDB Server 版本的部署：

- 6.0.11 或更高版本
- 7.0.2 或更高版本

MongoDB 提供永久免费集群。请参阅 [Atlas 入门](https://www.mongodb.com/docs/atlas/getting-started/)教程，了解如何设置账户并连接到部署。

您还需要拥有提供嵌入模型的 LLM 服务的 API 密钥（附带积分），例如提供免费层级的 [Voyage AI](https://www.voyageai.com/)。对于 RAG 应用，还需要提供聊天模型功能的服务 API 密钥，例如 [OpenAI](https://openai.com/api/) 或 [HuggingFace](https://huggingface.co/) 的模型。

## 环境与安装

1. 在首选 IDE 中创建新的 Java 应用程序。
2. 向应用程序添加以下依赖以安装 LangChain4j 和 MongoDB Java Sync Driver：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-mongodb-atlas</artifactId>
</dependency>
<dependency>
    <groupId>org.mongodb</groupId>
    <artifactId>mongodb-driver-sync</artifactId>
    <version>5.4.0</version>
</dependency>
```

还需要安装嵌入模型的依赖，例如 Voyage AI：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-voyage-ai</artifactId>
</dependency>
```

建议同时添加 LangChain4j BOM：

```xml
<dependencyManagement>
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-bom</artifactId>
        <version>1.13.0-beta23</version>
        <type>pom</type>
    </dependency>
</dependencyManagement>
```

## 将 MongoDB Atlas 用作嵌入存储

1. 实例化[嵌入模型](https://docs.langchain4j.dev/category/embedding-models)。
2. 将 MongoDB Atlas 实例化为嵌入存储。

构建 `MongoDbEmbeddingStore` 实例时，可向 `createIndex()` 方法传入 `true` 来启用自动索引创建。

```java
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.voyageai.VoyageAiEmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import dev.langchain4j.store.embedding.filter.comparison.*;
import dev.langchain4j.store.embedding.mongodb.IndexMapping;
import dev.langchain4j.store.embedding.mongodb.MongoDbEmbeddingStore;
import org.bson.Document;

import java.io.*;
import java.util.*;

String embeddingApiKey = System.getenv("VOYAGE_AI_KEY");
String uri = System.getenv("MONGODB_URI");

EmbeddingModel embeddingModel = VoyageAiEmbeddingModel.builder()
        .apiKey(embeddingApiKey)
        .modelName("voyage-3")
        .build();

MongoClient mongoClient = MongoClients.create(uri);

System.out.println("正在实例化嵌入存储...");

// 如果向量索引已存在则设置为 false
Boolean createIndex = true;

IndexMapping indexMapping = IndexMapping.builder()
        .dimension(embeddingModel.dimension())
        .metadataFieldNames(new HashSet<>())
        .build();

MongoDbEmbeddingStore embeddingStore = MongoDbEmbeddingStore.builder()
        .databaseName("search")
        .collectionName("langchaintest")
        .createIndex(createIndex)
        .indexName("vector_index")
        .indexMapping(indexMapping)
        .fromClient(mongoClient)
        .build();
```

## 在 MongoDB 中存储数据

以下代码演示如何将文档持久化到嵌入存储。`embed()` 方法会为文档的 `text` 字段值生成嵌入。

```java
ArrayList<Document> docs = new ArrayList<>();

docs.add(new Document()
        .append("text", "Penguins are flightless seabirds that live almost exclusively below the equator. Some island-dwellers can be found in warmer climates.")
        .append("metadata", new Metadata(Map.of("website", "Science Direct"))));

docs.add(new Document()
        .append("text", "Emperor penguins are amazing birds. They not only survive the Antarctic winter, but they breed during the worst weather conditions on earth.")
        .append("metadata", new Metadata(Map.of("website", "Our Earth"))));

docs.add(...);

System.out.println("正在持久化文档嵌入...");

for (Document doc : docs) {
    TextSegment segment = TextSegment.from(
            doc.getString("text"),
            doc.get("metadata", Metadata.class)
    );
    Embedding embedding = embeddingModel.embed(segment).content();
    embeddingStore.add(embedding, segment);
}
```

## 执行语义/相似度搜索

以下代码演示如何创建将查询转换为向量并返回语义相似文档的搜索请求。返回的 `EmbeddingMatch` 实例包含文档内容以及描述每个结果与查询匹配程度的评分。

```java
String query = "Where do penguins live?";
Embedding queryEmbedding = embeddingModel.embed(query).content();

EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)
        .maxResults(3)
        .build();

System.out.println("正在执行查询...");

EmbeddingSearchResult<TextSegment> searchResult = embeddingStore.search(searchRequest);
List<EmbeddingMatch<TextSegment>> matches = searchResult.matches();

for (EmbeddingMatch<TextSegment> embeddingMatch : matches) {
    System.out.println("响应: " + embeddingMatch.embedded().text());
    System.out.println("作者: " + embeddingMatch.embedded().metadata().getString("author"));
    System.out.println("评分: " + embeddingMatch.score());
}
```

### 元数据过滤

可在构建 `EmbeddingSearchRequest` 时使用 `filter()` 方法实现元数据过滤。`filter()` 方法接受继承自 [Filter](https://docs.langchain4j.dev/apidocs/dev/langchain4j/store/embedding/filter/Filter.html) 的参数。

以下代码仅对 `website` 值为列表中所列值的文档实施元数据过滤：

```java
EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)
        .filter(new IsIn("website", List.of("Our Earth", "Natural Habitats")))
        .maxResults(3)
        .build();
```

## RAG

关于使用 MongoDB Atlas 作为向量存储实现 RAG 的说明，请参阅 Atlas 文档中 LangChain4j 教程的[使用您的数据回答问题](https://www.mongodb.com/docs/atlas/atlas-vector-search/ai-integrations/langchain4j/#use-your-data-to-answer-questions)部分。

## API 文档

- [MongoDB Atlas 嵌入存储集成](https://docs.langchain4j.dev/apidocs/dev/langchain4j/store/embedding/mongodb/package-summary.html)
- [MongoDB Java Sync Driver](https://mongodb.github.io/mongo-java-driver/5.4/apidocs/mongodb-driver-sync/index.html)

## 相关链接

- [LangChain4j 集成入门](https://www.mongodb.com/docs/atlas/atlas-vector-search/ai-integrations/langchain4j/)
- [如何使用 LangChain4j 构建 RAG 应用](https://dev.to/mongodb/how-to-make-a-rag-application-with-langchain4j-1mad)
