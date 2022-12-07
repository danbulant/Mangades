import { sveltekit } from '@sveltejs/kit/vite';
import WindiCSS from 'vite-plugin-windicss';

export default {
    clearScreen: false,
    plugins: [
        WindiCSS(),
        sveltekit()
    ]
}