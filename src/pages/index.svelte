<script>
	import request from "../util/request";
    import { params } from '@roxi/routify'
	var name = $params.search;
    $: {
        const url = new URL(window.location.toString());
        url.searchParams.set("search", name);
        history.replaceState(history.state, "", url.toString());
    }
	var result = request("manga", "title=" + name + "&contentRating[]=safe&contentRating[]=suggestive");
	$: result = request("manga", "title=" + name + "&contentRating[]=safe&contentRating[]=suggestive");
	result.then(console.log);
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
					{manga.data.attributes.title.en}
				</li>
			{/each}
		</ul>
	{/await}
</main>

<style>
	main
	{
		max-width: 450px;
		margin: auto;
	}
	input {
		width: 100%;
	}
</style>
