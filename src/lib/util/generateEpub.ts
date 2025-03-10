import { Zip, ZipPassThrough } from "fflate";
import { BaseGenerator } from "./baseGenerator";
import report from "./report";

const enc = new TextEncoder();

/**
 * Handles epub generation
 */
export class EpubGenerator extends BaseGenerator {
    writer: WritableStreamDefaultWriter<Uint8Array>;
    zip: Zip;
    hashes: { hash: string, chapter: string }[];

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

        this.hashes = [];

        for(const chapterI in this.opts.chapters) {
            const chapter = this.opts.chapters[chapterI];
            if(!chapter.links) {
                let data = await this.getURLs(chapter);
                chapter.links = data.urls;
                chapter.hashes = data.hashes;
                chapter.hash = data.hash;
                this.hashes.push(...(chapter.hashes.map(t => ({ hash: t, chapter: chapterI }))));
            }
        }


        this.mimetype();
        this.container();
        this.package();
        this.toc();
        
        this.callback(); // signals the template is ready

        if(this.opts.coverUrl) {
            const res = await fetch(this.opts.coverUrl);
            const cover = new ZipPassThrough("OEBPS/cover." + this.opts.coverUrl.substr(this.opts.coverUrl.lastIndexOf(".") + 1));
            this.zip.add(cover);
            const data = new Uint8Array(await res.arrayBuffer());
            cover.push(data, true);
            const textContent = new ZipPassThrough("OEBPS/cover.xhtml");
            this.zip.add(textContent);
            textContent.push(enc.encode(`<?xml version="1.0" encoding="UTF-8"?>
            <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
            <head>
                <title>Cover</title>
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
                <meta name="EPB-UUID" content=""/>
            </head>
            <body>
                <img style="margin:auto;height:100%;" src="cover.${this.opts.coverUrl.substr(this.opts.coverUrl.lastIndexOf(".") + 1)}" />
            </body>
            </html>`), true);
        }

        for(const chapterI in this.opts.chapters) {
            const chapter = this.opts.chapters[chapterI];
            if(chapter.number == null || chapter.number == undefined) chapter.number = chapterI;
            for(const i in chapter.links) {
                let url = chapter.links[i];
                let hash = chapter.hashes[i];
                this.callback(chapterI, Number(i), false);
                const start = performance.now();
                const res = await this.fetchImage(url, chapter);
                const image = new ZipPassThrough("OEBPS/" + hash);
                this.zip.add(image);
                const data = new Uint8Array(await res.arrayBuffer());
                const end = performance.now() - start;
                report({
                    bytes: data.byteLength,
                    cached: res.headers.get("X-Cache") === "HIT",
                    duration: end,
                    success: Math.floor(res.status / 100) === 2,
                    url: url
                });
                image.push(data, true);
                let fileI = this.hashes.findIndex(t => t.hash === hash);
                const textContent = new ZipPassThrough(`OEBPS/${fileI}.xhtml`);
                this.zip.add(textContent);
                textContent.push(enc.encode(`<?xml version="1.0" encoding="UTF-8"?>
                <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
                <head>
                    <title>Chapter ${chapterI} Page ${Number(i) + 1}</title>
                    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
                    <meta name="EPB-UUID" content=""/>
                </head>
                <body>
                    <img style="margin:auto;height:100%;" src="${hash}" />
                </body>
                </html>`), true);
                this.callback(chapterI, Number(i), true);
            }
        }

        this.zip.end();
        this.callback(-1, -1, true);
    }

    mimetype() {    
        const mimetype = new ZipPassThrough("mimetype");
        this.zip.add(mimetype);
        mimetype.push(enc.encode("application/epub+zip"), true);
    }

    container() {
        const container = new ZipPassThrough("META-INF/container.xml");
        this.zip.add(container);
        container.push(enc.encode(`<?xml version="1.0" encoding="UTF-8" ?>
        <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
        <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
        </rootfiles>
        </container>`), true);
    }

    package() {
        const opf = new ZipPassThrough("OEBPS/content.opf");
        this.zip.add(opf);
        opf.push(enc.encode(`<?xml version="1.0"?>
        <package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid">

        <metadata xmlns:opf="http://www.idpf.org/2007/opf"  xmlns:dc="http://purl.org/dc/elements/1.1/"
                xmlns:dcterms="http://purl.org/dc/terms/">
            <dc:title>${this.opts.title}</dc:title>
            <dc:language>${this.opts.language || "en"}</dc:language>
            <dc:creator>${this.opts.author}</dc:creator>
            <dc:identifier id="bookid">${this.opts.id}</dc:identifier>
            <dc:type>Image</dc:type>

            <meta property="dcterms:modified">${this.opts.updatedAt.toString().split("+")[0]}Z</meta>
            <meta property="rendition:layout">pre-paginated</meta>
            <meta property="rendition:orientation">portrait</meta>
            <meta property="rendition:spread">landscape</meta>
        </metadata>

        <manifest>
        ${this.opts.coverUrl ? `<item id="icover" href="cover.${this.opts.coverUrl.substr(this.opts.coverUrl.lastIndexOf(".") + 1)}" media-type="image/${this.opts.coverUrl.substr(this.opts.coverUrl.lastIndexOf(".") + 1) === "jpg" ? "jpeg" : this.opts.coverUrl.substr(this.opts.coverUrl.lastIndexOf(".") + 1)}"/>` : ""}
        ${this.opts.coverUrl ? `<item id="pcover" href="cover.xhtml" media-type="application/xhtml+xml" />` : ""}
        ${this.hashes.map((t, i) => `    <item id="i${i}" href="${t.hash}" fallback="fallback" media-type="image/${t.hash.substr(t.hash.lastIndexOf(".") + 1) === "jpg" ? "jpeg" : t.hash.substr(t.hash.lastIndexOf(".") + 1)}"/>`).join("\n")}
        ${this.hashes.map((t, i) => `    <item id="p${i}" href="${i}.xhtml"  media-type="application/xhtml+xml" />`).join("\n")}

            <item id="ncxtoc" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        </manifest>

        <spine toc="ncxtoc">
        ${this.opts.coverUrl ? `<itemref idref="pcover" linear="yes" />` : ""}
        ${this.hashes.map((t, i) => `    <itemref idref="p${i}" linear="yes" />`).join("\n")}
            <itemref idref="fallback" linear="no" />
        </spine>

        </package>`), true);
    }

    toc() {
        const ncx = new ZipPassThrough("OEBPS/toc.ncx");

        this.zip.add(ncx);
        ncx.push(enc.encode(`<?xml version="1.0" encoding="utf-8"?>
        <!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
        <ncx xmlns:ncx="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
        <head>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
        </head>
        <docTitle>
        <text>${this.opts.title}</text>
        </docTitle>
        <docAuthor>
        <text>${this.opts.author}</text>
        </docAuthor>

        <navMap>
        ${this.opts.coverUrl ? `<navPoint id="cover" playOrder="0">
            <navLabel>
                <text>Cover</text>
            </navLabel>
            <content src="cover.xhtml"/>
        </navPoint>` : ""}
        ${this.opts.chapters.map((t, i) => `
            <navPoint id="p${this.hashes.findIndex(h => h.hash === t.hashes[0])}" playOrder="${i + 1}">
                <navLabel>
                    <text>${this.opts.title} Chapter ${t.number}</text>
                </navLabel>
                <content src="${this.hashes.findIndex(h => h.hash === t.hashes[0])}.xhtml"/>
            </navPoint>
        `).flat().join("\n")}
        </navMap>
        </ncx>`), true);
    }
}