<script>
    import { goto, preloadData } from "$app/navigation";
    import { flip } from "svelte/animate";
    import { blur, crossfade } from "svelte/transition";
    import request, { imageproxy } from "../util/request";
    import Item from "./item.svelte";
    import { showType } from "./showTypeChooser.svelte";
    import { quintOut } from "svelte/easing";
    import { sleep } from "$lib/util/ratelimit";
    import { logs } from "$lib/util/logs";

    export var lists;

    let isLoading = false;
    let selectedEntry;
    async function find(entry) {
        selectedEntry = entry;
        isLoading = true;
        if(typeof localStorage !== "undefined") {
            let cache = localStorage.getItem("anilist-mangadex-" + entry.media.id);
            if(cache) {
                setTimeout(() => goto("./" + cache), 300);
                return;
            }
        }
        let sleeping = sleep(350);
        var query = new URLSearchParams();
        query.set("title", entry.media.title.romaji);
        query.append("contentRating[]", "safe");
        query.append("contentRating[]", "suggestive");
        query.append("contentRating[]", "erotica");
        query.append("contentRating[]", "pornographic");
        query.append("order[relevance]", "desc");
        query.set("limit", 20);
        console.log("anilist entry", entry, query.toString());
        let result;
        try {
            result = await request("manga", query);
        } catch(e) {
            console.error(e);
            // $logs.push({ type: 'error', text: "Failed to search mangadex." });
            // $logs = $logs;
            // await sleeping;
            // isLoading = false;
            alert("Failed to search mangadex.");
            location.reload()
            return;
        }
        console.log("anilist mangadex data", result.data);
        let item = result.data.find(t => t.attributes.links && t.attributes.links.al === entry.media.id.toString());
        if(!item && entry.media.title.english) item = result.data.find(t => t.attributes.title.en?.toLowerCase() === entry.media.title.english.toLowerCase());
        if(!item && entry.media.title.native) item = result.data.find(t => t.attributes.title.ja?.toLowerCase() === entry.media.title.native.toLowerCase());
        if(!item && entry.media.title.native) item = result.data.find(t => t.attributes.title.en?.toLowerCase() === entry.media.title.romaji.toLowerCase() || t.attributes.title.ja?.toLowerCase() === entry.media.title.romaji.toLowerCase());
        if(!item) item = result.data.find(t => Object.values(t.attributes.title).find(t => Object.values(entry.media.title).filter(t => t).map(t => t.toLowerCase()).includes(t.toLowerCase())));
        if(!item) item = result.data.find(t => t.attributes.altTitles.find(t => Object.values(t).find(t => Object.values(entry.media.title).filter(t => t).map(t => t.toLowerCase()).includes(t.toLowerCase()))));
        console.log("anilist mangadex item", item);
        if(!item) {
            // $logs.push({ type: 'error', text: `Couldn't find any mangadex entry.` });
            // $logs = $logs;
            // await sleeping;
            // isLoading = false;
            alert("Couldn't find any mangadex entry.");
            location.reload()
            return
        }
        if(typeof localStorage !== "undefined") {
            localStorage.setItem("anilist-mangadex-" + entry.media.id, item.id);
        }
        try {
            await preloadData('./' + item.id);
            await sleeping;
            await goto("./" + item.id);
        } catch(e) {
            console.error(e)
            alert("Failed to open, please try again later.");
        }
        isLoading = false;
    }
    
    $: console.log(selectedEntry)

    const [send, receive] = crossfade({
        duration: 300,
        easing: quintOut
    });
</script>

{#if isLoading}
    <dialog open>
        {#if selectedEntry.media.bannerImage}
            <div class="banner-container">
                <img class="banner" src={selectedEntry.media.bannerImage} alt="">
                <div class="fader"></div>
            </div>
        {/if}

        <div class="infoflex">
            {#if selectedEntry.media.coverImage.large}
                <div class="cover-container" in:send={{ key: selectedEntry.media.id }}>
                    <img class="cover" class:r18={selectedEntry.media.isAdult} draggable="false" src="{selectedEntry.media.coverImage.large}" alt="" >
                    <img class="cover-backdrop" draggable="false" src="{selectedEntry.media.coverImage.large}" alt="">
                </div>
            {/if}
            <div class="info">
                <h1>{selectedEntry.media.title.userPreferred}</h1>
    
                <h3>
                    {#if selectedEntry.media.startDate?.year}
                        {selectedEntry.media.startDate.year} &middot;
                    {/if}
                    {#if selectedEntry?.status} {selectedEntry.status} &middot; {/if}
                    {selectedEntry.media.isAdult ? 'adult' : 'safe/suggestive'}
                </h3>
            </div>
        </div>
        
        <div class="loading">
            Loading...
        </div>
    </dialog>
{:else}
<!-- This has to be in `if` to trigger the out transition -->
    <div class="items" class:list={$showType === "list"}>
        {#each lists as list}
            <h2>{list.name}</h2>
            {#each list.entries.sort((a, b) => a.priority - b.priority) as entry (entry.media.id)}
                <div class="h-full" animate:flip in:blur out:receive={{ key: entry.media.id }}>
                    <Item
                        r18={entry.media.isAdult}
                        cover={entry.media.coverImage.large}
                        title={entry.media.title.userPreferred}
                        lastChapter={entry.media.chapters}
                        chapterProgress={entry.progress}
                        score={entry.score || "?"}
                        description={entry.notes}
                        coverColor={entry.media.coverImage.color === "null" ? null : entry.media.coverImage.color}
                        on:click={() => find(entry)}
                        />
                </div>
            {/each}
        {/each}
    </div>
{/if}

<style>
    dialog {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 100;
        background: black;
        color: white;
        border: none;
        padding: 0;
    }
    .loading {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .infoflex {
        display: flex;
        align-items: center;
        margin: calc(5rem + 15px) calc(1rem + 15px);
        justify-content: start;
        gap: 1rem;
        z-index: 1;
        position: relative;
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
        position: absolute;
        z-index: 0;
        user-select: none;
    }
    .banner {
        width: 100%;
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
    h2 {
        grid-column: 1 / -1;
        margin: 0;
    }
	.items {
		display: grid;
  		align-items: flex-start;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
	}
	.items.list {
		grid-template-columns: 1fr;
	}
    .h-full {
        height: 100%;
    }
</style>