export const proxy = "/cors-anywhere?url="; //"https://cors-anywhere.danbulant.cloud/";
export const imageproxy = proxy; // "https://cors-anywhere.danbulant.workers.dev/?";
export const base = proxy + encodeURIComponent("https://api.mangadex.org/");
export const baseServer = "https://api.mangadex.org/";

export function getURL(endpoint, query) {
    if(typeof window === "undefined") return baseServer + endpoint + ((query ? "?" + query.toString() : ""));
    return base + encodeURIComponent(endpoint + ((query ? "?" + query.toString() : "")));
}

function request(endpoint, query, type = "GET", body) {
    return fetch(getURL(endpoint, query), {
        method: type,
        headers: typeof window === "undefined" ? {
            "User-agent": "manga.danbulant.eu (discord @techmandancz)"
        } : undefined,
        body: body ? JSON.stringify(body) : undefined
    }).then(resp => resp.json());
}

export function coverUrl(mangaId, item) {
    return `${imageproxy}https://uploads.mangadex.org/covers/${mangaId}/${item.attributes.fileName}.512.jpg`
}

export default request;