---
sidebar_position: 31
---

# JSON 编解码

LangChain4j 内置了一套 JSON 序列化器（默认使用 Jackson），
它被用于 “tools” 和 “structured output” 两类功能。

默认序列化器在大多数情况下都能正常工作。
但在某些环境下，默认的 Jackson 序列化器可能会因为其他依赖而产生错误。
其中一个实际例子是 Jetbrains / IntelliJ 插件开发场景。

如果你需要提供自己的 JSON 序列化器（也叫 JSON Codec），
可以按照下面的步骤操作：

1. 在你的项目中创建 `dev.langchain4j.spi.json.JsonCodecFactory` 的实现

在这个示例里，假设你的工厂类是：`example.MyJsonCodecFactory`

你可以参考 `dev.langchain4j.internal.JacksonJsonCodec`，
它是 LangChain4j 内部默认使用的 codec，
然后根据你的需要对其进行适配。

2. 添加 SPI provider 配置文件

在资源目录（例如 `src/main/resources`）中添加 `META-INF/services` 文件夹，
并创建一个名为 `dev.langchain4j.spi.json.JsonCodecFactory` 的文件。
该文件内容必须是你这个工厂实现的完整限定类名（FQDN）。
在我们的示例里，它应当是：

```
example.MyJsonCodecFactory
```

## 注意事项

`dev.langchain4j.spi.json.JsonCodecFactory` 被标记为 LangChain4j 内部使用接口。
因此，这种方式只应在你**确实**需要自定义 JSON Codec 的环境中使用。
