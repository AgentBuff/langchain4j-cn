---
sidebar_position: 23
---

# SQL Server

SQL Server 嵌入存储集成了 SQL Server 2025 中引入的[向量搜索和向量索引](https://learn.microsoft.com/en-us/sql/sql-server/ai/vectors?view=sql-server-ver17)功能。

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-sqlserver</artifactId>
    <version>${latest version here}</version>
</dependency>
```

## API 参考 {#api}

- `SQLServerEmbeddingStore`

## 使用方式

可通过配置 builder 创建此存储的实例。builder 需要提供 DataSource 和嵌入表。

建议配置连接池的 DataSource，如 Universal Connection Pool 或 Hikari，以避免重复创建数据库连接带来的延迟。

### 嵌入存储配置示例

如果数据库中已存在嵌入表，请提供表配置：

```java
EmbeddingStore<TextSegment> embeddingStore = SQLServerEmbeddingStore.dataSourceBuilder()
   .dataSource(myDataSource)
   .embeddingTable(EmbeddingTable.builder()
           .name("my_embedding_table")
           .dimension(384) // 必须指定维度
           .build())
   .build();
```

如果表不存在，可通过设置 create 选项来创建：

```java
EmbeddingStore<TextSegment> embeddingStore = SQLServerEmbeddingStore.dataSourceBuilder()
   .dataSource(myDataSource)
   .embeddingTable(EmbeddingTable.builder()
           .name("my_embedding_table")
           .createOption(CreateOption.CREATE)
           .dimension(384) 
           .build())
   .build();
```

如果表已存在，上述选项会失败。此时可使用 CREATE_IF_NOT_EXISTS 选项：

```java
EmbeddingStore<TextSegment> embeddingStore = SQLServerEmbeddingStore.dataSourceBuilder()
   .dataSource(myDataSource)
   .embeddingTable(EmbeddingTable.builder()
           .name("my_embedding_table")
           .createOption(CreateOption.CREATE_IF_NOT_EXISTS)
           .dimension(384) 
           .build())
   .build();
```

如需重新创建表，可使用 CREATE_OR_REPLACE 选项：

```java
EmbeddingStore<TextSegment> embeddingStore = SQLServerEmbeddingStore.dataSourceBuilder()
   .dataSource(myDataSource)
   .embeddingTable(EmbeddingTable.builder()
           .name("my_embedding_table")
           .createOption(CreateOption.CREATE_OR_REPLACE)
           .dimension(384) 
           .build())
   .build();
```

如果已有表的列名与预定义列名不匹配，或希望使用不同的列名，可自定义表配置：

```java
SQLServerEmbeddingStore embeddingStore =
SQLServerEmbeddingStore.dataSourceBuilder()
    .dataSource(myDataSource)
    .embeddingTable(EmbeddingTable.builder()
            .createOption(CreateOption.CREATE_OR_REPLACE)
            .name("my_embedding_table")
            .idColumn("id_column_name")
            .embeddingColumn("embedding_column_name")
            .textColumn("text_column_name")
            .metadataColumn("metadata_column_name")
            .dimension(1024)
            .build())
    .build();
```

也可以直接配置 SQL Server 连接而无需提供 DataSource：

```java
SQLServerEmbeddingStore embeddingStore =
SQLServerEmbeddingStore.connectionBuilder()
    .host("localhost")
    .port(1433)
    .database("MyDatabase")
    .userName("myuser")
    .password("mypassword")
    .embeddingTable(EmbeddingTable.builder()
            .name("embeddings")
            .createOption(CreateOption.CREATE_OR_REPLACE)
            .dimension(384)
            .build())
    .build();
```

### 嵌入表结构

默认情况下，嵌入表包含以下列：

| 名称 | 类型 | 描述 |
| ---- |-------------------| ---- |
| id | NVARCHAR(36) | 主键，存储嵌入存储生成的 UUID 字符串 |
| embedding | VECTOR(dimension) | 使用 SQL Server 2025 原生向量类型存储嵌入 |
| text | NVARCHAR(MAX) | 存储文本段 |
| metadata | JSON | 使用 SQL Server 2025 原生 JSON 数据类型存储元数据 |


## 重要说明

### 数值类型
所有数字值均以 JSON 字符串形式写入元数据字段，以避免 `Long.MAX_VALUE` 等数字的溢出问题。

### 向量存储与相似度
SQL Server 2025+ 支持原生 VECTOR 数据类型，本模块使用 [VECTOR_DISTANCE](https://learn.microsoft.com/en-us/sql/t-sql/functions/vector-distance-transact-sql?view=sql-server-ver17) 相似度函数。
本模块支持以下 `VECTOR_DISTANCE` 函数的度量：

- **COSINE**：余弦相似度（默认）
- **EUCLIDEAN**：欧氏距离。欧氏度量需要进行额外计算以从距离得出评分。

### JSON 元数据支持

SQL Server 2025 提供原生 JSON 数据类型支持和 JSON 索引功能。本模块使用原生 JSON 数据类型存储元数据，并支持为优化元数据过滤而创建 JSON 索引，使用 [JSON_VALUE](https://learn.microsoft.com/es-es/sql/t-sql/functions/json-value-transact-sql?view=sql-server-ver17) 函数。

可以为特定元数据键配置 JSON 索引创建，并可选择指定键的排序方式：

```java
EmbeddingTable embeddingTable = EmbeddingTable.builder()
    .name("test_table")
    .createOption(CreateOption.CREATE_OR_REPLACE)
    .dimension(4)
    .build();

SQLServerEmbeddingStore embeddingStore =
    SQLServerEmbeddingStore.dataSourceBuilder()
        .dataSource(myDataSource)
        .embeddingTable(embeddingTable)
        .addIndex(Index.jsonIndexBuilder()
            .createOption(CreateOption.CREATE_OR_REPLACE)
            .key("author", String.class, JSONIndexBuilder.Order.ASC)
            .key("year", Integer.class)
            .build()
        )
        .build();
```

- 使用 `Index.jsonIndexBuilder()` 创建的索引不支持 `CreateOption.CREATE_IF_NOT_EXISTS` 选项。

## 限制

- 向量索引性能取决于数据大小和分布
- 不支持向量列的 DiskANN 索引
- 数据库排序规则应设置为区分大小写的排序规则，以支持元数据的大小写敏感字符串比较
- 不支持 DOT 距离度量
