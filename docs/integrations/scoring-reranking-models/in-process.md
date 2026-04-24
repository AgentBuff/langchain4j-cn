---
sidebar_position: 1
---

# 进程内（ONNX）

LangChain4j 提供本地评分（重排序）模型，由 [ONNX runtime](https://onnxruntime.ai/docs/get-started/with-java.html) 提供支持，运行在同一 Java 进程中。

只要模型是 ONNX 格式，就可以使用许多模型（例如来自 [Hugging Face](https://huggingface.co/) 的模型）。

有关如何将模型转换为 ONNX 格式的信息，请参阅[这里](https://huggingface.co/docs/optimum/exporters/onnx/usage_guides/export_a_model)。

许多已转换为 ONNX 格式的模型可在[这里](https://huggingface.co/Xenova)找到。

### 用法

默认情况下，评分（重排序）模型使用 CPU。

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-onnx-scoring</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

```java
String pathToModel = "/home/langchain4j/model.onnx";
String pathToTokenizer = "/home/langchain4j/tokenizer.json";
OnnxScoringModel scoringModel = new OnnxScoringModel(pathToModel, pathToTokenizer);

Response<Double> response = scoringModel.score("query", "passage");
Double score = response.content();
```

如果您想使用 GPU，可以在[这里](https://onnxruntime.ai/docs/execution-providers/CUDA-ExecutionProvider.html)找到 `onnxruntime_gpu` 版本。

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-onnx-scoring</artifactId>
    <version>1.13.0-beta23</version>
    <exclusions>
        <exclusion>
            <groupId>com.microsoft.onnxruntime</groupId>
            <artifactId>onnxruntime</artifactId>
        </exclusion>
    </exclusions>
</dependency>

<!-- 1.18.0 支持 CUDA 12.x -->
<dependency>
    <groupId>com.microsoft.onnxruntime</groupId>
    <artifactId>onnxruntime_gpu</artifactId>
    <version>1.18.0</version>
</dependency>
```

```java
String pathToModel = "/home/langchain4j/model.onnx";
String pathToTokenizer = "/home/langchain4j/tokenizer.json";

OrtSession.SessionOptions options = new OrtSession.SessionOptions();
options.addCUDA(0);
OnnxScoringModel scoringModel = new OnnxScoringModel(pathToModel, options, pathToTokenizer);

Response<Double> response = scoringModel.score("query", "passage");
Double score = response.content();
```
