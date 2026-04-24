---
sidebar_position: 12
---

# Elasticsearch

https://www.elastic.co/


## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-elasticsearch</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## 概述

`langchain4j-elasticsearch` 模块提供与 Elasticsearch 的集成，可用作嵌入存储和内容检索器。

它包含两个主要类：

- [`ElasticsearchEmbeddingStore`](#elasticsearchembeddingstore)：`EmbeddingStore` 接口的实现，使用 Elasticsearch 存储和检索嵌入。
- [`ElasticsearchContentRetriever`](#elasticsearchcontentretriever)：`ContentRetriever` 接口的实现，使用 Elasticsearch 通过向量相似度搜索检索相关文档。

两个类都需要 [Elasticsearch Client](https://www.elastic.co/docs/reference/elasticsearch/clients/java) 来连接 Elasticsearch 服务器。

```java
String apiKey = "VnVhQ2ZHY0JDZGJrU...";
ElasticsearchClient client = ElasticsearchClient.of(ec -> ec
        .host("https://localhost:9200")
        .apiKey(apiKey));
```

**注意：**

> 请参阅 [Elasticsearch 文档](https://www.elastic.co/docs/reference/elasticsearch/clients/java/setup/connecting)了解如何创建 ElasticsearchClient 实例。

## ElasticsearchEmbeddingStore

创建 `ElasticsearchEmbeddingStore` 实例需要提供 `ElasticsearchClient`：

```java
ElasticsearchEmbeddingStore store = ElasticsearchEmbeddingStore.builder()
    .client(client)
    .build();
```

支持以下选项：

* `indexName`：要使用的 Elasticsearch 索引名称。默认为 `default`。
* `configuration`：要使用的 `ElasticsearchConfiguration`。默认为 `ElasticsearchConfigurationKnn`。

上述代码等效于：

```java
ElasticsearchEmbeddingStore store = ElasticsearchEmbeddingStore.builder()
    .client(client)
    .configuration(ElasticsearchConfigurationKnn.builder().build())
    .indexName("default")
    .build();
```

## ElasticsearchContentRetriever

ContentRetriever 需要嵌入模型：

```java
EmbeddingModel embeddingModel = new AllMiniLmL6V2QuantizedEmbeddingModel();
```

创建 `ElasticsearchContentRetriever` 实例需要提供 `ElasticsearchClient` 和 `EmbeddingModel`：

```java
ElasticsearchContentRetriever contentRetriever = ElasticsearchContentRetriever.builder()
    .client(client)
    .embeddingModel(embeddingModel)
    .build();
```

支持以下选项：

* `configuration`：要使用的 `ElasticsearchConfiguration`（见[下文](#elasticsearchconfiguration)）。默认为 `ElasticsearchConfigurationKnn`。
* `indexName`：要使用的 Elasticsearch 索引名称。默认为 `default`。如果不存在则自动创建。
* `maxResults`：检索的最大结果数。默认为 `3`。
* `minScore`：检索结果的最低评分阈值。默认为 `0.0`。
* `filter`：检索时应用的 `Filter`（如有）。默认为 `null`。

上述代码等效于：

```java
ElasticsearchContentRetriever contentRetriever = ElasticsearchContentRetriever.builder()
    .client(client)
    .embeddingModel(embeddingModel)
    .configuration(ElasticsearchConfigurationKnn.builder().build())
    .indexName("default")
    .maxResults(3)
    .minScore(0.0)
    .filter(null)
    .build();
```

## ElasticsearchConfiguration

`ElasticsearchConfiguration` 定义了嵌入存储或内容检索器与 Elasticsearch 服务器的交互方式。可以通过实现 `ElasticsearchConfiguration` 接口创建自定义配置，或使用以下提供的实现之一：

- [`ElasticsearchConfigurationKnn`](#elasticsearchconfigurationknn)：使用近似 [kNN 查询](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-knn-query.html)（默认）。
- [`ElasticsearchConfigurationScript`](#elasticsearchconfigurationscript)：使用 [scriptScore 查询](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-script-score-query.html)，此实现使用余弦相似度。
- [`ElasticsearchConfigurationFullText`](#elasticsearchconfigurationfulltext)：使用[全文搜索](https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-match-query)（仅限内容检索器）。
- [`ElasticsearchConfigurationHybrid`](#elasticsearchconfigurationhybrid)：使用[混合搜索](https://www.elastic.co/search-labs/tutorials/search-tutorial/vector-search/hybrid-search)（仅限内容检索器，需要付费许可证），结合 kNN 向量查询和全文查询。

创建配置实例可使用每个实现提供的 builder，例如：

```java
ElasticsearchConfiguration configuration = ElasticsearchConfigurationKnn.builder().build();
```

### ElasticsearchConfigurationKnn

`ElasticsearchConfigurationKnn` 使用近似 kNN 查询执行向量相似度搜索。

它是 [`ElasticsearchEmbeddingStore`](#elasticsearchembeddingstore) 和 [`ElasticsearchContentRetriever`](#elasticsearchcontentretriever) 的默认配置。

创建实例可使用 builder：

```java
ElasticsearchConfiguration configuration = ElasticsearchConfigurationKnn.builder().build();
```

支持以下选项：

* `numCandidates`：搜索期间考虑的候选邻居数量。默认为 `null`，即使用 Elasticsearch 默认值。
* `includeVectorResponse`：是否在搜索响应中包含向量字段。默认为 `false`。

> **注意：**
> 从 elasticsearch 服务器 9.2 版本起，响应中默认不包含向量字段。如需在响应中包含向量字段（不推荐），可在 builder 中设置 `includeVectorResponse`：
>
> ```java
> ElasticsearchConfigurationKnn configuration = ElasticsearchConfigurationKnn.builder()
>     .includeVectorResponse(true)
>     .build();
> ```

### ElasticsearchConfigurationScript

`ElasticsearchConfigurationScript` 使用 scriptScore 查询执行向量相似度搜索，此实现使用余弦相似度。

适用于 [`ElasticsearchEmbeddingStore`](#elasticsearchembeddingstore) 和 [`ElasticsearchContentRetriever`](#elasticsearchcontentretriever)。

创建实例可使用 builder：

```java
ElasticsearchConfiguration configuration = ElasticsearchConfigurationScript.builder().build();
```

支持以下选项：

* `includeVectorResponse`：是否在搜索响应中包含向量字段。默认为 `false`。

> **注意：**
> 从 elasticsearch 服务器 9.2 版本起，响应中默认不包含向量字段。如需在响应中包含向量字段（不推荐），可在 builder 中设置 `includeVectorResponse`：
>
> ```java
> ElasticsearchConfiguration configuration = ElasticsearchConfigurationScript.builder()
>     .includeVectorResponse(true)
>     .build();
> ```

### ElasticsearchConfigurationFullText

`ElasticsearchConfigurationFullText` 使用全文搜索检索相关文档。

仅适用于 [`ElasticsearchContentRetriever`](#elasticsearchcontentretriever)。

创建实例可使用 builder：

```java
ElasticsearchConfiguration configuration = ElasticsearchConfigurationFullText.builder().build();
```

### ElasticsearchConfigurationHybrid

`ElasticsearchConfigurationHybrid` 使用混合搜索将 kNN 向量查询与全文查询相结合。注意混合搜索需要 Elasticsearch 企业许可证或试用许可证。

仅适用于 [`ElasticsearchContentRetriever`](#elasticsearchcontentretriever)。

创建实例可使用 builder：

```java
ElasticsearchConfiguration configuration = ElasticsearchConfigurationHybrid.builder().build();
```

支持以下选项：

* `numCandidates`：搜索期间考虑的候选邻居数量。默认为 `null`，即使用 Elasticsearch 默认值。
* `includeVectorResponse`：是否在搜索响应中包含向量字段。默认为 `false`。

> **注意：**
> 从 elasticsearch 服务器 9.2 版本起，响应中默认不包含向量字段。如需在响应中包含向量字段（不推荐），可在 builder 中设置 `includeVectorResponse`：
>
> ```java
> ElasticsearchConfiguration configuration = ElasticsearchConfigurationHybrid.builder()
>     .includeVectorResponse(true)
>     .build();
> ```

### 创建自定义配置

可以通过实现 `ElasticsearchConfiguration` 接口创建自定义 Elasticsearch 配置，例如：

```java
public class MyElasticsearchConfiguration implements ElasticsearchConfiguration {
    @Override
    SearchResponse<Document> vectorSearch(
            ElasticsearchClient client,
            String indexName,
            EmbeddingSearchRequest embeddingSearchRequest) {
        // 自定义向量搜索实现
    }

    @Override
    SearchResponse<Document> fullTextSearch(
            ElasticsearchClient client, 
            String indexName, 
            String textQuery) {
        // 自定义全文搜索实现
    }

    @Override
    SearchResponse<Document> hybridSearch(
            ElasticsearchClient client,
            String indexName,
            EmbeddingSearchRequest embeddingSearchRequest,
            String textQuery) {
        // 自定义混合搜索实现
    }
}
```

注意只需实现与您的使用场景相关的方法：

* `vectorSearch` 用于向量相似度搜索（`ElasticsearchEmbeddingStore` 和 `ElasticsearchContentRetriever` 均使用）。
* `fullTextSearch` 用于全文搜索（仅 `ElasticsearchContentRetriever` 使用）。
* `hybridSearch` 用于混合搜索（仅 `ElasticsearchContentRetriever` 使用）。

## 示例

- [ElasticsearchEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/elasticsearch-example/src/main/java/ElasticsearchEmbeddingStoreExample.java)
- [ElasticsearchEmbeddingStoreWithScriptExample](https://github.com/langchain4j/langchain4j-examples/blob/main/elasticsearch-example/src/main/java/ElasticsearchEmbeddingStoreWithScriptExample.java)
