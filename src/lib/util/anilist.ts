import * as Sentry from "@sentry/browser";

var isLogedInCache: boolean | null = null;
var isLogedInCacheTime: number | null = null;
export function isLogedIn() {
    if(typeof window === "undefined") return;
    if(isLogedInCache !== null && Date.now() - isLogedInCacheTime! < 10) return isLogedInCache;
    const token = localStorage.getItem("token");
    const expiration = new Date(localStorage.getItem("expiration")!);

    isLogedInCacheTime = Date.now();
    if(!token) return isLogedInCache = false;
    if(expiration.getTime() < Date.now()) {
        localStorage.removeItem("token");
        localStorage.removeItem("expiration");
        return isLogedInCache = false;
    }
    return isLogedInCache = true;
}

export function getUserID() {
    const token = localStorage.getItem("token")!;
    let data = JSON.parse(atob(token.substring(token.indexOf(".") + 1, token.lastIndexOf("."))));
    Sentry.setUser({ id: data.sub });
    return data.sub;
}

export function makeRequest(query, variables) {
    let auth: any = {};
    if(isLogedIn()) {
        auth.Authorization = "Bearer " + localStorage.getItem("token");
    }
    return fetch("https://graphql.anilist.co", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...auth
        },
        body: JSON.stringify({
            query,
            variables
        })
    }).then(data => data.json());
}

let detailsCache: null | { id: string, data: Promise<any> } = null;
export function getUserDetails() {
    const id = getUserID();
    if(detailsCache && detailsCache.id === id) return detailsCache.data;
    let data = makeRequest(`
    query ($id: Int) {
        User(id: $id) {
          name
          avatar {
            medium
          }
          options {
            titleLanguage
            displayAdultContent
          }
          statistics {
            manga {
              count
              chaptersRead
              volumesRead
            }
          }
        }
    }`, { id });
    detailsCache = { id, data };
    return data;
}

let mangaCache;
export function getUserManga() {
    const id = getUserID();
    if(mangaCache) return mangaCache;
    return mangaCache = makeRequest(`
    query($id: Int) {
    MediaListCollection(userId: $id, type: MANGA) {
      lists {
        name
        isCustomList
        status
        isSplitCompletedList
        entries {
          status
          progress
          progressVolumes
          repeat
          priority
          private
          notes
          score(format: POINT_10_DECIMAL)
          media {
            id
            title {
              romaji
              english
              native
              userPreferred
            }
            status
            chapters
            volumes
            coverImage {
                large
              medium
              color
            }
            isAdult
            isFavourite
          }
        }
      }
    }
  }`, { id });
}