<script>
    export var scoped;
    export var chapter;

    var mangaId = scoped.id;
    $: mangaId = scoped.id;
    var manga = scoped.manga;
    $: manga = scoped.manga;

    function getChapter(id) {
        const data = request("chapter/" + id);
        console.log(data);
        return data;
    }

    var chapterData = getchapter(chapter);
    $: chapterData = getChapter(chapter);
</script>

<slot scoped={({ manga, mangaId, id: chapter, chapter: chapterData })} />