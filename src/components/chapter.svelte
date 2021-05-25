<script>
    import { url } from "@roxi/routify/runtime/helpers";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();
    export var chapter;
    export var selected;
    export var disabledDownload = false;
    export var progress = 0;

    $: if(progress !== 0) console.log("chapter", chapter.data.attributes.chapter, progress * 100);
</script>

<tr on:click={() => dispatch("select")} class:selected={selected} style="background-image: linear-gradient(to right, rgba(0, 255, 0, 0.247) {progress * 100}%, transparent {progress * 100}%)">
    <td class="no-wrap">{chapter.data.attributes.volume ? "Vol " + chapter.data.attributes.volume : ""}</td>
    <td class="no-wrap">Chapter {chapter.data.attributes.chapter}</td>
    <td>{chapter.data.attributes.title}</td>
    <td class="action no-wrap"><span on:click|stopPropagation={() => !disabledDownload && dispatch("download")} class:disabled={disabledDownload}>Download</span></td>
    <td class="action no-wrap"><a href={$url("./" + chapter.data.id)} on:click|stopPropagation={() => !disabledDownload && dispatch("view")}>View</a></td>
</tr>

<style>
    tr {
        border: 1px solid black;
        position: relative;
        transition: background-image 0.3s;
    }

    tr.selected {
        background: rgba(0,0,0,0.15);
    }
    tr:hover {
        background: rgba(0,0,0,0.2);
    }
    tr.selected:hover {
        background: rgba(0,0,0,0.25);
    }

    td {
        padding: 5px 5px;
    }

    td.action {
        font-weight: bold;
        color: black;
        text-decoration: none;
        cursor: pointer;
        user-select: none;
    }

    td.action:hover {
        text-decoration: underline;
        color: rgb(0,100,200);
    }

    td.action a {
        color: inherit;
    }
</style>