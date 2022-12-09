<script>
    import request, { imageproxy } from "$lib/util/request";

    export var mangaId;

    let list;
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
    }
    div img:first-child {
        grid-column: 1 / span 2;
        grid-row: 1 / span 2;
        height: 20rem;
    }
</style>