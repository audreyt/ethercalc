#!/usr/bin/env lsc -cj
{exec} = require \child_process
exec "perl -pi -e 's/# [A-Z].*\\n/# @{[`date`]}/m' manifest.appcache"
name: \ethercalc
description: 'Multi-User Spreadsheet Server'
version: \0.20140806.1
homepage: 'http://ethercalc.net/'
repository:
  type: 'git'
  url: 'https://github.com/audreyt/ethercalc'
dependencies:
  redis: \0.8.2
  'uuid-pure': \*
  optimist: \*
  zappajs: \http://audreyt.org/tmp/zappajs-0.4.22-socketio-1.0.tgz
  cors: \*
  LiveScript: \1.2.x
optionalDependencies:
  'webworker-threads': \0.5.x
directories:
  bin: \./bin
subdomain: \ethercalc
scripts:
  start: \app.js
  prepublish: "node node_modules/LiveScript/bin/lsc -c package.json.ls || lsc -c package.json.ls || echo"
engines:
  node: '>= 0.8.x'
