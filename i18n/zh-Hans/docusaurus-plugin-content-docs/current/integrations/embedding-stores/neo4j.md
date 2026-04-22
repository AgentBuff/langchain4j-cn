---
sidebar_position: 16
---

# Neo4j

[Neo4j](https://neo4j.com/) 是一个高性能的开源图数据库，专为管理关联数据而设计。Neo4j 的原生图模型非常适合建模复杂且高度互联的领域，如社交图谱、推荐系统和知识网络。通过在 LangChain4j 中的集成，可以在 LangChain4j 库中使用 [Neo4j Vector](https://github.com/neo4j-documentation/labs-pages/blob/publish/modules/genai-ecosystem/pages/vector-search.adoc) 功能。

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-neo4j</artifactId>
    <version>${latest version here}</version>
</dependency>

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-neo4j-retriever</artifactId>
    <version>${latest version here}</version>
</dependency>

<!-- 如果要使用 Spring Boot starter -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-neo4j-spring-boot-starter</artifactId>
    <version>${latest version here}</version>
</dependency>
```

## API 参考 {#api}

LangChain4j 为 Neo4j 集成提供以下类：
- `Neo4jEmbeddingStore`：实现 EmbeddingStore 接口，支持在 Neo4j 数据库中存储和查询向量嵌入。
- `Neo4jText2CypherRetriever`：实现 ContentRetriever 接口，用于从用户问题生成并执行 Cypher 查询，改善从 Neo4j 数据库中检索内容的能力。它将自然语言问题转换为 Cypher 查询，通过 [apoc.meta.data](https://neo4j.com/docs/apoc/current/overview/apoc.meta/apoc.meta.data) 过程利用 Neo4j 模式。
- `KnowledgeGraphWriter`：用于将来自 `LLMGraphTransformer`（一种将一个或多个非结构化文档转换为图的工具）的结构化数据存储为 Neo4j 节点和关系的类。它与数据库无关，这意味着它可以将文本转换为节点和边的集合，也可用于 RedisGraph 等其他图数据库。
- `Neo4jEmbeddingStoreIngestor`：实现 `ParentChildEmbeddingStoreIngestor` 接口，执行多阶段转换管道：转换文档、分割为片段、可选地对子片段应用额外转换、生成嵌入，并在 Neo4j 中存储父子关系和嵌入。
- `Neo4jChatMemoryStore`：实现 `ChatMemoryStore` 接口，在 Neo4j 图数据库中存储和检索对话消息，支持使用 Neo4j 节点和关系高效查询和持久化管理聊天历史。

## 使用示例

### Neo4jEmbeddingStore

以下是创建 `Neo4jEmbeddingStore` 实例的方法：

```java
Neo4jEmbeddingStore embeddingStore = Neo4jEmbeddingStore.builder().<builderParameters>.build();
```

其中 `<builderParameters>` 必须包含 `dimension` 以及 `driver` 或 `withBasicAuth` 参数，以及其他可选参数。

以下是完整的 builder 参数列表：

| 键 | 默认值 | 描述 |
| --- | --- | --- |
| `driver` | *如果未设置 `withBasicAuth` 则必填* | [Java Driver 实例](https://neo4j.com/docs/api/java-driver/current/org.neo4j.driver/org/neo4j/driver/Driver.html) |
| `withBasicAuth` | *如果未设置 `driver` 则必填* | 从 `uri`、`user` 和 `password` 创建 [Java Driver 实例](https://neo4j.com/docs/api/java-driver/current/org.neo4j.driver/org/neo4j/driver/Driver.html) |
| `dimension` | *必填* | 向量的维度 |
| `config` | `org.neo4j.driver.SessionConfig.forDatabase("<databaseName>")` | [SessionConfig 实例](https://neo4j.com/docs/api/java-driver/current/org.neo4j.driver/org/neo4j/driver/SessionConfig.html) |
| `label` | `"Document"` | 标签名称 |
| `embeddingProperty` | `"embedding"` | 嵌入属性名称 |
| `idProperty` | `"id"` | ID 属性名称 |
| `metadataPrefix` | `""` | 元数据前缀 |
| `textProperty` | `"text"` | 文本属性名称 |
| `indexName` | `"vector"` | 向量索引名称 |
| `databaseName` | `"neo4j"` | 数据库名称 |
| `retrievalQuery` | `"RETURN properties(node) AS metadata, node.idProperty AS idProperty, node.textProperty AS textProperty, node.embeddingProperty AS embeddingProperty, score"` | 检索查询 |

因此，要创建 `Neo4jEmbeddingStore` 实例，您需要提供适当的设置：

```java
// ---> 最简嵌入 <---
Neo4jEmbeddingStore minimalEmbedding = Neo4jEmbeddingStore.builder()
    .withBasicAuth(NEO4J_CONNECTION_STRING, USERNAME, ADMIN_PASSWORD)
    .dimension(384)
    .build();

// ---> 自定义嵌入 <---
Neo4jEmbeddingStore customEmbeddingStore = Neo4jEmbeddingStore.builder()
        .withBasicAuth(NEO4J_CONNECTION_STRING, USERNAME, ADMIN_PASSWORD)
        .dimension(384)
        .indexName(CUSTOM_INDEX)
        .metadataPrefix(CUSTOM_METADATA_PREF)
        .label(CUSTOM_LABEL)
        .embeddingProperty(CUSTOM_PROP)
        .idProperty(CUSTOM_ID)
        .textProperty(CUSTOM_TEXT)
        .build();
```

然后您可以通过多种方式添加嵌入并进行搜索：

```java
// ---> 添加最简嵌入 <---
Embedding embedding = embeddingModel.embed("embedText").content();
String id = minimalEmbedding.add(embedding); // 输出：嵌入的 id

// ---> 通过 ID 添加最简嵌入 <---
String id = randomUUID();
Embedding embedding = embeddingModel.embed("embedText").content();
minimalEmbedding.add(id, embedding);

// ---> 带片段添加嵌入 <---
TextSegment segment = TextSegment.from(randomUUID());
Embedding embedding = embeddingModel.embed(segment.text()).content();
String id = minimalEmbedding.add(embedding, segment);

// ---> 带片段和元数据添加嵌入 <---
TextSegment segment = TextSegment.from(randomUUID(), Metadata.from(METADATA_KEY, "test-value"));
Embedding embedding = embeddingModel.embed(segment.text()).content();
String id = minimalEmbedding.add(embedding, segment);

// ---> 批量添加嵌入 <---
Embedding firstEmbedding = embeddingModel.embed("firstEmbedText").content();
Embedding secondEmbedding = embeddingModel.embed("secondEmbedText").content();
List<String> ids = minimalEmbedding.addAll(asList(firstEmbedding, secondEmbedding));

// ---> 带片段批量添加嵌入 <---
TextSegment firstSegment = TextSegment.from("firstText");
Embedding firstEmbedding = embeddingModel.embed(firstSegment.text()).content();
TextSegment secondSegment = TextSegment.from("secondText");
Embedding secondEmbedding = embeddingModel.embed(secondSegment.text()).content();
List<String> ids = minimalEmbedding.addAll(
        asList(firstEmbedding, secondEmbedding),
        asList(firstSegment, secondSegment)
);
```

然后您可以搜索已存储的嵌入：

```java
// ---> 带最大结果数搜索嵌入 <---
String id = minimalEmbedding.add(embedding);
final EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
        .queryEmbedding(embedding)
        .maxResults(10)
        .build();
final List<EmbeddingMatch<TextSegment>> relevant = embeddingStore.search(request).matches();

// ---> 带最小分数搜索嵌入 <---
Embedding embedding = embeddingModel.embed("embedText").content();
String id = minimalEmbedding.add(embedding);
final EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
        .queryEmbedding(embedding)
        .maxResults(10)
        .minScore(0.15)
        .build();
final List<EmbeddingMatch<TextSegment>> relevant = embeddingStore.search(request).matches();

// ---> 带自定义元数据前缀搜索嵌入 <---
String metadataCompleteKey = CUSTOM_METADATA_PREF + METADATA_KEY;
TextSegment segment = TextSegment.from(randomUUID(), Metadata.from(METADATA_KEY, "test-value"));
Embedding embedding = embeddingModel.embed(segment.text()).content();
String id = customEmbeddingStore.add(embedding, segment);
final EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
        .queryEmbedding(embedding)
        .maxResults(10)
        .build();
final List<EmbeddingMatch<TextSegment>> relevant = embeddingStore.search(request).matches();

// ---> 带自定义 ID 属性搜索嵌入 <---
String metadataCompleteKey = CUSTOM_METADATA_PREF + METADATA_KEY;
TextSegment segment = TextSegment.from(randomUUID(), Metadata.from(METADATA_KEY, "test-value"));
Embedding embedding = embeddingModel.embed(segment.text()).content();
String id = embeddingStore.add(embedding, segment);
final EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
                .queryEmbedding(embedding)
                .maxResults(10)
                .build();
final List<EmbeddingMatch<TextSegment>> relevant = embeddingStore.search(request).matches();

// ---> 批量搜索嵌入 <---
List<String> ids = minimalEmbedding.addAll(asList(firstEmbedding, secondEmbedding));
final EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
        .queryEmbedding(firstEmbedding)
        .maxResults(10)
        .build();
final List<EmbeddingMatch<TextSegment>> relevant = embeddingStore.search(request).matches();

// ---> 带片段批量搜索嵌入 <---
List<String> ids = minimalEmbedding.addAll(
        asList(firstEmbedding, secondEmbedding),
        asList(firstSegment, secondSegment)
);
final EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
        .queryEmbedding(firstEmbedding)
        .maxResults(10)
        .build();
final List<EmbeddingMatch<TextSegment>> relevant = embeddingStore.search(request).matches();
```

使用同时利用向量索引和全文索引的混合搜索来获取嵌入：

```java
// ---> 通过 ID 添加嵌入和全文 <---
embeddingStore = Neo4jEmbeddingStore.builder()
        .withBasicAuth("<Bolt URL>", "<username>", "<password>")
        .dimension(384)
        .fullTextIndexName("movie_text")
        .fullTextQuery("Matrix")
        .autoCreateFullText(true)
        .label(LABEL_TO_SANITIZE)
        .build();

List<Embedding> embeddings =
        embeddingModel.embedAll(List.of(TextSegment.from("test"))).content();
        embeddingStore.addAll(embeddings);

final Embedding queryEmbedding = embeddingModel.embed("Matrix").content();

final EmbeddingSearchRequest embeddingSearchRequest = EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)
        .maxResults(1)
        .build();

