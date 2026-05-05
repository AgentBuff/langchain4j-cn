---
sidebar_position: 28
---

# OceanBase

OceanBase 嵌入存储集成了 [OceanBase](https://www.oceanbase.com/) 数据库，提供向量相似度搜索和混合搜索功能。

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-oceanbase</artifactId>
    <version>${latest version here}</version>
</dependency>
```

注意：这是一个社区集成模块，可能需要在项目配置中添加 langchain4j-community 仓库。

## API 参考 {#api}

- `OceanBaseEmbeddingStore`

## 系统要求

- OceanBase 数据库实例（4.3.5 或更高版本）
- Java >= 17

## 功能特性

- 存储带元数据的嵌入（JSON 格式）
- 使用余弦、L2 或内积距离进行向量相似度搜索
- **混合搜索**：结合向量相似度搜索和全文搜索（RRF 算法）
- 按元数据字段和表列过滤搜索结果
- 自动创建表和向量索引
- 可自定义字段名称和距离度量

## 使用方式

### 基本示例

```java
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2q.AllMiniLmL6V2QuantizedEmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import dev.langchain4j.store.embedding.oceanbase.OceanBaseEmbeddingStore;

// 初始化嵌入模型
EmbeddingModel embeddingModel = new AllMiniLmL6V2QuantizedEmbeddingModel();

// 创建嵌入存储
OceanBaseEmbeddingStore embeddingStore = OceanBaseEmbeddingStore.builder()
    .url("jdbc:oceanbase://127.0.0.1:2881/test")
    .user("root@test")
    .password("password")
    .tableName("embeddings")
    .dimension(384)
    .build();

// 添加带元数据的文档
String id = embeddingStore.add(
    embeddingModel.embed("Java is a programming language").content(),
    TextSegment.from("Java is a programming language", 
        Metadata.from("category", "programming").put("language", "Java"))
);

// 搜索
Embedding queryEmbedding = embeddingModel.embed("programming language").content();
EmbeddingSearchResult<TextSegment> results = embeddingStore.search(
    EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)
        .maxResults(10)
        .build()
);

// 处理结果
results.matches().forEach(match -> {
    System.out.println("Score: " + match.score());
    System.out.println("Text: " + match.embedded().text());
    System.out.println("Metadata: " + match.embedded().metadata());
});
```

### 高级配置

```java
OceanBaseEmbeddingStore embeddingStore = OceanBaseEmbeddingStore.builder()
    .url("jdbc:oceanbase://127.0.0.1:2881/test")
    .user("root@test")
    .password("password")
    .tableName("embeddings")
    .dimension(384)
    .metricType("cosine")  // 选项："cosine"、"l2"、"ip"
    .retrieveEmbeddingsOnSearch(true)
    .idFieldName("id_field")
    .textFieldName("text_field")
    .metadataFieldName("metadata_field")
    .vectorFieldName("vector_field")
    .build();
```

## 距离度量

OceanBase 嵌入存储支持三种距离度量。距离值会自动转换为 [0, 1] 范围内的相关度评分，1 表示最相关匹配。

### 余弦距离（默认）- `"cosine"`

**适用场景：** 文本嵌入、语义相似度搜索

**工作原理：**
- OceanBase `cosine_distance` 返回 [0, 2] 范围内的值
  - `0` = 相同向量（方向相同）
  - `1` = 正交向量（垂直）
  - `2` = 相反向量（方向完全相反）
- 转换为相关度评分：`score = (2 - distance) / 2`
- 结果与向量大小无关

```java
.metricType("cosine")  // 默认，推荐用于文本嵌入
```

### L2 距离（欧氏）- `"l2"` 或 `"euclidean"`

**适用场景：** 方向和大小都重要时

**工作原理：**
- 测量向量之间的直线距离
- 范围：[0, ∞)
- 转换为相关度评分：`score = 1 / (1 + distance)`

```java
.metricType("l2")  // 或 "euclidean"
```

### 内积 - `"inner_product"` 或 `"ip"`

**适用场景：** 归一化嵌入、对性能要求高的应用

**工作原理：**
- 测量向量的点积
- 对于归一化向量，范围为 [-1, 1]
- 转换为相关度评分：`score = (inner_product + 1) / 2`

```java
.metricType("inner_product")  // 或 "ip"
```

**参考：** [OceanBase 向量距离函数](https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000004475471)

## 过滤

OceanBase 嵌入存储支持按元数据字段和表列过滤搜索结果。

### 按元数据字段过滤

```java
import dev.langchain4j.store.embedding.filter.MetadataFilterBuilder;
import static dev.langchain4j.store.embedding.filter.MetadataFilterBuilder.metadataKey;

// 按单个元数据字段过滤
Filter filter = metadataKey("category").isEqualTo("programming");

// 多条件过滤
Filter filter = new And(
    metadataKey("category").isEqualTo("programming"),
    metadataKey("language").isEqualTo("Java")
);

