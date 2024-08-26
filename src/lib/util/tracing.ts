// import { browser } from '$app/environment';
// import { ApmBase, init as initApm } from '@elastic/apm-rum'

// var apm_: ApmBase;
//
// if(browser) {
//     apm_ = initApm({
//         // Set required service name (allowed characters: a-z, A-Z, 0-9, -, _, and space)
//         serviceName: 'mangades',
//    
//         // Set custom APM Server URL (default: http://localhost:8200)
//         serverUrl: 'https://apm.elasticsearch.danbulant.cloud',
//    
//         // Set the service version (required for source map feature)
// //         serviceVersion: import.meta.env.VITE_SENTRY_RELEASE,
//
//         // Set the service environment
//         environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'production'
//     });
// }
//
// export const apm = apm_;