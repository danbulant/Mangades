<script>
    import request from "../util/request";

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
            <img on:click={() => selectedImage = `https://uploads.mangadex.org/covers/${mangaId}/${item.attributes.fileName}.512.jpg`} width=512 height=805 src="https://uploads.mangadex.org/covers/{mangaId}/{item.attributes.fileName}.512.jpg" alt="" draggable={false}>
        {/each}
    {/await}
</div>
    
<style>
    div {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: start;
        align-items: start;
    }
    div img {
        border-radius: 5px;
        height: 10rem;
        width: auto;
    }
</style>