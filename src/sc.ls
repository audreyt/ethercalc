require! <[ vm fs path ]>
const FindBin = path.dirname fs.realpathSync __filename
if fs.existsSync "#FindBin/node_modules/socialcalc/dist/SocialCalc.js" \utf8
  bootSC = fs.readFileSync "#FindBin/node_modules/socialcalc/dist/SocialCalc.js" \utf8
else
  bootSC = fs.readFileSync "#FindBin/node_modules/socialcalc/SocialCalc.js" \utf8
bootSC.=replace(/document\.createElement\(/g, 'SocialCalc.document.createElement(')
bootSC.=replace(/alert\(/g, '(function(){})(')

global.SC ?= {console}

argv = (try require \optimist .boolean <[ vm polling ]> .argv) || {}

bootSC += """;var navigator = {language: '', userAgent: ''}; var SocialCalc = this.SocialCalc; var window = this;(#{->
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
  SocialCalc.document ?= {}
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
  cxt = { console, self: { onmessage: -> }, alert: -> }
  cxt.window =
    setTimeout: (cb, ms) -> process.nextTick cb
    alert: ->
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

@include = ->
  DB = @include \db
  EXPIRE = @EXPIRE
  emailer = @include \emailer

  
  #eddy dataDir {
  dataDir = process.env.OPENSHIFT_DATA_DIR
  #dataDir = ".."  
  # }


  SC._csv-to-save = (csv, cb) ->
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
  SC._del = (room, cb) ->
    <~ DB.multi!
       .del ["snapshot-#room", "log-#room" "chat-#room" "ecell-#room" "audit-#room"]
       .bgsave!exec!
    cb?!
  SC._rooms = (cb) ->
    (, [rooms]) <~ DB.multi!
       .keys \snapshot-*
       .exec!
    cb [ ..replace(/^snapshot-/, "") for rooms]
  SC._roomtimes = (cb) ->
    (_, res) <~ DB.hgetall "timestamps"
    cb res
  SC._exists = (room, cb) ->
    (, [x]) <~ DB.multi!
       .exists "snapshot-#room"
       .exec!
       cb x
  SC._init = (snapshot, log=[], DB, room, io) ->
    if SC[room]?
      SC[room]._doClearCache!
      return SC[room]
    w = new Worker ->
      self.onmessage = ({ data: { type, ref, snapshot, command, room, log=[] } }) -> switch type
      | \cmd
        #console.log "===> cmd "+command
        commandParameters = command.split(" ")
        if commandParameters[0] is \settimetrigger
          #console.log "------ set time trigger --------"
          postMessage { type: \setcrontrigger, timetriggerdata: { cell:commandParameters[1], times:commandParameters[2] } }
        if commandParameters[0] is \sendemail
          #console.log "------ send email --------"
          #console.log " to:"+commandParameters[1]+" subject:"+commandParameters[2]+" body:"+commandParameters[3]             
          postMessage { type: \sendemailout, emaildata: { to: commandParameters[1].replace(/%20/g,' '), subject: commandParameters[2].replace(/%20/g,' '), body:commandParameters[3].replace(/%20/g,' ')  } }
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
        SocialCalc.CreateAuditString = -> ""
        SocialCalc.CalculateEditorPositions = ->
        SocialCalc.Popup.Types.List.Create = ->
        SocialCalc.Popup.Types.ColorChooser.Create = ->
        SocialCalc.Popup.Initialize = ->
        SocialCalc.RecalcInfo.LoadSheet = (ref) ->
          return if ref is /[^.=_a-zA-Z0-9]/
          ref.=toLowerCase!
          postMessage { type: \load-sheet, ref }
          return true
        window.setTimeout = (cb, ms) -> thread.next-tick cb
        window.clearTimeout = ->
        window.alert = alert = ->
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
        if parts?
          if parts.sheet
            ss.sheet.ResetSheet!
            ss.ParseSheetSave snapshot.substring parts.sheet.start, parts.sheet.end
          if parts.edit
            ss.editor.LoadEditorSettings snapshot.substring parts.edit.start, parts.edit.end
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
        .hset \timestamps "timestamp-#room" Date.now()
        .del "log-#room"
        .bgsave!
        .exec!
      #logdate = new Date() 
      #console.log "==> Regenerated snapshot #{logdate.getFullYear() }-#{(logdate.getMonth()) + 1 }-#{logdate.getDate()} #{logdate.getHours()}:#{logdate.getMinutes()}:#{logdate.getSeconds()} for #room"
      DB.expire "snapshot-#room", EXPIRE if EXPIRE
    w.onerror = -> console.log it
    w.onmessage = ({ data: { type, snapshot, html, csv, ref, parts, save, emaildata, timetriggerdata } }) -> switch type
    | \snapshot   => w.on-snapshot snapshot
    | \save     => w.on-save save
    | \html     => w.on-html html
    | \csv    => w.on-csv csv
    | \setcrontrigger
      console.log "set cron #room"
      # trigger times have been added or edited, so update the list of times and check the next scheduled item is correct
      #get next scheduled time to execute Time based trigger
      (, nextTriggerTime) <~ DB.get "cron-nextTriggerTime"
      scheduledNextTriggerTime = nextTriggerTime
      timeNowMins = Math.floor(new Date().getTime() / (1000 * 60))
      console.log "timeNowMins #timeNowMins .dataDir #dataDir"
      nextTriggerTime ?= 2147483647   # set to max seconds possible (31^2)
      triggerTimeList = for nextTime in timetriggerdata.times.split(",") when nextTime >= timeNowMins
        if nextTriggerTime > nextTime 
          nextTriggerTime = nextTime
        nextTime
      if scheduledNextTriggerTime != nextTriggerTime
        fs.writeFileSync do
          "#dataDir/nextTriggerTime.txt"
          nextTriggerTime
          \utf8               
      if triggerTimeList.length == 0 
        <~ DB.hdel "cron-list" "#{room}!#{timetriggerdata.cell}"
      else
        <~ DB.multi!
          .hset "cron-list" "#{room}!#{timetriggerdata.cell}" triggerTimeList.toString()
          .set "cron-nextTriggerTime" nextTriggerTime
          .bgsave!exec!
        (, allTimeTriggers) <~ DB.hgetall "cron-list"
        console.log "allTimeTriggers" {...allTimeTriggers} " nextTriggerTime #nextTriggerTime"
    | \sendemailout 
      console.log "onmessage "+emaildata.to
      emailer?sendemail emaildata.to, emaildata.subject, emaildata.body,  (message) ->
        io.sockets.in "log-#room" .emit \data {
          type: \confirmemailsent
          message
        }
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
      x = new Worker -> @onmessage = ({data: { snapshot, log=[] }}) -> try
        parts = SocialCalc.SpreadsheetControlDecodeSpreadsheetSave("", snapshot)
        save = snapshot.substring parts.sheet.start, parts.sheet.end
        window.setTimeout = (cb, ms) -> thread.next-tick cb
        window.clearTimeout = ->
        window.ss = ss = new SocialCalc.SpreadsheetControl
        ss.sheet.ResetSheet!
        ss.ParseSheetSave save
        if log?length
          cmdstr = [ line for line in log
               | not /^re(calc|display)$/.test(line) and line isnt "set sheet defaulttextvalueformat text-wiki"].join("\n")
          cmdstr += "\n" if cmdstr.length
          ss.editor.StatusCallback.EtherCalc = func: (editor, status, arg) ->
            return unless status is \doneposcalc
            post-message ss.CreateSheetHTML!
          ss.context.sheetobj.ScheduleSheetCommands cmdstr, false true
        else
          post-message ss.CreateSheetHTML!
      catch e => post-message "ERROR: #{ e }"
      x.onmessage = ({data}) -> x.thread.destroy!; cb data
      (, log) <~ DB.lrange "log-#room" 0 -1
      x.thread.eval bootSC, -> x.post-message {snapshot: w._snapshot, log}
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
      (, log) <~ DB.lrange "log-#room" 0 -1
      x.thread.eval bootSC, -> x.post-message {snapshot: w._snapshot, log}
    w._eval = (code, cb) ->
      setTimeout do #delay to give server side sheet time to initialize
        -> 
          #console.log "EVAL un-threaded"
          (, rv) <- w.thread.eval code
          return cb rv if rv?
          # Maybe thread is not yet initialized - retry at most once
          (, rv) <- w.thread.eval code
          return cb rv
        100ms
    if IsThreaded => w._eval = (code, cb) ->
      x = new Worker -> @onmessage = ({data: { snapshot, log=[], code }}) -> try
        #console.log "EVAL isThreaded"
        parts = SocialCalc.SpreadsheetControlDecodeSpreadsheetSave("", snapshot)
        save = snapshot.substring parts.sheet.start, parts.sheet.end
        window.setTimeout = (cb, ms) -> thread.next-tick cb
        window.clearTimeout = ->
        window.ss = ss = new SocialCalc.SpreadsheetControl
        ss.sheet.ResetSheet!
        ss.ParseSheetSave save
        if log?length
          cmdstr = [ line for line in log
               | not /^re(calc|display)$/.test(line) and line isnt "set sheet defaulttextvalueformat text-wiki"].join("\n")
          # TODO: Validate cmdstr!
          cmdstr += "\n" if cmdstr.length
          ss.editor.StatusCallback.EtherCalc = func: (editor, status, arg) ->
            return unless status is \doneposcalc
            post-message eval code
          ss.context.sheetobj.ScheduleSheetCommands cmdstr, false true
        else
          post-message eval code
      catch e => post-message "ERROR: #{ e }"
      x.onmessage = ({data}) -> x.thread.destroy!; cb data
      (, log) <~ DB.lrange "log-#room" 0 -1
      x.thread.eval bootSC, -> x.post-message {snapshot: w._snapshot, log, code}
    w.exportSave = (cb) -> w._eval "window.ss.CreateSheetSave()", cb
    w.exportCell = (coord, cb) -> w._eval """
      JSON.stringify(window.ss.sheet.cells[#{
        JSON.stringify(coord) - /\s/g
      }])
    """, (cell) -> if cell is \undefined then cb 'null' else cb cell
    w.exportCells = (cb) -> w._eval "JSON.stringify(window.ss.sheet.cells)", cb
    # eddy exportAttribs, triggerActionCell {
    w.exportAttribs = (cb) -> w._eval "window.ss.sheet.attribs", cb    
    w.triggerActionCell = (coord, cb) -> w._eval "window.ss.SocialCalc.TriggerIoAction.Email('#coord')" (emailcmd) ->
      #console.log "send via OAuth"
      for nextEmail in emailcmd
        nextEmail = for addSpaces in nextEmail #replace %20 with spaces
          addSpaces.replace(/%20/g,' ')
        [emailto, subject, body] = nextEmail
        emailer?sendemail emailto, subject, body,  (message) ->
      cb emailcmd
    #w.debug = (coord, cb) -> w._eval "window.ss.sheet.ioParameterList", cb
    # }
    w.thread.eval bootSC, ~> w.postMessage { type: \init, room, log, snapshot }
    return w
  return SC
