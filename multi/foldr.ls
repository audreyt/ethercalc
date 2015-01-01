$ = require \superagent

export class HackFoldr
  (@base) -> @base -= /\/+$/
  fetch: (@id, cb) ->
    res <~ $.get "#{ @base }/_/#{ @id }/csv.json"
    if res.body?length
      res.body.shift! # header
      @rows = [ { link, title, row: idx+2 } for [link, title], idx in res.body | link and title and link isnt /^#/ ]
    else
      @was-non-existent = true
    if !@rows?length
      @was-empty = true
      return cb? @rows = [ { row: 2, link: "/#{ @id }.1", title: \Sheet1 } ]
    cb? @rows
  size: -> @rows.length
  lastIndex: -> @rows.length - 1
  lastRow: -> if @rows.length then @rows[*-1] else {}
  links: -> [ link for {link} in @rows ]
  titles: -> [ title for {title} in @rows ]
  at: (idx) -> @rows[idx] ? {}

  push: (row) ->
    @init ~> @post-csv row.link, row.title, ~>
      if it?body?command?1 is /paste A(\d+) all/
        row.row = parseInt RegExp.$1
    @rows.push(row); @
  set-at: (idx, patch) ->
    if patch.title
      row = @rows[idx].row
      @send-cmd "set B#row text t #{ patch.title }"
    @rows[idx] <<< patch; @
  delete-at: (idx) ->
    row = @rows[idx].row
    @send-cmd "set A#row:B#row empty"
    @rows.splice idx, 1; @

  send-cmd: (cmd, cb=->) ->
    @init ~> $.post("#{ @base }/_/#{ @id }").type(\text/plain).send(cmd).end ->

  init: (cb) ->
    if @was-non-existent
      @was-non-existent = false
      return @post-csv '#url', '#title', ~> @init cb
    else if @was-empty
      @was-empty = false
      return @post-csv "/#{ @id }.1", "Sheet1", cb
    cb!
  post-csv: (a="", b="", cb) ->
    $.post("#{ @base }/_/#{ @id }").type(\text/csv).accept(\application/json).send("""
      "#{ a.replace(/"/g, '""') }","#{ b.replace(/"/g, '""') }"
    """).end ~> cb? it


# test
#f = new HackFoldr \https://ethercalc.org/
#f = new HackFoldr \http://127.0.0.1:8000
#rows <- f.fetch \test
#console.log rows
