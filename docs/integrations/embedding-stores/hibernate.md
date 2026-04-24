---
sidebar_position: 19
---

# Hibernate

LangChain4j 与 [Hibernate](https://github.com/hibernate/hibernate-orm) 无缝集成，允许开发者在所有 Hibernate 支持的数据库中直接存储和查询向量嵌入。此集成非常适合语义搜索、RAG 等应用场景。

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-hibernate</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## Gradle 依赖

```implementation 'dev.langchain4j:langchain4j-hibernate:1.13.0-beta23'```

## API 参考 {#api}

- `HibernateEmbeddingStore`

## 参数说明

### 通用存储

当只想使用 `EmbeddingStore` API 而不关心 Hibernate 细节（如实体类定义和 Hibernate 配置）时，推荐使用此类型存储。

使用 `HibernateEmbeddingStore.dynamicBuilder()` 或 `HibernateEmbeddingStore.dynamicDatasourceBuilder()` 进行配置。

| 参数 | 描述 | 默认值 | 必填/可选 |
|---|---|---|---|
| `datasource` | 用于数据库连接的 `DataSource` 对象。仅在 `HibernateEmbeddingStore.dynamicDatasourceBuilder()` builder 变体中可用。如果未提供，则必须在 `HibernateEmbeddingStore.dynamicBuilder()` builder 变体中单独提供 `jdbcUrl`、`user` 和 `password`。 | 无 | 如果未单独提供 `jdbcUrl`、`user` 和 `password` 则必填。 |
| `jdbcUrl` | 数据库服务器的 JDBC URL。如果未提供 `DataSource` 和 `host`、`port`、`database`，则必填。仅在 `HibernateEmbeddingStore.dynamicBuilder()` builder 变体中可用。 | 无 | 未提供 `DataSource` 或 `host`、`port`、`database` 时必填 |
| `host` | 数据库服务器主机名。如果未提供 `DataSource` 或 `jdbcUrl` 则必填。仅在 `HibernateEmbeddingStore.dynamicBuilder()` builder 变体中可用。 | 无 | 未提供 `DataSource` 或 `jdbcUrl` 时必填 |
| `port` | 数据库服务器端口号。如果未提供 `DataSource` 或 `jdbcUrl` 则必填。仅在 `HibernateEmbeddingStore.dynamicBuilder()` builder 变体中可用。 | 无 | 未提供 `DataSource` 或 `jdbcUrl` 时必填 |
| `database` | 要连接的数据库名称。如果未提供 `DataSource` 或 `jdbcUrl` 则必填。仅在 `HibernateEmbeddingStore.dynamicBuilder()` builder 变体中可用。 | 无 | 未提供 `DataSource` 或 `jdbcUrl` 时必填 |
| `databaseKind` | 数据库类型。如果提供了 `DataSource` 或无法从 `jdbcUrl` 推断类型，则必填。 | 无 | 提供了 `DataSource` 或无法从 `jdbcUrl` 推断类型时必填 |
| `user` | 数据库身份验证用户名。如果未提供 `DataSource` 则必填。仅在 `HibernateEmbeddingStore.dynamicBuilder()` builder 变体中可用。 | 无 | 未提供 `DataSource` 时必填 |
| `password` | 数据库身份验证密码。如果未提供 `DataSource` 则必填。仅在 `HibernateEmbeddingStore.dynamicBuilder()` builder 变体中可用。 | 无 | 未提供 `DataSource` 时必填 |
| `table` | 用于存储嵌入的数据库表名。 | 无 | 必填 |
| `dimension` | 嵌入向量的维度，应与所用嵌入模型匹配。可使用 `embeddingModel.dimension()` 动态设置。 | 无 | 必填 |
| `createIndex` | 是否自动为向量嵌入创建索引。 | `false` | 可选 |
| `indexType` | 数据库特定的索引类型，例如 `ivfflat`、`hnsw`。IVFFlat 索引将向量划分为列表，然后搜索最接近查询向量的子集列表。构建时间更快，内存使用更少，但查询性能低于 HNSW。 | 无 | 可选，默认为首选索引类型，例如 PostgreSQL 上的 `ivfflat` |
| `indexOptions` | 用于配置向量嵌入索引的选项。 | 无 | 当 `createIndex` 为 `true` 且索引类型为 `ivfflat` 时，PostgreSQL 上必须提供 `lists = 1` 选项且必须大于零，否则表初始化时会抛出异常。当 `createIndex` 为 `false` 时忽略此属性。 |
| `createTable` | 是否自动创建嵌入表。 | `false` | 可选 |
| `dropTableFirst` | 是否在重建表之前先删除表（适用于测试）。 | `false` | 可选 |
| `distanceFunction` | 向量搜索使用的距离函数。支持因数据库而异：**COSINE**、**EUCLIDEAN**、**EUCLIDEAN_SQUARED**、**MANHATTAN**、**INNER_PRODUCT**、**NEGATIVE_INNER_PRODUCT**、**HAMMING**、**JACCARD** | `COSINE` | 可选，如果未设置，则使用 `COSINE` 的默认配置。 |

### 实体存储

当希望在 `EmbeddingStore` API 中使用已有的 Hibernate 实体模型，或应用数据模型自定义时，推荐使用实体存储。

使用 `HibernateEmbeddingStore.builder()` 进行配置。

| 参数 | 描述 | 默认值 | 必填/可选 |
|---|---|---|---|
| `sessionFactory` | `entityClass` 所在的 `SessionFactory` 对象。 | 无 | 必填 |
| `databaseKind` | 数据库类型。如果无法从 Hibernate ORM 方言推断类型，则必填。 | 无 | 无法从 Hibernate ORM 方言推断类型时必填 |
| `entityClass` | 指定用于 `EmbeddingStore` 的 `SessionFactory` 中的实体类。 | 无 | 必填 |
| `embeddingAttributeName` | 指定表示向量嵌入的实体属性名称。 | 无 | 可选，如果未设置，则扫描实体中带 `@Embedding` 注解的属性 |
| `embeddedTextAttributeName` | 指定表示向量嵌入源文本的实体属性名称。 | 无 | 可选，如果未设置，则扫描实体中带 `@EmbeddedText` 注解的属性 |
| `unmappedMetadataAttributeName` | 指定表示存储未映射元数据的 JSON 列的实体属性名称。 | 无 | 可选，如果未设置，则扫描实体中带 `@UnmappedMetadata` 注解的属性 |
| `metadataAttributeNames` | 指定显式映射到文本元数据的实体属性名称。 | 无 | 可选，如果未设置，则扫描实体中带 `@MetadataAttribute` 注解的属性 |
| `distanceFunction` | 向量搜索使用的距离函数。支持因数据库而异：**COSINE**、**EUCLIDEAN**、**EUCLIDEAN_SQUARED**、**MANHATTAN**、**INNER_PRODUCT**、**NEGATIVE_INNER_PRODUCT**、**HAMMING**、**JACCARD** | `COSINE` | 可选，如果未设置，则使用 `COSINE` 的默认配置。 |

## 示例

例如，可以使用 Docker 化的 PostgreSQL 设置来演示功能，利用 Testcontainers 运行带 PGVector 的 PostgreSQL。

#### 使用 Docker 快速启动

使用以下 Docker 命令快速设置带 PGVector 扩展的 PostgreSQL 实例：

```
docker run --rm --name langchain4j-postgres-test-container -p 5432:5432 -e POSTGRES_USER=my_user -e POSTGRES_PASSWORD=my_password pgvector/pgvector
```

#### 命令说明：

- `docker run`：运行新容器。
- `--rm`：容器停止后自动删除，确保无残留数据。
- `--name langchain4j-postgres-test-container`：将容器命名为 langchain4j-postgres-test-container 以便识别。
- `-p 5432:5432`：将本机 5432 端口映射到容器中的 5432 端口。
- `-e POSTGRES_USER=my_user`：将 PostgreSQL 用户名设置为 my_user。
- `-e POSTGRES_PASSWORD=my_password`：将 PostgreSQL 密码设置为 my_password。
- `pgvector/pgvector`：指定要使用的 Docker 镜像，已预配置 PGVector 扩展。

以下两个代码示例展示了如何创建 `HibernateEmbeddingStore`。第一个仅使用必填参数，第二个配置所有可用参数。

1. 仅使用必填参数

```java
HibernateEmbeddingStore embeddingStore = HibernateEmbeddingStore.dynamicBuilder()
        .databaseKind(DatabaseKind.POSTGRESQL)                  // 必填：数据库类型
        .host("localhost")                                      // 必填：数据库服务器主机
        .port(5432)                                             // 必填：数据库服务器端口
        .database("postgres")                                   // 必填：数据库名称
        .user("my_user")                                        // 必填：数据库用户
        .password("my_password")                                // 必填：数据库密码
        .table("my_embeddings")                                 // 必填：存储嵌入的表名
        .dimension(embeddingModel.dimension())                  // 必填：嵌入维度
        .build();
```

2. 设置所有参数

此变体包含所有常用的可选参数，如 createIndex、indexOptions、createTable、dropTableFirst 和 distanceFunction，请根据需要调整：

```java
HibernateEmbeddingStore embeddingStore = HibernateEmbeddingStore.dynamicBuilder()
        // 必填参数
        .databaseKind(DatabaseKind.POSTGRESQL)
        .host("localhost")
        .port(5432)
        .database("postgres")
        .user("my_user")
        .password("my_password")
        .table("my_embeddings")
        .dimension(embeddingModel.dimension())

        // 可选参数
        .createIndex(true)                              // 启用向量索引创建
        .indexType("ivfflat")                           // 索引类型 IVFFlat
        .indexOptions("lists = 100")                    // IVFFlat 索引的列表数量
        .createTable(true)                              // 如果表不存在则自动创建
        .dropTableFirst(false)                          // 不先删除表（若想全新开始则设为 true）
        .distanceFunction(DistanceFunction.MANHATTEN)   // 使用 MANHATTAN 距离函数进行向量搜索

        .build();
```

使用第一个示例可以快速开始最简配置，第二个示例展示了如何利用所有可用的 builder 参数以获得更多控制和自定义。

不再需要时，请记得关闭 `HibernateEmbeddingStore` 以释放底层 Hibernate 资源。

#### 自定义 Hibernate 实体

当希望自定义数据模型或重用现有实体作为 `EmbeddingStore` 的数据源时，可以使用注解 `@Embedding`、`@EmbeddedText`、`@UnmappedMetadata` 和 `@MetadataAttribute` 标记 Hibernate `EmbeddingStore` 实现要使用的实体属性。

```java
@Entity
public class MyEmbeddingEntity {
    @Id
    UUID id;
    @Embedding
    @Array(length = 384)                // 基于嵌入模型的嵌入向量维度
    float[] embedding;
    @EmbeddedText
    String text;
    @UnmappedMetadata
    Map<String, Object> metadata;       // 可以是 Map<String, Object> 或 String
    
    @MetadataAttribute
    String mimeType;                    // 显式映射，与 TextSegment#metadata 同步
    @MetadataAttribute
    String fileName;                    // 显式映射，与 TextSegment#metadata 同步
}
```

builder 将查找这些注解并推导属性名称。

```java
HibernateEmbeddingStore embeddingStore = HibernateEmbeddingStore.builder()
        .sessionFactory(sessionFactory)         // 必填：包含实体类的 SessionFactory
        .entityClass(MyEmbeddingEntity.class)   // 必填：嵌入实体类
        .build();
```

如果不希望为实体模型添加注解，也可以显式提供属性名称：

```java
HibernateEmbeddingStore embeddingStore = HibernateEmbeddingStore.builder()
        .sessionFactory(sessionFactory)
        .entityClass(MyEmbeddingEntity.class)
        .embeddingAttributeName("embedding")
        .embeddedTextAttributeName("text")
        .unmappedMetadataAttributeName("metadata")
        .metadataAttributeNames("mimeType", "fileName")
        .build();
```

元数据也可以嵌套在同样带有 `@MetadataAttribute` 注解的 `@OneToOne`、`@ManyToOne` 或 `@Embedded` 属性中，或通过使用 `.`（点）分隔符指定显式属性路径。

```java
@Entity
public class Book {
    @Id
    private Long id;
    private String title;
    private String content;
    @MetadataAttribute
    @Embedded
    private BookDetails details = new BookDetails();
    @MetadataAttribute
    @ManyToOne(fetch = FetchType.LAZY)
    private Author author;

    @Embedding
    @Array(length = 384)
    private float[] embedding;
    @UnmappedMetadata
    private Map<String, Object> metadata;
}
@Entity
public class Author {
    @Id
    @MetadataAttribute
    @GeneratedValue
    private Long id;
    private String firstname;
    private String lastname;
}
@Embeddable
public class BookDetails {
    @MetadataAttribute
    private String language;
    private String abstractText;
}
```

等效的属性路径为 `details.language` 和 `author.id`，可通过指定这些路径作为元数据键用于过滤，例如：

```java
MetadataFilterBuilder.metadataKey("details.language").isEqualTo("English")
```

或

```java
MetadataFilterBuilder.metadataKey("author.id").isEqualTo(2L)
```

此外，`HibernateEmbeddingStore` API 还提供了 `search` 方法，允许使用类型安全的 Hibernate ORM `Restriction` API：

```java
HibernateEmbeddingStore<Book> embeddingStore = embeddingStore();
embeddingStore.search(
        embedding,
        Path.from(Book.class)
            .to(Book_.details)
            .to(BookDetails_.language)
            .equalTo("English"));
```

或

```java
HibernateEmbeddingStore<Book> embeddingStore = embeddingStore();
embeddingStore.search(
        embedding,
        Path.from(Book.class)
            .to(Book_.author)
            .to(Author_.id)
            .equalTo(2L));
```

## 使用 Hibernate 的完整 RAG 示例

本节演示如何使用带 PGVector 扩展的 PostgreSQL 通过 Hibernate 集成构建完整的检索增强生成（RAG）系统。

### 概述

RAG 系统由两个主要阶段组成：
1. **索引阶段（离线）**：加载文档、分割为块、生成嵌入并存储在 pgvector 中
2. **检索阶段（在线）**：嵌入用户查询、搜索相似块、将上下文注入 LLM 提示词

### 前提条件

确保已运行带 PGVector 的 PostgreSQL 实例（请参阅上面的 Docker 设置）。

### 1. 文档摄取（索引阶段）

此示例展示如何加载文档、将其分割为块并在 pgvector 中存储嵌入：

```java
import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.DocumentParser;
import dev.langchain4j.data.document.DocumentSplitter;
import dev.langchain4j.data.document.parser.apache.pdfbox.ApachePdfBoxDocumentParser;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor;

import static dev.langchain4j.data.document.loader.FileSystemDocumentLoader.loadDocument;

// 加载文档（PDF、TXT 等）
Document document = loadDocument("/path/to/document.pdf", new ApachePdfBoxDocumentParser());

// 将文档分割为更小的块
// 每块 300 个 token，50 个 token 重叠以保持上下文连续性
DocumentSplitter splitter = DocumentSplitters.recursive(300, 50);

// 创建嵌入模型（AllMiniLmL6V2 为 384 维）
EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();

// 创建 pgvector 嵌入存储
HibernateEmbeddingStore embeddingStore = HibernateEmbeddingStore.dynamicBuilder()
        .databaseKind(DatabaseKind.POSTGRESQL)
        .host("localhost")
        .port(5432)
        .database("postgres")
        .user("my_user")
        .password("my_password")
        .table("document_embeddings")
        .dimension(embeddingModel.dimension())  // AllMiniLmL6V2 为 384
        .build();

// 摄取：分割文档、生成嵌入并存储在 pgvector 中
EmbeddingStoreIngestor.builder()
        .documentSplitter(splitter)
        .embeddingModel(embeddingModel)
        .embeddingStore(embeddingStore)
        .build()
        .ingest(document);

System.out.println("文档摄取成功！");
```

### 2. 查询（检索阶段）

此示例展示如何使用用户问题查询 RAG 系统：

```java
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;

import java.util.List;
import java.util.stream.Collectors;

// 用户问题
String question = "What is the refund policy?";

// 为问题生成嵌入
Embedding questionEmbedding = embeddingModel.embed(question).content();

// 搜索最相似的文本段（前 3 个结果）
List<EmbeddingMatch<TextSegment>> relevantSegments = embeddingStore.search(
        EmbeddingSearchRequest.builder()
                .queryEmbedding(questionEmbedding)
                .maxResults(3)  // 检索前 3 个最相似的块
                .build()
);

// 从检索到的片段构建上下文
String context = relevantSegments.stream()
        .map(match -> match.embedded().text())
        .collect(Collectors.joining("\n\n"));

// 使用检索到的上下文创建提示词
String promptWithContext = String.format("""
        Answer the question based on the following context.
        If the context doesn't contain relevant information, say "I don't have enough information to answer."

        Context:
        %s

        Question: %s

        Answer:
        """, context, question);

// 带上下文发送给 LLM
ChatModel chatModel = OpenAiChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4")
        .build();

String answer = chatModel.generate(promptWithContext);
System.out.println("Answer: " + answer);
```

### 生产注意事项

以下是基于实际使用经验的生产部署重要注意事项：

#### 1. 连接池
对于生产环境，使用带连接池的 `DataSource` 而不是单独的连接参数：

```java
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

HikariConfig config = new HikariConfig();
config.setJdbcUrl("jdbc:postgresql://localhost:5432/postgres");
config.setUsername("my_user");
config.setPassword("my_password");
config.setMaximumPoolSize(10);

HikariDataSource dataSource = new HikariDataSource(config);

EmbeddingStore<TextSegment> embeddingStore = HibernateEmbeddingStore.dynamicDatasourceBuilder()
        .databaseKind(DatabaseKind.POSTGRESQL)
        .datasource(dataSource)
        .table("document_embeddings")
        .dimension(384)
        .build();
```

#### 2. 索引优化
对于大型数据集（>10 万个嵌入），在 PostgreSQL 上启用 IVFFlat 索引以提升查询性能：

```java
HibernateEmbeddingStore embeddingStore = HibernateEmbeddingStore.dynamicBuilder()
        // ... 其他配置 ...
        .createIndex(true)
        .indexOptions("lists = 100")  // 根据数据集大小调整
        .build();
```

**注意**：在大型数据集上创建索引可能需要时间，需在查询速度和索引构建时间之间取得平衡。
**注意**：索引维护可能会降低数据摄取速度，因此在摄取大量数据时，考虑先删除索引再重建。

#### 3. 块大小调整
根据您的使用场景尝试不同的块大小：
- **较小的块（200-300 个 token）**：精度更高，答案更具体
- **较大的块（500-800 个 token）**：上下文更多，但可能降低相关性

#### 4. 错误处理
始终优雅地处理数据库连接失败：

```java
try {
    embeddingStore.add(embedding, textSegment);
} catch (Exception e) {
    logger.error("Failed to store embedding", e);
    // 实现重试逻辑或回退行为
}
```

#### 5. 自定义 Hibernate 实体 DDL
使用自定义 Hibernate 实体时，您需要自行管理 DDL。
考虑创建 `import.sql` 文件来创建索引，例如对于 PostgreSQL：

```sql
create index if not exists my_entity_ivfflat_index 
    on my_entity using ivfflat(embedding vector_cosine_ops) with (lists = 1);
```

请参阅 [Hibernate ORM 文档](https://docs.hibernate.org/orm/7.2/userguide/html_single/)了解 `SessionFactory` 配置的详细信息。

其他数据库的向量索引语法和选项各不相同，请参阅相应数据库提供商的文档。

##### DB2

有关详细信息，请参阅[向量索引文章](https://community.ibm.com/community/user/blogs/christian-garcia-arellano/2025/10/04/vector-indexes-in-db2-an-early-preview)。

```sql
create vector index my_entity_vector_index 
    on my_entity(embedding) with distance cosine;
```

##### MariaDB

有关详细信息，请参阅 [`create index` 语句文档](https://mariadb.com/docs/server/reference/sql-statements/data-definition/create/create-index)。

```sql
create vector index if not exists my_entity_vector_index 
    on my_entity(embedding) distance=cosine;
```

##### MySQL

MySQL HeatWave [自动创建索引](https://dev.mysql.com/doc/heatwave/en/mys-hw-genai-vector-index-creation.html)，不需要手动创建索引。

##### PostgreSQL

有关详细信息，请参阅 [pgvector 文档](https://github.com/pgvector/pgvector?tab=readme-ov-file#indexing)。

```sql
create index if not exists my_entity_ivfflat_index
    on my_entity using ivfflat(embedding vector_cosine_ops) with (lists = 1);
```

##### Oracle

有关详细信息，请参阅 [`create index` 语句文档](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/create-vector-index.html)。

```sql
create vector index my_entity_vector_index 
    on my_entity(embedding) organization neighbor partitions with distance cosine;
```

##### SQL Server

有关详细信息，请参阅 [`create vector index` 语句文档](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-vector-index-transact-sql?view=sql-server-ver17)。

```sql
create vector index my_entity_vector_index 
    on my_entity(embedding) with (metric='cosine');
```
