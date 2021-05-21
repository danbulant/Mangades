<script>
    import { title } from "process";
import request from "../../util/request";

    export var scoped;

    var mangaId = scoped.id;
    $: mangaId = scoped.id;
    var manga = scoped.manga;
    $: manga = scoped.manga;

    async function getMangaChapters(id) {
        const data = await request("manga/" + id + "/feed");
        data.results.sort((a, b) => a.data.attributes.chapter - b.data.attributes.chapter);
        return data;
    }

    var chapters = getMangaChapters(mangaId);
    $: chapters = getMangaChapters(mangaId);

    console.log(manga);
    console.log(chapters);
</script>

<svelte:head>
    <title>Chapters of {manga.title.en}</title>
</svelte:head>

<main>
    <h1>{manga.title.en}</h1>

    {#await chapters}
        Loading chapters...
    {:then chapters}
        <ol class="hide-nums">
           {#each chapters.results as chapter} 
                <li>{chapter.data.attributes.volume ? "Vol " + chapter.data.attributes.volume : ""} Chapter {chapter.data.attributes.chapter} {chapter.data.attributes.title}</li>
           {/each}
        </ol>
    {/await}
</main>

<style>
    .hide-nums {
        list-style-type: disc;
    }
</style>