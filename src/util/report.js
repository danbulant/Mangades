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
    return;
    await fetch(base + "report", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "omit",
        body: body ? JSON.stringify(body) : undefined
    });
}

export default report;