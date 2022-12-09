<script lang="ts">
    import SvelteMarkdown from "svelte-markdown";


    export var source: string;

    export var expanded = false;
</script>

<div class="description" class:expanded>
    <div class="content">
        <SvelteMarkdown {source} />
    </div>
    <div class="expander">
        <button on:click={() => expanded = !expanded}>
            {expanded ? "^" : "v"}
        </button>
    </div>
</div>

<style>
    .description {
        padding: 0 1rem 1rem 1rem;
        font-size: 1.2rem;
        line-height: 1.5rem;

        /* limit to 5 rows when not expanded */
        max-height: calc(2*1rem + 1.5rem * 5);
        overflow: hidden;
        text-overflow: ellipsis;

        display: -webkit-box;
        -webkit-line-clamp: 5;
        -webkit-box-orient: vertical;

        position: relative;
    }

    .expanded.description {
        max-height: none;
        -webkit-line-clamp: initial;
    }

    .expander {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 4rem;
        background: linear-gradient(rgba(0,0,0,0), rgba(0,0,0,1));
        text-align: center;
    }

    .expander button {
        background: none;
        border: none;
        color: white;
        font-size: 2rem;
        cursor: pointer;
    }

    .expanded .expander {
        background: none;
        bottom: -1rem;
    }
</style>