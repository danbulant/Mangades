<script>
    import { logs } from "../util/logs";
    import { afterPageLoad } from "@roxi/routify";

    let skipFirst = true;
    let last = window.location.pathname;
    $afterPageLoad(page => {
        if(skipFirst) return skipFirst = false;
        if(window.goatcounter) window.goatcounter.count({
            path: window.location.pathname,
            title: page.title,
            referrer: last
        });
        else console.warn("Page change; GoatCounter not loaded (yet?)", window.location.pathname);
        last = window.location.pathname;
    })
</script>

<!-- routify:options preload="proximity" -->
<slot />

{#if $logs.length}
    <div class="flow">
        {#each $logs as item}
            <pre class="item {item.type}">{item.text}</pre>
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
    pre {
        white-space: pre-wrap;
    }
</style>