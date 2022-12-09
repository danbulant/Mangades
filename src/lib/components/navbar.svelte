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

	const anilistID = hostname === "manga.danbulant.eu" ? "8374" : "8375";
</script>

<div class="navbar flex">
    <h1>Library</h1>

    <div class="search">
        <input type="text" placeholder="{isLogedIn() ? "Search for manga or enter URL of mangadex.org manga" : "Enter UUID or URL of mangadex.org manga"}" bind:value={name}>
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
    .spacer {
        height: 4rem;
    }
    .navbar {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 4rem;
        background: black;
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
    }
	.search input {
        margin: 0;
		width: min(30rem, 100vw - 18rem);
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