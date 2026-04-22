---
sidebar_position: 22
---
# GPULlama3.java
[GPULlama3.java](https://github.com/beehive-lab/GPULlama3.java)

GPULlama3.java 基于 [TornadoVM](https://github.com/beehive-lab/TornadoVM) 构建，直接在 Java 中利用 GPU 和异构计算加速 LLM 推理。
目前，GPULlama3.java 通过 PTX 和 OPENCL 后端支持在 NVIDIA、AMD GPU 以及 Apple Silicon 上进行推理。

----
## 项目配置

在 Maven 项目的 `pom.xml` 中添加以下依赖：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>1.13.0</version>
</dependency>

<dependency>
<groupId>dev.langchain4j</groupId>
<artifactId>langchain4j-gpu-llama3</artifactId>
<version>1.13.0-beta23</version>
</dependency>

```

在 Gradle 项目的 `build.gradle` 中：

```groovy
implementation 'dev.langchain4j:langchain4j:1.13.0'
implementation 'dev.langchain4j:langchain4j-gpu-llama3:1.13.0-beta23'
```
---
## 模型兼容性

目前，GPULlama3.java 支持 FP16、Q8 和 Q4 格式的 GGUF 格式模型。
注意：Q8 和 Q4 模型在加载时会反量化为 FP16。
我们在 [HuggingFace](https://huggingface.co/beehive-lab/collections) 仓库中维护了经过测试的模型集合。

* Llama3
* Mistral
* Qwen2.5
* Qwen3.0
* Phi-3
* DeepSeek-R1-Distill-Qwen-1.5B-GGUF
----
## 对话补全
对话模型使用经过对话数据微调的模型生成类人回复。

### 同步模式
创建一个类并添加以下代码：

```java
prompt = "What is the capital of France?";
ChatRequest request = ChatRequest.builder().messages(
    UserMessage.from(prompt),
    SystemMessage.from("reply with extensive sarcasm"))
    .build();

Path modelPath = Paths.get("beehive-llama-3.2-1b-instruct-fp16.gguf");

GPULlama3ChatModel model = GPULlama3ChatModel.builder()
        .modelPath(modelPath)
        .onGPU(Boolean.TRUE) // 如果为 false，则通过 llama3.java 的轻量级实现在 CPU 上运行
        .build();
ChatResponse response = model.chat(request);
System.out.println("\n" + response.aiMessage().text());
```

### 流式模式

创建一个类并添加以下代码：

```java
public static void main(String[] args) {
    CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();

    String prompt;

    if (args.length > 0) {
        prompt = args[0];
        System.out.println("User Prompt: " + prompt);
    } else {
        prompt = "What is the capital of France?";
        System.out.println("Example Prompt: " + prompt);
    }

    ChatRequest request = ChatRequest.builder().messages(
                    UserMessage.from(prompt),
                    SystemMessage.from("reply with extensive sarcasm"))
            .build();

    Path modelPath = Paths.get("beehive-llama-3.2-1b-instruct-fp16.gguf");


    GPULlama3StreamingChatModel model = GPULlama3StreamingChatModel.builder()
            .onGPU(Boolean.TRUE) // 如果为 false，则通过 llama3.java 的轻量级实现在 CPU 上运行
            .modelPath(modelPath)
            .build();

    model.chat(request, new StreamingChatResponseHandler() {

        @Override
        public void onPartialResponse(String partialResponse) {
            System.out.print(partialResponse);
        }

        @Override
        public void onCompleteResponse(ChatResponse completeResponse) {
            futureResponse.complete(completeResponse);
            model.printLastMetrics();
        }

        @Override
        public void onError(Throwable error) {
            futureResponse.completeExceptionally(error);
        }
    });

    futureResponse.join();
}
```

## 运行方法：

需要配置 TornadoVM 才能运行示例。
详细说明请参阅 **[配置与安装](https://github.com/beehive-lab/GPULlama3.java?tab=readme-ov-file#prerequisites)**
#### **步骤 1 — 获取 Tornado JVM 标志**

运行以下命令（需要已安装 Tornado）：

```bash
tornado --printJavaFlags
```

示例输出：

```bash
/home/mikepapadim/.sdkman/candidates/java/current/bin/java -server \
 -XX:+UnlockExperimentalVMOptions -XX:+EnableJVMCI \
-XX:-UseCompressedClassPointers --enable-preview \
-Djava.library.path=/home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/lib \
--module-path .:/home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/share/java/tornado \
-Dtornado.load.api.implementation=uk.ac.manchester.tornado.runtime.tasks.TornadoTaskGraph \
-Dtornado.load.runtime.implementation=uk.ac.manchester.tornado.runtime.TornadoCoreRuntime \
-Dtornado.load.tornado.implementation=uk.ac.manchester.tornado.runtime.common.Tornado \
-Dtornado.load.annotation.implementation=uk.ac.manchester.tornado.annotation.ASMClassVisitor \
-Dtornado.load.annotation.parallel=uk.ac.manchester.tornado.api.annotations.Parallel \
--upgrade-module-path /home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/share/java/graalJars \
-XX:+UseParallelGC \
@/home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/etc/exportLists/common-exports \
@/home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/etc/exportLists/opencl-exports \
--add-modules ALL-SYSTEM,tornado.runtime,tornado.annotation,tornado.drivers.common,tornado.drivers.opencl
```

#### **步骤 2 — 构建 Maven 类路径**

在项目根目录运行：

```bash
mvn dependency:build-classpath -Dmdep.outputFile=cp.txt
```

#### **步骤 3 — 构建 Maven 项目**

```bash
mvn clean package
```

主 JAR 文件位于：
```bash
target/gpullama3.java-example-1.13.0-beta23.jar
```

#### **步骤 4 — 使用 Java 直接运行程序**
现在可以使用所有 JVM 和 Tornado 标志运行示例：

```bash
JAVA_BIN=/home/mikepapadim/.sdkman/candidates/java/current/bin/java
CP="target/gpullama3.java-example-1.13.0-beta23.jar:$(cat cp.txt)"

$JAVA_BIN \
  -server \
  -XX:+UnlockExperimentalVMOptions \
  -XX:+EnableJVMCI \
  --enable-preview \
  -Djava.library.path=/home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/lib \
  --module-path .:/home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/share/java/tornado \
  -Dtornado.load.api.implementation=uk.ac.manchester.tornado.runtime.tasks.TornadoTaskGraph \
  -Dtornado.load.runtime.implementation=uk.ac.manchester.tornado.runtime.TornadoCoreRuntime \
  -Dtornado.load.tornado.implementation=uk.ac.manchester.tornado.runtime.common.Tornado \
  -Dtornado.load.annotation.implementation=uk.ac.manchester.tornado.annotation.ASMClassVisitor \
  -Dtornado.load.annotation.parallel=uk.ac.manchester.tornado.api.annotations.Parallel \
  --upgrade-module-path /home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/share/java/graalJars \
  -XX:+UseParallelGC \
  @/home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/etc/exportLists/common-exports \
  @/home/mikepapadim/java-ai-demos/GPULlama3.java/external/tornadovm/bin/sdk/etc/exportLists/opencl-exports \
  --add-modules ALL-SYSTEM,tornado.runtime,tornado.annotation,tornado.drivers.common,tornado.drivers.opencl \
  -Xms6g -Xmx6g \
  -Dtornado.device.memory=6GB \
  -cp "$CP" \
  GPULlama3ChatModelExamples
```

## 预期输出：

```bash
WARNING: Using incubator modules: jdk.incubator.vector
Example Prompt: What is the capital of France?
SLF4J(W): No SLF4J providers were found.
SLF4J(W): Defaulting to no-operation (NOP) logger implementation
SLF4J(W): See https://www.slf4j.org/codes.html#noProviders for further details.
Wow, I'm so glad you asked. I've been waiting for someone to finally ask me this question. It's not like I have better things to do, like take a nap or something. So, yes, the capital of France is... (dramatic pause) ...Paris!

achieved tok/s: 48.86. Tokens: 87, seconds: 1.78
```

## 注意事项：

* GPU 使用率可通过 `nvidia-smi`（NVIDIA GPU）或 `nvtop` 等适当工具（AMD/Apple Silicon）进行监控。
