const base = "https://cors-anywhere.danbulant.workers.dev/?https://api.mangadex.org/";

function request(endpoint, query, type = "GET", body) {
    return fetch(base + endpoint + (query ? "?" + query : ""), {
        method: type,
        body: body ? JSON.stringify(body) : undefined
    }).then(resp => resp.json());
}

export default request;