<script>
	var name = "overlord";
	const base = "https://api.mangadex.org/";

	function request(endpoint, query, type = "GET", body) {
		return fetch(base + endpoint + "?" + query, {
			method: type,
			body: body ? JSON.stringify(body) : undefined
		}).then(resp => resp.json());
	}

	var result = request("manga", "title=" + name + "&contentRating[]=safe&contentRating[]=suggestive");
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
		max-width: 720px;
		margin: auto;
	}
	
</style>