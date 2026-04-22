---
sidebar_position: 10
---

# Hugging Face

如需使用 [Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers/index)，
请引入 `langchain4j-open-ai` 模块，因为 Hugging Face Inference Providers API 与 OpenAI 兼容。


## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
    <version>1.13.0</version>
</dependency>
```

## 示例

```java
ChatModel model = OpenAiChatModel.builder()
    .apiKey(System.getenv("HF_API_KEY"))
    .baseUrl("https://router.huggingface.co/v1")
    .modelName("HuggingFaceTB/SmolLM3-3B:hf-inference")
    .build();

StreamingChatModel streamingModel = OpenAiStreamingChatModel.builder()
    .apiKey(System.getenv("HF_API_KEY"))
    .baseUrl("https://router.huggingface.co/v1")
    .modelName("HuggingFaceTB/SmolLM3-3B:hf-inference")
    .build();
```
