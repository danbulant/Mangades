<script>
    import { logs } from "../util/logs";
    import { afterPageLoad } from "@roxi/routify";

    let skipFirst = true;
    $afterPageLoad(page => {
        if(skipFirst) return skipFirst = false;
        if(window.goatcounter) window.goatcounter.count({
            path: page.path,
            title: page.title,
            referrer: page.prev.path
        });
        else console.warn("Page change; GoatCounter not loaded (yet?)", page.path);
    })
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