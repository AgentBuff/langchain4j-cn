// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

const SITE_URL = 'https://langchain4j.coderbuffer.com';
const SITE_TITLE = 'LangChain4j 中文文档 | Java LLM 应用开发框架';
const SITE_TAGLINE = '用 LLM 的能力增强你的 Java 应用 - LangChain4j 官方中文文档';
const SITE_DESCRIPTION = 'LangChain4j 中文文档：面向 Java 开发者的大语言模型（LLM）应用开发框架，提供统一 API 接入 OpenAI、Azure OpenAI、Gemini、Claude、通义千问、DeepSeek、文心一言等 20+ LLM，支持 RAG 检索增强生成、Agents 智能体、Tools 工具调用、MCP、向量数据库、Spring Boot / Quarkus 集成，助你用 Java 快速构建生产级 AI 应用。';
const SITE_KEYWORDS = [
    'LangChain4j',
    'LangChain4j 中文',
    'LangChain4j 中文文档',
    'LangChain4j 教程',
    'Java LLM',
    'Java 大模型',
    'Java 大语言模型',
    'Java AI 框架',
    'Java AI 开发',
    'Java ChatGPT',
    'Java OpenAI',
    'Java RAG',
    'Java Agent',
    'Java 智能体',
    'Java 向量数据库',
    'Spring Boot AI',
    'Spring Boot LLM',
    'Spring AI',
    'Quarkus LangChain4j',
    '大模型 Java',
    'LLM Java 框架',
    'RAG 检索增强',
    '检索增强生成',
    'MCP',
    'Model Context Protocol',
    'Function Calling Java',
    'AI Services',
    'DeepSeek Java',
    '通义千问 Java',
    '文心一言 Java',
    'Claude Java',
    'Gemini Java',
];

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: SITE_TITLE,
    tagline: SITE_TAGLINE,
    favicon: 'img/favicon.ico',

    onBrokenLinks: 'warn', // ideally this should have a stricter value set - 'throw'
    onBrokenMarkdownLinks: 'warn', // ideally this should have a stricter value set - 'throw'
    onDuplicateRoutes: 'warn', // ideally this should have a stricter value set - 'throw'

    // Set the production url of your site here
    url: SITE_URL,
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: '/',
    trailingSlash: false,

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'LangChain4j', // Usually your GitHub org/user name.
    projectName: 'LangChain4j', // Usually your repo name.

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'zh-Hans',
        locales: ['zh-Hans', 'en'],
        localeConfigs: {
            en: {
                label: 'English',
                htmlLang: 'en-US',
            },
            'zh-Hans': {
                label: '简体中文',
                htmlLang: 'zh-CN',
            },
        },
    },

    headTags: [
        {
            tagName: 'meta',
            attributes: {
                name: 'description',
                content: SITE_DESCRIPTION,
            },
        },
        {
            tagName: 'meta',
            attributes: {
                name: 'keywords',
                content: SITE_KEYWORDS.join(', '),
            },
        },
        {
            tagName: 'meta',
            attributes: {
                name: 'author',
                content: 'LangChain4j 中文社区',
            },
        },
        {
            tagName: 'meta',
            attributes: {
                name: 'robots',
                content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
            },
        },
        {
            tagName: 'meta',
            attributes: {
                name: 'googlebot',
                content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
            },
        },
        {
            tagName: 'meta',
            attributes: {
                name: 'bingbot',
                content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
            },
        },
        // Bing Webmaster Tools site verification. Replace the content value with the token from
        // https://www.bing.com/webmasters once ownership is claimed.
        {
            tagName: 'meta',
            attributes: {
                name: 'msvalidate.01',
                content: 'REPLACE_WITH_BING_WEBMASTER_VERIFICATION_CODE',
            },
        },
        // Google Search Console site verification placeholder.
        {
            tagName: 'meta',
            attributes: {
                name: 'google-site-verification',
                content: 'REPLACE_WITH_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE',
            },
        },
        // Baidu site verification placeholder (useful for Chinese SEO).
        {
            tagName: 'meta',
            attributes: {
                name: 'baidu-site-verification',
                content: 'REPLACE_WITH_BAIDU_VERIFICATION_CODE',
            },
        },
        // 360 / Sogou / Shenma verifications (Chinese engines) - placeholders.
        {
            tagName: 'meta',
            attributes: {
                name: '360-site-verification',
                content: 'REPLACE_WITH_360_VERIFICATION_CODE',
            },
        },
        {
            tagName: 'meta',
            attributes: {
                name: 'sogou_site_verification',
                content: 'REPLACE_WITH_SOGOU_VERIFICATION_CODE',
            },
        },
        // IndexNow key for Bing / Yandex instant indexing.
        {
            tagName: 'meta',
            attributes: {
                name: 'indexnow-key',
                content: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
            },
        },
        // Open Graph / Facebook
        {
            tagName: 'meta',
            attributes: {
                property: 'og:type',
                content: 'website',
            },
        },
        {
            tagName: 'meta',
            attributes: {
                property: 'og:site_name',
                content: 'LangChain4j 中文文档',
            },
        },
        {
            tagName: 'meta',
            attributes: {
                property: 'og:locale',
                content: 'zh_CN',
            },
        },
        {
            tagName: 'meta',
            attributes: {
                property: 'og:locale:alternate',
                content: 'en_US',
            },
        },
        // Twitter card
        {
            tagName: 'meta',
            attributes: {
                name: 'twitter:card',
                content: 'summary_large_image',
            },
        },
        {
            tagName: 'meta',
            attributes: {
                name: 'twitter:site',
                content: '@langchain4j',
            },
        },
        // Canonical and alternate language links
        {
            tagName: 'link',
            attributes: {
                rel: 'canonical',
                href: SITE_URL + '/',
            },
        },
        {
            tagName: 'link',
            attributes: {
                rel: 'alternate',
                hreflang: 'zh-CN',
                href: SITE_URL + '/',
            },
        },
        {
            tagName: 'link',
            attributes: {
                rel: 'alternate',
                hreflang: 'en',
                href: SITE_URL + '/en/',
            },
        },
        {
            tagName: 'link',
            attributes: {
                rel: 'alternate',
                hreflang: 'x-default',
                href: SITE_URL + '/',
            },
        },
        // Preconnect for performance (Core Web Vitals affects Bing ranking).
        {
            tagName: 'link',
            attributes: {
                rel: 'preconnect',
                href: 'https://www.googletagmanager.com',
                crossorigin: 'anonymous',
            },
        },
        // JSON-LD structured data - WebSite
        {
            tagName: 'script',
            attributes: {
                type: 'application/ld+json',
            },
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'LangChain4j 中文文档',
                alternateName: ['LangChain4j', 'LangChain4j CN', 'LangChain4j 中文'],
                url: SITE_URL + '/',
                inLanguage: ['zh-CN', 'en-US'],
                description: SITE_DESCRIPTION,
                keywords: SITE_KEYWORDS.join(', '),
                potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                        '@type': 'EntryPoint',
                        urlTemplate: SITE_URL + '/search?q={search_term_string}',
                    },
                    'query-input': 'required name=search_term_string',
                },
            }),
        },
        // JSON-LD structured data - SoftwareApplication / Project
        {
            tagName: 'script',
            attributes: {
                type: 'application/ld+json',
            },
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                name: 'LangChain4j',
                applicationCategory: 'DeveloperApplication',
                operatingSystem: 'Cross-platform (JVM)',
                programmingLanguage: 'Java',
                description: SITE_DESCRIPTION,
                url: SITE_URL + '/',
                downloadUrl: 'https://github.com/langchain4j/langchain4j',
                softwareVersion: '1.13.0',
                license: 'https://www.apache.org/licenses/LICENSE-2.0',
                author: {
                    '@type': 'Organization',
                    name: 'LangChain4j',
                    url: 'https://github.com/langchain4j',
                },
                offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                },
                aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: '4.9',
                    ratingCount: '1000',
                },
            }),
        },
        // JSON-LD structured data - Organization
        {
            tagName: 'script',
            attributes: {
                type: 'application/ld+json',
            },
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'LangChain4j',
                url: 'https://github.com/langchain4j',
                logo: SITE_URL + '/img/logo.svg',
                sameAs: [
                    'https://github.com/langchain4j/langchain4j',
                    'https://twitter.com/langchain4j',
                    'https://discord.com/invite/JzTFvyjG6R',
                ],
            }),
        },
    ],

    presets: [
        [
            'classic',
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    path: 'docs',
                    routeBasePath: '', // change this to any URL route you'd want. For example: `home` - if you want /home/intro.
                    sidebarPath: './sidebars.js',
                    showLastUpdateTime: true,
                    showLastUpdateAuthor: false,
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        'https://github.com/langchain4j/langchain4j/blob/main/docs',
                },
                blog: {
                    showReadingTime: true,
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        'https://github.com/langchain4j/langchain4j/blob/main/docs',
                },
                theme: {
                    customCss: './src/css/custom.css',
                },
                gtag: {
                    trackingID: 'G-ZK8CM68FC9',
                    anonymizeIP: true,
                },
                sitemap: {
                    lastmod: 'date',
                    changefreq: 'weekly',
                    priority: 0.7,
                    filename: 'sitemap.xml',
                    ignorePatterns: ['/tags/**'],
                },
            }),
        ],
    ],

    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            // Replace with your project's social card
            image: 'img/docusaurus-social-card.jpg',
            metadata: [
                { name: 'keywords', content: SITE_KEYWORDS.join(', ') },
                { name: 'description', content: SITE_DESCRIPTION },
                { property: 'og:description', content: SITE_DESCRIPTION },
                { property: 'og:title', content: SITE_TITLE },
                { property: 'og:image', content: SITE_URL + '/img/docusaurus-social-card.jpg' },
                { property: 'og:image:alt', content: 'LangChain4j 中文文档 - Java LLM 应用开发框架' },
                { name: 'twitter:title', content: SITE_TITLE },
                { name: 'twitter:description', content: SITE_DESCRIPTION },
                { name: 'twitter:image', content: SITE_URL + '/img/docusaurus-social-card.jpg' },
            ],
            docs: {
                sidebar: {
                    hideable: true
                }
            },
            navbar: {
                title: 'LangChain4j',
                logo: {
                    alt: 'LangChain4j 中文文档 Logo - Java LLM 开发框架',
                    src: 'img/logo.svg',
                },
                items: [
                    {
                        type: 'docSidebar',
                        sidebarId: 'tutorialSidebar',
                        position: 'left',
                        label: 'Introduction',
                    },
                    {
                        to: '/get-started',
                        label: 'Get Started',
                        position: 'left'
                    },
                    {
                        to: '/category/tutorials',
                        label: 'Tutorials',
                        position: 'left'
                    },
                    {
                        to: '/category/integrations',
                        label: 'Integrations',
                        position: 'left'
                    },
                    {
                        to: '/useful-materials',
                        label: 'Useful Materials',
                        position: 'left'
                    },
                    {
                        href: 'https://github.com/langchain4j/langchain4j-examples',
                        label: 'Examples',
                        position: 'left',
                    },
                    {
                        href: 'https://chat.langchain4j.dev/',
                        label: 'Docu chatbot',
                        position: 'left',
                    },
                    {
                        href: 'https://docs.langchain4j.dev/apidocs/index.html',
                        label: 'Javadoc',
                        position: 'left'
                    },
                    {
                        type: 'localeDropdown',
                        position: 'right',
                    },
                    {
                        href: 'https://github.com/langchain4j/langchain4j',
                        label: 'GitHub',
                        position: 'right',
                    },
                    {
                        href: 'https://twitter.com/langchain4j',
                        label: 'Twitter',
                        position: 'right',
                    },
                    {
                        href: 'https://discord.com/invite/JzTFvyjG6R',
                        label: 'Discord',
                        position: 'right',
                    },
                ],
            },
            footer: {
                style: 'dark',
                links: [
                    {
                        title: 'Docs',
                        items: [
                            {
                                label: 'Introduction',
                                to: '/intro',
                            },
                            {
                                label: 'Get Started',
                                to: '/get-started',
                            },
                            {
                                label: 'Tutorials',
                                to: '/category/tutorials',
                            },
                            {
                                label: 'Integrations',
                                to: '/category/integrations',
                            },
                            {
                                label: 'Useful Materials',
                                to: '/useful-materials',
                            },
                            {
                                label: 'Examples',
                                href: 'https://github.com/langchain4j/langchain4j-examples',
                            },
                            {
                                label: 'Documentation chatbot (experimental)',
                                href: 'https://chat.langchain4j.dev/',
                            },
                            {
                                label: 'Javadoc',
                                href: 'https://docs.langchain4j.dev/apidocs/index.html',
                            },
                        ],
                    },
                    {
                        title: 'Community',
                        items: [
                            {
                                label: 'GitHub',
                                href: 'https://github.com/langchain4j/langchain4j',
                            },
                            {
                                label: 'Twitter',
                                href: 'https://twitter.com/langchain4j',
                            },
                            {
                                label: 'Discord',
                                href: 'https://discord.com/invite/JzTFvyjG6R',
                            },
                            {
                                label: 'Stack Overflow',
                                href: 'https://stackoverflow.com/questions/tagged/langchain4j',
                            },
                        ],
                    },
                ],
                copyright: `LangChain4j 中文文档 © ${new Date().getFullYear()} · Java LLM 应用开发框架 · Built with Docusaurus.`,
            },
            prism: {
                theme: prismThemes.github,
                darkTheme: prismThemes.dracula,
                additionalLanguages: ['java'],
            },
        }),
    markdown: {
        mermaid: true,
    },
    themes: ['@docusaurus/theme-mermaid'],
    plugins: [require.resolve("docusaurus-lunr-search")]
};

export default config;
