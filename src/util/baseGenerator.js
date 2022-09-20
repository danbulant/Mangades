
/**
 * @typedef Chapter
 * @property {string} id
 * @property {number} number
 * @property {number?} volume
 * @property {string[]} links
 * @property {string} hash
 * @property {string} baseUrl
 * @property {string} title
 */

import request, { proxy, imageproxy } from "./request";

const RETRY_LIMIT = 10;

/**
 * Base generator, to be extended
 */
export class BaseGenerator {
    /**
     * 
     * @param {object} opts
     * @param {string} opts.quality
     * @param {WritableStream} opts.file
     * @param {string} opts.title
     * @param {string} opts.id
     * @param {string} opts.language
     * @param {string} opts.author
     * @param {string|Date} opts.updatedAt
     * @param {Chapter[]} opts.chapters
     * @param {(chapter: number, link: number, finished: boolean) => void} [opts.callback]
     * @param {(error: Error) => void} [opts.onerror]
     */
    constructor(opts) {
        this.opts = opts;
        this.opts.quality = "data";
    }

    async generate() {}

    /**
     * @param {string | Chapter | any} chapter 
     * @returns {Promise<{ urls: string[], hashes: string[], hash: string[] }>}
     */
    async getURLs(chapter) {
        if(typeof chapter === "object") chapter = chapter.id;
        const data = await request("at-home/server/" + chapter);
        console.log(data, this.opts);
        return {
            urls: data.chapter[this.opts.quality].map(t => `${data.baseUrl}/${this.opts.quality}/${data.chapter.hash}/${t}`),
            hashes: data.chapter[this.opts.quality],
            hash: data.chapter.hash
        }
    }

    /**
     * @param {string} url 
     * @param {Chapter} chapter
     * @returns {Promise<Response>}
     */
    async fetchImage(url, chapter) {
        var res;
        try {
            res = await fetch(imageproxy + url);
        } catch(e) {
            console.error(e);
            res = await fetch(proxy + url);
        }
        if(Math.floor(res.status / 100) !== 2) {
            for(var i = 0; i < RETRY_LIMIT; i++) {
                chapter.baseUrl = await this.getURLs(chapter);
                res = await fetch(chapter.baseUrl + "/" + url);
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
    callback(chapter = -1, link = -1, finished = false) {
        if(this.opts.callback) {
            this.opts.callback(chapter, parseInt(link), finished);
        }
    }
}