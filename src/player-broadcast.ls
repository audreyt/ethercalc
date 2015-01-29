@include = -> @client '/player/broadcast.js': ->
  SocialCalc = window.SocialCalc || alert 'Cannot find window.SocialCalc'

  return if SocialCalc?OrigDoPositionCalculations

  SocialCalc.OrigDoPositionCalculations = SocialCalc.DoPositionCalculations
  SocialCalc.DoPositionCalculations = ->
    SocialCalc.OrigDoPositionCalculations.apply SocialCalc, arguments
    SocialCalc.Callbacks.broadcast? \ask.ecell
    return

  if window.CryptoJS
    md5 = -> CryptoJS.MD5 it .toString!
    SocialCalc.hadSnapshot = true
    SocialCalc.OrigLoadEditorSettings = SocialCalc.LoadEditorSettings
    SocialCalc.LoadEditorSettings = (editor, str, flags) ->
      editor.SettingsCallbacks.ethercalc =
        save: -> "ethercalc:#{
          md5 editor.context.sheetobj.CreateSheetSave!
        }\n"
        load: (editor, setting, line, flags) ->
          hash = line.replace /^\w+:/ ''
          if hash is md5 editor.context.sheetobj.CreateSheetSave!
            SocialCalc.hadSnapshot = false
          else
            # TODO: Save back to session
            SocialCalc.hadSnapshot = true
      SocialCalc.LoadEditorSettings = SocialCalc.OrigLoadEditorSettings
      SocialCalc.OrigLoadEditorSettings(editor, str, flags)
  else
    SocialCalc.hadSnapshot = false

  SocialCalc.OrigSizeSSDiv = SocialCalc.SizeSSDiv
  SocialCalc.SizeSSDiv = (spreadsheet) ->
    return unless spreadsheet?parentNode
    SocialCalc.OrigSizeSSDiv spreadsheet

  SocialCalc.Sheet::ScheduleSheetCommands = ->
    SocialCalc.ScheduleSheetCommands.apply(SocialCalc, [@].concat([].slice.call(arguments)))
  SocialCalc.OrigScheduleSheetCommands = SocialCalc.ScheduleSheetCommands
  SocialCalc.ScheduleSheetCommands = (sheet, cmdstr, saveundo, isRemote) ->
    cmdstr = cmdstr.replace /\n\n+/g '\n'
    return unless /\S/.test cmdstr
    if not isRemote and cmdstr isnt \redisplay and cmdstr isnt \recalc
      # Multi-sheet: Rewrite $Title.A1 into "index.1"!A1
      # The window.__MULTI__ variable is populated by index.html.
      if window.__MULTI__?rows?length and cmdstr is /set \w+ formula /
        for {link, title} in window.__MULTI__.rows
          cmdstr.=replace //\$#title\.([A-Z]+[1-9][0-9]*)//ig """
            "#{ link.replace('/', '') }"!$1
          """
      SocialCalc.Callbacks.broadcast? \execute { cmdstr, saveundo }
    SocialCalc.OrigScheduleSheetCommands sheet, cmdstr, saveundo, isRemote
  SocialCalc.MoveECell = (editor, newcell) ->
    highlights = editor.context.highlights
    if editor.ecell
      return newcell if editor.ecell.coord is newcell
      SocialCalc.Callbacks.broadcast? \ecell do
        original: editor.ecell.coord
        ecell: newcell
      cell = SocialCalc.GetEditorCellElement editor, editor.ecell.row, editor.ecell.col
      delete highlights[editor.ecell.coord]
      highlights[editor.ecell.coord] = \range2 if editor.range2.hasrange and editor.ecell.row >= editor.range2.top and editor.ecell.row <= editor.range2.bottom and editor.ecell.col >= editor.range2.left and editor.ecell.col <= editor.range2.right
      editor.UpdateCellCSS cell, editor.ecell.row, editor.ecell.col
      editor.SetECellHeaders ''
      editor.cellhandles.ShowCellHandles false
    else SocialCalc.Callbacks.broadcast? \ecell ecell: newcell
    newcell = editor.context.cellskip[newcell] || newcell
    editor.ecell = SocialCalc.coordToCr newcell
    editor.ecell.coord = newcell
    cell = SocialCalc.GetEditorCellElement editor, editor.ecell.row, editor.ecell.col
    highlights[newcell] = \cursor
    for f of editor.MoveECellCallback
      editor.MoveECellCallback[f] editor
    editor.UpdateCellCSS cell, editor.ecell.row, editor.ecell.col
    editor.SetECellHeaders \selected
    for f of editor.StatusCallback
      editor.StatusCallback[f].func editor, \moveecell, newcell, editor.StatusCallback[f].params
    if editor.busy
      editor.ensureecell = true
    else
      editor.ensureecell = false
      editor.EnsureECellVisible!
    return newcell
