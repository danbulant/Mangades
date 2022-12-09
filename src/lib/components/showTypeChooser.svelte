<script context="module" lang="ts">
    import { writable, type Writable } from "svelte/store";

    export var showType: Writable<"grid" | "comfortable" | "list" | "cover-only"> = writable("grid");
</script>

<div>
    <button on:click={() => $showType = "grid"} class:active={$showType == "grid"}>Grid</button><!--
    --><button on:click={() => $showType = "list"} class:active={$showType == "list"}>List</button><!--
    --><button on:click={() => $showType = "comfortable"} class:active={$showType == "comfortable"}>Comfortable</button><!--
    --><button on:click={() => $showType = "cover-only"} class:active={$showType == "cover-only"}>Cover</button>
</div>

<style>
    div {
        margin-left: auto;
        width: max-content;
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