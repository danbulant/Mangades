<script>
import request from "../../../util/request";


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

    var chapterData = getChapter(chapter);
    $: chapterData = getChapter(chapter);
</script>

<slot scoped={({ manga, mangaId, id: chapter, chapter: chapterData })} />