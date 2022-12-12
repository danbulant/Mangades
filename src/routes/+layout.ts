/** @type {import('./$types').PageLoad} */
export function load({ url, event }) {
    return {
        url: url.pathname
    };
}