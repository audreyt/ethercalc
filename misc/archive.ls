#!/usr/local/bin/lsc
require! <[ fs redis ]>
r = redis.createClient!
env = process.env
[redisDb, putInHistory] = env<[ REDIS_DB PUT_IN_HISTORY ]>
d = Math.floor (Date.now() / 1000)
if !fs.exists 'raw'
  fs.mkdir 'raw'
if putInHistory && !fs.exists '../static/history/'
  fs.mkdir '../static/history/'
if redisDb
  r.select redisDb
_, ks <- r.keys "snapshot-*"
step = ->
  process.exit! unless ks.length
  k = ks.shift!
  file = encodeURIComponent k
  _, v <- r.get k
  return step! if v.length is 593 # empty spreadsheet
  _, orig <- fs.readFile "raw/#file.txt" \utf-8
  return step! if orig is v
  console.log file
  <- fs.writeFile "raw/#file.txt", v
  if putInHistory
    dir = '../static/history/' + k - /snapshot-/
    exists <- fs.exists dir
    fs.mkdir dir if !exists
    <- fs.writeFile dir+"/"+d+".txt", v
  step!
step!
