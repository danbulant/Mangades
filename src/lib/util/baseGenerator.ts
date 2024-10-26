import request, { proxy, imageproxy } from "./request";

const RETRY_LIMIT = 10;

interface Chapter {
    id: string,
    number: string,
    volume?: string,
    links?: string[],
    hash?: string,
    hashes?: string[],
    // baseUrl?: string,
    title: string
}

interface Opts {
    coverUrl?: string
    quality?: string,
    file: WritableStream,
    title: string,
    id: string,
    language: string,
    author: string,
    updatedAt: string | Date,
    chapters: Chapter[],
    callback?: (chapter: string | number, link: number, finished: boolean) => void,
    onerror?: (error: Error) => void
}

let cache = new Map

/**
 * @param {string | Chapter | any} chapter 
 * @returns {Promise<{ urls: string[], hashes: string[], hash: string[] }>}
 */
export function getURLs(chapter: string | Chapter): Promise<{ urls: string[], hashes: string[], hash: string }> {
    if(typeof chapter === "object") chapter = chapter.id;
    const quality = "data";
    if (!cache.has(chapter))
        cache.set(chapter, (async() => {
            console.log(chapter)
            const data = await request("at-home/server/" + chapter);
            console.log(data)
            let obj = {
                urls: data.chapter[quality].map(t => `${data.baseUrl}/${quality}/${data.chapter.hash}/${t}`),
                hashes: data.chapter[quality],
                hash: data.chapter.hash
            }
            return obj;
        })())
    return cache.get(chapter);
}

/**
 * Base generator, to be extended
 */
export class BaseGenerator {
    opts: Opts;
    constructor(opts: Opts) {
        this.opts = opts;
        this.opts.quality = "data";
    }

    async generate() {}

    /**
     * @param {string | Chapter | any} chapter 
     * @returns {Promise<{ urls: string[], hashes: string[], hash: string[] }>}
     */
    async getURLs(chapter: string | Chapter): Promise<{ urls: string[], hashes: string[], hash: string }> {
        return getURLs(chapter);
    }

    /**
     * @param {string} url 
     * @param {Chapter} chapter
     * @returns {Promise<Response>}
     */
    async fetchImage(url: string, chapter: Chapter): Promise<Response> {
        var res;
        try {
            res = await fetch(imageproxy + url);
        } catch(e) {
            console.error(e);
            res = await fetch(proxy + url);
        }
        if(Math.floor(res.status / 100) !== 2) {
            for(var i = 0; i < RETRY_LIMIT; i++) {
                let baseUrl = await this.getURLs(chapter);
                res = await fetch(baseUrl + "/" + url);
                if(Math.floor(res.status / 100) === 2) return res;
            }
            throw new Error("Retry limit reached");
        }
        return res;
    }

    /**
     * @param {number} chapter 
     * @param {number} link 
     * @param {boolean} finished 
     */
    callback(chapter: string | number = -1, link: number = -1, finished = false) {
        if(this.opts.callback) {
            this.opts.callback(chapter, Number(link), finished);
        }
    }
}