final List<EmbeddingMatch<TextSegment>> matches =
        embeddingStore.search(embeddingSearchRequest).matches();

// ---> 带自动创建全文索引的嵌入搜索 <---
final String fullTextIndexName = "movie_text";
final String label = "Movie";
final String fullTextSearch = "Matrix";
embeddingStore = Neo4jEmbeddingStore.builder()
        .withBasicAuth("<Bolt URL>", "<username>", "<password>")
        .dimension(384)
        .label(label)
        .indexName("movie_vector_idx")
        .fullTextIndexName(fullTextIndexName)
        .fullTextQuery(fullTextSearch)
        .build();
```

如果全文索引无效，将抛出描述性异常：

```java
// ---> 使用无效全文的错误处理 <---
Neo4jEmbeddingStore embeddingStore = Neo4jEmbeddingStore.builder()
        .withBasicAuth("<Bolt URL>", "<username>", "<password>")
        .dimension(384)
        .fullTextIndexName("full_text_with_invalid_retrieval")
        .fullTextQuery("Matrix")
        .autoCreateFullText(true)
        .fullTextRetrievalQuery("RETURN properties(invalid) AS metadata")
        .label(LABEL_TO_SANITIZE)
        .build();

List<Embedding> embeddings = embeddingModel.embedAll(List.of(TextSegment.from("test"))).content();
embeddingStore.addAll(embeddings);

