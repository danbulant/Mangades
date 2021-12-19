<script>
    import { params } from '@roxi/routify'
	import request from "../util/request";
    import ratelimit from "../util/ratelimit";
    import { goto, url } from '@roxi/routify/runtime/helpers';
	import MultiSelect from '../components/multiSelect.svelte';
    
	var name = "";
	// var name = $params.search;
    // $: {
    //     const url = new URL(window.location.toString());
    //     url.searchParams.set("search", name || "");
    //     history.replaceState(history.state, "", url.toString());
    // }
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

	function open() {
		var id = name;
		if(name.startsWith("https://mangadex.org/title/")) {
			id = name.substr("https://mangadex.org/title/".length);
			id = id.split("/")[0];
		} else if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(name)) {
			return alert("You provided invalid ID or link. Make sure you copy the full URL from mangadex.org title page");
		}
		$goto("./" + id);
	}
</script>

<svelte:window on:scroll={scroll} />

<svelte:head>
	<title>Mangadex search & downloader</title>
	<meta name="description" value="Read manga from Mangadex online, or download it as EPUB or CBZ file to read it on your e-reader." />
</svelte:head>

<main>

	<h1>miniMANGADEX</h1>
	<div class="flex">
		<input type="text" placeholder="Enter UUID or URL of mangadex.org manga" bind:value={name}>
		<button on:click={open}>Go</button>
	</div>

	<div class="flex">
		<button on:click={randomManga} disabled={randomMangaLoading}>Random</button>
		<a href="https://mangadex.org">Mangadex.org</a>
	</div>

	
	<p>Wondering why this downgrade? My main site was taken down 3 times for copyright infringement because of this site, even though I wasn't hosting anything. I removed any link they reported, yet they still removed my site multiple times (I should always have 48 hour window to remove the link, but they removed my site right after sending email to me). Comeso (the company that was sending copyright infringement emails) didn't reply to my attempts to contact them using the email they provided or the website they sent. They also sent few invalid copyright infringement emails, yet my webhosting still took my site down for them.</p>
	<p>I disabled search engine indexing, so google shouldn't show results of manga directly but just link to this page. Search functionality got removed and instead you need to send the URL itself, which should prevent automatic scanners.</p>
	<hr>

	<p>This site works by using Mangadex API <i>from your browser</i>, and loading or downloading the manga directly from MD@H, without using my servers (so I don't host any content seen here, nor can I delete it). The whole site is client side only (it runs in your browser). I cannot delete any content (images or text), only hide it from this specific site - but there are tons of other sites, and anybody with decent coding skills can clone this page and remove the rule hiding the content (this page is open source).</p>
	
	<hr>

	<p>DISCLAIMER: This site isn't distributing any content and is using mangadex.org API. All of the site's requests are done client side, my servers aren't sharing any manga data. Website is open source, and I don't claim any copyright on the publications.</p>

	<hr>

	<b>Shameless plug:</b>

	<p>
		Be sure to check out my <a href="https://danbulant.eu">main site</a>, and my game <a href="https://heaventaker.danbulant.eu/">Heaventaker</a>.
	</p>

	<hr>
	
	<p>
		Website's source code available on <b><a href="https://github.com/danbulant/mangades">GitHub</a></b> under GPLv3. Hosted using CloudFlare Pages.
	</p>
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
