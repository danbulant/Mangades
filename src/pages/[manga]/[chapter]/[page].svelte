<script>
    import { goto, url } from "@roxi/routify/runtime/helpers";

    export var page;
    export var scoped;

    console.log("scoped", scoped);

    var chapter = scoped.chapter;
    $: chapter = scoped.chapter;
    console.log("chapter", chapter);
    var manga = scoped.manga;
    $: manga = scoped.manga;
    var atHome = scoped.atHome;
    $: atHome = scoped.atHome;

    var quality = "data";

    var wasArrowUpUp = true;
    var wasArrowDownUp = true;

    /**
     * @param {KeyboardEvent} e
     */
    function keydown(e) {
        if(!image.complete) return e.preventDefault() || false;
        if(!wasArrowDownUp || !wasArrowUpUp) return;
        switch(e.key) {
            case "PageUp":
            case "ArrowUp":
                wasArrowUpUp = false;
                if(0 < document.scrollingElement.scrollTop) return;
            case "ArrowLeft":
                prev();
                break;
            case "PageDown":
            case "ArrowDown":
                wasArrowDownUp = false;
                if(document.scrollingElement.scrollHeight > document.scrollingElement.offsetHeight + document.scrollingElement.scrollTop) return;
            case "ArrowRight":
                next();
                break;
        }
    }

    /**
     * @param {KeyboardEvent} e
     */
    function keyup(e) {
        switch(e.key) {
            case "PageUp":
            case "ArrowUp":
                wasArrowUpUp = true;
                break;
            case "PageDown":
            case "ArrowDown":
                wasArrowDownUp = true;
                break;
        }
    }

    function next() {
        if(!image.complete) return;
        if(page > (chapter.data.attributes[quality].length - 2)) return;
        $goto("./" + (parseInt(page) + 1));
        document.scrollingElement.scrollTo({
            top: 0
        });
    }

    function prev() {
        if(!image.complete) return;
        if(page < 2) return;
        $goto("./" + (page - 1));
        document.scrollingElement.scrollTo({
            top: 0
        });
    }

    /**
     * @param {MouseEvent} e
     */
    function mouseclick(e) {
        if(xDown !== null) return;
        if(e.buttons & 8) {
            e.preventDefault();
            prev();
        }
        if(e.buttons & 16) {
            e.preventDefault();
            next();
        }
        if(e.buttons & 1) {
            e.preventDefault();
            next();
        }
    }

    /**
     * @param {MouseEvent} e
     */
    function preventDefault(e) {
        if([1, 3, 4].includes(e.button)) {
            console.log("Preventing default");
            e.preventDefault();
        }
    }


    var xDown = null;
    var yDown = null;                                 

    function handleTouchStart(evt) {
        const firstTouch = evt.touches[0];
        xDown = firstTouch.clientX;
        yDown = firstTouch.clientY;
    };

    function handleTouchMove(evt) {
        if (!xDown || !yDown) {
            return;
        }

        var xUp = evt.touches[0].clientX;
        var yUp = evt.touches[0].clientY;
        if(evt.touches[1]) return; // allow zoom

        var xDiff = xDown - xUp;
        var yDiff = yDown - yUp;

        if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
            if ( xDiff > 0 ) {
                /* left swipe */ 
                next();
            } else {
                /* right swipe */
                prev();
            }
        }
        /* reset values */
        xDown = null;
        yDown = null;  
    };

    //for zoom detection
    var px_ratio = window.devicePixelRatio || window.screen.availWidth / document.documentElement.clientWidth;

    function isZooming(){
        var newPx_ratio = window.devicePixelRatio || window.screen.availWidth / document.documentElement.clientWidth;
        if(newPx_ratio != px_ratio){
            px_ratio = newPx_ratio;
            console.log("Zoomed to", px_ratio);
        }
    }

    /** @type {number} */
    var imageWidth;
    /** @type {number} */
    var imageHeight = Infinity;
    /** @type {HTMLImageElement} */
    var image;
    var ratio = 0;
    $: actualHeight = ratio > 1 ? document.body.clientHeight * ratio : document.body.clientHeight - 17;

    /**
     * @param {Event} e
     */
    function loaded(e) {
        /** @type {HTMLImageElement}*/
        var image = e.target;
        imageWidth = image.naturalWidth;
        imageHeight = image.naturalHeight;

        ratio = imageHeight / imageWidth - 3;
    }
</script>

<svelte:window on:keydown={keydown} on:keyup={keyup} on:resize={isZooming} />

<svelte:head>
    <title>{manga.title.en} Chapter {chapter.data.attributes.chapter} Page {page}</title>
</svelte:head>

<div class="top">
    <a class="back" href={$url("../..")}>Back to chapter list</a>
</div>

<img draggable={false} bind:this={image} style="height: {actualHeight}px" on:load={loaded} on:touchstart={handleTouchStart} on:touchmove={handleTouchMove} on:mousedown={mouseclick} on:mouseup={preventDefault} src={`${atHome}/${quality}/${chapter.data.attributes.hash}/${chapter.data.attributes[quality][page - 1]}`} alt="Page {page} in chapter {chapter.data.attributes.chapter} of {manga.title.en}">

<div class="bottom">
    {#if page > 1}
        <a href={$url("./" + (page - 1))} class="prev">Previous</a>
    {/if}
    {#if page < chapter.data.attributes[quality].length - 1}
        <a href={$url("./" + (parseInt(page) + 1))} class="next">Next</a>
    {/if}
</div>

<style>
    img {
        width: calc(100vw - 16px);
        height: calc(100vh - 17px);
        object-fit: contain;
    }

    .top {
        position: fixed;
        top: 10px;
        left: 0;
        width: 100%;
        height: 30px;
    }

    .back {
        padding: 10px;
        background: white;
        border-radius: 0 0 5px 0;
    }

    .bottom {
        position: fixed;
        bottom: 0;
        left: 0;
        height: 30px;
        width: 100%;
    }

    .next {
        position: absolute;
        padding: 5px;
        right: 0;
        bottom: 0;
        background: white;
        border-radius: 5px 0 0 0;
    }

    .prev {
        position: absolute;
        left: 0;
        bottom: 0;
        padding: 5px;
        background: white;
        border-radius: 0 5px 0 0;
    }
</style>