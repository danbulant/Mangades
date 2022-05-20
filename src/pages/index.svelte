<script>
	import request from "../util/request";
    import { goto } from '@roxi/routify/runtime/helpers';
	import { getUserDetails, getUserManga, isLogedIn } from "../util/anilist";
    
	var name = "";

	var randomMangaLoading = false;
	async function randomManga() {
		randomMangaLoading = true;
		const res = await request("manga/random");
		$goto("./" + res.data.id);
	}

	function open() {
		var id = name;
		if(name.startsWith("https://mangadex.org/title/")) {
			id = name.substring("https://mangadex.org/title/".length);
			id = id.split("/")[0];
		} else if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(name)) {
			return alert("You provided invalid ID or link. Make sure you copy the full URL from mangadex.org title page");
		}
		$goto("./" + id);
	}

	const anilistID = "8375";

	let userDetails = getUserDetails();
	let userManga = getUserManga();
</script>

<svelte:head>
	<title>Mangadex search & downloader</title>
	<meta name="description" value="Read manga from Mangadex online, or download it as EPUB or CBZ file to read it on your e-reader." />
</svelte:head>

<main>

	<h1>miniMANGADEX</h1>

	<div class="flex search">
		<input type="text" placeholder="Enter UUID or URL of mangadex.org manga" bind:value={name}>
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
		{#await userManga then userManga}
			{#each userManga.data.MediaListCollection.lists as list}
				<h2>{list.name}</h2>

				<div class="items">
					{#each list.entries as entry}
						<div class="item">
							<img src={entry.media.coverImage.large} width=100 height=142 alt="{entry.media.title}">
						</div>
					{/each}
				</div>
			{/each}
		{/await}
	{/if}
	
	<hr>

	<p>This site works by using Mangadex API <i>from your browser</i>, and loading or downloading the manga directly from MD@H, without using my servers (so I don't host any content seen here, nor can I delete it). The whole site is client side only (it runs in your browser). I cannot delete any content (images or text), only hide it from this specific site - but there are tons of other sites, and anybody with decent coding skills can clone this page and remove the rule hiding the content (this page is open source).</p>
	
	<hr>

	<p>DISCLAIMER: This site isn't distributing any content and is using mangadex.org API. All of the site's requests are done client side, my servers aren't sharing any manga data. Website is open source, and I don't claim any copyright on the publications. <i>If you believe in good faith you're downloading copyrighted content, file a DMCA at yourself, your operating system (as it took a part in the download), your ISP, your browser and all the free libraries that are used in any of the previous (made by volunteers), and then here. /s</i></p>

	<hr>

	<b>Shameless plug:</b>

	<p>
		Be sure to check out my <a href="https://danbulant.eu">main site</a>, and my game <a href="https://heaventaker.danbulant.eu/">Heaventaker</a>.
	</p>

	<hr>
	
	<p>
		Website's source code available on <b><a href="https://github.com/danbulant/mangades">GitHub</a></b> under GPLv3. Hosted on Cloudflare Pages, a static site hosting, where none of the images are stored.
	</p>
</main>

<style lang="postcss">
	.items {
		display: grid;
  		align-items: center;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
	}
	.item img {
		border-radius: 5px;
		height: 15rem;
		width: auto;
	}
	.item h4 {
		margin: 0;
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
