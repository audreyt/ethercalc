@include = -> @client '/player/main.js': ->
  $ = window.jQuery || window.$
  return location.reload! unless $
  doPlay = ~>
    window.SocialCalc ?= {}
    SocialCalc._username = Math.random!toString!
    SocialCalc.isConnected = true
    requestParams = SocialCalc.requestParams
    SocialCalc._auth = requestParams[\auth] if requestParams[\auth]?
    SocialCalc._app = true if requestParams[\app]?    
    SocialCalc._view = true if requestParams[\view]?
    #SocialCalc._view = SocialCalc._auth is \0     
    SocialCalc._room ?= window.EtherCalc?_room || window.location.hash.replace \# ''
    SocialCalc._room = "#{SocialCalc._room}".replace /^_+/ '' .replace /\?.*/ ''

    endpoint = $('script[src*="/socket.io/socket.io.js"]')?attr(\src)?replace(/\.?\/socket.io\/socket.io.js.*/ '')
    if endpoint is ''
      endpoint = location.pathname .replace // /(view|edit)$ // ''
      endpoint.=replace // #{ SocialCalc._room } $ // ''

    if window.Drupal?sheetnode
      if // overlay=node/\d+ //.test window.location.hash
        SocialCalc._room = window.location.hash.match // =node/(\d+) // .1
      else if // /node/\d+ //.test window.location.href
        SocialCalc._room = window.location.href.match // /node/(\d+) // .1
    else if SocialCalc._room
      unless SocialCalc.CurrentSpreadsheetControlObject
        <- setTimeout _, 100ms
        window.history.pushState {} '' "./#{ SocialCalc._room }#{
          switch
          | SocialCalc._app  => '/app'
          | SocialCalc._view  => '/view'
          | SocialCalc._auth  => '/edit'
          | otherwise     => ''
        }"
        if location.host is /^(?:www\.)?ethercalc\.net$/
          $ -> $('<a />', {
            id: "restore", target: "_blank"
            href: "https://ethercalc.net/log/?#{ SocialCalc._room }"
            title: "View & Restore Backups"
          }).text("↻").appendTo('body')
    else
      window.location = './_start'
      return

    options = { 'connect timeout': 1500ms, +reconnect, 'reconnection delay': 500ms, 'max reconnection attempts': 1800 }
    options.path = endpoint.replace(// /?$ // \/socket.io) if endpoint
    showError = ->
      vex?closeAll!
      vex?defaultOptions.className = 'vex-theme-flat-attack'
      vex?dialog.open do
        message: it
        buttons: []

    window.addEventListener \offline ->
      showError SocialCalc.Constants.s_loc_error_offline

    @connect('/', options)?io
      ..?on \reconnect ->
        return unless SocialCalc?isConnected
        SocialCalc.Callbacks.broadcast \ask.log
      ..?on \connect_error ->
        showError SocialCalc.Constants.s_loc_error_connection
      ..?on \connect_timeout ->
        showError SocialCalc.Constants.s_loc_timeout_connection
      ..?on \reconnect_error ->
        return unless SocialCalc?isConnected
        SocialCalc.hadSnapshot = false
        showError SocialCalc.Constants.s_loc_error_reconnecting
      ..?on \connect_failed ->
        showError SocialCalc.Constants.s_loc_error_reconnection_failed

    emit = (data) ~> @emit {data}
    SocialCalc.Callbacks.broadcast = (type, data={}) ~>
      return unless SocialCalc.isConnected
      data.user = SocialCalc._username
      data.room = SocialCalc._room if !data.room?        
      data.type = type
      data.auth = SocialCalc._auth if SocialCalc._auth
      emit data

    SocialCalc.isConnected = true
    SocialCalc.RecalcInfo.LoadSheetCache = {}
    SocialCalc.RecalcInfo.LoadSheet = (ref) ->
      return if ref is /[^.=_a-zA-Z0-9]/
      ref.=toLowerCase!
      emit type: \ask.recalc, user: SocialCalc._username, room: ref

    @on data: !->
      return unless SocialCalc?isConnected
      return if @data.user == SocialCalc._username and @data.room == SocialCalc._room     #ignore self calls to main spreadsheet, but formdata calls will still be processed
      return if @data.to and @data.to != SocialCalc._username
      ss = window.spreadsheet
      return unless ss
      return if @data.room and @data.room != SocialCalc._room and ss.formDataViewer?._room != @data.room and @data.type == "log"
      if @data.room and @data.room != SocialCalc._room and @data.type != "recalc" and @data.type != "log"
        return if ss.formDataViewer?._room != @data.room     
        ss = ss.formDataViewer   # process the form data sheet event
      editor = ss.editor
      switch @data.type
      | \confirmemailsent => SocialCalc.EditorSheetStatusCallback(null, "confirmemailsent", @data.message, editor);
      | \chat   => window.addmsg? @data.msg
      | \ecells   
        break if SocialCalc._app 
        do => for user, ecell of @data.ecells
          continue if user is SocialCalc._username
          peerClass = " #user defaultPeer"
          find = new RegExp peerClass, \g
          cr   = SocialCalc.coordToCr ecell
          cell = SocialCalc.GetEditorCellElement editor, cr.row, cr.col
          if cell?element.className.search(find) == -1
            cell.element.className += peerClass
      | \ecell
        peerClass = " #{@data.user} defaultPeer"
        find = new RegExp peerClass, \g
        if @data.original
          origCR   = SocialCalc.coordToCr @data.original
          origCell = SocialCalc.GetEditorCellElement editor, origCR.row, origCR.col
          origCell?.element.className = origCell.element.className.replace find, ''
          if @data.original is editor.ecell.coord or @data.ecell is editor.ecell.coord
            SocialCalc.Callbacks.broadcast \ecell,
              to: @data.user
              ecell: editor.ecell.coord
        break if SocialCalc._app 
        cr = SocialCalc.coordToCr @data.ecell
        cell = SocialCalc.GetEditorCellElement editor, cr.row, cr.col
        cell.element.className += peerClass if cell?element?className.search(find) == -1
      | \ask.ecell
        break if SocialCalc._app 
        SocialCalc.Callbacks.broadcast \ecell do
          to: @data.user
          ecell: editor.ecell.coord
      | \log
        ss = window.spreadsheet #
        vex?closeAll!
        #eddy
        if ss.formDataViewer?._room is @data.room
          if @data.snapshot
            parts = ss.DecodeSpreadsheetSave @data.snapshot
          ss.formDataViewer.sheet.ResetSheet!
          ss.formDataViewer.loaded = true
          SocialCalc.Callbacks.broadcast \ask.log
          # if formData sheet already exists
          if parts?sheet
            ss.formDataViewer.ParseSheetSave( @data.snapshot.substring( parts.sheet.start, parts.sheet.end))
            ss.formDataViewer.context.sheetobj.ScheduleSheetCommands "recalc\n", false, true
          break
        #}
        break if SocialCalc.hadSnapshot
        SocialCalc.hadSnapshot = true
        if @data.snapshot
          parts = ss.DecodeSpreadsheetSave @data.snapshot
        if parts?
          if parts.sheet
            ss.sheet.ResetSheet!
            ss.ParseSheetSave @data.snapshot.substring parts.sheet.start, parts.sheet.end
          if parts.edit
            ss.editor.LoadEditorSettings @data.snapshot.substring parts.edit.start, parts.edit.end
            # render not needed, render is triggered by:  CreateTableEditor (renders empty sheet) then RecalcTimerRoutine (renders loaded sheet)
        window.addmsg? @data.chat.join(\\n), true
        cmdstr = [ line for line in @data.log
             | not /^re(calc|display)$/.test(line) ].join \\n
        if cmdstr.length
          refreshCmd = \recalc
          ss.context.sheetobj.ScheduleSheetCommands "#cmdstr\n#refreshCmd\n", false, true
        else
          ss.context.sheetobj.ScheduleSheetCommands "recalc\n", false, true
      | \snapshot
        vex?closeAll!
        SocialCalc.hadSnapshot = true
        if @data.snapshot
          parts = ss.DecodeSpreadsheetSave @data.snapshot
        if parts?sheet
          ss.sheet.ResetSheet!
          ss.ParseSheetSave @data.snapshot.substring parts.sheet.start, parts.sheet.end
          ss.context.sheetobj.ScheduleSheetCommands "recalc\n", false, true
      | \recalc
        if @data.force
          # only remove updated sheet - fix cycle problem when using many sheets
          delete SocialCalc.Formula.SheetCache.sheets[@data.room]
          ss?sheet.recalconce = true
        parts = ss.DecodeSpreadsheetSave @data.snapshot if @data.snapshot
        if parts?sheet
          sheetdata = @data.snapshot.substring(parts.sheet.start, parts.sheet.end)
          SocialCalc.RecalcLoadedSheet(
            @data.room,
            sheetdata,
            true # recalc
          )
          if SocialCalc.RecalcInfo.LoadSheetCache[@data.room] isnt sheetdata
            SocialCalc.RecalcInfo.LoadSheetCache[@data.room] = sheetdata
            ss.context.sheetobj.ScheduleSheetCommands "recalc\n", false, true
        else
          SocialCalc.RecalcLoadedSheet @data.room, '', true
      | \execute
        ss.context.sheetobj.ScheduleSheetCommands @data.cmdstr, @data.saveundo, true
        if ss.currentTab is ss.tabnums?graph
          setTimeout do
            -> window.DoGraph false false
            100ms
      | \stopHuddle
        $(\#content)uiDisable!
        alert """
[Collaborative Editing Session Completed]

Thank you for your participation.

Check the activity stream to see the newly edited page!
"""
        window.onunload = null
        window.onbeforeunload = null
        window.location = '/'
      | \error
        vex?closeAll!
        vex?defaultOptions.className = 'vex-theme-flat-attack'
        vex?dialog.open do
          message: @data.message
          buttons: [
            $.extend {}, vex?dialog.buttons.YES, text: 'Return to ready-only mode', click: ->
              location.href = "../#{ SocialCalc._room }"
          ]

  window.doresize = !-> window.spreadsheet?DoOnResize!
  onReady = ->
    return onLoad! unless window.Drupal?sheetnode?sheetviews?length
    $container = window.Drupal?sheetnode.sheetviews[0].$container
    $container.bind \sheetnodeReady (_, {spreadsheet}) ->
      if spreadsheet.tabbackground is 'display:none;'
        if spreadsheet.InitializeSpreadsheetControl
          return
        SocialCalc._auth = \0
      onLoad spreadsheet

  $ -> setTimeout onReady, 1ms

  onLoad = (ssInstance=SocialCalc.CurrentSpreadsheetControlObject) ->
    window.spreadsheet = ss = ssInstance || (
      if SocialCalc._view || SocialCalc._app
        new SocialCalc.SpreadsheetViewer!
      else
        new SocialCalc.SpreadsheetControl!
    )
    
    # eddy {
    if !window.GraphOnClick?
      SocialCalc.Callbacks.broadcast \ask.log 
      return 
    # } eddy       

    ss.ExportCallback = (s) ->
      alert SocialCalc.ConvertSaveToOtherFormat(SocialCalc.Clipboard.clipboard, "csv")

    # eddy {
    # add Form tab as first tab
    #ss.tabs?[0]?html = ss.tabs?[0]?html.replace("style=\"", "style=\"display:none;")
    ss.tabnums.form = ss.tabs.length if ss.tabs
    ss.tabs?push do
      name: \form
      text: SocialCalc.Constants.s_loc_form
      html: """
        <div id="%id.formtools" style="display:none;"><div style="%tbt."><table cellspacing="0" cellpadding="0">
        <tr><td style="vertical-align:middle;padding-right:32px;padding-left:16px;"><div style="%tbt.">
        <input type="button" value="%loc!Live Form!" onclick="parent.location='#{SocialCalc._room}/form'" style="background-color: #5cb85c;border-color: #4cae4c;cursor: pointer;"> #{document.location.origin}/#{SocialCalc._room}/form </div></td>
        </tr></table></div></div>
      """
      view: \sheet
      onclick: null
      onclickFocus: true  
    # }

    ss.tabnums.graph = ss.tabs.length if ss.tabs
    ss.tabs?push do
      name: \graph
      text: SocialCalc.Constants.s_loc_graph
      html: """
        <div id="%id.graphtools" style="display:none;"><div style="%tbt."><table cellspacing="0" cellpadding="0"><tr><td style="vertical-align:middle;padding-right:32px;padding-left:16px;"><div style="%tbt.">%loc!Cells to Graph!</div><div id="%id.graphrange" style="font-weight:bold;">%loc!Not Set!</div></td><td style="vertical-align:top;padding-right:32px;"><div style="%tbt.">%loc!Set Cells To Graph!</div><select id="%id.graphlist" size="1" onfocus="%s.CmdGotFocus(this);"><option selected>[select range]</option><option>%loc!Select all!</option></select></td><td style="vertical-align:middle;padding-right:4px;"><div style="%tbt.">%loc!Graph Type!</div><select id="%id.graphtype" size="1" onchange="window.GraphChanged(this);" onfocus="%s.CmdGotFocus(this);"></select><input type="button" value="%loc!OK!" onclick="window.GraphSetCells();" style="font-size:x-small;"></div></td><td style="vertical-align:middle;padding-right:16px;"><div style="%tbt.">&nbsp;</div><input id="%id.graphhelp" type="button" onclick="DoGraph(true);" value="%loc!Help!" style="font-size:x-small;"></div></td><td style="vertical-align:middle;padding-right:16px;">%loc!Min X! <input id="%id.graphMinX" onchange="window.MinMaxChanged(this,0);" onfocus="%s.CmdGotFocus(this);" size=5/>%loc!Max X! <input id="%id.graphMaxX" onchange="window.MinMaxChanged(this,1);" onfocus="%s.CmdGotFocus(this);" size=5/><br/>%loc!Min Y! <input id="%id.graphMinY" onchange="window.MinMaxChanged(this,2);" onfocus="%s.CmdGotFocus(this);" size=5/>%loc!Max Y! <input id="%id.graphMaxY" onchange="window.MinMaxChanged(this,3);" onfocus="%s.CmdGotFocus(this);" size=5/></div></td></tr></table></div></div>
      """
      view: \graph
      onclick: window.GraphOnClick
      onclickFocus: true

    ss.views?graph =
      name: \graph
      divStyle: "overflow:auto;"
      values: {}
      html: '<div style="padding:6px;">Graph View</div>'

    ss.editor?SettingsCallbacks.graph =
      save: window.GraphSave
      load: window.GraphLoad

    # Spinner - shows when sheet data is loading
    ss.sheet.cells["A1"] = new SocialCalc.Cell("A1")
    ss.sheet.cells["A1"].displaystring = '<div class="loader"></div>'
    
    ss.InitializeSpreadsheetViewer? \tableeditor, 0, 0, 0
    ss.InitializeSpreadsheetControl? \tableeditor, 0, 0, 0

    # eddy {
    if !SocialCalc._view? && ss.formDataViewer?
      # request formData and then the spreadsheet data
      ss.formDataViewer.sheet._room = ss.formDataViewer._room = SocialCalc._room + "_formdata"      
      SocialCalc.Callbacks.broadcast \ask.log {room: ss.formDataViewer._room}
    else 
      # request the spreadsheet data
      SocialCalc.Callbacks.broadcast \ask.log 
    # } eddy 
    
    ss.ExecuteCommand? \redisplay, ''
    ss.ExecuteCommand? 'set sheet defaulttextvalueformat text-wiki'
    $ document .on \mouseover '.te_download tr:nth-child(2) td:first' ->
      $ @ .attr title: SocialCalc.Constants.s_loc_export
    $ document .on \click '.te_download tr:nth-child(2) td:first' ->
      SocialCalc.Keyboard.passThru = yes if vex?dialog.open
      isMultiple = (window.__MULTI__ or SocialCalc._room is /\.[1-9]\d*$/)
      vex?defaultOptions.className = 'vex-theme-flat-attack'
      vex?dialog.open do
        message: SocialCalc.Constants.s_loc_export_format+"#{
          if isMultiple then "<br><small>(ODS and EXCEL support multiple sheets.)</small>" else ""
        }"
        callback: -> SocialCalc.Keyboard.passThru = no
        buttons: [
          $.extend {}, vex?dialog.buttons.YES, text: 'Excel', click: ->
            if isMultiple
              if window.parent.location.href.match(/(^.*\/=[^?/]+)/)
                window.open "#{ RegExp.$1 }.xlsx"
              else
                window.open ".#{if window.parent.location.pathname.match('\/.*\/view$') || window.parent.location.pathname.match('\/.*\/edit$') then '.' else ''}/=#{ SocialCalc._room.replace(/\.[1-9]\d*$/, '') }.xlsx"
            else
              window.open ".#{if window.parent.location.pathname.match('\/.*\/view$') || window.parent.location.pathname.match('\/.*\/edit$') then '.' else ''}/#{ SocialCalc._room }.xlsx"
          $.extend {}, vex?dialog.buttons.YES, text: 'CSV', click: ->
            window.open ".#{if window.parent.location.pathname.match('\/.*\/view$') || window.parent.location.pathname.match('\/.*\/edit$') then '.' else ''}/#{ SocialCalc._room }.csv"
          $.extend {}, vex?dialog.buttons.YES, text: 'HTML', click: ->
            window.open ".#{if window.parent.location.pathname.match('\/.*\/view$') || window.parent.location.pathname.match('\/.*\/edit$') then '.' else ''}/#{ SocialCalc._room }.html"
          $.extend {}, vex?dialog.buttons.YES, text: 'ODS', click: ->
            if isMultiple
              if window.parent.location.href.match(/(^.*\/=[^?/]+)/)
                window.open "#{ RegExp.$1 }.ods"
              else
                window.open ".#{if window.parent.location.pathname.match('\/.*\/view$') || window.parent.location.pathname.match('\/.*\/edit$') then '.' else ''}/=#{ SocialCalc._room.replace(/\.[1-9]\d*$/, '') }.ods"
            else
              window.open ".#{if window.parent.location.pathname.match('\/.*\/view$') || window.parent.location.pathname.match('\/.*\/edit$') then '.' else ''}/#{ SocialCalc._room }.ods"
          $.extend {}, vex?dialog.buttons.NO, text: SocialCalc.Constants.s_loc_cancel
        ]

      # In-situ import courtesy of
      # SocialCalc.CurrentSpreadsheetControlObject.tabs[6] ("Clipboard")

  if window.Document?Parser
    SocialCalc.Callbacks.expand_wiki = (val) -> """
      <div class="wiki">#{
        new Document.Parser.Wikitext!
          .parse val, new Document.Emitter.HTML!
      }</div>
    """

  doPlay!
