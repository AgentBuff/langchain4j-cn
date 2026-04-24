import Head from '@docusaurus/Head';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const SITE_URL = 'https://langchain4j.coderbuffer.com';

const FAQ_ITEMS_ZH = [
    {
        q: 'LangChain4j 是什么？和 Python 版 LangChain 有什么关系？',
        a: 'LangChain4j 是面向 Java 开发者的大语言模型（LLM）应用开发框架，提供统一 API 接入 20+ 主流大模型和 30+ 向量数据库。虽然名字致敬 Python 版 LangChain，但它不是移植版，而是从零围绕 Java 惯用法设计的独立项目：类型安全、POJO、注解、依赖注入、Fluent API，且与 Spring Boot / Quarkus / Helidon / Micronaut 深度集成。API、内部实现与发布周期都独立于 Python LangChain。',
    },
    {
        q: 'LangChain4j 支持哪些大模型？国内模型能接入吗？',
        a: '支持 20+ 主流 LLM 提供商。国际：OpenAI、Azure OpenAI、Google Gemini / Vertex AI、Anthropic Claude、Mistral、Cohere、Ollama、Hugging Face、Amazon Bedrock、GitHub Models、Together AI、Jlama 等。国内：阿里通义千问（DashScope）、百度文心一言、智谱 GLM（ZhipuAI），DeepSeek 可通过其 OpenAI 兼容接口直接使用 langchain4j-open-ai 接入。',
    },
    {
        q: 'LangChain4j 支持哪些向量数据库？',
        a: '30+ 向量存储：Milvus、Pinecone、Weaviate、Chroma、Qdrant、Elasticsearch、OpenSearch、PgVector（PostgreSQL）、Redis、Cassandra、MongoDB Atlas、Neo4j、Azure AI Search、Vespa、Oracle、MariaDB、ClickHouse 等，以及用于本地调试的 InMemoryEmbeddingStore。',
    },
    {
        q: 'LangChain4j 最低 JDK 版本是多少？',
        a: '最低支持 JDK 17。LangChain4j 1.x 全面采用 Java 17 特性（record、sealed、pattern matching 等），不再支持 JDK 8/11。',
    },
    {
        q: '如何在 Spring Boot 中使用 LangChain4j？',
        a: '引入对应 provider 的 Spring Boot Starter（例如 langchain4j-open-ai-spring-boot-starter），在 application.properties 中配置 API Key 和模型名称，即可通过 @Autowired 注入 ChatModel、EmbeddingModel、AI Services 等 Bean。详见 Spring Boot 集成教程。',
    },
    {
        q: 'LangChain4j 如何实现 RAG（检索增强生成）？',
        a: '典型流程分四步：1) Ingestion：用 DocumentLoader 读取 PDF/TXT/Markdown/网页，DocumentSplitter 切分为段落，EmbeddingModel 生成向量，存入 EmbeddingStore。2) Retrieval：查询时用同一 EmbeddingModel 向量化问题，在 EmbeddingStore 召回 top-k。3) （可选）Reranker 重排或 Reciprocal Rank Fusion 融合。4) Augmented Generation：把命中段落拼入提示词交给 ChatModel 生成答案。高级玩法可用 RetrievalAugmentor 自定义查询扩展、压缩、路由每一步。',
    },
    {
        q: 'LangChain4j 如何实现 Function Calling / 工具调用？',
        a: '用 @Tool 注解标注 Java 方法，LangChain4j 会在调用 LLM 时自动把工具的 JSON Schema 发给模型。当 LLM 返回工具调用请求时，框架会反射执行对应 Java 方法并把结果回填到对话中，支持多工具、多轮链式调用。',
    },
    {
        q: 'LangChain4j 和 Spring AI 该怎么选？',
        a: 'LangChain4j 框架无关，可用于 Spring Boot / Quarkus / Helidon / Micronaut / 纯 Java，功能覆盖更完整（RAG 高级检索、Agents、MCP、Guardrails、Skills 等），社区活跃更新快。Spring AI 由 Spring 团队维护，只面向 Spring 生态，与 Spring Boot Starter 深度绑定。两者 API 命名相近但不兼容。如果你的项目在 Spring Boot 上且只需要基础 LLM 能力，两者都可以；如果你需要非 Spring 栈、或需要更丰富的 RAG / Agents / MCP 能力，建议 LangChain4j。',
    },
    {
        q: 'LangChain4j 是否支持 MCP（Model Context Protocol）？',
        a: '支持。LangChain4j 从 1.x 起内置 MCP 客户端，支持 stdio 和 SSE 两种传输，可直接把 MCP Server 暴露的工具注入到 AI Services 中使用。',
    },
    {
        q: 'LangChain4j 是否开源、可商用？',
        a: '是。LangChain4j 采用 Apache License 2.0，可免费商用，允许闭源和商业分发。源码托管于 GitHub：https://github.com/langchain4j/langchain4j。',
    },
    {
        q: '没有 OpenAI API Key 怎么体验？',
        a: '可以临时使用官方 demo key（apiKey="demo"）配合 baseUrl="http://langchain4j.dev/demo/openai/v1" 进行演示，仅限 gpt-4o-mini 模型，有配额限制，不用于生产。也可以本地跑 Ollama，LangChain4j 提供 langchain4j-ollama 集成，完全离线可用。',
    },
    {
        q: 'LangChain4j 支持流式响应（streaming）吗？',
        a: '支持。所有主要的 ChatModel 都提供 StreamingChatModel 对应实现，通过 StreamingChatResponseHandler 逐 token 接收响应，方便构建打字机效果的聊天 UI。',
    },
];

