<script lang="ts">
    import request, { coverUrl, imageproxy } from "$lib/util/request";

    // export var mangaId: string;
    export var additionalList: {
        alt: string;
        src: string;
        width?: number;
        height?: number;
        color?: string;
    }[] = [];
    export var list;
    export var mangaId;

    $: console.log(list)
    $: list.then(t => console.log(t))

    export var selectedImage = null;
</script>

<div class="main">
    {#await list}
        Loading art
    {:then list}
        {#each list.data.sort((a, b) => a.attributes.volume - b.attributes.volume) as item}
            <div class="img-container">
                <img
                    on:click={() => (selectedImage = coverUrl(mangaId, item))}
                    width="512"
                    height="805"
                    src={coverUrl(mangaId, item)}
                    alt=""
                    draggable={false} />
                <img class="img-backdrop"
                    src={coverUrl(mangaId, item)}
                    alt="">
            </div>
        {/each}
    {/await}
    {#each additionalList as item}
        <div class="img-container" style="{item.width ? `grid-column: span ${item.width}` : ""}; {item.height ? `grid-row: span ${item.height}` : ""};">
            <img
                on:click={() => (selectedImage = item.src)}
                style="{item.color ? '--box-shadow-color: ' + item.color : ''};"
                class:color={item.color}
                src={item.src}
                alt={item.alt}
                draggable={false} />
            {#if !item.color}
                <img class="img-backdrop" src={item.src} alt="">
            {/if}
        </div>
    {/each}
</div>


<style>
    .main {
        display: grid;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-items: center;
        align-items: center;
        grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
    }
    div img {
        border-radius: 5px;
        height: 10rem;
        width: auto;
        --box-shadow-color: white;
        object-fit: contain;
        transition: filter 0.2s ease-in-out;
        filter: drop-shadow(0 0 0 0 var(--box-shadow-color));
        position: relative;
        z-index: 1;
    }
    div .img-container img:not(.color), div .img-container img:not(.color):hover, div .img-container img:not(.color):active, div .img-container img:not(.color):focus {
        --box-shadow-color: transparent;
        filter: none;
    }
    .img-container {
        position: relative;
        width: 100%;
        height: 100%;
    }
    .img-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        object-fit: contain;
        filter: blur(10px) saturate(100%);
        opacity: 0;
        z-index: 0;
        transition: opacity .3s, filter .3s;
    }
    .img-container:hover .img-backdrop {
        filter: blur(20px) saturate(150%);
        opacity: 1;
    }
    div .img-container img {
        width: 100%;
        height: 100%;
    }
    .main > :first-child {
        grid-column: 1 / span 2;
        grid-row: 1 / span 2;
        height: 20rem;
    }
    div img.color:hover,
    div img.color:active,
    div img.color:focus {
        filter: drop-shadow(0 0 0.5rem var(--box-shadow-color));
    }
</style>