---
sidebar_position: 1
---

# 内存

LangChain4j 提供了一个简单的内存实现 `EmbeddingStore` 接口：`InMemoryEmbeddingStore`。
它适用于快速原型开发和简单使用场景。
它将 `Embedding` 和相关的 `TextSegment` 保存在内存中，搜索也在内存中执行。
还可以将其序列化/反序列化为 JSON 字符串或文件。

### Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>1.13.0</version>
</dependency>
```

## API 参考 {#api}

- `InMemoryEmbeddingStore`


## 持久化

`InMemoryEmbeddingStore` 可以序列化为 JSON 字符串或文件：
```java
InMemoryEmbeddingStore<TextSegment> embeddingStore = new InMemoryEmbeddingStore<>();
embeddingStore.addAll(embeddings, embedded);

String serializedStore = embeddingStore.serializeToJson();
InMemoryEmbeddingStore<TextSegment> deserializedStore = InMemoryEmbeddingStore.fromJson(serializedStore);

String filePath = "/home/me/store.json";
embeddingStore.serializeToFile(filePath);
InMemoryEmbeddingStore<TextSegment> deserializedStore = InMemoryEmbeddingStore.fromFile(filePath);
```

## 示例

- [InMemoryEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/embedding/store/InMemoryEmbeddingStoreExample.java)