const FAQ_ITEMS_EN = [
    {
        q: 'What is LangChain4j? Is it a Java port of Python LangChain?',
        a: 'LangChain4j is a Java framework for building LLM-powered applications. It exposes a unified API to 20+ major LLM providers and 30+ vector stores. The name pays tribute to LangChain, but it is NOT a port - it is an idiomatic Java library designed from scratch around type safety, POJOs, annotations, DI, fluent APIs, and first-class Spring Boot / Quarkus / Helidon / Micronaut integrations. Its API, internals and release cycle are independent of Python LangChain.',
    },
    {
        q: 'Which LLM providers does LangChain4j support?',
        a: '20+ providers: OpenAI, Azure OpenAI, Google Gemini / Vertex AI, Anthropic Claude, Mistral, Cohere, Ollama, Hugging Face, Amazon Bedrock, GitHub Models, Together AI, Jlama, plus DashScope (Qwen), ERNIE (Baidu), ZhipuAI GLM. DeepSeek works through the OpenAI-compatible adapter (langchain4j-open-ai).',
    },
    {
        q: 'Which vector stores does LangChain4j support?',
        a: '30+ stores including Milvus, Pinecone, Weaviate, Chroma, Qdrant, Elasticsearch, OpenSearch, PgVector (PostgreSQL), Redis, Cassandra, MongoDB Atlas, Neo4j, Azure AI Search, Vespa, Oracle, MariaDB, ClickHouse - plus an InMemoryEmbeddingStore for local development.',
    },
    {
        q: 'What is the minimum JDK version?',
        a: 'JDK 17. LangChain4j 1.x leverages records, sealed types and pattern matching, so JDK 8 / 11 are not supported.',
    },
    {
        q: 'How do I use LangChain4j with Spring Boot?',
        a: 'Add the matching Spring Boot Starter (e.g. langchain4j-open-ai-spring-boot-starter), set the API key and model in application.properties, then @Autowired your ChatModel, EmbeddingModel, EmbeddingStore or AI Services interface. See the Spring Boot integration guide.',
    },
    {
        q: 'How do I implement RAG with LangChain4j?',
        a: 'Four steps: 1) Ingestion - DocumentLoader reads PDFs / TXT / Markdown / web pages, DocumentSplitter chunks them, EmbeddingModel vectorises, EmbeddingStore stores. 2) Retrieval - vectorise the query and recall top-k from the EmbeddingStore. 3) Optional rerank or Reciprocal Rank Fusion. 4) Augmented Generation - inject the recalled chunks into the prompt and call the ChatModel. Use RetrievalAugmentor to customise query expansion, compression, routing.',
    },
    {
        q: 'How does Function Calling / Tool Use work in LangChain4j?',
        a: 'Annotate a Java method with @Tool. LangChain4j auto-generates the JSON schema and forwards it to the LLM. When the LLM returns a tool call, the framework reflectively dispatches it back to your Java method and replays the result into the conversation. Multi-tool and multi-step chains are supported.',
    },
    {
        q: 'LangChain4j vs Spring AI - which one should I pick?',
        a: 'LangChain4j is framework-agnostic (Spring Boot / Quarkus / Helidon / Micronaut / plain Java) with the broadest feature set: advanced RAG, Agents, MCP, Guardrails, Skills. Spring AI is maintained by the Spring team and is tightly bound to Spring Boot. APIs look similar but are NOT interchangeable. Choose Spring AI if you only need basic LLM features inside a Spring Boot app; pick LangChain4j if you need richer RAG / Agents / MCP or run outside Spring.',
    },
    {
        q: 'Does LangChain4j support MCP (Model Context Protocol)?',
        a: 'Yes. Since 1.x LangChain4j ships a built-in MCP client supporting both stdio and SSE transports. Tools exposed by any MCP server become first-class @Tool-style callables inside AI Services.',
    },
    {
        q: 'Is LangChain4j open source and commercially usable?',
        a: 'Yes. LangChain4j is Apache 2.0 licensed - free for commercial use, including closed-source and commercial redistribution. Source: https://github.com/langchain4j/langchain4j.',
    },
    {
        q: 'How can I try LangChain4j without an OpenAI API key?',
        a: 'Use the official demo key (apiKey="demo") with baseUrl="http://langchain4j.dev/demo/openai/v1". It is limited to gpt-4o-mini and has a small quota - demo only. Or run Ollama locally with langchain4j-ollama for a fully offline experience.',
    },
    {
        q: 'Does LangChain4j support streaming responses?',
        a: 'Yes. Every major ChatModel ships a StreamingChatModel counterpart. Subscribe with StreamingChatResponseHandler to receive tokens one by one - perfect for typewriter chat UIs.',
    },
];

