---
sidebar_position: 30
---

# ArcadeDB

https://arcadedb.com/

ArcadeDB 是一个多模型 NoSQL 数据库，支持图、文档、键值、时序和向量数据。它提供内置的 LSM_VECTOR 索引（由 JVector/HNSW 驱动），用于高性能近似最近邻（ANN）向量搜索。

langchain4j 集成支持两种操作模式：

- **远程模式** — 通过 HTTP 连接到 ArcadeDB 服务器。适用于生产部署和共享基础设施。
- **嵌入模式** — 在同一 JVM 内进程运行 ArcadeDB。无需服务器或 Docker 容器；数据库存储在本地文件系统。适合测试、桌面应用或单进程工作负载。

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-arcadedb</artifactId>
    <version>${latest version here}</version>
</dependency>
```

注意：这是一个社区集成模块，可能需要在项目配置中添加 langchain4j-community 仓库。

## API 参考 {#api}

- `ArcadeDBEmbeddingStore`

## 功能特性

- **两种操作模式**：远程（HTTP 客户端连接 ArcadeDB 服务器）或嵌入（ArcadeDB 在进程内运行，无需服务器）
- **多模型数据库**：在 ArcadeDB 图模型中将嵌入存储为顶点，与文档、键值和时序数据共存
- **HNSW 向量索引**：使用 ArcadeDB 的 LSM_VECTOR 索引（基于 JVector）进行快速近似最近邻搜索
- **元数据过滤**：支持使用比较和逻辑运算符按元数据过滤搜索结果
- **持久化存储**：远程和嵌入模式下数据在重启后均可持久化
- **自动模式创建**：首次使用时自动创建顶点类型、属性和向量索引
- **多种相似度函数**：支持 COSINE（默认）、EUCLIDEAN 和 SQUARED_EUCLIDEAN 距离度量（远程模式）
- **批量操作**：单次调用添加多个嵌入
- **灵活删除**：可按 ID、按过滤条件删除或清除所有嵌入

## 基本用法

### 远程模式

远程模式连接到正在运行的 ArcadeDB 服务器。请参阅[使用 Docker 运行 ArcadeDB](#使用-docker-运行-arcadedb) 在本地启动一个服务器。

#### 连接到已有数据库

```java
EmbeddingStore<TextSegment> embeddingStore = ArcadeDBEmbeddingStore.builder()
    .host("localhost")
    .port(2480)
    .databaseName("my_database")
    .username("root")
    .password("playwithdata")
    .dimension(384)           // 必须与嵌入模型的维度一致
    .build();
```

#### 自动创建数据库

```java
EmbeddingStore<TextSegment> embeddingStore = ArcadeDBEmbeddingStore.builder()
    .host("localhost")
    .port(2480)
    .databaseName("my_database")
    .username("root")
    .password("playwithdata")
    .dimension(384)
    .createDatabase(true)     // 如果数据库不存在则创建
    .build();
```

### 嵌入模式

嵌入模式在同一 JVM 内运行 ArcadeDB。无需服务器——只需提供本地文件系统上用于存储数据库的路径。如果数据库不存在，将自动创建。

使用完毕后务必调用 `close()` 以释放资源。

```java
ArcadeDBEmbeddingStore embeddingStore = ArcadeDBEmbeddingStore.embeddedBuilder()
    .databasePath("/path/to/my-database")
    .dimension(384)           // 必须与嵌入模型的维度一致
    .build();

// ... 使用存储 ...

embeddingStore.close();
```

使用 try-finally（或通过包装器使用 try-with-resources）确保 `close()` 始终被调用：

```java
ArcadeDBEmbeddingStore embeddingStore = ArcadeDBEmbeddingStore.embeddedBuilder()
    .databasePath("/path/to/my-database")
    .dimension(384)
    .build();
try {
    // ... 使用存储 ...
} finally {
    embeddingStore.close();
}
```

### 添加和搜索嵌入

两种模式的搜索 API 相同：

```java
// 添加带嵌入的文本段
TextSegment segment = TextSegment.from("Hello, world!", Metadata.from("source", "example"));
Embedding embedding = embeddingModel.embed(segment).content();
embeddingStore.add(embedding, segment);

// 搜索相似嵌入
EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
    .queryEmbedding(queryEmbedding)
    .maxResults(5)
    .minScore(0.7)
    .build();

List<EmbeddingMatch<TextSegment>> matches = embeddingStore.search(request).matches();
```

## 配置选项

### 远程模式

```java
EmbeddingStore<TextSegment> embeddingStore = ArcadeDBEmbeddingStore.builder()
    .host("localhost")              // 必填：ArcadeDB 服务器主机名
    .port(2480)                     // 默认：2480（HTTP 端口）
    .databaseName("my_database")   // 必填：数据库名称
    .username("root")               // 必填：用户名
    .password("playwithdata")       // 必填：密码
    .typeName("EmbeddingDocument") // 默认："EmbeddingDocument" — 顶点类型名称
    .dimension(384)                 // 必填：嵌入向量维度
    .similarityFunction("COSINE")  // 默认："COSINE" — 相似度度量
    .maxConnections(16)             // 默认：16 — 每个节点的 HNSW 图连接数
    .beamWidth(100)                 // 默认：100 — HNSW 搜索束宽
    .createDatabase(false)          // 默认：false — 自动创建数据库
    .metadataPrefix("meta_")       // 默认："meta_" — 元数据属性前缀
    .build();
