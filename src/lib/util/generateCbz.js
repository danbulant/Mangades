import { Zip, ZipPassThrough } from "fflate";
import { BaseGenerator } from "./baseGenerator";
import report from "./report";

export class CBZGenerator extends BaseGenerator {
    async generate() {
        this.writer = this.opts.file.getWriter();
        this.zip = new Zip();

        this.zip.ondata = (error, data, final) => {
            if(error) {
                console.error(error);
                if(this.opts.onerror) this.opts.onerror(error);
            }
            if(data) {
                this.writer.write(data);
            }
            if(final) {
                this.writer.close();
            }
        };

        this.hashes = this.opts.chapters.map(t => t.links).flat();
        const chapterCountLength = this.opts.chapters.reduce((a, b) => Math.max(a.number, b.number), 0).toString().length;
        for(const chapterI in this.opts.chapters) {
            const chapter = this.opts.chapters[chapterI];
            if(!chapter.links) {
                let data = await this.getURLs(chapter);
                chapter.links = data.urls;
                chapter.hashes = data.hashes;
                chapter.hash = data.hash;
            }
            if(typeof chapter.number == "undefined" || chapter.number == null) {
                chapter.number = chapterI;
            }
            const imageCountLength = chapter.links.length.toString().length;
            for(const i in chapter.links) {
                let url = chapter.links[i];
                let hash = chapter.hashes[i];
                this.callback(chapterI, i, false);
                const start = performance.now();
                const res = await this.fetchImage(url, chapter);
                const chapterText = chapter.number.toString().padStart(chapterCountLength, "0");
                const image = new ZipPassThrough(`${this.opts.title} ${chapter.volume ? "vol " + chapter.volume.toString().padStart(3, "00") + " " : ""} ch ${chapterText}${chapter.title ? " " + chapter.title : ""}/${this.opts.title} ${chapterText} page ${i.toString().padStart(imageCountLength, "0")}.${hash.substr(hash.lastIndexOf(".") + 1)}`);
                this.zip.add(image);
                const data = new Uint8Array(await res.arrayBuffer());
                const end = performance.now() - start;
                report({
                    bytes: data.byteLength,
                    cached: res.headers.get("X-Cache") === "HIT",
                    duration: end,
                    success: Math.floor(res.status / 100) === 2,
                    url
                });
                image.push(data, true);
                this.callback(chapterI, i, true);
            }
        }
        this.zip.end();
    }
}