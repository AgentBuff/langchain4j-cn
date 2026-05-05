---
sidebar_position: 1
---

# 进程内（ONNX）

LangChain4j 提供了一些流行的本地嵌入模型，以 Maven 依赖的形式打包。
它们由 [ONNX runtime](https://onnxruntime.ai/docs/get-started/with-java.html) 驱动，
并在同一 Java 进程中运行。

每个模型提供两种版本：原始版本和量化版本（Maven 构件名以 `-q` 结尾，类名中含 `Quantized`）。

例如：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-embeddings-all-minilm-l6-v2</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```
```java
EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();
Response<Embedding> response = embeddingModel.embed("test");
Embedding embedding = response.content();
```

或量化版本：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-embeddings-all-minilm-l6-v2-q</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```
```java
EmbeddingModel embeddingModel = new AllMiniLmL6V2QuantizedEmbeddingModel();
Response<Embedding> response = embeddingModel.embed("test");
Embedding embedding = response.content();
```

完整的嵌入模型列表可在[此处](https://github.com/langchain4j/langchain4j/tree/main/embeddings)找到。


## 并行化

默认情况下，嵌入过程使用所有可用的 CPU 核心并行化，
每个 `TextSegment` 在独立线程中嵌入。

并行化通过 `Executor` 实现。
默认情况下，进程内嵌入模型使用缓存线程池，
线程数等于可用处理器数量，线程缓存 1 秒。

创建模型时可提供自定义的 `Executor` 实例：
```java
Executor = ...;
EmbeddingModel embeddingModel = new AllMiniLmL6V2QuantizedEmbeddingModel(executor);
```

目前不支持 GPU 嵌入。

## 自定义模型

只要格式为 ONNX，许多模型（例如来自 [Hugging Face](https://huggingface.co/)）均可使用。

有关如何将模型转换为 ONNX 格式的信息，请参阅[此处](https://huggingface.co/docs/optimum/exporters/onnx/usage_guides/export_a_model)。

许多已转换为 ONNX 格式的模型可在[此处](https://huggingface.co/Xenova)获取。

使用自定义嵌入模型的示例：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-embeddings</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```
```java
String pathToModel = "/home/langchain4j/model.onnx";
String pathToTokenizer = "/home/langchain4j/tokenizer.json";
PoolingMode poolingMode = PoolingMode.MEAN;
EmbeddingModel embeddingModel = new OnnxEmbeddingModel(pathToModel, pathToTokenizer, poolingMode);

Response<Embedding> response = embeddingModel.embed("test");
Embedding embedding = response.content();
```

## 示例

- [InProcessEmbeddingModelExamples](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/embedding/model/InProcessEmbeddingModelExamples.java)
