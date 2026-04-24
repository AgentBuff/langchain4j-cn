import Head from '@docusaurus/Head';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';

const POPULAR = [
    {to: '/intro', label: '简介 Introduction'},
    {to: '/get-started', label: '快速开始 Get Started'},
    {to: '/tutorials/ai-services', label: 'AI Services'},
    {to: '/tutorials/rag', label: 'RAG 检索增强生成'},
    {to: '/tutorials/agents', label: 'Agents 智能体'},
    {to: '/tutorials/tools', label: 'Tools / Function Calling'},
    {to: '/tutorials/mcp', label: 'MCP (Model Context Protocol)'},
    {to: '/tutorials/spring-boot-integration', label: 'Spring Boot 集成'},
    {to: '/tutorials/quarkus-integration', label: 'Quarkus 集成'},
    {to: '/category/language-models', label: 'LLM 提供商总览'},
    {to: '/category/embedding-stores', label: '向量数据库总览'},
    {to: '/faq', label: '常见问题 FAQ'},
];

export default function NotFound() {
    return (
        <Layout
            title="404 页面未找到 | LangChain4j 中文文档"
            description="抱歉，该页面不存在。您可以从下面的热门链接继续浏览 LangChain4j 中文文档，了解如何在 Java 项目中使用大语言模型。">
            <Head>
                <meta name="robots" content="noindex, follow" />
            </Head>
            <main className="container margin-vert--xl">
                <Heading as="h1">404 - 页面未找到</Heading>
                <p>
                    抱歉，您访问的页面不存在或已迁移。您可以尝试以下入口继续浏览 LangChain4j 中文文档：
                </p>
                <ul>
                    {POPULAR.map(({to, label}) => (
                        <li key={to}>
                            <Link to={to}>{label}</Link>
                        </li>
                    ))}
                </ul>
                <p>
                    或返回 <Link to="/">首页</Link>。
                </p>
            </main>
        </Layout>
    );
}
