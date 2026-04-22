---
sidebar_position: 19
---

# PGVector

LangChain4j 与 [PGVector](https://github.com/pgvector/pgvector) 无缝集成，允许开发者直接在 PostgreSQL 中存储和查询向量嵌入。此集成非常适合语义搜索、RAG 等应用场景。

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-pgvector</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## Gradle 依赖

```implementation 'dev.langchain4j:langchain4j-pgvector:1.13.0-beta23'```

## API 参考 {#api}

- `PgVectorEmbeddingStore`

## 参数说明

| 参数 | 描述 | 默认值 | 必填/可选 |
|---|---|---|---|
| `datasource` | 用于数据库连接的 `DataSource` 对象。仅在 `PgVectorEmbeddingStore.datasourceBuilder()` builder 变体中可用。如果未提供，则必须在 `PgVectorEmbeddingStore.builder()` builder 变体中单独提供 `host`、`port`、`user`、`password` 和 `database`。 | 无 | 如果未单独提供 `host`、`port`、`user`、`password` 和 `database`，则必填。 |
| `host` | PostgreSQL 服务器主机名。如果未提供 `DataSource` 则必填。 | 无 | 未提供 `DataSource` 时必填 |
| `port` | PostgreSQL 服务器端口号。如果未提供 `DataSource` 则必填。 | 无 | 未提供 `DataSource` 时必填 |
| `user` | 数据库身份验证用户名。如果未提供 `DataSource` 则必填。 | 无 | 未提供 `DataSource` 时必填 |
| `password` | 数据库身份验证密码。如果未提供 `DataSource` 则必填。 | 无 | 未提供 `DataSource` 时必填 |
| `database` | 要连接的数据库名称。如果未提供 `DataSource` 则必填。 | 无 | 未提供 `DataSource` 时必填 |
| `table` | 用于存储嵌入的数据库表名。 | 无 | 必填 |
| `dimension` | 嵌入向量的维度，应与所用嵌入模型匹配。可使用 `embeddingModel.dimension()` 动态设置。 | 无 | 必填 |
| `useIndex` | IVFFlat 索引将向量划分为列表，然后搜索最接近查询向量的子集列表。构建时间更快，内存使用更少，但查询性能低于 HNSW（就速度-召回率权衡而言）。使用 [IVFFlat](https://github.com/pgvector/pgvector#ivfflat) 索引。 | `false` | 可选 |
| `indexListSize` | IVFFlat 索引的列表数量。 | 无 | 当 `useIndex` 为 `true` 时必填，且必须大于零，否则表初始化时会抛出异常。当 `useIndex` 为 `false` 时忽略此属性。 |
| `createTable` | 是否自动创建嵌入表。 | `true` | 可选 |
| `dropTableFirst` | 是否在重建表之前先删除表（适用于测试）。 | `false` | 可选 |
| `searchMode` | 搜索模式。选项：**VECTOR**：使用余弦距离的标准向量相似度搜索。**HYBRID**：使用倒数排名融合（RRF）将向量搜索与全文关键词搜索相结合。 | `VECTOR` | 可选 |
| `rrfK` | RRF（倒数排名融合）算法中使用的常数 `k`：`Score = 1/(k + rank_vector) + 1/(k + rank_keyword)`。较低的值（20-40）更强调顶部结果；较高的值（80-100）创建更平衡的排名。仅在 `searchMode` 为 `HYBRID` 时相关。 | `60` | 可选，仅在 HYBRID 搜索模式下使用。 |
| `textSearchConfig` | 用于关键词搜索的 PostgreSQL 文本搜索配置名称（例如 `simple`、`english`、`german`）。仅在 `searchMode` 为 `HYBRID` 时适用。 | `simple` | 可选，仅在 HYBRID 搜索模式下使用。 |
| `metadataStorageConfig` | 处理与嵌入关联的元数据的配置对象。支持三种存储模式：**COLUMN_PER_KEY**：在提前知道元数据键时使用的静态元数据。**COMBINED_JSON**：在不提前知道元数据键时使用的动态元数据，以 JSON 格式存储（默认）。**COMBINED_JSONB**：类似于 JSON，但以二进制格式存储，针对大型数据集的查询进行了优化。 | `COMBINED_JSON` | 可选，如果未设置，则使用 `COMBINED_JSON` 的默认配置。 |

## 示例

为演示 PGVector 的功能，可以使用 Docker 化的 PostgreSQL 设置，利用 Testcontainers 运行带 PGVector 的 PostgreSQL。

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

以下两个代码示例展示了如何创建 `PgVectorEmbeddingStore`。第一个仅使用必填参数，第二个配置所有可用参数。

1. 仅使用必填参数

```java
EmbeddingStore<TextSegment> embeddingStore = PgVectorEmbeddingStore.builder()
        .host("localhost")                           // 必填：PostgreSQL 实例主机
        .port(5432)                                  // 必填：PostgreSQL 实例端口
        .database("postgres")                        // 必填：数据库名称
        .user("my_user")                             // 必填：数据库用户
        .password("my_password")                     // 必填：数据库密码
        .table("my_embeddings")                      // 必填：存储嵌入的表名
        .dimension(embeddingModel.dimension())       // 必填：嵌入维度
        .build();
```

2. 设置所有参数

此变体包含所有常用的可选参数，如 useIndex、indexListSize、createTable、dropTableFirst 和 metadataStorageConfig，请根据需要调整这些值：

```java
EmbeddingStore<TextSegment> embeddingStore = PgVectorEmbeddingStore.builder()
        // 必填参数
        .host("localhost")
        .port(5432)
        .database("postgres")
        .user("my_user")
        .password("my_password")
        .table("my_embeddings")
        .dimension(embeddingModel.dimension())

        // 可选参数
        .useIndex(true)                             // 启用 IVFFlat 索引
        .indexListSize(100)                         // IVFFlat 索引的列表数量
        .createTable(true)                          // 如果表不存在则自动创建
        .dropTableFirst(false)                      // 不先删除表（若想全新开始则设为 true）
        .metadataStorageConfig(MetadataStorageConfig.combinedJsonb()) // 将元数据存储为合并的 JSONB 列

        .build();
```

使用第一个示例可以快速开始最简配置，第二个示例展示了如何利用所有可用的 builder 参数以获得更多控制和自定义。

## 使用 PGVector 的完整 RAG 示例

本节演示如何使用带 PGVector 扩展的 PostgreSQL 构建完整的检索增强生成（RAG）系统。

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
EmbeddingStore<TextSegment> embeddingStore = PgVectorEmbeddingStore.builder()
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
List<EmbeddingMatch<TextSegment>> relevantSegments = embeddingStore.findRelevant(
        questionEmbedding,
        3  // 检索前 3 个最相似的块
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

EmbeddingStore<TextSegment> embeddingStore = PgVectorEmbeddingStore.datasourceBuilder()
        .datasource(dataSource)
        .table("document_embeddings")
        .dimension(384)
        .build();
```

#### 2. 索引优化
对于大型数据集（>10 万个嵌入），启用 IVFFlat 索引以提升查询性能：

```java
EmbeddingStore<TextSegment> embeddingStore = PgVectorEmbeddingStore.builder()
        // ... 其他配置 ...
        .useIndex(true)
        .indexListSize(100)  // 根据数据集大小调整
        .build();
```

**注意**：在大型数据集上创建索引可能需要时间，需在查询速度和索引构建时间之间取得平衡。

#### 3. 元数据存储
为在大型数据集上获得更好的查询性能，使用 JSONB 存储元数据：

```java
import dev.langchain4j.store.embedding.pgvector.MetadataStorageConfig;

EmbeddingStore<TextSegment> embeddingStore = PgVectorEmbeddingStore.builder()
        // ... 其他配置 ...
        .metadataStorageConfig(MetadataStorageConfig.combinedJsonb())
        .build();
```

#### 4. 块大小调整
根据您的使用场景尝试不同的块大小：
- **较小的块（200-300 个 token）**：精度更高，答案更具体
- **较大的块（500-800 个 token）**：上下文更多，但可能降低相关性

#### 5. 错误处理
始终优雅地处理数据库连接失败：

```java
try {
    embeddingStore.add(embedding, textSegment);
} catch (Exception e) {
    logger.error("Failed to store embedding", e);
    // 实现重试逻辑或回退行为
}
```

### 混合搜索（向量 + 关键词）

PGVector 支持**混合搜索**，将向量相似度搜索与 PostgreSQL 的全文关键词搜索相结合。这种方法通常比纯向量搜索提供更好的结果，因为它同时利用了语义理解和精确关键词匹配。

#### 何时使用混合搜索

- 需要同时进行语义相似度和精确关键词匹配时
- 查询包含领域特定术语、产品名称或技术术语时
- 需要提高 RAG 应用中的检索准确性时

#### 配置

通过设置 `searchMode` 参数启用混合搜索：

```java
import dev.langchain4j.store.embedding.pgvector.SearchMode;

EmbeddingStore<TextSegment> embeddingStore = PgVectorEmbeddingStore.builder()
        .host("localhost")
        .port(5432)
        .database("postgres")
        .user("my_user")
        .password("my_password")
        .table("document_embeddings")
        .dimension(embeddingModel.dimension())
        .searchMode(SearchMode.HYBRID)  // 启用混合搜索（默认：SearchMode.VECTOR）
        .textSearchConfig("english")    // 可选：PostgreSQL 文本搜索配置（默认："simple"）
        .rrfK(60)    // 可选：RRF 算法参数（默认：60）
        .build();
```

#### 用法

使用混合搜索时，必须**同时**提供嵌入和查询文本：

```java
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;

String question = "How to configure PostgreSQL vector search?";

// 为查询生成嵌入
Embedding questionEmbedding = embeddingModel.embed(question).content();

// 使用嵌入和文本进行搜索（HYBRID 模式下必须提供文本）
EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
        .queryEmbedding(questionEmbedding)  // 用于向量相似度搜索
        .query(question)                    // 用于关键词搜索（HYBRID 模式下必填）
        .maxResults(3)
        .build();

List<EmbeddingMatch<TextSegment>> results = embeddingStore.search(request);
```

#### 工作原理

混合搜索使用**倒数排名融合（RRF）**合并结果：

1. **向量搜索**：使用余弦相似度查找语义相似的文本
2. **关键词搜索**：使用 PostgreSQL 的 `tsvector` 查找包含匹配关键词的文本
3. **RRF 融合**：使用以下公式合并排名：

```
RRF_Score = 1/(k + rank_vector) + 1/(k + rank_keyword)
```

其中：
- `k` 是常数（可通过 `rrfK()` 配置，默认：60）
- `rank_vector` 是向量搜索中的排名位置（1 = 最佳匹配）
- `rank_keyword` 是关键词搜索中的排名位置（1 = 最佳匹配）

**评分计算示例**（k = 80）：

如果文档在向量和关键词搜索中均排名第 1：
```
Score = 1/(80+1) + 1/(80+1)
      = 1/81 + 1/81
      ≈ 0.0247
```

**评分范围说明**
- 最高分为 `2/(k+1)`，即结果在两次搜索中均排名第一时（例如 k=60 → ~0.0328；k=80 → ~0.0247）。
- 随着排名增大，评分趋近于 0；它们**不会**达到 1.0。
- RRF 评分基于排名，不能与纯向量搜索的余弦相似度（0.0-1.0）直接比较。

#### 与纯向量搜索的主要区别

| 方面 | 向量搜索 | 混合搜索 |
|------|--------|--------|
| **查询输入** | 仅 `queryEmbedding` | 同时需要 `queryEmbedding` 和 `query` 文本 |
| **评分类型** | 余弦相似度（0.0-1.0） | 基于排名的 RRF 评分（最大 `≈ 2/(k+1)`；k=60 时约 0.033） |
| **最适合** | 语义相似度、释义 | 精确关键词 + 语义含义 |

#### 调整 RRF 参数

调整 `rrfK` 参数以控制排名敏感度：

```java
.rrfK(40)   // 对顶部排名结果赋予更多权重（顶部匹配的评分更高）
.rrfK(80)   // 顶部和较低排名结果之间更加平衡
```

- **较低 k（20-40）**：更强调顶部排名结果
- **较高 k（80-100）**：更平衡的排名分布
- **默认（60）**：适合大多数使用场景的良好平衡

### Spring Boot 集成

关于将 pgvector 与 Spring Boot 微服务集成的完整生产就绪示例，请参阅 [pgvector RAG Spring Boot 示例](https://github.com/langchain4j/langchain4j-examples/tree/main/pgvector-rag-springboot)。

该示例演示：
- PgVectorEmbeddingStore 的 Spring Boot 自动配置
- 用于文档摄取和查询的 REST API 端点
- 适当的连接池和错误处理
- 用于本地开发的 Docker Compose 设置

- [更多示例](https://github.com/langchain4j/langchain4j-examples/tree/main/pgvector-example/src/main/java)
