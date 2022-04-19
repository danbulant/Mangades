<script>
    import { url } from "@roxi/routify";

    import request from "../../util/request";

    export var manga;

    function getManga(id) {
        if(!id) return;
        return request("manga/" + id + "?includes[]=author&includes[]=cover_art&includes[]=artist");
    }
    var mangaData = getManga(manga);
    $: mangaData = getManga(manga);
    console.log("mangadata", mangaData);
    $: mangaData.then(t => console.log("manga data", t));

    const blocked = ["227e3f72-863f-46f9-bafe-c43104ca29ee", "b0b721ff-c388-4486-aa0f-c2b0bb321512"];
</script>
<svelte:head>
    {#if blocked.includes(manga)}
        <title>Content blocked - Mangadex search</title>
    {/if}
</svelte:head>

{#if blocked.includes(manga)}
    <main>
        <a href={$url("..")}>Search</a>
        <h1>
            Content blocked.
        </h1>
        
        <p>
            I'm sorry, but I received a DMCA take down for this manga, so just to be safe I disabled it. Content might be available directly on <a href="https://mangadex.org">Mangadex</a> which I'm embedding it from (so in my good faith, I don't think I'm breaking copyright).    
        </p>
        <p>
            I don't host any of the content shown in this page.
        </p>
    </main>
{:else}
    {#await mangaData}
        loading...
    {:then manga}
        {#if manga}
            <slot scoped={({ manga: manga.data.attributes, mangaRelationships: manga.data.relationships, id: manga.data.id })} />
        {:else}
            Manga not found.
        {/if}
    {/await}
{/if}