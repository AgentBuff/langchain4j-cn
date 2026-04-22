---
sidebar_position: 7
---

# Chroma

https://www.trychroma.com/


## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-chroma</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## API 参考 {#api}

- `ChromaEmbeddingStore`


## 示例

- [ChromaEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/chroma-example/src/main/java/ChromaEmbeddingStoreExample.java)

## 支持的 API 版本
Chroma 有多个 REST API 版本：
- 0.5.16 之前：仅支持 API V1
- 0.5.16 到 0.6.3：同时支持 API V1 和 V2（约 0.6.2 版本引入了 V1 API 的一些 bug）
- 0.7.0 之后：仅支持 API V2，因此在配置 `ChromaEmbeddingStore` 时需要选择正确版本：
```java
ChromaEmbeddingStore.builder()
    .apiVersion(ChromaApiVersion.V2)
    .baseUrl(...)
    .tenantName(...)
    .databaseName(...)
    .collectionName(...)
    .build();
```

## 当前限制

- Chroma 不能按字母数字元数据的大于/小于条件过滤，仅支持 int 和 float
- Chroma 对 *not* 的过滤方式如下：如果按 "key" 不等于 "a" 过滤，
  实际上会返回所有 "key" != "a" 的项，但不包含没有 "key" 元数据的项！
