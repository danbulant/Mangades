

/** @type {import('./$types').PageLoad} */
export function load({ url }) {
    return { url: url.pathname };
}