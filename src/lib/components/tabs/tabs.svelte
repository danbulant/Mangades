<script>
    export var list;
    export var selected = list[0];
</script>

<div class="tabs">
    {#each list as item}
        <button on:click={() => selected = item} class:active={selected == item}>{item}</button>
    {/each}
</div>

<style>
    div {
        display: flex;
    }
    button {
        border-radius: 0;
        flex-grow: 1;
        padding: 0.5rem;
        border: none;
        background: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;

        transition: background-color 0.2s, text-shadow 0.2s;
    }
    button:first-child {
        border-radius: 0.5rem 0 0 0.5rem;
    }
    button:last-child {
        border-radius: 0 0.5rem 0.5rem 0;
    }
    button:hover, button:active, button:focus, button.active {
        background: rgba(255,255,255,0.1);
        outline: none;
        text-shadow: 0 0 0.1rem white;
    }
</style>