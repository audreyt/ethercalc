@include = -> @client '/player/main.js': ->
  $ = window.jQuery || window.$
  return location.reload! unless $
  doPlay = ~>
    window.SocialCalc ?= {}
    SocialCalc._username = Math.random!toString!
    SocialCalc.isConnected = true
    if /\?auth=/.test window.location.search
      SocialCalc._auth = window.location.search?replace /\??auth=/ ''
    SocialCalc._view = SocialCalc._auth is \0
    SocialCalc._room ?= window.location.hash.replace \# ''
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
          | SocialCalc._view  => '/view'
          | SocialCalc._auth  => '/edit'
          | otherwise     => ''
        }"
        if location.host is /^(?:www\.)?ethercalc\.(?:org|com)$/
          $('<a />', {
            id: "restore", target: "_blank"
            href: "https://ethercalc.org/log/?#{ SocialCalc._room }"
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
      showError 'Disconnected from server. please check network connection and refresh.'

    @connect('/', options)?io
      ..?on \reconnect ->
        return unless SocialCalc?isConnected
        SocialCalc.Callbacks.broadcast \ask.log
      ..?on \connect_error ->
        showError 'Connection error; please refresh to try again.'
      ..?on \connect_timeout ->
        showError 'Connection timeout; please refresh to try again.'
      ..?on \reconnect_error ->
        return unless SocialCalc?isConnected
        SocialCalc.hadSnapshot = false
        showError 'Disconnected from server. Reconnecting....'
      ..?on \connect_failed ->
        showError 'Reconnection Failed.'

    emit = (data) ~> @emit {data}
    SocialCalc.Callbacks.broadcast = (type, data={}) ~>
      return unless SocialCalc.isConnected
      data.user = SocialCalc._username
      data.room = SocialCalc._room
      data.type = type
      data.auth = SocialCalc._auth if SocialCalc._auth
      emit data

    SocialCalc.isConnected = true
    SocialCalc.RecalcInfo.LoadSheetCache = {}
    SocialCalc.RecalcInfo.LoadSheet = (ref) ->
      return if ref is /[^.a-zA-Z0-9]/
      ref.=toLowerCase!
      emit type: \ask.recalc, user: SocialCalc._username, room: ref

    @on data: !->
      return unless SocialCalc?isConnected
      return if @data.user == SocialCalc._username
      return if @data.to and @data.to != SocialCalc._username
      return if @data.room and @data.room != SocialCalc._room and @data.type != "recalc"

      ss = window.spreadsheet
      return unless ss
      editor = ss.editor
      switch @data.type
      | \chat   => window.addmsg? @data.msg
      | \ecells   => for user, ecell of @data.ecells
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
          origCell.element.className = origCell.element.className.replace find, ''
          if @data.original is editor.ecell.coord or @data.ecell is editor.ecell.coord
            SocialCalc.Callbacks.broadcast \ecell,
              to: @data.user
              ecell: editor.ecell.coord
        cr = SocialCalc.coordToCr @data.ecell
        cell = SocialCalc.GetEditorCellElement editor, cr.row, cr.col
        cell.element.className += peerClass if cell?element?className.search(find) == -1
      | \ask.ecell
        SocialCalc.Callbacks.broadcast \ecell do
          to: @data.user
          ecell: editor.ecell.coord
      | \log
        vex?closeAll!
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
            ss.editor.ScheduleRender!
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
          SocialCalc.Formula.SheetCache.sheets = {}
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
      if SocialCalc._view
        new SocialCalc.SpreadsheetViewer!
      else
        new SocialCalc.SpreadsheetControl!
    )
    SocialCalc.Callbacks.broadcast \ask.log

    return unless window.GraphOnClick

    ss.ExportCallback = (s) ->
      alert SocialCalc.ConvertSaveToOtherFormat(SocialCalc.Clipboard.clipboard, "csv")

    ss.tabnums.graph = ss.tabs.length if ss.tabs
    ss.tabs?push do
      name: \graph
      text: SocialCalc.Constants.s_loc_graph
      html: """
        <div id="%id.graphtools" style="display:none;"><div style="%tbt."><table cellspacing="0" cellpadding="0"><tr><td style="vertical-align:middle;padding-right:32px;padding-left:16px;"><div style="%tbt.">Cells to Graph</div><div id="%id.graphrange" style="font-weight:bold;">Not Set</div></td><td style="vertical-align:top;padding-right:32px;"><div style="%tbt.">Set Cells To Graph</div><select id="%id.graphlist" size="1" onfocus="%s.CmdGotFocus(this);"><option selected>[select range]</option><option>Select all</option></select></td><td style="vertical-align:middle;padding-right:4px;"><div style="%tbt.">Graph Type</div><select id="%id.graphtype" size="1" onchange="window.GraphChanged(this);" onfocus="%s.CmdGotFocus(this);"></select><input type="button" value="OK" onclick="window.GraphSetCells();" style="font-size:x-small;"></div></td><td style="vertical-align:middle;padding-right:16px;"><div style="%tbt.">&nbsp;</div><input id="%id.graphhelp" type="button" onclick="DoGraph(true);" value="Help" style="font-size:x-small;"></div></td><td style="vertical-align:middle;padding-right:16px;">Min X <input id="%id.graphMinX" onchange="window.MinMaxChanged(this,0);" onfocus="%s.CmdGotFocus(this);" size=5/>Max X <input id="%id.graphMaxX" onchange="window.MinMaxChanged(this,1);" onfocus="%s.CmdGotFocus(this);" size=5/><br/>Min Y <input id="%id.graphMinY" onchange="window.MinMaxChanged(this,2);" onfocus="%s.CmdGotFocus(this);" size=5/>Max Y <input id="%id.graphMaxY" onchange="window.MinMaxChanged(this,3);" onfocus="%s.CmdGotFocus(this);" size=5/></div></td></tr></table></div></div>
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

    ss.InitializeSpreadsheetViewer? \tableeditor, 0, 0, 0
    ss.InitializeSpreadsheetControl? \tableeditor, 0, 0, 0
    ss.ExecuteCommand? \redisplay, ''
    ss.ExecuteCommand? 'set sheet defaulttextvalueformat text-wiki'
    $ document .on \mouseover '#te_fullgrid tr:nth-child(2) td:first' ->
      $ @ .attr title: 'Export...'
    $ document .on \click '#te_fullgrid tr:nth-child(2) td:first' ->
      SocialCalc.Keyboard.passThru = yes if vex?dialog.open
      isMultiple = (window.__MULTI__ or SocialCalc._room is /\.[1-9]\d*$/)
      vex?defaultOptions.className = 'vex-theme-flat-attack'
      vex?dialog.open do
        message: "Please choose an export format.#{
          if isMultiple then "<br><small>(EXCEL supports multiple sheets.)</small>" else ""
        }"
        callback: -> SocialCalc.Keyboard.passThru = no
        buttons: [
          $.extend {}, vex?dialog.buttons.YES, text: 'Excel', click: ->
            if isMultiple
              if window.parent.location.href.match(/(^.*\/=[^?/]+)/)
                window.open "#{ RegExp.$1 }.xlsx"
              else
                window.open "./=#{ SocialCalc._room.replace(/\.[1-9]\d*$/, '') }.xlsx"
            else
              window.open "./#{ SocialCalc._room }.xlsx"
          $.extend {}, vex?dialog.buttons.YES, text: 'CSV', click: ->
            window.open "./#{ SocialCalc._room }.csv"
          $.extend {}, vex?dialog.buttons.YES, text: 'HTML', click: ->
            window.open "./#{ SocialCalc._room }.html"
          $.extend {}, vex?dialog.buttons.NO, text: 'Cancel'
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
