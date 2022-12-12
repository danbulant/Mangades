<script>
    import Navbar from "./navbar.svelte";
</script>
<svelte:head>
	<title>Mangadex search & downloader - About</title>
	<meta name="description" content="About page. Read manga from Mangadex online, or download it as EPUB or CBZ file to read it on your e-reader." />
</svelte:head>

<Navbar title="About" />

<main style="padding-top: 6rem;">
    <a href="https://discord.gg/XKPbz5xRuK">Made by TechmandanCZ#3372</a>
	
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

	<p>DISCLAIMER: This site isn't distributing any content and is using mangadex.org API. All of the site's requests are done client side, my servers aren't sharing any manga data. Website is open source, and I don't claim any copyright on the publications. <i>If you believe in good faith you're downloading copyrighted content, file a DMCA at yourself, your operating system (as it took a part in the download), your ISP, your browser and all the free libraries that are used in any of the previous (made by volunteers), and then here. /satire</i></p>

    <p>For DMCA requests, I recommend going to the mangadex page of the selected manga instead and reporting it there, as it will be taken down more quickly. You can of course report it to me and I'll block the page from viewing it, but it's trivial to remove that (1 required software installed to run this site, edit single line, run 2 more commands and you have bypassed the block), so I really recommend removing the source instead.</p>
</main>