<script>
    import request from "../../util/request";

    export var manga;

    function getManga(id) {
        if(!id) return;
        return request("manga/" + id);
    }
    var mangaData = getManga(manga);
    $: mangaData = getManga(manga);
    console.log(mangaData);
</script>

{#await mangaData}
    loading...
{:then manga}
    {#if manga}
        <slot scoped={({ manga: manga.data.attributes, mangaRelationships: manga.relationships, id: manga.data.id })} />
    {:else}
        Manga not found.
    {/if}
{/await}