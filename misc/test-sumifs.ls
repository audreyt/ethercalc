#!/usr/bin/env lsc
require! <[ vm fs path ]>
bootSC = fs.readFileSync "#{
  path.dirname fs.realpathSync __filename
}/../SocialCalcModule.js" \utf8

global.SC ?= {}
argv = (try require \optimist .boolean <[ vm polling ]> .argv) || {}

bootSC += """;(#{->
  class Node
    (@tag="div", @attrs={}, @style={}, @elems=[], @raw='')->
    id:     ~(@attrs.id)->
    width:    ~(@attrs.width)->
    height:   ~(@attrs.height)->
    className:  ~(@attrs.class)->
    colSpan:  ~(@attrs.colspan)->
    rowSpan:  ~(@attrs.rowspan)->
    title:    ~(@attrs.title)->
    innerHTML:  ~
      (@raw)->
      -> @raw or [e.outerHTML for e in @elems].join("\n")
    outerHTML:  ~->
      {tag, attrs, style} = @
      css = style.cssText or [ "#{k.replace(/[A-Z]/g, '-$&').toLowerCase()}:#v" for k, v of style ].join(";")
      if css then attrs.style = css else delete attrs.style
      return "<#tag#{
        [ " #k=\"#v\"" for k, v of attrs ].join('')
      }>#{ @innerHTML }</#tag>"
    appendChild: -> @elems.push it
  SocialCalc.document.createElement = -> new Node it
})();"""

##################################
### WebWorker Threads Fallback ###
##################################
IsThreaded = true
Worker = try
  throw \vm if argv.vm
  console.log "Starting backend using webworker-threads"
  (require \webworker-threads).Worker
catch
  console.log "Falling back to vm.CreateContext backend"
  IsThreaded = false

Worker ||= class => (code) ->
  cxt = { console, self: { onmessage: -> } }
  cxt.window =
    setTimeout: (cb, ms) -> process.nextTick cb
    clearTimeout: ->
  @postMessage = (data) -> sandbox.self.onmessage {data}
  @thread = cxt.thread =
    nextTick: (cb) -> process.nextTick cb
    eval: (src, cb) -> try
      rv = vm.runInContext src, sandbox
      cb? null, rv
    catch e
      console.log "e #e"
      cb? e
  @terminate = ->
  @sandbox = sandbox = vm.createContext cxt
  sandbox.postMessage = (data) ~> @onmessage? {data}
  vm.runInContext "(#code)()", sandbox if code
  return @
##################################

