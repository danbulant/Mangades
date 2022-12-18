const ratelimits = new Map();

function callback({ func }) {
    const params = ratelimits.get(func);
    console.log(params, func, ratelimits);
    func(...params.params).then(params.result.resolve).catch(params.result.reject);
    ratelimits.delete(func);
}

/**
 * 
 * @param {T} func 
 * @param  {...Parameters<typeof T>} params 
 * @template T
 * @returns {Promise<ReturnType<T>>}
 */
function ratelimit(func, ...params) {
    console.log("Adding rate limit", func, params);
    const data = ratelimits.get(func) || {
        timeout: setTimeout(callback, 200, { func }),
        params,
        result: {}
    };
    if(!data.promise) data.promise = new Promise((resolve, reject) => {
        data.result.resolve = resolve;
        data.result.reject = reject;
    });

    ratelimits.set(func, data);
    return data.promise;
}

export default ratelimit;