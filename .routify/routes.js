
/**
 * @roxi/routify 2.18.4
 * File generated Mon Jan 10 2022 15:33:28 GMT+0100 (Central European Standard Time)
 */

export const __version = "2.18.4"
export const __timestamp = "2022-01-10T14:33:28.723Z"

//buildRoutes
import { buildClientTree } from "@roxi/routify/runtime/buildRoutes"

//imports


//options
export const options = {}

//tree
export const _tree = {
  "name": "_layout",
  "filepath": "/_layout.svelte",
  "root": true,
  "ownMeta": {
    "preload": "proximity"
  },
  "absolutePath": "/home/dan/projects/node/Mangades/src/pages/_layout.svelte",
  "children": [
    {
      "isFile": true,
      "isDir": false,
      "file": "_fallback.svelte",
      "filepath": "/_fallback.svelte",
      "name": "_fallback",
      "ext": "svelte",
      "badExt": false,
      "absolutePath": "/home/dan/projects/node/Mangades/src/pages/_fallback.svelte",
      "importPath": "../src/pages/_fallback.svelte",
      "isLayout": false,
      "isReset": false,
      "isIndex": false,
      "isFallback": true,
      "isPage": false,
      "ownMeta": {},
      "meta": {
        "recursive": true,
        "preload": "proximity",
        "prerender": true
      },
      "path": "/_fallback",
      "id": "__fallback",
      "component": () => import('../src/pages/_fallback.svelte').then(m => m.default)
    },
    {
      "isFile": true,
      "isDir": true,
      "file": "_layout.svelte",
      "filepath": "/[manga]/_layout.svelte",
      "name": "_layout",
      "ext": "svelte",
      "badExt": false,
      "absolutePath": "/home/dan/projects/node/Mangades/src/pages/[manga]/_layout.svelte",
      "children": [
        {
          "isFile": true,
          "isDir": true,
          "file": "_layout.svelte",
          "filepath": "/[manga]/[chapter]/_layout.svelte",
          "name": "_layout",
          "ext": "svelte",
          "badExt": false,
          "absolutePath": "/home/dan/projects/node/Mangades/src/pages/[manga]/[chapter]/_layout.svelte",
          "children": [
            {
              "isFile": true,
              "isDir": false,
              "file": "[page].svelte",
              "filepath": "/[manga]/[chapter]/[page].svelte",
              "name": "[page]",
              "ext": "svelte",
              "badExt": false,
              "absolutePath": "/home/dan/projects/node/Mangades/src/pages/[manga]/[chapter]/[page].svelte",
              "importPath": "../src/pages/[manga]/[chapter]/[page].svelte",
              "isLayout": false,
              "isReset": false,
              "isIndex": false,
              "isFallback": false,
              "isPage": true,
              "ownMeta": {},
              "meta": {
                "recursive": true,
                "preload": "proximity",
                "prerender": true
              },
              "path": "/:manga/:chapter/:page",
              "id": "__manga__chapter__page",
              "component": () => import('../src/pages/[manga]/[chapter]/[page].svelte').then(m => m.default)
            },
            {
              "isFile": true,
              "isDir": false,
              "file": "index.svelte",
              "filepath": "/[manga]/[chapter]/index.svelte",
              "name": "index",
              "ext": "svelte",
              "badExt": false,
              "absolutePath": "/home/dan/projects/node/Mangades/src/pages/[manga]/[chapter]/index.svelte",
              "importPath": "../src/pages/[manga]/[chapter]/index.svelte",
              "isLayout": false,
              "isReset": false,
              "isIndex": true,
              "isFallback": false,
              "isPage": true,
              "ownMeta": {},
              "meta": {
                "recursive": true,
                "preload": "proximity",
                "prerender": true
              },
              "path": "/:manga/:chapter/index",
              "id": "__manga__chapter_index",
              "component": () => import('../src/pages/[manga]/[chapter]/index.svelte').then(m => m.default)
            }
          ],
          "isLayout": true,
          "isReset": false,
          "isIndex": false,
          "isFallback": false,
          "isPage": false,
          "importPath": "../src/pages/[manga]/[chapter]/_layout.svelte",
          "ownMeta": {},
          "meta": {
            "recursive": true,
            "preload": "proximity",
            "prerender": true
          },
          "path": "/:manga/:chapter",
          "id": "__manga__chapter__layout",
          "component": () => import('../src/pages/[manga]/[chapter]/_layout.svelte').then(m => m.default)
        },
        {
          "isFile": true,
          "isDir": false,
          "file": "index.svelte",
          "filepath": "/[manga]/index.svelte",
          "name": "index",
          "ext": "svelte",
          "badExt": false,
          "absolutePath": "/home/dan/projects/node/Mangades/src/pages/[manga]/index.svelte",
          "importPath": "../src/pages/[manga]/index.svelte",
          "isLayout": false,
          "isReset": false,
          "isIndex": true,
          "isFallback": false,
          "isPage": true,
          "ownMeta": {},
          "meta": {
            "recursive": true,
            "preload": "proximity",
            "prerender": true
          },
          "path": "/:manga/index",
          "id": "__manga_index",
          "component": () => import('../src/pages/[manga]/index.svelte').then(m => m.default)
        }
      ],
      "isLayout": true,
      "isReset": false,
      "isIndex": false,
      "isFallback": false,
      "isPage": false,
      "importPath": "../src/pages/[manga]/_layout.svelte",
      "ownMeta": {},
      "meta": {
        "recursive": true,
        "preload": "proximity",
        "prerender": true
      },
      "path": "/:manga",
      "id": "__manga__layout",
      "component": () => import('../src/pages/[manga]/_layout.svelte').then(m => m.default)
    },
    {
      "isFile": true,
      "isDir": false,
      "file": "index.svelte",
      "filepath": "/index.svelte",
      "name": "index",
      "ext": "svelte",
      "badExt": false,
      "absolutePath": "/home/dan/projects/node/Mangades/src/pages/index.svelte",
      "importPath": "../src/pages/index.svelte",
      "isLayout": false,
      "isReset": false,
      "isIndex": true,
      "isFallback": false,
      "isPage": true,
      "ownMeta": {},
      "meta": {
        "recursive": true,
        "preload": "proximity",
        "prerender": true
      },
      "path": "/index",
      "id": "_index",
      "component": () => import('../src/pages/index.svelte').then(m => m.default)
    }
  ],
  "isLayout": true,
  "isReset": false,
  "isIndex": false,
  "isFallback": false,
  "isPage": false,
  "isFile": true,
  "file": "_layout.svelte",
  "ext": "svelte",
  "badExt": false,
  "importPath": "../src/pages/_layout.svelte",
  "meta": {
    "preload": "proximity",
    "recursive": true,
    "prerender": true
  },
  "path": "/",
  "id": "__layout",
  "component": () => import('../src/pages/_layout.svelte').then(m => m.default)
}


export const {tree, routes} = buildClientTree(_tree)