final Embedding queryEmbedding = embeddingModel.embed("Matrix").content();

final EmbeddingSearchRequest embeddingSearchRequest = EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)
        .maxResults(3)
        .build();
embeddingStore.search(embeddingSearchRequest).matches();
// 此搜索将抛出 ClientException: ... Variable `invalid` not defined ...
```

使用 `dev.langchain4j.store.embedding.filter.Filter` 类执行带元数据过滤的搜索：

```java
// ---> 通过 ID 添加嵌入并带/不带预过滤检索 <---
final List<TextSegment> segments = IntStream.range(0, 10)
                .boxed()
                .map(i -> {
                    if (i == 0) {
                        final Map<String, Object> metas =
                                Map.of("key1", "value1", "key2", 10, "key3", "3", "key4", "value4");
                        final Metadata metadata = new Metadata(metas);
                        return TextSegment.from(randomUUID(), metadata);
                    }
                    return TextSegment.from(randomUUID());
                })
                .toList();

final List<Embedding> embeddings = embeddingModel.embedAll(segments).content();
embeddingStore.addAll(embeddings, segments);

final And filter = new And(
        new And(new IsEqualTo("key1", "value1"), new IsEqualTo("key2", "10")),
        new Not(new Or(new IsIn("key3", asList("1", "2")), new IsNotEqualTo("key4", "value4"))));

TextSegment segmentToSearch = TextSegment.from(randomUUID());
Embedding embeddingToSearch =
        embeddingModel.embed(segmentToSearch.text()).content();
final EmbeddingSearchRequest requestWithFilter = EmbeddingSearchRequest.builder()
        .maxResults(5)
        .minScore(0.0)
        .filter(filter)
        .queryEmbedding(embeddingToSearch)
        .build();
final EmbeddingSearchResult<TextSegment> searchWithFilter = embeddingStore.search(requestWithFilter);
final List<EmbeddingMatch<TextSegment>> matchesWithFilter = searchWithFilter.matches();

final EmbeddingSearchRequest requestWithoutFilter = EmbeddingSearchRequest.builder()
        .maxResults(5)
        .minScore(0.0)
        .queryEmbedding(embeddingToSearch)
        .build();
final EmbeddingSearchResult<TextSegment> searchWithoutFilter = embeddingStore.search(requestWithoutFilter);
final List<EmbeddingMatch<TextSegment>> matchesWithoutFilter = searchWithoutFilter.matches();
```

要在嵌入搜索返回的结果上执行后续查询以读取或写入数据，可以利用节点的 `embeddingId`。例如：

```java
// ... Neo4jEmbeddingStore 实例创建 ...
// ... 添加嵌入....

final List<EmbeddingMatch<TextSegment>> results = embeddingStore.search(/*dev.langchain4j.store.embedding.EmbeddingSearchRequest instance*/)
        .matches();

// 检索 id 以执行后续查询
List<String> nodeIds = results.stream().map(dev.langchain4j.store.embedding.EmbeddingMatch:embeddingId).toList();

String cypher = """
        MATCH (d:Document)
        WHERE d.id IN $ids
        // -- 这里是后续查询，例如
        WITH (d)-[:CONNECTED_TO]->(o:OtherLabel) 
        RETURN o.id
    """;

// 运行后续查询
Map<String, Object> params = Map.of("ids", nodeIds);
final List<Record> list = session.run(cypher, params).list();
```

#### Spring Boot starter

要创建 **Spring Boot starter**，Neo4j starter 目前提供以下 `application.properties`：

```properties
# builder.dimension(dimension) 方法
langchain4j.community.neo4j.dimension=<dimension>
# builder.withBasicAuth(uri, username, password) 方法
langchain4j.community.neo4j.auth.uri=<boltURI>
langchain4j.community.neo4j.auth.user=<username>
langchain4j.community.neo4j.auth.password=<password>
# builder.label(label) 方法
langchain4j.community.neo4j.label=<label>
# builder.indexName(indexName) 方法
langchain4j.community.neo4j.indexName=<indexName>
# builder.metadataPrefix(metadataPrefix) 方法
langchain4j.community.neo4j.metadataPrefix=<metadataPrefix>
# builder.embeddingProperty(embeddingProperty) 方法
langchain4j.community.neo4j.embeddingProperty=<embeddingProperty>
# builder.idProperty(idProperty) 方法
langchain4j.community.neo4j.idProperty=<idProperty>
# builder.textProperty(textProperty) 方法
langchain4j.community.neo4j.textProperty=<textProperty>
# builder.databaseName(databaseName) 方法
langchain4j.community.neo4j.databaseName=<databaseName>
# builder.retrievalQuery(retrievalQuery) 方法
langchain4j.community.neo4j.retrievalQuery=<retrievalQuery>
# builder.awaitIndexTimeout(awaitIndexTimeout) 方法
langchain4j.community.neo4j.awaitIndexTimeout=<awaitIndexTimeout>
```

配置 Starter 后，我们可以创建如下简单的 Spring Boot 项目：

```java
@SpringBootApplication
public class SpringBootExample {

