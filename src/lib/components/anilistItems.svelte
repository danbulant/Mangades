<script>
    import { goto } from "$app/navigation";
    import request from "../util/request";

    export var entries;
    export var itemsList;

    var isLoading = false;
    async function find(entry) {
        isLoading = true;
        var query = new URLSearchParams();
        query.set("title", entry.media.title.romaji);
        query.set("limit", 20);
        console.log(entry);
        let result;
        try {
            result = await request("manga", query);
        } catch(e) {
            console.error(e);
            isLoading = false;
            alert("Failed to search mangadex.");
            return;
        }
        console.log(result.data);
        let item = result.data.find(t => t.attributes.links.al === entry.media.id.toString());
        if(!item) item = result.data.find(t => t.attributes.title.en?.toLowerCase() === entry.media.title.english.toLowerCase());
        if(!item) item = result.data.find(t => t.attributes.title.ja?.toLowerCase() === entry.media.title.native.toLowerCase());
        if(!item) item = result.data.find(t => t.attributes.altTitles.find(t => Object.values(t).find(t => t.toLowerCase() === entry.media.title.native.toLowerCase())));
        console.log(item);
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

<div class="items" class:items-list={itemsList}>
    {#each entries.sort((a, b) => a.priority - b.priority) as entry}
        <div class="item" class:r18={entry.media.isAdult} on:click={() => find(entry)}>
            <div class="flex">
                <img src={entry.media.coverImage.large} width=100 height=142 alt="{entry.media.title.userPreferred}" title="{entry.media.title.userPreferred}">
                <div class="info">
                    <h3>{entry.media.title.userPreferred}</h3>
                    <span>[{entry.progress}/{entry.media.chapters || "?"}]</span> <br>
                    <span>{entry.score || "?"}/10</span>
                    {#if entry.notes}
                        <p>{entry.notes}</p>
                    {/if}
                </div>
            </div>
        </div>
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
    }
    h3 {
        margin: 0;
    }
	.items {
		display: grid;
  		align-items: center;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
	}
	.items-list.items {
		grid-template-columns: 1fr;
	}
    .items-list .item img {
        height: 10rem;
    }
    .r18 img {
        filter: blur(10px);
    }
    .info {
        display: none;
        opacity: 0;
        transition: .2s opacity;
    }
    .items-list .info {
        display: block;
        opacity: 1;
    }
    .flex {
        display: flex;
        gap: 1rem;
    }
	.item img {
		border-radius: 5px;
		height: 15rem;
		width: auto;
		box-shadow: 0 0 0 white;
		transition: .4s box-shadow, .3s height;
	}
	@media(prefers-reduced-motion) {
		.item img, .item:hover img {
			box-shadow: none;
		}
	}
	.item:hover img {
		box-shadow: 0 0 10px grey;
	}
</style>