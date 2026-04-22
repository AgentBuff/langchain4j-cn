# 模型上下文协议（MCP）

LangChain4j 支持 Model Context Protocol（MCP），
可用于与符合 MCP 协议的 server 通信，这些 server 可以提供并执行 tools。
关于该协议的通用说明可参考 [MCP 官网](https://modelcontextprotocol.io/)。

:::note
想要在 Java 中构建一个 MCP **stdio server**？
服务端实现位于 LangChain4j Community。请参阅 [Building a Java MCP stdio server](./mcp-stdio-server)。
:::

该协议定义了两种 transport，这两种都已被支持：

- [Streamable HTTP](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http)：
  client 发送 HTTP 请求，server 则返回常规响应，
  或者在需要持续发送多个响应时打开一个 SSE stream。
- [stdio](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#stdio)：
  client 可以将 MCP server 作为本地子进程运行，
  并通过标准输入 / 输出直接与其通信。

在规范之外，LangChain4j 还实现了 `WebSocket` transport。
这一 transport 目前尚未标准化，当前 client 侧的实现方式，
是以兼容 [Quarkus MCP Server extension](https://docs.quarkiverse.io/quarkus-mcp-server/dev)
所实现的 WebSocket transport 为目标。
对于其他框架构建、但暴露 WebSocket 的 MCP servers，
并不能保证完全兼容。

另外，LangChain4J 还支持一种 Docker stdio transport，
它可以使用以容器镜像形式分发的 stdio MCP server。

LangChain4j 也支持旧版的
[HTTP/SSE transport](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports#http-with-sse)，
但它已经被弃用，未来会被移除。

如果你希望让 chat model 或 AI service 能够运行由 MCP server 提供的 tools，
你需要先创建一个 MCP tool provider 实例。

## 创建 MCP 工具提供者 {#creating-an-mcp-tool-provider}

### MCP 传输层 {#mcp-transport}

首先，你需要一个 MCP Transport 实例。

对于 stdio，下面这个示例展示了如何通过 NPM 包启动一个 server 子进程：

```java
McpTransport transport = StdioMcpTransport.builder()
    .command(List.of("/usr/bin/npm", "exec", "@modelcontextprotocol/server-everything@0.6.2"))
    .logEvents(true) // only if you want to see the traffic in the log
    .build();
```

对于 Streamable HTTP transport，
你需要提供 server `POST` endpoint 的 URL：

```java
McpTransport transport = StreamableHttpMcpTransport.builder()
        .url("http://localhost:3001/mcp")
        .logRequests(true) // if you want to see the traffic in the log
        .logResponses(true)
        .build();
```

**_NOTE:_** Streamable HTTP transport 还可以选择性打开一个附属的
[基于 GET 的 SSE stream](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#listening-for-messages-from-the-server)，
用于接收由 server 主动发起的 notifications 和 requests。
你可以在 builder 上通过 `.subsidiaryChannel(true)` 启用它。
该能力默认关闭。
如果 server 不支持它，transport 会记录一条 warning，
然后继续在无该通道的模式下运行。
如果这个 stream 在建立后中断，transport 会自动重连
（会遵循 server 提供的 `retry` 值，默认是 5 秒）。

对于 WebSocket transport：
```java
McpTransport transport = WebSocketMcpTransport.builder()
        .url("ws://localhost:3001/mcp/ws")
        .logResponses(true)
        .logRequests(true)
        .build();
```

对于旧版 HTTP transport，需要两个 URL：
一个用于启动 SSE channel，另一个用于通过 `POST` 提交命令。
后者由 server 动态提供，前者则需要通过 `sseUrl` 方法显式指定：

```java
McpTransport transport = HttpMcpTransport.builder()
    .sseUrl("http://localhost:3001/sse")
    .logRequests(true) // if you want to see the traffic in the log
    .logResponses(true)
    .build();
```

对于 Docker stdio transport，
你首先需要在 `pom.xml` 中加入一个模块：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-mcp-docker</artifactId>
</dependency>
```

然后创建 Docker transport：

```java
McpTransport transport = DockerMcpTransport.builder()
    .image("mcp/time")
    .dockerHost("unix:///var/run/docker.sock")
    .logEvents(true) // if you want to see the traffic in the log
    .build();
```

### MCP 客户端 {#mcp-client}

要基于 transport 创建一个 MCP client：

```java
McpClient mcpClient = DefaultMcpClient.builder()
    .key("MyMCPClient")
    .transport(transport)
    .build();
```

需要注意的是，client key 不是强制的，
但仍然建议设置，尤其是在存在多个 MCP clients 的情况下，
它有助于区分不同 client。

### MCP 工具提供者 {#mcp-tool-provider}

最后，你可以基于 client 创建 MCP tool provider：

```java
McpToolProvider toolProvider = McpToolProvider.builder()
    .mcpClients(mcpClient)
    .build();
```

需要注意的是，一个 MCP tool provider 可以同时使用多个 client。
如果你这么做，还可以指定当从某个特定 server 获取 tools 失败时，
tool provider 应该如何表现。
这通过 `builder.failIfOneServerFails(boolean)` 方法设置。
默认值为 `false`，
也就是当某个 server 出错时，tool provider 会忽略该错误，
并继续使用其他 server。
如果设置为 `true`，任意一个 server 失败都会导致 tool provider 抛出异常。

此外，MCP server 往往会提供几十个 tools，
而某个具体 AI service 可能只需要其中极少数几个。
这样做既可以避免使用不期望的工具，
也能降低 hallucination 的可能性。
`McpToolProvider` 允许你按名称过滤这些工具，如下所示：

```java
McpToolProvider toolProvider = McpToolProvider.builder()
    .mcpClients(mcpClient)
    .filterToolNames("get_issue", "get_issue_comments", "list_issues")
    .build();
```

这样一来，使用该 `ToolProvider` 配置的 AI service 就只能使用这 3 个工具，
从而允许它读取已有 issue，
但阻止它创建新的 issue。
更一般地说，`ToolProvider` 还允许通过 `BiPredicate<McpClient, ToolSpecification>` 来过滤工具。
当多个 MCP clients 暴露了同名、从而相互冲突的 tools 时，
这会非常有用。
例如，下面这个 `ToolProvider` 从两个 MCP clients 中取工具，
但由于它们都提供了一个名为 `echoInteger` 的工具，
因此它只保留 key 为 `numeric-mcp` 的那个 client 所暴露的版本：

```java
McpToolProvider toolProvider = McpToolProvider.builder()
    .mcpClients(mcpClient1, mcpClient2)
    .filter((mcpClient, tool) ->
            !tool.name().startsWith("echoInteger") || 
            mcpClient.key().equals("numeric-mcp"))
    .build();
```

请注意，在同一个 `McpToolProvider` builder 上多次调用 `filter` 方法时，
这些过滤条件会以 conjunction（AND）的形式组合在一起。

为了支持应用在运行时动态连接或断开 MCP servers，
你也可以对已有的 `McpToolProvider` 实例动态增删 clients 和 filters。

如果要把 tool provider 绑定到 AI service，
只需使用 AI service builder 上的 `toolProvider` 方法：

```java
Bot bot = AiServices.builder(Bot.class)
    .chatModel(model)
    .toolProvider(toolProvider)
    .build();
```

另外，你也可以通过 `Map<ToolSpecification, ToolExecutor>` 提供 tools。

```java
Map<ToolSpecification, ToolExecutor> tools = mcpClient.listTools().stream().collect(Collectors.toMap(
        tool -> tool, 
        tool -> new McpToolExecutor(mcpClient)
));
```

要将 tools 绑定到 AI service，
只需使用 AI service builder 上的 `tools` 方法：

```java
Bot bot = AiServices.builder(Bot.class)
    .chatModel(model)
    .tools(tools)
    .build();
```

更多关于 LangChain4j tool 支持的信息可在[这里](/tutorials/tools)查看。

### MCP 工具名称映射 {#mcp-tool-name-mapping}

如果你使用多个 MCP servers，
而它们暴露了名称冲突的 tools
（或者你只是想调整某个不太合适的命名），
那么应用 tool name mapping function 会很有帮助。
这可以通过在创建 `McpToolProvider` 时指定一个 `BiFunction<McpClient, ToolSpecification, String>` 来实现。

例如：
```java
McpToolProvider toolProvider = McpToolProvider.builder()
        .mcpClients(mcpClient1, mcpClient2)
        .toolNameMapper((client, toolSpec) -> {
            // Prefix all tool names with the name of the MCP client and an underscore
            return client.key() + "_" + toolSpec.name();
        })
        .build();
```

这样之后，tool provider 返回的 `ToolSpecification` 对象中将会包含映射后的（逻辑）名称，
而生成出的 `ToolExecutor` 则仍会在真正调用服务端工具时，
使用原始（物理）名称。

### MCP 工具规范映射 {#mcp-tool-specification-mapping}

与上面的 MCP tool name mapping 类似，
你也可以映射完整的 `ToolSpecification`：
```java
McpToolProvider toolProvider = McpToolProvider.builder()
        .mcpClients(mcpClient)
        .toolSpecificationMapper((client, toolSpec) -> {
            // Prefix all tool names with "myprefix_" and convert the description to uppercase
            return toolSpec.toBuilder()
                .name("myprefix_" + toolSpec.name())
                .description(toolSpec.description().toUpperCase())
                .build();
        })
        .build();
```

### MCP 工具元数据 {#mcp-tool-metadata}

MCP 协议允许 server 通过 annotations，
或者通过 tool definition 中的 `_meta` 字段，
为每个工具提供额外 metadata。
LangChain4j 会通过 `ToolSpecification.metadata()` 中保存的 map 暴露这些 metadata。
Annotations 会以 `dev.langchain4j.mcp.client.McpToolMetadataKeys` 类中的常量作为 key 存储到 map 中。
而 `_meta` 字段中的内容则保留其原始 key，
其中的 JSON value 会被序列化为嵌套 map。

直接存在于 MCP tool definition 中的 `title` 字段，
会以 `McpToolMetadataKeys.TITLE` 作为 key 暴露到 metadata map 中，
从而与 annotation 中获取的 title 区分开。
后者会以 `McpToolMetadataKeys.ANNOTATION_TITLE` 作为 key 暴露。

## 提供 `_meta` 字段

MCP 协议允许 client 在发送给 server 的每个 request 和 notification 的 `params` 中附加一个 `_meta` 对象。
这可以用于传递 OpenTelemetry trace context、自定义应用 metadata，
或者 server 所需的其他带外信息。

如果你想提供 `_meta` 字段，
可以在 client builder 上注册一个 `McpMetaSupplier`。
这个 supplier 会在每次 request 或 notification 发送前被调用，
返回的 map 会被放入 `params._meta`。
与 HTTP headers 不同，这种方式适用于所有 transport
（stdio、HTTP、WebSocket）。

```java
McpClient mcpClient = DefaultMcpClient.builder()
    .transport(transport)
    .metaSupplier(context -> Map.of(
        "traceparent", "00-0af7651916cd43dd8448eb211c80319c-00f067aa0ba902b7-01",
        "custom-key", "custom-value"))
    .build();
```

这个 supplier 会收到一个 `McpCallContext`（可为 null），
其中包含即将发送的消息，以及在适用时，触发这次调用的 AI service 的 `InvocationContext`。
这使得 supplier 可以根据当前正在执行的操作动态调整 metadata。

## 日志

MCP 协议还定义了 server 向 client 发送日志消息的方式。
默认情况下，client 会把这些日志消息转换后交给 SLF4J logger 记录。
如果你想改变这种行为，
可以使用接口 `dev.langchain4j.mcp.client.logging.McpLogMessageHandler`，
它是接收日志消息的回调接口。
如果你实现了自己的 `McpLogMessageHandler`，
只需在 MCP client builder 中传入它：

```java
McpClient mcpClient = new DefaultMcpClient.Builder()
    .transport(transport)
    .logMessageHandler(new MyLogMessageHandler())
    .build();
```

## MCP 监听器 {#mcp-listeners}

MCP client 支持 listeners，
用于监听 client 生命周期中的各种事件。
接口 `dev.langchain4j.mcp.client.McpClientListener` 是 listener 实现的基础接口。
单个 client 上可以注册多个 listeners；
它们会在每次 tool call、prompt 渲染和 resource 访问的前后都被调用。
调用 listener 时会注入对应的 `McpCallContext`。
该对象包含实际发送给 server 的 MCP message，
以及在适用时的 `InvocationContext`
（只有当该调用是某次 AI service 调用的一部分时才会存在）。

你可以逐个或批量添加 listeners：

```java
McpClient mcpClient = DefaultMcpClient.builder()
    .transport(transport)
    .addListener(new MyFirstListener())
    .addListener(new MySecondListener())
    .addListeners(List.of(new MyThirdListener(), new MyFourthListener()))
    .build();
```

## 资源 {#resources}

目前有两种处理 resources 的方式。
一种是应用直接调用 MCP client 的 resource 相关方法，以编程方式访问 resources；
另一种是通过 synthetic tools 将 resources 自动暴露给 LLM，
从而让 Chat Models 能自己查询 resources
（一个工具用于获取 resource 列表，另一个用于读取某个具体 resource 的内容）。

### 以编程方式访问资源 {#programmatically-accessing-resources}

如果要获取 server 上的 [MCP resources](https://modelcontextprotocol.io/docs/concepts/resources) 列表，
可以使用 `client.listResources()`；
若是 resource template，则使用 `client.listResourceTemplates()`。
这两个方法会分别返回 `McpResource` 或 `McpResourceTemplate` 的列表。
这些对象包含 resource 的元信息，最重要的就是 URI。

要获取 resource 的实际内容，
可以使用 `client.readResource(uri)`，并传入该 resource 的 URI。
这个方法会返回一个 `McpReadResourceResult`，其中包含一个 `McpResourceContents` 列表
（同一个 URI 可能对应多个 resource contents，
例如该 URI 表示一个目录时）。
每个 `McpResourceContents` 对象要么表示一个二进制 blob（`McpBlobResourceContents`），
要么表示一个文本内容（`McpTextResourceContents`）。

### 通过合成工具自动暴露资源 {#auto-expose-resources-via-synthetic-tools}

如果你在构建 `McpToolProvider` 时设置了一个 `McpResourcesAsToolsPresenter` 实例，
那么 MCP tool provider 就会在 `provideTools` 的结果中自动额外加入两个 synthetic tools，
与 backing MCP servers 原本提供的“常规” tools 一起暴露出来。
其中一个工具用于获取 resource 列表，另一个用于获取某个具体 resource 的内容。
LangChain4j 提供了一个默认实现 `DefaultMcpResourcesAsToolsPresenter`，
它会添加以下两个工具：

**_NOTE:_** 本节后续内容描述的是 `DefaultMcpResourcesAsToolsPresenter`。
你也可以接入自己的实现，使其表现出不同行为。

- `list_resources`：列出 backing MCP servers 暴露的所有 resources。该工具无参数。
- `get_resource`：读取某个 resource 的内容。该工具接收两个参数，用于共同定位一个 resource：
  MCP server 名称和 resource URI。

`list_resources` 的输出是如下形式的 JSON 数组：

```json
[ {
  "mcpServer" : "alice",
  "uri" : "file:///info",
  "uriTemplate" : null,
  "name" : "basicInfo",
  "description" : "Basic information about Alice",
  "mimeType" : "text/plain"
}, {
  "mcpServer" : "bob",
  "uri" : "file:///info",
  "uriTemplate" : null,
  "name" : "basicInfo",
  "description" : "Basic information about Bob",
  "mimeType" : "text/plain"
} ]
```

该数组中的每个对象都表示一个 resource。
每个 resource 由 `uri` 和 `mcpServer` 的组合唯一标识，
其中 `mcpServer` 是创建 MCP client 时分配的 `key` 值
（见 `DefaultMcpClient.Builder#key`）。
当 Chat model 调用 `list_resources` 工具后，
它会收到这份 resource 列表，并据此决定是否进一步调用 `read_resource`。
在大多数场景下，`list_resources` 与 `get_resource` 的默认描述已经足够向 LLM 解释其使用方法。
但如果你需要自定义这些工具及其参数的描述，
可以通过 `DefaultMcpResourcesAsToolsPresenter.Builder` 上的方法进行覆盖。

### 资源订阅 {#resource-subscriptions}

MCP 协议支持 [resource subscriptions](https://modelcontextprotocol.io/specification/2025-11-25/server/resources#subscriptions)，
使得 client 能在 server 上某个 resource 发生变化时收到通知。

如果你希望订阅某个特定 resource 的更新，
可以使用 `client.subscribeToResource(uri)`。
当 server 更新该 resource 时，
它会发送一个 `notifications/resources/updated` notification。
要处理这些通知，你可以通过 builder 上的 `onResourceUpdated` 方法注册回调：

```java
McpClient mcpClient = DefaultMcpClient.builder()
    .transport(transport)
    .onResourceUpdated((client, uri) -> {
        // re-read the updated resource
        McpReadResourceResult result = client.readResource(uri);
        // process the updated contents...
    })
    .build();

// subscribe to a resource
mcpClient.subscribeToResource("file:///status");

// later, unsubscribe
mcpClient.unsubscribeFromResource("file:///status");
```

## 提示词 {#prompts}

如果要从 server 获取 [MCP prompts](https://modelcontextprotocol.io/docs/concepts/prompts) 列表，
可以使用 `client.listPrompts()`。
该方法会返回一个 `McpPrompt` 列表。
`McpPrompt` 中包含 prompt 的名称及参数信息。

要渲染 prompt 的实际内容，
可以使用 `client.getPrompt(name, arguments)`。
一个已渲染的 prompt 可以包含一条或多条消息，
它们以 `McpPromptMessage` 对象表示。
每个 `McpPromptMessage` 都包含消息角色（`user`、`assistant` 等）
以及消息的实际内容。
当前支持的消息内容类型包括：`McpTextContent`、`McpImageContent` 和 `McpEmbeddedResource`。

你可以通过 `McpPromptMessage.toChatMessage()`，
将其转换为 LangChain4j core API 中通用的 `dev.langchain4j.data.message.ChatMessage`。
但这并不是在所有情况下都可行。
例如，当 prompt message 的 `role` 为 `assistant`，
且其内容不只是文本时，这个方法就会抛出异常。
无论角色是什么，包含二进制 blob 内容的消息目前都不支持转换为 `ChatMessage`。

## 通过 Docker 使用 GitHub MCP 服务器

下面来看一个具体示例：
如何使用 Model Context Protocol（MCP）以标准化方式连接 AI 模型与外部工具。
在这个例子中，我们会通过 LangChain4j MCP client 与 GitHub 交互，
获取并总结某个公开 GitHub 仓库的最近几次提交。
为此我们无需重复造轮子，
可以直接使用现成的 [GitHub MCP server implementation](https://github.com/github/github-mcp-server)，
它可在 [MCP GitHub repo](https://github.com/modelcontextprotocol) 中找到。

我们的目标是构建一个 Java 应用，
通过 LangChain4j MCP client 连接一个本地运行在 Docker 中的 GitHub MCP server，
并获取、总结 LangChain4j GitHub 仓库最近的提交记录。
这个例子使用的是 MCP 的 stdio transport，
用于在 Java 应用与 GitHub MCP server 之间通信。

## 在 Docker 中打包并执行 GitHub MCP 服务器

要与 GitHub 交互，首先需要在 Docker 中搭建 GitHub MCP server。
GitHub MCP server 提供了一个标准化接口，
可用于通过 Model Context Protocol 与 GitHub 交互。
它支持文件操作、仓库管理以及搜索功能。

要为 GitHub MCP server 构建 Docker 镜像，
你需要先从 [MCP servers GitHub repo](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
获取代码，可以通过 clone 仓库或下载源码实现。
然后进入根目录，执行以下 Docker 命令：

```bash
docker build -t mcp/github -f src/github/Dockerfile .
```
`Dockerfile` 会完成环境准备，并安装 GitHub MCP server 实现。
构建完成后，该镜像会在本地以 `mcp/github` 的名字存在。

```bash
docker image ls

REPOSITORY   TAG         IMAGE ID        SIZE
mcp/github   latest      b141704170b1    173MB
```

## 开发工具提供者 {#develop-tool-provider}

现在，让我们创建一个名为 `McpGithubToolsExample` 的 Java 类，
用 LangChain4j 连接我们的 GitHub MCP server。
这个类将会：

* 在 Docker 容器中启动 GitHub MCP server（其中 `docker` 命令位于 `/usr/local/bin/docker`）
* 通过 stdio transport 建立连接
* 使用 LLM 总结 LangChain4j GitHub 仓库最近 3 次提交

> **Note**: 在下面的代码中，我们通过环境变量 `GITHUB_PERSONAL_ACCESS_TOKEN` 传入 GitHub token。
> 但对于某些无需认证的公开仓库操作，这并不是必需的。

实现如下：

```java
public static void main(String[] args) throws Exception {

    ChatModel model = OpenAiChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .logRequests(true)
        .logResponses(true)
        .build();

    McpTransport transport = new StdioMcpTransport.Builder()
        .command(List.of("/usr/local/bin/docker", "run", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "-i", "mcp/github"))
        .logEvents(true)
        .build();

    McpClient mcpClient = new DefaultMcpClient.Builder()
        .transport(transport)
        .build();

    ToolProvider toolProvider = McpToolProvider.builder()
        .mcpClients(List.of(mcpClient))
        .build();

    Bot bot = AiServices.builder(Bot.class)
        .chatModel(model)
        .toolProvider(toolProvider)
        .build();

    try {
        String response = bot.chat("Summarize the last 3 commits of the LangChain4j GitHub repository");
        System.out.println("RESPONSE: " + response);
    } finally {
        mcpClient.close();
    }
}
```

:::note
并不是所有 LLM 对 tools 的支持都同样成熟。
模型是否能够理解、选择并正确使用工具，很大程度上取决于具体模型及其能力。
有些模型可能完全不支持 tools，而另一些模型则可能需要更仔细的 prompt engineering
或额外的 system instructions。
:::

> **Note**: 该示例使用 Docker，因此会执行位于 `/usr/local/bin/docker` 的 Docker 命令
> （请根据你的操作系统调整路径）。
> 如果你希望用 Podman 代替 Docker，请相应修改命令。

## 执行代码

运行这个示例前，请确保系统中的 Docker 已经正常启动。
同时，确保环境变量 `OPENAI_API_KEY` 中已设置你的 OpenAI API key。

然后运行 Java 应用。
你应该会得到一段响应，内容是对 LangChain4j GitHub 仓库最近 3 次提交的总结，
类似如下：

```
Here are the summaries of the last three commits in the LangChain4j GitHub repository:

1. **Commit [36951f9](https://github.com/langchain4j/langchain4j/commit/36951f9649c1beacd8b9fc2d910a2e23223e0d93)** (Date: 2025-02-05)
   - **Author:** Dmytro Liubarskyi
   - **Message:** Updated to `upload-pages-artifact@v3`.
   - **Details:** This commit updates the GitHub Action used for uploading pages artifacts to version 3.

2. **Commit [6fcd19f](https://github.com/langchain4j/langchain4j/commit/6fcd19f50c8393729a0878d6125b0bb1967ac055)** (Date: 2025-02-05)
   - **Author:** Dmytro Liubarskyi
   - **Message:** Updated to `checkout@v4`, `deploy-pages@v4`, and `upload-pages-artifact@v4`.
   - **Details:** This commit updates multiple GitHub Actions to their version 4.

3. **Commit [2e74049](https://github.com/langchain4j/langchain4j/commit/2e740495d2aa0f16ef1c05cfcc76f91aef6f6599)** (Date: 2025-02-05)
   - **Author:** Dmytro Liubarskyi
   - **Message:** Updated to `setup-node@v4` and `configure-pages@v4`.
   - **Details:** This commit updates the `setup-node` and `configure-pages` GitHub Actions to version 4.

All commits were made by the same author, Dmytro Liubarskyi, on the same day, focusing on updating various GitHub Actions to newer versions.
```

## 不使用 AI Services 也能使用 MCP

前面的示例展示的是如何通过高层 AI Services API 使用 MCP。
不过，你也可以通过低层 API 使用 MCP。
你可以手动使用自己构建的 `DefaultMcpClient` 实例来对 server 执行命令。
例如：

```java
// obtain a list of tools from the server
List<ToolSpecification> toolSpecifications = mcpClient.listTools();

// build and execute a ChatRequest that has access to the MCP tools
ChatRequest chatRequest = ChatRequest.builder()
        .messages(UserMessage.from("What will the weather be like in London tomorrow?"))
        .toolSpecifications(toolSpecifications)
        .build();
ChatResponse response = chatModel.chat(chatRequest);
AiMessage aiMessage = response.aiMessage();

// if the LLM requested to invoke a tool, forward it to the MCP server
if(aiMessage.hasToolExecutionRequests()) {
    for (ToolExecutionRequest req : aiMessage.toolExecutionRequests()) {
        String resultString = mcpClient.executeTool(req);
        // prepare the result for adding it to the memory for the next ChatRequest...
        ToolExecutionResultMessage resultMessage = ToolExecutionResultMessage.from(req.id(), req.name(), resultString);
    }
}
```

如果你希望在聊天上下文之外，直接通过 MCP client 以编程方式执行某个工具，
就需要手动构造一个 `ToolExecutionRequest`：

```java
// to execute a tool named "tool1" with argument "a=b"
ToolExecutionRequest request = ToolExecutionRequest.builder()
                .name("tool1")
                .arguments("{\"a\": \"b\"}")
                .build();
String toolResult = mcpClient.executeTool(request);
```

## 关于工具缓存的说明 {#note-on-tool-caching}

`DefaultMcpClient` 会维护一份内部 MCP tool cache。
一旦工具列表被获取，它就不会再次向 MCP server 请求，
除非 server 发送通知表明该列表已更新。
你也可以通过调用 `DefaultMcpClient.evictToolListCache()` 手动清除此缓存。
如果你希望完全禁用缓存，
可以按如下方式配置 client：

```java
McpClient mcpClient = new DefaultMcpClient.Builder()
    .key("MyMCPClient")
    .transport(transport)
    .cacheToolList(false)
    .build();
```

## MCP Registry 客户端 {#mcp-registry-client}

LangChain4j 还提供了一个独立的 client 实现，
可以与 [MCP registries](https://registry.modelcontextprotocol.io/docs#/) 通信。
目前只支持只读操作
（你可以搜索 MCP servers，但不支持管理和新增 server；
这些操作请使用[官方工具](https://github.com/modelcontextprotocol/registry/blob/main/docs/guides/publishing/publish-server.md)）。

**_WARNING:_** 发现 MCP servers 并使用它们（尤其是本地运行时）可能会带来严重的安全风险。
在运行任何来自公共 registry 的 MCP server 之前，请务必确认你信任它。

registry client 位于 `dev.langchain4j.mcp.registryclient` 包中，
可以这样初始化：

```java
McpRegistryClient client = DefaultMcpRegistryClient.builder()
        .baseUrl("URL-OF-THE-REGISTRY")
        .build();
```

如果没有提供 base URL，则会默认使用官方 registry（https://registry.modelcontextprotocol.io）。
之后，你可以通过 `registry.listServers(McpServerListRequest)` 方法搜索 MCP servers。
`McpServerListRequest` 对象可以使用 `McpServerListRequest.Builder` 构建。
LangChain4j 中的 Java API 与 MCP registries 官方 REST API 高度对应，
具体可参考官方的
[MCP Registry Reference](https://registry.modelcontextprotocol.io/docs)。