    public static void main(String[] args) {
        SpringApplication.run(SpringBootExample.class, args);
    }

    @Bean
    public AllMiniLmL6V2EmbeddingModel embeddingModel() {
        return new AllMiniLmL6V2EmbeddingModel();
    }
    
}

@RestController
@RequestMapping("/api/embeddings")
public class EmbeddingController {

    private final EmbeddingStore<TextSegment> store;
    private final EmbeddingModel model;

    public EmbeddingController(EmbeddingStore<TextSegment> store, EmbeddingModel model) {
        this.store = store;
        this.model = model;
    }

    // 添加嵌入
    @PostMapping("/add")
    public String add(@RequestBody String text) {
        TextSegment segment = TextSegment.from(text);
        Embedding embedding = model.embed(text).content();
        return store.add(embedding, segment);
    }

    // 搜索嵌入
    @PostMapping("/search")
    public List<String> search(@RequestBody String query) {
        Embedding queryEmbedding = model.embed(query).content();
        EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .maxResults(5)
                .build();
        return store.search(request).matches()
                .stream()
                .map(i -> i.embedded().text()).toList();
    }
}
```

我们定义了可以轻松调用的 API，如下所示：

```shell
# 创建新嵌入
# 并存储标签为 "Spring Boot" 的内容
curl -X POST localhost:8083/api/embeddings/add -H "Content-Type: text/plain" -d "embeddingTest"

# 搜索前 5 个嵌入
curl -X POST localhost:8083/api/embeddings/search -H "Content-Type: text/plain" -d "querySearchTest"
```


### Neo4jText2CypherRetriever

以下是创建 `Neo4jText2CypherRetriever` 实例的方法：

```java
Neo4jText2CypherRetriever retriever = Neo4jText2CypherRetriever.builder().<builderParameters>.build();
```

以下是完整的 builder 参数列表：

| 键 | 默认值 | 描述 |
| --- | --- | --- |
| `graph` | *必填* | 见下文 |
| `chatModel` | *必填* | 用于从自然语言问题创建 Cypher 查询的 [ChatModel](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-core/src/main/java/dev/langchain4j/model/chat/ChatModel.java) 实现 |
| `prompt` | 见下方示例 | 与 chatModel 一起使用的提示词 |
| `examples` | 空字符串 | 用于丰富和改善结果的额外示例 |
| `maxRetries` | 3 | 如果 Cypher 查询生成失败或返回空结果，额外的重试次数 |

要连接到 Neo4j，需要使用 `Neo4jGraph` 类：

```java
// Neo4j Java Driver 连接实例
Driver driver = GraphDatabase.driver("<Bolt URL>", AuthTokens.basic("<username>", "<password>"));

Neo4jGraph neo4jGraph = Neo4jGraph.builder()
    .driver(driver)
    .build();
```

或者使用与 `Neo4jEmbeddingStore` 相同的 `withBasicAuth`：

```java
Neo4jGraph neo4jGraph = Neo4jGraph.builder()
    .withBasicAuth("<Bolt URL>", "<username>", "<password>")
    .build();
```

然后将其传递给 builder：

```java
Neo4jGraph neo4jGraph = /* Neo4jGraph 实例 */;

// ChatModel 实例，例如 OpenAiChatModel
ChatModel chatModel = OpenAiChatModel.builder()
        .apiKey(OPENAI_API_KEY)
        .modelName(GPT_4_O_MINI)
        .build();

// Neo4jText2CypherRetriever 实例
Neo4jText2CypherRetriever retriever = Neo4jText2CypherRetriever.builder()
        .graph(neo4jGraph)
        .chatModel(chatModel)
        .build();
```

您可以通过调整 `sample`（上下文提示中返回的示例路径数量）和 `maxRels`（每个节点标签读取的最大关系数）等参数进一步自定义 `Neo4jGraph` 的行为。这些参数是可选的（默认值分别为 `1000` 和 `100`），如果您希望使用默认行为，可以省略。这对于控制较大图中的提示大小和复杂性特别有用。

此外，可以使用 `Neo4jGraph` 返回实体模式，即描述图结构的模式、节点属性和关系属性列表：

```java
final Neo4jGraph.StructuredSchema structuredSchema = graph.getStructuredSchema();

List<String> patterns = structuredSchema.patterns();
List<String> nodesProperties = structuredSchema.nodesProperties();
List<String> relationshipsProperties = structuredSchema.relationshipsProperties();

/*
输出示例：
`patterns`: [(:Person)-[:WROTE]->(:Book)]
`nodesProperties`: [:Book {title: STRING}, :Person {name: STRING}]
`relationshipsProperties`: [:WROTE {year: 1986}]
*/
```

### 使用 `sample` 和 `maxRels` 的示例

```java
Neo4jGraph neo4jGraph = Neo4jGraph.builder()
    .driver(driver)
    .sample(3L) // 从图模式中最多采样 3 条示例路径
    .maxRels(8L) // 从起始节点最多探索 8 个关系
    .build();

