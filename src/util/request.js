export const proxy = "https://cors-anywhere.danbulant.workers.dev/?"; // "https://cors-anywhere.danbulant.cloud/";
export const imageproxy = "https://cors-anywhere.danbulant.workers.dev/?";
export const base = proxy + "https://api.mangadex.org/";

function request(endpoint, query, type = "GET", body) {
    return fetch(base + endpoint + ((query ? "?" + query.toString() : "")), {
        method: type,
        body: body ? JSON.stringify(body) : undefined
    }).then(resp => resp.json());
}

export default request;
