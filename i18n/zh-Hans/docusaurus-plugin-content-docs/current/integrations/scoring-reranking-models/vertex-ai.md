---
sidebar_position: 4
---

# Google Cloud Vertex AI Ranking API

- [Google Cloud Vertex AI Ranking 文档](https://cloud.google.com/generative-ai-app-builder/docs/ranking)
- [Google Cloud Vertex AI Ranking API 说明](https://cloud.google.com/generative-ai-app-builder/docs/reference/rest/v1/projects.locations.rankingConfigs/rank)

### 简介

Google Cloud Vertex AI Ranking API 是一个强大的工具，通过优化检索到的文档与给定查询的相关性来增强搜索结果。与传统搜索方法不同，它利用先进的机器学习算法来理解查询和文档的语义上下文，提供更精确和相关的结果。通过分析查询与每个文档之间的语义关系，该 API 可以根据计算出的相关性分数对候选文档重新排序，确保最相关的结果出现在搜索结果页面的顶部。

### Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-vertex-ai</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

### 用法

要配置模型，需要指定：
* Google Cloud 项目 ID
* 项目编号
* 位置（例如 `us-central1`、`europe-west1`）
* 要使用的模型

> 注意：您可以在 Google Cloud 控制台中找到项目编号，或通过运行 `gcloud projects describe your-project-id` 获取。

您可以通过 `score(text, query)` 和 `score(segment, query)` 方法对单个字符串或 `TextSegment` 进行查询评分。

也可以使用 `scoreAll(segments, query)` 方法对多个字符串或 `TextSegment` 进行查询评分：

```java
VertexAiScoringModel scoringModel = VertexAiScoringModel.builder()
    .projectId(System.getenv("GCP_PROJECT_ID"))
    .projectNumber(System.getenv("GCP_PROJECT_NUM"))
    .projectLocation(System.getenv("GCP_LOCATION"))
    .model("semantic-ranker-512")
    .build();

Response<List<Double>> score = scoringModel.scoreAll(Stream.of(
        "The sky appears blue due to a phenomenon called Rayleigh scattering. " +
            "Sunlight is comprised of all the colors of the rainbow. Blue light has shorter " +
            "wavelengths than other colors, and is thus scattered more easily.",

        "A canvas stretched across the day,\n" +
            "Where sunlight learns to dance and play.\n" +
            "Blue, a hue of scattered light,\n" +
            "A gentle whisper, soft and bright."
        ).map(TextSegment::from).collect(Collectors.toList()),
    "Why is the sky blue?");

// [0.8199999928474426, 0.4300000071525574]
```

如果您传入包含特定 `title` 键的 `TextSegment`，Ranker 模型可以在计算中考虑此元数据。要指定自定义标题键，可以使用 `titleMetadataKey()` builder 方法。

您可以将评分模型与 `AiServices` 及其 `contentAggregator()` 方法一起使用，该方法接受可指定评分模型的 `ContentAggregator` 类：

```java
VertexAiScoringModel scoringModel = VertexAiScoringModel.builder()
    .projectId(System.getenv("GCP_PROJECT_ID"))
    .projectNumber(System.getenv("GCP_PROJECT_NUM"))
    .projectLocation(System.getenv("GCP_LOCATION"))
    .model("semantic-ranker-512")
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
