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
    // return console.log("Should report", body);
    if(body.url.includes("uploads.mangadex.org")) return;
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