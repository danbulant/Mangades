import HMR from '@roxi/routify/hmr'
import App from './App.svelte';
import { logs } from './util/logs';

function display(formatted, type) {
    const displayed = {
        text: formatted,
        type
    };

    logs.update(toDisplay => {
        toDisplay.push(displayed);
        return toDisplay;
    });

    if(type !== "error") {
        setTimeout(() => {
            logs.update(toDisplay => {
                const i = toDisplay.indexOf(displayed);
                toDisplay.splice(i, 1);
                return toDisplay;
            });
        }, 1000);
    }
}

const error = console.error.bind(console);
window.console.error = (...args) => {
    error(...args);
    display(JSON.stringify(args), "error");
}

window.onerror = (event, SourceBuffer, line, col, error) => {
    error(error);
    display(error.message + "\n" + error.stack, "error");
}

// const log = console.log.bind(console);
// window.console.log = (...args) => {
//     log(...args);
//     display(JSON.stringify(args), "log");
//}

const app = HMR(App, { target: document.body }, 'routify-app')

export default app;