@include = ->
  client '/player.js': ->
    SocialCalc ?= {}
    SocialCalc._username = Math.random().toString()
    SocialCalc.isConnected = true
    SocialCalc.hadSnapshot = false
    SocialCalc._room = window.location.hash.replace('#', '')
    unless SocialCalc._room
        window.location = '/start'
        return
    
    try window.history.pushState {}, '', '/'+SocialCalc._room

    connect()
    #subscribe(SocialCalc._room)

    SocialCalc.Callbacks.broadcast = (type, data={}) ->
      return unless SocialCalc.isConnected
      data.user = SocialCalc._username
      data.room = SocialCalc._room
      data.type = type
      emit 'broadcast', data

    SocialCalc.isConnected = true
    SocialCalc.Callbacks.broadcast "ask.snapshot"

    at broadcast: ->
      return unless SocialCalc?.isConnected
      return if @user == SocialCalc._username
      return if @to and @to != SocialCalc._username
      return if @room and @room != SocialCalc._room

      editor = SocialCalc.CurrentSpreadsheetControlObject.editor
      switch @type
        when "chat"
          window.addmsg @msg
        when "ecells"
          for user, ecell of @ecells
            continue if user == SocialCalc._username
            peerClass = " " + user + " defaultPeer"
            find = new RegExp(peerClass, "g")
            cr = SocialCalc.coordToCr(ecell)
            cell = SocialCalc.GetEditorCellElement(editor, cr.row, cr.col)
            cell.element.className += peerClass if cell.element.className.search(find) == -1
          break
        when "ecell"
            peerClass = " " + @user + " defaultPeer"
            find = new RegExp(peerClass, "g")
            if @original
              origCR = SocialCalc.coordToCr(@original)
              origCell = SocialCalc.GetEditorCellElement(editor, origCR.row, origCR.col)
              origCell.element.className = origCell.element.className.replace(find, "")
            cr = SocialCalc.coordToCr(@ecell)
            cell = SocialCalc.GetEditorCellElement(editor, cr.row, cr.col)
            cell.element.className += peerClass if cell.element.className.search(find) == -1
        when "ask.snapshot"
          SocialCalc.Callbacks.broadcast "snapshot",
            to: @user
            snapshot: SocialCalc.CurrentSpreadsheetControlObject.CreateSpreadsheetSave()
        when "ask.ecell"
          SocialCalc.Callbacks.broadcast "ecell",
            to: @user
            ecell: editor.ecell.coord
          break
        when "log"
          break if SocialCalc.hadSnapshot
          SocialCalc.hadSnapshot = true
          spreadsheet = SocialCalc.CurrentSpreadsheetControlObject
          window.addmsg @chat.join("\n"), true
          cmdstr = @log.join("\n")
          SocialCalc.CurrentSpreadsheetControlObject.context.sheetobj.ScheduleSheetCommands cmdstr, false, true
          editor = SocialCalc.CurrentSpreadsheetControlObject.editor
#          editor.MoveECellCallback.broadcast = (e) ->
#            SocialCalc.Callbacks.broadcast "my.ecell"
#              ecell: e.ecell.coord
        when "snapshot"
          break if SocialCalc.hadSnapshot
          SocialCalc.hadSnapshot = true
          spreadsheet = SocialCalc.CurrentSpreadsheetControlObject
          parts = spreadsheet.DecodeSpreadsheetSave(@snapshot)
          if parts
            if parts.sheet
              spreadsheet.sheet.ResetSheet()
              spreadsheet.ParseSheetSave @snapshot.substring(parts.sheet.start, parts.sheet.end)
            spreadsheet.editor.LoadEditorSettings @snapshot.substring(parts.edit.start, parts.edit.end)  if parts.edit
          if spreadsheet.editor.context.sheetobj.attribs.recalc == "off"
            spreadsheet.ExecuteCommand "redisplay", ""
            spreadsheet.ExecuteCommand "set sheet defaulttextvalueformat text-wiki"
          else
            spreadsheet.ExecuteCommand "recalc", ""
            spreadsheet.ExecuteCommand "set sheet defaulttextvalueformat text-wiki"
          break
        when "execute"
          SocialCalc.CurrentSpreadsheetControlObject.context.sheetobj.ScheduleSheetCommands @cmdstr, @saveundo, true
          break
###
