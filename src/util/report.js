export const base = "https://api.mangadex.network/";

/**
 * reports method
 * @param {object} body 
 * @param {string} body.url
 * @param {boolean} body.success
 * @param {number} body.bytes
 * @param {number} body.duration
 * @param {boolean} body.cached
 */
async function report(body) {
    body.duration = parseInt(body.duration);
    const resp = await fetch(base + "report", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "omit",
        mode: "no-cors",
        body: body ? JSON.stringify(body) : undefined
    });
    return await resp.json();
}

export default report;