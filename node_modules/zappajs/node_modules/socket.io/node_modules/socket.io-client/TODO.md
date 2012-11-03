* Worker API
    * `importScripts`
        Probably just forward to `require`.
    * `setTimeout` / `clearTimeout` / `setInterval` / `clearInterval`
        Forwarding to the default implementation.
    * `onerror` handler
        Catch runtime errors; also addEventListener 'error'.
