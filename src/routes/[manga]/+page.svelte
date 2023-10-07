<script lang="ts">
    import Chapter from "$lib/components/chapter.svelte";
    import { EpubGenerator } from "$lib/util/generateEpub";
    import { CBZGenerator } from "$lib/util/generateCbz";
    import request, { imageproxy } from "$lib/util/request";
    import { arraysEqual } from "$lib/util/arrays";
    import Tabs from "$lib/components/tabs/tabs.svelte";
    import { slide } from "svelte/transition";
    import { Swiper, SwiperSlide } from 'swiper/svelte';
    import ArtList from "$lib/components/artList.svelte";
    import SvelteMarkdown from 'svelte-markdown';
    import ArtDialog from "$lib/components/artDialog.svelte";
    import streamSaver from "streamsaver";
    import Navbar from "./navbar.svelte";
    import ExpandableDescription from "./expandableDescription.svelte";
    import { tick } from "svelte";
    import Favicon from "./favicon.svelte";
    import RelatedManga from "./relatedManga.svelte";
    import { anilistInfo } from "./anilistInfo";

    export var data;

    var mangaId = data.id;
    $: mangaId = data.id;
    var manga = data.manga;
    $: manga = data.manga;
    var relationships = data.mangaRelationships;
    $: relationships = data.mangaRelationships;
    var title = manga.title.en || manga.title.jp || Object.values(manga.title)[0];
    $: title = manga.title.en || manga.title.jp || Object.values(manga.title)[0];

    let anilistData;
    $: anilistData = manga.links && manga.links.al && anilistInfo(manga.links.al);

    let cache: { id: string, data: any, total } | null = null;
    async function getMangaChapters(id) {
        if(cache?.id === id && cache.data.length >= cache.total) return cache;
        const params = new URLSearchParams();
        params.append("limit", "500");
        params.append("translatedLanguage[]", "en");
        params.append("translatedLanguage[]", "uk");
        params.append("includes[]", "scanlation_group");
        params.append("contentRating[]", "safe");
        params.append("contentRating[]", "suggestive");
        params.append("contentRating[]", "erotica");
        params.append("contentRating[]", "pornographic");
        params.append("order[chapter]", "asc");
        params.append("offset", cache?.id === id && cache?.data.length.toString() || 0);
        const data = await request("manga/" + id + "/feed?" + params.toString());
        if(!cache || cache.id !== id) cache = { id, data: [], total: 0 };
        cache.total = data.total;
        cache.data = cache.data.concat(data.data);
        return cache;
    }
    
    var chapters;
    var loadingChapters = false;
    $: if(chapters?.id !== mangaId && !loadingChapters) {
        loadingChapters = true;
        getMangaChapters(mangaId).then(async data => {
            chapters = data;
            await tick();
            swiper.slideToClosest();
            loadingChapters = false;
        });
    }


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
        if(arraysEqual(selected, chapters.data)) {
            selected = [];
        } else {
            selected = chapters.data.slice();
        }
        if(selected.length) {
            text = `Selected ${selected.length} chapters`;
        } else {
            text = defaultText;
        }
    }

    var selectedTab = "Chapters";
    const defaultTabs = ["Chapters", "Art", "More info"];
    var tabs = defaultTabs;

    $: {
        if(swiper && tabs.indexOf(selectedTab) !== swiper.realIndex) swiper.slideTo(tabs.indexOf(selectedTab));
    }

    let swiper;
    function swiperInit(e) {
        swiper = e.detail[0];
    }
    function swiperUpdate() {
        if(selectedTab !== tabs[swiper.realIndex])
            selectedTab = tabs[swiper.realIndex];
    }

    var selectedImage = null;

    var width;

    var smallScreenMode = width < 700;
    $: smallScreenMode = width < 700;

    var scrollY, innerHeight;

    let additionalImages = [];

    $: if(anilistData) anilistData.then(data => {
        if(data && data.bannerImage && !additionalImages.find(t => t.src === data.bannerImage)) {
            additionalImages.push({
                src: data.coverImage.large,
                alt: "Cover image from anilist",
                // color: data.coverImage.color,
                height: 1,
                width: 1
            });
            additionalImages.push({
                src: data.bannerImage,
                alt: "Banner image from anilist",
                // color: data.coverImage.color,
                height: 1,
                width: 3
            });
            additionalImages = additionalImages;
            tabs = [...defaultTabs, "Characters"];
        }
    }); else {
        additionalImages = []
        tabs = defaultTabs;
    }

    $: if(chapters) console.log("ch", chapters, chapters.data.length, chapters.total, chapters.data.length < chapters.total);

    let loadingNextPage = false;
    async function loadNextPage() {
        if(loadingNextPage) return;
        console.log("Loading next page");
        loadingNextPage = true;
        chapters = await getMangaChapters(mangaId);
        await tick();
        loadingNextPage = false;
        swiper.slideToClosest();
    }

    $: if(!loadingNextPage && chapters && chapters.data.length < chapters.total && scrollY > 300 && scrollY > document.body.scrollHeight * 0.8) loadNextPage();

    var selectedCharacter = null;

    $: if(!selectedImage) selectedCharacter = null;
