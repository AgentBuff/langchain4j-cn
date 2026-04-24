#!/usr/bin/env node
/**
 * Notify Bing (and Yandex, Naver, Seznam, Yep) via the IndexNow protocol that
 * the site has been updated. Intended to run as a post-build step after Vercel
 * publishes a new deployment, but can also be invoked manually:
 *
 *   node scripts/indexnow.js
 *   node scripts/indexnow.js https://langchain4j.coderbuffer.com/intro
 *
 * Skips silently when run on Vercel preview deployments to avoid polluting
 * the index with preview URLs.
 */

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');

const HOST = 'langchain4j.coderbuffer.com';
const SITE_URL = `https://${HOST}`;
const KEY = process.env.INDEXNOW_KEY || 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;

if (process.env.INDEXNOW_DISABLED === '1') {
    console.log('[indexnow] Skipped (INDEXNOW_DISABLED=1).');
    process.exit(0);
}
// On Vercel, only ping on production deploys to avoid flooding the index with
// preview URLs. On non-Vercel environments (CI, local) the script runs unless
// explicitly disabled.
if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    console.log(`[indexnow] Skipped (VERCEL_ENV=${process.env.VERCEL_ENV}).`);
    process.exit(0);
}

function readSitemapUrls() {
    const sitemapPath = path.join(__dirname, '..', 'build', 'sitemap.xml');
    if (!fs.existsSync(sitemapPath)) {
        console.warn(`[indexnow] sitemap not found at ${sitemapPath}; falling back to homepage only.`);
        return [SITE_URL + '/'];
    }
    const xml = fs.readFileSync(sitemapPath, 'utf8');
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
        .map((m) => m[1].trim())
        .filter((u) => u.startsWith(SITE_URL));
    if (urls.length === 0) {
        console.warn('[indexnow] sitemap parsed but contained no matching URLs.');
        return [SITE_URL + '/'];
    }
    return urls;
}

function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

function submit(urlList) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            host: HOST,
            key: KEY,
            keyLocation: KEY_LOCATION,
            urlList,
        });
        const req = https.request(
            {
                method: 'POST',
                hostname: 'api.indexnow.org',
                path: '/IndexNow',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Length': Buffer.byteLength(payload),
                },
            },
            (res) => {
                let body = '';
                res.on('data', (d) => (body += d));
                res.on('end', () =>
                    resolve({status: res.statusCode, body: body.slice(0, 200)}),
                );
            },
        );
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

(async () => {
    const explicit = process.argv.slice(2).filter(Boolean);
    const urls = explicit.length > 0 ? explicit : readSitemapUrls();
    console.log(`[indexnow] Submitting ${urls.length} URL(s) to IndexNow (host=${HOST}).`);
    // IndexNow accepts up to 10000 URLs per request; chunk for safety.
    for (const batch of chunk(urls, 1000)) {
        try {
            const {status, body} = await submit(batch);
            console.log(`[indexnow] batch=${batch.length} status=${status} ${body}`);
        } catch (err) {
            console.warn(`[indexnow] batch failed: ${err.message}`);
        }
    }
})();
