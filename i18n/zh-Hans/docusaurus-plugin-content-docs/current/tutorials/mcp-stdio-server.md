---
sidebar_position: 17
---

# 构建 Java MCP stdio 服务器

LangChain4j 提供了一个 MCP **client**（`langchain4j-mcp`），
用于连接 MCP servers。
如果你希望构建一个基于 Java 的 MCP **stdio server**
（也就是由 MCP client 启动的本地子进程），
请使用 community 模块：`langchain4j-community-mcp-server`。

本文展示了如何通过最小化配置，
把已有的 `@Tool` 标注方法通过 stdio 以 MCP（JSON-RPC）的形式暴露出来。

## 添加依赖

先添加 BOM（推荐）：

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>dev.langchain4j</groupId>
            <artifactId>langchain4j-bom</artifactId>
            <version>${latest version here}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <dependency>
            <groupId>dev.langchain4j</groupId>
            <artifactId>langchain4j-community-bom</artifactId>
            <version>${latest version here}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

然后添加 community MCP server 依赖：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-mcp-server</artifactId>
</dependency>
```

## 实现工具 {#implement-tools}

使用 `@Tool` 暴露你的功能：

```java
import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;

class Calculator {

    @Tool
    long add(@P("a") long a, @P("b") long b) {
        return a + b;
    }
}
```

## 启动 stdio 服务器 {#start-stdio-server}

```java
import dev.langchain4j.community.mcp.server.McpServer;
import dev.langchain4j.community.mcp.server.transport.StdioMcpServerTransport;
import dev.langchain4j.mcp.protocol.McpImplementation;
import java.util.List;

public class McpServerMain {

    public static void main(String[] args) throws Exception {
        McpImplementation serverInfo = new McpImplementation();
        serverInfo.setName("my-java-mcp-server");
        serverInfo.setVersion("1.0.0");

        McpServer server = new McpServer(List.of(new Calculator()), serverInfo);
        new StdioMcpServerTransport(System.in, System.out, server);

        // Keep the process alive while stdio is open
        Thread.currentThread().join();
    }
}
```

:::caution
`StdioMcpServerTransport` 会把 JSON-RPC 协议流写到 `System.out`。
请确保你的日志被配置为写入 `System.err`，
否则会破坏协议流，导致 client 断开连接。
:::

## 打包为可运行 JAR

MCP clients（例如 Claude Desktop）通常会期望启动一个本地 server 进程。
将 server 打包为可运行的 fat JAR 是一种常见做法，
不过任何可运行进程都可以。

## 配置 MCP 客户端 {#configure-mcp-client}

### Claude Desktop 配置 {#claude-desktop}

在 `claude_desktop_config.json` 中添加一个 server 条目：

```json
{
  "mcpServers": {
    "my-java-tool": {
      "command": "java",
      "args": ["-jar", "/absolute/path/to/my-java-mcp-server.jar"]
    }
  }
}
```

请使用绝对路径；在 Windows 上需要对反斜杠进行转义。

## 完整可运行示例

你可以在 examples 仓库中的 `mcp-stdio-server-example` 查看一个完整可运行项目
（包括打包和 client 配置）：

- https://github.com/langchain4j/langchain4j-examples (directory: `mcp-stdio-server-example`)