do ->
  SC.csv-to-save = (csv, cb) ->
    w = new Worker
    <- w.thread.eval bootSC
    (,rv) <- w.thread.eval "SocialCalc.ConvertOtherFormatToSave(#{ JSON.stringify csv }, 'csv')"
    cb rv

  SC._get = (room, io, cb) ->
    return cb { snapshot: SC[room]._snapshot } if SC[room]?_snapshot
    (, [snapshot, log]) <~ DB.multi!
      .get "snapshot-#room"
      .lrange "log-#room" 0 -1
      .exec!
    DB.expire "snapshot-#room", EXPIRE if EXPIRE
    if (snapshot or log.length) and io
      SC[room] = SC._init snapshot, log, DB, room, io
    cb {log, snapshot}

  SC._put = (room, snapshot, cb) ->
    return cb?! unless snapshot
    <~ DB.multi!
      .set "snapshot-#room", snapshot
      .del ["log-#room" "chat-#room" "ecell-#room" "audit-#room"]
      .bgsave!exec!
    DB.expire "snapshot-#room", EXPIRE if EXPIRE
    cb?!

  SC._init = (snapshot, log=[], DB, room, io) ->
    if SC[room]?
      SC[room]._doClearCache!
      return SC[room]
    w = new Worker ->
      self.onmessage = ({ data: { type, ref, snapshot, command, room, log=[] } }) -> switch type
      | \cmd
        window.ss.ExecuteCommand command
      | \recalc
        SocialCalc.RecalcLoadedSheet ref, snapshot, true
      | \clearCache
        SocialCalc.Formula.SheetCache.sheets = {}
      | \exportSave
        postMessage { type: \save, save: window.ss.CreateSheetSave! }
      | \exportHTML
        postMessage { type: \html, html: window.ss.CreateSheetHTML! }
      | \exportCSV
        csv = window.ss.SocialCalc.ConvertSaveToOtherFormat(
          window.ss.CreateSheetSave!
          \csv
        )
        postMessage { type: \csv, csv }
      | \exportCells
        postMessage { type: \cells, cells: window.ss.cells }
      | \init
        SocialCalc.SaveEditorSettings = -> ""
        SocialCalc.CreateAuditString = -> ""
        SocialCalc.CalculateEditorPositions = ->
        SocialCalc.Popup.Types.List.Create = ->
        SocialCalc.Popup.Types.ColorChooser.Create = ->
        SocialCalc.Popup.Initialize = ->
        SocialCalc.RecalcInfo.LoadSheet = (ref) ->
          ref = "#ref".replace(/[^a-zA-Z0-9]+/g '')toLowerCase!
          postMessage { type: \load-sheet, ref }
          return true
        window.setTimeout = (cb, ms) -> thread.next-tick cb
        window.clearTimeout = ->
        window.ss = ss = new SocialCalc.SpreadsheetControl
        ss.SocialCalc = SocialCalc
        ss._room = room
        parts = ss.DecodeSpreadsheetSave(snapshot) if snapshot
        ss.editor.StatusCallback.EtherCalc = func: (editor, status, arg) ->
          return unless status is \doneposcalc # and not ss.editor.busy
          newSnapshot = ss.CreateSpreadsheetSave!
          return if ss._snapshot is newSnapshot
          ss._snapshot = newSnapshot
          postMessage { type: \snapshot, snapshot: newSnapshot }
        if parts?sheet
          ss.sheet.ResetSheet!
          ss.ParseSheetSave snapshot.substring parts.sheet.start, parts.sheet.end
        cmdstr = [ line for line in log
             | not /^re(calc|display)$/.test(line) ].join("\n")
        cmdstr += "\n" if cmdstr.length
        ss.context.sheetobj.ScheduleSheetCommands "set sheet defaulttextvalueformat text-wiki\n#{
          cmdstr
        }recalc\n" false true
    w._snapshot = snapshot
    w.on-snapshot = (newSnapshot) ->
      io.sockets.in "recalc.#room" .emit \data {
        type: \recalc
        snapshot: newSnapshot
        force: true
        room
      }
      w._snapshot = newSnapshot
      <~ DB.multi!
        .set "snapshot-#room" newSnapshot
        .del "log-#room"
        .bgsave!
        .exec!
      console.log "==> Regenerated snapshot for #room"
      DB.expire "snapshot-#room", EXPIRE if EXPIRE
    w.onerror = -> console.log it
    w.onmessage = ({ data: { type, snapshot, html, csv, ref, parts, save } }) -> switch type
    | \snapshot   => w.on-snapshot snapshot
    | \save     => w.on-save save
    | \html     => w.on-html html
    | \csv    => w.on-csv csv
    | \load-sheet
      <- SC._get ref, io
      if SC[ref]
        save <- SC[ref]exportSave
        w.postMessage { type: \recalc, ref, snapshot: save }
      else
        w.postMessage { type: \recalc, ref, snapshot: '' }
    w._doClearCache = -> @postMessage { type: \clearCache }
    w.ExecuteCommand = (command) -> @postMessage { type: \cmd, command }
    w.exportHTML = (cb) -> w.thread.eval """
      window.ss.CreateSheetHTML()
    """, (, html) -> cb html
    w.exportCSV = (cb) -> w.thread.eval """
      window.ss.SocialCalc.ConvertSaveToOtherFormat(
        window.ss.CreateSheetSave(), "csv"
      )
    """, (, csv) -> cb csv
    # Create a new worker for each HTML conversion to avoid starvation
    if IsThreaded => w.exportHTML = !(cb) ->
    # Create a new worker for each CSV conversion to avoid starvation
    if IsThreaded => w.exportCSV = !(cb) ->
      x = new Worker -> @onmessage = ({data: { snapshot, log=[] }}) -> try
        parts = SocialCalc.SpreadsheetControlDecodeSpreadsheetSave("", snapshot)
        save = snapshot.substring parts.sheet.start, parts.sheet.end
        if log?length
          cmdstr = [ line for line in log
               | not /^re(calc|display)$/.test(line) and line isnt "set sheet defaulttextvalueformat text-wiki"].join("\n")
          cmdstr += "\n" if cmdstr.length
          window.setTimeout = (cb, ms) -> thread.next-tick cb
          window.clearTimeout = ->
          window.ss = ss = new SocialCalc.SpreadsheetControl
          ss.sheet.ResetSheet!
          ss.ParseSheetSave save
          ss.editor.StatusCallback.EtherCalc = func: (editor, status, arg) ->
            return unless status is \doneposcalc
            save = ss.CreateSheetSave!
            post-message SocialCalc.ConvertSaveToOtherFormat(save, \csv)
          ss.context.sheetobj.ScheduleSheetCommands cmdstr, false true
        else
          post-message SocialCalc.ConvertSaveToOtherFormat(save, \csv)
      catch e => post-message "ERROR: #{ e }"
      x.onmessage = ({data}) -> x.thread.destroy!; cb data
      log = []
      x.thread.eval bootSC, -> x.post-message {snapshot: w._snapshot, log}
    w.exportSave = (cb) -> w.thread.eval """
      window.ss.CreateSheetSave()
    """, (, save) -> cb save
    w.exportCell = (coord, cb) -> w.thread.eval """
      JSON.stringify(window.ss.sheet.cells[#{
      JSON.stringify(coord) - /\s/g
      }])
    """, (, cell) -> if cell is \undefined then cb 'null' else cb cell
    w.exportCells = (cb) -> w.thread.eval """
      JSON.stringify(window.ss.sheet.cells)
    """, (, cells) -> cb cells
    w.thread.eval bootSC, ~> w.postMessage { type: \init, room, log, snapshot }
    return w
  return SC

