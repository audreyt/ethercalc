vm = require \vm
fs = require \fs
path = require \path
bootSC = fs.readFileSync "#{
    path.dirname fs.realpathSync __filename
}/SocialCalcModule.js" \utf8
global.SC ?= {}
argv = (try require \optimist .boolean <[ vm polling ]> .argv) || {}

##################################
### WebWorker Threads Fallback ###
##################################
Worker = try
  throw \vm if argv.vm
  console.log "Starting backend using webworker-threads"
  (require \webworker-threads).Worker
catch => console.log "Falling back to vm.CreateContext backend"; class => (code) ->
  vm = require \vm
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
    catch e => cb? e
  @terminate = ->
  @sandbox = sandbox = vm.createContext cxt
  sandbox.postMessage = (data) ~> @onmessage? {data}
  vm.runInContext "(#code)()", sandbox
##################################

@include = ->
    DB = @include \db

    SC._get = (room, io, cb) ->
        return cb { snapshot: SC[room]._snapshot } if SC[room]?_snapshot
        (, [snapshot, log]) <~ DB.multi!
            .get "snapshot-#room"
            .lrange "log-#room" 0 -1
            .exec!
        if (snapshot or log.length) and io
            SC[room] = SC._init snapshot, log, DB, room, io
        cb {log, snapshot}

    SC._put = (room, snapshot, cb) ->
        return cb?! unless snapshot
        <~ DB.multi!
            .set "snapshot-#room", snapshot
            .del ["log-#room" "chat-#room" "ecell-#room" "audit-#room"]
            .bgsave!exec!
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
              return unless status is \doneposcalc and not ss.editor.busy
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
            class Node
              (@tag="div", @attrs={}, @style={}, @elems=[], @raw='')->
              id:         ~(@attrs.id)->
              width:      ~(@attrs.width)->
              height:     ~(@attrs.height)->
              className:  ~(@attrs.class)->
              colSpan:    ~(@attrs.colspan)->
              rowSpan:    ~(@attrs.rowspan)->
              title:      ~(@attrs.title)->
              innerHTML:  ~
                (@raw)->
                -> @raw or [e.outerHTML for e in @elems].join("\n")
              outerHTML:  ~->
                {tag, attrs, style} = @
                css = style.cssText or [ "#k:#v" for k, v of style ].join(";")
                if css then attrs.style = css else delete attrs.style
                return "<#tag#{
                    [ " #k=\"#v\"" for k, v of attrs ].join('')
                }>#{ @innerHTML }</#tag>"
              appendChild: -> @elems.push it
            SocialCalc.document.createElement = -> new Node it
        w._snapshot = snapshot
        w.thread.eval bootSC
        w.postMessage { type: \init, room, log, snapshot }
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
        w.onmessage = ({ data: { type, snapshot, html, csv, ref, parts, save } }) -> switch type
        | \snapshot   => w.on-snapshot snapshot
        | \save       => w.on-save save
        | \html       => w.on-html html
        | \csv        => w.on-csv csv
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
        return w
    return SC
