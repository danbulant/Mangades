import request from "$lib/util/request";
import { redirect } from "@sveltejs/kit";

export async function load() {
    const res = await request("manga/random");
    throw redirect(307, "./" + res.data.id);
}