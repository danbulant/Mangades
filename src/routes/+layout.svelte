<script>
    import { afterNavigate } from "$app/navigation";
    import { logs } from "$lib/util/logs";

    let skipFirst = true;
    let last = window.location.pathname;
    afterNavigate(page => {
        if(!["link", "popstate"].includes(page.type)) return; // ignore post hydration and automatic goto
        if(skipFirst) return skipFirst = false;
        if(window.goatcounter) window.goatcounter.count({
            path: window.location.pathname,
            title: page.title,
            referrer: last
        });
        else console.warn("Page change; GoatCounter not loaded (yet?)", window.location.pathname);
        last = window.location.pathname;
    });
    
    let defaultDarkmode = typeof window !== "undefined" && window.matchMedia('(prefers-color-scheme: dark)').matches;
    typeof window !== "undefined" && window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if(defaultDarkmode == darkmode) {
            darkmode = event.matches;
            defaultDarkmode = event.matches;
        }
    });
    let darkmode = typeof localStorage !== "undefined" && localStorage.getItem("darkmode") || defaultDarkmode;

    $: if(typeof localStorage !== "undefined" && darkmode !== defaultDarkmode) localStorage.setItem("darkmode", darkmode);

    $: if(typeof window !== "undefined") if(darkmode) {
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
        position: absolute;
        top: 0;
        right: 0;
        z-index: 1000;
        background: none;
        border: none;
        font-size: 1.3rem;
        padding: 0.5em;
        cursor: pointer;
        color: black;
        border: 2px solid black;
        border-top-width: 0;
        border-right-width: 0;
        border-radius: 0;
        border-bottom-left-radius: 5px;
        background: rgba(255,255,255,0.3);
        backdrop-filter: blur(25px);
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
        border-color: white;
        background: rgba(0,0,0,0.3);
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