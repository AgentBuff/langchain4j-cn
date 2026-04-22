---
sidebar_position: 11
---

# DuckDB

https://duckdb.org/

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-duckdb</artifactId>
    <version>${latest version here}</version>
</dependency>
```

## API 参考 {#api}

- `DuckDBEmbeddingStore`

## 示例

```java
// 初始化模型和存储
var embeddingStore = DuckDBEmbeddingStore.inMemory();
var embeddingModel = new AllMiniLmL6V2QuantizedEmbeddingModel();

// 创建嵌入
Stream.of(
            "DuckDB is an amazing database engine!",
            "Python really lack of typing :D")
    .forEach(text -> {
        var segment = TextSegment.from(text);
        var embedding = embeddingModel.embed(segment).content();
        embeddingStore.add(embedding, segment);
    });


// 搜索请求
var queryEmbedding = embeddingModel.embed("What is the best database engine").content();
var request = EmbeddingSearchRequest.builder()
               .queryEmbedding(queryEmbedding)
               .maxResults(1)
               .build();

var relevant = embeddingStore.search(request);
EmbeddingMatch<TextSegment> embeddingMatch = relevant.matches().get(0);

// 显示结果
System.out.println(embeddingMatch.score()); // 0.8416415629618381
System.out.println(embeddingMatch.embedded().text()); //DuckDB is an amazing database engine!
```
