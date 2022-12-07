<script>
    export var list = false;
</script>

<div>
    <button on:click={() => list = !list} class:active={list == false}>Grid</button><!--
    --><button on:click={() => list = !list} class:active={list == true}>List</button>
</div>

<style>
    div {
        margin-left: auto;
        width: max-content;
    }
    button {
        border-radius: 0;
        margin: 0;
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