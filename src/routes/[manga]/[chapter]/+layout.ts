import request from "$lib/util/request";

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ parent, params }) {
    const data = await parent();
    const id = params.chapter;

    const chapterData = (await request("chapter/" + id)).data;
    console.log("cd", chapterData);

    const atHome = await request("at-home/server/" + id);
    console.log("@h", data);

    return {
        manga: data.manga,
        mangaId: data.id,
        id,
        chapter: chapterData,
        atHome
    };
}
