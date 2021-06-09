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

    const blocked = ["227e3f72-863f-46f9-bafe-c43104ca29ee"];
</script>

{#if blocked.includes(manga)}
    <h1>
        Content blocked.
    </h1>

    I'm sorry, but I received a DMCA take down for this manga, so just to be safe I disabled it. Content might be available directly on <a href="https://mangadex.org">Mangadex</a> which I'm embedding it from (so in my good faith, I don't think I'm breaking copyright).

    I don't host any of the content shown in this page.
{:else}
    {#await mangaData}
        loading...
    {:then manga}
        {#if manga}
            <slot scoped={({ manga: manga.data.attributes, mangaRelationships: manga.relationships, id: manga.data.id })} />
        {:else}
            Manga not found.
        {/if}
    {/await}
{/if}