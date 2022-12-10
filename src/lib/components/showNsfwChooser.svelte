<script lang="ts" context="module">
    import type { Writable } from "svelte/store";
    import { storedWritable } from "../util/storedWritable";

    export const showNsfw: Writable<"hide" | "blur" | "show"> = storedWritable("nsfw-mode", "blur");
</script>

<div>
       <button on:click={() => $showNsfw = "hide"} class:active={$showNsfw == "hide"}>Hide</button><!--
    --><button on:click={() => $showNsfw = "blur"} class:active={$showNsfw == "blur"}>Blur</button><!--
    --><button on:click={() => $showNsfw = "show"} class:active={$showNsfw == "show"}>Show</button>
</div>

<style>
    div {
        width: max-content;
        user-select: none;
    }
    button {
        border-radius: 0;
        margin: 0;
    }
    button:first-child {
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
    }
    button:last-child {
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;
    }
    button.active {
        background: rgb(202, 202, 202);
    }
</style>