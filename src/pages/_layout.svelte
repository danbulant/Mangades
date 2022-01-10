<script>
    import { logs } from "../util/logs";
</script>

<!-- routify:options preload="proximity" -->
<slot />

{#if $logs.length}
    <div class="flow">
        {#each $logs as item}
            <div class="item {item.type}">
                {item.text}
            </div>
        {/each}
    </div>
{/if}

<style lang="postcss">
    .flow {
        position: fixed;
        bottom: 0;
        right: 0;
        background: white;
        border-radius: 5px 0 0 0;
        padding: 5px;
        box-shadow: 0 0 2px 0 black;
    }
</style>