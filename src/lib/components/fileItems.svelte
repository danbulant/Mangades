<script lang="ts">
    import { flip } from "svelte/animate";
    import { blur } from "svelte/transition";
    import Item from "./item.svelte";
    import { showType } from "./showTypeChooser.svelte";

    export var chapters: {
        cover: string;
        title: string;
        chapters: string[]
    }[];
</script>


<div class="items" class:list={$showType == "list"}>
    {#each chapters as entry (entry.title)}
        <div animate:flip>
            <Item
                cover={entry.cover}
                title={entry.title}
                description="Chapters {entry.chapters.join(", ")}"
                />
        </div>
    {/each}
</div>


<style>
	.items {
		display: grid;
  		align-items: center;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(7rem, 12rem));
	}
	.items.list {
		grid-template-columns: 1fr;
	}
</style>