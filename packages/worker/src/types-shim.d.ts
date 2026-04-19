/* eslint-disable */
// Type shim: augment typeof globalThis with a `crypto` var so cross-package
// imports that do `globalThis.crypto` (e.g. @ethercalc/socketio-shim)
// typecheck under the worker's tsconfig. `@cloudflare/workers-types`
// declares `crypto` as a top-level `const`, which doesn't reach
// `typeof globalThis` in a consumer's scope.
declare var crypto: Crypto;
