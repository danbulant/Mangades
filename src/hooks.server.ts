import { Toucan } from 'toucan-js';

/** @type {import('@sveltejs/kit').HandleClientError} */
export function handleError({ error, event }) {
        // @ts-ignore
    if(import.meta.env.VITE_SENTRY_DSN !== undefined) {
        const sentry = new Toucan({
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

        sentry.captureException(error);
    }

    return {
        ...error,
        code: error?.code ?? 'UNKNOWN'
    };
  }