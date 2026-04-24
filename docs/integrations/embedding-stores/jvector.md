---
sidebar_position: 32
---

# JVector

https://github.com/jbellis/jvector

JVector 是一个纯 Java 嵌入式向量搜索引擎，使用基于图的索引提供高性能近似最近邻（ANN）搜索。它融合了 DiskANN 和 HNSW 算法族，提供快速相似度搜索，并支持可配置的精度/性能权衡。

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-jvector</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

注意：这是一个社区集成模块，可能需要在项目配置中添加 langchain4j-community 仓库。

## API 参考 {#api}

- `JVectorEmbeddingStore`

## 功能特性

- **纯 Java 实现**：无需原生依赖，可在任何 Java 环境中运行
- **基于图的索引**：使用带 Vamana 算法的 HNSW 层次结构实现高性能 ANN 搜索
- **默认内存存储**：快速搜索，支持可选的磁盘持久化
- **可配置性能**：通过 `maxDegree` 和 `beamWidth` 等参数调整精度/速度权衡
- **多种相似度函数**：支持 DOT_PRODUCT（默认）、COSINE 和 EUCLIDEAN 距离度量
- **线程安全**：非阻塞并发控制，支持安全并发访问
- **磁盘持久化**：支持索引的可选保存/加载功能
- **动态更新**：索引创建后可添加和删除嵌入

## 基本用法

### 内存存储

创建简单的内存嵌入存储：

```java
EmbeddingStore<TextSegment> store = JVectorEmbeddingStore.builder()
    .dimension(384)                    // 必须与嵌入模型的维度一致
    .build();
```

### 持久化存储

创建带磁盘持久化的嵌入存储：

```java
EmbeddingStore<TextSegment> store = JVectorEmbeddingStore.builder()
    .dimension(384)
    .persistencePath("/path/to/index") // 索引文件的基础路径
    .build();

// 添加嵌入...
store.add(embedding, textSegment);

// 保存到磁盘
((JVectorEmbeddingStore) store).save();
```

当使用 `persistencePath` 创建存储时，如果该路径存在文件，索引将自动从磁盘加载。

## 配置选项

JVector 提供多个 builder 选项来调整性能：

```java
EmbeddingStore<TextSegment> store = JVectorEmbeddingStore.builder()
    .dimension(384)                    // 必填：嵌入维度
    .maxDegree(16)                     // 图连接度（默认：16）
    .beamWidth(100)                    // 索引构建质量（默认：100）
    .neighborOverflow(1.2f)            // 构建期间的溢出因子（默认：1.2）
    .alpha(1.2f)                       // 多样性参数（默认：1.2）
    .similarityFunction(VectorSimilarityFunction.DOT_PRODUCT) // 默认
    .persistencePath("/path/to/index") // 可选：启用持久化
    .build();
```

### 参数说明

- **dimension**：必须与嵌入模型的输出维度一致（必填）
- **maxDegree**：控制每个节点的图连接数。值越大召回率越高，但内存使用更多。推荐：16（默认）
- **beamWidth**：控制索引构建质量。值越大索引越好，但构建时间越长。推荐：100（默认）
- **neighborOverflow**：内存索引推荐 1.2（默认），磁盘索引推荐 1.5
- **alpha**：控制边距离与多样性的权衡。高维向量推荐 1.2（默认），低维（2D/3D）向量推荐 2.0
- **similarityFunction**：
  - `DOT_PRODUCT` - 归一化向量最快（默认）
  - `COSINE` - 余弦相似度
  - `EUCLIDEAN` - 欧氏距离

## 持久化

JVector 支持从磁盘保存和加载索引：

```java
// 创建带持久化的存储
JVectorEmbeddingStore store = JVectorEmbeddingStore.builder()
    .dimension(384)
    .persistencePath("/path/to/index")
    .build();

// 添加嵌入
store.add(embeddings, textSegments);

// 保存到磁盘（创建 .graph 和 .metadata 文件）
store.save();

// 之后：使用相同路径创建时自动加载
JVectorEmbeddingStore loadedStore = JVectorEmbeddingStore.builder()
    .dimension(384)
    .persistencePath("/path/to/index")
    .build();
// 所有之前的嵌入和索引结构都已恢复
```

持久化会创建两个文件：
- `{path}.graph` - 包含向量的图索引结构
- `{path}.metadata` - 嵌入 ID、文本段和元数据

## 当前限制

- **不支持元数据过滤**：JVector 不支持在搜索过程中按元数据过滤结果，所有过滤需在搜索后进行
- **修改后需重建索引**：添加或删除嵌入会使索引失效，将在下次搜索时重建。建议尽量批量添加
- **维度必须匹配**：所有嵌入的维度必须与创建存储时指定的维度一致

## 性能特点

JVector 针对以下场景进行了优化：
- **快速相似度搜索**：搜索时间复杂度为对数级
- **线性可扩展性**：索引构建随 CPU 核心数线性扩展
- **内存高效**：仅支持内存索引，可选磁盘持久化
- **高召回率**：合理调优后，基于图的方法通常可达 >98% 召回率

理想使用场景：
- 无需外部依赖的嵌入式向量搜索应用
- 开发和测试环境
- 需要完全控制索引的生产部署
- 需要磁盘持久化但不依赖独立数据库的应用

## 示例

- 示例代码见 [JVector 源码仓库](https://github.com/jbellis/jvector/tree/main/jvector-examples)
- LangChain4j 特定集成示例见 [langchain4j-community-jvector 模块测试文件](https://github.com/langchain4j/langchain4j-community/tree/main/embedding-stores/langchain4j-community-jvector/src/test/java)
