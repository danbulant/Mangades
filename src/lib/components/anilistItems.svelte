<script>
    import { goto } from "$app/navigation";
    import request from "../util/request";
    import Item from "./item.svelte";
    import { showType } from "./showTypeChooser.svelte";

    export var entries;

    var isLoading = false;
    async function find(entry) {
        isLoading = true;
        var query = new URLSearchParams();
        query.set("title", entry.media.title.romaji);
        query.set("limit", 20);
        console.log("anilist entry", entry);
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
        let item = result.data.find(t => t.attributes.links.al === entry.media.id.toString());
        if(!item) item = result.data.find(t => t.attributes.title.en?.toLowerCase() === entry.media.title.english.toLowerCase());
        if(!item) item = result.data.find(t => t.attributes.title.ja?.toLowerCase() === entry.media.title.native.toLowerCase());
        if(!item) item = result.data.find(t => t.attributes.altTitles.find(t => Object.values(t).find(t => t.toLowerCase() === entry.media.title.native.toLowerCase())));
        console.log("anilist mangadex item", item);
        if(!item) {
            alert(`Couldn't find any mangadex entry.`);
            isLoading = false;
            return
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
    {#each entries.sort((a, b) => a.priority - b.priority) as entry}
        <Item
            r18={entry.media.isAdult}
            cover={entry.media.coverImage.large}
            title={entry.media.title.userPreferred}
            lastChapter={entry.media.chapters}
            chapterProgress={entry.progress}
            score={entry.score || "?"}
            description={entry.notes}
            coverColor={entry.media.coverImage.color == "null" ? null : entry.media.coverImage.color}
            />
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
	.items {
		display: grid;
  		align-items: center;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
	}
	.items.list {
		grid-template-columns: 1fr;
	}
</style>