import { error } from '@sveltejs/kit';
import request from '$lib/util/request';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
    const manga = await request("manga/" + params.manga + "?includes[]=author&includes[]=cover_art&includes[]=artist&includes[]=manga");
    console.log(manga);
    return {
        manga: manga.data.attributes,
        mangaRelationships: manga.data.relationships,
        id: manga.data.id
    }
}