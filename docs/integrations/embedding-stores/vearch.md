---
sidebar_position: 25
---

# Vearch

https://github.com/vearch/vearch


## Maven 依赖

:::note
自 `1.0.0-alpha1` 起，`langchain4j-vearch` 已迁移至 `langchain4j-community`，并更名为 `langchain4j-community-vearch`。
:::

`0.36.2` 及之前版本：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-vearch</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

`1.0.0-alpha1` 及之后版本：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-vearch</artifactId>
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

### `1.0.0-alpha1` 及之前版本

:::note
* `1.0.0-alpha1` 及之前的 `langchain4j-vearch` 使用 Vearch [旧版 API](https://vearch.readthedocs.io/zh-cn/v3.3.x/overview.html)，该 API 在 vearch 3.4.x 版本中已弃用。
* `1.0.0-alpha1` 及之后的 `langchain4j-community-vearch` 使用 Vearch [最新 API](https://vearch.readthedocs.io/zh-cn/latest/overview.html)，支持 3.5.x 和 3.4.x 版本。

推荐使用支持最新版本 Vearch 的 `langchain4j-community-vearch`。
:::

使用 `VearchEmbeddingStore` 需要先实例化 `VearchConfig`：

```java
String embeddingFieldName = "text_embedding";
String textFieldName = "text";
Map<String, Object> metadata = createMetadata().toMap();

// 初始化属性
Map<String, SpacePropertyParam> properties = new HashMap<>(4);
properties.put(embeddingFieldName, SpacePropertyParam.VectorParam.builder()
        .index(true)
        .storeType(SpaceStoreType.MEMORY_ONLY)
        .dimension(384)
        .build());
properties.put(textFieldName, SpacePropertyParam.StringParam.builder().build());
// 添加元数据... 例如：properties.put("name", SpacePropertyParam.StringParam.builder().build());

VearchConfig vearchConfig = VearchConfig.builder()
        .spaceEngine(SpaceEngine.builder()
                .name("gamma")
                .indexSize(1L)
                .retrievalType(RetrievalType.FLAT)
                .retrievalParam(RetrievalParam.FLAT.builder()
                        .build())
                .build())
        .properties(properties)
        .embeddingFieldName(embeddingFieldName)
        .textFieldName(textFieldName)
        .databaseName(databaseName)
        .spaceName(spaceName)
        .modelParams(singletonList(ModelParam.builder()
                .modelId("vgg16")
                .fields(singletonList("string"))
                .out("feature")
                .build()))
        .build();
```

然后创建 `VearchEmbeddingStore`：

```java
VearchEmbeddingStore embeddingStore = VearchEmbeddingStore.builder()
        .vearchConfig(vearchConfig)
        .baseUrl(baseUrl)
        .build();
```


### `1.0.0-alpha1` 及之后版本

使用 `VearchEmbeddingStore` 需要先实例化 `VearchConfig`：

```java
String embeddingFieldName = "text_embedding";
String textFieldName = "text";
String spaceName = "embedding_space_" + ThreadLocalRandom.current().nextInt(0, Integer.MAX_VALUE);

// 初始化字段
List<Field> fields = new ArrayList<>(4);
List<String> metadataFieldNames = new ArrayList<>();
fields.add(VectorField.builder()
        .name(embeddingFieldName)
        .dimension(embeddingModel.dimension())
        .index(Index.builder()
                .name("gamma")
                .type(IndexType.HNSW)
                .params(HNSWParam.builder()
                        .metricType(MetricType.INNER_PRODUCT)
                        .efConstruction(100)
                        .nLinks(32)
                        .efSearch(64)
                        .build())
                .build())
        .build()
);
fields.add(StringField.builder().name(textFieldName).fieldType(FieldType.STRING).build());
// 添加元数据... 例如：fields.add(StringField.builder().name("name").fieldType(FieldType.STRING).build());

VearchConfig vearchConfig = VearchConfig.builder()
        .databaseName(databaseName)
        .spaceName(spaceName)
        .textFieldName(textFieldName)
        .embeddingFieldName(embeddingFieldName)
        .fields(fields)
        .metadataFieldNames(metadataFieldNames)
        .searchIndexParam(HNSWSearchParam.builder()
                // 目前仅支持 INNER_PRODUCT
                .metricType(MetricType.INNER_PRODUCT)
                .efSearch(64)
                .build())
        .build();
```

然后创建 `VearchEmbeddingStore`：

```java
VearchEmbeddingStore embeddingStore = VearchEmbeddingStore.builder()
        .vearchConfig(vearchConfig)
        .baseUrl(baseUrl)
        .logRequests(true)
        .logResponses(true)
        .build();
```


## 示例

- [VearchEmbeddingStoreIT](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-vearch/src/test/java/dev/langchain4j/store/embedding/vearch/VearchEmbeddingStoreIT.java)