snapshot = "socialcalc:version:1.0\nMIME-Version: 1.0\nContent-Type: multipart/mixed; boundary=SocialCalcSpreadsheetControlSave\n--SocialCalcSpreadsheetControlSave\nContent-type: text/plain; charset=UTF-8\n\n# SocialCalc Spreadsheet Control Save\nversion:1.0\npart:sheet\npart:edit\npart:audit\n--SocialCalcSpreadsheetControlSave\nContent-type: text/plain; charset=UTF-8\n\nversion:1.5\ncell:A1:t:Quantity Sold\ncell:B1:t:Product\ncell:C1:t:Salesperson\ncell:A2:v:5\ncell:B2:t:Apples\ncell:C2:v:1\ncell:A3:v:4\ncell:B3:t:Apples\ncell:C3:v:2\ncell:A4:v:15\ncell:B4:t:Artichokes\ncell:C4:v:1\ncell:A5:v:3\ncell:B5:t:Artichokes\ncell:C5:v:2\ncell:A6:v:22\ncell:B6:t:Bananas\ncell:C6:v:1\ncell:A7:v:12\ncell:B7:t:Bananas\ncell:C7:v:2\ncell:A8:v:10\ncell:B8:t:Carrots\ncell:C8:v:1\ncell:A9:v:33\ncell:B9:t:Carrots\ncell:C9:v:2\ncell:A10:t:Formula\ncell:A11:vtf:n::SUMIF(B2\\cB9, \"=Bananas\", A2\\cA9)\ncell:A12:vtf:n::SUMIFS(A2\\cA9, B2\\cB9, \"=Bananas\", C2\\cC9, 1)\ncol:A:w:286\nsheet:c:3:r:12:tvf:1\nvalueformat:1:text-wiki\n--SocialCalcSpreadsheetControlSave\nContent-type: text/plain; charset=UTF-8\n\n--SocialCalcSpreadsheetControlSave\nContent-type: text/plain; charset=UTF-8\n\n--SocialCalcSpreadsheetControlSave--\n"

x = new Worker -> @onmessage = ({data: { snapshot, log=[] }}) -> try
  parts = SocialCalc.SpreadsheetControlDecodeSpreadsheetSave("", snapshot)
  save = snapshot.substring parts.sheet.start, parts.sheet.end
  window.setTimeout = (cb, ms) -> thread.next-tick cb
  window.clearTimeout = ->
  window.ss = ss = new SocialCalc.SpreadsheetControl
  ss.sheet.ResetSheet!
  ss.ParseSheetSave save
  ss.editor.StatusCallback.EtherCalc = func: (editor, status, arg) ->
    return unless status is \doneposcalc
    save = ss.CreateSheetSave!
    console.log SocialCalc.ConvertSaveToOtherFormat(save, \csv)
    console.log "^^ the last number should be 22"
    post-message \gone
  ss.context.sheetobj.ScheduleSheetCommands "recalc"
catch e => console.log "ERROR: #{ e }"
x.onmessage = ({data}) -> x.thread.destroy!
log = []
x.thread.eval bootSC, -> x.post-message {snapshot, log}
