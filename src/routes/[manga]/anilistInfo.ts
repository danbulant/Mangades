import { makeRequest } from "$lib/util/anilist";

interface AnilistInfo {
    Media: Media;
}

interface Media {
    id: number;
    title: Title;
    type: "MANGA";
    format: "MANGA";
    status: "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED";
    chapters: number | null;
    volumes: number | null;
    countryOfOrigin: string;
    bannerImage: string;
    genres: string[];
    synonyms: string[];
    averageScore: number | null;
    popularity: number;
    isFavourite: boolean;
    isFavouriteBlocked: boolean;
    isAdult: boolean;
    siteUrl: string;
    coverImage: CoverImage;
    description: string;
    characters: {
        edges: {
            id: number;
            role: "MAIN" | "SUPPORTING" | "BACKGROUND";
            node: Character;
        }[]
    };
    tags: {
        id: number;
        name: string;
        description: string;
        isMediaSpoiler: boolean;
        isAdult: boolean;
    }[];
    relations: {
        edges: {
            id: number;
            relationType: "ADAPTATION" | "PREQUEL" | "SEQUEL" | "PARENT" | "SIDE_STORY" | "CHARACTER" | "SUMMARY" | "ALTERNATIVE" | "SPIN_OFF" | "OTHER" | "SOURCE" | "COMPILATION" | "CONTAINS";
            node: {
                type: "ANIME" | "MANGA";
                mediaListEntry: MediaListEntry | null;
                description: string;
                coverImage: CoverImage;
                title: Title
            }
        }[]
    };
    mediaListEntry: MediaListEntry | null;
    recommendations: {
        edges: {
            node: {
                id: number;
                rating: number;
                mediaRecommendation: {
                    title: Title;
                    mediaListEntry: MediaListEntry | null;
                    description: string;
                    coverImage: CoverImage
                }
            }
        }[]
    };
}

interface Title {
    romaji: string;
    english: string;
    native: string;
    userPreferred: string;
}

interface MediaListEntry {
    progress: number | null;
    progressVolumes: number | null;
    repeat: number | null;
    priority: number | null;
    private: boolean;
    notes?: string;
    score: number | null;
    customLists: string[];
}

interface Character {
    name: {
        first: string;
        middle: string;
        last: string;
        full: string;
        native: string;
        userPreferred: string;
    };
    image: {
        large: string;
        medium: string;
    };
    description: string;
    gender: "Male" | "Female" | null;
    age: number | null;
    dateOfBirth: {
        year: number | null;
        month: number | null;
        day: number | null;
    };
    favourites: number;
    bloodType: "A" | "B" | "O" | "AB" | "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-" | null;
}

interface CoverImage {
    extraLarge: string;
    large: string;
    medium: string;
    color: string;
}

const anilistCache = new Map();
export function anilistInfo(id): Promise<AnilistInfo> {
    if(!anilistCache.has(id))
        anilistCache.set(id, makeRequest(`
        query($id: Int) {
          Media(id: $id, format: MANGA) {
            id
            title {
              romaji
              english
              native
              userPreferred
            }
            type
            format
            status
            chapters
            volumes
            countryOfOrigin
            bannerImage
            genres
            synonyms
            averageScore
            popularity
            isFavourite
            isFavouriteBlocked
            isAdult
            siteUrl
            coverImage {
                extraLarge
                large
                medium
                color
            }
            characters {
              edges {
                id
                role
                node {
                  name {
                    first
                    middle
                    last
                    full
                    native
                    userPreferred
                  }
                  description
                  gender
                  age
                  dateOfBirth {
                    year
                    month
                    day
                  }
                  favourites
                  bloodType
                  image {
                    large
                    medium
                  }
                }
              }
            }
            tags {
              id
              name
              description
              isMediaSpoiler
              isAdult
            }
            relations {
              edges {
                id
                relationType
                node {
                  type
                  title {
                    romaji
                    english
                    native
                    userPreferred
                  }
                    mediaListEntry {
                        userId
                        status
                        score
                        progress
                        progressVolumes
                        repeat
                        priority
                        private
                        notes
                    }
                  coverImage {
                    extraLarge
                    large
                    medium
                    color
                  }
                }
              }
            }
            mediaListEntry {
              userId
              status
              score
              progress
              progressVolumes
              repeat
              priority
              private
              notes
            }
            recommendations {
              edges {
                node {
                  id
                  rating
                  mediaRecommendation {
                    title {
                      romaji
                      english
                      native
                      userPreferred
                    }
                    description
                    mediaListEntry {
                        userId
                        status
                        score
                        progress
                        progressVolumes
                        repeat
                        priority
                        private
                        notes
                    }
                    coverImage {
                      extraLarge
                      large
                      medium
                      color
                    }
                  }
                }
              }
            }
            
          }
        }`, { id }).then(t => t.data.Media));
    anilistCache.get(id).then(t => console.log("anilist", t));
    return anilistCache.get(id);
}