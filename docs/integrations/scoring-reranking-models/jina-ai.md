---
sidebar_position: 3
---

# Jina

- [Jina Reranker 文档](https://jina.ai/reranker)
- [Jina Reranker API](https://api.jina.ai/redoc#tag/rerank)

### 简介

重排序器是一种高级 AI 模型，它接收搜索的初始结果集（通常由基于嵌入/词元的搜索提供），并重新评估它们，以确保它们更贴近用户的意图。它超越了表面级的术语匹配，考虑搜索查询与文档内容之间更深层次的交互。

### Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-jina</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

### 用法

```java
ScoringModel scoringModel = JinaScoringModel.builder()
    .apiKey(System.getenv("JINA_API_KEY"))
    .modelName("jina-reranker-v2-base-multilingual")
    .build();

ContentAggregator contentAggregator = ReRankingContentAggregator.builder()
    .scoringModel(scoringModel)
    ... 
    .build();

RetrievalAugmentor retrievalAugmentor = DefaultRetrievalAugmentor.builder()
    ...
    .contentAggregator(contentAggregator)
    .build();

return AiServices.builder(Assistant.class)
    .chatModel(...)
    .retrievalAugmentor(retrievalAugmentor)
    .build();
```
