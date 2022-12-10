<script lang="ts">
    import Item from "$lib/components/item.svelte";
    import ShowNsfwChooser, { showNsfw } from "$lib/components/showNsfwChooser.svelte";
    import ShowTypeChooser, { showType } from "$lib/components/showTypeChooser.svelte";
    import request, { imageproxy } from "$lib/util/request";
    import { createEventDispatcher, tick } from "svelte";
    import { flip } from "svelte/animate";
    import { blur } from "svelte/transition";

    const relatedMangaMap = {
        main_story: "Main story",
        prequel: "Prequel",
        same_franchise: "Same franchise",
        sequel: "Sequel",
        alternate_story: "Alternate story",
        alternate_version: "Alternate version",
        preserialization: "Preserialization",
        serialization: "Serialization",
        spin_off: "Spin off",
        doujinshi: "Doujinshi",
        side_story: "Side story",
        colored: "Colored version",
        monochrome: "Monochrome version",
        adapted_from: "Adapted from",
        based_on: "Based on",
        shared_universe: "Shared universe",
    };

    export var mangaRelations: {
        id: string;
        related: keyof typeof relatedMangaMap;
        type: "manga";
        attributes: {
            title: {
                en?: string;
                [key: string]: string;
            };
            availableTranslatedLanguages: string[];
            contentRating: "safe" | "suggestive" | "erotica" | "pornographic";
            description: {
                en?: string;
                [key: string]: string;
            };
            status: string;
            tags: {
                id: string;
                type: "tag";
                attributes: {
                    name: {
                        en?: string;
                        [key: string]: string;
                    };
                    group: string;
                    version: number;
                };
            }[];
            year: number;
        };
    }[];

    let relations;
    relations = getRelations(mangaRelations);
    async function getRelations(rels) {
        const params = new URLSearchParams();
        for (let rel of rels) params.append("ids[]", rel.id);
        params.append("limit", rels.length);
        params.append("contentRating[]", "safe");
        params.append("contentRating[]", "suggestive");
        params.append("contentRating[]", "erotica");
        params.append("contentRating[]", "pornographic");
        params.append("includes[]", "cover_art");
        const data = await request("manga?" + params);
        console.log("rm", data.data);
        return data.data;
    }

    function getData(relation, relations) {
        let res = relations.find((t) => t.id === relation.id);
        console.log("gd", relation, res);
        return res;
    }

    function getCoverArt(relation, relations) {
        let data = getData(relation, relations);
        return data.relationships.find((t) => t.type === "cover_art").attributes.fileName;
    }

    const dispatch = createEventDispatcher();

    $: {
        $showType;
        $showNsfw;
        setTimeout(() => dispatch("slideToClosest"), 100);
    }
</script>

<div class="flex">
    <ShowNsfwChooser />
    
    <ShowTypeChooser />
</div>

<div class="grid" class:list={$showType == "list"}>
    {#each mangaRelations.filter(t => $showNsfw !== "hide" || ["safe", "suggestive"].includes(t.attributes.contentRating)) as manga (manga.id)}
        <a href="/{manga.id}" class="manga" animate:flip={{ duration: d=>Math.sqrt(d)*10 }} transition:blur>
            {#await relations then relations}
                <Item
                    r18={!['safe', 'suggestive'].includes(manga.attributes.contentRating)}
                    title={manga.attributes.title.en || manga.attributes.title["ja"] || manga.attributes.title["ja-ro"] || Object.values(manga.attributes.title)[0]}
                    description={manga.attributes.description.en}
                    cover={`${imageproxy}https://uploads.mangadex.org/covers/${manga.id}/${getCoverArt(manga, relations)}.512.jpg`}

                    />
            {/await}
        </a>
    {/each}
</div>

<style>
    .flex {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, 11rem);
        grid-gap: 1rem;
  		align-items: flex-start;
        padding: 1rem;
    }
	.grid.list {
		grid-template-columns: 1fr;
	}
    a {
        color: white;
    }
    a:hover {
        color: white;
        text-decoration: none;
    }
</style>