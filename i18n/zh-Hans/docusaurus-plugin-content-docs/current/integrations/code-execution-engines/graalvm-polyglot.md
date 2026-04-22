---
sidebar_position: 2
---

# GraalVM Polyglot/Truffle

:::danger
⚠️ 安全警告：高风险代码执行

此模块通过 GraalVM 启用任意 Python/JavaScript 代码的执行，存在固有风险。

❗ 请勿在生产环境中使用！
:::

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-code-execution-engine-graalvm-polyglot</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## API 列表 {#apis}

- `GraalVmJavaScriptExecutionEngine`
- `GraalVmJavaScriptExecutionTool`
- `GraalVmPythonExecutionEngine`
- `GraalVmPythonExecutionTool`

## 示例

- [GraalVmJavaScriptExecutionEngineTest](https://github.com/langchain4j/langchain4j/blob/main/code-execution-engines/langchain4j-code-execution-engine-graalvm-polyglot/src/test/java/dev/langchain4j/code/graalvm/GraalVmJavaScriptExecutionEngineTest.java)
- [GraalVmJavaScriptExecutionToolIT](https://github.com/langchain4j/langchain4j/blob/main/code-execution-engines/langchain4j-code-execution-engine-graalvm-polyglot/src/test/java/dev/langchain4j/agent/tool/graalvm/GraalVmJavaScriptExecutionToolIT.java)
- [GraalVmPythonExecutionEngineTest](https://github.com/langchain4j/langchain4j/blob/main/code-execution-engines/langchain4j-code-execution-engine-graalvm-polyglot/src/test/java/dev/langchain4j/code/graalvm/GraalVmPythonExecutionEngineTest.java)
- [GraalVmPythonExecutionToolIT](https://github.com/langchain4j/langchain4j/blob/main/code-execution-engines/langchain4j-code-execution-engine-graalvm-polyglot/src/test/java/dev/langchain4j/agent/tool/graalvm/GraalVmPythonExecutionToolIT.java)
