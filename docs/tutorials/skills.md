---
sidebar_position: 32
---

# 技能

:::note
Skills API 属于实验性功能。其 API 和行为在未来版本中仍可能发生变化。
:::

Skills 是一种让 LLM 获得可复用、可独立封装行为指令的机制。
一个 skill 会打包名称、简短描述以及一段指令正文（即它的 _content_），
并且还可以带上可选资源（例如参考资料、素材、模板等）。
LLM 会按需加载某个 skill，
从而让初始上下文保持精简，
只有在真正需要时才拉取详细指令。

:::note
Skills 的设计遵循 [Agent Skills specification](https://agentskills.io)。
:::

## 创建 Skills

### 从文件系统创建

通常，每个 skill 都位于自己的目录中，并包含一个 `SKILL.md` 文件。
该文件必须以 YAML front matter 开头，用于声明 skill 的 `name` 和 `description`。
front matter 下面的所有内容都会成为这个 skill 的正文内容，
也就是当 LLM 激活该 skill 时收到的指令。

```
skills/
├── docx/
│   ├── SKILL.md
│   └── references/
│       └── tracked-changes.md   ← loaded as a resource
└── data-analysis/
    └── SKILL.md
```

`SKILL.md` 示例：

```markdown
---
name: docx
description: Edit and review Word documents using tracked changes
---

When the user asks you to edit a Word document:

1. Always use tracked changes so edits can be reviewed.
   ...
```

skill 目录中的任何文件，
只要不是 `SKILL.md` 本身，且不位于 `scripts/` 子目录下，
都会被自动加载为一个 `SkillResource`，供 LLM 按需读取。

使用 `langchain4j-skills` 模块中的 `FileSystemSkillLoader`，
可以从文件系统加载 skills：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-skills</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

```java
// Load all skills found in immediate subdirectories:
List<FileSystemSkill> skills = FileSystemSkillLoader.loadSkills(Path.of("skills/"));

// Or load a single skill by its directory:
FileSystemSkill skill = FileSystemSkillLoader.loadSkill(Path.of("skills/docx"));
```

### 从 Classpath 创建

`ClassPathSkillLoader` 的工作方式与 `FileSystemSkillLoader` 类似，
只不过它是从 classpath 而不是文件系统解析 skill 目录。
当 skill 被打包进 JAR，或位于 `src/main/resources` 下时，这会很有用：

```
src/main/resources/
└── skills/
    ├── docx/
    │   ├── SKILL.md
    │   └── references/
    │       └── tracked-changes.md
    └── data-analysis/
        └── SKILL.md
```

```java
// Load all skills from a classpath directory:
List<FileSystemSkill> skills = ClassPathSkillLoader.loadSkills("skills");

// Or load a single skill:
FileSystemSkill skill = ClassPathSkillLoader.loadSkill("skills/docx");
```

默认情况下，`ClassPathSkillLoader` 会使用当前线程的 context class loader。
如果有需要，也可以传入自定义 `ClassLoader`：

```java
FileSystemSkill skill = ClassPathSkillLoader.loadSkill("skills/docx", myClassLoader);
```

`SKILL.md` 的格式、资源加载规则，以及对 `scripts/` 目录的排除规则，
都与 `FileSystemSkillLoader` 相同。

### 以编程方式创建

Skills 不一定必须来自文件系统。
你可以通过 builder API 从任意来源创建它们，
例如数据库、远程 API，或者运行时动态生成：

```java
Skill skill = Skill.builder()
        .name("incident-response")
        .description("Step-by-step runbook for diagnosing and resolving production incidents")
        .content("""
                When a production alert fires:
                1. Call `fetchRecentLogs(serviceName)` to retrieve the last 5 minutes of logs.
                2. Call `checkServiceHealth(serviceName)` to get current health metrics.
                3. Based on the findings, call `createIncidentTicket(summary, severity)`.
                4. If severity is CRITICAL, also call `pageOnCall(incidentId)`.
                """)
        .build();
```

你也可以以编程方式附加资源：

```java
SkillResource reference = SkillResource.builder()
        .relativePath("references/tone-guide.md")
        .content("Use warm, concise language. Avoid jargon.")
        .build();

Skill skill = Skill.builder()
        .name("customer-support")
        .description("Handles customer support inquiries")
        .content("Follow the tone guide in references/tone-guide.md ...")
        .resources(List.of(reference))
        .build();
```

## 模式

Skills 可以通过两种不同模式集成到 AI Service 中，
取决于你需要多少控制力与信任边界。

### 工具模式（推荐）

**Class:** `Skills`（位于 `langchain4j-skills` 模块）

这对应于 [Agent Skills specification](https://agentskills.io/integrate-skills)
中描述的 **Tool-based agents** 集成方式。

在这种模式下，LLM 会先激活某个 skill 以获取分步指令，
然后通过你显式注册的 [tools](/tutorials/tools) 来执行这些步骤。
**LLM 在推理时无法直接访问文件系统**。
所有 skill 内容与资源都会预先加载到内存中
（例如通过 `FileSystemSkillLoader`），
而 `activate_skill` 与 `read_skill_resource` 这两个工具返回的也是这些预加载内容，
而不是在运行时再去读磁盘。
由于 LLM 只能调用你预定义的工具，
**因此不会有任意代码执行的风险**。

#### 已注册的工具

| Tool                  | When registered                                                                               |
|-----------------------|-----------------------------------------------------------------------------------------------|
| `activate_skill`      | Always. The LLM calls this to load a skill's full instructions into the context.              |
| `read_skill_resource` | When at least one skill has resources. The LLM calls this to read individual reference files. |
| Skill-scoped tools    | After the skill is activated.                                                                 |

#### 工作方式

1. system message 会列出可用 skills（名称和描述），供 LLM 选择。
2. 用户提出一个需要特定 skill 的问题。
3. LLM 调用 `activate_skill("my-skill")` 以获取该 skill 的完整指令。
4. LLM 按照这些指令完成任务，必要时还可以继续读取资源文件。

#### 示例 Skill

Skill 负责描述 _policy_，
也就是调用顺序、所需参数、错误处理步骤以及示例；
而真正执行动作的部分，仍然放在类型安全、经过测试的 Java 代码里：

```markdown
---
name: process-order
description: Processes a customer order end-to-end
---

To process an order:

1. Call `validateOrder(orderId)` to check the order is valid.
2. Call `reserveInventory(orderId)` to reserve the required stock.
3. Only if reservation succeeds, call `chargePayment(orderId)`.
4. Finally, call `sendConfirmationEmail(orderId)`.

If any step fails, call `rollbackOrder(orderId)` before reporting the error.
```

#### 接线方式

将 `Skills` 提供的 `ToolProvider` 与普通 tools 一起传给 AI Service builder。
使用 `formatAvailableSkills()` 把 skill 目录注入 system message，
这样 LLM 才知道有哪些 skills 可以激活：

```java
Skills skills = Skills.from(FileSystemSkillLoader.loadSkills(Path.of("skills/")));

MyAiService service = AiServices.builder(MyAiService.class)
        .chatModel(chatModel)
        .tools(new OrderTools()) // your tools
        .toolProvider(skills.toolProvider()) // or .toolProviders(myToolProvider, skills.toolProvider()) if you already have a tool provider configured
        .systemMessage("You have access to the following skills:\n" + skills.formatAvailableSkills()
                + "\nWhen the user's request relates to one of these skills, activate it first using the `activate_skill` tool before proceeding.")
        .build();
```

`formatAvailableSkills()` 会返回一个 XML 格式的片段，
列出每个 skill 的名称和描述：

```xml

<available_skills>
    <skill>
        <name>process-order</name>
        <description>Processes a customer order end-to-end</description>
    </skill>
    <skill>
        <name>data-analysis</name>
        <description>Analyse tabular data and produce charts</description>
    </skill>
</available_skills>
```

#### 自定义

每个工具的名称、描述以及参数元数据，
都可以通过 builder 上对应的配置类覆盖：

```java
Skills skills = Skills.builder()
        .skills(mySkills)
        .activateSkillToolConfig(ActivateSkillToolConfig.builder()
                .name(...)                    // tool name (default: "activate_skill")
                .description(...)             // tool description
                .parameterName(...)           // parameter name (default: "skill_name")
                .parameterDescription(...)    // parameter description
                .throwToolArgumentsExceptions(...) // throw ToolArgumentsException instead of ToolExecutionException (default: false)
                .build())
        .readResourceToolConfig(ReadResourceToolConfig.builder()
                .name(...)                              // tool name (default: "read_skill_resource")
                .description(...)                       // tool description
                .skillNameParameterName(...)             // skill_name parameter name (default: "skill_name")
                .skillNameParameterDescription(...)      // skill_name parameter description
                .relativePathParameterName(...)          // relative_path parameter name (default: "relative_path")
                .relativePathParameterDescription(...)   // static description (takes precedence over provider)
                .relativePathParameterDescriptionProvider(...) // dynamic description based on available resources
                .throwToolArgumentsExceptions(...)       // throw ToolArgumentsException instead of ToolExecutionException (default: false)
                .build())
        .build();
```

#### 技能作用域工具

你还可以把工具直接绑定到某个 skill 上。
这些工具**只有在该 skill 通过 `activate_skill` 被激活后**，
才会暴露给 LLM。
这样可以让 LLM 可见的工具列表更小、更聚焦，
也能保证 skill 专属工具只在真正相关时才出现。

##### 使用 `@Tool` 标注的方法

最简单的方式，就是传入带有 `@Tool` 标注方法的对象：

```java
class OrderTools {

    @Tool("Validates a customer order by ID")
    String validateOrder(String orderId) {
        // validation logic
        return "valid";
    }

    @Tool("Charges payment for a customer order")
    String chargePayment(String orderId) {
        // payment logic
        return "charged";
    }
}

Skill skill = Skill.builder()
        .name("process-order")
        .description("Processes a customer order end-to-end")
        .content("""
                To process an order:
                1. Call `validateOrder(orderId)` to check the order is valid.
                2. Call `chargePayment(orderId)`.
                """)
        .tools(new OrderTools())
        .build();
```

你也可以通过 `toBuilder()` 把工具附加到一个已经构建好的 skill 上，
例如给从文件系统加载的 skill 动态补充工具：

```java
FileSystemSkill skill = FileSystemSkillLoader.loadSkill(Path.of("skills/process-order"));

Skill skillWithTools = skill.toBuilder()
        .tools(new OrderTools())
        .build();
```

##### 使用 Tool Providers

你也可以把 `ToolProvider` 绑定到某个 skill 上。
例如，只有在该 skill 被激活后，才暴露来自 MCP server 的工具：

```java
ToolProvider mcpToolProvider = McpToolProvider.builder()
        .mcpClients(mcpClient)
        .toolFilter((tool, mcpClient) -> tool.name().startsWith("inventory_"))
        .build();

Skill skill = Skill.builder()
        .name("inventory-management")
        .description("Manages warehouse inventory")
        .content("""
                Use inventory tools to check stock levels and update quantities.
                """)
        .toolProviders(mcpToolProvider)
        .build();
```

##### 使用 `Map<ToolSpecification, ToolExecutor>`

如果你希望完全控制工具规格和执行逻辑，
也可以直接传入一个 map：

```java
ToolSpecification validateOrder = ToolSpecification.builder()
        .name("validateOrder")
        .description("Validates a customer order by ID")
        .addParameter("orderId", JsonSchemaProperty.STRING, JsonSchemaProperty.description("The order ID"))
        .build();

ToolExecutor validateOrderExecutor = (request, memoryId) -> {
    String orderId = parseOrderId(request.arguments());
    return validate(orderId);
};

Skill skill = Skill.builder()
        .name("process-order")
        .description("Processes a customer order end-to-end")
        .content("""
                To process an order:
                1. Call `validateOrder(orderId)` to check the order is valid.
                """)
        .tools(Map.of(validateOrder, validateOrderExecutor))
        .build();
```

这三种方式可以混合使用。
`@Tool` 方法、`ToolProvider` 与 `Map` 条目最终都会合并成同一组 skill-scoped tools：

```java
Skill skill = Skill.builder()
        .name("process-order")
        .description("Processes a customer order end-to-end")
        .content("...")
        .tools(new OrderTools())
        .tools(Map.of(validateOrder, validateOrderExecutor))
        .toolProviders(mcpToolProvider)
        .build();
```

##### 接线方式

```java
Skills skills = Skills.from(skill);

MyAiService service = AiServices.builder(MyAiService.class)
        .chatModel(chatModel)
        .chatMemory(MessageWindowChatMemory.withMaxMessages(100))
        .toolProvider(skills.toolProvider())
        .systemMessage("You have access to the following skills:\n" + skills.formatAvailableSkills()
                + "\nWhen the user's request relates to one of these skills, activate it first.")
        .build();
```

##### Skill-Scoped Tools 的工作方式

1. 在 skill 激活之前，LLM 只能看到 `activate_skill`（以及 `read_skill_resource`）这两个工具。
   skill-scoped tools 不会出现在工具列表里。
2. 当 LLM 调用 `activate_skill("process-order")` 后，
   这次激活会记录在 `ToolExecutionResultMessage` 中。
3. 在下一次 LLM 调用前
   （并且仍然处于同一次 AI Service 调用之内），
   AI Service 会根据当前消息重新评估动态 tool providers。
   这时 skill-scoped tools（例如 `validateOrder`）就会变得可见，
   LLM 可以在同一次 AI Service 调用中立刻使用它们。
   这些 skill-scoped tools 会在后续 AI Service 调用中持续可见，
   只有当 skill 被停用后才会重新变为不可见。

##### 将 Skills 与 Tool Search 一起使用

Skills 可以与 [Tool Search](/tutorials/tools#tool-search) 一起工作。
当二者同时启用时，它们是彼此独立的：

- **skill-scoped tools 永远不会进入可搜索池。**
  它们不会出现在 searchable tool pool 中，
  也不能通过 `tool_search_tool` 被找到。
  它们只有在对应 skill 被激活后才会变得可见。
- **普通 tools 仍然可以被搜索。**
  通过 AI Service 上 `.tools(...)` 注册的工具
  （而不是绑定在某个 skill 上的工具）
  无论是否已有 skill 被激活，依然可以被 Tool Search 搜索到。
- **`activate_skill` 永远可见。**
  它会被标记为 `ALWAYS_VISIBLE`，
  因此即使启用了 Tool Search，LLM 依然始终可以调用它。

```java
Skills skills = Skills.from(mySkills);

MyAiService service = AiServices.builder(MyAiService.class)
        .chatModel(chatModel)
        .chatMemory(MessageWindowChatMemory.withMaxMessages(100))
        .tools(new MySearchableTools()) // these are searchable
        .toolProvider(skills.toolProvider()) // skill-scoped tools are NOT searchable
        .toolSearchStrategy(new SimpleToolSearchStrategy())
        .systemMessage("You have access to the following skills:\n" + skills.formatAvailableSkills()
                + "\nWhen the user's request relates to one of these skills, activate it first.")
        .build();
```

### Shell 模式（实验性）

**Class:** `ShellSkills`（位于 `langchain4j-experimental-skills-shell` 模块）

这对应于 [Agent Skills specification](https://agentskills.io/integrate-skills)
中的 **Filesystem-based agents** 集成方式。

:::warning
**Shell 执行天然不安全。**
命令会直接在宿主进程环境中执行，**没有任何沙箱、容器化或权限限制**。
一旦 LLM 行为异常，或受到 prompt injection 影响，
它就可能在运行你应用的机器上执行任意命令。
只有在受控环境中、你完全信任输入并且接受相关风险时，
才应该使用这种模式。
:::

在这种模式下，LLM 只会得到一个 `run_shell_command` 工具，
并通过 shell 命令直接从文件系统读取 skill 指令。
这里没有 `activate_skill` 或 `read_skill_resource` 工具，
LLM 会像人类开发者一样自行浏览 skill 文件。

#### 已注册的工具

| Tool                | When registered                                                                                   |
|---------------------|---------------------------------------------------------------------------------------------------|
| `run_shell_command` | Always. The LLM runs shell commands to read `SKILL.md` files, resource files and execute scripts. |

#### 工作方式

1. system message 会列出可用 skills 及其绝对文件系统路径。
2. 用户提出一个需要某个特定 skill 的问题。
3. LLM 执行 `cat /path/to/skills/docx/SKILL.md` 来读取指令。
4. LLM 再通过进一步的 shell 命令来执行这些指令。

#### 依赖

Shell 执行位于单独的实验性 artifact 中，
需要先把它加入构建：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-experimental-skills-shell</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

#### 接线方式

所有 skills 都必须是基于文件系统的
（通过 `FileSystemSkillLoader` 加载）。
这里应使用 `ShellSkills`，而不是 `Skills`：

```java
ShellSkills skills = ShellSkills.from(FileSystemSkillLoader.loadSkills(Path.of("skills/")));

MyAiService service = AiServices.builder(MyAiService.class)
        .chatModel(chatModel)
        .toolProvider(skills.toolProvider()) // or .toolProviders(myToolProvider, skills.toolProvider()) if you already have a tool provider configured
        .systemMessage("You have access to the following skills:\n" + skills.formatAvailableSkills()
                + "\nWhen the user's request relates to one of these skills, read its SKILL.md before proceeding.")
        .build();
```

`formatAvailableSkills()` 会额外包含一个 `<location>` 字段，
让 LLM 知道每个 `SKILL.md` 的确切位置：

```xml

<available_skills>
    <skill>
        <name>docx</name>
        <description>Edit and review Word documents using tracked changes</description>
        <location>/path/to/skills/docx/SKILL.md</location>
    </skill>
    <skill>
        <name>data-analysis</name>
        <description>Analyse tabular data and produce charts</description>
        <location>/path/to/skills/data-analysis/SKILL.md</location>
    </skill>
</available_skills>
```

#### 何时使用 Shell Mode

这种模式更适合**实验和原型阶段**，
或者当你希望直接使用社区发布的第三方 skills
（例如来自 [agentskills.io](https://agentskills.io) 生态）时，
无需先把它们迁移成 Java 工具。
它可以让你快速接上一个可运行工作流，
之后再随着方案成熟，逐步把具体动作迁移为 tools。

#### 自定义

可以使用 `RunShellCommandToolConfig` 来调整工作目录、输出限制与参数名称：

```java
ShellSkills skills = ShellSkills.builder()
        .skills(mySkills)
        .runShellCommandToolConfig(RunShellCommandToolConfig.builder()
                .name(...)                              // tool name (default: "run_shell_command")
                .description(...)                       // tool description (default: includes OS name)
                .commandParameterName(...)              // command parameter name (default: "command")
                .commandParameterDescription(...)       // command parameter description
                .timeoutSecondsParameterName(...)       // timeout parameter name (default: "timeout_seconds")
                .timeoutSecondsParameterDescription(...) // timeout parameter description
                .workingDirectory(...)                  // working directory for commands (default: JVM's user.dir)
                .maxStdOutChars(...)                    // max stdout chars in result (default: 10_000)
                .maxStdErrChars(...)                    // max stderr chars in result (default: 10_000)
                .executorService(...)                   // ExecutorService for reading stdout/stderr streams
                .throwToolArgumentsExceptions(...)      // throw ToolArgumentsException instead of ToolExecutionException (default: false)
                .build())
        .build();
```
