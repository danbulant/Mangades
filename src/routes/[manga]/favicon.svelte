<script lang="ts">
    import { imageproxy } from "$lib/util/request";

    export var url: string;

    var domain = (new URL(url)).hostname;
    $: domain = (new URL(url)).hostname;
    $: favicon = `https://www.google.com/s2/favicons?domain=${domain}`;
</script>

<img src="{imageproxy}{favicon}" alt="">