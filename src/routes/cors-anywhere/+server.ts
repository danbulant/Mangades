
/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    console.log("[CORS] " + url.searchParams.get('url'));
    const ret = await fetch(url.searchParams.get('url'));
    return new Response(await ret.arrayBuffer(), {
        headers: {
            ...ret.headers,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept, X-Requested-With, sentry-trace, baggage',
            'Access-Control-Max-Age': '86400',

            'Content-Type': ret.headers.get('Content-Type')!,

            'Cache-Control': 'public, max-age=172800, immutable, stale-while-revalidate=345600, state-if-error=604800',
            'Expires': new Date(Date.now() + 172800000).toUTCString()
        },
    });
}