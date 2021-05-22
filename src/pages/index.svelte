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
    async function search(title, offset=0) {
        var query = "";
        if(title) query += "title=" + encodeURIComponent(name) + "&";
        query += "contentRating[]=safe&contentRating[]=suggestive&limit=100&offset=" + offset;
        const res = await request("manga", query);
		for(const manga of res.results) {
			for(const relation of manga.relationships) {
				if(relation.type === "cover") {
					console.log(manga, relation);
				}
			}
		}
		return res;
    }

	var result = search(name);
	$: result = ratelimit(search, name);

	var scrollSearch = null;
	/**
	 * @param {MouseEvent} e
	 */
	async function scroll(e) {
		if(scrollSearch !== null) return;
		if(document.body.scrollHeight - window.scrollY - window.innerHeight < 100 && (await result).results.length < (await result).total) {
			scrollSearch = name;
			const res = await search(name, (await result).results.length);
			if(scrollSearch === name && res.results.length) {
				(await result).results.push(...res.results);
				result = result; // trigger reload
			}
			setTimeout(() => {
				scrollSearch = null;
			}, 500);
		} 
	}
</script>

<svelte:window on:scroll={scroll} />

<svelte:head>
	<title>Mangadex search</title>
	<meta name="description" value="Read manga from Mangadex online, or download it as EPUB file to read it on your e-reader" />
</svelte:head>

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

		{#if result.results.length < result.total}
			<p>Loading next manga...</p>
		{/if}
		<p>You got the end of the list.</p>
	{/await}
</main>

<style>
	input {
		width: 100%;
	}
</style>
