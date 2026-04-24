---
sidebar_position: 18
---

# Oracle
Oracle 嵌入存储集成了 Oracle Database 的 [AI Vector Search 功能](https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/overview-ai-vector-search.html)。

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-oracle</artifactId>
    <version>1.13.0-beta23</version>

</dependency>
```

## API 参考 {#api}

- `OracleEmbeddingStore`


## 示例

- [OracleEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/oracle-example/src/main/java/OracleEmbeddingStoreExample.java)

## 使用方式

可通过配置 builder 创建此存储的实例。builder 需要提供 DataSource 和嵌入表。
两个向量之间的距离使用[余弦相似度](https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/cosine-similarity.html)计算，
该方法测量两个向量之间夹角的余弦值。

建议配置连接池的 DataSource，如 Universal Connection Pool 或 Hikari，以避免重复创建数据库连接带来的延迟。

如果数据库中已存在嵌入表，请提供表名：

```java
EmbeddingStore embeddingStore = OracleEmbeddingStore.builder()
   .dataSource(myDataSource)
   .embeddingTable("my_embedding_table")
   .build();
```

如果表不存在，可通过向 builder 传入 CreateOption 来创建：

```java
EmbeddingStore embeddingStore = OracleEmbeddingStore.builder()
   .dataSource(myDataSource)
   .embeddingTable("my_embedding_table", CreateOption.CREATE_IF_NOT_EXISTS)
   .build();
```

默认情况下，嵌入表包含以下列：

| 名称 | 类型 | 描述 |
| ---- | ---- | ---- |
| id | VARCHAR(36) | 主键，存储嵌入存储生成的 UUID 字符串 |
| embedding | VECTOR(*, FLOAT32) | 存储嵌入向量 |
| text | CLOB | 存储文本段 |
| metadata | JSON | 存储元数据 |

如果已有表的列名与预定义列名不匹配，或希望使用不同的列名，可使用 EmbeddingTable builder 进行配置：

```java
OracleEmbeddingStore embeddingStore =
OracleEmbeddingStore.builder()
    .dataSource(myDataSource)
    .embeddingTable(EmbeddingTable.builder()
            .createOption(CREATE_OR_REPLACE) // 若表已存在则使用 NONE
            .name("my_embedding_table")
            .idColumn("id_column_name")
            .embeddingColumn("embedding_column_name")
            .textColumn("text_column_name")
            .metadataColumn("metadata_column_name")
            .build())
    .build();
```

builder 还支持通过提供 Index 类实例，在 EmbeddingTable 的嵌入列和元数据列上创建索引。
有两个 builder 可用于创建 Index 类实例：IVFIndexBuilder 和 JSONIndexBuilder。

*IVFIndexBuilder* 可在 EmbeddingTable 的嵌入列上配置 **IVF（Inverted File Flat）** 索引：

```java
OracleEmbeddingStore embeddingStore =
    OracleEmbeddingStore.builder()
        .dataSource(myDataSource)
        .embeddingTable(EmbeddingTable.builder()
            .createOption(CreateOption.CREATE_OR_REPLACE) // 若表已存在则使用 NONE
            .name("my_embedding_table")
            .idColumn("id_column_name")
            .embeddingColumn("embedding_column_name")
            .textColumn("text_column_name")
            .metadataColumn("metadata_column_name")
            .build())
        .index(Index.ivfIndexBuilder().createOption(CreateOption.CREATE_OR_REPLACE).build())
        .build();
```

*JSONIndexBuilder* 可在 EmbeddingTable 元数据列的键上配置**基于函数的索引**：

```java
OracleEmbeddingStore.builder()
    .dataSource(myDataSource)
    .embeddingTable(EmbeddingTable.builder()
        .createOption(CreateOption.CREATE_OR_REPLACE) // 若表已存在则使用 NONE
        .name("my_embedding_table")
        .idColumn("id_column_name")
        .embeddingColumn("embedding_column_name")
        .textColumn("text_column_name")
        .metadataColumn("metadata_column_name")
        .build())
    .index(Index.jsonIndexBuilder()
        .createOption(CreateOption.CREATE_OR_REPLACE)
        .key("name", String.class, JSONIndexBuilder.Order.ASC)
        .key("year", Integer.class, JSONIndexBuilder.Order.DESC)
        .build())
    .build();
```

更多关于 Oracle AI Vector Search 的信息，请参阅[文档](https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/overview-ai-vector-search.html)。
