<script>
    import { fade } from "svelte/transition";
    export let url = "";
</script>

{#key url}
    <div
        in:fade={{ opacity: 1, duration: 200, delay: 150 }}
        out:fade={{ opacity: 0, duration: 200 }}
        class="absolute bg-inherit w-full"
    >
        <slot />
    </div>
{/key}