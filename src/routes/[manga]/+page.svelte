<script>
    import Chapter from "$lib/components/chapter.svelte";
    import { EpubGenerator } from "$lib/util/generateEpub";
    import { CBZGenerator } from "$lib/util/generateCbz";
    import request, { imageproxy } from "$lib/util/request";
    import { BaseGenerator } from "$lib/util/baseGenerator";
    import { arraysEqual } from "$lib/util/arrays";
    import { makeRequest } from "$lib/util/anilist";
    import Tabs from "$lib/components/tabs/tabs.svelte";
    import { slide } from "svelte/transition";
    import { Swiper, SwiperSlide } from 'swiper/svelte';
    import ArtList from "$lib/components/artList.svelte";
    import SvelteMarkdown from 'svelte-markdown';
    import ArtDialog from "$lib/components/artDialog.svelte";
    import streamSaver from "streamsaver";

    export var data;

    var mangaId = data.id;
    $: mangaId = data.id;
    var manga = data.manga;
    $: manga = data.manga;
    var relationships = data.mangaRelationships;
    $: relationships = data.mangaRelationships;
    var title = manga.title.en || manga.title.jp || Object.values(manga.title)[0];
    $: title = manga.title.en || manga.title.jp || Object.values(manga.title)[0];

    async function getMangaChapters(id) {
        const data = await request("manga/" + id + "/feed?limit=500&translatedLanguage[]=en&translatedLanguage[]=uk&includes[]=scanlation_group&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic");
        console.log(data);
        data.data = data.data
            .filter(item => !item.attributes?.externalUrl)
            .sort((a, b) => a.attributes.chapter - b.attributes.chapter);
        return data;
    }

    var chapters;
    $: chapters = getMangaChapters(mangaId);

    console.log("manga", manga);
    console.log("chapters", chapters);
    console.log("relationships", relationships);

    var progress = 0;
    var state = "idle";
    const defaultText = "Choose a chapter to view online or download";
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
            if(chapter === -1 || link === -1) return;
            var cs = await chapters;
            var related = cs.data.filter(t => processing.opts.chapters.find(c => t.id === c.id));
            var done = processing.opts.chapters.filter(t => parseFloat(t.number) < parseFloat(processing.opts.chapters[chapter].number));
            var linkCount = related.map(t => t.attributes.pages).reduce((a, b) => a + b);
            console.log(related, done, done.reduce((a, b) => (a.links || []).length + (b.links || []).length, 0), link + 1, linkCount);
            progress = (done.reduce((a, b) => (a.links || []).length + (b.links || []).length, 0) + link + 1) / linkCount;
            progressMap.set(processing.opts.chapters[chapter].id, link + 1);
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

    function createGenerator(chapter, file) {
        return new generators[format]({
            file,
            id: window.location.toString() + "-" + chapter.id,
            language: chapter.attributes.translatedLanguage,
            updatedAt: chapter.attributes.updatedAt,
            title,
            author: relationships.find(t => t.type === "author").attributes.name || "Unknown",
            chapters: [{
                id: chapter.id,
                number: chapter.attributes.chapter,
                volume: chapter.attributes.volume
            }]
        });
    }
    async function downloadSingle(chapter) {
        const file = streamSaver.createWriteStream(`${title} ${chapter.attributes.chapter}.${format}`, {
            writableStrategy: undefined, // (optional)
            readableStrategy: undefined,  // (optional)
        });

        const generator = createGenerator(chapter, file)

        console.log(generator);
        queue.push(generator);
        processQueue();
    }

    var format = "cbz";
    var selected = [];
    function select(chapter) {
        console.log("Selecting", chapter);
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
        selected.sort((a, b) => a.attributes.chapter - b.attributes.chapter);
        if(!selected.length) return;
        if(selected.length === 1) {
            downloadSingle(selected.shift());
            selected = [];
            return;
        }
        const file = streamSaver.createWriteStream(`${title}.${format}`, {
            writableStrategy: undefined, // (optional)
            readableStrategy: undefined,  // (optional)
        });
        const generator = new generators[format]({
            file,
            id: window.location.toString(),
            language: selected[0].attributes.translatedLanguage,
            updatedAt: new Date,
            title: title,
            author: relationships.find(t => t.type === "author").attributes.name || "Unknown",
            chapters: selected.map(chapter => ({
                id: chapter.id,
                title: chapter.attributes.title,
                number: chapter.attributes.chapter,
                volume: chapter.attributes.volume
            }))
        });

        console.log(generator);
        queue.push(generator);
        selected = [];
        processQueue();
    }
    function downloadSeparate() {
        selected.sort((a, b) => a.attributes.chapter - b.attributes.chapter);
        if(!selected.length) return;
        if(selected.length === 1) {
            downloadSingle(selected.shift());
            selected = [];
            return;
        }

        for (const chapter of selected) {
            const file = streamSaver.createWriteStream(`${title} ${chapter.attributes.chapter}.${format}`, {
                writableStrategy: undefined, // (optional)
                readableStrategy: undefined,  // (optional)
            });

            const generator = createGenerator(chapter, file)

            console.log(generator);
            queue.push(generator);
        }

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

    var copyrightOpen = false;

    function selectAll() {
        chapters.then(res => {
            var chapters = res.data;
            if(arraysEqual(selected, chapters)) {
                selected = [];
            } else {
                selected = chapters.slice();
            }
            if(selected.length) {
                text = `Selected ${selected.length} chapters`;
            } else {
                text = defaultText;
            }
        });
    }

    function anilistInfo(id) {
        return makeRequest(`
        query ($id: Int) {
            Media(id: $id, format: MANGA) {
                id
                type
                format
                status
                chapters
                volumes
                countryOfOrigin
                bannerImage
                genres
                synonyms
                averageScore
                popularity
                isFavourite
                isFavouriteBlocked
                isAdult
                siteUrl
                coverImage {
                    large
                    medium
                    color
                }
            }
        }`, { id }).then(t => t.data.Media);
    }

    let anilistData;
    $: anilistData = manga.links && manga.links.al && anilistInfo(manga.links.al);

    var selectedTab = "Chapters";
    const tabs = ["Chapters", "Art", "More information"];

    $: {
        if(swiper && tabs.indexOf(selectedTab) !== swiper.realIndex) swiper.slideTo(tabs.indexOf(selectedTab));
    }

    $: typeof window !== "undefined" && chapters && chapters.then(() => swiper.slideToClosest())

    let swiper;
    function swiperInit(e) {
        swiper = e.detail[0];
    }
    function swiperUpdate() {
        if(selectedTab !== tabs[swiper.realIndex])
            selectedTab = tabs[swiper.realIndex];
    }

    var selectedImage = null;

    const relatedMangaMap = {
        spin_off: "Spin off",
        doujinshi: "Doujinshi",
        side_story: "Side story",
        colored: "Colored version",
        monochrome: "Monochrome version",
        adapted_from: "Adapted from",
        based_on: "Based on",
        shared_universe: "Shared universe"
    };

    var width;

    var smallScreenMode = width < 660;
    $: smallScreenMode = width < 660;
</script>

<svelte:window on:beforeUnload={beforeUnload} bind:innerWidth={width} />

<svelte:head>
    <title>Chapters of {title}</title>
	<meta name="description" value="Read {title} online, or download it as EPUB or CBZ file. Free of charge and ads." />
</svelte:head>

{#if anilistData} {#await anilistData then data}
    {#if data.bannerImage}
        <img class="banner" src={data.bannerImage} on:click={() => selectedImage = data.bannerImage} alt="">
    {/if}
{/await} {/if}

<ArtDialog bind:selectedImage />

<main class:smallScreenMode>
    <h1>{title}</h1>

    <h3>
        {#if manga.altTitles.find(t => t.en)}
            {manga.altTitles.find(t => t.en)?.en} &middot;
        {/if}
        {#if manga.year}
            {manga.year} &middot;
        {/if}
        {#if anilistData} {#await anilistData then data} {data.status} &middot; {/await} {/if}
        {manga.contentRating}
        {#if smallScreenMode}
            <br>
            {#if relationships.find(t => t.type === "author")}
                Author: {relationships.find(t => t.type === "author").attributes.name}
                {#if relationships.find(t => t.type === "artist")} &middot; {/if}
            {/if}
            {#if relationships.find(t => t.type === "artist")}
                Artist: {relationships.find(t => t.type === "artist").attributes.name}
            {/if}
        {/if}
    </h3>


    <div class="flex infoflex">
        {#if relationships.find(t => t.type === "cover_art")}
            <img class="cover" class:r18={!["safe", "suggestive"].includes(manga.contentRating)} draggable="false" src="{imageproxy}https://uploads.mangadex.org/covers/{mangaId}/{relationships.find(t => t.type === "cover_art").attributes.fileName}.512.jpg" alt="" on:click={() => selectedImage = `https://uploads.mangadex.org/covers/${mangaId}/${relationships.find(t => t.type === "cover_art").attributes.fileName}.512.jpg`}>
        {/if}
        <div class="info" class:hidden={smallScreenMode}>
            {#if relationships.find(t => t.type === "author")}
                <span class="block">Author: {relationships.find(t => t.type === "author").attributes.name}</span>
            {/if}
            {#if relationships.find(t => t.type === "artist")}
                <span class="block">Artist: {relationships.find(t => t.type === "artist").attributes.name}</span>
            {/if}
            {#if relationships.find(t => t.related === "colored" && t.type === "manga")}
                <a href="/{relationships.find(t => t.related === "colored" && t.type === "manga").id}" class="block">Colored version</a>
            {/if}
            {#if manga.description.en}
                <p><SvelteMarkdown source={manga.description.en} isInline /></p>
            {/if}
        </div>
    </div>

    <div class="flex">
        <div class="linklist">
            <a href="..">Go back to search page</a> <br>
            <a href="https://mangadex.org/title/{mangaId}">Mangadex.org</a>
        </div>
        <div class="copyright-header" class:copyright-header-active={copyrightOpen} on:click={() => copyrightOpen = !copyrightOpen}>Copyright infringement? (click)</div>
    </div>

    {#if copyrightOpen}
        <p class="copyright" transition:slide={{ duration: 500 }}>
            Open <a href="https://mangadex.org/title/{mangaId}">Mangadex.org page of this manga</a>, select MORE and click REPORT. I cannot delete the content, even if you report it to this website's hosting, as this is just one of many clients to mangadex.
            <br>
            <br>
            In case of reports, I can just block the content from being loaded in this page, but that doesn't mean it's deleted nor that any other client can't access it. To properly request deletion, contact Mangadex.org. After it's deleted from Mangadex.org, this website will no longer allow access to it (since it physically cannot, as it doesn't store any content).
        </p>
    {/if}

    <br>

    <Tabs list={tabs} bind:selected={selectedTab} />

    <Swiper
        on:init={swiperInit}
        spaceBetween={50}
        autoHeight={true}
        slidesPerView={1}
        on:slideChange={swiperUpdate}
        on:swiper={(e) => console.log(e.detail[0])}
    >
        <SwiperSlide>
            <div style="min-height: 30rem;">
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
                    <button disabled={!selected.length} on:click={downloadSeparate}>Download Separate</button>
                </div>
            
                <div class="flex">
                    <p>
                        <b>
                            Do not close the tab when a download is in progress.
                        </b>
                    </p>
                    <button on:click={selectAll}>
                        Select all
                    </button>
                </div>

                {#await chapters}
                    Loading chapters...
                {:then chapters}
                    {#if chapters.data.length === 0}
                        <p>No chapters found.</p>
                    {/if}
                    <table>
                        <tbody>
                            {#each chapters.data as chapter, i} 
                                <Chapter progress={(progressMap.get(chapter.id) || 0) / chapter.attributes.pages} {chapter} disabledDownload={!!progress} selected={selected.includes(chapter)} on:select={() => select(chapter)} on:download={() => downloadSingle(chapter)} />
                            {/each}
                        </tbody>
                    </table>
                {/await}
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div style="min-height: 30rem;">
                <ArtList {mangaId} bind:selectedImage />
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div style="min-height: 30rem;">
                {#if anilistData} {#await anilistData then data}                    
                    Genres: {data.genres.join(", ")}
                    <br>
                    
                    AL popularity: {data.popularity} <br>
                    favorite on AL: {data.isFavourite ? "yes" : "no"} <br>
                    AL score: {data.averageScore} <br>
                    Also known as: {data.synonyms.join(", ")} {Object.values(manga.title).filter(t => t !== title).join(", ")}

                    {#if smallScreenMode}
                        {#if relationships.find(t => t.type === "author")}
                            <span class="block">Author: {relationships.find(t => t.type === "author").attributes.name}</span>
                        {/if}
                        {#if relationships.find(t => t.type === "artist")}
                            <span class="block">Artist: {relationships.find(t => t.type === "artist").attributes.name}</span>
                        {/if}

                        {#if manga.description.en}
                            <p><SvelteMarkdown source={manga.description.en} isInline /></p>
                        {/if}
                    {/if}

                    <br><br>
                {/await} {/if}

                <div class="flex-wrapped">
                    {#if relationships.filter(t => t.type === "manga").length}
                        <div>
                            <h4>Related manga</h4>
                            {#each relationships.filter(t => t.type === "manga") as relatedManga}
                                <a href="/{relatedManga.id}">{relatedMangaMap[relatedManga.related] || relatedManga.related}</a> <br>
                            {/each}
                        </div>
                    {/if}
                    {#if manga.links}
                        <div>
                            <h4>Links</h4>

                            {#if manga.links.al}
                                <a href="https://anilist.co/manga/{manga.links.al}">Anilist</a> <br>
                            {/if}
                            {#if manga.links.ap}
                                <a href="https://www.anime-planet.com/manga/{manga.links.ap}">Animeplanet</a> <br>
                            {/if}
                            {#if manga.links.bw}
                                <a href="https://bookwalker.jp/{manga.links.bw}">Bookwalker</a> <br>
                            {/if}
                            {#if manga.links.mu}
                                <a href="https://www.mangaupdates.com/series.html?id={manga.links.mu}">Manga updates</a> <br>
                            {/if}
                            {#if manga.links.nu}
                                <a href="https://www.novelupdates.com/series/{manga.links.nu}">Novel updates</a> <br>
                            {/if}
                            {#if manga.links.amz}
                                <a href={manga.links.amz}>Amazon</a> <br>
                            {/if}
                            {#if manga.links.ebj}
                                <a href={manga.links.ebj}>Ebookjapan</a> <br>
                            {/if}
                            {#if manga.links.mal}
                                <a href="https://myanimelist.net/manga/{manga.links.mal}">MyAnimeList</a> <br>
                            {/if}
                            {#if manga.links.cdj}
                                <a href="{manga.links.cdj}">CDJapan</a> <br>
                            {/if}
                            {#if manga.links.raw}
                                <a href="{manga.links.raw}">RAW</a> <br>
                            {/if}
                            {#if manga.links.engtl}
                                <a href="{manga.links.engtl}">engtl</a> <br>
                            {/if}
                        </div>
                    {/if}
                    {#if manga.tags}
                        <div>
                            <h4>Tags</h4>
                            {#each manga.tags as tag}
                                <span class="block">{tag.attributes.name.en || tag.attributes.name.jp || Object.values(tag.attributes.name)[0]}</span>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </SwiperSlide>
    </Swiper>
</main>

<style lang="postcss">
    .hidden {
        display: none;
    }
    .infoflex {
        margin: 15px;
    }
    h4 { margin: 0; }
    .flex-wrapped {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
    }
    .flex-wrapped > div {
        min-width: 50%;
    }
    .cover.r18 {
        filter: blur(15px);
        transition: filter .3s;
    }
    .cover.r18:hover {
        filter: blur(0);
    }
    .banner {
        width: 100%;
        max-height: 30vh;
        object-fit: cover;
        animation: reveal 2s cubic-bezier(0, 0, 0.08, 0.99);
    }
    .genre {
        border-radius: 5px;
        background: rgb(204, 204, 204);
        padding: 0.3rem;
        margin: 0.3rem;
    }
    .tabbed {
        min-height: 20rem;
    }
    @media (prefers-reduced-motion) {
        .banner {
            animation: none;
        }
    }
    @keyframes reveal {
        from {
            max-height: 0;
        }
        to {
            max-height: 30vh;
        }
    }
    .cover {
        border-radius: 10px;
        height: 350px;
        margin-right: 15px;
    }
    .smallScreenMode .cover {
        margin: 0;
    }
    .smallScreenMode .infoflex {
        justify-content: center;
    }
    .block {
        display: block;
    }
    .flex {
        display: flex;
    }
    h3 {
        text-align: center;
        margin-top: 0;
    }
    h1 {
        margin-bottom: 0;
    }
    .flex {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .copyright {
        margin-block-start: 0;
        margin-block-end: 0;
        padding: 10px;
        background: rgb(214, 214, 214);
        border-radius: 5px 0 5px 5px;
    }
    :global(.dark main > .copyright.copyright.copyright) {
        background: rgb(64, 64, 64);
    }
    .copyright-header {
        background: rgb(214, 214, 214);
        padding: 10px;
        border-radius: 5px;
        user-select: none;
        cursor: pointer;
    }
    :global(.dark main > .flex .copyright-header) {
        background: rgb(64, 64, 64);
    }
    .copyright-header-active {
        border-radius: 5px 5px 0 0;
    }
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
        padding-bottom: 1rem;
    }
    .no-wrap {
        white-space: nowrap;
    }
    tbody {
        list-style-type: disc;
    }
    table {
        border-collapse: collapse;
        width: calc(100% - 2px);
    }

    .state {
        border-radius: 10px;
        border-width: 4px;
        border-style: solid;
        padding: 10px;
        position: relative;
        transition: all .3s;
    }
    :global(.dark .state) {
        color: black;
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