Neo4jText2CypherRetriever retriever = Neo4jText2CypherRetriever.builder()
    .graph(neo4jGraph)
    .chatModel(chatModel)
    .build();
```

以下是一个基本示例：

```java
// 创建数据集，例如：
// CREATE (book:Book {title: 'Dune'})<-[:WROTE {when: date('1999')}]-(author:Person {name: 'Frank Herbert'})

// 创建 Neo4jGraph 实例
Neo4jGraph neo4jGraph = Neo4jGraph.builder()
        .driver(/*<Neo4j Driver 实例>*/)
        .build();

// 创建 Neo4jText2CypherRetriever 实例
Neo4jText2CypherRetriever retriever = Neo4jText2CypherRetriever.builder()
        .graph(neo4jGraph)
        .chatModel(chatModel)
        .build();

Query query = new Query("Who is the author of the book 'Dune'?");

// 检索结果
List<Content> contents = retriever.retrieve(query);

System.out.println(contents.get(0).textSegment().text());
// 输出示例："Frank Herbert"
```

上述代码将使用以下提示字符串执行聊天请求：

```text
Task:Generate Cypher statement to query a graph database.
Instructions
Use only the provided relationship types and properties in the schema.
Do not use any other relationship types or properties that are not provided.
Schema:

Node properties are the following:
:Book {title: STRING}
:Person {name: STRING}

Relationship properties are the following:
:WROTE {when: DATE}

The relationships are the following:
(:Person)-[:WROTE]->(:Book)

Note: Do not include any explanations or apologies in your responses.
Do not respond to any questions that might ask anything else than for you to construct a Cypher statement.
Do not include any text except the generated Cypher statement.
The question is: {{question}}
```

其中 `question` 是 "Who is the author of the book 'Dune'?"，`schema` 由 apoc.meta.data 过程处理以检索并字符串化当前 Neo4j 模式。

如果需要，也可以更改默认提示词：

```java
Neo4jGraph neo4jGraph = /* Neo4jGraph 实例 */

Neo4jText2CypherRetriever.builder()
  .neo4jGraph(neo4jGraph)
  .promptTemplate("<custom prompt>")
  .build();
```

要创建不带任何重试逻辑的检索器，将 `maxRetries` 设置为 `0`：

```java
Neo4jText2CypherRetriever retriever = Neo4jText2CypherRetriever.builder()
    .graph(graph)
    .chatModel(chatModel)
    .maxRetries(0) // 禁用重试逻辑
    .build();
```

当您希望确定性行为并且不希望在 Cypher 生成失败时尝试回退查询时，此配置很有用。通常建议在性能至关重要或外部管理失败处理的场景中使用。

还可以使用 `fromLLM("<question>")` 方法，通过以下提示利用 `chatModel` 根据检索到的上下文和 Cypher 查询生成自然语言答案，其中 `{{context}}` 是从 `Neo4jGraph` 检索的模式，`{{cypher}}` 是由文本转 Cypher 生成的 Cypher 查询，`{{question}}` 是传递给 `fromLLM()` 的参数。

```
Based on the following context and the generated Cypher,
write an answer in natural language to the provided user's question:
Context: {{context}}
Generated Cypher: {{cypher}}
Question: {{question}}
Cypher query:
```

示例用法：

```java
Neo4jText2CypherRetriever neo4jContentRetriever = Neo4jText2CypherRetriever.builder()
        .graph(graph)
        .chatModel(OPEN_AI_CHAT_MODEL)
        .build();

Query query = new Query("Who is the author of the book 'Dune'?");

String response = neo4jContentRetriever.fromLLM(query);
// 输出示例：the author of the book 'Dune' is Frank Herbert
```


### KnowledgeGraphWriter

`KnowledgeGraphWriter` 是一个用于将结构化知识图谱数据写入 Neo4j 的工具类。它旨在与 `LLMGraphTransformer` 生成的数据配合使用，该转换器从非结构化文档中提取节点和关系。

此写入器特别适用于将文本数据转换为图结构并需要高效存储到 Neo4j 数据库（包括可选的文档溯源）的场景。

#### 功能

- 将来自 `GraphDocument` 实例的节点和关系存储到 Neo4j。
- 支持可选存储源文档元数据和内容。
- 自动为实体创建唯一约束。
- 允许自定义标签、关系类型、ID 和文本属性。

以下是创建 `KnowledgeGraphWriter` 实例的方法：

```java
KnowledgeGraphWriter writer = KnowledgeGraphWriter.builder().<builderParameters>.build();
```

#### 完整的 builder 参数列表：

| Builder 方法 | 描述 | 默认值 |
| --- | --- | --- |
| `graph(Neo4jGraph)` | 设置 Neo4j 图连接（必填） | - |
| `label(String)` | 设置节点的实体标签 | `__Entity__` |
| `relType(String)` | 设置实体和文档之间的关系类型 | `HAS_ENTITY` |
| `idProperty(String)` | 设置用作唯一标识符的属性名称 | `id` |
| `textProperty(String)` | 设置用于存储文档文本的属性名称 | `text` |
| `constraintName(String)` | 设置 Neo4j 中唯一性约束的名称 | `knowledge_cons` |

```java
Neo4jGraph graph = Neo4jGraph.builder()
    .withBasicAuth("bolt://localhost:7687", "neo4j", "password")
    .build();

