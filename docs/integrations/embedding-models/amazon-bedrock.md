---
sidebar_position: 2
---

# Amazon Bedrock


## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-bedrock</artifactId>
    <version>1.13.0</version>
</dependency>
```


## AWS 凭据
要使用 Amazon Bedrock 嵌入模型，需要配置 AWS 凭据。
其中一种方式是设置环境变量 `AWS_ACCESS_KEY_ID` 和 `AWS_SECRET_ACCESS_KEY`。
更多信息请参阅[此处](https://docs.aws.amazon.com/bedrock/latest/userguide/security-iam.html)。

## Cohere 模型
- `BedrockCohereEmbeddingModel`

## Cohere 嵌入模型
支持 Bedrock Cohere 嵌入模型，可使用以下版本：

- **`cohere.embed-english-v3`**
- **`cohere.embed-multilingual-v3`**

这些模型非常适合为英文和多语言文本处理任务生成高质量的文本嵌入。

### 实现示例

以下是配置和使用 Bedrock 嵌入模型的示例：

```
BedrockCohereEmbeddingModel embeddingModel = BedrockCohereEmbeddingModel
        .builder()
        .region(Region.US_EAST_1)
        .model("cohere.embed-multilingual-v3")
        .inputType(BedrockCohereEmbeddingModel.InputType.SEARCH_QUERY)
        .truncation(BedrockCohereEmbeddingModel.Truncate.NONE)
        .build();
```

## API 参考 {#api}

- `BedrockTitanEmbeddingModel`
- `BedrockCohereEmbeddingModel`

## 示例

- [BedrockEmbeddingIT](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-bedrock/src/test/java/dev/langchain4j/model/bedrock/BedrockEmbeddingIT.java)
