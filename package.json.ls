#!/usr/bin/env lsc -cj
{exec} = require \child_process
exec "perl -pi -e 's/# [A-Z].*\\n/# @{[`date`]}/m' manifest.appcache"
name: \ethercalc
description: 'Multi-User Spreadsheet Server'
version: \0.20150103.3
homepage: 'http://ethercalc.net/'
repository:
  type: 'git'
  url: 'https://github.com/audreyt/ethercalc'
dependencies:
  redis: \0.8.2
  'uuid-pure': \*
  optimist: \*
  zappajs: \0.5.x
  cors: \*
  LiveScript: \1.3.x
  'csv-parse': '^0.0.6'
  j: '^0.4.3'
optionalDependencies:
  'webworker-threads': \0.5.x
devDependencies:
  'css-loader': '^0.9.0'
  'livescript-loader': '^0.1.2'
  'react': '^0.12.1'
  'react-basic-tabs': '^1.0.3'
  'react-hot-loader': '^0.5.0'
  'style-loader': '^0.8.2'
  'stylus-loader': '^0.4.0'
  'superagent': '^0.21.0'
  'webpack': '^1.4.13'
  'webpack-dev-server': '^1.6.6'
subdomain: \ethercalc
bin:
  ethercalc: \./bin/ethercalc
scripts:
  start: "node app.js"
  prepublish: "node node_modules/LiveScript/bin/lsc -c package.json.ls || lsc -c package.json.ls || echo"
engines:
  node: '>= 0.8.x'
