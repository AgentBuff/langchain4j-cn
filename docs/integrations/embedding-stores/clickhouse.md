---
sidebar_position: 8
---

# ClickHouse

[ClickHouse](https://clickhouse.com/) 是开源的最快、最节省资源的实时应用与分析数据库，
支持完整的 SQL 以及丰富的分析查询函数。其最新添加的数据结构、距离搜索函数（如 cosineDistance）
以及[近似最近邻搜索索引](https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/annindexes)，
使 ClickHouse 能够作为高性能、可扩展的向量数据库，通过 SQL 存储和搜索向量。

## Maven 依赖

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-clickhouse</artifactId>
    <version>${latest version here}</version>
</dependency>
```

## API 参考 {#api}

LangChain4j 使用 `client-v2` 作为 ClickHouse 客户端。创建 `ClickHouseEmbeddingStore` 实例需要提供一个 `ClickHouseSettings`：

```java
// 将元数据键映射到 ClickHouse 数据类型
Map<String, ClickHouseDataType> metadataTypeMap = new HashMap<>();

ClickHouseSettings settings = ClickHouseSettings.builder()
    .url("http://localhost:8123")
    .table("langchain4j_table")
    .username(System.getenv("USERNAME"))
    .password(System.getenv("PASSWORD"))
    .dimension(embeddingModel.dimension())
    .metadataTypeMap(metadataTypeMap)
    .build();
```

然后创建嵌入存储：

```java
ClickHouseEmbeddingStore embeddingStore = ClickHouseEmbeddingStore.builder()
    .settings(settings)
    .build();
```

## 示例

- [ClickHouseEmbeddingStoreIT](https://github.com/langchain4j/langchain4j-community/blob/main/langchain4j-community-clickhouse/src/test/java/dev/langchain4j/community/store/embedding/clickhouse/ClickHouseEmbeddingStoreIT.java)
