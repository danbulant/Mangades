
export function isLogedIn() {
    if(typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    const expiration = new Date(localStorage.getItem("expiration"));

    if(!token) return false;
    if(expiration.getTime() < Date.now()) {
        localStorage.removeItem("token");
        localStorage.removeItem("expiration");
        return false;
    }
    return true;
}

export function getUserID() {
    const token = localStorage.getItem("token");
    let data = JSON.parse(atob(token.substring(token.indexOf(".") + 1, token.lastIndexOf("."))));
    return data.sub;
}

export function makeRequest(query, variables) {
    let auth = {};
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

export function getUserDetails() {
    const id = getUserID();
    return makeRequest(`
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
}

export function getUserManga() {
    const id = getUserID();
    return makeRequest(`
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