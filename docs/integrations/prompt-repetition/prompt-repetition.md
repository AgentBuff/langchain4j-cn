---
sidebar_position: 1
---

# 提示词重复

`langchain4j-community-prompt-repetition` 是一个可选的社区模块，为两个 LangChain4j 集成点提供现成的提示词重复集成：

- AI Services 输入守卫（guardrails）
- RAG 查询转换

它受论文 [Prompt Repetition Improves Non-Reasoning LLMs](https://arxiv.org/html/2512.14982v1) 的启发，该论文报告了在一系列非推理工作负载上的提升效果。在 LangChain4j 中，该模块通过框架原生组件暴露核心的重复输入转换，并为实际应用添加了保守的默认值。

该模块为实验性模块，其有效性取决于工作负载。在大规模推广之前，请在你自己的提示词、模型和任务上进行验证。

## 功能概述

提示词重复按如下形式改写文本：

```text
Q -> Q\nQ
```

在 LangChain4j 中，可以在两个不同的位置应用此功能：

- 在非 RAG 的 AI Services 调用之前，使用 `PromptRepeatingInputGuardrail`
- 在高级 RAG 管道的检索之前，使用 `RepeatingQueryTransformer`

对于 RAG，重复应仅应用于检索查询，而不是发送给模型的最终增强提示词。

## Maven 依赖

如果你已经使用了社区模块，建议导入社区 BOM：

```xml
<dependencyManagement>
    <dependencies>
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

然后添加 prompt repetition 模块：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-prompt-repetition</artifactId>
</dependency>
```

也可以直接声明该模块：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-prompt-repetition</artifactId>
    <version>${latest version here}</version>
</dependency>
```

## 组件

该模块提供三个主要 API：

- `PromptRepeatingInputGuardrail`：在调用模型之前重复符合条件的单文本用户输入
- `RepeatingQueryTransformer`：在高级 RAG 管道中重复检索查询
- `PromptRepetitionPolicy`：包含两种集成共用的重复规则

以上所有 API 均标记为 `@Experimental`。

## 非 RAG 用法

对于非 RAG 的 AI Services 调用，将 `PromptRepeatingInputGuardrail` 附加到 `AiServices` 构建器：

```java
PromptRepetitionPolicy policy = PromptRepetitionPolicy.builder()
        .mode(PromptRepetitionMode.AUTO)
        .maxChars(8_000)
        .build();

Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .inputGuardrails(new PromptRepeatingInputGuardrail(policy))
        .build();
```

这是当你想在模型调用前改写用户输入而不在增强 RAG 提示词上操作时的首选集成点。

## RAG 用法

对于 RAG，仅重复检索查询：

```java
PromptRepetitionPolicy policy = PromptRepetitionPolicy.builder()
        .mode(PromptRepetitionMode.AUTO)
        .maxChars(8_000)
        .build();

RetrievalAugmentor retrievalAugmentor = DefaultRetrievalAugmentor.builder()
        .queryTransformer(new RepeatingQueryTransformer(policy))
        .build();
```

这将转换保持在检索阶段内，避免在检索到内容注入后重复最终提示词。

## 模式

`PromptRepetitionPolicy` 支持三种模式：

- `NEVER`：禁用重复
- `ALWAYS`：重复符合条件的输入
- `AUTO`：保守模式，跳过已重复的文本、过长的输入以及看起来要求显式推理的提示词

`AUTO` 是评估的最安全起点。

## 安全性与约束

- `PromptRepeatingInputGuardrail` 仅改写符合条件的单文本用户输入
- 不适合作为多模态请求的主要集成点
- 默认情况下，当 RAG 增强已经发生时，守卫会跳过请求
- 在 RAG 场景中，使用 `RepeatingQueryTransformer` 重复检索查询，而不是重复最终增强提示词
- 该模块为实验性模块，API 和行为在未来版本中可能会发生变化

## 使用场景

在你希望以现成方式在 LangChain4j 中应用提示词重复时使用此模块，而不是作为通用的默认提示词策略。

- 从 `PromptRepetitionMode.AUTO` 开始
- 优先在非推理或低推理工作负载上使用
- 在你自己的提示词、模型和任务上通过 A/B 测试进行评估
- 除非有明确理由，否则保留默认安全约束
- 将提升效果视为与工作负载相关，而非有所保证
