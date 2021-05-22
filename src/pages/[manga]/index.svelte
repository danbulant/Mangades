<script>
    import { url } from "@roxi/routify/runtime/helpers";
    import { Zip, ZipPassThrough } from "fflate";
    import { prepareEpub } from "../../util/generateEpub";
    // import * as streamSaver from "streamsaver";

    import request from "../../util/request";

    export var scoped;

    var mangaId = scoped.id;
    $: mangaId = scoped.id;
    var manga = scoped.manga;
    $: manga = scoped.manga;

    async function getMangaChapters(id) {
        const data = await request("manga/" + id + "/feed?translatedLanguage[]=en");
        data.results.sort((a, b) => a.data.attributes.chapter - b.data.attributes.chapter);
        return data;
    }

    var chapters = getMangaChapters(mangaId);
    $: chapters = getMangaChapters(mangaId);

    console.log(manga);
    console.log(chapters);

    var progress = 0;
    var state = "idle";
    var text = "Choose a chapter to view online or download EPUB";
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

        text = "Found " + URLs.length + " pages";

        const file = streamSaver.createWriteStream(`${manga.title.en} ${chapter.data.attributes.chapter}.epub`, {
            writableStrategy: undefined, // (optional)
            readableStrategy: undefined,  // (optional)
        });

        const zip = await prepareEpub({
            title: `https://manga.danbulant.eu/${mangaId}/${chapter.data.id}`,
            file,
            chapter: chapter.data.attributes.chapter,
            links: hashes,
            updatedAt: chapter.data.attributes.updatedAt
        });

        for(var i = 0; i < URLs.length; i++) {
            text = `Saving page ${i + 1} of ${URLs.length}`;
            progress = (i + 1) / URLs.length;
            const url = URLs[i];
            const hash = hashes[i];
            const res = await fetch(url);
            const image = new ZipPassThrough("OEBPS/" + hash);
            zip.add(image);
            image.push(new Uint8Array(await res.arrayBuffer()), true);
            const textContent = new ZipPassThrough("OEBPS/" + i + ".xhtml");
            zip.add(textContent);
            textContent.push(enc.encode(`<?xml version="1.0" encoding="UTF-8"?>
            <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
            <head>
                <title>Page ${i + 1}</title>
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
                <meta name="EPB-UUID" content=""/>
            </head>
            <body>
                <img style="margin:auto;height:100%;" src="${hash}" />
            </body>
            </html>`), true);
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

    <div class="linklist">
        <a href={$url("..")}>Go back to search page</a>
    </div>

    <br>

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
        {#if chapters.results.filter(c => c.data.attributes.translatedLanguage === "en").length === 0}
            <p>No chapters found.</p>
        {/if}
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