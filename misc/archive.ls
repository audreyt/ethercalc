#!/usr/local/bin/lsc
require! <[ fs redis ]>
r = redis.createClient!
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
  step!
step!