// 使用 IN 运算符过滤
Filter filter = metadataKey("language").isIn("Java", "Python", "C++");

// 带过滤的搜索
EmbeddingSearchResult<TextSegment> results = embeddingStore.search(
    EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)
        .filter(filter)
        .maxResults(10)
        .build()
);
```

### 按表列过滤

也可以直接按表列（id、text、metadata、vector）过滤：

```java
import dev.langchain4j.store.embedding.filter.comparison.IsIn;
import dev.langchain4j.store.embedding.filter.comparison.ContainsString;
import dev.langchain4j.store.embedding.filter.comparison.IsEqualTo;

// 按 ID 字段过滤
Filter filter = new IsIn("id", List.of("id1", "id2", "id3"));

// 按文本字段过滤（包含）
Filter textFilter = new ContainsString("text", "programming");

// 按文本精确匹配过滤
Filter exactTextFilter = new IsEqualTo("text", "Java programming");
```

**注意**：按表列过滤时，使用 `FieldDefinition` 中定义的实际字段名称。映射器自动识别常见别名：
- `id` → id 字段
- `text` 或 `document` → text 字段
- `metadata` → metadata 字段
- `vector` 或 `embedding` → vector 字段

### 支持的过滤操作

- `isEqualTo`：等于比较
- `isNotEqualTo`：不等于比较
- `isGreaterThan`：大于比较
- `isGreaterThanOrEqualTo`：大于等于比较
- `isLessThan`：小于比较
- `isLessThanOrEqualTo`：小于等于比较
- `isIn`：IN 操作（多个值）
- `isNotIn`：NOT IN 操作
- `containsString`：LIKE 操作（模式匹配）
- `And`：逻辑与
- `Or`：逻辑或
- `Not`：逻辑非

## 混合搜索

混合搜索将向量相似度搜索与全文搜索相结合，提供更好的搜索结果。启用后，它会自动在文本字段上创建全文索引，并使用**倒数排名融合（RRF）**算法合并结果。

### 启用混合搜索

```java
OceanBaseEmbeddingStore embeddingStore = OceanBaseEmbeddingStore.builder()
    .url("jdbc:oceanbase://127.0.0.1:2881/test")
    .user("root@test")
    .password("password")
    .tableName("embeddings")
    .dimension(384)
    .enableHybridSearch(true)  // 启用混合搜索
    .build();
```

### 执行混合搜索

```java
// 同时提供查询嵌入和查询文本以执行混合搜索
EmbeddingSearchResult<TextSegment> results = embeddingStore.search(
    EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)  // 用于相似度搜索的向量嵌入
        .query("search text")            // 用于全文搜索的文本查询
        .maxResults(10)
        .build()
);
```

### 混合搜索工作原理

1. **向量搜索**：使用查询嵌入执行相似度搜索
2. **全文搜索**：对文本字段使用 `MATCH AGAINST` 执行全文搜索
3. **结果融合**：使用 RRF（倒数排名融合）算法合并结果
   - 公式：`score = Σ(1 / (k + rank))`，其中 k=60
   - 两次搜索的每个结果根据其排名贡献最终评分
   - 结果被归一化并按合并后的 RRF 评分排序

**优势：**
- 更高召回率：通过语义相似度或精确关键词找到文档
- 提升精度：RRF 有效平衡两种搜索类型
- 比纯向量搜索更好地处理精确关键词匹配

## 实现细节

### 评分计算

嵌入存储在 SQL 查询中直接计算相关度评分：
- **余弦**：`score = (2 - cosine_distance) / 2`
- **L2/欧氏**：`score = 1 / (1 + distance)`
- **内积**：`score = (inner_product + 1) / 2`

评分返回范围为 [0, 1]，1 表示最相关匹配。

### 元数据处理

- 元数据以 JSON 形式存储在数据库中
- 大型 `Long` 值（> 2^53-1）自动序列化为字符串以保持精度
- 过滤支持直接列过滤和 JSON 元数据过滤

### 表结构

默认情况下，嵌入表包含以下列：

| 名称 | 类型 | 描述 |
| ---- | ---- | ---- |
| id | VARCHAR(36) | 主键，存储嵌入存储生成的 UUID 字符串 |
| vector | JSON | 将嵌入向量存储为 JSON 数组 |
| text | TEXT | 存储文本段 |
| metadata | JSON | 将元数据存储为 JSON |

## 限制

- 尚不支持 `removeAll(Filter)` 和 `removeAll()` 方法，请改用 `removeAll(Collection<String> ids)`。
- 按表列过滤时，字段名称不区分大小写，但必须与实际列名或已识别的别名匹配。

## 参考资料

- [OceanBase 文档](https://www.oceanbase.com/docs)
- [倒数排名融合](https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking)
- [LangChain4j 文档](https://docs.langchain4j.dev)
