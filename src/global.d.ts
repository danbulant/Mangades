/// <reference types="@sveltejs/kit" />

declare namespace App {
    interface Error {
        message: string;
        code: string;
    }
    interface Window {
        goatcounter: any;
    }
}