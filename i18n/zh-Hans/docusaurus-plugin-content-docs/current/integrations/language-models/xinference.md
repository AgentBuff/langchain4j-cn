---
sidebar_position: 21
---

# Xinference

- https://inference.readthedocs.io/


## Maven 依赖

`1.0.0-alpha1` 及以上版本：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-xinference</artifactId>
    <version>${latest version here}</version>
</dependency>
```

或者，使用 BOM 统一管理依赖版本：

```xml
<dependencyManagement>
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-community-bom</artifactId>
        <version>${latest version here}</version>
        <type>pom</type>
        <scope>import</scope>
    </dependency>
</dependencyManagement>
```


## API 参考 {#api}

- `XinferenceChatModel`
- `XinferenceStreamingChatModel`


## 示例

- [XinferenceChatModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-xinference/src/test/java/dev/langchain4j/community/model/xinference/XinferenceChatModelIT.java)
- [XinferenceStreamingChatModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-xinference/src/test/java/dev/langchain4j/community/model/xinference/XinferenceStreamingChatModelIT.java)
