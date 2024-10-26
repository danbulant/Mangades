<script lang="ts">
    import Chapter from "$lib/components/chapter.svelte";
    import { EpubGenerator } from "$lib/util/generateEpub";
    import { CBZGenerator } from "$lib/util/generateCbz";
    import request, { coverUrl, imageproxy } from "$lib/util/request";
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
    import { isLogedIn } from "$lib/util/anilist";
    import { BaseGenerator, getURLs } from "$lib/util/baseGenerator";
    import FileItems from "$lib/components/fileItems.svelte";
    import ShowTypeChooser from "$lib/components/showTypeChooser.svelte";

    enum CoverArt {
        AutoVolume = "auto-volume",
        FirstPage = "first-page"
    }
    enum Group {
        Single = "single",
        Chapter = "chapter",
        Volume = "volume"
    }
    enum Format {
        Epub = "epub",
        Cbz = "cbz"
    }
    enum ChapterOrder {
        Asc = "asc",
        Desc = "desc"
    }

    let order = ChapterOrder.Desc;

    export var data;

    var mangaId = data.id;
    $: mangaId = data.id;
    var manga = data.manga;
    $: manga = data.manga;
    var relationships = data.mangaRelationships;
    $: relationships = data.mangaRelationships;
    var title = manga.title.en || manga.title.jp || Object.values(manga.title)[0];
    $: title = manga.title.en || manga.title.jp || Object.values(manga.title)[0];

    const defaultLanguages = ["en"];
    let languages = defaultLanguages;

    let anilistData;
    $: anilistData = manga.links && manga.links.al && anilistInfo(manga.links.al);

    let cache: { id: string, data: any, languages, total, order: ChapterOrder } | null = null;
    async function getMangaChapters(id, languages: string[], order: ChapterOrder) {
        console.log("Getting chapters", id, languages, order);
        if(cache?.id === id && cache.data.length >= cache.total && cache.order == order && arraysEqual(cache.languages, languages)) return cache;
        loadingChapters = true
        const params = new URLSearchParams();
        params.append("limit", "500");
        for(let lang of languages)
            params.append("translatedLanguage[]", lang);
        params.append("includes[]", "scanlation_group");
        params.append("contentRating[]", "safe");
        params.append("contentRating[]", "suggestive");
        params.append("contentRating[]", "erotica");
        params.append("contentRating[]", "pornographic");
        params.append("order[chapter]", order);
        params.append("offset", (cache?.id === id && cache.order === order && arraysEqual(cache.languages, languages)) && cache?.data.length.toString() || 0);
        const data = await request("manga/" + id + "/feed?" + params.toString());
        if(!cache || cache.id !== id || cache.order !== order || arraysEqual(cache.languages, languages)) cache = { id, data: [], total: 0, languages: languages.slice(), order };
        cache.total = data.total;
        cache.data = cache.data.concat(data.data);
        cache.languages = languages.slice();
        cache.order = order;
        loadingChapters = false;
        return chapters = cache;
    }
    
    var chapters;
    var loadingChapters = false;
    $: if(!loadingChapters) {
        getMangaChapters(mangaId, languages, order).then(async () => {
            await tick();
            swiper.slideToClosest();
        });
    }

    $: console.log(loadingChapters, chapters)

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

    const generators: Record<Format, typeof BaseGenerator> = {
        epub: EpubGenerator,
        cbz: CBZGenerator
    }
    var format: Format = Format.Cbz;
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

    function splitSelectionIntoFiles(selected, group: Group) {
        if(!selected.length) return [];
        selected.sort((a, b) => a.attributes.chapter - b.attributes.chapter);
        let files = [];

        switch(group) {
            case Group.Single:
                files[0] = selected
                break;
            case Group.Chapter:
                files = selected.map(chapter => [chapter]);
                break;
            case Group.Volume:
                files = selected.reduce((acc, chapter) => {
                    let last = acc[acc.length - 1];
                    if(!last || last[0].attributes.volume !== chapter.attributes.volume) {
                        acc.push([chapter]);
                    } else {
                        last.push(chapter);
                    }
                    return acc;
                }, []);
                break;
        }
        return files
    }

    function getNumberRanges(numbers) {
        let ranges = [];
        let last = numbers[0];
        let start = last;
        for(let i = 1; i < numbers.length; i++) {
            if(numbers[i] - last > 1) {
                ranges.push([start, last]);
                start = numbers[i];
            }
            last = numbers[i];
        }
        ranges.push([start, last]);
        return ranges;
    }

    function nameRanges(ranges) {
        return ranges.map(range => {
            if(range[0] === range[1]) return range[0];
            return `${range[0]}-${range[1]}`;
        }).join(", ");
    }

    function getNameOf(chapters) {
        if(!chapters) return "Unknown";
        if(chapters.length == 1) {
            return `ch ${chapters[0].attributes.chapter}`;
        }
        // todo: check that it's the whole volume
        let isSingleVolume = chapters[0].attributes.volume && chapters.find(t => t.attributes.volume !== chapters[0].attributes.volume) === undefined;
        if(isSingleVolume) {
            return `vol ${chapters[0].attributes.volume}`;
        }

        let chapterNumbers = chapters.map(t => t.attributes.chapter);
        let ranges = getNumberRanges(chapterNumbers);
        return `ch ${nameRanges(ranges)}`;
    }

    function coverForVolumeFromArt(volume, art) {
        if(!volume) volume = "1"
        let cover = art.data.find(t => t.attributes.volume === volume);
        if(!cover) return null;
        return coverUrl(mangaId, cover);
    }

    async function previewItems(selected, groupMode, coverArtMode, format) {
        let files = splitSelectionIntoFiles(selected, groupMode);
        // const author = relationships.find(t => t.type === "author").attributes.name || "Unknown";
        let items: {
            cover: string;
            title: string;
            chapters: string[]
        }[] = [];

        switch(coverArtMode) {
            case CoverArt.FirstPage:
                items = await Promise.all(files.map(async file => {
                    let urls = await getURLs(file[0])
                    console.log(file, urls)
                    return {
                        title: `${title} - ${getNameOf(file)}.${format}`,
                        chapters: file.map(chapter => `${chapter.attributes.chapter}`),
                        cover: imageproxy + urls.urls[0]
                    };
                }));
                break;
            case CoverArt.AutoVolume:
                let art = await list;
                items = await Promise.all(files.map(async file => {
                    let cover = coverForVolumeFromArt(file[0].attributes.volume, art);
                    if(!cover) {
                        cover = imageproxy + (await getURLs(file[0])).urls[0];
                    }
                    return {
                        title: `${title} - ${getNameOf(file)}.${format}`,
                        chapters: file.map(chapter => `${chapter.attributes.chapter}`),
                        cover,
                    };
                }));
        }
        return items
    }

    async function downloadMulti() {
        if(!selected.length) return;

        // @ts-ignore
        if(window.goatcounter) window.goatcounter.count({
            path: window.location.pathname + "/download",
            title: "Download " + title,
        });
        else console.warn("Page change; GoatCounter not loaded (yet?)", window.location.pathname);

        let files = splitSelectionIntoFiles(selected, group);
        const author = relationships.find(t => t.type === "author").attributes.name || "Unknown";
        let art = coverArt == CoverArt.AutoVolume ? await list : null;

        for(let file of files) {
            let name = `${title} - ${getNameOf(file)}`;
            const stream = streamSaver.createWriteStream(`${name}.${format}`, {
                writableStrategy: undefined, // (optional)
                readableStrategy: undefined,  // (optional)
            });
            const generator = new generators[format]({
                file: stream,
                id: window.location.toString(),
                language: file[0].attributes.translatedLanguage,
                updatedAt: file.map(t => t.attributes.updatedAt).sort((a, b) => a - b)[0],
                title: name,
                author,
                coverUrl: art && coverForVolumeFromArt(file[0].attributes.volume, art),
                chapters: file.map(chapter => ({
                    id: chapter.id,
                    title: chapter.attributes.title,
                    number: chapter.attributes.chapter,
                    volume: chapter.attributes.volume
                }))
            });
    
            console.log(generator);
            queue.push(generator);
        }
        queue = queue;
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

    var scrollY = 0, innerHeight = 1;

    let additionalImages = [];
    let alReadProgress

    $: if(anilistData) anilistData.then(data => {
        if(data && data.bannerImage && !additionalImages.find(t => t.src === data.bannerImage)) {
            additionalImages.push({
                src: data.coverImage.large,
                alt: "Cover image from anilist",
                height: 1,
                width: 1
            });
            additionalImages.push({
                src: data.bannerImage,
                alt: "Banner image from anilist",
                height: 1,
                width: 3
            });
            additionalImages = additionalImages;
            alReadProgress = data.mediaListEntry?.progress;
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
        chapters = await getMangaChapters(mangaId, languages, order);
        await tick();
        loadingNextPage = false;
        swiper.slideToClosest();
    }

    $: if(!loadingNextPage && chapters && chapters.data.length < chapters.total && scrollY > 300 && scrollY > document.body.scrollHeight * 0.8) loadNextPage();

    var selectedCharacter = null;

    $: if(!selectedImage) selectedCharacter = null;

    let expanded = false;

    let uniqueChapterCount;
    $: uniqueChapterCount = chapters?.data.filter((t, i, a) => a.findIndex(t2 => Math.floor(t2.attributes.chapter) === Math.floor(t.attributes.chapter)) === i).length;

    let list: Promise<{ data: {
        id: string,
        type: string,
        attributes: {
            fileName: string,
            volume: string,
        }
    }[] }>;
    $: list = request(
        "cover?limit=50&manga[]=" + mangaId + languages.map(t => "&locales[]=" + t).join("")
    );

    function toggleLang(lang) {
        return () => {
            if(languages.includes(lang)) {
                languages = languages.filter(t => t !== lang);
            } else {
                languages.push(lang);
                languages = languages;
            }
        }
    }

    let coverArt: CoverArt = CoverArt.FirstPage;
    let group: Group = Group.Single;

    let downloadPreview = false;

    $: console.log("order", order)
</script>

<svelte:window on:beforeunload={beforeUnload} bind:innerWidth={width} bind:scrollY bind:innerHeight />

<svelte:head>
    <title>{title} - Chapter list</title>
	<meta name="description" content="Read {title} online, or download it as EPUB or CBZ file. Free of charge as well as free of ads." />
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


<main class:smallScreenMode>
    <div class="header">
        {#if anilistData} {#await anilistData then data}
            {#if data && data.bannerImage}
                <div class="banner-container">
                    <img class="banner" src={data.bannerImage} on:click={() => selectedImage = data.bannerImage} alt="">
                    <div class="fader"></div>
                </div>
            {/if}
        {/await} {/if}
        
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
                <ExpandableDescription source={manga.description.en} bind:expanded />
            </div>
        {/if}
    
        {#if manga.tags}
            <div class="tags" class:expanded>
                {#each manga.tags as tag}
                    <span class="tag">{tag.attributes.name.en || tag.attributes.name.jp || Object.values(tag.attributes.name)[0]}</span>
                {/each}
            </div>
        {/if}

        <div class="langs">
            {#each manga.availableTranslatedLanguages as lang}
                <button class:enabled={languages.includes(lang)} on:click={toggleLang(lang)}>
                    {lang}
                </button>
            {:else}
                No languages available
            {/each}
        </div>
    
        <div class="flex">
            <div class="linklist">
                {#if anilistData && isLogedIn()} {#await anilistData then data}
                <a href="{data.siteUrl}" target="_blank" rel="noreferrer">
                    AL:
                    {#if data?.mediaListEntry?.status}{({
                        CURRENT: "Reading",
                        PLANNING: "Plan to read",
                        COMPLETED: "Completed",
                        DROPPED: "Dropped",
                        PAUSED: "Paused",
                        REPEATING: "Repeating"
                    }[data.mediaListEntry.status])}
                    CH {data.mediaListEntry.progress}/{data.chapters || "-"} ({uniqueChapterCount})
                    {:else}
                        Not tracking
                    {/if}
                </a>
                {/await} {/if}
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
    </div>

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
                {#if queue && queue.length > 0}
                    <p><i>{queue.length} downloads queued.</i></p>
                {/if}
                
                <div class="download">
                    <div class="status">
                        <div class="state {state}">
                            <div class="progress" style="width: {progress * 100}%;"></div>
                    
                            <p>
                                {text}
                            </p>
                        </div>
                        <div>
                            <button class="download-btn" disabled={!selected.length} on:click={downloadMulti}>Download</button>
                            <button disabled={!selected.length && !downloadPreview} on:click={() => downloadPreview = !downloadPreview}>{downloadPreview ? "Hide" : "Show"} preview</button>
                        </div>
                    </div>
                    <div class="options">
                        <fieldset>
                            <legend>Format</legend>
    
                            <label>
                                <input type="radio" name="format" value={Format.Cbz} bind:group={format}>
                                <b>.<abbr title="Comic Book Zip">cbz</abbr></b>
                            </label>
                            <label>
                                <input type="radio" name="format" value={Format.Epub} bind:group={format}>
                                <b>.<abbr title="Electronic Publication">epub</abbr></b>
                            </label>
                        </fieldset>
                        <fieldset>
                            <legend>Cover art</legend>
    
                            <label>
                                <input type="radio" name="cover" value={CoverArt.FirstPage} bind:group={coverArt}>
    
                                First page
                            </label>
                            <label>
                                <input type="radio" name="cover" value={CoverArt.AutoVolume} bind:group={coverArt}>
    
                                From art, by volume
                            </label>
                        </fieldset>
                        <fieldset>
                            <legend>Split files</legend>
    
                            <label>
                                <input type="radio" name="group" value={Group.Single} bind:group={group}>
    
                                Single file
                            </label>
                            <label>
                                <input type="radio" name="group" value={Group.Chapter} bind:group={group}>
    
                                By chapter
                            </label>
                            <label>
                                <input type="radio" name="group" value={Group.Volume} bind:group={group}>
    
                                By volume
                            </label>
                        </fieldset>
                    </div>
                    <p class="note">Splitting into multiple files may require browser permission.</p>

                    {#if downloadPreview}
                        <h3>Preview</h3>

                        <ShowTypeChooser />

                        {#await previewItems(selected, group, coverArt, format)}
                            <div>Loading preview...</div>
                        {:then items}
                            <FileItems chapters={items} />
                        {/await}
                    {/if}
                </div>

                <div class="flex">
                    <p>
                        <b>
                            Do not close the tab when a download is in progress.
                        </b>
                    </p>
                    <div>
                        <button on:click={() => order = order == ChapterOrder.Asc ? ChapterOrder.Desc : ChapterOrder.Asc}>
                            {order === ChapterOrder.Desc ? "Newest first" : "Oldest first"}
                        </button>
                        <button on:click={selectAll}>
                            {#if chapters && chapters.data.length && arraysEqual(selected, chapters.data)}
                                Deselect all
                            {:else}
                                Select all
                            {/if}
                        </button>
                    </div>
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
                                <Chapter read={alReadProgress && alReadProgress >= parseInt(chapter.attributes.chapter)} progress={(progressMap.get(chapter.id) || 0) / chapter.attributes.pages} {chapter} disabledDownload={!!progress} selected={selected.includes(chapter)} on:select={() => select(chapter)} />
                            {/each}
                        </tbody>
                    </table>
                {/if}
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div class="art-list" style="min-height: 30rem;">
                <ArtList {mangaId} {list} bind:selectedImage additionalList={additionalImages} />
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div class="more-info" style="min-height: 30rem;">
                <div class="flex-wrapped" style="margin-bottom: 0.5rem;">
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
                                <a target="_blank" href="https://anilist.co/manga/{manga.links.al}"><Favicon url="https://anilist.co" /> Anilist</a> <br>
                            {/if}
                            <a target="_blank" href="https://mangadex.org/title/{mangaId}"><Favicon url="https://mangadex.org"/> Mangadex.org</a> <br>
                            {#if manga.links.ap}
                                <a target="_blank" href="https://www.anime-planet.com/manga/{manga.links.ap}"><Favicon url="https://anime-planet.com" /> Animeplanet</a> <br>
                            {/if}
                            {#if manga.links.bw}
                                <a target="_blank" href="https://bookwalker.jp/{manga.links.bw}"><Favicon url="https://bookwalker.jp" /> Bookwalker</a> <br>
                            {/if}
                            {#if manga.links.mu}
                                <a target="_blank" href="https://www.mangaupdates.com/series.html?id={manga.links.mu}"><Favicon url="https://www.mangaupdates.com" /> Manga updates</a> <br>
                            {/if}
                            {#if manga.links.nu}
                                <a target="_blank" href="https://www.novelupdates.com/series/{manga.links.nu}"><Favicon url="https://www.novelupdates.com" /> Novel updates</a> <br>
                            {/if}
                            {#if manga.links.amz}
                                <a target="_blank" href={manga.links.amz}><Favicon url={manga.links.amz} /> Amazon</a> <br>
                            {/if}
                            {#if manga.links.ebj}
                                <a target="_blank" href={manga.links.ebj}><Favicon url={manga.links.ebj} /> Ebookjapan</a> <br>
                            {/if}
                            {#if manga.links.mal}
                                <a target="_blank" href="https://myanimelist.net/manga/{manga.links.mal}"><Favicon url="https://myanimelist.net" /> MyAnimeList</a> <br>
                            {/if}
                            {#if manga.links.cdj}
                                <a target="_blank" href="{manga.links.cdj}"><Favicon url={manga.links.cdj} /> CDJapan</a> <br>
                            {/if}
                            {#if manga.links.raw}
                                <a target="_blank" href="{manga.links.raw}"><Favicon url={manga.links.raw} /> RAW</a> <br>
                            {/if}
                            {#if manga.links.engtl}
                                <a target="_blank" href="{manga.links.engtl}"><Favicon url={manga.links.engtl} /> engtl</a> <br>
                            {/if}
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
    .linklist {
        margin: 0 1rem;
    }
    .langs {
        display: flex;
        margin: 0 1rem;
        overflow-x: auto;
    }
    .langs button {
        padding: 0.5rem;
        border-radius: 5px;
        background: rgb(64,64,64);
        color: white;
        border: none;
        cursor: pointer;

        margin: 5px;
        padding: 5px;
    }
    .langs button.enabled {
        background: rgb(107, 107, 107);
    }
    .header {
        position: relative;
        padding-top: 5rem;
        overflow: hidden;
    }
    .art-list {
        margin: 1rem 2rem 1rem 1rem;
    }
    .chapter-list {
        margin: 1rem;
    }
    .more-info {
        margin: 1rem 2rem 1rem 1rem;
    }
    .characters {
        margin: 1rem;
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
        margin: 0 1rem;
        position: relative;
        z-index: 1;
    }
    .tags.expanded {
        flex-wrap: wrap;
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
        position: relative;
        z-index: 1;
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
        margin-top: -5rem;
        width: 100%;
        max-height: 100%;
        position: absolute;
        z-index: 0;
        user-select: none;
    }
    .banner {
        width: 100%;
        max-height: 100%;
        height: 100%;
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
        background: rgb(64,64,64);
        border-radius: 5px 0 5px 5px;
    }
    :global(.dark main > .copyright.copyright.copyright) {
        background: rgb(64, 64, 64);
    }
    .copyright-header {
        background: rgb(64,64,64);
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
    main {
        font-size: 1.1rem;
        position: relative;
        z-index: 1;
        
        padding: 0 0 1rem 0;
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
        padding: 10px;
        position: relative;
        transition: all .3s;
        flex-grow: 1;
    }
    :global(.dark .state) {
        color: black;
    }
    .download .status {
        display: flex;
        gap: 1rem;
    }
    .download .options {
        display: flex;
        gap: 1rem;
    }
    .download .note {
        font-size: 0.8rem;
        color: rgb(175, 175, 175);
    }

    .state.idle {
        background: transparent;
        color: white;
    }

    .state.active {
        background: rgb(255, 255, 81);
    }
    .state.error {
        background: rgb(255, 103, 103);
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
        background: rgba(255,255,255, .1);
    }
</style>
