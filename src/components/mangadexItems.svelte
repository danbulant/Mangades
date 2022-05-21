<script>
    import SvelteMarkdown from "svelte-markdown";
    export var entries;
    export var itemsList;

    $: console.log(entries);

    function open(entry) {}
</script>


<div class="items" class:items-list={itemsList}>
    {#each entries as entry}
        <a href="/{entry.id}" class="item" class:r18={!["safe", "ecchi"].includes(entry.attributes.contentRating)} on:click={() => open(entry)}>
            <div class="flex">
                {#if entry.relationships.find(t => t.type === "cover_art")}
                    <img class="cover" draggable="false" src="https://cors-anywhere.danbulant.workers.dev/?https://uploads.mangadex.org/covers/{entry.id}/{entry.relationships.find(t => t.type === "cover_art").attributes.fileName}.512.jpg" alt="" on:click={() => selectedImage = `https://cors-anywhere.danbulant.workers.dev/?https://uploads.mangadex.org/covers/${mangaId}/${relationships.find(t => t.type === "cover_art").attributes.fileName}.512.jpg`}>
                {:else}
                    Broken art
                {/if}
                <div class="info">
                    <h3>{entry.attributes.title.en || entry.attributes.title.ja || Object.values(entry.attributes.title)[0]}</h3>
                    {#if entry.attributes.lastChapter}
                        <span>CH {entry.attributes.lastChapter}</span>
                    {/if}
                    {#if entry.attributes.lastVolume}
                        <span>vol {entry.attributes.lastVolume}</span>
                    {/if}
                    {#if entry.attributes.description.en}
                        <p><SvelteMarkdown source={entry.attributes.description.en} isInline /></p>
                    {/if}
                </div>
            </div>
        </a>
    {/each}
</div>


<style>
    a {
        color: black;
    }
    a:hover {
        color: black;
        text-decoration: none;
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