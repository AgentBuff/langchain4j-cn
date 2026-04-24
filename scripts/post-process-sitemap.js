#!/usr/bin/env node
/**
 * Post-process the sitemap.xml Docusaurus emits to give SEO-critical URLs
 * a higher priority and slightly different changefreq. The classic plugin
 * only supports one global priority/changefreq, so we patch the file after
 * build.
 *
 * Safe to re-run; purely string substitutions on <priority> / <changefreq>
 * within matched <url> blocks.
 */

const fs = require('node:fs');
const path = require('node:path');

const SITEMAP = path.join(__dirname, '..', 'build', 'sitemap.xml');
if (!fs.existsSync(SITEMAP)) {
    console.log('[sitemap] sitemap.xml not found; skipping.');
    process.exit(0);
}

const HOST = 'https://langchain4j.coderbuffer.com';

const RULES = [
    {match: [HOST + '/', HOST], priority: '1.0', changefreq: 'daily'},
    {match: [HOST + '/intro'], priority: '0.9', changefreq: 'weekly'},
    {match: [HOST + '/get-started'], priority: '0.9', changefreq: 'weekly'},
    {match: [HOST + '/faq'], priority: '0.9', changefreq: 'weekly'},
    {match: [HOST + '/tutorials/rag'], priority: '0.9', changefreq: 'weekly'},
    {match: [HOST + '/tutorials/agents'], priority: '0.9', changefreq: 'weekly'},
    {match: [HOST + '/tutorials/ai-services'], priority: '0.9', changefreq: 'weekly'},
    {match: [HOST + '/tutorials/tools'], priority: '0.9', changefreq: 'weekly'},
    {match: [HOST + '/tutorials/mcp'], priority: '0.9', changefreq: 'weekly'},
    {match: [HOST + '/tutorials/spring-boot-integration'], priority: '0.9', changefreq: 'weekly'},
    {match: [HOST + '/tutorials/quarkus-integration'], priority: '0.8', changefreq: 'weekly'},
    {match: [HOST + '/tutorials/chat-memory'], priority: '0.8', changefreq: 'weekly'},
    {match: [HOST + '/useful-materials'], priority: '0.7', changefreq: 'weekly'},
    {match: [/\/markdown-page$/], priority: '0.1', changefreq: 'yearly', noindex: true},
];

let xml = fs.readFileSync(SITEMAP, 'utf8');
// Ensure <url>...</url> blocks are parseable line-by-line.
xml = xml.replace(/<url>/g, '\n<url>').replace(/<\/url>/g, '</url>\n');

const urlRegex = /<url>[\s\S]*?<\/url>/g;
let touched = 0;
let dropped = 0;
xml = xml.replace(urlRegex, (block) => {
    const locMatch = block.match(/<loc>([^<]+)<\/loc>/);
    if (!locMatch) return block;
    const loc = locMatch[1].trim();
    for (const rule of RULES) {
        const hit = rule.match.some((m) =>
            typeof m === 'string' ? m === loc : m.test(loc),
        );
        if (!hit) continue;
        if (rule.noindex) {
            dropped++;
            return '';
        }
        touched++;
        let next = block;
        if (/<priority>/.test(next)) {
            next = next.replace(/<priority>[^<]+<\/priority>/, `<priority>${rule.priority}</priority>`);
        } else {
            next = next.replace('</url>', `<priority>${rule.priority}</priority></url>`);
        }
        if (/<changefreq>/.test(next)) {
            next = next.replace(/<changefreq>[^<]+<\/changefreq>/, `<changefreq>${rule.changefreq}</changefreq>`);
        } else {
            next = next.replace('</url>', `<changefreq>${rule.changefreq}</changefreq></url>`);
        }
        return next;
    }
    return block;
});

xml = xml.replace(/\n+/g, '').replace(/>\s+</g, '><');
fs.writeFileSync(SITEMAP, xml);
console.log(`[sitemap] Rewrote ${touched} URL(s), dropped ${dropped}.`);
