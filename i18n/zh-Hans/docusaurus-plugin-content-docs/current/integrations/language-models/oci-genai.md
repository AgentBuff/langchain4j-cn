---
sidebar_position: 21
---

# Oracle Cloud Infrastructure GenAI

[Generative AI Service](https://www.oracle.com/artificial-intelligence/generative-ai/generative-ai-service)
提供对 Cohere 和 Meta 预训练基础模型的访问。
可在[此处](https://docs.public.oneportal.content.oci.oraclecloud.com/en-us/iaas/Content/generative-ai/pretrained-models.htm)查看 AI 模型可用性。

通过专用 AI 集群，您可以在私有专用 GPU 上托管基础模型，为生产用例提供稳定、高吞吐的性能，同时支持托管和微调工作负载。



## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-oci-genai</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

此外，需要为 OCI SDK 选择 HTTP 客户端，默认使用基于 Jersey 3 的版本：
```xml
<dependency>
    <groupId>com.oracle.oci.sdk</groupId>
    <artifactId>oci-java-sdk-common-httpclient-jersey3</artifactId>
    <version>${oci-sdk.version}</version>
</dependency>
```

如果您使用的是 **Java EE/Jakarta EE 8 或更旧版本**的运行时，请使用基于 Jersey 2 的版本：
```xml
<dependency>
    <groupId>com.oracle.oci.sdk</groupId>
    <artifactId>oci-java-sdk-common-httpclient-jersey</artifactId>
    <version>${oci-sdk.version}</version>
</dependency>
```

更多信息请参阅 [OCI SDK 文档](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/javasdk3.htm#javasdk3__HTTP-client-libraries)。


## API 参考 {#api}
包路径：`dev.langchain4j.community.model.oracle.oci.genai`

API 按 Cohere 和 Meta 模型分开，因为二者的配置方式不同。

Meta 模型：
* `OciGenAiChatModel` - 适用于所有 OCI GenAI 通用对话模型（llama）
* `OciGenAiStreamingChatModel` - OCI GenAI 通用对话模型的流式 API

Cohere 模型：
* `OciGenAiCohereChatModel` - 适用于所有 OCI GenAI Cohere 对话模型
* `OciGenAiCohereStreamingChatModel` - OCI GenAI Cohere 对话模型的流式 API


## 示例

带工具调用的同步 Cohere 对话模型示例：
```java
var model = OciGenAiCohereChatModel.builder()
      .modelName("cohere.command-r-08-2024")
      .compartmentId("ocid1.tenancy.oc1..aa....")
      .authProvider(new ConfigFileAuthenticationDetailsProvider("DEFAULT"))
      .maxTokens(600)
      .temperature(0.2)
      .topP(0.75)
      .build();

Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(model)
        .tools(new Calculator())
        .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
        .build();

String answer = assistant.chat("Calculate square root of 16");
```

流式 Meta 对话模型示例：
```java
var model = OciGenAiStreamingChatModel.builder()
                .modelName("meta.llama-3.3-70b-instruct")
                .compartmentId("ocid1.tenancy.oc1..aa....")
                .authProvider(new ConfigFileAuthenticationDetailsProvider("DEFAULT"))
                .build();

CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();   

model.doChat(ChatRequest.builder()
        .messages(UserMessage.from("Tell me a joke about Java"))
        .build(), 
new StreamingChatResponseHandler() {
    @Override
    public void onPartialResponse(String partialResponse) {
        System.out.print(partialResponse);
    }
    @Override
    public void onCompleteResponse(ChatResponse completeResponse) {
        futureResponse.complete(completeResponse);
    }
    @Override
    public void onError(Throwable error) {
        futureResponse.completeExceptionally(error);
    }
});
futureResponse.join();
```
