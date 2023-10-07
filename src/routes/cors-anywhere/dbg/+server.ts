import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    console.log("[CORS-DBG] " + url.searchParams.get('url'));
    const ret = await fetch(url.searchParams.get('url'), {
        headers: {
            "User-agent": "manga.danbulant.eu (discord @techmandancz)"
        }
    });
    let text = await ret.text();
    let data = text;
    try {
        data = JSON.parse(text);
    } catch (e) {}

    return json({
        headers: Object.fromEntries(ret.headers.entries()),
        url: ret.url,
        original: url.searchParams.get('url'),
        code: ret.status,
        text: ret.statusText,
        type: ret.type,
        body: data,
    });
}