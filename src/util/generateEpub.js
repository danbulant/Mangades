import { Zip, ZipPassThrough } from "fflate";

const enc = new TextEncoder();

/**
 * @param {object} opts
 * @param {string[]} opts.links 
 * @param {WritableStream} opts.file
 * @param {number} opts.chapter
 * @param {string|Date} opts.updatedAt
 */
export async function prepareEpub(opts) {
    const writer = opts.file.getWriter();
    const zip = new Zip();
    zip.ondata = (error, data, final) => {
        if(error) {
            console.error(error);
            text = "Error: " + error.message;
            state = "error";
        }
        if(data) {
            writer.write(data);
        }
        if(final) {
            writer.close();
        }
    };

    const hashes = opts.links;
    
    const mimetype = new ZipPassThrough("mimetype");
    zip.add(mimetype);
    mimetype.push(enc.encode("application/epub+zip"), true);

    const container = new ZipPassThrough("META-INF/container.xml");
    zip.add(container);
    container.push(enc.encode(`<?xml version="1.0" encoding="UTF-8" ?>
    <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
    </container>`), true);

    const opf = new ZipPassThrough("OEBPS/content.opf");
    zip.add(opf);
    opf.push(enc.encode(`<?xml version="1.0"?>
    <package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid">

    <metadata xmlns:opf="http://www.idpf.org/2007/opf"  xmlns:dc="http://purl.org/dc/elements/1.1/"
            xmlns:dcterms="http://purl.org/dc/terms/">
    <dc:title>${opts.title}</dc:title>
    <dc:language>en</dc:language>
    <dc:creator>Unknown</dc:creator>
    <dc:identifier id="bookid"></dc:identifier>
    <dc:type>Image</dc:type>

    <meta property="dcterms:modified">${opts.updatedAt.toString().split("+")[0]}Z</meta>
    <meta property="rendition:layout">pre-paginated</meta>
    <meta property="rendition:orientation">portrait</meta>
    <meta property="rendition:spread">landscape</meta>
    </metadata>

    <manifest>
    <item id="fallback" href="fallback.xhtml" media-type="application/xhtml+xml" />
    ${hashes.map((t, i) => `    <item id="i${i}" href="${t}" fallback="fallback" media-type="image/${t.substr(t.lastIndexOf(".") + 1) === "jpg" ? "jpeg" : "png"}"/>`).join("\n")}
    ${hashes.map((t, i) => `    <item id="p${i}" href="${i}.xhtml"  media-type="application/xhtml+xml" />`).join("\n")}

    <item id="ncxtoc" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    </manifest>

    <spine toc="ncxtoc">
    ${hashes.map((t, i) => `    <itemref idref="p${i}" linear="yes" />`).join("\n")}
    <itemref idref="fallback" linear="no" />
    </spine>

    </package>`), true);

    const ncx = new ZipPassThrough("OEBPS/toc.ncx");
    zip.add(ncx);
    ncx.push(enc.encode(`<?xml version="1.0" encoding="utf-8"?>
    <!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
    <ncx xmlns:ncx="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
    </head>
    <docTitle>
    <text>${opts.title}</text>
    </docTitle>
    <docAuthor>
    <text>Unknown</text>
    </docAuthor>

    <navMap>
    ${hashes.map((t, i) => `
        <navPoint id="p${i}" playOrder="${i + 1}">
            <navLabel>
                <text>${opts.title} ${i}</text>
            </navLabel>
            <content src="${i}.xhtml"/>
        </navPoint>
    `).join("\n")}
    </navMap>
    </ncx>`), true);

    const fallback = new ZipPassThrough("OEBPS/fallback.xhtml");
    zip.add(fallback);
    fallback.push(enc.encode(`<?xml version="1.0" encoding="UTF-8"?>
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
    <head>
    <title>${opts.title}</title>
    </head>
    <body>
    <h2>This book cannot be opened on this device or using this program</h2>
    <p>We're sorry</p>

    <nav epub:type="toc">
        <h1>Chapter list</h1>
        <ol>
            <li>
                <a href="p0.xhtml">Chapter ${opts.chapter}</a>
            </li>
        </ol>
    </nav>
    </body>
    </html>`), true);

    return zip;
}