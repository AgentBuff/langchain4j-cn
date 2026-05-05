---
sidebar_position: 25
---

# YugabyteDB

[YugabyteDB](https://www.yugabyte.com/) 是一个分布式 SQL 数据库，提供 PostgreSQL 兼容性，具备跨多个区域的水平可扩展性和高可用性。YugabyteDB 通过 `pgvector` 扩展提供原生向量搜索功能，是在分布式环境中存储和查询向量嵌入的绝佳选择。

## Maven 依赖

:::note
由于 YugabyteDB 支持是 `langchain4j-community` 的一部分，将从 `1.13.0-beta23` 或更高版本开始提供。
:::

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-yugabytedb</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```


## API 参考 {#api}

YugabyteDB 集成提供三个主要类：

### `YugabyteDBEmbeddingStore`

存储和搜索向量嵌入的主要接口。实现了 LangChain4j 的 `EmbeddingStore` 接口，提供以下方法：
- 添加嵌入（单个或批量）
- 搜索相似嵌入
- 删除嵌入
- 按元数据过滤

### `YugabyteDBEngine`

使用 HikariCP 管理数据库连接和连接池。该类：
- 处理 JDBC 连接配置
- 管理连接池设置（最大池大小、超时等）
- 支持 PostgreSQL JDBC 驱动程序和 YugabyteDB Smart Driver
- 提供 SSL/TLS 配置选项

### `YugabyteDBSchema`

定义数据库模式配置，包括：
- 表和列名称
- 向量索引类型（HNSW 或 NoIndex）
- 距离度量（COSINE、EUCLIDEAN、DOT_PRODUCT）
- 元数据存储配置
- 表创建设置

## 使用示例

### 基本 YugabyteDBEmbeddingStore

创建 `YugabyteDBEmbeddingStore` 实例的方式：

```java
YugabyteDBEmbeddingStore store = YugabyteDBEmbeddingStore.builder()
    .<builderParameters>
    .build();
```

其中 `<builderParameters>` 必须包含 `dimension` 和 `engine`，以及其他可选参数。

## 参数说明

### YugabyteDBEngine 参数

| 参数 | 描述 | 默认值 | 必填/可选 |
| --- | --- | --- | --- |
| `host` | YugabyteDB 服务器主机名 | `localhost` | 使用 engine builder 时必填 |
| `port` | YugabyteDB 服务器端口号 | `5433` | 使用 engine builder 时必填 |
| `database` | 要连接的数据库名称 | `yugabyte` | 使用 engine builder 时必填 |
| `username` | 数据库身份验证用户名 | `yugabyte` | 使用 engine builder 时必填 |
| `password` | 数据库身份验证密码 | `""`（空） | 使用 engine builder 时必填 |
| `schema` | 数据库模式名称 | `public` | 可选 |
| `usePostgreSQLDriver` | 使用 PostgreSQL JDBC 驱动程序而非 YugabyteDB Smart Driver | `false` | 可选 |
| `useSsl` | 为数据库连接启用 SSL/TLS | `false` | 可选 |
| `sslMode` | SSL 模式配置 | `disable` | 可选 |
| `maxPoolSize` | 连接池中的最大连接数 | `10` | 可选 |
| `minPoolSize` | 连接池中的最小空闲连接数 | `5` | 可选 |
| `connectionTimeout` | 连接超时（毫秒） | `10000` | 可选 |
| `idleTimeout` | 空闲超时（毫秒） | `300000` | 可选 |
| `maxLifetime` | 连接最大生命周期（毫秒） | `900000` | 可选 |
| `applicationName` | 连接标识的应用名称 | `langchain4j-yugabytedb` | 可选 |

### YugabyteDBEmbeddingStore 参数

| 参数 | 描述 | 默认值 | 必填/可选 |
| --- | --- | --- | --- |
| `engine` | 用于数据库连接的 `YugabyteDBEngine` 实例 | 无 | **必填** |
| `dimension` | 嵌入向量的维度，应与所用嵌入模型匹配。可使用 `embeddingModel.dimension()` 动态设置。 | 无 | **必填** |
| `tableName` | 用于存储嵌入的数据库表名 | `langchain4j_embeddings` | 可选 |
| `schemaName` | 数据库模式名称 | `public` | 可选 |
| `idColumn` | ID 列名称 | `id` | 可选 |
| `contentColumn` | 内容/文本列名称 | `content` | 可选 |
| `embeddingColumn` | 嵌入向量列名称 | `embedding` | 可选 |
| `metadataColumn` | 元数据列名称 | `metadata` | 可选 |
| `metricType` | 相似度搜索的距离度量：`COSINE`、`EUCLIDEAN` 或 `DOT_PRODUCT` | `COSINE` | 可选 |
| `vectorIndex` | 向量索引配置（见下方索引配置） | 使用默认设置的 `HNSWIndex` | 可选 |
| `createTableIfNotExists` | 是否自动创建嵌入表 | `true` | 可选 |
| `metadataStorageConfig` | 元数据存储配置对象。支持三种存储模式：<br/>• `COMBINED_JSONB`：动态元数据以 JSONB 格式存储，优化查询（推荐）<br/>• `COMBINED_JSON`：动态元数据以 JSON 格式存储<br/>• `COLUMN_PER_KEY`：提前知道元数据键时使用的静态元数据 | `COMBINED_JSONB` | 可选 |

### 索引配置

#### HNSW 索引参数

| 参数 | 描述 | 默认值 | 必填/可选 |
| --- | --- | --- | --- |
| `m` | 每层的最大连接数。值越大 = 召回率越高，但内存使用更多 | `16` | 可选 |
| `efConstruction` | 构建期间动态候选列表大小。值越大 = 索引质量越好，但构建时间越长 | `64` | 可选 |
| `metricType` | 距离度量：`COSINE`、`EUCLIDEAN` 或 `DOT_PRODUCT` | `COSINE` | 可选 |
| `name` | 自定义索引名称 | 自动生成 | 可选 |

#### NoIndex

使用 `new NoIndex()` 进行无索引的顺序扫描。适用于小型数据集（< 10,000 个向量）或需要精确结果时。

### 基本用法

```java
// 首先创建 engine
YugabyteDBEngine engine = YugabyteDBEngine.builder()
    .host("localhost")
    .port(5433)
    .database("yugabyte")
    .username("yugabyte")
    .password("")
    .usePostgreSQLDriver(true) // 使用 PostgreSQL JDBC 驱动程序
    .build();

// 最简配置
YugabyteDBEmbeddingStore store = YugabyteDBEmbeddingStore.builder()
    .engine(engine)
    .dimension(384)
    .build();

// 自定义配置
YugabyteDBEmbeddingStore store = YugabyteDBEmbeddingStore.builder()
    .engine(engine)
    .dimension(768)
    .tableName("my_embeddings")
    .metricType(MetricType.EUCLIDEAN)
    .build();
```

### 使用 YugabyteDBEngine

如需更多连接设置控制，使用 `YugabyteDBEngine`：

```java
// 创建带自定义设置的 engine
YugabyteDBEngine engine = YugabyteDBEngine.builder()
    .host("localhost")
    .port(5433)
    .database("yugabyte")
    .username("yugabyte")
    .password("")
    .maxPoolSize(20)
    .minPoolSize(5)
    .connectionTimeout("30000")
    .idleTimeout("300000")
    .maxLifetime("900000")
    .useSsl(false)
    .usePostgreSQLDriver(false) // 使用 YugabyteDB Smart Driver
    .build();

// 在嵌入存储中使用 engine
YugabyteDBEmbeddingStore store = YugabyteDBEmbeddingStore.builder()
    .engine(engine)
    .dimension(384)
    .tableName("embeddings")
    .build();
```

### 向量索引配置

YugabyteDB 支持不同类型的向量索引以优化相似度搜索：

#### HNSW 索引（推荐）

```java
// 创建 engine
YugabyteDBEngine engine = YugabyteDBEngine.builder()
    .host("localhost")
    .port(5433)
    .database("yugabyte")
    .username("yugabyte")
    .password("")
    .build();

// 带自定义参数的 HNSW 索引
HNSWIndex hnswIndex = HNSWIndex.builder()
    .m(16)                    // 每层最大连接数
    .efConstruction(64)       // 构建质量
    .metricType(MetricType.COSINE)
    .name("my_hnsw_index")
    .build();

YugabyteDBEmbeddingStore store = YugabyteDBEmbeddingStore.builder()
    .engine(engine)
    .dimension(384)
    .vectorIndex(hnswIndex)
    .build();
```

#### 无索引（顺序扫描）

```java
// 创建 engine
YugabyteDBEngine engine = YugabyteDBEngine.builder()
    .host("localhost")
    .port(5433)
    .database("yugabyte")
    .username("yugabyte")
    .password("")
    .build();

// 无索引用于精确搜索（较慢但结果精确）
YugabyteDBEmbeddingStore store = YugabyteDBEmbeddingStore.builder()
    .engine(engine)
    .dimension(384)
    .vectorIndex(new NoIndex()) // 顺序扫描
    .build();
```

### 添加和搜索嵌入

```java
// 首先创建 engine
YugabyteDBEngine engine = YugabyteDBEngine.builder()
    .host("localhost")
    .port(5433)
    .database("yugabyte")
    .username("yugabyte")
    .password("")
    .build();

// 创建嵌入存储
YugabyteDBEmbeddingStore store = YugabyteDBEmbeddingStore.builder()
    .engine(engine)
    .dimension(384)
    .build();

// 添加嵌入
TextSegment segment1 = TextSegment.from("YugabyteDB is a distributed SQL database");
Embedding embedding1 = embeddingModel.embed(segment1).content();
String id1 = store.add(embedding1, segment1);

TextSegment segment2 = TextSegment.from("PostgreSQL compatibility with horizontal scalability");
Embedding embedding2 = embeddingModel.embed(segment2).content();
String id2 = store.add(embedding2, segment2);

// 搜索嵌入
Embedding queryEmbedding = embeddingModel.embed("What is YugabyteDB?").content();
EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
    .queryEmbedding(queryEmbedding)
    .maxResults(5)
    .minScore(0.7)
    .build();

List<EmbeddingMatch<TextSegment>> matches = store.search(request).matches();
matches.forEach(match -> {
    System.out.println("Score: " + match.score());
    System.out.println("Text: " + match.embedded().text());
});
```

### 元数据存储配置

YugabyteDB 支持不同的元数据存储模式：

```java
// 创建 engine
YugabyteDBEngine engine = YugabyteDBEngine.builder()
    .host("localhost")
    .port(5433)
    .database("yugabyte")
    .username("yugabyte")
    .password("")
    .build();

// JSONB 存储（推荐用于 PostgreSQL 兼容性）
MetadataStorageConfig jsonbConfig = MetadataStorageConfig.builder()
    .storageMode(MetadataStorageMode.COMBINED_JSONB)
    .build();

// JSON 存储
MetadataStorageConfig jsonConfig = MetadataStorageConfig.builder()
    .storageMode(MetadataStorageMode.COMBINED_JSON)
    .build();

// 每键一列存储
MetadataStorageConfig columnConfig = MetadataStorageConfig.builder()
    .storageMode(MetadataStorageMode.COLUMN_PER_KEY)
    .build();

YugabyteDBEmbeddingStore store = YugabyteDBEmbeddingStore.builder()
    .engine(engine)
    .dimension(384)
    .metadataStorageConfig(jsonbConfig)
    .build();
```

### 驱动程序配置

YugabyteDB 同时支持 PostgreSQL JDBC 驱动程序和 YugabyteDB Smart Driver：

```java
// PostgreSQL JDBC 驱动程序（标准 SQL 兼容性）
YugabyteDBEngine postgresEngine = YugabyteDBEngine.builder()
    .host("localhost")
    .port(5433)
    .database("yugabyte")
    .username("yugabyte")
    .password("")
    .usePostgreSQLDriver(true)
    .build();

YugabyteDBEmbeddingStore postgresStore = YugabyteDBEmbeddingStore.builder()
    .engine(postgresEngine)
    .dimension(384)
    .build();

// YugabyteDB Smart Driver（高级分布式特性）
YugabyteDBEngine smartEngine = YugabyteDBEngine.builder()
    .host("localhost")
    .port(5433)
    .database("yugabyte")
    .username("yugabyte")
    .password("")
    .usePostgreSQLDriver(false) // 默认：使用 Smart Driver
    .build();

YugabyteDBEmbeddingStore smartStore = YugabyteDBEmbeddingStore.builder()
    .engine(smartEngine)
    .dimension(384)
    .build();
```


## 索引类型

### HNSW (ybhnsw) - 推荐

- **适用场景**：大多数使用场景，尤其是大型数据集
- **性能**：快速近似相似度搜索，召回率高
- **参数**：
  - `m`（默认：16）：每层最大连接数
  - `efConstruction`（默认：64）：构建质量

### NoIndex - 顺序扫描

- **适用场景**：小型数据集（< 10,000 个向量）或需要精确结果时
- **性能**：精确搜索，但随数据集增大速度变慢

## 已知限制

- YugabyteDB 需要启用 `pgvector` 扩展才能进行向量操作
- 同一表中所有嵌入的向量维度必须一致
- HNSW 索引参数（`m`、`efConstruction`）影响性能和内存使用
- 顺序扫描（NoIndex）仅推荐用于小型数据集（< 10,000 个向量）

## 性能注意事项

- **HNSW 索引**：最适合大型数据集的生产使用，提供快速近似搜索
- **NoIndex**：仅适合小型数据集或需要精确结果时
- **连接池**：根据工作负载配置 `maxPoolSize` 和 `minPoolSize`
- **驱动程序选择**：YugabyteDB 推荐使用 PostgreSQL JDBC 驱动程序以获得更好的兼容性

## 示例

- [YugabyteDBEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/yugabytedb-example/src/main/java/YugabyteDBEmbeddingStoreExample.java) - 使用 Testcontainers 的基本示例
- [YugabyteDBEmbeddingStoreWithMetadataExample](https://github.com/langchain4j/langchain4j-examples/blob/main/yugabytedb-example/src/main/java/YugabyteDBEmbeddingStoreWithMetadataExample.java) - 使用 JSONB 存储的元数据过滤
- [YugabyteDBWithPostgreSQLDriverExample](https://github.com/langchain4j/langchain4j-examples/blob/main/yugabytedb-example/src/main/java/YugabyteDBWithPostgreSQLDriverExample.java) - 使用 PostgreSQL JDBC 驱动程序
- [YugabyteDBWithSmartDriverExample](https://github.com/langchain4j/langchain4j-examples/blob/main/yugabytedb-example/src/main/java/YugabyteDBWithSmartDriverExample.java) - 使用 YugabyteDB Smart Driver