```

### 嵌入模式

```java
ArcadeDBEmbeddingStore embeddingStore = ArcadeDBEmbeddingStore.embeddedBuilder()
    .databasePath("/path/to/my-database") // 必填：数据库的本地文件系统路径
    .typeName("EmbeddingDocument")        // 默认："EmbeddingDocument" — 顶点类型名称
    .dimension(384)                        // 默认：384 — 嵌入向量维度
    .maxConnections(16)                    // 默认：16 — 每个节点的 HNSW 图连接数
    .beamWidth(100)                        // 默认：100 — HNSW 搜索束宽
    .metadataPrefix("")                    // 默认：""（无前缀）— 元数据属性前缀
    .build();
```

### 参数说明

**共享参数（两种模式均适用）：**

- **typeName**：用于存储嵌入文档的顶点类型。修改此值可在同一数据库中使用多个嵌入存储
- **dimension**：必须与嵌入模型的输出维度完全匹配
- **maxConnections**：控制 HNSW 索引中的图连接度。值越大召回率越高，但内存和索引构建时间增加。推荐：16–128
- **beamWidth**：控制 HNSW 索引构建和搜索的质量。值越大召回率越高，但速度降低。推荐：100–500
- **metadataPrefix**：存储为顶点属性时应用于元数据键的前缀。如果元数据键与内置属性冲突，请更改此值

**仅限远程模式的参数：**

- **host**：ArcadeDB 服务器的主机名或 IP 地址（必填）
- **port**：ArcadeDB REST API 的 HTTP 端口（默认：2480）
- **databaseName**：要连接或创建的数据库（必填）
- **username / password**：ArcadeDB 凭据（必填）
- **similarityFunction**：
  - `COSINE` — 余弦相似度；最适合归一化向量（默认）
  - `EUCLIDEAN` — 欧氏距离
  - `SQUARED_EUCLIDEAN` — 平方欧氏距离；比 EUCLIDEAN 更快
- **createDatabase**：设置为 `true` 可在数据库不存在时自动创建

**仅限嵌入模式的参数：**

- **databasePath**：嵌入式数据库存储目录的路径。如果不存在则自动创建
- **database**：也可直接提供现有的 `com.arcadedb.database.Database` 实例，而不是路径

## 元数据过滤

ArcadeDB 支持按元数据过滤搜索结果。过滤器在向量索引查找后应用。

```java
// 按单个元数据值过滤
Filter filter = new IsEqualTo("source", "wikipedia");

EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
    .queryEmbedding(queryEmbedding)
    .maxResults(5)
    .filter(filter)
    .build();

List<EmbeddingMatch<TextSegment>> matches = embeddingStore.search(request).matches();
```

### 支持的过滤类型

**比较运算符：**
- `IsEqualTo`、`IsNotEqualTo`
- `IsGreaterThan`、`IsGreaterThanOrEqualTo`
- `IsLessThan`、`IsLessThanOrEqualTo`
- `IsIn`、`IsNotIn`

**逻辑运算符：**
- `And`、`Or`、`Not`

## 删除操作

```java
// 按 ID 列表删除
embeddingStore.removeAll(List.of("id1", "id2"));

// 按元数据过滤条件删除
embeddingStore.removeAll(new IsEqualTo("source", "old-source"));

// 删除所有嵌入
embeddingStore.removeAll();
```

## 当前限制

- **近似搜索**：HNSW 索引是近似的。当结果集很大且包含许多近似相同的向量时，某些文档可能不会被返回
- **内存过滤应用**：元数据过滤器在向量搜索后在内存中应用，而非在索引层面。存储会获取请求数量 5 倍的结果以应对过滤导致的数量减少
- **浮点精度**：ArcadeDB 以 JSON 双精度浮点数形式返回向量，与原始存储值相比可能存在轻微的浮点精度差异。`Double.MIN_VALUE`（4.9E-324）会下溢为 0.0，无法精确存储
- **不支持字符串内容过滤**：不支持基于字符串的内容过滤（如 `ContainsString`）；仅支持上述元数据过滤类型
- **嵌入模式无法选择相似度函数**：嵌入式 builder 不提供 `similarityFunction` 选项；索引使用其默认度量

## 使用 Docker 运行 ArcadeDB

远程模式所需。最快速的入门方式：

```bash
docker run -d \
  --name arcadedb \
  -p 2480:2480 \
  -e JAVA_OPTS="-Darcadedb.server.rootPassword=playwithdata" \
  arcadedata/arcadedb:latest
```

然后连接您的存储：

```java
EmbeddingStore<TextSegment> embeddingStore = ArcadeDBEmbeddingStore.builder()
    .host("localhost")
    .port(2480)
    .databaseName("embeddings")
    .username("root")
    .password("playwithdata")
    .dimension(384)
    .createDatabase(true)
    .build();
```

## 示例

- 集成测试示例请查看 [langchain4j-community-arcadedb 模块测试文件](https://github.com/langchain4j/langchain4j-community/tree/main/embedding-stores/langchain4j-community-arcadedb/src/test/java)
- 也可以在 [langchain4j-examples 项目](https://github.com/langchain4j/langchain4j-examples)中找到一些示例
