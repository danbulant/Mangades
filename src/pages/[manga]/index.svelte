<script>
    import { url } from "@roxi/routify/runtime/helpers";
    import Chapter from "../../components/chapter.svelte";
    import { EpubGenerator } from "../../util/generateEpub";
    import { CBZGenerator } from "../../util/generateCbz";
    import request from "../../util/request";
    import { BaseGenerator } from "../../util/baseGenerator";

    export var scoped;

    var mangaId = scoped.id;
    $: mangaId = scoped.id;
    var manga = scoped.manga;
    $: manga = scoped.manga;
    var relationships = scoped.mangaRelationships;
    $: relationships = scoped.mangaRelationships;

    async function getMangaChapters(id) {
        const data = await request("manga/" + id + "/feed?limit=500&translatedLanguage[]=en");
        data.results.sort((a, b) => a.data.attributes.chapter - b.data.attributes.chapter);
        return data;
    }

    $: chapters = getMangaChapters(mangaId);

    console.log(manga);
    console.log(chapters);
    console.log(relationships);

    var progress = 0;
    var state = "idle";
    const defaultText = "Choose a chapter to view online or download EPUB";
    var text = defaultText;
    var pagesDone = 0;
    var totalPages = 0;

    $: progress = pagesDone / (totalPages || 1);
    $: if(totalPages) text = `Saving page ${pagesDone + 1} of ${totalPages}`;

    /**
     * @type {BaseGenerator[]}
     */
    var queue = [];
    /**
     * @type {BaseGenerator}
     */
    var processing = null;
    /**
     * @type {Map<string, number>}
     */
    var progressMap = new Map();
    async function processQueue() {
        if(processing) return;
        processing = queue.shift();
        if(!processing) return processing = null;
        state = "active";
        processing.opts.callback = async (chapter, link, finished) => {
            console.log(chapter, link, finished);
            var cs = await chapters;
            var related = cs.results.filter(t => processing.opts.chapters.find(c => t.data.id === c.id));
            var done = processing.opts.chapters.filter(t => t.number < chapter);
            var linkCount = related.map(t => t.data.attributes[quality].length).reduce((a, b) => a + b);
            progress = (done.reduce((a, b) => (a.links || []).length + (b.links || []).length, 0) + link + 1) / linkCount;
            progressMap.set(processing.opts.chapters[chapter].number, link + 1);
            progressMap = progressMap;
        };
        await processing.generate();
        processing = null;
        progressMap = new Map();
        progress = 0;
        state = "idle";
        processQueue();
    }

    const generators = {
        epub: EpubGenerator,
        cbz: CBZGenerator
    }
    const quality = "data";

    async function downloadSingle(chapter) {
        const file = streamSaver.createWriteStream(`${manga.title.en} ${chapter.data.attributes.chapter}.${format}`, {
            writableStrategy: undefined, // (optional)
            readableStrategy: undefined,  // (optional)
        });

        const generator = new generators[format]({
            file,
            id: chapter.data.id,
            language: chapter.data.attributes.translatedLanguage,
            quality,
            updatedAt: chapter.data.attributes.updatedAt,
            title: manga.title.en,
            author: "Unknown",
            chapters: [{
                hash: chapter.data.attributes.hash,
                id: chapter.data.id,
                links: chapter.data.attributes[quality],
                number: chapter.data.attributes.chapter,
                volume: chapter.data.attributes.volume
            }]
        });

        console.log(generator);
        queue.push(generator);
        processQueue();
    }

    var format = "cbz";
    var selected = [];
    function select(chapter) {
        if(selected.includes(chapter)) {
            selected.splice(selected.indexOf(chapter), 1);
        } else {
            selected.push(chapter);
        }
        selected = selected;
        if(selected.length) {
            text = `Selected ${selected.length} chapters`;
        } else {
            text = defaultText;
        }
    }
    function downloadMulti() {
        selected.sort((a, b) => a.data.attributes.chapter - b.data.attributes.chapter);
        if(!selected.length) return;
        if(selected.length === 1) {
            downloadSingle(selected.shift());
            selected = [];
            return;
        }
        const file = streamSaver.createWriteStream(`${manga.title.en}.${format}`, {
            writableStrategy: undefined, // (optional)
            readableStrategy: undefined,  // (optional)
        });
        const generator = new generators[format]({
            file,
            quality,
            id: window.location.toString(),
            language: selected[0].data.attributes.translatedLanguage,
            updatedAt: new Date,
            title: manga.title.en,
            author: "Unknown",
            chapters: selected.map(chapter => ({
                hash: chapter.data.attributes.hash,
                id: chapter.data.id,
                links: chapter.data.attributes[quality],
                number: chapter.data.attributes.chapter,
                volume: chapter.data.attributes.volume
            }))
        });

        console.log(generator);
        queue.push(generator);
        selected = [];
        processQueue();
    }

    /**
     * @param {BeforeUnloadEvent} e
     */
    function beforeUnload(e) {
        if(progress) {
            e.preventDefault();
            return "Downloads won't be saved if you exit this page before they're finished.";
        }
    }

    $: console.log(format);
</script>

<svelte:window on:beforeUnload={beforeUnload} />

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

    {#if queue.length > 0}
        <p><i>{queue.length} downloads queued.</i></p>
    {/if}

    <div class="download">
        <select name="format" bind:value={format} id="select-format">
            <option value="cbz"><b>.cbz</b> Comic Book Zip</option>
            <option value="epub"><b>.epub</b> Electronic publication</option>
        </select>
        <button disabled={!selected.length} on:click={downloadMulti}>Download</button>
    </div>

    <p>
        <b>
            Do not close the tab when a download is in progress.
        </b>
    </p>

    {#await chapters}
        Loading chapters...
    {:then chapters}
        {#if chapters.results.length === 0}
            <p>No chapters found.</p>
        {/if}
        <table>
            <tbody>
                {#each chapters.results as chapter, i} 
                    <Chapter progress={(progressMap.get(chapter.data.attributes.chapter) || 0) / chapter.data.attributes[quality].length} {chapter} disabledDownload={!!progress} selected={selected.includes(chapter)} on:select={() => select(chapter)} on:download={() => downloadSingle(chapter)} />
                {/each}
            </tbody>
        </table>
    {/await}
</main>

<style>
    .download {
        display: flex;
        width: 100%;
        margin-top: 5px;
    }
    .download select {
        flex-grow: 1;
        margin-inline: 5px;
    }
    .download button {
        margin-inline: 5px;
    }
    main {
        font-size: 1.1rem;
    }
    .no-wrap {
        white-space: nowrap;
    }
    tbody {
        list-style-type: disc;
    }
    table {
        border-collapse: collapse;
        width: 100%;
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