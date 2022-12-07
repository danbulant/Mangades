
/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    console.log("[CORS] " + url.searchParams.get('url'));
    const ret = await fetch(url.searchParams.get('url'));
    return new Response(await ret.arrayBuffer(), {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept, X-Requested-With',
            'Access-Control-Max-Age': '86400',

            'Content-Type': ret.headers.get('Content-Type')!,

            'Cache-Control': 'public, max-age=172800', // 2 days
            'Expires': new Date(Date.now() + 172800000).toUTCString()
        },
    });
}