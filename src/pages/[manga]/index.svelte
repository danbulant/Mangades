<script>
    import request from "../../util/request";

    export var scoped;

    var mangaId = scoped.id;
    $: mangaId = scoped.id;
    var manga = scoped.manga;
    $: manga = scoped.manga;

    function getMangaChapters(id) {
        return request("manga/" + id + "/feed");
    }

    var chapters = getMangaChapters(mangaId);
    $: chapters = getMangaChapters(mangaId);

    console.log(manga);
    console.log(chapters);
</script>

<main>
    <h1>{manga.title.en}</h1>

    {#await chapters}
        Loading chapters...
    {:then chapters}
        <ol>
           {#each chapters.results as chapter} 
                <li>{chapter.data.attributes.title}</li>
           {/each}
        </ol>
    {/await}
</main>