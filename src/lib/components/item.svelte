<script lang="ts">
    import SvelteMarkdown from "svelte-markdown";
    import { flip } from "svelte/animate";
    import { blur, crossfade } from "svelte/transition";
    import { showNsfw } from "./showNsfwChooser.svelte";
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

    const [send, receive] = crossfade({
        fallback: blur
    });
</script>

<div on:click class="item" class:grid={$showType == "grid"} class:comfortable={$showType == "comfortable"} class:coverOnly={$showType == "cover-only"} class:list={$showType == "list"}>
    <div class="flex" class:r18={r18 && $showNsfw !== "show"}>
        {#if cover}
            <div class="cover-container" width={coverWidth} height={coverHeight}>
                <img class="cover" style="{coverColor ? "--box-shadow-color: " + coverColor : ""}" draggable="false" src="{cover}" alt="{title}" {title} width={coverWidth} height={coverHeight}>
                {#if $showType == "grid"}
                    <div class="over" in:send={{ key: title }} out:receive={{ key:title }}>
                        {title}
                    </div>
                {/if}
            </div>
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
                <p class="description"><SvelteMarkdown source={description} isInline /></p>
            {/if}
        </div>
    </div>
    <div class="comfortable-div" class:hiding={$showType !== "comfortable"}>
        {#if $showType == "comfortable"}
            <span in:send={{ key: title }} out:receive={{ key: title }}>
                {title}
            </span>
        {/if}
    </div>
</div>

<style>
    .item {
        color: white;
    }
    .description {
        line-height: 1.5rem;
        height: calc(1.5rem * 3);
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .item.grid {
        height: 100%;
    }
    h3 {
        margin: 0;
    }
    .r18 img {
        filter: blur(10px);
        /* filter transition applied on the image later */
    }
    .item:hover .r18 img {
        filter: blur(0);
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
        height: 100%;
    }
    .cover-container {
        position: relative;
    }
    .list .cover-container {
        flex-shrink: 0;
    }
    .over {
        display: -webkit-box;
        position: absolute;
        visibility: visible;
        bottom: 0;
        left: 0;
        width: 100%;
        line-height: 1.5rem;
        max-height: calc(2rem + 2*1.4rem);
        overflow: hidden;
        text-overflow: ellipsis;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.7) 100%);
        color: white;
        padding: 1.5rem 0.5rem 0.5rem 0.5rem;
        border-radius: 5px;
        user-select: initial;
        opacity: 1;
        transition: .3s opacity;
    }
    .comfortable-div {
        user-select: initial;
        opacity: 1;
        transition: .3s opacity;
        line-height: 1.5rem;
        display: -webkit-box;
        max-height: calc(2rem + 3*1.4rem);
        overflow: hidden;
        text-overflow: ellipsis;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        transition: max-height .3s ease;
    }
    .comfortable-div span {
        display: block;
        width: 100%;
    }
    .comfortable-div.hiding {
        max-height: 0;
    }
	.item img {
        --box-shadow-color: white;
		border-radius: 5px;
        max-width: 100%;
        max-height: 100%;
        height: 100%;
        width: auto;
        object-fit: cover;
		box-shadow: 0 0 0 var(--box-shadow-color);
		transition: .4s box-shadow, .3s max-height, .4s filter;
	}
    .item.list img.cover {
        max-height: 8rem;
    }
	.item:hover img {
		box-shadow: 0 0 20px var(--box-shadow-color);
	}
</style>