KnowledgeGraphWriter writer = KnowledgeGraphWriter.builder()
    .graph(graph)
    .label("Entity")
    .relType("MENTIONS")
    .idProperty("id")
    .textProperty("text")
    .build();

List<GraphDocument> graphDocuments = ... // 从 LLMGraphTransformer 获取
writer.addGraphDocuments(graphDocuments, true); // 设为 true 以包含文档来源
```


### Neo4jEmbeddingStoreIngestor

`Neo4jEmbeddingStoreIngestor` 是一个专门的摄取类，用于在 Neo4j 图数据库中存储嵌入和相关数据。它提供了可配置的嵌入存储选项、查询模板和提示词，以支持各种知识摄取和检索工作流。

以下是创建 `Neo4jEmbeddingStoreIngestor` 实例的方法：

```java
Neo4jEmbeddingStoreIngestor ingestor = Neo4jEmbeddingStoreIngestor.builder()
    .<builderParameters>
    .build();
```

其中 `<builderParameters>` 包含 `driver` 和 `dimension` 作为必填参数，以及可选的自定义参数。

以下是完整的 builder 参数列表：

| 键 | 默认值 | 描述 |
| --- | --- | --- |
| `driver` | *必填* | [Neo4j Java Driver 实例](https://neo4j.com/docs/api/java-driver/current/org.neo4j.driver/org/neo4j/driver/Driver.html) |
| `retrievalQuery` | 见类默认值 | 用于在嵌入查找期间检索实体的 Cypher 查询 |
| `entityCreationQuery` | 见类默认值 | 用于创建带嵌入的实体的 Cypher 查询 |
| `label` | `"Child"` | Neo4j 中嵌入节点使用的节点标签 |
| `indexName` | `"child_embedding_index"` | 嵌入节点的索引名称 |
| `dimension` | `384` | 嵌入向量的维度 |
| `systemPrompt` | 见类默认值 | LLM 驱动任务的系统提示词 |
| `userPrompt` | 见类默认值 | LLM 驱动任务的用户提示词 |

**使用必填参数的基本用法：**

```java
Neo4jEmbeddingStoreIngestor ingestor = Neo4jEmbeddingStoreIngestor.builder()
    .driver(neo4jDriver)
    .dimension(384)
    .build();
```

**自定义检索和创建查询：**

```java
Neo4jEmbeddingStoreIngestor ingestor = Neo4jEmbeddingStoreIngestor.builder()
    .driver(neo4jDriver)
    .dimension(384)
    .retrievalQuery("MATCH (doc:Document) WHERE doc.id = $id RETURN doc")
    .entityCreationQuery("CREATE (doc:Document {id: $id, embedding: $embedding})")
    .label("Document")
    .indexName("document_embedding_index")
    .build();
```

**使用自定义系统和用户提示词：**

```java
Neo4jEmbeddingStoreIngestor ingestor = Neo4jEmbeddingStoreIngestor.builder()
    .driver(neo4jDriver)
    .dimension(384)
    .systemPrompt("You are an expert knowledge base ingestor.")
    .userPrompt("Please ingest the following content:")
    .build();
```


### 专用场景的 Neo4j 摄取器

以下类扩展了 `Neo4jEmbeddingStoreIngestor`，提供针对特定 [GraphRAG](https://graphrag.com/reference/graphrag) 模式的预配置摄取逻辑。每个摄取器都附带预定义的 Cypher 查询和提示词模板，同时仍允许 builder 级别的自定义。所有摄取器继承 `Neo4jEmbeddingStoreIngestor` 的完整 builder API。

#### SummaryGraphIngestor

实现[全局社区摘要检索器概念](https://graphrag.com/reference/graphrag/global-community-summary-retriever/)。此摄取器使用摘要提示词提取并存储文档的简洁摘要，将其存储为默认标记为 `"Summary"` 的节点，并与原始文档关联。

示例用法：

```java
SummaryGraphIngestor ingestor = SummaryGraphIngestor.builder()
        .driver(driver)
        .embeddingModel(embeddingModel)
        .questionModel(chatModel)
        .documentSplitter(splitter)
        .build();
```

与 `Neo4jEmbeddingStoreIngestor` 不同，它具有以下默认值：

- `query`: `"CREATE (:SummaryChunk $metadata)"`
- `systemPrompt`:
```text
You are generating concise and accurate summaries based on the information found in the text.
```

- `userPrompt`:
```text
Generate a summary of the following input:
{{input}}

Summary:
```

- `embeddingStore`:
```java
private static final String DEFAULT_RETRIEVAL = """
        MATCH (node)<-[:HAS_SUMMARY]-(parent)
        WITH parent, max(score) AS score, node // deduplicate parents
        RETURN parent.text AS text, score, properties(node) AS metadata
        ORDER BY score DESC
        LIMIT $maxResults""";

private static final String DEFAULT_PARENT_QUERY = """
        UNWIND $rows AS row
        MATCH (p:SummaryChunk {parentId: $parentId})
        CREATE (p)-[:HAS_SUMMARY]->(u:%1$s {%2$s: row.%2$s})
        SET u += row.%3$s
        WITH row, u
        CALL db.create.setNodeVectorProperty(u, $embeddingProperty, row.%4$s)
        RETURN count(*)""";

