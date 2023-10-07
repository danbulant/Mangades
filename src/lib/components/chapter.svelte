<script>
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();
    export var chapter;
    export var selected;
    export var disabledDownload = false;
    export var progress = 0;
    export var read;
    var scanlationGroup = chapter.relationships.find(t => t.type === "scanlation_group")?.attributes.name;

    /**
     * @param {MouseEvent} e
     */
    function click(e) {
        dispatch("select", e);
    }

    /**
     * @param {MouseEvent} e
     */
    function mouseenter(e) {
        if(e.buttons & 1) {
            dispatch("select", e);
        }
    }
</script>

<tr class="chapter item" class:read on:mouseenter={mouseenter} on:click={click} class:selected={selected} style="background-image: linear-gradient(to right, rgba(0, 255, 0, 0.247) {progress * 100}%, transparent {progress * 100}%)">
    <td class="no-wrap">{chapter.attributes.volume ? "Vol " + chapter.attributes.volume : ""}</td>
    <td class="no-wrap">{chapter.attributes.chapter ? "Chapter " + chapter.attributes.chapter : ""}</td>
    <td>
        <div class="title">{chapter.attributes.title || " "}</div>
        <div class="scanlation">{scanlationGroup || "Unknown group"}</div>
    </td>
    <td class="action no-wrap"><a href="./{chapter.id}/1" on:click|stopPropagation={() => !disabledDownload && dispatch("view")}>View</a></td>
</tr>

<style lang="postcss">
    tr {
        border: 1px solid black;
        position: relative;
        transition: background-image 0.3s;
        background-repeat: no-repeat;
        user-select: none;
    }
    .read {
        color: grey;
    }
    .scanlation {
        color: grey;
        font-size: 0.9rem;
    }
    .title {
        font-size: 1.1rem;
    }

    tr.selected {
        background: rgba(0,0,0,0.15);
    }
    :global(.dark tr.chapter.item.selected) {
        background: rgba(255,255,255,0.15);
    }
    tr:hover {
        background: rgba(0,0,0,0.2);
    }
    :global(.dark tr.chapter.item:hover) {
        background: rgba(255,255,255,0.2);
    }
    tr.selected:hover {
        background: rgba(0,0,0,0.25);
    }
    :global(.dark tr.chapter.item.selected:hover) {
        background: rgba(255,255,255,0.25);
    }
    .no-wrap {
        white-space: nowrap;
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
        text-align: right;
        padding-right: 10px;
    }
    :global(.dark td.action.no-wrap) {
        color: white;
    }

    td.action:hover {
        text-decoration: underline;
        color: rgb(0,100,200);
    }

    td.action a {
        color: inherit;
    }
</style>