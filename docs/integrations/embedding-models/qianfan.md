---
sidebar_position: 18
---

# 千帆

[百度智能云千帆大模型平台](https://cloud.baidu.com/product/wenxinworkshop) 提供了一系列可用于文本生成、
文本嵌入等任务的 AI 模型。

## Maven 依赖

:::note
自 `1.0.0-alpha1` 起，`langchain4j-qianfan` 已迁移到 `langchain4j-community` 并重命名为
`langchain4j-community-qianfan`。
:::

`1.0.0-alpha1` 之前：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-qianfan</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-alpha1` 及以上版本：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-qianfan</artifactId>
    <version>${latest version here}</version>
</dependency>
```

### Spring Boot

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-qianfan-spring-boot-starter</artifactId>
    <version>${latest version here}</version>
</dependency>
```

或使用 BOM 统一管理依赖：

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

- `QianfanEmbeddingModel`

## 示例

- [QianfanEmbeddingModelIT](https://github.com/langchain4j/langchain4j-community/blob/main/models/langchain4j-community-qianfan/src/test/java/dev/langchain4j/community/model/qianfan/QianfanEmbeddingModelIT.java)