EmbeddingStore defaultEmbeddingStore = Neo4jEmbeddingStore.builder()
    .driver(driver)
    .retrievalQuery(DEFAULT_RETRIEVAL)
    .entityCreationQuery(DEFAULT_PARENT_QUERY)
    .label("Summary")
    .indexName("summary_embedding_index")
    .dimension(384)
    .build();
```

#### HypotheticalQuestionGraphIngestor

实现[假设性问题检索器概念](https://graphrag.com/reference/graphrag/hypothetical-question-retriever/)，通过生成和嵌入从内容块派生的假设性问题来改善语义搜索准确性，特别是对于间接或抽象的用户问题。当查询与文档措辞不直接匹配时，它增强了检索效果。

示例用法：

```java
HypotheticalQuestionGraphIngestor ingestor = HypotheticalQuestionGraphIngestor.builder()
        .embeddingModel(embeddingModel)
        .driver(driver)
        .documentSplitter(splitter)
        .questionModel(chatModel)
        .embeddingStore(embeddingStore)
        .build();
```

与 `Neo4jEmbeddingStoreIngestor` 不同，它具有以下默认值：

- `query`: `"CREATE (:QuestionChunk $metadata)"`
- `systemPrompt`:
```text
You are generating hypothetical questions based on the information found in the text.
Make sure to provide full context in the generated questions.
```

- `userPrompt`:
```text
Use the given format to generate hypothetical questions from the following input:
{{input}}

Hypothetical questions:
```

- `embeddingStore`:
```java
private static final String DEFAULT_RETRIEVAL = """
        MATCH (node)<-[:HAS_QUESTION]-(parent)
        WITH parent, max(score) AS score, node // deduplicate parents
        RETURN parent.text AS text, score, properties(node) AS metadata
        ORDER BY score DESC
        LIMIT $maxResults""";

private static final String DEFAULT_PARENT_QUERY = """
        UNWIND $rows AS question
        MATCH (p:QuestionChunk {parentId: $parentId})
        WITH p, question
        CREATE (q:%1$s {%2$s: question.%2$s})
        SET q += question.%3$s
        MERGE (q)<-[:HAS_QUESTION]-(p)
        WITH q, question
        CALL db.create.setNodeVectorProperty(q, $embeddingProperty, question.%4$s)
        RETURN count(*)""";

EmbeddingStore defaultEmbeddingStore = Neo4jEmbeddingStore.builder()
    .driver(driver)
    .retrievalQuery(DEFAULT_RETRIEVAL_QUERY)
    .entityCreationQuery(DEFAULT_PARENT_QUERY)
    .label("Child")
    .indexName("child_embedding_index")
    .dimension(384)
    .build();
```

#### ParentChildGraphIngestor

实现[父子检索器概念](https://graphrag.com/reference/graphrag/parent-child-retriever/)。适用于在子节点上执行语义搜索但结果锚定到父文档的场景。此摄取器存储带嵌入的子块，默认通过 `:HAS_CHILD` 关系将它们链接到父节点。适合检索相关片段同时引用更广泛的文档上下文。

```java
ParentChildGraphIngestor ingestor = ParentChildGraphIngestor.builder()
        .embeddingModel(embeddingModel)
        .driver(driver)
        .documentSplitter(parentSplitter)
        .documentChildSplitter(childSplitter)
        .build();
```

与 `Neo4jEmbeddingStoreIngestor` 不同，它具有以下默认值：

- `query`: `"CREATE (:ParentChunk $metadata)"`

- `embeddingStore`:
```java
private static final String DEFAULT_RETRIEVAL = """
        MATCH (node)<-[:HAS_CHILD]-(parent)
        WITH parent, collect(node.text) AS chunks, max(score) AS score
        RETURN parent.text + reduce(r = "", c in chunks | r + "\n\n" + c) AS text,
               score,
               properties(parent) AS metadata
        ORDER BY score DESC
        LIMIT $maxResults""";

private static final String DEFAULT_PARENT_QUERY = """
        UNWIND $rows AS row
        MATCH (p:ParentChunk {parentId: $parentId})
        CREATE (p)-[:HAS_CHILD]->(u:%1$s {%2$s: row.%2$s})
        SET u += row.%3$s
        WITH row, u
        CALL db.create.setNodeVectorProperty(u, $embeddingProperty, row.%4$s)
        RETURN count(*)""";

EmbeddingStore defaultEmbeddingStore = Neo4jEmbeddingStore.builder()
        .driver(driver)
        .retrievalQuery(DEFAULT_RETRIEVAL)
        .entityCreationQuery(DEFAULT_PARENT_QUERY)
        .label("Child")
        .indexName("child_embedding_index")
        .dimension(384)
        .build();
```


### Neo4jChatMemoryStore

`Neo4jChatMemoryStore` 是一个专门的聊天记忆实现，在 Neo4j 图数据库中存储和检索对话消息。它支持使用 Neo4j 节点和关系高效查询和持久化管理聊天历史。

以下是创建 `Neo4jChatMemoryStore` 实例的方法：

```java
Neo4jChatMemoryStore chatMemoryStore = Neo4jChatMemoryStore.builder()
    .<builderParameters>
    .build();
