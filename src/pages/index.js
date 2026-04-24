import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
    return (<header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
            <Heading as="h1" className="hero__title">
                <Translate id="homepage.hero.title">LangChain4j 中文文档</Translate>
            </Heading>
            <img
                src="img/logo.svg"
                alt={translate({
                    id: 'homepage.hero.logoAlt',
                    message: 'LangChain4j 中文文档 - Java 大模型（LLM）应用开发框架 Logo',
                })}
                className={styles.logo}
                style={{maxWidth: '20vh'}}
            />
            <p className="hero__subtitle">
                <Translate id="site.tagline">Supercharge your Java application with the power of LLMs</Translate>
            </p>
            <div className={styles.buttons}>
                <Link
                    className="button button--secondary button--lg"
                    to="/intro">
                    <Translate id="homepage.header.button">Introduction</Translate>
                </Link>
            </div>
        </div>
    </header>);
}

function HomepageSeoContent() {
    return (
        <section className="padding-vert--lg">
            <div className="container">
                <Heading as="h2">
                    <Translate id="homepage.seo.heading">
                        LangChain4j - 为 Java 开发者打造的大语言模型（LLM）应用开发框架
                    </Translate>
                </Heading>
                <p>
                    <Translate id="homepage.seo.paragraph1">
                        LangChain4j 是面向 Java 生态的大语言模型应用开发框架，提供统一 API 接入 OpenAI、Azure OpenAI、Google Gemini、Anthropic Claude、通义千问、DeepSeek、文心一言、智谱 GLM、Ollama 等 20+ 主流大模型，以及 Milvus、Pinecone、Weaviate、Qdrant、Elasticsearch、PgVector 等 30+ 向量数据库。
                    </Translate>
                </p>
                <p>
                    <Translate id="homepage.seo.paragraph2">
                        内置 RAG 检索增强生成、Agents 智能体、Tools 工具调用（Function Calling）、MCP（Model Context Protocol）、AI Services、Chat Memory、Guardrails 等高层能力，并与 Spring Boot、Quarkus、Helidon、Micronaut 深度集成，帮助 Java 工程师快速构建可上生产的 AI 应用。
                    </Translate>
                </p>
            </div>
        </section>
    );
}

export default function Home() {
    const {siteConfig} = useDocusaurusContext();
    const description = translate({
        id: 'homepage.meta.description',
        message: 'LangChain4j 中文文档：面向 Java 开发者的大语言模型应用开发框架，统一 API 接入 OpenAI、通义千问、DeepSeek、Gemini、Claude 等 20+ LLM 与 30+ 向量数据库，内置 RAG、Agents、Tools、MCP、AI Services，深度集成 Spring Boot / Quarkus / Helidon / Micronaut。',
    });
    return (<Layout
        title={siteConfig.title}
        description={description}>
        <Head>
            <link rel="canonical" href="https://langchain4j-cn.vercel.app/" />
        </Head>
        <HomepageHeader/>
        <main>
            <HomepageFeatures/>
            <HomepageSeoContent/>
        </main>
    </Layout>);
}
