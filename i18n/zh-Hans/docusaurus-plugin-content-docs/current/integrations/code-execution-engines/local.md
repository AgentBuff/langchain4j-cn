---
sidebar_position: 4
---

# 本地代码执行

`CommandLineExecutionEngine` 使用本地计算机环境执行提供的命令行代码。
`CommandLineTool` 和 `LocalScriptExecutionTool` 是两个已实现的工具，可用于**桌面自动化**或**计算机使用（Computer-Use）** Agent（如文件管理、应用控制）。你可以使用自然语言控制计算机，例如：
- `set my mac output volume 50`
- `list all running applications in my mac`
- `tell a story and then read it out loud`
- `tell a story about moon and save it into a text file`
- ...

:::danger
⚠️ 安全警告：高风险代码执行

注意！在在线生产环境中执行代码可能存在**危险**。如果用于在线服务，需通过安全沙箱环境执行。

❗ 请勿在生产环境中使用！
:::

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-code-execution-engine-local</artifactId>
    <version>${latest version here}</version>
</dependency>
```

## API 参考 {#apis}

- `CommandLineExecutionEngine`
- `CommandLineTool`
- `LocalScriptExecutionTool`

## 示例

```java
        LocalScriptExecutionTool tool = new LocalScriptExecutionTool();

        Assistant assistant = AiServices.builder(Assistant.class)
                .chatModel(model)
                .tools(tool)
                .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
                .build();

        String answer = assistant.chat("list all running applications in my mac");
        System.out.println(answer);
```

- [CommandLineExecutionEngineTest](https://github.com/langchain4j/langchain4j-community/blob/main/code-execution-engines/langchain4j-community-code-execution-engine-local/src/test/java/dev/langchain4j/community/code/local/CommandLineExecutionEngineTest.java)
- [CommandLineToolIT](https://github.com/langchain4j/langchain4j-community/blob/main/code-execution-engines/langchain4j-community-code-execution-engine-local/src/test/java/dev/langchain4j/community/code/local/CommandLineToolIT.java)
- [CommandLineToolTest](https://github.com/langchain4j/langchain4j-community/blob/main/code-execution-engines/langchain4j-community-code-execution-engine-local/src/test/java/dev/langchain4j/community/code/local/CommandLineToolTest.java)
- [LocalScriptExecutionToolIT](https://github.com/langchain4j/langchain4j-community/blob/main/code-execution-engines/langchain4j-community-code-execution-engine-local/src/test/java/dev/langchain4j/community/code/local/LocalScriptExecutionToolIT.java)
- [LocalScriptExecutionToolTest](https://github.com/langchain4j/langchain4j-community/blob/main/code-execution-engines/langchain4j-community-code-execution-engine-local/src/test/java/dev/langchain4j/community/code/local/LocalScriptExecutionToolTest.java)
