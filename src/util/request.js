export const proxy = "https://cors-anywhere.danbulant.workers.dev/?";
export const base = proxy + "https://api.mangadex.org/";

function request(endpoint, query, type = "GET", body) {
    return fetch(base + endpoint + encodeURIComponent(encodeURIComponent(query ? "?" + query.toString() : "")), {
        method: type,
        body: body ? JSON.stringify(body) : undefined
    }).then(resp => resp.json());
}

export default request;