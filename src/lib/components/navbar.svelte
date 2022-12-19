<script lang="ts">
    import { getUserDetails, isLogedIn } from "$lib/util/anilist";
	let userDetails = isLogedIn() && getUserDetails();
    
    export var name: string;
    export var open: () => void;
    export var hostname: string;

    function validate(id: string) {
		if(id.startsWith("https://mangadex.org/title/")) {
			id = id.substring("https://mangadex.org/title/".length);
			id = id.match(/[^\/?#]*/)[0];
		}
		return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    }

    $: if(validate(name)) open();

	const anilistID = {
        "manga.danbulant.eu": "8374",
        "tachiyomi.manga-d7tp.pages.dev": "10330"
    }[hostname] || "8375";
    var focused = false;
    var width: number;
    var small = width < 600;
    $: small = width < 600;
    var textfield: HTMLInputElement;

    function handleKeyDown(e: KeyboardEvent) {
        if(e.key === "k" && e.ctrlKey) {
            e.preventDefault();
            textfield.focus();
        }
    }
</script>

<svelte:window bind:innerWidth={width} on:keydown={handleKeyDown} />

<div class="navbar flex" class:full-text={small && focused}>
    <a href="/"><h1>Library</h1></a>

    <div class="search">
        <input type="text" bind:this={textfield} on:focus={() => focused = true} on:blur={() => focused = false} placeholder="{isLogedIn() ? "Search for manga or enter URL of mangadex.org manga" : "Enter UUID or URL of mangadex.org manga"}" bind:value={name}>
        <button on:click={open}>➜</button>
    </div>

    <div class="right">

        {#if isLogedIn()}
            {#await userDetails then userDetails}
                <a href="https://anilist.co/user/{userDetails.data.User.name}" target="_blank">
                    <img class="avatar" width=100 height=100 src={userDetails.data.User.avatar.medium} alt="Your ({userDetails.data.User.name}) avatar">
                </a>
            {/await}
        {:else}
            <a class="button" href='https://anilist.co/api/v2/oauth/authorize?client_id={anilistID}&response_type=token'>Login with AniList</a>
        {/if}
    </div>
</div>

<div class="spacer"></div>

<style>
    a h1 {
        color: white;
        text-decoration: none;
    }
    .full-text h1, .full-text .right {
        display: none;
    }
    .full-text .search {
        max-width: 100vw;
    }
    .spacer {
        height: 4rem;
    }
    .navbar {
        position: fixed;
        z-index: 10;
        top: 0;
        left: 0;
        width: 100vw;
        height: 4rem;
        background: rgb(0,0,0,0.9);
        backdrop-filter: blur(25px);
        border-bottom: 1px solid gray;
        gap: 1rem;
        padding: 0 1rem;
    }
    h1 {
        margin: 0;
        padding: 0.67em 0;
    }
	.avatar {
		border-radius: 999px;
		height: 4rem;
		width: 4rem;
	}
	button {
		cursor: pointer;
	}
    .button {
        margin: 0;
    }
    .search {
        display: flex;
        margin: 0;
        max-width: 30rem;
        flex-grow: 1;
    }
	.search input {
        margin: 0;
        width: calc(100% - 2rem);
        border: none;
        background: none;
        color: white;
        outline: none;
        border-bottom: 1px solid gray;
        border-radius: 0;
	}
    .search input:active, .search input:focus {
        outline: none;
        border-bottom-color: white;
    }
	.search button {
        margin: 0;
        border: none;
        background: none;
        color: white;
        border-bottom: 1px solid gray;
        border-radius: 0;
	}
    .search input:active ~ button, .search input:focus ~ button {
        outline: none;
        border-bottom-color: white;
    }
	.flex {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
    .right {
        display: flex;
        align-items: center;
        justify-content: end;
        width: 8rem;
    }
</style>