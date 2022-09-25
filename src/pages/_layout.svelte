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
    });
    
    let defaultDarkmode = window && window.matchMedia('(prefers-color-scheme: dark)').matches;
    window && window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if(defaultDarkmode == darkmode) {
            darkmode = event.matches;
            defaultDarkmode = event.matches;
        }
    });
    let darkmode = localStorage && localStorage.getItem("darkmode") || defaultDarkmode;

    $: if(localStorage && darkmode !== defaultDarkmode) localStorage.setItem("darkmode", darkmode);

    $: if(darkmode) {
        document.body.classList.add("dark");
    } else {
        document.body.classList.remove("dark");
    }
</script>

<button class="darkmode-toggle" class:dark={darkmode} on:click={() => darkmode = !darkmode}>{darkmode ? "Light" : "Dark"}</button>

<!-- routify:options preload="proximity" -->
<div class:dark={darkmode} class="main">
    <slot />
</div>

{#if $logs.length}
    <div class="flow">
        {#each $logs as item}
            <pre class="item {item.type}">{item.text}</pre>
        {/each}
    </div>
{/if}

<style lang="postcss">
    .darkmode-toggle {
        position: fixed;
        top: 0;
        right: 0;
        z-index: 1000;
        background: none;
        border: none;
        font-size: 1.5em;
        padding: 0.5em;
        cursor: pointer;
    }
    .main {
        /* min-width: max(100%, 100vw);
        min-height: max(100%, 100vh); */
    }
    .dark {
        color: white;
        background: black;
    }
    :global(body.dark) {
        color: white;
        background: black;
    }
    button.dark {
        border: 2px solid white;
        border-top-width: 0;
        border-right-width: 0;
        border-radius: 0;
        border-bottom-left-radius: 5px;
    }
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