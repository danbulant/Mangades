<script>
    import { params } from '@roxi/routify'
	import request from "../util/request";
    import ratelimit from "../util/ratelimit";
    import { url } from '@roxi/routify/runtime/helpers';
    
	var name = $params.search;
    $: {
        const url = new URL(window.location.toString());
        url.searchParams.set("search", name || "");
        history.replaceState(history.state, "", url.toString());
    }
    /**
     * Searches for results
     * @param {string} title
     * @returns {Promise<object>}
     */
    function search(title) {
        var query = "";
        if(title) query += "title=" + encodeURIComponent(name) + "&";
        query += "contentRating[]=safe&contentRating[]=suggestive";
        return request("manga", query);
    }
	var result = search(name);
    result.then(console.log);
	$: result = ratelimit(search, name);
	$: result.then(console.log);
</script>

<main>

	<h1>MANGADEX</h1>
	<input type="text" bind:value={name}>

	{#await result}
		Loading...
	{:then result}
		<br> 
		Showing results: {result.results.length}
		<br>
		Total results: {result.total}
		<ul>
			{#each result.results as manga}
				<li>
                    <a href={$url("./" + manga.data.id)}>
                        {manga.data.attributes.title.en}
                    </a>
				</li>
			{/each}
		</ul>
	{/await}
</main>

<style>
	input {
		width: 100%;
	}
</style>
