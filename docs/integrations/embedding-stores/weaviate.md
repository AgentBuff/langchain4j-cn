---
sidebar_position: 27
---

# Weaviate

https://weaviate.io/

## Maven 依赖

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-weaviate</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## API 参考 {#api}

- `WeaviateEmbeddingStore`

## 使用方式

|      参数      | 描述                                                                                                                                                                                                             | 是否必填                        |
|:--------------:|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------|
|    `apiKey`    | Weaviate API Key。本地部署时无需填写。                                                                                                                                                                           | 可选                           |
|    `scheme`    | 集群 URL 的协议，如 "https"。可在 Weaviate 集群详情页找到。                                                                                                                                                     | 必填                           |
|    `host`      | 集群 URL 的主机名，如 "langchain4j-4jw7ufd9.weaviate.network"。可在 Weaviate 集群详情页找到。                                                                                                                   | 必填                           |
|    `port`      | 端口号，如 8080。                                                                                                                                                                                                | 可选                           |
| `objectClass`  | 要存储的对象类，如 "MyGreatClass"。必须以大写字母开头。                                                                                                                                                          | 可选（默认：`Default`）         |
|  `avoidDups`   | 若为 `true`（默认），`WeaviateEmbeddingStore` 将根据文本段生成哈希 ID，避免数据库中出现重复条目；若为 `false`，则生成随机 ID。                                                                                    | 可选（默认：`true`）            |
| `consistencyLevel` | 一致性级别：`ONE`、`QUORUM`（默认）或 `ALL`。详情见[此处](https://weaviate.io/developers/weaviate/concepts/replication-architecture/consistency#tunable-write-consistency)。                                   | 可选（默认：`QUORUM`）          |
| `useGrpcForInserts` | 批量插入时使用 GRPC 代替 HTTP（仅批量插入）。搜索仍需配置 HTTP。                                                                                                                                             | 可选                           |
|  `securedGrpc`  | GRPC 连接是否安全。                                                                                                                                                                                              | 可选                           |
|   `grpcPort`   | 端口号，如 50051。                                                                                                                                                                                               | 可选                           |
| `textFieldName` | 包含 `TextSegment` 文本内容的字段名称。                                                                                                                                                                          | 可选（默认：`text`）            |
| `metadataFieldName` | 存储 `Metadata` 条目的字段名称。若设为空字符串（`""`），`Metadata` 条目将存储在根对象中。推荐使用根对象时配合 `metadataKeys`。                                                                                   | 可选（默认：`_metadata`）       |
|  `metadataKeys` | 需要持久化的元数据键。                                                                                                                                                                                           | 可选                           |

## 示例

- [WeaviateEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/weaviate-example/src/main/java/WeaviateEmbeddingStoreExample.java)
