import { writable } from 'svelte-local-storage-store';

export const darkmode = writable("theme", "light");