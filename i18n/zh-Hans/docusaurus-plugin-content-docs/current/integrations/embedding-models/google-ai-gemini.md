# Google AI Gemini 嵌入

https://ai.google.dev/gemini-api/docs/embeddings

## 目录

- [Maven 依赖](#maven-dependency)
- [API Key](#api-key)
- [可用模型](#models-available)
- [GoogleAiEmbeddingModel](#googleaiembeddingmodel)
    - [基本用法](#basic-usage)
    - [嵌入多段文本](#embedding-multiple-texts)
    - [配置嵌入模型](#configuring-the-embedding-model)
    - [任务类型](#task-types)
    - [通过文档标题使用元数据](#using-metadata-for-document-titles)
    - [输出维度](#output-dimensionality)
    - [批量处理](#batch-processing)
- [批量嵌入处理](#batch-embedding-processing)
    - [GoogleAiGeminiBatchEmbeddingModel](#googleaigeminibatchembeddingmodel)
    - [创建批量嵌入任务](#creating-batch-embedding-jobs)
    - [处理批量响应](#handling-batch-responses)
    - [轮询结果](#polling-for-results)
    - [管理批量任务](#managing-batch-jobs)
    - [基于文件的批量处理](#file-based-batch-processing)

## Maven 依赖 {#maven-dependency}

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-google-ai-gemini</artifactId>
    <version>1.13.0</version>
</dependency>
```

## API 密钥 {#api-key}

在此免费获取 API Key：https://ai.google.dev/gemini-api/docs/api-key 。

## 可用模型 {#models-available}

查看文档中的[可用模型列表](https://ai.google.dev/gemini-api/docs/embeddings#model-versions)。

* `gemini-embedding-001`
    * 输入 token 限制：2,048
    * 输出维度大小：灵活可配，支持：128 - 3072，推荐：768、1536、3072

## GoogleAiEmbeddingModel

`GoogleAiEmbeddingModel` 允许您使用 Google AI Gemini 嵌入模型从文本生成嵌入向量。

### 基本用法 {#basic-usage}

```java
EmbeddingModel embeddingModel = GoogleAiEmbeddingModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-embedding-001")
    .build();

Response<Embedding> response = embeddingModel.embed("Hello, world!");
Embedding embedding = response.content();
```

### 嵌入多段文本 {#embedding-multiple-texts}

```java
List<TextSegment> segments = List.of(
    TextSegment.from("第一个文档"),
    TextSegment.from("第二个文档"),
    TextSegment.from("第三个文档")
);

Response<List<Embedding>> response = embeddingModel.embedAll(segments);
List<Embedding> embeddings = response.content();
```

### 配置嵌入模型 {#configuring-the-embedding-model}

```java
EmbeddingModel embeddingModel = GoogleAiEmbeddingModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-embedding-001")
    .taskType(GoogleAiEmbeddingModel.TaskType.RETRIEVAL_DOCUMENT)
    .outputDimensionality(768)
    .titleMetadataKey("title")
    .maxRetries(3)
    .timeout(Duration.ofSeconds(30))
    .logRequestsAndResponses(true)
    .build();
```

### 任务类型 {#task-types}

`taskType` 参数可针对特定使用场景优化嵌入效果：

- `RETRIEVAL_QUERY`：用于搜索查询
- `RETRIEVAL_DOCUMENT`：用于待检索文档（文档索引的默认值）
- `SEMANTIC_SIMILARITY`：用于度量文本相似度
- `CLASSIFICATION`：用于文本分类任务
- `CLUSTERING`：用于聚合相似文本
- `QUESTION_ANSWERING`：用于问答系统
- `FACT_VERIFICATION`：用于事实核查应用

### 通过文档标题使用元数据 {#using-metadata-for-document-titles}

使用 `TaskType.RETRIEVAL_DOCUMENT` 时，可通过元数据提供文档标题：

```java
EmbeddingModel embeddingModel = GoogleAiEmbeddingModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-embedding-001")
    .taskType(GoogleAiEmbeddingModel.TaskType.RETRIEVAL_DOCUMENT)
    .titleMetadataKey("title") // 默认为 "title"
    .build();

TextSegment segment = TextSegment.from(
    "这是文档内容",
    Metadata.from("title", "我的文档标题")
);

Response<Embedding> response = embeddingModel.embed(segment);
```

### 输出维度 {#output-dimensionality}

可指定输出维度以减少嵌入向量大小：

```java
EmbeddingModel embeddingModel = GoogleAiEmbeddingModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-embedding-001")
    .outputDimensionality(256) // 从默认 768 维降低
    .build();
```

### 批量处理 {#batch-processing}

嵌入多个段时，模型会自动将请求批量处理，每批最多 100 个段以获得最佳性能。

**注意：** 这不是折扣批量 API，而是处理多个嵌入的便捷方法。

## 批量嵌入处理 {#batch-embedding-processing}

### GoogleAiGeminiBatchEmbeddingModel {#googleaigeminibatchembeddingmodel}

`GoogleAiGeminiBatchEmbeddingModel` 提供了一个接口，用于以较低成本（标准定价的 50%）异步处理大量嵌入请求。适用于非紧急、大规模嵌入任务，SLO 为 24 小时。

### 创建批量嵌入任务 {#creating-batch-embedding-jobs}

**内联批量创建：**

```java
GoogleAiGeminiBatchEmbeddingModel batchModel = GoogleAiGeminiBatchEmbeddingModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-embedding-001")
    .taskType(GoogleAiEmbeddingModel.TaskType.RETRIEVAL_DOCUMENT)
    .outputDimensionality(768)
    .build();

// 创建文本段批次
List<TextSegment> segments = List.of(
    TextSegment.from("第一个待嵌入文档"),
    TextSegment.from("第二个待嵌入文档"),
    TextSegment.from("第三个待嵌入文档")
);

// 提交批次
BatchResponse<Embedding> response = batchModel.createBatchInline(
    "Document Embeddings Batch",  // 显示名称
    0L,                            // 优先级（可选，默认为 0）
    segments
);
```

**基于文件的批量创建：**

对于较大的批次，可从已上传的文件创建批次：

```java
// 首先上传包含批量请求的文件
GeminiFiles filesApi = GeminiFiles.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .build();

GeminiFile uploadedFile = filesApi.uploadFile(
    Paths.get("batch_embeddings.jsonl"),
    "Batch Embedding Requests"
);

// 等待文件处于活跃状态
while (uploadedFile.isProcessing()) {
    Thread.sleep(1000);
    uploadedFile = filesApi.getMetadata(uploadedFile.name());
}

// 从文件创建批次
BatchResponse<Embedding> response = batchModel.createBatchFromFile(
    "My Embedding Batch Job",
    uploadedFile
);
```

### 处理批量响应 {#handling-batch-responses}

`BatchResponse` 是一个密封接口，有三种可能状态：

```java
BatchResponse<Embedding> response = batchModel.createBatchInline("My Batch", null, segments);

switch (response) {
    case BatchIncomplete incomplete -> {
        System.out.println("批次状态：" + incomplete.state());
        System.out.println("批次名称：" + incomplete.batchName().value());
    }
    case BatchSuccess success -> {
        System.out.println("批次成功完成！");
        for (Embedding embedding : success.responses()) {
            System.out.println("嵌入维度：" + embedding.dimension());
        }
    }
    case BatchError error -> {
        System.err.println("批次失败：" + error.message());
        System.err.println("错误码：" + error.code());
        System.err.println("状态：" + error.state());
    }
}
```

### 轮询结果 {#polling-for-results}

由于批量处理是异步的，需要轮询结果：

```java
BatchResponse<Embedding> initialResponse = batchModel.createBatchInline(
    "My Batch",
    null,
    segments
);

// 提取批次名称用于轮询
BatchName batchName = switch (initialResponse) {
    case BatchIncomplete incomplete -> incomplete.batchName();
    case BatchSuccess success -> success.batchName();
    case BatchError error -> throw new RuntimeException("批次创建失败");
};

// 轮询直到完成
BatchResponse<Embedding> result;
do {
    Thread.sleep(5000); // 每次轮询等待 5 秒
    result = batchModel.retrieveBatchResults(batchName);
} while (result instanceof BatchIncomplete);

// 处理最终结果
if (result instanceof BatchSuccess success) {
    List<Embedding> embeddings = success.responses();
    System.out.println("生成了 " + embeddings.size() + " 个嵌入");
} else if (result instanceof BatchError error) {
    System.err.println("批次失败：" + error.message());
}
```

### 管理批量任务 {#managing-batch-jobs}

**取消批量任务：**

```java
BatchName batchName = // ... 从 createBatchInline 或 createBatchFromFile 获取

try {
    batchModel.cancelBatchJob(batchName);
    System.out.println("批次已成功取消");
} catch (HttpException e) {
    System.err.println("取消批次失败：" + e.getMessage());
}
```

**删除批量任务：**

```java
batchModel.deleteBatchJob(batchName);
System.out.println("批次已成功删除");
```

**列出批量任务：**

```java
// 列出第一页批量任务
BatchList<Embedding> batchList = batchModel.listBatchJobs(10, null);

for (BatchResponse<Embedding> batch : batchList.batches()) {
    System.out.println("批次：" + batch);
}

// 如有下一页则获取
if (batchList.nextPageToken() != null) {
    BatchList<Embedding> nextPage = batchModel.listBatchJobs(10, batchList.nextPageToken());
}
```

### 基于文件的批量处理 {#file-based-batch-processing}

对于高级使用场景，可将批量请求写入 JSONL 文件后上传：

```java
// 创建包含批量请求的 JSONL 文件
Path batchFile = Files.createTempFile("batch", ".jsonl");

try (JsonLinesWriter writer = new StreamingJsonLinesWriter(batchFile)) {
    List<BatchFileRequest<TextSegment>> fileRequests = List.of(
        new BatchFileRequest<>("segment-1", TextSegment.from("第一个文档")),
        new BatchFileRequest<>("segment-2", TextSegment.from("第二个文档")),
        new BatchFileRequest<>("segment-3", TextSegment.from("第三个文档"))
    );
    
    batchModel.writeBatchToFile(writer, fileRequests);
}

// 上传文件
GeminiFiles filesApi = GeminiFiles.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .build();

GeminiFile uploadedFile = filesApi.uploadFile(batchFile, "Batch Embedding Requests");

// 从文件创建批次
BatchResponse<Embedding> response = batchModel.createBatchFromFile(
    "File-Based Embedding Batch",
    uploadedFile
);
```

### 在批量嵌入中使用元数据

使用 `TaskType.RETRIEVAL_DOCUMENT` 时，可通过元数据包含文档标题：

```java
GoogleAiGeminiBatchEmbeddingModel batchModel = GoogleAiGeminiBatchEmbeddingModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-embedding-001")
    .taskType(GoogleAiEmbeddingModel.TaskType.RETRIEVAL_DOCUMENT)
    .titleMetadataKey("title")
    .build();

List<TextSegment> segments = List.of(
    TextSegment.from(
        "第一个文档的内容",
        Metadata.from("title", "第一个文档标题")
    ),
    TextSegment.from(
        "第二个文档的内容",
        Metadata.from("title", "第二个文档标题")
    )
);

BatchResponse<Embedding> response = batchModel.createBatchInline(
    "Documents with Titles",
    null,
    segments
);
```

### 配置

`GoogleAiGeminiBatchEmbeddingModel` 支持与 `GoogleAiEmbeddingModel` 相同的配置选项：

```java
GoogleAiGeminiBatchEmbeddingModel batchModel = GoogleAiGeminiBatchEmbeddingModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-embedding-001")
    .taskType(GoogleAiEmbeddingModel.TaskType.RETRIEVAL_DOCUMENT)
    .outputDimensionality(768)
    .titleMetadataKey("title")
    .maxRetries(3)
    .timeout(Duration.ofSeconds(30))
    .logRequestsAndResponses(true)
    .build();
```

### 重要限制

- **大小限制**：内联 API 支持不超过 20 MB 的总请求大小
- **批次大小**：每批最多 100 个段以获得最佳性能
- **成本**：批量处理与实时请求相比节省 50% 费用
- **周转时间**：SLO 为 24 小时，通常完成得更快
- **适用场景**：最适合用于文档索引或语义搜索的大规模嵌入生成

### 示例：完整工作流

```java
GoogleAiGeminiBatchEmbeddingModel batchModel = GoogleAiGeminiBatchEmbeddingModel.builder()
    .apiKey(System.getenv("GEMINI_AI_KEY"))
    .modelName("gemini-embedding-001")
    .taskType(GoogleAiEmbeddingModel.TaskType.RETRIEVAL_DOCUMENT)
    .outputDimensionality(768)
    .build();

// 准备文本段批次
List<TextSegment> segments = new ArrayList<>();
for (int i = 0; i < 500; i++) {
    segments.add(TextSegment.from(
        "文档内容 #" + i,
        Metadata.from("title", "文档 " + i)
    ));
}

// 提交批次
BatchResponse<Embedding> response = batchModel.createBatchInline(
    "Large Document Collection",
    0L,
    segments
);

// 获取批次名称
BatchName batchName = switch (response) {
    case BatchIncomplete incomplete -> incomplete.batchName();
    case BatchSuccess success -> success.batchName();
    case BatchError error -> throw new RuntimeException("失败：" + error.message());
};

// 轮询直到完成
BatchResponse<Embedding> finalResult;
int attempts = 0;
int maxAttempts = 720; // 以 5 秒为间隔，共 1 小时

do {
    if (attempts++ >= maxAttempts) {
        throw new RuntimeException("批量处理超时");
    }
    Thread.sleep(5000);
    finalResult = batchModel.retrieveBatchResults(batchName);
    
    if (finalResult instanceof BatchIncomplete incomplete) {
        System.out.println("状态：" + incomplete.state());
    }
} while (finalResult instanceof BatchIncomplete);

// 处理结果
if (finalResult instanceof BatchSuccess success) {
    List<Embedding> embeddings = success.responses();
    System.out.println("生成了 " + embeddings.size() + " 个嵌入");
    
    // 将嵌入存储到向量数据库
    for (int i = 0; i < embeddings.size(); i++) {
        Embedding embedding = embeddings.get(i);
        System.out.println("嵌入 " + i + " 共 " + embedding.dimension() + " 维");
        // vectorStore.add(embedding, segments.get(i));
    }
} else if (finalResult instanceof BatchError error) {
    System.err.println("批次失败：" + error.message());
}
```

## 了解更多

如果您希望了解更多关于 Google AI Gemini 嵌入模型的信息，请查阅
[文档](https://ai.google.dev/gemini-api/docs/embeddings)。
