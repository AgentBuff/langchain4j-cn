---
sidebar_position: 10
---

# Couchbase

https://www.couchbase.com/


## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-couchbase</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## API 参考 {#api}

- `CouchbaseEmbeddingStore`


## 示例

- [CouchbaseEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/couchbase-example/src/main/java/CouchbaseEmbeddingStoreExample.java)

## Couchbase 嵌入存储

Couchbase langchain4j 集成将每个嵌入存储在单独的文档中，并使用 FTS 向量索引对存储的向量执行查询。目前支持存储嵌入及其元数据，以及删除嵌入。编写本教程时，尚不支持按元数据过滤向量搜索结果。请注意，嵌入存储集成仍处于活跃开发阶段，默认配置不建议用于生产环境。

### 连接到 Couchbase 集群

可使用 builder 类初始化 Couchbase 嵌入存储。初始化需要以下参数：
- 集群连接字符串
- 集群用户名
- 集群密码
- 嵌入存储所在的 bucket 名称
- 嵌入存储所在的 scope 名称
- 嵌入存储所在的 collection 名称
- 嵌入存储使用的 FTS 向量索引名称
- 存储向量的维度（长度）

以下示例代码演示如何初始化连接到本地 Couchbase 服务器的嵌入存储：

```java
CouchbaseEmbeddingStore embeddingStore = CouchbaseEmbeddingStore.builder()
        .clusterUrl("localhost:8091")
        .username("Administrator")
        .password("password")
        .bucketName("langchain4j")
        .scopeName("_default")
        .collectionName("_default")
        .searchIndexName("test")
        .dimensions(512)
        .build();
```

示例源码使用 `testcontainers` 库启动专用 Couchbase 服务器：

```java
CouchbaseContainer couchbaseContainer =
        new CouchbaseContainer(DockerImageName.parse("couchbase:enterprise").asCompatibleSubstituteFor("couchbase/server"))
                .withCredentials("Administrator", "password")
                .withBucket(testBucketDefinition)
                .withStartupTimeout(Duration.ofMinutes(1));

CouchbaseEmbeddingStore embeddingStore = CouchbaseEmbeddingStore.builder()
        .clusterUrl(couchbaseContainer.getConnectionString())
        .username(couchbaseContainer.getUsername())
        .password(couchbaseContainer.getPassword())
        .bucketName(testBucketDefinition.getName())
        .scopeName("_default")
        .collectionName("_default")
        .searchIndexName("test")
        .dimensions(384)
        .build();
```

### 向量索引

嵌入存储使用 FTS 向量索引执行向量相似度查找。如果提供的向量索引名称在集群上不存在，存储将根据初始化设置尝试创建默认配置的新索引。建议手动检查已创建索引的设置，并根据具体使用场景进行调整。关于向量搜索和 FTS 索引配置的更多信息，请参阅 [Couchbase 文档](https://docs.couchbase.com/server/current/vector-search/vector-search.html)。

### 嵌入文档

集成会自动为所有存储的嵌入分配基于 `UUID` 的唯一标识符。以下是一个嵌入文档示例（向量字段值已截断以提高可读性）：

```json
{
  "id": "f4831648-07ca-4c77-a031-75acb6c1cf2f",
  "vector": [
    ...
    0.037255168,
    -0.001608681
  ],
  "text": "text",
  "metadata": {
    "some": "value"
  },
  "score": 0
}
```

这些嵌入由开发者选择的嵌入模型生成，向量值与模型相关。

## 在 Couchbase 中存储嵌入

使用嵌入模型生成的嵌入可通过 `CouchbaseEmbeddingStore` 类的 `add` 和 `addAll` 方法存储到 Couchbase 中：

```java
EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();

TextSegment segment1 = TextSegment.from("I like football.");
Embedding embedding1 = embeddingModel.embed(segment1).content();
embeddingStore.add(embedding1, segment1);

TextSegment segment2 = TextSegment.from("The weather is good today.");
Embedding embedding2 = embeddingModel.embed(segment2).content();
embeddingStore.add(embedding2, segment2);

Thread.sleep(1000); // 确保嵌入已持久化
```

## 查询相关嵌入

向存储中添加嵌入后，可使用查询向量查找存储中与其相关的嵌入。以下示例使用嵌入模型为短语 "what is your favorite sport?" 生成向量，然后使用该向量在数据库中查找最相关的答案：

```java
Embedding queryEmbedding = embeddingModel.embed("What is your favourite sport?").content();
EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)
        .maxResults(1)
        .build();
EmbeddingSearchResult<TextSegment> searchResult = embeddingStore.search(searchRequest);
EmbeddingMatch<TextSegment> embeddingMatch = searchResult.matches().get(0);
```

然后可以将所选答案的相关度评分和文本打印到应用输出：

```java
System.out.println(embeddingMatch.score()); // 0.81442887
System.out.println(embeddingMatch.embedded().text()); // I like football.
```

## 删除嵌入

Couchbase 嵌入存储还支持按标识符删除嵌入，例如：

```java
embeddingStore.remove(embeddingMatch.id())
```

或删除全部嵌入：

```java
embeddingStore.removeAll();
```
