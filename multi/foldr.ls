$ = require \superagent

export class HackFoldr
  (@base) -> @base -= /\/+$/
  fetch: (@id, cb) ->
    res <~ $.get "#{ @base }/_/#{ @id }/csv.json"
    if !res.body
      return cb @rows = [ { row: 2, link: "/#{ @id }=Sheet1", title: \Sheet1 } ]
    res.body.shift! # header
    cb @rows = [ { link, title, row: idx+2 } for [link, title], idx in res.body | link or title ]
  size: -> @rows.length
  lastIndex: -> @rows.length - 1
  lastRow: -> if @rows.length then @rows[*-1] else {}
  links: -> [ link for {link} in @rows ]
  titles: -> [ title for {title} in @rows ]
  at: (idx) -> @rows[idx] ? {}

  push: (row) -> @rows.push(row); @
  set-at: (idx, patch) -> @rows[idx] <<< patch; @
  delete-at: (idx) -> @rows.splice idx, 1; @

# test
#f = new HackFoldr \https://ethercalc.org/
#f = new HackFoldr \http://127.0.0.1:8000
#rows <- f.fetch \test
#console.log rows
