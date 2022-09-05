<script>
    import { params } from '@roxi/routify';
	import request from "../util/request";
    import { goto } from '@roxi/routify/runtime/helpers';
	import { getUserDetails, getUserManga, isLogedIn } from "../util/anilist";
	import AnilistItems from "../components/anilistItems.svelte";
	import ListOrGrid from "../components/listOrGrid.svelte";
	import ratelimit from '../util/ratelimit';
	import MangadexItems from '../components/mangadexItems.svelte';

	/** @type {string} */
	var name = $params.search;
    $: {
        const url = new URL(window.location.toString());
        url.searchParams.set("search", name || "");
        history.replaceState(history.state, "", url.toString());
    }

	var allowNSFW = false;

	const filters = {
		contentRating: ["safe", "suggestive"],
		demographic: [],
		status: [],
		sort: "updatedAt",
		sortValue: "desc"
	};

	filters.contentRating = allowNSFW ? [] : ["safe", "suggestive"];

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
		query.append("includes[]", "author");
		query.append("includes[]", "cover_art");
		query.append("includes[]", "artist");
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
		for(const manga of res.data) {
			for(const relation of manga.relationships) {
				if(relation.type === "cover") {
					console.log(manga, relation);
				}
			}
		}
		return res;
    }
	function update(name, filters) {
		if(!name) return result = null;
		result = ratelimit(search, name, filters);
		result.then(t => console.log(t));
	}
	var result;
	$: isLogedIn() && update(name, filters);
	var scrollSearch = null;
	/**
	 * @param {MouseEvent} e
	 */
	async function scroll(e) {
		if(scrollSearch !== null) return;
		const resulted = await result;
		if(!resulted || !resulted.data) return;
		if(document.body.scrollHeight - window.scrollY - window.innerHeight < 800 && resulted.data.length < resulted.total) {
			scrollSearch = name;
			const res = await search(name, filters, resulted.data.length);
			if(scrollSearch === name && res.data.length) {
				resulted.data.push(...res.data);
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

	function open() {
		var id = name;
		if(id.startsWith("https://mangadex.org/title/")) {
			id = id.substring("https://mangadex.org/title/".length);
			id = id.match(/[^\/?#]*/)[0];
		}
		if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
			return alert("You provided invalid ID or link. Make sure you copy the full URL from mangadex.org title page");
		}
		$goto("./" + id);
	}

	const anilistID = window.location.hostname === "manga.danbulant.eu" ? "8374" : "8375";

	let userDetails = isLogedIn() && getUserDetails();
	let userManga = isLogedIn() && getUserManga();
	let listStyle = false;
</script>

<svelte:window on:scroll={scroll} />

<svelte:head>
	<title>Mangadex search & downloader</title>
	<meta name="description" value="Read manga from Mangadex online, or download it as EPUB or CBZ file to read it on your e-reader." />
</svelte:head>

<main>

	<h1>miniMANGADEX</h1>

	<div class="flex search">
		<input type="text" placeholder="{isLogedIn() ? "Search for manga or enter URL of mangadex.org manga" : "Enter UUID or URL of mangadex.org manga"}" bind:value={name}>
		<button on:click={open}>Go</button>
	</div>

	<div class="flex">
		<button on:click={randomManga} disabled={randomMangaLoading}>Random</button>
		{#if isLogedIn()}
			{#await userDetails then userDetails}
				<a href="https://anilist.co/user/{userDetails.data.User.name}" target="_blank">
					<img class="avatar" width=100 height=100 src={userDetails.data.User.avatar.medium} alt="Your ({userDetails.data.User.name}) avatar">
				</a>
			{/await}
		{:else}
			<a class="button" href='https://anilist.co/api/v2/oauth/authorize?client_id={anilistID}&response_type=token'>Login with AniList</a>
		{/if}
		<a href="https://mangadex.org">Mangadex.org</a>
	</div>

	{#if isLogedIn()}
		<div class="nsfw">
			<input id="nsfw" type="checkbox" bind:checked={allowNSFW}>
			<label for="nsfw">
				Allow NSFW
			</label>
		</div>

		<div class="flex">
			<a href="https://discord.gg/XKPbz5xRuK">Made by TechmandanCZ#3372</a>
			<ListOrGrid bind:list={listStyle} />
		</div>
	
		{#if result}
			<h2>Search results</h2>
			{#await result}
				Loading...
			{:then result}
				<MangadexItems entries={result.data} itemsList={listStyle} />
			{/await}
		{:else}
			<div>
				{#await userManga then userManga}
					{#each userManga.data.MediaListCollection.lists as list}
						<h2>{list.name}</h2>
						<AnilistItems entries={list.entries} itemsList={listStyle} />
					{/each}
				{/await}
			</div>
		{/if}
	{:else}
		<p>
			Sign in via Anilist to view your manga list and search for manga online. You can still read manga or download it without signing in using direct mangadex URLs.
		</p>
	{/if}
	
	<hr>

	<b>Shameless plug:</b>

	<p>
		Be sure to check out my <a href="https://danbulant.eu">main site</a>, and my game <a href="https://heaventaker.danbulant.eu/">Heaventaker</a>.
	</p>

	<hr>
	
	<p>
		Website's source code available on <b><a href="https://github.com/danbulant/mangades">GitHub</a></b> under GPLv3. Hosted on Cloudflare Pages, a static site hosting, where none of the images are stored.
	</p>

	<hr>

	<p>This site works by using Mangadex API <i>from your browser</i>, and loading or downloading the manga directly from MD@H, without using my servers (so I don't host any content seen here, nor can I delete it). The whole site is client side only (it runs in your browser). I cannot delete any content (images or text), only hide it from this specific site - but there are tons of other sites, and anybody with decent coding skills can clone this page and remove the rule hiding the content (this page is open source).</p>
	
	<hr>

	<p>DISCLAIMER: This site isn't distributing any content and is using mangadex.org API. All of the site's requests are done client side, my servers aren't sharing any manga data. Website is open source, and I don't claim any copyright on the publications. <i>If you believe in good faith you're downloading copyrighted content, file a DMCA at yourself, your operating system (as it took a part in the download), your ISP, your browser and all the free libraries that are used in any of the previous (made by volunteers), and then here. /s</i></p>
</main>

<style lang="postcss">
	.nsfw > input, .nsfw > label {
		display: inline-block;
		width: auto;
	}
	.avatar {
		border-radius: 999px;
		height: 4rem;
		width: 4rem;
	}
	button {
		cursor: pointer;
	}
	.search button {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}
	.search input {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}
	.flex {
		display: flex;
		justify-content: space-between;
		width: 100%;
		align-items: center;
	}
	input {
		width: 100%;
		margin-bottom: 5px;
	}
	.flex {
		display: flex;
		justify-content: space-between;
	}
	a:not(.button) {
		color: rgb(33, 50, 87);
		text-decoration: underline;
	}
	a:hover:not(.button) {
		color: rgb(0,100,200);
	}
</style>
