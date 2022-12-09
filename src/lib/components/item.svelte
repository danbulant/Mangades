<script lang="ts">
    import SvelteMarkdown from "svelte-markdown";
    import { showType } from "./showTypeChooser.svelte";

    export var r18: boolean = false;
    export var cover: string | null = null;
    export var title: string;
    export var lastChapter: string | null = null;
    export var chapterProgress: string | null = null;
    export var lastVolume: string | null = null;
    export var volumeProgress: string | null = null;
    export var description: string | null = null;
    export var score: string | null = null;
    export var coverWidth: number | null = null;
    export var coverHeight: number | null = null;

    export var coverColor: string | null = null;
</script>

<div class="item" class:grid={$showType == "grid"} class:comfortable={$showType == "comfortable"} class:coverOnly={$showType == "cover-only"} class:list={$showType == "list"}>
    <div class="flex" class:r18 on:click>
        {#if cover}
            <img class="cover" style="{coverColor ? "--box-shadow-color: " + coverColor : ""}" draggable="false" src="{cover}" alt="{title}" {title} width={coverWidth} height={coverHeight}>
        {:else}
            Broken art
        {/if}
        <div class="info">
            <h3>{title}</h3>
            {#if lastChapter || chapterProgress}
                <span>CH {chapterProgress ? chapterProgress + "/" : ""}{lastChapter || "?"}</span>
            {/if}
            {#if lastVolume || volumeProgress}
                <span>vol {volumeProgress ? volumeProgress + "/" : ""}{lastVolume}</span>
            {/if}
            {#if score}
                <span>{score}/10</span>
            {/if}
            {#if description}
                <p><SvelteMarkdown source={description} isInline /></p>
            {/if}
        </div>
    </div>
</div>

<style>
    .list .item img {
        height: 10rem;
    }
    h3 {
        margin: 0;
    }
    .r18 img {
        filter: blur(10px);
    }
    .info {
        display: none;
        opacity: 0;
        transition: .2s opacity;
    }
    .list .info {
        display: block;
        opacity: 1;
    }
    .flex {
        display: flex;
        gap: 1rem;
    }
	.item img {
        --box-shadow-color: white;
		border-radius: 5px;
		height: 15rem;
		width: auto;
		box-shadow: 0 0 0 var(--box-shadow-color);
		transition: .4s box-shadow, .3s height;
	}
	@media(prefers-reduced-motion) {
		.item img, .item:hover img {
			box-shadow: none;
		}
	}
	.item:hover img {
		box-shadow: 0 0 20px var(--box-shadow-color);
	}
</style>