</script>

<svelte:window on:beforeunload={beforeUnload} bind:innerWidth={width} bind:scrollY bind:innerHeight />

<svelte:head>
    <title>{title} - Chapter list</title>
	<meta name="description" value="Read {title} online, or download it as EPUB or CBZ file. Free of charge as well as free of ads." />
</svelte:head>

<Navbar transparent={scrollY < 0.2*innerHeight} {title} />

<ArtDialog bind:selectedImage>
    {#if selectedCharacter}
        <div class="character-info">
            <h1>{selectedCharacter.node.name.full}</h1>
            <h2 style="padding: 0; margin: 0 0 0.5rem; color: rgba(255,255,255,0.7);">{selectedCharacter.node.name.native}</h2>
            <small style="color: rgba(255,255,255,0.7)">Crossed out text may indicate spoilers!</small>
            <p style="margin: 0 0 1rem;"><SvelteMarkdown source={selectedCharacter.node.description} isInline /></p>
            {#if selectedCharacter.node.gender}
                <div>Gender: {selectedCharacter.node.gender}</div>
            {/if}
            {#if selectedCharacter.node.age}
                <div>Age: {selectedCharacter.node.age}</div>
            {/if}
            {#if selectedCharacter.node.dateOfBirth && (selectedCharacter.node.dateOfBirth.day || selectedCharacter.node.dateOfBirth.month || selectedCharacter.node.dateOfBirth.year)}
                <div>Birthday: {selectedCharacter.node.dateOfBirth.day || "Unknown"}/{selectedCharacter.node.dateOfBirth.month || "Unknown"}/{selectedCharacter.node.dateOfBirth.year || "Unknown"}</div>
            {/if}
            {#if selectedCharacter.node.favourites}
                <div>Favourites: {selectedCharacter.node.favourites}</div>
            {/if}
            {#if selectedCharacter.node.bloodType}
                <div>Blood type: {selectedCharacter.node.bloodType}</div>
            {/if}
        </div>
    {/if}
</ArtDialog>

{#if anilistData} {#await anilistData then data}
    {#if data && data.bannerImage}
        <div class="banner-container">
            <img class="banner" src={data.bannerImage} on:click={() => selectedImage = data.bannerImage} alt="">
            <div class="fader"></div>
        </div>
    {/if}
{/await} {/if}

<main class:smallScreenMode>
    <div class="flex infoflex">
        {#if relationships.find(t => t.type === "cover_art")}
            <div class="cover-container">
                <img class="cover" class:r18={!["safe", "suggestive"].includes(manga.contentRating)} draggable="false" src="{imageproxy}https://uploads.mangadex.org/covers/{mangaId}/{relationships.find(t => t.type === "cover_art").attributes.fileName}.512.jpg" alt="" on:click={() => selectedImage = `${imageproxy}https://uploads.mangadex.org/covers/${mangaId}/${relationships.find(t => t.type === "cover_art").attributes.fileName}.512.jpg`}>
                <img class="cover-backdrop" draggable="false" src="{imageproxy}https://uploads.mangadex.org/covers/{mangaId}/{relationships.find(t => t.type === "cover_art").attributes.fileName}.512.jpg" alt="">
            </div>
        {/if}
        <div class="info">
            <h1>{title}</h1>
        
            <h3>
                {#if manga.altTitles.find(t => t.en)}
                    {manga.altTitles.find(t => t.en)?.en} &middot;
                {/if}
                {#if manga.year}
                    {manga.year} &middot;
                {/if}
                {#if anilistData} {#await anilistData then data}{#if data && data.status} {data.status} &middot; {/if} {/await} {/if}
                {manga.contentRating}
            </h3>
            {#if relationships.find(t => t.type === "author")}
                <span class="block author">Author: {relationships.find(t => t.type === "author").attributes.name}</span>
            {/if}
            {#if relationships.find(t => t.type === "artist")}
                <span class="block author">Artist: {relationships.find(t => t.type === "artist").attributes.name}</span>
            {/if}
            {#if relationships.find(t => t.related === "colored" && t.type === "manga")}
                <a href="/{relationships.find(t => t.related === "colored" && t.type === "manga").id}" class="block">Colored version</a>
            {/if}
            {#if !smallScreenMode && manga.description.en}
                <p class="description"><SvelteMarkdown source={manga.description.en} isInline /></p>
            {/if}
        </div>
    </div>

    {#if smallScreenMode && manga.description.en}
        <div class="fulldescription">
            <ExpandableDescription source={manga.description.en} />
        </div>
    {/if}

    {#if manga.tags}
        <div class="tags">
            {#each manga.tags as tag}
                <span class="tag">{tag.attributes.name.en || tag.attributes.name.jp || Object.values(tag.attributes.name)[0]}</span>
            {/each}
        </div>
    {/if}

    <div class="flex">
        <div class="linklist">
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
            <div class="chapter-list" style="min-height: 30rem;">
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
                        {#if chapters && chapters.data.length && arraysEqual(selected, chapters.data)}
                            Deselect all
                        {:else}
                            Select all
                        {/if}
                    </button>
                </div>

                {#if !chapters}
                    Loading chapters...
                {:else}
                    {#if chapters.data.length === 0}
                        <p>No chapters found.</p>
                    {/if}
                    <table>
                        <tbody>
                            {#each chapters.data as chapter} 
                                <Chapter progress={(progressMap.get(chapter.id) || 0) / chapter.attributes.pages} {chapter} disabledDownload={!!progress} selected={selected.includes(chapter)} on:select={() => select(chapter)} on:download={() => downloadSingle(chapter)} />
                            {/each}
                        </tbody>
                    </table>
                {/if}
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div class="art-list" style="min-height: 30rem;">
                <ArtList {mangaId} bind:selectedImage additionalList={additionalImages} />
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div class="more-info" style="min-height: 30rem;">
                <div class="flex-wrapped">
                    {#if anilistData} {#await anilistData then data} {#if data}              
                        <div>
                            <b>Genres</b>: {data.genres.join(", ")}
                            <br>
                            
                            <b>AL popularity</b>: {data.popularity} <br>
                            <b>favorite on AL</b>: {data.isFavourite ? "yes" : "no"} <br>
                            <b>AL score</b>: {data.averageScore} <br>
                            <b>Also known as</b>: {data.synonyms.join(", ")} {Object.values(manga.title).filter(t => t !== title).join(", ")}

                            <br><br>
                        </div>
                    {/if} {/await} {/if}
                    {#if manga.links}
                        <div>
                            <h4>Links</h4>

                            {#if manga.links.al}
                                <a href="https://anilist.co/manga/{manga.links.al}"><Favicon url="https://anilist.co" /> Anilist</a> <br>
                            {/if}
                            {#if manga.links.ap}
                                <a href="https://www.anime-planet.com/manga/{manga.links.ap}"><Favicon url="https://anime-planet.com" /> Animeplanet</a> <br>
                            {/if}
                            {#if manga.links.bw}
                                <a href="https://bookwalker.jp/{manga.links.bw}"><Favicon url="https://bookwalker.jp" /> Bookwalker</a> <br>
                            {/if}
                            {#if manga.links.mu}
                                <a href="https://www.mangaupdates.com/series.html?id={manga.links.mu}"><Favicon url="https://www.mangaupdates.com" /> Manga updates</a> <br>
                            {/if}
                            {#if manga.links.nu}
                                <a href="https://www.novelupdates.com/series/{manga.links.nu}"><Favicon url="https://www.novelupdates.com" /> Novel updates</a> <br>
                            {/if}
                            {#if manga.links.amz}
                                <a href={manga.links.amz}><Favicon url={manga.links.amz} /> Amazon</a> <br>
                            {/if}
                            {#if manga.links.ebj}
                                <a href={manga.links.ebj}><Favicon url={manga.links.ebj} /> Ebookjapan</a> <br>
                            {/if}
                            {#if manga.links.mal}
                                <a href="https://myanimelist.net/manga/{manga.links.mal}"><Favicon url="https://myanimelist.net" /> MyAnimeList</a> <br>
                            {/if}
                            {#if manga.links.cdj}
                                <a href="{manga.links.cdj}"><Favicon url={manga.links.cdj} /> CDJapan</a> <br>
                            {/if}
                            {#if manga.links.raw}
                                <a href="{manga.links.raw}"><Favicon url={manga.links.raw} /> RAW</a> <br>
                            {/if}
                            {#if manga.links.engtl}
                                <a href="{manga.links.engtl}"><Favicon url={manga.links.engtl} /> engtl</a> <br>
                            {/if}

                            <a href="https://mangadex.org/title/{mangaId}"><Favicon url="https://mangadex.org"/> Mangadex.org</a>
                        </div>
                    {/if}
                </div>

                {#if relationships.filter(t => t.type === "manga" && typeof t.attributes !== "undefined").length}
                    <div>
                        <RelatedManga on:slideToClosest={() => swiper.slideToClosest()} mangaRelations={relationships.filter(t => t.type === "manga" && typeof t.attributes !== "undefined")} />
                    </div>
                {/if}
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div class="characters" style="min-height: 30rem;">
                {#await anilistData then data}{#if data && data.characters?.edges.length}
                    {#each data.characters.edges as character}
                        <div class="character"  on:click={() => {selectedImage = character.node.image.large; selectedCharacter = character}} >
                            <div class="container">
                                <img src={character.node.image.large} alt="" />
                                <img class="backdrop" src={character.node.image.large} alt="" />
                            </div>
                            <div>
                                <h4>{character.node.name.userPreferred}</h4>
                                <span class="role">{character.role}</span>
                            </div>
                        </div>
                    {/each}
                {/if}{/await}
            </div>
        </SwiperSlide>
    </Swiper>
</main>

<style>
    .art-list {
        margin-top: 2rem;
    }
    .chapter-list {
        margin-top: 1rem;
    }
    .more-info {
        margin-top: 2rem;
    }
    .characters {
        margin-top: 1rem;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        grid-gap: 2rem;
        padding: 1rem;
    }
    .character {
        cursor: pointer;
    }
    .character img {
        position: relative;
        z-index: 1;
        object-fit: cover;
        max-width: 100%;
        max-height: 100%;
        border-radius: 5px;
    }
    .container {
        position: relative;
    }
    .container .backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        border-radius: 5px;
        filter: blur(10px) saturate(100%);
        z-index: 0;
        transition: opacity .3s, filter .3s;
    }
    .container:hover .backdrop {
        opacity: 1;
        filter: blur(20px) saturate(150%);
    }
    .character .role {
        font-size: 1rem;
        color: rgb(175, 175, 175);
    }
    h4 {
        margin: 0;
    }
    .tags {
        display: flex;
        overflow: auto;
    }
    .tag {
        margin: 5px;
        padding: 5px;
        border-radius: 5px;
        background-color: rgb(64,64,64);
        user-select: all;
        flex-shrink: 0;
    }
    .hidden {
        display: none;
    }
    .infoflex.flex {
        margin: 15px;
        justify-content: start;
        gap: 1rem;
    }
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
    .banner-container {
        width: 100%;
        max-height: 40vh;
        position: absolute;
        z-index: 0;
        user-select: none;
    }
    .banner {
        width: 100%;
        max-height: 40vh;
        object-fit: cover;
        object-position: center top;
        overflow: hidden;
    }
    .banner-container .fader {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,1) 100%);
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
    .cover-container {
        position: relative;
        height: 20rem;
        flex-shrink: 0;
        margin-right: 15px;
        transition: height .3s;
    }
    .cover {
        position: relative;
        border-radius: 10px;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        cursor: pointer;
    }
    .cover-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: calc(100% + 4px);
        height: calc(100% + 4px);
        z-index: 0;
        filter: blur(18px) saturate(100%);
        transition: filter .3s;
    }
    .cover-container:hover .cover-backdrop {
        filter: blur(30px) saturate(150%);
    }
    .smallScreenMode .cover-container {
        height: 12rem;
    }
    .block {
        display: block;
    }
    .flex {
        display: flex;
    }
    h1 {
        margin: 0;
        padding-top: 0.5rem;
        text-align: left;
    }
    .smallScreenMode h1 {
        font-size: 1.5rem;
    }
    h3 {
        margin: 0;
    }
    .smallScreenMode h3 {
        font-size: 1.2rem;
        font-weight: normal;
    }
    .author {
        font-weight: bold;
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
        position: relative;
        z-index: 1;
        /* background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0vh, rgba(0,0,0,1) 30vh); */
        padding-top: 5rem;
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
