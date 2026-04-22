---
sidebar_position: 13
---

# 分类

## **概览**
本文档展示了如何在 Java 中使用 **LangChain4j** 实现一个分类系统。
分类对于将文本归入预定义标签非常重要，
例如 **情感分析、意图识别** 和 **实体识别**。

这个示例演示了如何使用 LangChain4j 的 AI 驱动服务来完成**情感分类**。

---

## **情感分类服务**
情感分类系统会把输入文本归入以下 **sentiment categories** 之一：
- **POSITIVE**
- **NEUTRAL**
- **NEGATIVE**

### **实现**
```java
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.UserMessage;

public class SentimentClassification {

    // Initialize the chat model using OpenAI
    static ChatModel chatModel = OpenAiChatModel.withApiKey("YOUR_OPENAI_API_KEY");

    // Define the Sentiment enum
    enum Sentiment {
        POSITIVE, NEUTRAL, NEGATIVE
    }

    // Define the AI-powered Sentiment Analyzer interface
    interface SentimentAnalyzer {

        @UserMessage("Analyze sentiment of {{it}}")
        Sentiment analyzeSentimentOf(String text);

        @UserMessage("Does {{it}} have a positive sentiment?")
        boolean isPositive(String text);
    }

    public static void main(String[] args) {

        // Create an AI-powered Sentiment Analyzer instance
        SentimentAnalyzer sentimentAnalyzer = AiServices.create(SentimentAnalyzer.class, chatModel);

        // Example Sentiment Analysis
        Sentiment sentiment = sentimentAnalyzer.analyzeSentimentOf("I love this product!");
        System.out.println(sentiment); // Expected Output: POSITIVE

        boolean positive = sentimentAnalyzer.isPositive("This is a terrible experience.");
        System.out.println(positive); // Expected Output: false
    }
}
```

---

## **组件说明**

### **1. Chat Model 初始化**
```java
static ChatModel chatModel = OpenAiChatModel.withApiKey("YOUR_OPENAI_API_KEY");
```
- 初始化 **OpenAI Chat Model**，用于处理自然语言文本。
- 请将 `"YOUR_OPENAI_API_KEY"` 替换为真实的 OpenAI API key。

### **2. 定义情感类别**
```java
enum Sentiment {
    POSITIVE, NEUTRAL, NEGATIVE
}
```
- `Sentiment` 枚举表示可能的情感分类结果。

### **3. 创建 AI 驱动的情感分析器**
```java
interface SentimentAnalyzer {
    
    @UserMessage("Analyze sentiment of {{it}}")
    Sentiment analyzeSentimentOf(String text);

    @UserMessage("Does {{it}} have a positive sentiment?")
    boolean isPositive(String text);
}
```
- 这个接口定义了两个 AI 驱动的方法：
    - `analyzeSentimentOf(String text)`：将给定文本分类为 **POSITIVE、NEUTRAL** 或 **NEGATIVE**。
    - `isPositive(String text)`：如果文本具有正向情感，则返回 `true`；否则返回 `false`。

### **4. 创建 AI Service 实例**
```java
SentimentAnalyzer sentimentAnalyzer = AiServices.create(SentimentAnalyzer.class, chatModel);
```
- `AiServices.create()` 会基于 AI 模型动态实现 `SentimentAnalyzer` 接口。

### **5. 运行情感分析**
```java
Sentiment sentiment = sentimentAnalyzer.analyzeSentimentOf("I love this product!");
System.out.println(sentiment); // Output: POSITIVE

boolean positive = sentimentAnalyzer.isPositive("This is a terrible experience.");
System.out.println(positive); // Output: false
```
- AI 模型会将给定文本归入预定义情感类别之一。
- `isPositive()` 方法则直接返回布尔结果。

---

## **使用场景**
这个情感分类服务可以用于多种应用场景，包括：

✅ **客户反馈分析**：将客户评论分类为正向、中性或负向。  
✅ **社交媒体监测**：分析社交媒体评论中的情感趋势。  
✅ **聊天机器人响应优化**：理解用户情绪，从而给出更合适的回复。


## 示例 {#examples}

- [Example of classification using LLM](https://github.com/langchain4j/langchain4j-examples/blob/5c5fc14613101a84fe32b39200e30701fec45194/other-examples/src/main/java/OtherServiceExamples.java#L27)
- [Example of classification using embeddings](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/embedding/classification/EmbeddingModelTextClassifierExample.java)
