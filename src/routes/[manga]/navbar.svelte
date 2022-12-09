<script lang="ts">
    export var transparent: boolean = false;
    export var title: string;
</script>

<div class="navbar" class:transparent>
    <a href="/">←</a>
    <span class="title">{title}</span>
</div>

<style>
    .navbar {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 5rem;
        background: rgb(0,0,0,0.9);
        backdrop-filter: blur(25px);
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0 1rem;
        transition: background 0.3s ease;
        user-select: none;
    }
    .transparent.navbar {
        background: none;
        backdrop-filter: none;
    }
    .navbar a {
        color: white;
        font-size: 2rem;
        transform: translateX(0);
        transition: transform 0.2s ease;
    }
    .navbar a:hover, .navbar a:active, .navbar a:focus {
        text-decoration: none;
        transform: translateX(-0.5rem);
    }
    .transparent .title {
        opacity: 0;
        user-select: none;
    }
    .title {
        user-select: inherit;
        opacity: 1;
        transition: opacity 0.3s ease;
        font-size: 1.5rem;
        color: white;
        font-weight: bold;
        flex-grow: 1;
        text-align: center;
    }
</style>