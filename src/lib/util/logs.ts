import { writable } from "svelte/store";

export const logs = writable<{ type: string, text: string }[]>([]);