function renderAnswer(text) {
    return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
        if (/^https?:\/\//.test(part)) {
            return (
                <a key={i} href={part} target="_blank" rel="noopener noreferrer">
                    {part}
                </a>
            );
        }
        return <span key={i}>{part}</span>;
    });
}

export default function Faq() {
    const {i18n} = useDocusaurusContext();
    const isEn = i18n.currentLocale === 'en';
    const items = isEn ? FAQ_ITEMS_EN : FAQ_ITEMS_ZH;

    const title = isEn
        ? 'LangChain4j FAQ - the Java LLM framework, answered'
        : 'LangChain4j 常见问题 FAQ | Java 大模型开发框架答疑';
    const description = isEn
        ? 'LangChain4j FAQ: minimum JDK, supported LLMs and vector stores, comparison with Spring AI / Python LangChain, RAG, Function Calling, MCP, Spring Boot integration, license - everything in one place.'
        : 'LangChain4j 中文 FAQ：JDK 要求、支持的 LLM 和向量数据库、与 Spring AI / Python LangChain 的区别、RAG、Function Calling、MCP、Spring Boot 集成、开源协议等常见问题一次看懂。';
    const keywords = isEn
        ? 'LangChain4j FAQ, Java LLM FAQ, Java RAG, Function Calling Java, MCP Java, Spring Boot AI, LangChain4j vs Spring AI, LangChain4j tutorial'
        : 'LangChain4j FAQ, LangChain4j 常见问题, LangChain4j 教程, Java LLM FAQ, Java 大模型 FAQ, Java RAG, Function Calling Java, MCP Java, Spring Boot AI, LangChain4j vs Spring AI';

    const canonical = (isEn ? SITE_URL + '/en/faq' : SITE_URL + '/faq');
    const ogLocale = isEn ? 'en_US' : 'zh_CN';

    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        inLanguage: isEn ? 'en-US' : 'zh-CN',
        mainEntity: items.map(({q, a}) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: {
                '@type': 'Answer',
                text: a,
            },
        })),
    };

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: isEn ? 'LangChain4j Documentation' : 'LangChain4j 中文文档',
                item: isEn ? SITE_URL + '/en/' : SITE_URL + '/',
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: isEn ? 'FAQ' : '常见问题 FAQ',
                item: canonical,
            },
        ],
    };

    return (
        <Layout title={title} description={description}>
            <Head>
                <link rel="canonical" href={canonical} />
                <meta name="keywords" content={keywords} />
                <meta property="og:type" content="article" />
                <meta property="og:locale" content={ogLocale} />
                <link rel="alternate" hrefLang="zh-CN" href={SITE_URL + '/faq'} />
                <link rel="alternate" hrefLang="en" href={SITE_URL + '/en/faq'} />
                <link rel="alternate" hrefLang="x-default" href={SITE_URL + '/faq'} />
                <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
                <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
            </Head>
            <main className="container margin-vert--lg">
                <Heading as="h1">
                    <Translate id="faq.heading">LangChain4j 常见问题 FAQ</Translate>
                </Heading>
                <p>
                    {isEn ? (
                        <>
                            Common questions about LangChain4j, the Java LLM application framework.
                            For deeper material see <Link to="/intro">Introduction</Link>,{' '}
                            <Link to="/get-started">Get Started</Link> or{' '}
                            <Link to="/category/tutorials">Tutorials</Link>.
                        </>
                    ) : (
                        <>
                            下面整理了关于 LangChain4j（Java 大语言模型应用开发框架）最常见的中文问题。
                            更深入的内容请移步 <Link to="/intro">简介</Link>、
                            <Link to="/get-started">快速开始</Link> 或
                            <Link to="/category/tutorials">教程</Link> 。
                        </>
                    )}
                </p>
                {items.map(({q, a}, idx) => (
                    <section key={idx} style={{marginTop: '2rem'}}>
                        <Heading as="h2" id={`q${idx + 1}`}>
                            {q}
                        </Heading>
                        <p>{renderAnswer(a)}</p>
                    </section>
                ))}
                <hr style={{marginTop: '3rem'}} />
                <p>
                    {isEn ? 'No luck finding an answer? Ask on ' : '没找到答案？欢迎到 '}
                    <a href="https://github.com/langchain4j/langchain4j/discussions" target="_blank" rel="noopener noreferrer">
                        GitHub Discussions
                    </a>
                    {isEn ? ' or ' : ' 或 '}
                    <a href="https://discord.com/invite/JzTFvyjG6R" target="_blank" rel="noopener noreferrer">
                        Discord
                    </a>
                    {isEn ? '.' : ' 提问。'}
                </p>
            </main>
        </Layout>
    );
}
