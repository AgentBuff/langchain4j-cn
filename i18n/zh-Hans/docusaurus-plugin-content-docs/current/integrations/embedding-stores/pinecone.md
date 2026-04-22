---
sidebar_position: 20
---

# Pinecone

https://www.pinecone.io/


## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-pinecone</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## 已知问题

- https://github.com/langchain4j/langchain4j/issues/1948
Pinecone 将所有数字存储为[浮点值](https://docs.pinecone.io/guides/data/filter-with-metadata#supported-metadata-types)，
这意味着存储在 `Metadata` 中的 `Integer` 和 `Long` 值（如 1746714878034235396）可能被损坏，以错误的数字形式返回！
可能的解决方法：在将整数/双精度值存储到 `Metadata` 之前将其转换为 `String`。
请注意，在这种情况下，元数据过滤可能无法正常工作！

## API 参考 {#api}

- `PineconeEmbeddingStore`


## 示例

- [PineconeEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/pinecone-example/src/main/java/PineconeEmbeddingStoreExample.java)
