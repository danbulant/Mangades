<script>
    import request from "../../../util/request";

    export var scoped;
    export var chapter;

    var mangaId = scoped.id;
    $: mangaId = scoped.id;
    var manga = scoped.manga;
    $: manga = scoped.manga;

    async function getChapter(id) {
        if(chapterData && chapterData.id === id) return chapterData;
        const data = await request("chapter/" + id);
        console.log(data.data);
        return data.data;
    }

    var chapterData = getChapter(chapter);
    $: chapterData = getChapter(chapter);

    async function getAtHome(id) {
        if(chapterData && chapterData.id === id) return atHome;
        const data = await request("at-home/server/" + id);
        console.log(data);
        return data;
    }

    var atHome = getAtHome(chapter);
    $: atHome = getAtHome(chapter);
</script>

{#await Promise.all([chapterData, atHome])}
    Loading data...
{:then [chapterData, atHome]}
    <slot scoped={({ manga, mangaId, id: chapter, chapter: chapterData, atHome })} />
{/await}