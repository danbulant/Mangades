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
            const baseUrl = await this.getBaseURL(chapter.id);
            const imageCountLength = chapter.links.length.toString().length;
            for(const i in chapter.links) {
                this.callback(chapterI, i, false);
                const hash = chapter.links[i];
                const URL = `${baseUrl}/${this.opts.quality}/${chapter.hash}/${hash}`;
                const start = performance.now();
                const res = await this.fetchImage(URL);
                const chapterText = chapter.number.toString().padStart(chapterCountLength, "0");
                const image = new ZipPassThrough(`${this.opts.title} ${chapterText}/${chapterText} page ${i.toString().padStart(imageCountLength, "0")}.${hash.substr(hash.lastIndexOf(".") + 1)}`);
                this.zip.add(image);
                const data = new Uint8Array(await res.arrayBuffer());
                const end = performance.now() - start;
                report({
                    bytes: data.byteLength,
                    cached: res.headers.get("X-Cache") === "HIT",
                    duration: end,
                    success: Math.floor(res.status / 100) === 2,
                    url: URL
                });
                image.push(data, true);
                this.callback(chapterI, i, true);
            }
        }
        this.zip.end();
    }
}