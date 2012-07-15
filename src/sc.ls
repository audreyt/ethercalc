vm = require \vm
fs = require \fs
path = require \path
bootSC = fs.readFileSync "#{
    path.dirname fs.realpathSync __filename
}/SocialCalc.js" \utf8
global.SC ?= {}

@include = ->
    DB = @include \db

    SC._get = (room, io, cb) ->
        return cb { snapshot: SC[room]._snapshot } if SC[room]?_snapshot
        _, [snapshot, log] <~ DB.multi!
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
        sandbox = vm.createContext {
            SocialCalc: null, ss: null
            require: -> try require \jsdom
            console
        }
        try vm.runInContext bootSC, sandbox
        unless sandbox.SocialCalc
            console.log '==> Cannot load jsdom/contextify; falling back to log-only mode without support for ="page"!A1 refs'
            SC._init = -> null
            return null
        SocialCalc = sandbox.SocialCalc
        SocialCalc.SaveEditorSettings = -> ""
        SocialCalc.CreateAuditString = -> ""
        SocialCalc.CalculateEditorPositions = ->
        SocialCalc.Popup.Types.List.Create = ->
        SocialCalc.Popup.Types.ColorChooser.Create = ->
        SocialCalc.Popup.Initialize = ->
        vm.runInContext 'ss = new SocialCalc.SpreadsheetControl', sandbox
        SocialCalc.RecalcInfo.LoadSheet = (ref) ->
            ref = (ref - /[^a-zA-Z0-9]+/g).toLowerCase!
            if SC[ref]
                serialization = SC[ref].CreateSpreadsheetSave!
                parts = SC[ref].DecodeSpreadsheetSave serialization
                SocialCalc.RecalcLoadedSheet do
                    ref
                    serialization.substring parts.sheet.start, parts.sheet.end
                    true # recalc
            else
                SocialCalc.RecalcLoadedSheet ref, '', true
            return true

        ss = sandbox.ss
        delete ss.editor.StatusCallback.statusline
        div = SocialCalc.document.createElement \div
        SocialCalc.document.body.appendChild div
        ss.InitializeSpreadsheetControl div, 0, 0, 0
        ss._room = room
        ss._doClearCache = -> SocialCalc.Formula.SheetCache.sheets = {}
        ss.editor.StatusCallback.EtherCalc = func: (editor, status, arg) ->
            return unless status is \doneposcalc and not ss.editor.busy
            newSnapshot = ss.CreateSpreadsheetSave!
            return if ss._snapshot is newSnapshot
            io.sockets.in "recalc.#room" .emit \data {
                type: \recalc
                snapshot: newSnapshot
                force: true
                room
            }
            ss._snapshot = newSnapshot
            <~ DB.multi!
                .set "snapshot-#room" newSnapshot
                .del "log-#room"
                .bgsave!
                .exec!
            console.log "==> Regenerated snapshot for #room"
        parts = ss.DecodeSpreadsheetSave(snapshot) if snapshot
        if parts?sheet
            ss.sheet.ResetSheet!
            ss.ParseSheetSave snapshot.substring parts.sheet.start, parts.sheet.end
        cmdstr = [ line for line in log
                 | not /^re(calc|display)$/.test(line) ] * \\n
        cmdstr += "\n" if cmdstr.length
        ss.context.sheetobj.ScheduleSheetCommands "set sheet defaulttextvalueformat text-wiki\n#{
            cmdstr
        }recalc\n" false true
        return ss
    return SC
