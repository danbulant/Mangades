<script>
    export var value = [];
    export var id;
    export var name = id;

    export var options;

    /**
     * @param {MouseEvent} e
     * @param {string} name
     */
    function select(e, name) {
        if(value.includes(name)) {
            value.splice(value.indexOf(name), 1);
            value = value;
        } else {
            value.push(name);
            value = value;
        }
        e.preventDefault();
        /** @type {HTMLOptionElement} */
        const opt = e.target;
        opt.parentElement.focus();
        return false;
    }

    /**
     * @param {MouseEvent} e
     * @param {string} name
     */
    function dragSelect(e, name) {
        if(!(e.buttons & 1)) {
            return;
        }
        if(!value.includes(name)) {
            value.push(name);
            value = value;
        }
    }
</script>

<select multiple {name} {id} bind:value={value}>
    {#each Object.entries(options) as [name, option]}
        <option value={name} on:mousemove={e => dragSelect(e, name)} on:mousedown={(e) => select(e, name)}>{option}</option>
    {/each}
</select>

<style>
    select {
        width: 100%;
        margin-top: 5px;
        overflow-y: auto;
        padding: 0;
    }
    select option {
        padding: 2px 5px;
    }
    select option:checked {
        background-color: rgb(0, 38, 255);
        color: white;
    }
</style>