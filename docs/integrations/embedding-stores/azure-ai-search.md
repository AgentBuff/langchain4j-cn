---
sidebar_position: 3
---

# Azure AI Search

https://azure.microsoft.com/en-us/products/ai-services/ai-search/


## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-azure-ai-search</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## API 参考 {#api}

- `AzureAiSearchEmbeddingStore` - 支持向量搜索
- `AzureAiSearchContentRetriever` - 支持向量搜索、全文搜索、混合搜索和重排序


## 示例

- [AzureAiSearchEmbeddingStoreIT](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-azure-ai-search/src/test/java/dev/langchain4j/store/embedding/azure/search/AzureAiSearchEmbeddingStoreIT.java)
- [AzureAiSearchContentRetrieverIT](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-azure-ai-search/src/test/java/dev/langchain4j/rag/content/retriever/azure/search/AzureAiSearchContentRetrieverIT.java)
