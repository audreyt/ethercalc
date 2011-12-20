@include = ->
  @client '/player.js': ->
    SocialCalc ?= {}
    SocialCalc._username = Math.random().toString()
    SocialCalc.isConnected = true
    SocialCalc.hadSnapshot = false
    SocialCalc._room = window.location.hash.replace('#', '')
    unless SocialCalc._room
        window.location = '/start'
        return
    
    try window.history.pushState {}, '', '/'+SocialCalc._room
    @connect()

    emit = (data) => @emit broadcast: data
    SocialCalc.Callbacks.broadcast = (type, data={}) =>
      return unless SocialCalc.isConnected
      data.user = SocialCalc._username
      data.room = SocialCalc._room
      data.type = type
      emit data

    SocialCalc.isConnected = true
    SocialCalc.Callbacks.broadcast "ask.snapshot"

    @on broadcast: ->
      return unless SocialCalc?.isConnected
      return if @data.user == SocialCalc._username
      return if @data.to and @data.to != SocialCalc._username
      return if @data.room and @data.room != SocialCalc._room

      editor = SocialCalc.CurrentSpreadsheetControlObject.editor
      switch @data.type
        when "chat"
          window.addmsg @data.msg
        when "ecells"
          for user, ecell of @data.ecells
            continue if user == SocialCalc._username
            peerClass = " " + user + " defaultPeer"
            find = new RegExp(peerClass, "g")
            cr = SocialCalc.coordToCr(ecell)
            cell = SocialCalc.GetEditorCellElement(editor, cr.row, cr.col)
            cell.element.className += peerClass if cell.element.className.search(find) == -1
        when "ecell"
            peerClass = " " + @data.user + " defaultPeer"
            find = new RegExp(peerClass, "g")
            if @data.original
              origCR = SocialCalc.coordToCr(@data.original)
              origCell = SocialCalc.GetEditorCellElement(editor, origCR.row, origCR.col)
              origCell.element.className = origCell.element.className.replace(find, "")
            cr = SocialCalc.coordToCr(@data.ecell)
            cell = SocialCalc.GetEditorCellElement(editor, cr.row, cr.col)
            cell.element.className += peerClass if cell.element.className.search(find) == -1
        when "ask.snapshot"
          SocialCalc.Callbacks.broadcast "snapshot",
            to: @data.user
            snapshot: SocialCalc.CurrentSpreadsheetControlObject.CreateSpreadsheetSave()
        when "ask.ecell"
          SocialCalc.Callbacks.broadcast "ecell",
            to: @data.user
            ecell: editor.ecell.coord
        when "log"
          break if SocialCalc.hadSnapshot
          SocialCalc.hadSnapshot = true
          spreadsheet = SocialCalc.CurrentSpreadsheetControlObject
          parts = spreadsheet.DecodeSpreadsheetSave(@data.snapshot) if @data.snapshot
          if parts
            if parts.sheet
              spreadsheet.sheet.ResetSheet()
              spreadsheet.ParseSheetSave @data.snapshot.substring(parts.sheet.start, parts.sheet.end)
            spreadsheet.editor.LoadEditorSettings @data.snapshot.substring(parts.edit.start, parts.edit.end)  if parts.edit
          window.addmsg @data.chat.join("\n"), true
          cmdstr = (
            line for line in @data.log when not /^re(calc|display)$/.test(line)
          ).join("\n")
          if cmdstr.length
            refreshCmd = "redisplay"
            editor = SocialCalc.CurrentSpreadsheetControlObject.editor
            if editor.context.sheetobj.attribs.recalc != "off"
              refreshCmd = "recalc"
            SocialCalc.CurrentSpreadsheetControlObject.context.sheetobj.ScheduleSheetCommands cmdstr + "\n#{refreshCmd}\n", false, true
#          editor.MoveECellCallback.broadcast = (e) ->
#            SocialCalc.Callbacks.broadcast "my.ecell"
#              ecell: e.ecell.coord
        when "snapshot"
          break if SocialCalc.hadSnapshot
          SocialCalc.hadSnapshot = true
          spreadsheet = SocialCalc.CurrentSpreadsheetControlObject
          parts = spreadsheet.DecodeSpreadsheetSave(@data.snapshot)
          if parts
            if parts.sheet
              spreadsheet.sheet.ResetSheet()
              spreadsheet.ParseSheetSave @data.snapshot.substring(parts.sheet.start, parts.sheet.end)
            spreadsheet.editor.LoadEditorSettings @data.snapshot.substring(parts.edit.start, parts.edit.end)  if parts.edit
          if spreadsheet.editor.context.sheetobj.attribs.recalc == "off"
            spreadsheet.ExecuteCommand "redisplay", ""
            spreadsheet.ExecuteCommand "set sheet defaulttextvalueformat text-wiki"
          else
            spreadsheet.ExecuteCommand "recalc", ""
            spreadsheet.ExecuteCommand "set sheet defaulttextvalueformat text-wiki"
        when "execute"
          SocialCalc.CurrentSpreadsheetControlObject.context.sheetobj.ScheduleSheetCommands @data.cmdstr, @data.saveundo, true
      return
