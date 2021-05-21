<script>
    import { url } from "@roxi/routify/runtime/helpers";
    import { Zip, ZipPassThrough } from "fflate";
    // import * as streamSaver from "streamsaver";

    import request from "../../util/request";

    export var scoped;

    var mangaId = scoped.id;
    $: mangaId = scoped.id;
    var manga = scoped.manga;
    $: manga = scoped.manga;

    async function getMangaChapters(id) {
        const data = await request("manga/" + id + "/feed");
        data.results.sort((a, b) => a.data.attributes.chapter - b.data.attributes.chapter);
        return data;
    }

    var chapters = getMangaChapters(mangaId);
    $: chapters = getMangaChapters(mangaId);

    console.log(manga);
    console.log(chapters);

    var progress = 0;
    var state = "idle";
    var text = "Choose a chapter to view or download";
    var enc = new TextEncoder(); 
    async function prepare(chapter) {
        state = "active";
        text = "Starting download of chapter " + chapter.data.attributes.chapter;

        const { baseUrl } = await request("at-home/server/" + chapter.data.id);
        const quality = "data";

        const URLs = [];
        const hashes = [];
        for(const hash of chapter.data.attributes[quality]) {
            URLs.push(`${baseUrl}/${quality}/${chapter.data.attributes.hash}/${hash}`);
            hashes.push(hash);
        }

        console.log(URLs);
        text = "Found " + URLs.length + " pages";
        const file = streamSaver.createWriteStream(`${manga.title.en} ${chapter.data.attributes.chapter}.epub`, {
            writableStrategy: undefined, // (optional)
            readableStrategy: undefined,  // (optional)
        })
        const writer = file.getWriter();
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
                console.log("Finished generating zip.");
                writer.close();
            }
        };
        
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

            /**
             * @param {string} string
             */
            function format(string) {
                return string.substr(0, string.lastIndexOf(".")).replace(/-/g, "");
            }

        const opf = new ZipPassThrough("OEBPS/content.opf");
        zip.add(opf);
        opf.push(enc.encode(`<?xml version="1.0"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid">

  <metadata xmlns:opf="http://www.idpf.org/2007/opf"  xmlns:dc="http://purl.org/dc/elements/1.1/"
            xmlns:dcterms="http://purl.org/dc/terms/">
    <dc:title>${manga.title.en} ${chapter.data.attributes.chapter}</dc:title>
    <dc:language>en</dc:language>
    <dc:creator>Unknown</dc:creator>
    <dc:identifier id="bookid">https://manga.danbulant.eu/${mangaId}/${chapter.data.id}</dc:identifier>

    <meta property="dcterms:modified">${chapter.data.attributes.updatedAt.toString().split("+")[0]}</meta>
    <meta property="rendition:layout">pre-paginated</meta>
    <meta property="rendition:orientation">portrait</meta>
    <meta property="rendition:spread">landscape</meta>
  </metadata>

  <manifest>
    <item id="fallback" href="fallback.xhtml" media-type="application/xhtml+xml" />
    ${hashes.map(t => `    <item id="${format(t)}" href="${t}" fallback="fallback" media-type="image/${t.substr(t.lastIndexOf(".") + 1) === "jpg" ? "jpeg" : "png"}"/>`).join("\n")}

    <item id="ncxtoc" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  </manifest>

  <spine toc="ncxtoc">
    ${hashes.map((t, i) => `    <itemref idref="${format(t)}" properties="page-spread-${i % 2 ? "right" : "left"}" />`).join("\n")}
  </spine>

</package>`), true);

        const ncx = new ZipPassThrough("OEBPS/toc.ncx");
        zip.add(ncx);
        ncx.push(enc.encode(`<?xml version="1.0" encoding="utf-8" standalone="no"?>
<ncx:ncx xmlns:ncx="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <ncx:head>
    <ncx:meta name="dtb:depth" content="-1"/>
    <ncx:meta name="dtb:totalPageCount" content="0"/>
    <ncx:meta name="dtb:maxPageNumber" content="0"/>
  </ncx:head>
  <ncx:docTitle>
    <ncx:text>${manga.title.en} ${chapter.data.attributes.chapter}</ncx:text>
  </ncx:docTitle>
  <ncx:docAuthor>
    <ncx:text>Unknown</ncx:text>
  </ncx:docAuthor>

  <ncx:navMap>
    <ncx:navPoint id="p01" playOrder="1">
      <ncx:navLabel>
        <ncx:text>${manga.title.en} ${chapter.data.attributes.chapter}</ncx:text>
      </ncx:navLabel>
      <ncx:content src="${hashes[0]}"/>
    </ncx:navPoint>
  </ncx:navMap>
</ncx:ncx>`), true);

        const fallback = new ZipPassThrough("OEBPS/fallback.xhtml");
        zip.add(fallback);
        fallback.push(enc.encode(`<?xml version="1.0" encoding="UTF-8"?>
<?xml-model href="file:/C:/EPub/epub-revision/build/30/schema/epub-nav-30.rnc" type="application/relax-ng-compact-syntax"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head>
    <title>${manga.title.en} ${chapter.data.attributes.chapter}</title>
  </head>
  <body>
    <h2>This book cannot be opened on this device or using this program</h2>
    <p>We're sorry</p>
  </body>
</html>`), true);

        for(var i = 0; i < URLs.length; i++) {
            text = `Saving page ${i + 1} of ${URLs.length}`;
            progress = (i + 1) / URLs.length;
            const url = URLs[i];
            const hash = hashes[i];
            const res = await fetch(url);
            const image = new ZipPassThrough("OEBPS/" + hash);
            zip.add(image);
            image.push(new Uint8Array(await res.arrayBuffer()), true);
        }
        
        zip.end();
        text = "Done!";
        state = "idle";
    }
</script>

<svelte:head>
    <title>Chapters of {manga.title.en}</title>
</svelte:head>

<main>
    <h1>{manga.title.en}</h1>

    <div class="state {state}">
        <div class="progress" style="width: {progress * 100}%;"></div>

        <p>
            {text}
        </p>
    </div>

    <p>
        <b>
            Do not close the tab when a download is in progress.
        </b>
    </p>

    {#await chapters}
        Loading chapters...
    {:then chapters}
        <ol class="hide-nums">
           {#each chapters.results.filter(c => c.data.attributes.translatedLanguage === "en") as chapter} 
                <li on:click={() => prepare(chapter)}>
                    {chapter.data.attributes.volume ? "Vol " + chapter.data.attributes.volume : ""}
                    Chapter {chapter.data.attributes.chapter}
                    {chapter.data.attributes.title}
                    - Download - <a href={$url("./" + chapter.data.id)} on:click|stopPropagation>View</a>
                </li>
           {/each}
        </ol>
    {/await}
</main>

<style>
    .hide-nums {
        list-style-type: disc;
    }

    .state {
        border-radius: 10px;
        border-width: 4px;
        border-style: solid;
        padding: 10px;
        position: relative;
        transition: all .3s;
    }

    .state.idle {
        background: rgb(140, 209, 255);
        border-color: rgb(77, 184, 255);
    }

    .state.active {
        background: rgb(255, 255, 81);
        border-color: yellow;
    }
    .state.error {
        background: rgb(255, 103, 103);
        border-color: rgb(255, 59, 59);
    }

    .state p {
        margin: 0;
        z-index: 1;
        position: relative;
    }

    .progress {
        z-index: 0;
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        border-top-left-radius: 10px;
        border-bottom-left-radius: 10px;
    }
    .state.active .progress {
        background: rgb(140, 209, 255);
    }
</style>