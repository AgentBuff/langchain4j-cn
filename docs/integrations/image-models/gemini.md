---
sidebar_position: 3
---

# Google AI Gemini 图像生成

Gemini 可以使用专用图像模型（称为 **Nano Banana**（Gemini 2.5 Flash Image）和 **Nano Banana Pro**（Gemini 3 Pro Image Preview））以对话方式生成和编辑图像。

## 目录

- [概述](#overview)
- [可用模型](#models-available)
- [GoogleAiGeminiImageModel](#googleaigeminiimagemodel)
    - [基本用法](#basic-usage)
    - [配置](#configuration)
- [图像生成](#image-generation)
    - [文本生成图像](#text-to-image)
    - [宽高比](#aspect-ratios)
    - [图像尺寸](#image-sizes)
- [图像编辑](#image-editing)
    - [添加和移除元素](#adding-and-removing-elements)
    - [风格迁移](#style-transfer)
    - [局部修改](#inpainting)
- [批量图像生成](#batch-image-generation)
- [限制](#limitations)
- [相关资源](#resources)

## 概述 {#overview}

Gemini 原生图像生成功能允许你：

- **文本生成图像**：从文字描述生成高质量图像
- **图像编辑**：在现有图像中添加、移除或修改元素
- **风格迁移**：为图像应用艺术风格
- **迭代优化**：通过多轮对话逐步完善图像
- **高保真文字渲染**：生成包含清晰、排列合理的文字的图像

所有生成的图像都包含 [SynthID 水印](https://ai.google.dev/responsible/docs/safeguards/synthid)。

## 可用模型 {#models-available}

| 模型 | 描述 | 最大分辨率 | 最大输入图像数 |
|-------|-------------|----------------|------------------|
| `gemini-2.5-flash-image` | 快速高效的图像生成（Nano Banana） | 1024px | 3 |
| `gemini-3-pro-image-preview` | 高级功能、思考模式、Google 搜索接地（Nano Banana Pro） | 4K | 14 |

## GoogleAiGeminiImageModel {#googleaigeminiimagemodel}

### 基本用法 {#basic-usage}

```java
ImageModel imageModel = GoogleAiGeminiImageModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash-image")
    .build();

Response<Image> response = imageModel.generate(
    "A nano banana dish in a fancy restaurant with a Gemini theme"
);

// 保存生成的图像
Image image = response.content();
byte[] imageBytes = Base64.getDecoder().decode(image.base64Data());
Files.write(Paths.get("nano-banana.png"), imageBytes);
```

### 配置 {#configuration}

```java
ImageModel imageModel = GoogleAiGeminiImageModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-3-pro-image-preview")
    .aspectRatio("16:9")              // 输出宽高比
    .imageSize("2K")                   // 分辨率（仅 Gemini 3 Pro 支持）
    .timeout(Duration.ofSeconds(120))
    .maxRetries(3)
    .logRequestsAndResponses(true)
    .safetySettings(...)               // 内容安全设置
    .build();
```

## 图像生成 {#image-generation}

### 文本生成图像 {#text-to-image}

通过描述性文字提示生成图像：

```java
ImageModel imageModel = GoogleAiGeminiImageModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash-image")
    .build();

// 写实风格
Response<Image> photo = imageModel.generate("""
    A photorealistic close-up portrait of an elderly Japanese ceramicist
    with deep wrinkles and a warm smile, inspecting a tea bowl.
    Soft golden hour light, 85mm portrait lens, shallow depth of field.
    """);

// 风格化插图
Response<Image> sticker = imageModel.generate("""
    A kawaii-style sticker of a happy red panda wearing a bamboo hat,
    munching on a leaf. Bold outlines, cel-shading, vibrant colors,
    white background.
    """);

// Logo 设计
Response<Image> logo = imageModel.generate("""
    A modern, minimalist logo for 'The Daily Grind' coffee shop.
    Clean, bold sans-serif font. Black and white. Circular design
    with a clever coffee bean element.
    """);
```

### 宽高比 {#aspect-ratios}

两种模型支持的宽高比：

| 宽高比 | 使用场景 |
|--------------|----------|
| `1:1` | 正方形、社交媒体帖子 |
| `2:3`, `3:2` | 竖版/横版照片 |
| `3:4`, `4:3` | 标准照片 |
| `4:5`, `5:4` | Instagram 帖子 |
| `9:16`, `16:9` | 故事、YouTube 缩略图 |
| `21:9` | 电影感、超宽屏 |

```java
ImageModel imageModel = GoogleAiGeminiImageModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash-image")
    .aspectRatio("16:9")  // 宽屏格式
    .build();
```

### 图像尺寸 {#image-sizes}

**Gemini 3 Pro Image Preview** 支持更高分辨率：

| 尺寸 | 描述 |
|------|-------------|
| `1K` | 默认分辨率 |
| `2K` | 更高分辨率 |
| `4K` | 最大分辨率 |

```java
ImageModel imageModel = GoogleAiGeminiImageModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-3-pro-image-preview")
    .aspectRatio("1:1")
    .imageSize("4K")  // 高分辨率输出
    .build();
```

## 图像编辑 {#image-editing}

### 添加和移除元素 {#adding-and-removing-elements}

通过提供图像和文字提示来编辑现有图像：

```java
ImageModel imageModel = GoogleAiGeminiImageModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash-image")
    .build();

// 加载源图像
Image sourceImage = Image.builder()
    .base64Data(Base64.getEncoder().encodeToString(
        Files.readAllBytes(Paths.get("cat.png"))))
    .mimeType("image/png")
    .build();

Response<Image> edited = imageModel.edit(
    sourceImage,
    "Add a small wizard hat on the cat's head. " +
    "Make it look natural with matching lighting."
);
```

### 风格迁移 {#style-transfer}

将图像转换为不同的艺术风格：

```java
Image cityPhoto = // ... 加载图像

Response<Image> stylized = imageModel.edit(
    cityPhoto,
    "Transform this city street into Vincent van Gogh's 'Starry Night' style. " +
    "Preserve the composition but render with swirling brushstrokes " +
    "and a dramatic palette of deep blues and bright yellows."
);
```

### 局部修改 {#inpainting}

修改特定元素同时保留其余内容：

```java
Image livingRoom = // ... 加载图像

Response<Image> edited = imageModel.edit(
    livingRoom,
    "Change only the blue sofa to a vintage brown leather chesterfield. " +
    "Keep everything else exactly the same."
);
```

## 批量图像生成 {#batch-image-generation}

大规模生成多张图像，可节省 50% 的费用：

```java
GoogleAiGeminiBatchImageModel batchModel = GoogleAiGeminiBatchImageModel.builder()
    .apiKey(System.getenv("GOOGLE_AI_GEMINI_API_KEY"))
    .modelName("gemini-2.5-flash-image")
    .build();

List<String> prompts = List.of(
    "A nano banana dish in a Gemini-themed restaurant",
    "A kawaii sticker of a banana wearing a chef hat",
    "A photorealistic banana split dessert",
    "A minimalist logo for 'Nano Banana Co.'"
);

// 提交批量任务
BatchResponse<?> response = batchModel.createBatchInline(prompts, "image-batch");
BatchName batchName = getBatchName(response);

// 轮询等待完成
do {
    Thread.sleep(10000);
    response = batchModel.retrieveBatchResults(batchName);
} while (response instanceof BatchIncomplete);

// 处理结果
if (response instanceof BatchSuccess<?> success) {
    for (Image image : success.images()) {
        byte[] imageBytes = Base64.getDecoder().decode(image.base64Data());
        // 保存或处理每张图像
    }
}

// 清理
batchModel.deleteBatchJob(batchName);
```

## 限制 {#limitations}

- **语言**：最适合英语，也支持 ar-EG、de-DE、es-MX、fr-FR、hi-IN、id-ID、it-IT、ja-JP、ko-KR、pt-BR、ru-RU、vi-VN、zh-CN
- **输入**：不支持音频和视频输入用于图像生成
- **输出数量**：模型可能不会总是生成请求的确切数量的图像
- **输入图像**：
    - `gemini-2.5-flash-image`：最多 3 张输入图像
    - `gemini-3-pro-image-preview`：最多 14 张输入图像（包含 5 张人物图像用于一致性）
- **URL 图像**：不支持基于 URL 的图像进行编辑，请使用 base64 编码的图像
- **水印**：所有生成的图像都包含 SynthID 水印

## 相关资源 {#resources}

- [Gemini 图像生成文档](https://ai.google.dev/gemini-api/docs/image-generation)
- [Gemini API 模型](https://ai.google.dev/gemini-api/docs/models/gemini)
- [批量 API 文档](https://ai.google.dev/gemini-api/docs/batch-api)
- [图像生成 Cookbook](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Get_Started_Nano_Banana.ipynb)
