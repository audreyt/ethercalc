**v0.2.0beta2** (xxxx-xx-xx):

  - Changed: externals (`zappa {foo} ->`) are available at all scopes, shadow globals and root scope locals.
  
  - Fixed: inline templates with multiple apps.
  
  - Added `stylus` to the root scope.
  
  - Fixed #58: multiple socket events fail. Also applied the same fix to helpers.
  
  - Changed `zappa.run` to interpret a number-castable string param as the port, to better integrate with Heroku. Closes #61 [Tim Shadel]
  
  - Fixed #64: require does not pick up node_modules in app dir. [Jason King]

**v0.2.0beta** (2011-08-02):

  - Complete rewrite, see `/docs/peaches.md` for a more in-depth review on changes.
  
  - Fixed performance, now negligible overhead on top of express. Gone with the `with` keyword.

  - Scraped the `zappa` command, zappa code should go in `require('zappa') ->` blocks. All node tools and services can be used directly.

  - Changed `include`, now implemented through standard module mechanisms. Code to be included must be exported: `@include = ->`.

  - Added `app` and `io` variables to all scopes, providing direct access to express and socket.io.
  
  - Added optimized interfaces to express features such as `use`, `set`, `enable`, `disable`, `configure`, etc.
    
  - Changed `render`, now uses the rendering system from express, with all its features. Defining inline templates with `view` and passing variables through `@` is still possible.
    
  - Added an optional client-side API that can be used with `client`. To just serve code as JS, use `coffee`.
  
  - Added `shared`, allows sharing code between client and server.
  
  - Removed most zappa's defaults, added very concise APIs to define what you need.

**v0.1.5** (2011-05-06):

  - Reworked packaging for npm 1.x.

**v0.1.4** (2011-01-05):

  - Updated to CoffeeScript 1.0.0 and node 0.2.6/0.3.3.
  - Soda tests by Nicholas Kinsey.
  - `broadcast` passing along optional `except` param to socket.io.
  - Empty app files now start a default "blank" app, serving files at /public.
  - `zappa -n/--hostname` to listen on a specific hostname or IP.
  - Made defs available to postrenders' scope.
  - Bug fixes.

**v0.1.3** (2010-11-24):

  - Updated to CoffeeScript 0.9.5 and node 0.2.5/0.3.1.
  - Partials support.
  - Compilation to .js file with `zappa -c`.
  - Auto-restarting on changes with `zappa -w`.

**v0.1.2** (2010-11-13):

  - Multiple `using`'s: `using 'foo', 'bar', 'etc'`.
  - Added `layout: no` option to `render`.
  - Added `require` at the root level and `send` at the request level (shortcut to `request.send`).
  - bodyDecoder, cookieDecoder and session middleware by default. Configs to turn them off will follow.
  - Using new jQuery (1.4.3) npm package instead of jsdom directly.
  - Using Socket.IO 0.6.0 (great improvements over the previous version).

**v0.1.1** (2010-10-22):

**v0.1.0** (2010-10-21):