```

其中 `<builderParameters>` 包含 `driver` 作为必填参数，以及标签和节点属性名称的可选属性。

以下是完整的 builder 参数列表：

| 键 | 默认值 | 描述 |
| --- | --- | --- |
| `driver` | *必填* | [Neo4j Java Driver 实例](https://neo4j.com/docs/api/java-driver/current/org.neo4j.driver/org/neo4j/driver/Driver.html) |
| `label` | `"ChatMessage"` | Neo4j 中聊天消息节点使用的标签 |
| `idProperty` | `"id"` | 消息 ID 的属性名称 |
| `conversationIdProperty` | `"conversationId"` | 标识对话的属性名称 |
| `timestampProperty` | `"timestamp"` | 消息时间戳的属性名称 |

#### 示例

**使用必填参数的基本用法：**

```java
Neo4jChatMemoryStore chatMemoryStore = Neo4jChatMemoryStore.builder()
    .driver(neo4jDriver)
    .build();
```

**自定义节点标签和属性：**

```java
Neo4jChatMemoryStore chatMemoryStore = Neo4jChatMemoryStore.builder()
    .driver(neo4jDriver)
    .label("Message")
    .idProperty("messageId")
    .conversationIdProperty("convId")
    .timestampProperty("timeSent")
    .build();
```


### 简单流程示例

以下是 `Neo4jEmbeddingStore` 和 `Neo4jText2CypherRetriever` API 使用流程的几个示例。

- `Neo4jEmbeddingStore`:
```java
private static final EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();

public static void minimalEmbedding() {
    try (Neo4jContainer<?> neo4j = new Neo4jContainer<>("neo4j:5.26")) {
        neo4j.start();

        EmbeddingStore<TextSegment> minimalEmbedding = Neo4jEmbeddingStore.builder()
                .withBasicAuth(neo4j.getBoltUrl(), "neo4j", neo4j.getAdminPassword())
                .dimension(384)
                .build();


        TextSegment segment1 = TextSegment.from("I like football.", Metadata.from("test-key-1", "test-value-1"));
        Embedding embedding1 = embeddingModel.embed(segment1).content();

        TextSegment segment2 = TextSegment.from("The weather is good today.", Metadata.from("test-key-2", "test-value-2"));
        Embedding embedding2 = embeddingModel.embed(segment2).content();

        TextSegment segment3 = TextSegment.from("I like basketball.", Metadata.from("test-key-3", "test-value-3"));
        Embedding embedding3 = embeddingModel.embed(segment3).content();
        minimalEmbedding.addAll(
                List.of(embedding1, embedding2, embedding3),
                List.of(segment1, segment2, segment3)
        );

        Embedding queryEmbedding = embeddingModel.embed("What are your favourite sports?").content();
        final EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .maxResults(2)
                .minScore(0.15)
                .build();
        List<EmbeddingMatch<TextSegment>> relevant = minimalEmbedding.search(request).matches();
        relevant.forEach(match -> {
            System.out.println(match.score()); // 0.8144289255142212
            System.out.println(match.embedded().text()); // I like football. || I like basketball.
        });
    }
}

public static void customEmbeddingStore() {
    try (Neo4jContainer<?> neo4j = new Neo4jContainer<>("neo4j:5.26")) {
        neo4j.start();
        
        Neo4jEmbeddingStore customEmbeddingStore = Neo4jEmbeddingStore.builder()
                .withBasicAuth(neo4j.getBoltUrl(), "neo4j", neo4j.getAdminPassword())
                .dimension(384)
                .indexName("customidx")
                .label("CustomLabel")
                .embeddingProperty("customProp")
                .idProperty("customId")
                .textProperty("customText")
                .build();
        
        TextSegment segment1 = TextSegment.from("I like football.");
        Embedding embedding1 = embeddingModel.embed(segment1).content();
        customEmbeddingStore.add(embedding1, segment1);

        TextSegment segment2 = TextSegment.from("The weather is good today.");
        Embedding embedding2 = embeddingModel.embed(segment2).content();
        customEmbeddingStore.add(embedding2, segment2);

        Embedding queryEmbedding = embeddingModel.embed("What is your favourite sport?").content();
        final EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .maxResults(1)
                .build();
        List<EmbeddingMatch<TextSegment>> relevant = customEmbeddingStore.search(request).matches();
        EmbeddingMatch<TextSegment> embeddingMatch = relevant.get(0);

        System.out.println(embeddingMatch.score()); // 0.8144289255142212
        System.out.println(embeddingMatch.embedded().text()); // I like football.
    }
}
```

- `Neo4jText2CypherRetriever`:
```java
    private final ChatModel chatModel;

    public void Neo4jText2CypherRetriever() {
        try (
                Neo4jContainer<?> neo4jContainer = new Neo4jContainer<>("neo4j:5.16.0")
                                                        .withoutAuthentication()
                                                        .withLabsPlugins("apoc")
        ) {
            neo4jContainer.start();
            try (Driver driver = GraphDatabase.driver(neo4jContainer.getBoltUrl(), AuthTokens.none())) {
                try (Neo4jGraph graph = Neo4jGraph.builder().driver(driver).build()) {
                    try (Session session = driver.session()) {
                        session.run("CREATE (book:Book {title: 'Dune'})<-[:WROTE]-(author:Person {name: 'Frank Herbert'})");
                    }
                    graph.refreshSchema();
                    
                    Neo4jText2CypherRetriever retriever = Neo4jText2CypherRetriever.builder()
                            .graph(graph)
                            .chatModel(chatModel)
                            .build();

                    Query query = new Query("Who is the author of the book 'Dune'?");

                    List<Content> contents = retriever.retrieve(query);

                    System.out.println(contents.get(0).textSegment().text()); // "Frank Herbert"
                }
            }
        }
    }
```

[示例源码](https://github.com/langchain4j/langchain4j-examples/tree/main/neo4j-example/src/main/java)
