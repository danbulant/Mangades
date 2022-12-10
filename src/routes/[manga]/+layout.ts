import { error } from '@sveltejs/kit';
import request from '$lib/util/request';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
    const blocked = ["227e3f72-863f-46f9-bafe-c43104ca29ee", "b0b721ff-c388-4486-aa0f-c2b0bb321512"];
    if (blocked.includes(params.manga)) {
        throw error(404, 'blocked because of copyright');
    }
    const manga = await request("manga/" + params.manga + "?includes[]=author&includes[]=cover_art&includes[]=artist&includes[]=manga");
    console.log(manga);
    return {
        manga: manga.data.attributes,
        mangaRelationships: manga.data.relationships,
        id: manga.data.id
    }
}