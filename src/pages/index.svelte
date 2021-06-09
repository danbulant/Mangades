<script>
    import { params } from '@roxi/routify'
	import request from "../util/request";
    import ratelimit from "../util/ratelimit";
    import { goto, url } from '@roxi/routify/runtime/helpers';
	import MultiSelect from '../components/multiSelect.svelte';
    
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
    async function search(title, filters, offset=0) {
        var query = new URLSearchParams();
        if(title) query.set("title", title);
		query.set("limit", 100);
		query.set("offset", offset);
		for(const rating of filters.contentRating) {
			query.append("contentRating[]", rating);
		}
		for(const demographic of filters.demographic) {
			query.append("demographic[]", demographic);
		}
		for(const status of filters.status) {
			query.append("status[]", status);
		}
		query.set("order[" + filters.sort + "]", filters.sortValue);
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

	function update(name, filters) {
		result = ratelimit(search, name, filters);
	}

	var result;
	$: update(name, filters);

	var scrollSearch = null;
	/**
	 * @param {MouseEvent} e
	 */
	async function scroll(e) {
		if(scrollSearch !== null) return;
		if(document.body.scrollHeight - window.scrollY - window.innerHeight < 300 && (await result).results.length < (await result).total) {
			scrollSearch = name;
			const res = await search(name, filters, (await result).results.length);
			if(scrollSearch === name && res.results.length) {
				(await result).results.push(...res.results);
				result = result; // trigger reload
			}
			setTimeout(() => {
				scrollSearch = null;
			}, 500);
		} 
	}

	var randomMangaLoading = false;
	async function randomManga() {
		randomMangaLoading = true;
		const res = await request("manga/random");
		$goto("./" + res.data.id);
	}

	const filters = {
		contentRating: ["safe", "suggestive"],
		demographic: [],
		status: [],
		sort: "updatedAt",
		sortValue: "desc"
	};

	const options = {
		contentRating: {
			safe: "Safe",
			suggestive: "Suggestive",
			erotica: "Erotica",
			pornographic: "Pornographic"
		},
		demographic: {
			shounen: "Shounen",
			shoujo: "Shoujo",
			josei: "Josei",
			none: "None"
		},
		status: {
			ongoing: "Ongoing",
			completed: "Completed",
			hiatus: "Hiatus - Paused",
			cancelled: "Cancelled"
		}
	}
</script>

<svelte:window on:scroll={scroll} />

<svelte:head>
	<title>Mangadex search & downloader</title>
	<meta name="description" value="Read manga from Mangadex online, or download it as EPUB or CBZ file to read it on your e-reader." />
</svelte:head>

<main>

	<h1>MANGADEX</h1>
	<input type="text" bind:value={name}>

	<div class="filters">
		<div class="grow">
			<label for="content-rating">Content rating</label>
			<MultiSelect id="content-rating" bind:value={filters.contentRating} options={options.contentRating} />
		</div>
		<div class="grow">
			<label for="demographic">Demographic</label>
			<MultiSelect id="demographic" bind:value={filters.demographic} options={options.demographic} />
		</div>
		<div class="grow">
			<label for="status">Manga Status</label>
			<MultiSelect id="status" bind:value={filters.status} options={options.status} />
		</div>
		<p style="margin: 0;"><i>Sorts currently don't work (mangadex shows the same results).</i></p>
		<div class="flex">
			<label for="sort">Sort by:</label>
			<select name="sort" id="sort" class="flex-grow" bind:value={filters.sort}>
				<option value="createdAt">Creation date</option>
				<option value="updatedAt">Update date</option>
			</select>
			<select name="sort-type" id="sort-type" class="flex-grow" bind:value={filters.sortValue}>
				<option value="asc">Ascending</option>
				<option value="desc">Descending</option>
			</select>
		</div>
	</div>

	{#await result}
		Loading...
	{:then result}
		<div class="flex">
			<table>
				<tr>
					<td>
						Showing results:
					</td>
					<td class="value">
						{result.results.length}
					</td>
				</tr>
				<tr>
					<td>
						Total results:
					</td>
					<td class="value">
						{result.total}
					</td>
				</tr>
			</table>
			<div>
				<button on:click={() => randomManga()} disabled={randomMangaLoading}>Random</button>
			</div>
		</div>
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
	
	<p>DISCLAIMER: This site isn't distributing any content and is using mangadex.org API. Website is open source, and I don't claim any copyright on the publications.</p>
</main>

<style>
	.filters {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
	}
	.flex {
		display: flex;
		justify-content: space-between;
		width: 100%;
		align-items: center;
	}
	.flex select {
		margin: 0;
	}
	.grow {
		flex-grow: 1;
		margin-left: 5px;
		margin-right: 5px;
	}
	.flex select.flex-grow {
		flex-grow: 1;
		margin-left: 5px;
		margin-right: 5px;
	}
	input {
		width: 100%;
		margin-bottom: 5px;
	}
	.flex {
		display: flex;
		justify-content: space-between;
	}
	.value {
		text-align: right;
	}

	ul {
		padding: 0;
	}

	li {
		padding: 4px 0;
	}

	a {
		color: black;
	}
	a:hover {
		color: rgb(0,100,200);
	}
</style>
