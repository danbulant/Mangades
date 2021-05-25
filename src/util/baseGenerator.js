
/**
 * @typedef Chapter
 * @property {string} id
 * @property {number} number
 * @property {number?} volume
 * @property {string[]} links
 * @property {string} hash
 */

import request, { proxy } from "./request";

/**
 * Base generator, to be extended
 */
export class BaseGenerator {
    /**
     * 
     * @param {object} opts
     * @param {string} opts.baseUrl
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
    }

    async generate() {}

    /**
     * @param {string | Chapter | any} chapter 
     * @returns {Promise<string>}
     */
    async getBaseURL(chapter) {
        if(typeof chapter === "object") chapter = chapter.data.id;
        const { baseUrl } = await request("at-home/server/" + chapter);
        return baseUrl;
    }

    /**
     * @param {string} url 
     * @returns {Promise<Response>}
     */
    async fetchImage(url) {
        var res;
        try {
            res = await fetch(url);
        } catch(e) {
            console.error(e);
            res = await fetch(proxy + url);
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
            this.opts.callback(chapter, link, finished);
        }
    }
}