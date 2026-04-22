---
sidebar_position: 1
---

# Playwright

`BrowserExecutionEngine` 表示一个浏览器执行引擎，可用于响应用户操作在浏览器上执行动作。`PlaywrightBrowserExecutionEngine` 是 `BrowserExecutionEngine` 的一个实现，使用 <a href="https://playwright.dev/java/">Playwright Java API</a> 执行浏览器操作。`BrowserUseTool` 使用 `BrowserExecutionEngine` 执行浏览器操作，可用于**浏览器使用（Browser-Use）** Agent。你可以使用自然语言控制浏览器，例如：
* `open page 'https://docs.langchain4j.dev/', and summary the page text`

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-browser-execution-engine-playwright</artifactId>
    <version>${latest version here}</version>
</dependency>
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-tool-browser-use</artifactId>
    <version>${latest version here}</version>
</dependency>
```

## API 列表 {#apis}

- `BrowserExecutionEngine`
- `PlaywrightBrowserExecutionEngine`
- `BrowserUseTool`

## 示例

```java
        Playwright playwright = Playwright.create();
        BrowserType.LaunchOptions options = new BrowserType.LaunchOptions()
                .setHeadless(false)
                .setChannel("chrome")
                .setChromiumSandbox(true)
                .setSlowMo(500);
        Browser browser = playwright.chromium().launch(options);

        Assistant assistant = AiServices.builder(Assistant.class)
                .chatModel(model)
                .tools(BrowserUseTool.from(PlaywrightBrowserExecutionEngine.builder().browser(browser).build()))
                .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
                .build();

        String question = "open page 'https://docs.langchain4j.dev/', and summary the page text";
        System.out.println(assistant.chat(question));
```

- [PlaywrightBrowserExecutionEngineIT](https://github.com/langchain4j/langchain4j-community/blob/main/browser-execution-engines/langchain4j-community-browser-execution-engine-playwright/src/test/java/dev/langchain4j/community/browser/playwright/PlaywrightBrowserExecutionEngineIT.java)
- [BrowserUseToolIT](https://github.com/langchain4j/langchain4j-community/blob/main/tools/langchain4j-community-tool-browser-use/src/test/java/dev/langchain4j/community/tool/browseruse/BrowserUseToolIT.java)
