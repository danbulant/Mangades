<script>
    import { url } from "@roxi/routify/runtime/helpers";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();
    export var chapter;
    export var selected;
    export var disabledDownload = false;
    export var progress = 0;

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
            dispatch("select");
        }
    }
</script>

<tr on:mouseenter={mouseenter} on:mousedown={click} class:selected={selected} style="background-image: linear-gradient(to right, rgba(0, 255, 0, 0.247) {progress * 100}%, transparent {progress * 100}%)">
    <td class="no-wrap">{chapter.attributes.volume ? "Vol " + chapter.attributes.volume : ""}</td>
    <td class="no-wrap">{chapter.attributes.chapter ? "Chapter " + chapter.attributes.chapter : ""}</td>
    <td>{chapter.attributes.title}</td>
    <td class="action no-wrap"><a href={$url("./" + chapter.id)} on:click|stopPropagation={() => !disabledDownload && dispatch("view")}>View</a></td>
</tr>

<style lang="postcss">
    tr {
        border: 1px solid black;
        position: relative;
        transition: background-image 0.3s;
        background-repeat: no-repeat;
        user-select: none;
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
        text-align: right;
        padding-right: 10px;
    }

    td.action:hover {
        text-decoration: underline;
        color: rgb(0,100,200);
    }

    td.action a {
        color: inherit;
    }
</style>