---
sidebar_position: 9
---

# Oracle Coherence

https://coherence.community/

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-coherence</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

`langchain4j-coherence` 模块将 Coherence 作为 provided 依赖，可与多个 Coherence 版本配合使用。
开发者需要自行引入相关 Coherence 依赖，可选社区版（Community Edition）或商业版。
Coherence CE 的 groupId 为 `com.oracle.coherence.ce`，商业版为 `com.oracle.coherence`。

例如，使用社区版（CE）时，在 dependencyManagement 中添加 Coherence BOM，然后添加 Coherence 依赖。其他 Coherence 模块可按需添加。

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.oracle.coherence.ce</groupId>
            <artifactId>coherence-bom</artifactId>
            <version>24.09</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-coherence</artifactId>
        <version>1.13.0-beta23</version>
    </dependency>
    <dependency>
        <groupId>com.oracle.coherence.ce</groupId>
        <artifactId>coherence</artifactId>
    </dependency>
</dependencies>
```

## API 参考 {#api}

- `CoherenceEmbeddingStore`
- `CoherenceChatMemoryStore`

## 示例

- [CoherenceEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/oracle-coherence-example/src/main/java/CoherenceEmbeddingStoreExample.java)
