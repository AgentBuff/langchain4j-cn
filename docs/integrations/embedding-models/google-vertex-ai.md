---
sidebar_position: 7
---

# Google Vertex AI

## 入门

请先参阅 [Vertex AI Gemini 集成教程](../language-models/google-vertex-ai-gemini) 中的"入门"章节，
创建 Google Cloud Platform 账号并建立一个启用了 Vertex AI API 的新项目。

## 添加依赖

在项目 `pom.xml` 中添加以下依赖：

```xml
<dependency>
  <groupId>dev.langchain4j</groupId>
  <artifactId>langchain4j-vertex-ai</artifactId>
  <version>1.13.0-beta23</version>
</dependency>
```

或在 `build.gradle` 中：

```groovy
implementation 'dev.langchain4j:langchain4j-vertex-ai:1.13.0-beta23'
```

### 示例代码：

[Vertex AI 嵌入模型使用示例](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/embedding/model/VertexAiEmbeddingModelExample.java)

`PROJECT_ID` 字段代表您创建 Google Cloud 项目时设置的变量。

```java
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.model.vertexai.VertexAiEmbeddingModel;

public class VertexAiEmbeddingModelExample {
    
    private static final String PROJECT_ID = "YOUR-PROJECT-ID";
    private static final String MODEL_NAME = "textembedding-gecko@latest";

    public static void main(String[] args) {

        EmbeddingModel embeddingModel = VertexAiEmbeddingModel.builder()
                .project(PROJECT_ID)
                .location("us-central1")
                .endpoint("us-central1-aiplatform.googleapis.com:443")
                .publisher("google")
                .modelName(MODEL_NAME)
                .build();

        Response<Embedding> response = embeddingModel.embed("Hello, how are you?");
        
        Embedding embedding = response.content();

        int dimension = embedding.dimension(); // 768
        float[] vector = embedding.vector(); // [-0.06050122, -0.046411075, ...

        System.out.println(dimension);
        System.out.println(embedding.vectorAsList());
    }
}
```

### 可用嵌入模型

|英文模型|多语言模型|
|---|---|
|`textembedding-gecko@001`|`textembedding-gecko-multilingual@001`|
|`textembedding-gecko@003`|`text-multilingual-embedding-002`|
|`text-embedding-004`|   |

[多语言模型支持的语言列表](https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-text-embeddings#language_coverage_for_textembedding-gecko-multilingual_models)

带有 `@latest` 后缀的模型名称表示最新版本。

默认情况下，大多数嵌入模型输出 768 维向量嵌入（"Matryoshka"模型支持可配置的更低维度除外）。
API 每段最多接受 2,048 个输入 token。
最多可发送 250 个文本段。
当您请求同时嵌入超过 250 个段时，`VertexAiEmbeddingModel` 会自动透明地将请求拆分为多个批次。
嵌入 API 每次调用（所有段合计）的 token 上限为 20,000 个。当达到该限制时，`VertexAiEmbeddingModel` 会再次批量请求以避免超限。

### 配置嵌入模型

```java
EmbeddingModel embeddingModel = VertexAiEmbeddingModel.builder()
    .project(PROJECT_ID)
    .location("us-central1")
    .endpoint("us-central1-aiplatform.googleapis.com:443") // 可选
    .publisher("google")
    .modelName(MODEL_NAME)
    .maxRetries(2)             // 默认为 2
    .maxSegmentsPerBatch(250)  // 每批最多 250 段
    .maxTokensPerBatch(2048)   // 每段最多 2048 token
    .taskType()                // 见下方任务类型
    .titleMetadataKey()        // 对于 RETRIEVAL_DOCUMENT 任务，可指定文档标题  
                               // 用于标识文本段的文档来源
    .autoTruncate(false)       // 默认为 false：截断超过 2048 输入 token 的段
    .outputDimensionality(512) // 支持不同输出向量维度的模型
    .credentials(credentials)  // 自定义 Google Cloud 凭据    
    .build();
```

## 嵌入任务类型

嵌入模型可用于不同的使用场景。
为获得更好的嵌入效果，可指定以下任务类型之一：

* `RETRIEVAL_QUERY`
* `RETRIEVAL_DOCUMENT`
* `SEMANTIC_SIMILARITY`
* `CLASSIFICATION`
* `CLUSTERING`
* `QUESTION_ANSWERING`
* `FACT_VERIFICATION`
* `CODE_RETRIEVAL_QUERY`

请参阅[支持的模型列表](https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/task-types)。

### 参考资料

[Google Codelab：Vertex AI 嵌入模型](https://codelabs.developers.google.com/codelabs/genai-chat-java-palm-langchain4j)

[可用稳定嵌入模型](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/text-embeddings#model_versions)

[最新嵌入模型版本](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versioning#palm-latest-models)
