
/** @type {import('@sveltejs/kit').HandleClientError} */
export function handleError({ error, event }) {
    return {
        ...error,
        code: error?.code ?? 'UNKNOWN'
    };
  }