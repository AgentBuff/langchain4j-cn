---
sidebar_position: 8
---

# RAG（检索增强生成）

LLM 的知识仅限于它训练时见过的数据。
如果你希望让 LLM 理解领域专有知识或私有数据，可以：
- 使用 RAG，这正是本页要介绍的内容
- 使用你的数据对 LLM 进行微调
- [同时结合 RAG 与微调](https://gorilla.cs.berkeley.edu/blogs/9_raft.html)


## 什么是 RAG？ {#what-is-rag}

简单来说，RAG 就是在把请求发送给 LLM 之前，
先从你的数据中找出相关的信息片段，并将它们注入 prompt。
这样 LLM 就能获得相关信息，并据此回答问题，
从而降低产生幻觉的概率。

这些相关信息片段可以通过多种
[信息检索](https://en.wikipedia.org/wiki/Information_retrieval) 方法找到。
最常见的是：
- 全文（关键词）检索。该方法使用 TF-IDF、BM25 等技术，
  将查询中的关键词（例如用户提出的问题）与文档库中的内容进行匹配，
  并根据关键词在每篇文档中的频率和相关性对结果排序。
- 向量检索，也叫“语义检索”。
  文本文档会先通过 embedding model 转换为数字向量，
  然后根据查询向量与文档向量之间的余弦相似度，
  或其他相似度 / 距离度量进行检索与排序，
  从而捕捉更深层的语义含义。
- 混合检索。组合多种检索方式（例如全文检索 + 向量检索）通常能够提升检索效果。

当前这一页主要聚焦于向量检索。
全文检索和混合检索目前仅由 Azure AI Search 集成和 Elasticsearch 支持，
更多细节请参阅 `AzureAiSearchContentRetriever` 和 `ElasticsearchContentRetriever`。
我们计划在不久的将来进一步扩展 RAG 工具箱，纳入全文检索和混合检索能力。


## RAG 的阶段 {#rag-stages}
RAG 过程分为两个清晰的阶段：索引（indexing）和检索（retrieval）。
LangChain4j 为这两个阶段都提供了工具支持。

### 索引 {#indexing}

在索引阶段，文档会先经过预处理，以便在检索阶段能够高效搜索。

这个过程会随着所采用的信息检索方法不同而有所差异。
对于向量检索，这通常意味着：清洗文档、补充额外数据和元数据、
将文档切分成更小的片段（也就是 chunking）、对这些片段做 embedding，
最后把它们存入 embedding store（也叫向量数据库）。

索引阶段通常在线下进行，也就是说不需要让最终用户等待它完成。
例如，可以通过一个 cron job，在每周周末重新索引一次公司的内部文档。
负责索引的代码也可以单独放在一个只处理索引任务的应用中。

不过在某些场景里，最终用户可能希望上传他们自己的文档，
从而让 LLM 可以访问这些内容。
此时，索引就应该在线执行，并成为主应用的一部分。

下面是索引阶段的简化示意图：
![](/img/rag-ingestion.png)


### 检索 {#retrieval}

检索阶段通常在线发生，也就是当用户提交一个问题，
并期望系统基于已索引文档来回答时。

这个过程同样会因所采用的信息检索方式而异。
对于向量检索，这通常意味着对用户的查询（问题）做 embedding，
并在 embedding store 中执行相似度搜索。
随后，将相关的 segment（原始文档的片段）注入 prompt，再发送给 LLM。

下面是检索阶段的简化示意图：
![](/img/rag-retrieval.png)


## LangChain4j 中的 RAG 形态 {#rag-flavours-in-langchain4j}

LangChain4j 提供三种 RAG 形态：
- [Easy RAG](/tutorials/rag/#easy-rag)：开始使用 RAG 的最简单方式
- [Naive RAG](/tutorials/rag/#naive-rag)：基于向量检索的基础 RAG 实现
- [Advanced RAG](/tutorials/rag/#advanced-rag)：模块化的 RAG 框架，支持查询转换、多源检索、重排序等额外步骤


## 简易 RAG {#easy-rag}
LangChain4j 提供了 “Easy RAG” 功能，尽可能降低 RAG 的入门门槛。
你无需先学习 embeddings、选择向量库、寻找合适的 embedding model，
也不必自己研究如何解析和切分文档等。
只要把文档交给它，LangChain4j 就会自动帮你处理。

如果你需要可高度定制的 RAG，请直接跳到[下一节](/tutorials/rag#core-rag-apis)。

如果你使用的是 Quarkus，还有一种更简单的 Easy RAG 使用方式。
请阅读 [Quarkus 文档](https://docs.quarkiverse.io/quarkus-langchain4j/dev/rag-easy-rag.html)。

:::note
这种 “Easy RAG” 的质量当然会低于精心定制的 RAG 方案。
但它是学习 RAG 和 / 或快速做 PoC 的最简单方式。
之后，你可以从 Easy RAG 平滑过渡到更高级的 RAG，
逐步调整和定制更多细节。
:::

1. 引入 `langchain4j-easy-rag` 依赖：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-easy-rag</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

2. 加载你的文档：
```java
List<Document> documents = FileSystemDocumentLoader.loadDocuments("/home/langchain4j/documentation");
```
这会加载指定目录下的所有文件。

<details>
<summary>底层发生了什么？</summary>

这里使用了 Apache Tika 库来识别文档类型并完成解析，它支持非常广泛的文档格式。
由于我们没有显式指定要使用哪个 `DocumentParser`，
`FileSystemDocumentLoader` 会通过 SPI 从 `langchain4j-easy-rag` 依赖中加载
`ApacheTikaDocumentParser`。
</details>

<details>
<summary>如何自定义文档加载？</summary>

如果你希望连同所有子目录一起加载文档，可以使用 `loadDocumentsRecursively` 方法：
```java
List<Document> documents = FileSystemDocumentLoader.loadDocumentsRecursively("/home/langchain4j/documentation");
```
另外，也可以通过 glob 或 regex 来过滤文档：
```java
PathMatcher pathMatcher = FileSystems.getDefault().getPathMatcher("glob:*.pdf");
List<Document> documents = FileSystemDocumentLoader.loadDocuments("/home/langchain4j/documentation", pathMatcher);
```

:::note
当使用 `loadDocumentsRecursively` 方法时，你可能需要在 glob 中使用双星号
（而不是单个星号），例如：`glob:**.pdf`。
:::
</details>

3. 接下来，需要将文档预处理后存入专门的 embedding store，也就是向量数据库。
这样当用户提问时，我们才能快速找到相关信息片段。
你可以使用我们支持的 30+ 种[embedding store](/integrations/embedding-stores) 中的任意一种，
但为了简单起见，这里使用内存版：
```java
InMemoryEmbeddingStore<TextSegment> embeddingStore = new InMemoryEmbeddingStore<>();
EmbeddingStoreIngestor.ingest(documents, embeddingStore);
```

<details>
<summary>底层发生了什么？</summary>

1. `EmbeddingStoreIngestor` 会通过 SPI，从 `langchain4j-easy-rag` 依赖中加载一个 `DocumentSplitter`。
   每个 `Document` 都会被切分成更小的片段（`TextSegment`），
   每段不超过 300 个 token，并带有 30 个 token 的重叠。

2. `EmbeddingStoreIngestor` 会通过 SPI，从 `langchain4j-easy-rag` 依赖中加载一个 `EmbeddingModel`。
   每个 `TextSegment` 都会通过这个 `EmbeddingModel` 转换成 `Embedding`。

:::note
我们选择 [bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5)
作为 Easy RAG 的默认 embedding model。
它在 [MTEB 排行榜](https://huggingface.co/spaces/mteb/leaderboard) 上取得了相当出色的成绩，
而且它的量化版本只占用 24MB 空间。
因此，我们可以很容易地把它加载到内存中，并通过 [ONNX Runtime](https://onnxruntime.ai/)
在同一个进程里运行。

没错，你可以完全离线地把文本转换为 embeddings，
而且整个过程都在同一个 JVM 进程内完成，无需任何外部服务。
LangChain4j 对一些常见 embedding model 提供了
[开箱即用](/integrations/embedding-models/in-process) 的支持。
:::

3. 所有 `TextSegment` 和 `Embedding` 的配对结果都会被存入 `EmbeddingStore`。
</details>

4. 最后一步是创建一个 [AI Service](/tutorials/ai-services)，作为我们访问 LLM 的 API：
```java
interface Assistant {

    String chat(String userMessage);
}

ChatModel chatModel = OpenAiChatModel.builder()
    .apiKey(System.getenv("OPENAI_API_KEY"))
    .modelName(GPT_4_O_MINI)
    .build();

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
    .contentRetriever(EmbeddingStoreContentRetriever.from(embeddingStore))
    .build();
```
这里我们把 `Assistant` 配置为：使用 OpenAI 的 LLM 回答用户问题，
记住对话中最近的 10 条消息，
并从包含这些文档的 `EmbeddingStore` 中检索相关内容。

5. 现在就可以开始和它聊天了！
```java
String answer = assistant.chat("How to do Easy RAG with LangChain4j?");
```


## 核心 RAG API {#core-rag-apis}
LangChain4j 提供了丰富的 API，方便你构建自定义 RAG 流水线，
从简单到高级都可以覆盖。
这一节会介绍主要的领域类和 API。


### Document（文档） {#document}
`Document` 类表示整个文档，例如单个 PDF 文件或某个网页。
目前 `Document` 只能表示文本信息，
但未来更新将支持图片和表格等内容。

<details>
<summary>常用方法</summary>

- `Document.text()` 返回 `Document` 的文本内容
- `Document.metadata()` 返回 `Document` 的 `Metadata`（见下文“Metadata”一节）
- `Document.toTextSegment()` 将 `Document` 转换为 `TextSegment`（见下文“TextSegment”一节）
- `Document.from(String, Metadata)` 根据文本和 `Metadata` 创建 `Document`
- `Document.from(String)` 根据文本创建带空 `Metadata` 的 `Document`
</details>

### Metadata（元数据） {#metadata}
每个 `Document` 都包含 `Metadata`。
它用于保存该 `Document` 的元信息，例如名称、来源、最后更新时间、所有者，
或者其他任何相关细节。

`Metadata` 以键值映射的形式存储，其中 key 的类型是 `String`，
而 value 可以是以下任意类型：`String`、`Integer`、`Long`、`Float`、`Double`、`UUID`。

`Metadata` 在多个方面都很有用：
- 当你把 `Document` 的内容注入给 LLM 时，
  也可以一并包含 metadata 条目，为 LLM 提供额外上下文。
  例如，提供文档名称和来源就可能帮助 LLM 更好理解内容。
- 当你在搜索要注入 prompt 的相关内容时，
  可以按 `Metadata` 条目进行过滤。
  比如，你可以把语义检索范围限制为只搜索某位所有者的 `Document`。
- 当 `Document` 的来源发生更新时（例如某一页文档内容被修改），
  可以通过 metadata 条目（例如 `id`、`source` 等）轻松定位对应的 `Document`，
  并同步更新 `EmbeddingStore` 中的内容。

<details>
<summary>常用方法</summary>

- `Metadata.from(Map)` 通过 `Map` 创建 `Metadata`
- `Metadata.put(String key, String value)` / `put(String, int)` / 等，向 `Metadata` 中添加条目
- `Metadata.putAll(Map)` 向 `Metadata` 中批量添加条目
- `Metadata.getString(String key)` / `getInteger(String key)` / 等，返回某个 `Metadata` 条目的值，并转换为所需类型
- `Metadata.containsKey(String key)` 检查 `Metadata` 是否包含指定 key 的条目
- `Metadata.remove(String key)` 根据 key 删除某个条目
- `Metadata.copy()` 返回 `Metadata` 的一个副本
- `Metadata.toMap()` 把 `Metadata` 转换成 `Map`
- `Metadata.merge(Metadata)` 将当前 `Metadata` 与另一个 `Metadata` 合并
</details>

### 文档加载器 {#document-loader}
你当然可以直接通过 `String` 创建 `Document`，
但更简单的方式是使用库中提供的文档加载器之一：
- `langchain4j` 模块中的 `FileSystemDocumentLoader`
- `langchain4j` 模块中的 `ClassPathDocumentLoader`
- `langchain4j` 模块中的 `UrlDocumentLoader`
- `langchain4j-document-loader-amazon-s3` 模块中的 `AmazonS3DocumentLoader`
- `langchain4j-document-loader-azure-storage-blob` 模块中的 `AzureBlobStorageDocumentLoader`
- `langchain4j-document-loader-github` 模块中的 `GitHubDocumentLoader`
- `langchain4j-document-loader-google-cloud-storage` 模块中的 `GoogleCloudStorageDocumentLoader`
- `langchain4j-document-loader-selenium` 模块中的 `SeleniumDocumentLoader`
- `langchain4j-document-loader-playwright` 模块中的 `PlaywrightDocumentLoader`
- `langchain4j-document-loader-tencent-cos` 模块中的 `TencentCosDocumentLoader`


### 文档解析器 {#document-parser}
`Document` 可以表示多种格式的文件，例如 PDF、DOC、TXT 等。
为了支持这些格式，LangChain4j 提供了 `DocumentParser` 接口以及若干内置实现：
- `langchain4j` 模块中的 `TextDocumentParser`，可解析纯文本格式文件（例如 TXT、HTML、MD 等）
- `langchain4j-document-parser-apache-pdfbox` 模块中的 `ApachePdfBoxDocumentParser`，可解析 PDF 文件
- `langchain4j-document-parser-apache-poi` 模块中的 `ApachePoiDocumentParser`，可解析 MS Office 文件格式
  （例如 DOC、DOCX、PPT、PPTX、XLS、XLSX 等）
- `langchain4j-document-parser-apache-tika` 模块中的 `ApacheTikaDocumentParser`，
  可自动识别并解析几乎所有常见文件格式
- `langchain4j-document-parser-markdown` 模块中的 `MarkdownDocumentParser`，
  可解析 markdown 文件
- `langchain4j-document-parser-yaml` 模块中的 `YamlDocumentParser`，
  可解析 yaml 文件

下面是从文件系统加载一个或多个 `Document` 的示例：
```java
// 加载单个文档
Document document = FileSystemDocumentLoader.loadDocument("/home/langchain4j/file.txt", new TextDocumentParser());

// 加载目录下的所有文档
List<Document> documents = FileSystemDocumentLoader.loadDocuments("/home/langchain4j", new TextDocumentParser());

// 加载目录下所有 *.txt 文档
PathMatcher pathMatcher = FileSystems.getDefault().getPathMatcher("glob:*.txt");
List<Document> documents = FileSystemDocumentLoader.loadDocuments("/home/langchain4j", pathMatcher, new TextDocumentParser());

// 加载目录及其所有子目录中的文档
List<Document> documents = FileSystemDocumentLoader.loadDocumentsRecursively("/home/langchain4j", new TextDocumentParser());
```

你也可以在不显式指定 `DocumentParser` 的情况下加载文档。
这种情况下会使用默认的 `DocumentParser`。
默认解析器通过 SPI 加载（例如来自 `langchain4j-document-parser-apache-tika` 或 `langchain4j-easy-rag`，前提是你已引入其中之一）。
如果通过 SPI 没有找到任何 `DocumentParser`，则会回退使用 `TextDocumentParser`。


### 文档转换器 {#document-transformer}
`DocumentTransformer` 的实现可以执行多种文档转换，例如：
- 清洗：移除 `Document` 文本中的无用噪音，从而节省 token 并减少干扰
- 过滤：将某些 `Document` 彻底排除在搜索范围之外
- 增强：为 `Document` 添加额外信息，从而潜在提升搜索效果
- 摘要化：可以先对 `Document` 做摘要，并将简短摘要写入 `Metadata`，
  以便后续把它包含进每个 `TextSegment`（下文会介绍），从而潜在提升检索质量
- 等等

在这个阶段，也可以新增、修改或删除 `Metadata` 条目。

当前唯一开箱即用的实现是 `langchain4j-document-transformer-jsoup` 模块中的
`HtmlToTextDocumentTransformer`，
它可以从原始 HTML 中提取需要的文本内容和 metadata 条目。

由于这里不存在“一招通吃”的方案，
我们建议你根据自己的数据特点，自己实现定制的 `DocumentTransformer`。


### 图谱转换器 {#graph-transformer}

`GraphTransformer` 是一个接口，用于把非结构化的 `Document` 转换为结构化的 `GraphDocument`，
它会提取**语义图元素**，例如节点和关系。
它非常适合把原始文本转换成结构化语义图。

一个 `GraphTransformer` 会把原始文档转换为 `GraphDocument`。其中包括：

* 一组 **节点**（`GraphNode`），表示文本中的实体或概念。
* 一组 **关系**（`GraphEdge`），表示这些实体之间是如何关联的。
* 原始 `Document`，作为 `source`。

默认实现是 `LLMGraphTransformer`，
它使用语言模型（例如 OpenAI）配合 prompt engineering，从自然语言中提取图信息。

#### 主要优势

* **实体与关系抽取**：识别关键概念及其语义连接。
* **图结构表示**：输出结果可直接用于知识图谱或图数据库集成。
* **模型驱动解析**：借助大语言模型，从非结构化文本中推断结构。

#### Maven 依赖

```xml
<dependency>
  <groupId>dev.langchain4j</groupId>
  <artifactId>langchain4j-community-llm-graph-transformer</artifactId>
  <version>${latest version here}</version>
</dependency>
```

#### 使用示例

```java
import dev.langchain4j.data.document.Document;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.community.data.document.graph.GraphDocument;
import dev.langchain4j.community.data.document.graph.GraphNode;
import dev.langchain4j.community.data.document.graph.GraphEdge;
import dev.langchain4j.community.data.document.transformer.graph.GraphTransformer;
import dev.langchain4j.community.data.document.transformer.graph.llm.LLMGraphTransformer;

import java.time.Duration;
import java.util.Set;

public class GraphTransformerExample {
    public static void main(String[] args) {
        // 创建由 LLM 驱动的 GraphTransformer
        GraphTransformer transformer = new LLMGraphTransformer(
            OpenAiChatModel.builder()
                .apiKey(System.getenv("OPENAI_API_KEY"))
                .timeout(Duration.ofSeconds(60))
                .build()
        );

        // 输入文档
        Document document = Document.from("Barack Obama was born in Hawaii and served as the 44th President of the United States.");

        // 转换文档
        GraphDocument graphDocument = transformer.transform(document);

        // 访问节点与关系
        Set<GraphNode> nodes = graphDocument.nodes();
        Set<GraphEdge> relationships = graphDocument.relationships();

        nodes.forEach(System.out::println);
        relationships.forEach(System.out::println);
    }
}
```

#### 输出示例

```
GraphNode(name=Barack Obama, type=Person)
GraphNode(name=Hawaii, type=Location)
GraphEdge(from=Barack Obama, predicate=was born in, to=Hawaii)

GraphEdge(from=Barack Obama, predicate=served as, to=President of the United States)
```



### 文本片段（Text Segment） {#text-segment}
当 `Document` 加载完成后，就该把它们切分成更小的 segment（片段）了。
LangChain4j 的领域模型中提供了 `TextSegment` 类，用来表示 `Document` 的一个片段。
顾名思义，`TextSegment` 只能表示文本信息。

<details>
<summary>该不该切分？</summary>

之所以通常不会把整个知识库原封不动塞进 prompt，
而是只放少量相关 segment，原因包括：
- LLM 的上下文窗口是有限的，整个知识库可能根本放不下
- 你给 prompt 的信息越多，LLM 处理和响应所需时间就越长
- 你给 prompt 的信息越多，成本也越高
- prompt 中的无关信息可能会分散 LLM 注意力，增加幻觉概率
- 你给 prompt 的信息越多，越难解释 LLM 到底是基于哪些信息作出回答的

我们可以通过把知识库拆成更小、更易处理的 segment 来缓解这些问题。
那么 segment 多大合适？这是个好问题。和很多工程问题一样，答案是：视情况而定。

目前有两种被广泛采用的思路：
1. 每个文档（例如一个 PDF 文件、一个网页等）都被视为原子且不可再分。
   在 RAG 检索流程中，会取回最相关的 N 个完整文档并注入 prompt。
   在这种做法下，你大概率需要使用长上下文窗口的 LLM，因为文档可能很长。
   这种方式适合“必须完整取回整篇文档”的场景，
   比如你无法容忍遗漏某些细节。
   - 优点：不会丢失上下文。
   - 缺点：
     - 会消耗更多 token。
     - 文档里往往包含多个章节 / 主题，而不一定全部都和查询相关。
     - 向量检索质量会变差，因为大小不一的完整文档被压缩进单个固定长度向量时，信息会被过度平均化。

2. 把文档切成更小的 segment，例如章节、段落，甚至句子。
   在 RAG 检索流程中，会取回最相关的 N 个 segment 并注入 prompt。
   难点在于：如何确保每个 segment 本身就包含足够上下文，让 LLM 看得懂。
   如果上下文不足，LLM 可能会误解该 segment，从而产生幻觉。
   一种常见策略是带重叠地切分文档，但这并不能彻底解决问题。
   这里还可以使用一些高级技术，例如 “sentence window retrieval”、
   “auto-merging retrieval” 和 “parent document retrieval”。
   我们这里不展开细讲，但它们本质上都是在已检索到的 segment 周围补充更多上下文，
   让 LLM 在 segment 之前和之后也能拿到更多信息。
   - 优点：
     - 向量检索质量更好。
     - token 消耗更低。
   - 缺点：仍然可能丢失部分上下文。

</details>

<details>
<summary>常用方法</summary>

- `TextSegment.text()` 返回 `TextSegment` 的文本内容
- `TextSegment.metadata()` 返回 `TextSegment` 的 `Metadata`
- `TextSegment.from(String, Metadata)` 根据文本和 `Metadata` 创建 `TextSegment`
- `TextSegment.from(String)` 根据文本创建带空 `Metadata` 的 `TextSegment`
</details>

### 文档切分器 {#document-splitter}
LangChain4j 提供了 `DocumentSplitter` 接口，以及若干开箱即用的实现：
- `DocumentByParagraphSplitter`
- `DocumentByLineSplitter`
- `DocumentBySentenceSplitter`
- `DocumentByWordSplitter`
- `DocumentByCharacterSplitter`
- `DocumentByRegexSplitter`
- 递归切分：`DocumentSplitters.recursive(...)`

它们的工作方式大致如下：
1. 先实例化一个 `DocumentSplitter`，指定目标 `TextSegment` 的大小，
   并可选指定以字符或 token 计的重叠量。
2. 调用 `DocumentSplitter` 的 `split(Document)` 或 `splitAll(List<Document>)` 方法。
3. `DocumentSplitter` 会先把给定的 `Document` 拆成更小的单元，
   这些单元的粒度取决于具体 splitter。
   例如，`DocumentByParagraphSplitter` 会按段落切分
   （段落由两个或以上连续换行定义），
   而 `DocumentBySentenceSplitter` 则使用 OpenNLP 的句子检测器按句切分，以此类推。
4. 然后，`DocumentSplitter` 会把这些更小的单元（段落、句子、单词等）重新组合成 `TextSegment`，
   尽可能在不超过第 1 步限制的前提下，把更多内容装入同一个 `TextSegment`。
   如果某些单元依旧过大，无法放进一个 `TextSegment`，
   它就会调用一个子 splitter。
   这个子 splitter 也是 `DocumentSplitter`，
   它能把这些“仍然太大”的单元进一步切分为更细粒度的单元。
   所有 `Metadata` 条目都会从原始 `Document` 复制到每个 `TextSegment`。
   另外，每个 text segment 还会增加一个唯一的 metadata 条目 `index`。
   第一个 `TextSegment` 的 `index=0`，第二个 `index=1`，以此类推。


### Text Segment 转换器 {#text-segment-transformer}
`TextSegmentTransformer` 与上文的 `DocumentTransformer` 类似，
只不过它处理的是 `TextSegment`。

和 `DocumentTransformer` 一样，这里也不存在通用万能的方案，
因此我们建议根据你的数据特点，实现自己的 `TextSegmentTransformer`。

有一种对提升检索效果很有效的技巧：
把 `Document` 的标题或简短摘要包含进每个 `TextSegment` 中。


### Embedding（向量表示） {#embedding}
`Embedding` 类封装的是一个数值向量，
它表示被嵌入内容的“语义含义”（通常是文本，例如 `TextSegment`）。

关于向量 embedding，可参考：
- https://www.elastic.co/what-is/vector-embedding
- https://www.pinecone.io/learn/vector-embeddings/
- https://cloud.google.com/blog/topics/developers-practitioners/meet-ais-multitool-vector-embeddings

<details>
<summary>常用方法</summary>

- `Embedding.dimension()` 返回 embedding 向量的维度（长度）
- `CosineSimilarity.between(Embedding, Embedding)` 计算两个 `Embedding` 之间的余弦相似度
- `Embedding.normalize()` 对 embedding 向量做归一化（原地修改）
</details>


### Embedding Model（嵌入模型） {#embedding-model}
`EmbeddingModel` 接口表示一种特殊模型，它负责把文本转换成 `Embedding`。

当前支持的 embedding model 可在[这里](/category/embedding-models)查看。

<details>
<summary>常用方法</summary>

- `EmbeddingModel.embed(String)` 对给定文本做 embedding
- `EmbeddingModel.embed(TextSegment)` 对给定 `TextSegment` 做 embedding
- `EmbeddingModel.embedAll(List<TextSegment>)` 对给定的全部 `TextSegment` 做 embedding
- `EmbeddingModel.dimension()` 返回该模型所生成 `Embedding` 的维度
</details>


### Embedding Store（嵌入存储 / 向量数据库） {#embedding-store}
`EmbeddingStore` 接口表示 `Embedding` 的存储，也就是向量数据库。
它支持存储 `Embedding`，并高效搜索相似（即在 embedding 空间里距离较近）的 `Embedding`。

当前支持的 embedding store 可在[这里](/integrations/embedding-stores)查看。

`EmbeddingStore` 既可以只存 `Embedding`，也可以把它和对应的 `TextSegment` 一起存：
- 它可以只按 ID 存 `Embedding`，原始被嵌入的数据可以另外保存在别处，并通过 ID 关联
- 它也可以同时存储 `Embedding` 和对应的原始数据（通常就是 `TextSegment`）

<details>
<summary>常用方法</summary>

- `EmbeddingStore.add(Embedding)` 向存储中添加一个 `Embedding`，并返回随机 ID
- `EmbeddingStore.add(String id, Embedding)` 按指定 ID 添加一个 `Embedding`
- `EmbeddingStore.add(Embedding, TextSegment)` 添加一个 `Embedding` 及其关联的 `TextSegment`，并返回随机 ID
- `EmbeddingStore.addAll(List<Embedding>)` 批量添加 `Embedding`，并返回随机 ID 列表
- `EmbeddingStore.addAll(List<Embedding>, List<TextSegment>)` 批量添加 `Embedding` 及其关联的 `TextSegment`，并返回随机 ID 列表
- `EmbeddingStore.addAll(List<String> ids, List<Embedding>, List<TextSegment>)` 按指定 ID 批量添加 `Embedding` 及其关联的 `TextSegment`
- `EmbeddingStore.search(EmbeddingSearchRequest)` 搜索最相似的 `Embedding`
- `EmbeddingStore.remove(String id)` 根据 ID 删除单个 `Embedding`
- `EmbeddingStore.removeAll(Collection<String> ids)` 删除给定 ID 集合对应的全部 `Embedding`
- `EmbeddingStore.removeAll(Filter)` 删除匹配指定 `Filter` 的全部 `Embedding`
- `EmbeddingStore.removeAll()` 删除全部 `Embedding`
</details>


#### EmbeddingSearchRequest（嵌入搜索请求） {#embeddingsearchrequest}
`EmbeddingSearchRequest` 表示一次在 `EmbeddingStore` 中的搜索请求。
它包含以下属性：
- `Embedding queryEmbedding`：作为参照的查询 embedding
- `int maxResults`：最大返回结果数。可选参数，默认值为 3。
- `double minScore`：最小分数，范围为 0 到 1（含端点）。只有得分大于等于 `minScore` 的 embedding 才会返回。可选参数，默认值为 0。
- `Filter filter`：搜索时应用于 `Metadata` 的过滤条件。只有 `Metadata` 符合该 `Filter` 的 `TextSegment` 才会被返回。

#### Filter {#filter}
`Filter` 允许你在向量检索时按 `Metadata` 条目进行过滤。

目前支持以下 `Filter` 类型 / 运算：
- `IsEqualTo`
- `IsNotEqualTo`
- `IsGreaterThan`
- `IsGreaterThanOrEqualTo`
- `IsLessThan`
- `IsLessThanOrEqualTo`
- `IsIn`
- `IsNotIn`
- `ContainsString`
- `And`
- `Not`
- `Or`

:::note
并不是所有 embedding store 都支持按 `Metadata` 过滤，
请查看[这里](https://docs.langchain4j.dev/integrations/embedding-stores/)中的 “Filtering by Metadata” 一列。

即便某些 store 支持按 `Metadata` 过滤，也不一定支持所有 `Filter` 类型 / 运算。
例如，`ContainsString` 目前仅由 Milvus、PgVector 和 Qdrant 支持。
:::

关于 `Filter` 的更多信息，可参见[这里](https://github.com/langchain4j/langchain4j/pull/610)。


#### EmbeddingSearchResult（嵌入搜索结果） {#embeddingsearchresult}
`EmbeddingSearchResult` 表示一次在 `EmbeddingStore` 中的搜索结果。
它内部包含 `EmbeddingMatch` 列表。


#### Embedding Match
`EmbeddingMatch` 表示一个匹配到的 `Embedding`，以及它的相关性分数、ID 和原始被嵌入的数据（通常是 `TextSegment`）。


### 嵌入存储导入器（Embedding Store Ingestor） {#embedding-store-ingestor}
`EmbeddingStoreIngestor` 表示一条摄取（ingestion）流水线，
负责把 `Document` 导入 `EmbeddingStore`。

在最简单的配置下，`EmbeddingStoreIngestor` 会使用指定的 `EmbeddingModel`
对给定 `Document` 做 embedding，
并将它们连同对应 `Embedding` 一起存入指定的 `EmbeddingStore`：

```java
EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()
        .embeddingModel(embeddingModel)
        .embeddingStore(embeddingStore)
        .build();

ingestor.ingest(document1);
ingestor.ingest(document2, document3);
IngestionResult ingestionResult = ingestor.ingest(List.of(document4, document5, document6));
```

`EmbeddingStoreIngestor` 中所有 `ingest()` 方法都会返回一个 `IngestionResult`。
`IngestionResult` 包含一些有用信息，例如 `TokenUsage`，
它能显示 embedding 过程消耗了多少 token。

可选地，`EmbeddingStoreIngestor` 还可以先用指定的 `DocumentTransformer`
转换 `Document`。
如果你希望在做 embedding 前先清洗、增强或格式化 `Document`，
这会很有帮助。

可选地，`EmbeddingStoreIngestor` 也可以用指定的 `DocumentSplitter`
把 `Document` 切成 `TextSegment`。
如果 `Document` 很大，而你又希望将其切成更小的 `TextSegment`，
以提升相似度搜索质量并降低发给 LLM 的 prompt 大小和成本，
这会很有帮助。

可选地，`EmbeddingStoreIngestor` 还可以用指定的 `TextSegmentTransformer`
转换 `TextSegment`。
如果你希望在做 embedding 之前先清洗、增强或格式化 `TextSegment`，
这同样很有帮助。

示例：
```java
EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()

    // 给每个 Document 增加 userId metadata，便于后续按用户过滤
    .documentTransformer(document -> {
        document.metadata().put("userId", "12345");
        return document;
    })

    // 把每个 Document 切成每段 1000 token、重叠 200 token 的 TextSegment
    .documentSplitter(DocumentSplitters.recursive(1000, 200, new OpenAiTokenCountEstimator("gpt-4o-mini")))

    // 把 Document 名称加入每个 TextSegment，以提升检索质量
    .textSegmentTransformer(textSegment -> TextSegment.from(
            textSegment.metadata().getString("file_name") + "\n" + textSegment.text(),
            textSegment.metadata()
    ))

    .embeddingModel(embeddingModel)
    .embeddingStore(embeddingStore)
    .build();
```


## 朴素 RAG {#naive-rag}

当文档已经完成摄取后（见上文各节），
我们就可以创建一个 `EmbeddingStoreContentRetriever`，
为系统提供 naive RAG 能力。

在使用 [AI Services](/tutorials/ai-services) 时，
可以这样配置 naive RAG：
```java
ContentRetriever contentRetriever = EmbeddingStoreContentRetriever.builder()
    .embeddingStore(embeddingStore)
    .embeddingModel(embeddingModel)
    .maxResults(5)
    .minScore(0.75)
    .build();

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .contentRetriever(contentRetriever)
    .build();
```

[Naive RAG 示例](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_2_naive/Naive_RAG_Example.java)


## 高级 RAG {#advanced-rag}

在 LangChain4j 中，可以通过以下核心组件实现 advanced RAG：
- `QueryTransformer`
- `QueryRouter`
- `ContentRetriever`
- `ContentAggregator`
- `ContentInjector`

下面这张图展示了这些组件如何协同工作：
![](/img/advanced-rag.png)

整体流程如下：
1. 用户产生一个 `UserMessage`，它会被转换成 `Query`
2. `QueryTransformer` 将 `Query` 转换为一个或多个 `Query`
3. 每个 `Query` 会由 `QueryRouter` 路由到一个或多个 `ContentRetriever`
4. 每个 `ContentRetriever` 都会为每个 `Query` 检索相关 `Content`
5. `ContentAggregator` 会把所有检索到的 `Content` 合并成一个最终有序列表
6. 这个 `Content` 列表会被注入原始 `UserMessage`
7. 最后，带有原始查询与注入内容的 `UserMessage` 会被发送给 LLM

更多细节请参阅各组件的 Javadoc。

### 检索增强器（Retrieval Augmentor） {#retrieval-augmentor}

`RetrievalAugmentor` 是进入 RAG 流水线的入口点。
它负责从各种来源检索相关 `Content`，并用这些内容增强一个 `ChatMessage`。

在创建 [AI Service](/tutorials/ai-services) 时，可以指定一个 `RetrievalAugmentor` 实例：
```java
Assistant assistant = AiServices.builder(Assistant.class)
    ...
    .retrievalAugmentor(retrievalAugmentor)
    .build();
```
每次调用 AI Service 时，配置好的 `RetrievalAugmentor`
都会被调用，以增强当前的 `UserMessage`。

你可以使用默认实现（下文介绍），也可以自己实现一个自定义版本。

### 默认 Retrieval Augmentor {#default-retrieval-augmentor}

LangChain4j 提供了 `RetrievalAugmentor` 接口的开箱即用实现：
`DefaultRetrievalAugmentor`。
它应当适用于大多数 RAG 使用场景。
它的设计灵感来自[这篇文章](https://blog.langchain.dev/deconstructing-rag)
和[这篇论文](https://arxiv.org/abs/2312.10997)。
如果你想更深入理解其设计理念，建议先阅读这两个资源。

### Query（查询） {#query}
`Query` 表示 RAG 流水线中的用户查询。
它包含查询文本以及查询元数据。

#### Query Metadata
`Query` 中的 `Metadata` 保存了对 RAG 流水线中各组件可能有用的信息，例如：
- `Metadata.userMessage()`：需要被增强的原始 `UserMessage`
- `Metadata.chatMemoryId()`：带 `@MemoryId` 注解的方法参数的值。更多说明见[这里](/tutorials/ai-services/#chat-memory)。
  这可以用于识别用户，并在检索时应用访问控制或过滤。
- `Metadata.chatMemory()`：此前的全部 `ChatMessage`。
  这能帮助系统理解当前 `Query` 是在什么上下文里提出的。
- `Metadata.invocationParameters()`：包含调用 AI Service 时传入的 `InvocationParameters`：

```java
interface Assistant {
    String chat(@UserMessage String userMessage, InvocationParameters parameters);
}

InvocationParameters parameters = InvocationParameters.from(Map.of("userId", "12345"));
String response = assistant.chat("Hello", parameters);
```

`InvocationParameters` 也可以在其他 AI Service 组件中访问到，例如：
- [`@Tool` 注解的方法](/tutorials/tools#invocationparameters)
- [`ToolProvider`](/tutorials/tools#specifying-tools-dynamically)：通过 `ToolProviderRequest`
- [`ToolArgumentsErrorHandler`](/tutorials/tools#handling-tool-arguments-errors)
  和 [`ToolExecutionErrorHandler`](https://docs.langchain4j.dev/tutorials/tools#handling-tool-execution-errors)：
  通过 `ToolErrorContext`

这些参数存储在一个可变的、线程安全的 `Map` 中。

在一次 AI Service 调用期间，
你也可以通过 `InvocationParameters` 在不同 AI Service 组件之间传递数据
（例如从一个 RAG 组件传给另一个 RAG 组件，或从某个 RAG 组件传给一个 tool）。

### 查询转换器（Query Transformer） {#query-transformer}
`QueryTransformer` 会把给定的 `Query` 转换为一个或多个 `Query`。
它的目标是通过修改或扩展原始 `Query` 来提升检索质量。

一些常见的检索增强方式包括：
- Query compression
- Query expansion
- Query re-writing
- Step-back prompting
- Hypothetical document embeddings（HyDE）

更多细节可参见[这里](https://blog.langchain.dev/query-transformations/)。

LangChain4j 还有一个可选的社区模块 [Prompt Repetition](/integrations/prompt-repetition/)，
它提供了 `RepeatingQueryTransformer`。
该组件会在内容检索前对检索查询做重复增强，
它应该用于改写查询本身，而不是用于改写最终发给模型的增强后 prompt。

#### 默认 Query Transformer
`DefaultQueryTransformer` 是 `DefaultRetrievalAugmentor` 默认使用的实现。
它不会对 `Query` 做任何修改，而是直接透传。

#### Query 压缩转换器
`CompressingQueryTransformer` 会使用 LLM，把当前 `Query` 和之前的对话压缩成一个独立自洽的 `Query`。
这在用户提出依赖前文的追问时很有用。

例如：
```
User: Tell me about John Doe
AI: John Doe was a ...
User: Where did he live?
```
单独看 `Where did he live?` 这个查询，
是无法检索到所需信息的，
因为其中并没有显式提到 John Doe，系统无法知道 `he` 指的是谁。

而使用 `CompressingQueryTransformer` 后，
LLM 会读取整段对话，
并把 `Where did he live?` 转换成 `Where did John Doe live?`。

#### Query 扩展转换器
`ExpandingQueryTransformer` 会使用 LLM，把给定的 `Query` 扩展成多个 `Query`。
这很有用，因为 LLM 可以从不同角度对原始 `Query` 进行改写和重述，
从而帮助系统检索到更多相关内容。

### Content（内容） {#content}
`Content` 表示与用户 `Query` 相关的内容。
目前它仅限于文本内容（即 `TextSegment`），
但未来可能会支持其他模态（例如图片、音频、视频等）。

### Content Retriever（内容检索器） {#content-retriever}
`ContentRetriever` 使用给定的 `Query`，从底层数据源中检索 `Content`。
底层数据源几乎可以是任何东西：
- Embedding store
- 全文检索引擎
- 向量检索与全文检索的混合方案
- Web 搜索引擎
- 知识图谱
- SQL 数据库
- 等等

`ContentRetriever` 返回的 `Content` 列表按相关性从高到低排序。

#### Embedding Store Content Retriever
`EmbeddingStoreContentRetriever` 使用 `EmbeddingModel` 对 `Query` 做 embedding，
并从 `EmbeddingStore` 中检索相关 `Content`。

示例：
```java
EmbeddingStore embeddingStore = ...
EmbeddingModel embeddingModel = ...

ContentRetriever contentRetriever = EmbeddingStoreContentRetriever.builder()
    .embeddingStore(embeddingStore)
    .embeddingModel(embeddingModel)
    .maxResults(3)
     // maxResults 也可以根据 query 动态指定
    .dynamicMaxResults(query -> 3)
    .minScore(0.75)
     // minScore 也可以根据 query 动态指定
    .dynamicMinScore(query -> 0.75)
    .filter(metadataKey("userId").isEqualTo("12345"))
    // filter 也可以根据 query 动态指定
    .dynamicFilter(query -> {
        String userId = query.metadata().invocationParameters().get("userId");
        return metadataKey("userId").isEqualTo(userId);
    })
    .build();

interface Assistant {
    String chat(@UserMessage String userMessage, InvocationParameters parameters);
}

InvocationParameters parameters = InvocationParameters.from(Map.of("userId", "12345"));
String response = assistant.chat("Hello", parameters);
```

#### Web Search Content Retriever {#web-search-content-retriever}
`WebSearchContentRetriever` 使用 `WebSearchEngine` 从互联网检索相关 `Content`。

所有支持的 `WebSearchEngine` 集成都可以在[这里](/category/web-search-engines)查看。

示例：
```java
WebSearchEngine googleSearchEngine = GoogleCustomWebSearchEngine.builder()
        .apiKey(System.getenv("GOOGLE_API_KEY"))
        .csi(System.getenv("GOOGLE_SEARCH_ENGINE_ID"))
        .build();

ContentRetriever contentRetriever = WebSearchContentRetriever.builder()
        .webSearchEngine(googleSearchEngine)
        .maxResults(3)
        .build();
```
完整示例见[这里](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_08_Advanced_RAG_Web_Search_Example.java)。

#### SQL Database Content Retriever
`SqlDatabaseContentRetriever` 是 `ContentRetriever` 的实验性实现，
位于 `langchain4j-experimental-sql` 模块中。

它使用 `DataSource` 和 LLM，为给定的自然语言 `Query` 生成并执行 SQL 查询。

更多信息请参阅 `SqlDatabaseContentRetriever` 的 Javadoc。

示例见[这里](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_10_Advanced_RAG_SQL_Database_Retreiver_Example.java)。

#### Azure AI Search Content Retriever
`AzureAiSearchContentRetriever` 是与
[Azure AI Search](https://azure.microsoft.com/en-us/products/ai-services/ai-search) 的集成。
它支持全文检索、向量检索、混合检索以及重排序。
它位于 `langchain4j-azure-ai-search` 模块中。
更多信息请参阅 `AzureAiSearchContentRetriever` 的 Javadoc。

#### Neo4j Content Retriever
`Neo4jContentRetriever` 是与 [Neo4j](https://neo4j.com/) 图数据库的集成。
它会把自然语言查询转换为 Neo4j Cypher 查询，
并通过执行这些查询来检索相关信息。
它位于 `langchain4j-community-neo4j-retriever` 模块中。

#### Elasticsearch Content Retriever
`ElasticsearchContentRetriever` 是与
[Elasticsearch](https://www.elastic.co/elasticsearch) 的集成。
它支持全文检索、向量检索和混合检索。
它位于 `langchain4j-elasticsearch` 模块中。
更多信息请参阅 `ElasticsearchContentRetriever` 的 Javadoc。

### 查询路由器（Query Router） {#query-router}
`QueryRouter` 负责把 `Query` 路由到合适的 `ContentRetriever`。

#### 默认 Query Router
`DefaultQueryRouter` 是 `DefaultRetrievalAugmentor` 使用的默认实现。
它会把每个 `Query` 路由到所有已配置的 `ContentRetriever`。

#### 语言模型 Query Router
`LanguageModelQueryRouter` 使用 LLM 来决定给定 `Query` 应该被路由到哪里。

### Content Aggregator（内容聚合器） {#content-aggregator}
`ContentAggregator` 负责聚合多个有序 `Content` 列表，这些列表可能来自：
- 多个 `Query`
- 多个 `ContentRetriever`
- 或两者同时存在

#### 默认 Content Aggregator
`DefaultContentAggregator` 是 `ContentAggregator` 的默认实现，
它采用两阶段的 Reciprocal Rank Fusion（RRF）。
更多细节请参阅 [`DefaultContentAggregator` Javadoc](https://javadoc.io/doc/dev.langchain4j/langchain4j-core/latest/dev/langchain4j/rag/content/aggregator/DefaultContentAggregator.html)。

#### Re-Ranking Content Aggregator
`ReRankingContentAggregator` 使用 `ScoringModel`（例如 Cohere）进行重排序。
当前支持的 scoring（re-ranking）model 完整列表可在
[这里](https://docs.langchain4j.dev/category/scoring-reranking-models) 查看。
更多细节请参阅 [`ReRankingContentAggregator` Javadoc](https://javadoc.io/doc/dev.langchain4j/langchain4j-core/latest/dev/langchain4j/rag/content/aggregator/ReRankingContentAggregator.html)。

### Content Injector（内容注入器） {#content-injector}

`ContentInjector` 负责把 `ContentAggregator` 返回的 `Content`
注入到 `UserMessage` 中。

#### 默认 Content Injector

`DefaultContentInjector` 是 `ContentInjector` 的默认实现，
它会把 `Content` 直接追加到 `UserMessage` 末尾，
并使用前缀 `Answer using the following information:`。

你可以通过 3 种方式自定义 `Content` 注入 `UserMessage` 的方式：
- 覆盖默认的 `PromptTemplate`：
```java
RetrievalAugmentor retrievalAugmentor = DefaultRetrievalAugmentor.builder()
    .contentInjector(DefaultContentInjector.builder()
        .promptTemplate(PromptTemplate.from("{{userMessage}}\n{{contents}}"))
        .build())
    .build();
```
  请注意，`PromptTemplate` 必须包含 `{{userMessage}}` 和 `{{contents}}` 变量。
- 继承 `DefaultContentInjector`，并重写某个 `format` 方法
- 实现自定义 `ContentInjector`

`DefaultContentInjector` 也支持把检索到的 `Content.textSegment()` 中的 `Metadata` 条目一起注入：
```java
DefaultContentInjector.builder()
    .metadataKeysToInclude(List.of("source"))
    .build()
```
这种情况下，`TextSegment.text()` 前面会加上前缀 `content: `，
而每个 `Metadata` 的值前面也会附带它对应的 key。
最终的 `UserMessage` 看起来会像这样：
```
How can I cancel my reservation?

Answer using the following information:
content: To cancel a reservation, go to ...
source: ./cancellation_procedure.html

content: Cancellation is allowed for ...
source: ./cancellation_policy.html
```

### 并行化 {#parallelization}

当只有单个 `Query` 和单个 `ContentRetriever` 时，
`DefaultRetrievalAugmentor` 会在同一个线程中完成 query routing 和 content retrieval。
否则，就会使用 `Executor` 对处理过程进行并行化。
默认情况下，会使用一个经过修改的 `Executors.newCachedThreadPool()`
（`keepAliveTime` 为 1 秒，而不是 60 秒），
但你也可以在创建 `DefaultRetrievalAugmentor` 时提供自定义 `Executor`：
```java
DefaultRetrievalAugmentor.builder()
        ...
        .executor(executor)
        .build;
```


## 访问来源 {#accessing-sources}

如果你在使用 [AI Services](/tutorials/ai-services) 时，
希望访问 sources（即用来增强消息的检索 `Content`），
只需要把返回类型包在 `Result` 类里即可：
```java
interface Assistant {

    Result<String> chat(String userMessage);
}

Result<String> result = assistant.chat("How to do Easy RAG with LangChain4j?");

String answer = result.content();
List<Content> sources = result.sources();
```

在流式模式下，则可以通过 `onRetrieved()` 方法指定一个 `Consumer<List<Content>>`：
```java
interface Assistant {

    TokenStream chat(String userMessage);
}

assistant.chat("How to do Easy RAG with LangChain4j?")
    .onRetrieved((List<Content> sources) -> ...)
    .onPartialResponse(...)
    .onCompleteResponse(...)
    .onError(...)
    .start();
```

## 控制聊天记忆中存储的内容 {#controlling-what-is-stored-in-chat-memory}

当你在 [AI Services](/tutorials/ai-services) 中使用 `RetrievalAugmentor` 时，
可以控制：存入 chat memory 的到底是**增强后的** user message
（也就是已经注入了检索 `Content` 的消息），
还是**原始的** user message。

这个行为通过 `AiServices` builder 上的 `storeRetrievedContentInChatMemory`
选项配置。

### 配置 {#configuration}

- `true`（默认值）
  会把**增强后的** `UserMessage`（原始问题 + 检索内容）存入 chat memory。
  同时，发给 LLM 的也是这条增强后的消息。

- `false`
  只会把**原始** `UserMessage`（不含检索内容）存入 chat memory。
  但在推理时，增强后的消息依然会发送给 LLM。

当你希望 chat history 更精简，并且更贴近用户的真实输入时，
只保存原始 user message 会很有帮助；
与此同时，LLM 在生成答案时仍然可以获得检索到的上下文。

### 示例 {#example}

```java
interface Assistant {

    String chat(String userMessage);
}

ChatModel chatModel = OpenAiChatModel.builder()
    .apiKey(System.getenv("OPENAI_API_KEY"))
    .modelName(GPT_4_O_MINI)
    .build();

MessageWindowChatMemory chatMemory =
    MessageWindowChatMemory.withMaxMessages(10);

RetrievalAugmentor retrievalAugmentor =
    DefaultRetrievalAugmentor.builder()
        .contentRetriever(
            EmbeddingStoreContentRetriever.from(embeddingStore, embeddingModel))
        .build();

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .chatMemory(chatMemory)
    .retrievalAugmentor(retrievalAugmentor)
    // 只在 chat memory 中保存原始 user message
    .storeRetrievedContentInChatMemory(false)
    .build();
```


## 示例 {#examples}

- [Easy RAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_1_easy/Easy_RAG_Example.java)
- [Naive RAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_2_naive/Naive_RAG_Example.java)
- [Advanced RAG with Query Compression](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_01_Advanced_RAG_with_Query_Compression_Example.java)
- [Advanced RAG with Query Routing](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_02_Advanced_RAG_with_Query_Routing_Example.java)
- [Advanced RAG with Re-Ranking](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_03_Advanced_RAG_with_ReRanking_Example.java)
- [Advanced RAG with Including Metadata](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_04_Advanced_RAG_with_Metadata_Example.java)
- [Advanced RAG with Metadata Filtering](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_05_Advanced_RAG_with_Metadata_Filtering_Examples.java)
- [Advanced RAG with multiple Retrievers](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_07_Advanced_RAG_Multiple_Retrievers_Example.java)
- [Advanced RAG with Web Search](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_08_Advanced_RAG_Web_Search_Example.java)
- [Advanced RAG with SQL Database](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_10_Advanced_RAG_SQL_Database_Retreiver_Example.java)
- [Skipping Retrieval](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_06_Advanced_RAG_Skip_Retrieval_Example.java)
- [RAG + Tools](https://github.com/langchain4j/langchain4j-examples/blob/main/customer-support-agent-example/src/test/java/dev/langchain4j/example/CustomerSupportAgentIT.java)
- [Loading Documents](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/DocumentLoaderExamples.java)
