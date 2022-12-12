import * as Sentry from '@sentry/browser';
import { BrowserTracing } from "@sentry/tracing";

/** @type {import('./$types').PageLoad} */
export function load({ url, event }) {
    // @ts-ignore
    if(import.meta.env.VITE_SENTRY_DSN && typeof event !== "undefined" && typeof window !== 'undefined') 
        Sentry.init({
            // @ts-ignore
            dsn:  import.meta.env.VITE_SENTRY_DSN,
            // @ts-ignore
            environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
            // @ts-ignore
            release: import.meta.env.VITE_SENTRY_RELEASE,
            integrations: [
                new BrowserTracing(),
            ],
            tracesSampleRate: 1
        });
    }
    return {
        url: url.pathname
    };
}