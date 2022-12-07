<script>
	import { fade } from 'svelte/transition';
    export var selectedImage;
</script>

{#if selectedImage}
    <dialog open class="open" on:click={() => selectedImage = null} transition:fade={{ duration: 200 }}>
        <img src={selectedImage} alt="">
        <button>Tap to close</button>
    </dialog>
{/if}

<style>
    dialog[open] {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(15px) saturate(150%);
        z-index: 100;
        border: none;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    :global(.dark dialog[open].open.open) {
        background: rgba(0, 0, 0, 0.6);
    }
    dialog img {
        border-radius: 5px;
        max-height: 100%;
        max-width: 100%;
    }
    dialog button {
        position: absolute;
        bottom: 5px;
        left: 5px;
    }
</style>