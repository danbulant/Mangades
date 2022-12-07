<script>
    export var list;
    export var selected = list[0];
</script>

<div>
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
    }
    button:first-child {
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
    }
    button:last-child {
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;
    }
    button.active {
        background: rgb(202, 202, 202);
    }
</style>