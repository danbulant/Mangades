<script lang="ts">
    import request, { imageproxy } from "$lib/util/request";

    export var mangaId: string;
    export var additionalList: {
        alt: string;
        src: string;
        width?: number;
        height?: number;
        color?: string;
    }[] = [];

    let list: any;
    $: list = request("cover?manga[]=" + mangaId + "&locales[]=en&locales[]=uk&locales[]=ja");

    export var selectedImage = null;
</script>

<div>
    {#await list}
        Loading art
    {:then list}
        {#each list.data.sort((a, b) => a.attributes.volume - b.attributes.volume) as item}
            <img on:click={() => selectedImage = `${imageproxy}https://uploads.mangadex.org/covers/${mangaId}/${item.attributes.fileName}.512.jpg`} width=512 height=805 src="{imageproxy}https://uploads.mangadex.org/covers/{mangaId}/{item.attributes.fileName}.512.jpg" alt="" draggable={false}>
        {/each}
    {/await}
    {#each additionalList as item}
        <img on:click={() => selectedImage = item.src} style="{item.color ? "--box-shadow-color: " + item.color : ""};" width={item.width} height={item.height} src="{item.src}" alt="{item.alt}" draggable={false}>
    {/each}
</div>
    
<style>
    div {
        display: grid;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: start;
        align-items: start;
        grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
    }
    div img {
        border-radius: 5px;
        height: 10rem;
        width: auto;
        --box-shadow-color: white;
        box-shadow: 0 0 0 0 var(--box-shadow-color);
        transition: box-shadow 0.2s ease-in-out;
    }
    div img:first-child {
        grid-column: 1 / span 2;
        grid-row: 1 / span 2;
        height: 20rem;
    }
    div img:hover, div img:active, div img:focus {
        box-shadow: 0 0 0.5rem var(--box-shadow-color);
    }
</style>