<script>
    import { imageproxy } from "$lib/util/request";
    import Item from "./item.svelte";
    import { showType } from "./showTypeChooser.svelte";

    export var entries;
</script>


<div class="items" class:list={$showType == "list"}>
    {#each entries as entry (entry.id)}
        <a href="/{entry.id}">
            <Item
                r18={!["safe", "suggestive"].includes(entry.attributes.contentRating)}
                cover={imageproxy + entry.relationships.find(t => t.type === "cover_art") ? `https://uploads.mangadex.org/covers/${entry.id}/${entry.relationships.find(t => t.type === "cover_art").attributes.fileName}.512.jpg` : null}
                title={entry.attributes.title.en || entry.attributes.title.ja || Object.values(entry.attributes.title)[0]}
                lastChapter={entry.attributes.lastChapter}
                lastVolume={entry.attributes.lastVolume}
                description={entry.attributes.description.en}
                />
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