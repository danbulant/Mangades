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
    <slot scoped={({ manga: manga.data.attributes, id: manga.data.id })} />
{/await}