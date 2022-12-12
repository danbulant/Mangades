<script>
    import { goto } from "$app/navigation";
    import { flip } from "svelte/animate";
    import { blur } from "svelte/transition";
    import request from "../util/request";
    import Item from "./item.svelte";
    import { showType } from "./showTypeChooser.svelte";

    export var lists;

    var isLoading = false;
    async function find(entry) {
        if(typeof localStorage !== "undefined") {
            let cache = localStorage.getItem("anilist-mangadex-" + entry.media.id);
            if(cache) {
                goto("./" + cache);
                return;
            }
        }
        isLoading = true;
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
            isLoading = false;
            alert("Failed to search mangadex.");
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
            alert(`Couldn't find any mangadex entry.`);
            isLoading = false;
            return
        }
        if(typeof localStorage !== "undefined") {
            localStorage.setItem("anilist-mangadex-" + entry.media.id, item.id);
        }
        goto("./" + item.id);
    }
</script>

{#if isLoading}
    <dialog open>
        Finding the manga
    </dialog>
{/if}

<div class="items" class:list={$showType == "list"}>
    {#each lists as list}
        <h2>{list.name}</h2>
        {#each list.entries.sort((a, b) => a.priority - b.priority) as entry (entry.media.id)}
            <div class="h-full" animate:flip transition:blur>
                <Item
                    r18={entry.media.isAdult}
                    cover={entry.media.coverImage.large}
                    title={entry.media.title.userPreferred}
                    lastChapter={entry.media.chapters}
                    chapterProgress={entry.progress}
                    score={entry.score || "?"}
                    description={entry.notes}
                    coverColor={entry.media.coverImage.color == "null" ? null : entry.media.coverImage.color}
                    on:click={() => find(entry)}
                    />
            </div>
        {/each}
    {/each}
</div>

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