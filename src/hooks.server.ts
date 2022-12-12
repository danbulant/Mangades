import * as Sentry from "@sentry/node";
/** @type {import('@sveltejs/kit').HandleClientError} */
export function handleError({ error, event }) {
    // @ts-ignore
    Sentry.captureException(error, { event });
   
    return {
        ...error,
        code: error?.code ?? 'UNKNOWN'
    };
  }