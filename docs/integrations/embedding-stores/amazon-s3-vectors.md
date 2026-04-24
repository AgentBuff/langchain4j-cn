---
sidebar_position: 29
---

# Amazon S3 Vectors

Amazon S3 Vectors 嵌入存储集成了 [Amazon S3 Vectors](https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vectors.html)，这是 Amazon S3 中专为大规模存储和查询向量嵌入而设计的向量存储功能。

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-s3-vectors</artifactId>
    <version>${latest version here}</version>
</dependency>
```

## API 参考 {#api}

- `S3VectorsEmbeddingStore`

## 功能特性

- 存储带元数据的嵌入
- 使用余弦或欧氏距离进行向量相似度搜索
- 按元数据字段过滤搜索结果
- 首次插入嵌入时自动创建索引
- 支持标准 AWS 凭据提供者

## 使用方式

### 基本配置

```java
S3VectorsEmbeddingStore embeddingStore = S3VectorsEmbeddingStore.builder()
    .vectorBucketName("my-vector-bucket")       // S3 Vectors 存储桶名称（必填）
    .indexName("my-index")                       // 存储桶内的索引名称（必填）
    .region("us-west-2")                         // AWS 区域（默认：us-east-1）
    .distanceMetric(DistanceMetric.COSINE)       // 距离度量（默认：COSINE）
    .createIndexIfNotExists(true)                // 自动创建索引（默认：true）
    .timeout(Duration.ofSeconds(60))             // API 调用超时（默认：30 秒）
    .credentialsProvider(myCredentialsProvider)  // 自定义 AWS 凭据
    .build();
```

### 使用已有 S3VectorsClient

如果您已有配置好的 S3VectorsClient，可直接传入 builder：

```java
S3VectorsClient customClient = S3VectorsClient.builder()
    .region(Region.US_WEST_2)
    .credentialsProvider(myCredentialsProvider)
    .build();

S3VectorsEmbeddingStore embeddingStore = S3VectorsEmbeddingStore.builder()
    .s3VectorsClient(customClient)
    .vectorBucketName("my-vector-bucket")
    .indexName("my-index")
    .build();
```

## 距离度量

S3 Vectors 嵌入存储支持两种距离度量。距离值会自动转换为 [0, 1] 范围内的相关度评分，1 表示最相关匹配。

### 余弦距离（默认）

**适用场景：** 文本嵌入、语义相似度搜索

- 测量向量之间夹角的余弦值
- 转换为相关度评分：`score = (1 - distance + 1) / 2`
- 结果与向量大小无关

```java
.distanceMetric(DistanceMetric.COSINE)  // 默认，推荐用于文本嵌入
```

### 欧氏距离

**适用场景：** 方向和大小都重要时

- 测量向量之间的直线距离
- 范围：[0, ∞)
- 转换为相关度评分：`score = 1 / (1 + distance)`

```java
.distanceMetric(DistanceMetric.EUCLIDEAN)
```

## 过滤

S3 Vectors 嵌入存储支持按元数据字段过滤搜索结果。

### 支持的过滤操作

- `isEqualTo`：等于比较
- `isNotEqualTo`：不等于比较
- `isGreaterThan`：大于比较
- `isGreaterThanOrEqualTo`：大于等于比较
- `isLessThan`：小于比较
- `isLessThanOrEqualTo`：小于等于比较
- `isIn`：IN 操作（多个值）
- `isNotIn`：NOT IN 操作
- `And`：逻辑与
- `Or`：逻辑或
- `Not`：逻辑非

## 实现细节

### 凭据

默认情况下，存储使用 `DefaultCredentialsProvider`，遵循标准 AWS 凭据解析链（环境变量、系统属性、凭据文件、EC2 实例配置文件等）。可通过 builder 提供自定义的 `AwsCredentialsProvider`。

### 索引创建

当 `createIndexIfNotExists` 设置为 `true`（默认）时，索引在首次插入嵌入时自动创建。索引维度和距离度量根据第一个嵌入和配置的距离度量来设置。

### 资源释放

`S3VectorsEmbeddingStore` 实现了 `AutoCloseable`。使用完毕后，调用 `close()` 释放底层 S3VectorsClient 资源，或使用 try-with-resources。

## 限制

- **最大结果数**：S3 Vectors 每次查询限制最多返回 100 个结果（topK 范围：1-100）
- **按过滤条件删除**：不支持 `removeAll(Filter)`，请改用 `removeAll(Collection<String> ids)`
- **删除全部**：`removeAll()` 会删除整个索引

## 示例

- [S3VectorsEmbeddingStoreIT](https://github.com/langchain4j/langchain4j-community/blob/main/embedding-stores/langchain4j-community-s3-vectors/src/test/java/dev/langchain4j/community/store/embedding/s3/S3VectorsEmbeddingStoreIT.java)
