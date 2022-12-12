import { Toucan } from "toucan-js";
import * as Sentry from '@sentry/browser';

/** @type {import('./$types').PageLoad} */
export function load({ url, event }) {
    let sentry;
    // @ts-ignore
    if(import.meta.env.VITE_SENTRY_DSN) if(typeof window === 'undefined') {
        sentry = new Toucan({
            // @ts-ignore
            dsn: import.meta.env.VITE_SENTRY_DSN,

            // @ts-ignore
            environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
            // @ts-ignore
            release: import.meta.env.VITE_SENTRY_RELEASE,
            request: event.request,
            requestDataOptions: {
                allowedHeaders: [
                    'user-agent',
                    'cf-challenge',
                    'accept-encoding',
                    'accept-language',
                    'cf-ray',
                    'content-length',
                    'content-type',
                    'x-real-ip',
                    'host',
                ],
                allowedSearchParams: /(.*)/
            }
        });
    } else {
        sentry = Sentry;
        if(!sentry.isInitalized) {
            Sentry.init({
                // @ts-ignore
                dsn:  import.meta.env.VITE_SENTRY_DSN,
                // @ts-ignore
                environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
                // @ts-ignore
                release: import.meta.env.VITE_SENTRY_RELEASE
            });

            sentry.isInitalized = true;
        }
    }
    return {
        url: url.pathname,
        sentry
    };
}