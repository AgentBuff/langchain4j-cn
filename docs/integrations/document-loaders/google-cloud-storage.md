---
sidebar_position: 2
---

# Google Cloud Storage

Google Cloud Storage（GCS）文档加载器，允许您从存储桶中加载文档。

## Maven 依赖

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-document-loader-google-cloud-storage</artifactId>
    <version>1.13.0-beta23</version>
</dependency>
```

## API 参考 {#api}

- `GoogleCloudStorageDocumentLoader`

## 身份验证

在以下情况下，身份验证将为您透明处理：
* 如果您的应用程序在 Google Cloud Platform（Cloud Run、App Engine、Compute Engine 等）上运行
* 在本地机器上运行时，如果您已通过 Google 的 `gcloud` SDK 进行身份验证

您只需指定项目 ID 即可创建加载器：

```java
GoogleCloudStorageDocumentLoader gcsLoader = GoogleCloudStorageDocumentLoader.builder()
    .project(System.getenv("GCP_PROJECT_ID"))
    .build();
```

否则，如果您已下载服务账户密钥并导出了指向它的环境变量，可以指定 `Credentials`：

```java
GoogleCloudStorageDocumentLoader gcsLoader = GoogleCloudStorageDocumentLoader.builder()
    .project(System.getenv("GCP_PROJECT_ID"))
    .credentials(GoogleCredentials.fromStream(new FileInputStream(System.getenv("GOOGLE_APPLICATION_CREDENTIALS"))))
    .build();
```

了解更多关于[凭据](https://cloud.google.com/docs/authentication/application-default-credentials)的信息。

访问公共存储桶时，无需进行身份验证。

## 示例

### 从 GCS 存储桶加载单个文件

```java
GoogleCloudStorageDocumentLoader gcsLoader = GoogleCloudStorageDocumentLoader.builder()
    .project(System.getenv("GCP_PROJECT_ID"))
    .build();

Document document = gcsLoader.loadDocument("BUCKET_NAME", "FILE_NAME.txt", new TextDocumentParser());
```

### 从 GCS 存储桶加载所有文件

```java
GoogleCloudStorageDocumentLoader gcsLoader = GoogleCloudStorageDocumentLoader.builder()
    .project(System.getenv("GCP_PROJECT_ID"))
    .build();

List<Document> documents = gcsLoader.loadDocuments("BUCKET_NAME", new TextDocumentParser());
```

### 使用 glob 模式从 GCS 存储桶加载所有文件

```java
GoogleCloudStorageDocumentLoader gcsLoader = GoogleCloudStorageDocumentLoader.builder()
    .project(System.getenv("GCP_PROJECT_ID"))
    .build();

List<Document> documents = gcsLoader.loadDocuments("BUCKET_NAME", "*.txt", new TextDocumentParser());
```

有关更多代码示例，请参阅集成测试类：
- [GoogleCloudStorageDocumentLoaderIT](https://github.com/langchain4j/langchain4j/blob/main/document-loaders/langchain4j-document-loader-google-cloud-storage/src/test/java/dev/langchain4j/data/document/loader/gcs/GoogleCloudStorageDocumentLoaderIT.java)
