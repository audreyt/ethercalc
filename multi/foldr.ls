$ = require \superagent
const one = "1"

export class HackFoldr
  (@base) -> @base -= /\/+$/
  fetch: (@id, cb) ->
    res <~ $.get "#{ @base }/_/#{ @id }/csv.json"
    if res.body?length
      res.body.shift! # header
      @rows = [ { link, title, row: idx+2 } for [link, title], idx in res.body | link and link isnt /^#/ and title = if title then title else "Sheet"+ (idx+1) ]
    else
      @was-non-existent = true
    if !@rows?length
      @was-empty = true
      return cb? @rows = [] , @.push({link: "/#{ @id }#one", title: \Sheet1 }) , cb(@)
    cb? @rows
  size: -> @rows.length
  lastIndex: -> @rows.length - 1
  lastRow: -> if @rows.length then @rows[*-1] else {}
  links: -> [ link for {link} in @rows ]
  titles: -> [ title for {title} in @rows ]
  at: (idx) -> @rows[idx] ? {}

  push: (row) ->
    @init row, ~> @post-csv row.link, row.title, ~>
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
    @send-cmd "set A#row:B#row empty multi-cascade"
    @rows.splice idx, 1; @

  send-cmd: (cmd, cb=->) ->
    @init null, ~> $.post("#{ @base }/_/#{ @id }").type(\text/plain).send(cmd).end ->

  init: (row, cb) ->
    if @was-non-existent
      row?row = 2
      @was-non-existent = false
      @was-empty = false
      return @post-raw-csv '#url', '#title', "/#{ @id }#one", "Sheet1", cb unless row
      return @post-init-csv '#url', '#title', "/#{ @id }#one", "Sheet1", row.link, row.title, cb
    else if @was-empty
      row?row = 2
      @was-empty = false
      return @post-csv "/#{ @id }#one", "Sheet1", cb unless row
      return @post-raw-csv "/#{ @id }#one", "Sheet1", row.link, row.title, cb
    cb!
  post-csv: (a="", b="", cb) ->
    $.post("#{ @base }/_/#{ @id }").type(\text/csv).accept(\application/json).send("""
      "#{ a.replace(/"/g, '""') }","#{ b.replace(/"/g, '""') }"
    """).end ~> cb? it
  post-raw-csv: (a="", b="", c="", d="", cb) ->
    $.post("#{ @base }/_/#{ @id }").type(\text/csv).accept(\application/json).send("""
      "#{ a.replace(/"/g, '""') }","#{ b.replace(/"/g, '""') }"
      "#{ c.replace(/"/g, '""') }","#{ d.replace(/"/g, '""') }"
    """).end ~>
      cb? it
  post-init-csv: (a="", b="", c="", d="", e="", f="", cb) ->
    $.post("#{ @base }/_/#{ @id }").type(\text/csv).accept(\application/json).send("""
      "#{ a.replace(/"/g, '""') }","#{ b.replace(/"/g, '""') }"
      "#{ c.replace(/"/g, '""') }","#{ d.replace(/"/g, '""') }"
      "#{ e.replace(/"/g, '""') }","#{ f.replace(/"/g, '""') }"
    """).end ~>
      cb? it


# test
#f = new HackFoldr \https://ethercalc.org/
#f = new HackFoldr \http://127.0.0.1:8000
#rows <- f.fetch \test
#console.log rows
