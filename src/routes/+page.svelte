<script lang="ts">
	import request from "$lib/util/request";
	import { getUserDetails, getUserManga, isLogedIn } from "$lib/util/anilist";
	import AnilistItems from "$lib/components/anilistItems.svelte";
	import ShowTypeChooser from "$lib/components/showTypeChooser.svelte";
	import ratelimit from '$lib/util/ratelimit';
	import MangadexItems from '$lib/components/mangadexItems.svelte';
    import { goto } from "$app/navigation";

    import type { load } from "./+page";
    import Navbar from "$lib/components/navbar.svelte";
    import ShowNsfwChooser, { showNsfw } from "$lib/components/showNsfwChooser.svelte";
    export var data: Awaited<ReturnType<typeof load>>;

	var name: string = typeof window === "undefined" ? "" : data.url.searchParams.get("search") || "";
    $: if(typeof window !== "undefined") {
        const url = new URL(window.location.toString());
        url.searchParams.set("search", name || "");
        history.replaceState(history.state, "", url.toString());
    }

	const filters = {
		contentRating: ["safe", "suggestive"],
		demographic: [],
		status: [],
		sort: "updatedAt",
		sortValue: "desc"
	};

	filters.contentRating = $showNsfw !== "hide" ? ["safe", "suggestive", "erotica", "pornographic"] : ["safe", "suggestive"];

    /**
     * Searches for results
     * @param {string} title
     * @returns {Promise<object>}
     */
    async function search(title, filters, offset=0) {
        var query = new URLSearchParams();
        if(title) query.set("title", title);
		query.set("limit", "100");
		query.set("offset", offset.toString());
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

	function open() {
		var id = name.trim();
		if(id.startsWith("https://mangadex.org/title/")) {
			id = id.substring("https://mangadex.org/title/".length);
			id = id.match(/[^\/?#]*/)[0];
		}
		if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
			return alert("You provided invalid ID or link. Make sure you copy the full URL from mangadex.org title page");
		}
		goto("./" + id);
	}

	let userDetails = isLogedIn() && getUserDetails();
	let userManga = isLogedIn() && getUserManga();

    $: if(userDetails) {
        userDetails.then(data => {
            if(data.data.User.options.nsfwContent) {
                $showNsfw = "show";
            }
        })
    }
</script>

<svelte:window on:scroll={scroll} />

<svelte:head>
	<title>Mangadex search & downloader</title>
	<meta name="description" content="Read manga from Mangadex online, or download it as EPUB or CBZ file to read it on your e-reader." />
</svelte:head>

<Navbar bind:name {open} hostname={data.url.hostname} />

<main>
	{#if isLogedIn()}

		<div class="flex" style="margin-top: 1rem;">
            <div>
                <div class="nsfw">
                    <ShowNsfwChooser />
                </div>
                <a href="https://discord.gg/XKPbz5xRuK">Made by TechmandanCZ#3372</a>
            </div>
            <div>
                <a href="/random" class="button" style="width: 100%; margin-bottom: 0.4rem; display: inline-block;">Random</a>
                <ShowTypeChooser />
            </div>
		</div>
	
		{#if result}
			<h2>Search results</h2>
			{#await result}
				Loading...
			{:then result}
				<MangadexItems entries={result.data} />
			{/await}
		{:else}
			<div>
				{#await userManga then userManga}
                    <AnilistItems lists={userManga.data.MediaListCollection.lists} />
				{/await}
			</div>
		{/if}
	{:else}
		<p>
			Sign in via Anilist to view your manga list and search for manga online. You can still read manga or download it without signing in using direct mangadex URLs.
		</p>
	{/if}

    <a href="/about" class="about">About</a>
</main>

<style lang="postcss">
	.flex {
		display: flex;
		justify-content: space-between;
		width: 100%;
		align-items: center;
	}
	a:not(.button) {
		color: rgb(86, 139, 255);
		text-decoration: underline;
	}
	a:hover:not(.button) {
		color: rgb(0,100,200);
	}

    main {
        padding-bottom: 1rem;
    }
    a.about {
        display: block;
        text-align: right;
        margin-top: 1rem;
        color: white;
        font-size: 1.4rem;
    }
    a.about:visited {
        color: white;
    }
</style>
