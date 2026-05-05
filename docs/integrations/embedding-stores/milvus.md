---
sidebar_position: 14
---

# Milvus

https://milvus.io/


## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-milvus</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```


## API 参考 {#api}

- `MilvusEmbeddingStore`

## 创建方式

有两种创建 `MilvusEmbeddingStore` 的方式：


1. 通过自动创建 MilvusServiceClient 创建 MilvusEmbeddingStore：使用此选项时，内部将使用指定的主机、端口和认证信息创建新的 MilvusServiceClient，便于快速设置。


```java
MilvusEmbeddingStore store = MilvusEmbeddingStore.builder()

    .host("localhost")                         // Milvus 实例主机
    .port(19530)                               // Milvus 实例端口
    .collectionName("example_collection")      // 集合名称
    .dimension(128)                            // 向量维度
    .indexType(IndexType.FLAT)                 // 索引类型
    .metricType(MetricType.COSINE)             // 度量类型
    .username("username")                      // Milvus 用户名
    .password("password")                      // Milvus 密码
    .consistencyLevel(ConsistencyLevelEnum.EVENTUALLY)  // 一致性级别
    .autoFlushOnInsert(true)                   // 插入后自动刷新
    .idFieldName("id")                         // ID 字段名
    .textFieldName("text")                     // 文本字段名
    .metadataFieldName("metadata")             // 元数据字段名
    .vectorFieldName("vector")                 // 向量字段名
    .build();                                  // 构建 MilvusEmbeddingStore 实例
```

2. 使用已有 MilvusServiceClient 创建 MilvusEmbeddingStore：如果您已有 MilvusServiceClient，此选项可直接在 builder 中使用，允许自定义配置。


```java

// 设置自定义 MilvusServiceClient
MilvusServiceClient customMilvusClient = new MilvusServiceClient(
    ConnectParam.newBuilder()
        .withHost("localhost")
        .withPort(19530)
        .build()
);

// 在 builder 中使用自定义客户端
MilvusEmbeddingStore store = MilvusEmbeddingStore.builder()

    .milvusClient(customMilvusClient)          // 使用已有 Milvus 客户端
    .collectionName("example_collection")      // 集合名称
    .dimension(128)                            // 向量维度
    .indexType(IndexType.FLAT)                 // 索引类型
    .metricType(MetricType.COSINE)             // 度量类型
    .consistencyLevel(ConsistencyLevelEnum.EVENTUALLY)  // 一致性级别
    .autoFlushOnInsert(true)                   // 插入后自动刷新
    .idFieldName("id")                         // ID 字段名
    .textFieldName("text")                     // 文本字段名
    .metadataFieldName("metadata")             // 元数据字段名
    .vectorFieldName("vector")                 // 向量字段名
    .build();                                  // 构建 MilvusEmbeddingStore 实例


```


## 示例

- [MilvusEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/milvus-example/src/main/java/MilvusEmbeddingStoreExample.java)
