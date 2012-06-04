@include = -> @client '/player.js': ->
  doPlay = ~>
    window.SocialCalc ?= {}
    SocialCalc._username = Math.random!toString!
    SocialCalc.isConnected = true
    SocialCalc.hadSnapshot = false
    SocialCalc._auth = window.location.search?replace /\??auth=/, ''
    SocialCalc._view =  SocialCalc._auth is '0'
    SocialCalc._room ?= window.location.hash.replace '#', ''
    SocialCalc._room .= replace /^_+/, '' .replace /\?.*/, ''
    unless SocialCalc._room
      window.location = '/_start'
      return

    try window.history.pushState {}, '', "/#{
      SocialCalc._room
    }" + if SocialCalc._view then "/view" else
         if SocialCalc._auth then "/edit" else ""
    do @connect

    emit = (data) ~> @emit {data}
    SocialCalc.Callbacks.broadcast = (type, data={}) ~>
      return unless SocialCalc.isConnected
      data.user = SocialCalc._username
      data.room = SocialCalc._room
      data.type = type
      data.auth = SocialCalc._auth if SocialCalc._auth
      emit data

    SocialCalc.isConnected = true
    SocialCalc.Callbacks.broadcast \ask.log
    SocialCalc.RecalcInfo.LoadSheet = (ref) ->
      ref .= replace /[^a-zA-Z0-9]+/g, "" .toLowerCase!
      emit type: \ask.recalc, user: SocialCalc._username, room: ref

    @on data: ->
      return unless SocialCalc?isConnected
      return if @data.user == SocialCalc._username
      return if @data.to and @data.to != SocialCalc._username
      return if @data.room and @data.room != SocialCalc._room and @data.type != "recalc"

      ss = window.spreadsheet
      editor = ss.editor
      switch @data.type
      | \chat   => window.addmsg? @data.msg
      | \ecells => for user, ecell of @data.ecells
        continue if user is SocialCalc._username
        peerClass = " #user defaultPeer"
        find = new RegExp peerClass, \g
        cr   = SocialCalc.coordToCr ecell
        cell = SocialCalc.GetEditorCellElement editor, cr.row, cr.col
        if cell.element.className.search(find) == -1
          cell.element.className += peerClass
      | \ecell
        peerClass = " #{@data.user} defaultPeer"
        find = new RegExp peerClass, \g 
        if @data.original
          origCR   = SocialCalc.coordToCr @data.original
          origCell = SocialCalc.GetEditorCellElement editor, origCR.row, origCR.col
          origCell.element.className .= replace find, '' 
          if @data.original is editor.ecell.coord or @data.ecell is editor.ecell.coord
            SocialCalc.Callbacks.broadcast \ecell,
              to: @data.user
              ecell: editor.ecell.coord
        cr = SocialCalc.coordToCr @data.ecell 
        cell = SocialCalc.GetEditorCellElement editor, cr.row, cr.col
        cell.element.className += peerClass if cell.element.className.search(find) == -1
      | \ask.ecell
        SocialCalc.Callbacks.broadcast \ecell,
          to: @data.user
          ecell: editor.ecell.coord
      | \log
        break if SocialCalc.hadSnapshot
        SocialCalc.hadSnapshot = true
        parts = ss.DecodeSpreadsheetSave @data.snapshot  if @data.snapshot
        if parts
          if parts.sheet
            ss.sheet.ResetSheet!
            ss.ParseSheetSave @data.snapshot.substring parts.sheet.start, parts.sheet.end
          # ss.editor.LoadEditorSettings @data.snapshot.substring(parts.edit.start, parts.edit.end)  if parts.edit
        window.addmsg? @data.chat * \\n, true
        cmdstr = [ line for line in @data.log
            when not /^re(calc|display)$/.test(line)
        ] * \\n
        if cmdstr.length
          refreshCmd = \recalc
          ss.context.sheetobj.ScheduleSheetCommands "#cmdstr\n#refreshCmd\n", false, true
        else
          ss.context.sheetobj.ScheduleSheetCommands 'recalc\n', false, true
      | \recalc
        if @data.force
          SocialCalc.Formula.SheetCache.sheets = {}
          ss?sheet.recalconce = true
        parts = ss.DecodeSpreadsheetSave @data.snapshot if @data.snapshot
        if parts?sheet
          SocialCalc.RecalcLoadedSheet(
            @data.room,
            @data.snapshot.substring(parts.sheet.start, parts.sheet.end),
            true # recalc
          )
          ss.context.sheetobj.ScheduleSheetCommands 'recalc\n', false, true
        else
          SocialCalc.RecalcLoadedSheet @data.room, '', true 
      | \execute
        ss.context.sheetobj.ScheduleSheetCommands @data.cmdstr, @data.saveundo, true
        if ss.currentTab is ss.tabnums?graph
          setTimeout (-> window.DoGraph false, false), 100
      return

  window.doresize = -> window.spreadsheet?DoOnResize!
  scc = SocialCalc.Constants
  b1 = if window.location.search then \A else \4
  b2 = \C
  b3 = \8
  b4 = \9
  b5 = \8
  scc.SCToolbarbackground = 'background-color:#4040' + b1 + '0;'
  scc.SCTabbackground = 'background-color:#CC' + b2 + ';'
  scc.SCTabselectedCSS = 'font-size:small;padding:6px 30px 6px 8px;color:#FFF;background-color:#4040' + b1 + '0;cursor:default;border-right:1px solid #CC' + b2 + ';'
  scc.SCTabplainCSS = 'font-size:small;padding:6px 30px 6px 8px;color:#FFF;background-color:#8080' + b3 + '0;cursor:default;border-right:1px solid #CC' + b2 + ';'
  scc.SCToolbartext = 'font-size:x-small;font-weight:bold;color:#FFF;padding-bottom:4px;'
  scc.ISCButtonBorderNormal = '#4040' + b1 + '0'
  scc.ISCButtonBorderHover = '#99' + b4
  scc.ISCButtonBorderDown = '#FFF'
  scc.ISCButtonDownBackground = '#88' + b5
  scc.defaultImagePrefix = '/images/sc-'
  SocialCalc.Popup.LocalizeString = SocialCalc.LocalizeString
  $ ->
    window.spreadsheet = ss = (
      if SocialCalc._view
        new SocialCalc.SpreadsheetViewer!
      else
        new SocialCalc.SpreadsheetControl!
    )
    document.getElementById \msgtext .value = ''
    ss.ExportCallback = (s) ->
      alert SocialCalc.ConvertSaveToOtherFormat(SocialCalc.Clipboard.clipboard, "csv")

    ss.tabnums.graph = ss.tabs.length if ss.tabs
    ss.tabs?push(
      name: \graph
      text: SocialCalc.Constants.s_loc_graph
      html: '<div id="%id.graphtools" style="display:none;"> <div style="%tbt."> <table cellspacing="0" cellpadding="0"><tr>   <td style="vertical-align:middle;padding-right:32px;padding-left:16px;">    <div style="%tbt.">Cells to Graph</div>    <div id="%id.graphrange" style="font-weight:bold;">Not Set</div>   </td>  <td style="vertical-align:top;padding-right:32px;">   <div style="%tbt.">Set Cells To Graph</div>    <select id="%id.graphlist" size="1" onfocus="%s.CmdGotFocus(this);"><option selected>[select range]</option></select>   </td>   <td style="vertical-align:middle;padding-right:4px;">    <div style="%tbt.">Graph Type</div>     <select id="%id.graphtype" size="1" onchange="window.GraphChanged(this);" onfocus="%s.CmdGotFocus(this);"></select>     <input type="button" value="OK" onclick="window.GraphSetCells();" style="font-size:x-small;">    </div>   </td>   <td style="vertical-align:middle;padding-right:16px;">    <div style="%tbt.">&nbsp;</div>     <input id="%id.graphhelp" type="button" onclick="DoGraph(true);" value="Help" style="font-size:x-small;">    </div>   </td>   <td style="vertical-align:middle;padding-right:16px;">     Min X <input id="%id.graphMinX" onchange="window.MinMaxChanged(this,0);" onfocus="%s.CmdGotFocus(this);" size=5/>     Max X <input id="%id.graphMaxX" onchange="window.MinMaxChanged(this,1);" onfocus="%s.CmdGotFocus(this);" size=5/><br/>     Min Y <input id="%id.graphMinY" onchange="window.MinMaxChanged(this,2);" onfocus="%s.CmdGotFocus(this);" size=5/>     Max Y <input id="%id.graphMaxY" onchange="window.MinMaxChanged(this,3);" onfocus="%s.CmdGotFocus(this);" size=5/>    </div>   </td>  </tr></table> </div></div>'
      view: \graph
      onclick: GraphOnClick
      onclickFocus: true
    )

    if ss.views?
      ss.views.graph =
        name: \graph
        divStyle: "overflow:auto;"
        values: {}
        html: '<div style="padding:6px;">Graph View</div>'

    ss.editor?SettingsCallbacks.graph =
      save: window.GraphSave
      load: window.GraphLoad

    savestr = document.getElementById \savestr
    ss.InitializeSpreadsheetViewer? \tableeditor, 0, 0, 0
    ss.InitializeSpreadsheetControl? \tableeditor, 0, 0, 0
    ss.ExecuteCommand? \redisplay, ''
    ss.ExecuteCommand? 'set sheet defaulttextvalueformat text-wiki'
    $ '#te_fullgrid tr:nth-child(2) td:first' .live \mouseover, ->
      $(@).attr title: 'Export to HTML'
    $ '#te_fullgrid tr:nth-child(2) td:first' .live \click, ->
      window.open "/_/#{ SocialCalc._room }/html"

  SocialCalc.Callbacks.expand_wiki = (val) -> """
    <div class="wiki">#{
      (new Document.Parser.Wikitext!).parse(
        val, new Document.Emitter.HTML!
      )
    }</div>
  """

  SocialCalc.Constants.s_loc_plain = "Plain"
  SocialCalc.Constants.s_loc_graph = "Graph"
  SocialCalc.Constants.s_loc_cells_to_graph = "Cells to Graph"
  SocialCalc.Constants.s_loc_set_cells_to_graph = "Set Cells To Graph"
  SocialCalc.Constants.s_loc_graph_type = "Graph Type"
  SocialCalc.Constants.s_loc_help = "Help"
  SocialCalc.Constants.s_loc_horizontal_bar = "Horizontal Bar"
  SocialCalc.Constants.s_loc_vertical_bar="Vertical Bar"
  SocialCalc.Constants.s_loc_pie_chart="Pie Chart"
  SocialCalc.Constants.s_loc_line_chart="Line Chart"
  SocialCalc.Constants.s_loc_scatter_chart="Plot Points"
  SocialCalc.Constants.s_loc_not_set = "Not Set"
  SocialCalc.Constants.s_loc_unknown_range_name = "Unknown range name"
  SocialCalc.Constants.s_loc_hide_help = "Hide Help"

  SocialCalc.Constants.s_loc_x="X "
  SocialCalc.Constants.s_loc_y="Y "
  SocialCalc.Constants.s_loc_max="Max "
  SocialCalc.Constants.s_loc_min="Min "
  SocialCalc.Constants.s_loc_ok=" OK "

  SocialCalc.Constants.s_GraphRangeNotSelected = "Select a range of cells with numeric values to graph and use the OK button above to set the range as the graph range."

  colorIndex = 0
  getBarColor = ->
    colors = <[ ff0 0ff f0f 00f f00 0f0 888 880 088 808 008 800 080 ]>
    return colors[colorIndex++] || (colors[Math.round(Math.random! * 14)] + colors[Math.round(Math.random! * 14)] + colors[Math.round(Math.random! * 14)] + colors[Math.round(Math.random! * 14)] + colors[Math.round(Math.random! * 14)] + colors[Math.round(Math.random! * 14)])
  getDrawColor = ->
    return "##{ do getBarColor }"

  GraphOnClick = (s, t) ->
    colorIndex = 0
    SCLoc = SocialCalc.LocalizeString
    namelist = []
    nl = document.getElementById s.idPrefix + \graphlist
    s.editor.RangeChangeCallback.graph = UpdateGraphRangeProposal
    for name of s.sheet.names
      namelist.push name
    namelist.sort!
    nl.length = 0
    nl.options[0] = new Option SCLoc '[select range]'
    i = 0
    while i < namelist.length
      name = namelist[i]
      nl.options[i + 1] = new Option(name, name)
      nl.options[i + 1].selected = true  if name is s.graphrange
      i++
    nl.options[0].selected = true  if s.graphrange is ''
    UpdateGraphRangeProposal s.editor
    nl = document.getElementById s.idPrefix + \graphtype
    nl.length = 0
    i = 0
    while i < SocialCalc.GraphTypesInfo.displayorder.length
      name = SocialCalc.GraphTypesInfo.displayorder[i]
      nl.options[i] = new Option(SCLoc(SocialCalc.GraphTypesInfo[name].display), name)
      nl.options[i].selected = true if name is s.graphtype
      i++
    unless s.graphtype
      nl.options[0].selected = true
      s.graphtype = nl.options[0].value
    DoGraph false, true
    return
  UpdateGraphRangeProposal = (editor) ->
    ele = document.getElementById(SocialCalc.GetSpreadsheetControlObject!.idPrefix + "graphlist")
    if editor.range.hasrange
      ele.options[0].text = SocialCalc.crToCoord(editor.range.left, editor.range.top) + ":" + SocialCalc.crToCoord(editor.range.right, editor.range.bottom)
    else
      ele.options[0].text = SocialCalc.LocalizeString("[select range]")
  window.GraphSetCells = GraphSetCells = ->
    spreadsheet = SocialCalc.GetSpreadsheetControlObject!
    editor = spreadsheet.editor
    lele = document.getElementById(spreadsheet.idPrefix + "graphlist")
    if lele.selectedIndex is 0
      if editor.range.hasrange
        spreadsheet.graphrange = SocialCalc.crToCoord(editor.range.left, editor.range.top) + ":" + SocialCalc.crToCoord(editor.range.right, editor.range.bottom)
      else
        spreadsheet.graphrange = editor.ecell.coord + ":" + editor.ecell.coord
    else
      spreadsheet.graphrange = lele.options[lele.selectedIndex].value
    ele = document.getElementById(spreadsheet.idPrefix + "graphrange")
    ele.innerHTML = spreadsheet.graphrange
    DoGraph false, false
    return
  window.DoGraph = DoGraph = (helpflag, isResize) ->
    colorIndex = 0
    spreadsheet = SocialCalc.GetSpreadsheetControlObject!
    editor = spreadsheet.editor
    gview = spreadsheet.views.graph.element
    ginfo = SocialCalc.GraphTypesInfo[spreadsheet.graphtype]
    gfunc = ginfo.func
    unless spreadsheet.graphrange
      if gfunc and helpflag
        gfunc spreadsheet, null, gview, spreadsheet.graphtype, helpflag, isResize
      else
        gview.innerHTML = "<div style=\"padding:30px;font-weight:bold;\">" + SocialCalc.Constants.s_GraphRangeNotSelected + "</div>"
      return
    grange = spreadsheet.graphrange
    if grange and grange.indexOf(":") is -1
      nrange = SocialCalc.Formula.LookupName(spreadsheet.sheet, grange or "")
      unless nrange.type is "range"
        gview.innerHTML = SocialCalc.LocalizeString("Unknown range name") + ": " + grange
        return
      rparts = nrange.value.match(/^(.*)\|(.*)\|$/)
      grange = rparts[1] + ":" + rparts[2]
    prange = SocialCalc.ParseRange(grange)
    range = {}
    if prange.cr1.col <= prange.cr2.col
      range.left = prange.cr1.col
      range.right = prange.cr2.col
    else
      range.left = prange.cr2.col
      range.right = prange.cr1.col
    if prange.cr1.row <= prange.cr2.row
      range.top = prange.cr1.row
      range.bottom = prange.cr2.row
    else
      range.top = prange.cr2.row
      range.bottom = prange.cr1.row
    gfunc spreadsheet, range, gview, spreadsheet.graphtype, helpflag, isResize  if gfunc
    return
  window.GraphChanged = GraphChanged = (gtobj) ->
    window.spreadsheet.graphtype = gtobj.options[gtobj.selectedIndex].value
    DoGraph false, false
  window.MinMaxChanged = MinMaxChanged = (minmaxobj, index) ->
    switch index
    | 0 1 => window.spreadsheet.graphMinX = minmaxobj.value
    | 2 3 => window.spreadsheet.graphMinY = minmaxobj.value
    DoGraph false, true
  window.GraphSave = GraphSave = (editor, setting) ->
    spreadsheet = SocialCalc.GetSpreadsheetControlObject!
    gtype = spreadsheet.graphtype or ""
    str = "graph:range:" + SocialCalc.encodeForSave(spreadsheet.graphrange) + ":type:" + SocialCalc.encodeForSave(gtype)
    str += ":minmax:" + SocialCalc.encodeForSave(spreadsheet.graphMinX + "," + spreadsheet.graphMaxX + "," + spreadsheet.graphMinY + "," + spreadsheet.graphMaxY) + "\n"
    str
  window.GraphLoad = GraphLoad = (editor, setting, line, flags) ->
    spreadsheet = SocialCalc.GetSpreadsheetControlObject!
    parts = line.split(":")
    i = 1
    while i < parts.length
      switch parts[i]
      | \range => spreadsheet.graphrange = SocialCalc.decodeFromSave parts[i+1]
      | \type  => spreadsheet.graphtype = SocialCalc.decodeFromSave parts[i+1]
      | \minmax
          splitMinMax = SocialCalc.decodeFromSave parts[i + 1] .split \,
          spreadsheet.graphMinX = splitMinMax[0]
          document.getElementById("SocialCalc-graphMinX").value = spreadsheet.graphMinX
          spreadsheet.graphMaxX = splitMinMax[1]
          document.getElementById("SocialCalc-graphMaxX").value = spreadsheet.graphMaxX
          spreadsheet.graphMinY = splitMinMax[2]
          document.getElementById("SocialCalc-graphMinY").value = spreadsheet.graphMinY
          spreadsheet.graphMaxY = splitMinMax[3]
          document.getElementById("SocialCalc-graphMaxY").value = spreadsheet.graphMaxY
      i += 2
    true
  GraphVerticalBar = (spreadsheet, range, gview, gtype, helpflag) ->
    values = []
    labels = []
    if helpflag or not range
      str = "<input type=\"button\" value=" + SocialCalc.Constants.s_loc_hide_help + " onclick=\"DoGraph(false,false);\"><br><br>" + "This is the help text for graph type: " + SocialCalc.GraphTypesInfo[gtype].display + ".<br><br>" + "The <b>Graph</b> tab displays a bar graph of the cells which have been selected " + "(either in a single row across or column down). " + "If the row above (or column to the left) of the selection has values, those values are used as labels. " + "Otherwise the cells value is used as a label. " + "<br><br><input type=\"button\" value=" + SocialCalc.Constants.s_loc_hide_help + " onclick=\"DoGraph(false,false);\">"
      str = SocialCalc.LocalizeSubstrings(str)
      gview.innerHTML = str
      return
    if range.left is range.right
      nitems = range.bottom - range.top + 1
      byrow = true
    else
      nitems = range.right - range.left + 1
      byrow = false
    str = ""
    maxheight = (spreadsheet.height - spreadsheet.nonviewheight) - 50
    totalwidth = spreadsheet.width - 30
    minval = null
    maxval = null
    i = 0
    while i < nitems
      cr = (if byrow then SocialCalc.rcColname(range.left) + (i + range.top) else SocialCalc.rcColname(i + range.left) + range.top)
      cr1 = (if byrow then SocialCalc.rcColname(range.left - 1 or 1) + (i + range.top) else SocialCalc.rcColname(i + range.left) + (range.top - 1 or 1))
      cell = spreadsheet.sheet.GetAssuredCell(cr)
      if cell.valuetype.charAt(0) is "n"
        val = cell.datavalue - 0
        maxval = val  if not maxval? or maxval < val
        minval = val  if not minval? or minval > val
        values.push val
        cell = spreadsheet.sheet.GetAssuredCell(cr1)
        if (range.right is range.left or range.top is range.bottom) and (cell.valuetype.charAt(0) is "t" or cell.valuetype.charAt(0) is "n")
          labels.push cell.datavalue + ""
        else
          labels.push val + ""
      i++
    maxval = 0  if maxval < 0
    minval = 0  if minval > 0
    str = "<table><tr><td><canvas id=\"myBarCanvas\" width=\"500px\" height=\"400px\" style=\"border:1px solid black;\"></canvas></td><td><span id=\"googleBarChart\"></span></td></tr></table>"
    gview.innerHTML = str
    profChartVals = new Array!
    profChartLabels = new Array!
    canv = document.getElementById("myBarCanvas")
    ctx = canv.getContext("2d")
    ctx.font = "10pt bold Arial"
    maxheight = canv.height - 60
    totalwidth = canv.width
    colors = ['0' to '9'] +++ ['a' to 'f']
    barColor = do getBarColor
    ctx.fillStyle = '#' + barColor
    colorList = [ barColor ]
    eachwidth = Math.floor(totalwidth / (values.length or 1)) - 4 or 1
    zeroLine = maxheight * (maxval / (maxval - minval)) + 30
    ctx.lineWidth = 5
    ctx.moveTo 0, zeroLine
    ctx.lineTo canv.width, zeroLine
    ctx.stroke!
    yScale = maxheight / (maxval - minval)
    i = 0
    while i < values.length
      ctx.fillRect i * eachwidth, zeroLine - yScale * values[i], eachwidth, yScale * values[i]
      profChartVals.push Math.floor((values[i] - minval) * yScale / 3.4)
      profChartLabels.push labels[i]
      barColor = do getBarColor
      ctx.fillStyle = '#' + barColor
      colorList.push barColor
      i++
    ctx.strokeStyle = '#000000'
    ctx.fillStyle = '#000000'
    if values[0] > 0
      ctx.translate 5, zeroLine + 22
    else
      ctx.translate 5, zeroLine - 15
    ctx.fillText labels[0], 0, 0
    if labels[0] isnt values[0]
      ctx.fillText values[0], 0, -24
    i = 1
    while i < values.length
      if (values[i] > 0) and (values[i - 1] < 0)
        ctx.translate eachwidth, 37
      else
        if (values[i] < 0) and (values[i - 1] > 0)
          ctx.translate eachwidth, -37
        else
          ctx.translate eachwidth, 0
      ctx.fillText labels[i], 0, 0
      if labels[i] isnt values[i]
        ctx.fillText values[i], 0, -24
      i++
    gChart = document.getElementById("googleBarChart")
    zeroLine = (-1 * minval) * yScale / 340
    profChartUrl = "chs=300x250&cht=bvg&chd=t:" + profChartVals.join(",") + "&chxt=x,y&chxl=0:|" + profChartLabels.join("|") + "|&chxr=1," + minval + "," + maxval + "&chp=" + zeroLine + "&chbh=a&chm=r,000000,0," + zeroLine + "," + (zeroLine + 0.005) + "&chco=" + colorList.join("|")
    # gChart.innerHTML = "<iframe src=\"urlJump.html?img=" + escape(profChartUrl) + "\" style=\"width:315px;height:270px;\"></iframe>"
  GraphHorizontalBar = (spreadsheet, range, gview, gtype, helpflag) ->
    values = []
    labels = []
    if helpflag or not range
      str = "<input type=\"button\" value=" + SocialCalc.Constants.s_loc_hide_help + " onclick=\"DoGraph(false,false);\"><br><br>" + "This is the help text for graph type: " + SocialCalc.GraphTypesInfo[gtype].display + ".<br><br>" + "The <b>Graph</b> tab displays a very simple bar graph representation of the cells currently selected as a range to graph " + "(either in a single row across or column down). " + "If the range is a single row or column, and if the row above (or column to the left) has values, those values are used as labels. " + "Otherwise the cell coordinates are used (e.g., B5). " + "This is a very early, minimal implementation for demonstration purposes. " + "<br><br><input type=\"button\" value=" + SocialCalc.Constants.s_loc_hide_help + " onclick=\"DoGraph(false,false);\">"
      gview.innerHTML = str
      return
    if range.left is range.right
      nitems = range.bottom - range.top + 1
      byrow = true
    else
      nitems = range.right - range.left + 1
      byrow = false
    str = ""
    maxheight = (spreadsheet.height - spreadsheet.nonviewheight) - 50
    totalwidth = spreadsheet.width - 30
    minval = null
    maxval = null
    i = 0
    while i < nitems
      cr = (if byrow then SocialCalc.rcColname(range.left) + (i + range.top) else SocialCalc.rcColname(i + range.left) + range.top)
      cr1 = (if byrow then SocialCalc.rcColname(range.left - 1 or 1) + (i + range.top) else SocialCalc.rcColname(i + range.left) + (range.top - 1 or 1))
      cell = spreadsheet.sheet.GetAssuredCell(cr)
      if cell.valuetype.charAt(0) is "n"
        val = cell.datavalue - 0
        maxval = val  if not maxval? or maxval < val
        minval = val  if not minval? or minval > val
        values.push val
        cell = spreadsheet.sheet.GetAssuredCell(cr1)
        if (range.right is range.left or range.top is range.bottom) and (cell.valuetype.charAt(0) is "t" or cell.valuetype.charAt(0) is "n")
          labels.push cell.datavalue + ""
        else
          labels.push val + ""
      i++
    maxval = 0  if maxval < 0
    minval = 0  if minval > 0
    str = "<table><tr><td><canvas id=\"myBarCanvas\" width=\"500px\" height=\"400px\" style=\"border:1px solid black;\"></canvas></td><td><span id=\"googleBarChart\"></span></td></tr></table>"
    gview.innerHTML = str
    profChartVals = new Array!
    profChartLabels = new Array!
    canv = document.getElementById("myBarCanvas")
    ctx = canv.getContext("2d")
    ctx.font = "10pt bold Arial"
    maxheight = canv.height - 60
    totalwidth = canv.width
    colors = ['0' to '9'] +++ ['a' to 'f']
    barColor = do getBarColor
    ctx.fillStyle = "#" + barColor
    colorList = [ barColor ]
    eachwidth = Math.floor(maxheight / (values.length or 1)) - 4 or 1
    zeroLine = totalwidth * (maxval / (maxval - minval)) - 5
    zeroLine = canv.width - zeroLine + 40
    ctx.lineWidth = 5
    ctx.moveTo zeroLine, 0
    ctx.lineTo zeroLine, canv.height
    ctx.stroke!
    yScale = totalwidth / (maxval - minval) * 4.4 / 5
    i = 0
    while i < values.length
      ctx.fillRect zeroLine + yScale * values[i], i * eachwidth + 30, -1 * yScale * values[i], eachwidth
      profChartVals.push Math.floor((values[i] - minval) * yScale / 4.4)
      profChartLabels.push labels[i]
      barColor = do getBarColor
      ctx.fillStyle = "#" + barColor
      colorList.push barColor
      i++
    ctx.strokeStyle = "#000000"
    ctx.fillStyle = "#000000"
    if values[0] > 0
      ctx.translate zeroLine - 22, 45
    else
      ctx.translate zeroLine + 15, 45
    ctx.fillText labels[0], 0, 0
    if labels[0] isnt values[0]
      ctx.fillText values[0], 0, 24
    i = 1
    while i < values.length
      if (values[i] > 0) and (values[i - 1] < 0)
        ctx.translate -37, eachwidth
      else
        if (values[i] < 0) and (values[i - 1] > 0)
          ctx.translate 37, eachwidth
        else
          ctx.translate 0, eachwidth
      ctx.fillText labels[i], 0, 0
      if labels[i] isnt values[i]
        ctx.fillText values[i], 0, 24
      i++
    gChart = document.getElementById("googleBarChart")
    zeroLine = (-1 * minval) * yScale / (canv.width)
    profChartUrl = "chs=300x250&cht=bhs&chd=t:" + profChartVals.join(",") + "&chxt=x,y&chxl=1:|" + profChartLabels.reverse!.join("|") + "|&chxr=0," + minval + "," + maxval + "&chp=" + zeroLine + "&chbh=a&chm=r,000000,0," + zeroLine + "," + (zeroLine + 0.005) + "&chco=" + colorList.join("|")
    # gChart.innerHTML = "<iframe src=\"urlJump.html?img=" + escape(profChartUrl) + "\" style=\"width:315px;height:270px;\"></iframe>"
  MakePieChart = (spreadsheet, range, gview, gtype, helpflag) ->
    values = []
    labels = []
    total = 0
    if range.left is range.right
      nitems = range.bottom - range.top + 1
      byrow = true
    else
      nitems = range.right - range.left + 1
      byrow = false
    i = 0
    while i < nitems
      cr = (if byrow then SocialCalc.rcColname(range.left) + (i + range.top) else SocialCalc.rcColname(i + range.left) + range.top)
      cr1 = (if byrow then SocialCalc.rcColname(range.left - 1 or 1) + (i + range.top) else SocialCalc.rcColname(i + range.left) + (range.top - 1 or 1))
      cell = spreadsheet.sheet.GetAssuredCell(cr)
      if cell.valuetype.charAt(0) is "n"
        val = cell.datavalue - 0
        total += val
        values.push val
        cell = spreadsheet.sheet.GetAssuredCell(cr1)
        if (range.right is range.left or range.top is range.bottom) and (cell.valuetype.charAt(0) is "t" or cell.valuetype.charAt(0) is "n")
          labels.push cell.datavalue + ""
        else
          labels.push val + ""
      i++
    str = "<table><tr><td><img id=\"canvImg\" style=\"border:1px solid black;\" src=\"\"/><canvas id=\"myCanvas\" style=\"display:none;\" width=\"500px\" height=\"400px\"></canvas></td><td><span id=\"googleChart\"></span></td></tr></table>"
    gview.innerHTML = str
    profChartUrl = ""
    profChartLabels = ""
    canv = document.getElementById("myCanvas")
    ctx = canv.getContext("2d")
    ctx.font = "10pt Arial"
    centerX = canv.width / 2
    centerY = canv.height / 2
    rad = centerY - 50
    textRad = rad * 1.1
    lastStart = 0
    colors = ['0' to '9'] +++ ['a' to 'f']
    i = 0
    while i < values.length
      if Number(values[i]) == 0
        i++
        continue
      ctx.beginPath!
      ctx.moveTo centerX, centerY
      arcColor = do getDrawColor
      ctx.fillStyle = arcColor
      arcRads = 2 * Math.PI * (values[i] / total)
      profChartUrl += "," + values[i]
      ctx.arc centerX, centerY, rad, lastStart, lastStart + arcRads, false
      ctx.closePath!
      ctx.fill!
      ctx.fillStyle = "black"
      centralRad = lastStart + 0.5 * arcRads
      leftBias = 0
      leftBias = 55  if (centralRad > 1.5) and (centralRad < 4.6)
      ctx.translate centerX + Math.cos(centralRad) * textRad - leftBias, centerY + Math.sin(centralRad) * textRad
      ctx.fillText labels[i] + " (" + Math.round(values[i] / total * 100) + "%)", 0, 0
      ctx.translate -1 * centerX - Math.cos(centralRad) * textRad + leftBias, -1 * centerY - Math.sin(centralRad) * textRad
      ctx.fillRect 1, 1, 1, 1
      ctx.closePath!
      profChartLabels += "|" + labels[i]
      lastStart += arcRads
      i++
    realCanv = document.getElementById("canvImg")
    realCanv.src = canv.toDataURL!
    gChart = document.getElementById("googleChart")
    profChartUrl = "chs=300x145&cht=p&chd=t:" + profChartUrl.substring(1) + "&chl=" + profChartLabels.substring(1)
    # gChart.innerHTML = "<iframe src=\"urlJump.html?img=" + escape(profChartUrl) + "\" style=\"width:315px;height:270px;\"></iframe>"
  MakeLineChart = (spreadsheet, range, gview, gtype, helpflag, isResize) ->
    values = []
    labels = []
    total = 0
    colors = ['0' to '9'] +++ ['a' to 'f']
    shapes = <[ s o c ]>
    if range.left is range.right
      nitems = range.bottom - range.top + 1
      byrow = true
    else
      nitems = range.right - range.left + 1
      byrow = false
    if isResize
      try
        minX = 1 * document.getElementById("SocialCalc-graphMinX").value
      catch e
        minX = null
      try
        maxX = 1 * document.getElementById("SocialCalc-graphMaxX").value
      catch e
        maxX = null
      try
        minval = 1 * document.getElementById("SocialCalc-graphMinY").value
      catch e
        minval = null
      try
        maxval = 1 * document.getElementById("SocialCalc-graphMaxY").value
      catch e
        maxval = null
    evenlySpaced = false
    i = 0
    while i < nitems
      cr = (if byrow then SocialCalc.rcColname(range.left) + (i + range.top) else SocialCalc.rcColname(i + range.left) + range.top)
      cr1 = (if byrow then SocialCalc.rcColname(range.left - 1 or 1) + (i + range.top) else SocialCalc.rcColname(i + range.left) + (range.top - 1 or 1))
      cell = spreadsheet.sheet.GetAssuredCell(cr)
      if cell.valuetype.charAt(0) is "n"
        val = cell.datavalue - 0
        maxval = val  if (not maxval? or maxval < val) and not isResize
        minval = val  if (not minval? or minval > val) and not isResize
        values.push val
        cell = spreadsheet.sheet.GetAssuredCell(cr1)
        if (range.right is range.left or range.top is range.bottom) and (cell.valuetype.charAt(0) is "t" or cell.valuetype.charAt(0) is "n")
          labels.push cell.datavalue + ""
          maxX = cell.datavalue  if (not maxX? or maxX < cell.datavalue) and not isResize
          minX = cell.datavalue  if (not minX? or minX > cell.datavalue) and not isResize
        else
          labels.push cr
          evenlySpaced = true
      i++
    if evenlySpaced
      i = 0

      while i < values.length
        labels[i] = i
        i++
      unless isResize
        minX = 0
        maxX = values.length - 1
    str = "<canvas id=\"myLineCanvas\" style=\"border:1px solid black;\" width=\"500px\" height=\"400px\"></canvas><span id=\"googleLineChart\"></span>"
    gview.innerHTML = str
    unless isResize
      document.getElementById("SocialCalc-graphMinX").value = minX
      spreadsheet.graphMinX = minX
      document.getElementById("SocialCalc-graphMaxX").value = maxX
      spreadsheet.graphMaxX = maxX
      document.getElementById("SocialCalc-graphMinY").value = minval
      spreadsheet.graphMinY = minval
      document.getElementById("SocialCalc-graphMaxY").value = maxval
      spreadsheet.graphMaxY = maxval
    canv = document.getElementById("myLineCanvas")
    ctx = canv.getContext("2d")
    scaleFactorX = (canv.width - 40) / (maxX - minX)
    scaleFactorY = (canv.height - 40) / (maxval - minval)
    lastX = scaleFactorX * (labels[0] - minX) + 20
    lastY = scaleFactorY * (values[0] - minval) + 20
    profChart = [ Math.floor(lastX / canv.width * 100), Math.floor(lastY / canv.height * 100) ]
    topY = canv.height
    drawColor = do getDrawColor
    colorArray = [ drawColor.replace("#", "") ]
    ctx.strokeStyle = drawColor
    ctx.fillStyle = drawColor
    ctx.fillRect lastX - 3, topY - lastY - 3, 6, 6
    ctx.beginPath!
    i = 1
    while i < values.length
      if (labels[i] * 1) > (labels[i - 1] * 1)
        ctx.moveTo lastX, topY - lastY
        ctx.lineTo (scaleFactorX * (labels[i] - minX)) + 20, topY - (scaleFactorY * (values[i] - minval) + 20)
        ctx.stroke!
      else
        drawColor = do getDrawColor
        ctx.strokeStyle = drawColor
        ctx.fillStyle = drawColor
        colorArray.push drawColor.replace("#", "")
        ctx.beginPath!
      lastX = scaleFactorX * (labels[i] - minX) + 20
      lastY = scaleFactorY * (values[i] - minval) + 20
      if (colorArray.length - 1) % 3 is 0
        ctx.fillRect lastX - 3, topY - lastY - 3, 6, 6
      else if (colorArray.length - 1) % 3 is 1
        ctx.beginPath!
        ctx.arc lastX, topY - lastY, 3, 0, Math.PI * 2, false
        ctx.fill!
      else
        ctx.fillRect lastX, topY - lastY - 3, 2, 8
        ctx.fillRect lastX - 3, topY - lastY, 8, 2
      if (labels[i] * 1) > (labels[i - 1] * 1)
        profChart[profChart.length - 2] += "," + Math.floor(lastX / canv.width * 100)
        profChart[profChart.length - 1] += "," + Math.floor(lastY / canv.height * 100)
      else
        newIndex = profChart.length
        profChart[newIndex] = Math.floor(lastX / canv.width * 100)
        profChart[newIndex + 1] = Math.floor(lastY / canv.height * 100)
      i++
    ctx.stroke!
    colorMarkings = "&chco=" + colorArray.join(",") + "&chm="
    i = 0

    while i < colorArray.length
      if i % 3 is 0
        colorArray[i] = "s," + colorArray[i] + "," + i + ",-1,6"
      else if i % 3 is 1
        colorArray[i] = "o," + colorArray[i] + "," + i + ",-1,6"
      else
        colorArray[i] = "c," + colorArray[i] + "," + i + ",-1,10"
      i++
    colorMarkings += colorArray.join("|")
    if minval <= 0 and maxval >= 0
      ctx.beginPath!
      ctx.strokeStyle = "#000000"
      ctx.moveTo 0, canv.height - (scaleFactorY * -1 * minval + 20)
      ctx.lineTo canv.width, canv.height - (scaleFactorY * -1 * minval + 20)
      ctx.stroke!
      graphPlace = 1 - ((canv.height - (scaleFactorY * -1 * minval + 20)) / canv.height)
      colorMarkings += "|r,000000,0," + graphPlace + "," + (graphPlace + 0.005)
    if minX <= 0 and maxX >= 0
      ctx.beginPath!
      ctx.strokeStyle = "#000000"
      ctx.moveTo scaleFactorX * -1 * minX + 20, 0
      ctx.lineTo scaleFactorX * -1 * minX + 20, canv.height
      ctx.stroke!
      graphPlace = (scaleFactorX * -1 * minX + 20) / canv.width
      colorMarkings += "|R,000000,0," + graphPlace + "," + (graphPlace + 0.005)
    gChart = document.getElementById("googleLineChart")
    minX -= (maxX - minX) / 23
    maxX += (maxX - minX) / 23
    minval -= (maxval - minval) / 18
    maxval += (maxval - minval) / 18
    profChartUrl = "chs=300x250" + colorMarkings + "&cht=lxy&chxt=x,y&chxr=0," + minX + "," + maxX + "|1," + minval + "," + maxval + "&chd=t:" + profChart.join("|")
    # gChart.innerHTML = "<iframe src=\"urlJump.html?img=" + escape(profChartUrl) + "\" style=\"width:315px;height:270px;\"></iframe>"
  MakeScatterChart = (spreadsheet, range, gview, gtype, helpflag, isResize) ->
    values = []
    labels = []
    total = 0
    colors = ['0' to '9'] +++ ['a' to 'f']
    if range.left is range.right
      nitems = range.bottom - range.top + 1
      byrow = true
    else
      nitems = range.right - range.left + 1
      byrow = false
    if isResize
      try
        minX = 1 * document.getElementById("SocialCalc-graphMinX").value
      catch e
        minX = null
      try
        maxX = 1 * document.getElementById("SocialCalc-graphMaxX").value
      catch e
        maxX = null
      try
        minval = 1 * document.getElementById("SocialCalc-graphMinY").value
      catch e
        minval = null
      try
        maxval = 1 * document.getElementById("SocialCalc-graphMaxY").value
      catch e
        maxval = null
    evenlySpaced = false
    dotSizes = new Array!
    i = 0
    while i < nitems
      cr = (if byrow then SocialCalc.rcColname(range.left) + (i + range.top) else SocialCalc.rcColname(i + range.left) + range.top)
      cr1 = (if byrow then SocialCalc.rcColname(range.left - 1 or 1) + (i + range.top) else SocialCalc.rcColname(i + range.left) + (range.top - 1 or 1))
      cr2 = (if byrow then SocialCalc.rcColname(range.left + 1 or 2) + (i + range.top) else SocialCalc.rcColname(i + range.left) + (range.top + 1 or 2))
      cell = spreadsheet.sheet.GetAssuredCell(cr)
      if cell.valuetype.charAt(0) is "n"
        val = cell.datavalue - 0
        maxval = val  if (not maxval? or maxval < val) and not isResize
        minval = val  if (not minval? or minval > val) and not isResize
        values.push val
        cell = spreadsheet.sheet.GetAssuredCell(cr1)
        if (range.right is range.left or range.top is range.bottom) and (cell.valuetype.charAt(0) is "t" or cell.valuetype.charAt(0) is "n")
          labels.push cell.datavalue + ""
          maxX = cell.datavalue  if (not maxX? or maxX < cell.datavalue) and not isResize
          minX = cell.datavalue  if (not minX? or minX > cell.datavalue) and not isResize
        else
          labels.push cr
          evenlySpaced = true
        cell = spreadsheet.sheet.GetAssuredCell(cr2)
        if (range.right is range.left or range.top is range.bottom) and (cell.valuetype.charAt(0) is "t" or cell.valuetype.charAt(0) is "n")
          dotSizes.push cell.datavalue + ""
        else
          dotSizes.push "5"
      i++
    if evenlySpaced
      i = 0

      while i < values.length
        labels[i] = i
        i++
      unless isResize
        minX = 0
        maxX = values.length - 1
    str = "<canvas id=\"myScatterCanvas\" style=\"border:1px solid black;\" width=\"500px\" height=\"400px\"></canvas><span id=\"googleScatterChart\"></span>"
    str += "<div id=\"scatterChartScales\"><input type=\"button\" id=\"autoScaleButton\" value=\"Reset\" onclick=\"\"/>X-min:<input id=\"minPlotX\" onchange=\"\" size=5/>X-max:<input id=\"maxPlotX\" onchange=\"\" size=5/>Y-min:<input id=\"minPlotY\" onchange=\"\" size=5/>Y-max:<input id=\"maxPlotY\" onchange=\"\" size=5/></div>"
    gview.innerHTML = str
    unless isResize
      document.getElementById("SocialCalc-graphMinX").value = minX
      spreadsheet.graphMinX = minX
      document.getElementById("SocialCalc-graphMaxX").value = maxX
      spreadsheet.graphMaxX = maxX
      document.getElementById("SocialCalc-graphMinY").value = minval
      spreadsheet.graphMinY = minval
      document.getElementById("SocialCalc-graphMaxY").value = maxval
      spreadsheet.graphMaxY = maxval
    canv = document.getElementById("myScatterCanvas")
    ctx = canv.getContext("2d")
    scaleFactorX = (canv.width - 40) / (maxX - minX)
    scaleFactorY = (canv.height - 40) / (maxval - minval)
    lastX = scaleFactorX * (labels[0] - minX) + 20
    lastY = scaleFactorY * (values[0] - minval) + 20
    profChart = [ Math.floor(lastX / canv.width * 100), Math.floor(lastY / canv.height * 100), dotSizes[0] * 10 ]
    topY = canv.height
    drawColor = do getDrawColor
    ctx.fillStyle = drawColor
    ctx.beginPath!
    ctx.arc lastX, topY - lastY, dotSizes[0], 0, 2 * Math.PI, false
    ctx.fill!
    i = 1
    while i < values.length
      ctx.moveTo lastX, topY - lastY
      lastX = scaleFactorX * (labels[i] - minX) + 20
      lastY = scaleFactorY * (values[i] - minval) + 20
      ctx.beginPath!
      ctx.arc lastX, topY - lastY, dotSizes[i], 0, 2 * Math.PI, false
      ctx.fill!
      profChart[profChart.length - 3] += "," + Math.floor(lastX / canv.width * 100)
      profChart[profChart.length - 2] += "," + Math.floor(lastY / canv.height * 100)
      profChart[profChart.length - 1] += "," + (dotSizes[i] * 10)
      i++
    colorMarkings = "&chm=o," + drawColor.replace("#", "") + ",0,-1,10"
    if minval <= 0 and maxval >= 0
      ctx.beginPath!
      ctx.strokeStyle = "#000000"
      ctx.moveTo 0, canv.height - (scaleFactorY * -1 * minval + 20)
      ctx.lineTo canv.width, canv.height - (scaleFactorY * -1 * minval + 20)
      ctx.stroke!
      graphPlace = 1 - ((canv.height - (scaleFactorY * -1 * minval + 20)) / canv.height)
      colorMarkings += "|r,000000,0," + graphPlace + "," + (graphPlace + 0.005)
    if minX <= 0 and maxX >= 0
      ctx.beginPath!
      ctx.strokeStyle = "#000000"
      ctx.moveTo scaleFactorX * -1 * minX + 20, 0
      ctx.lineTo scaleFactorX * -1 * minX + 20, canv.height
      ctx.stroke!
      graphPlace = (scaleFactorX * -1 * minX + 20) / canv.width
      colorMarkings += "|R,000000,0," + graphPlace + "," + (graphPlace + 0.005)
    gChart = document.getElementById("googleScatterChart")
    minX -= (maxX - minX) / 23
    maxX += (maxX - minX) / 23
    minval -= (maxval - minval) / 18
    maxval += (maxval - minval) / 18
    profChartUrl = "chs=300x250" + colorMarkings + "&cht=s&chxt=x,y&chxr=0," + minX + "," + maxX + "|1," + minval + "," + maxval + "&chd=t:" + profChart.join("|")
    # gChart.innerHTML = "<iframe src=\"urlJump.html?img=" + escape(profChartUrl) + "\" style=\"width:315px;height:270px;\"></iframe>"

  SocialCalc.GraphTypesInfo =
    displayorder: ["verticalbar","horizontalbar","piechart","linechart","scatterchart"]
    verticalbar: {display: SocialCalc.Constants.s_loc_vertical_bar, func: GraphVerticalBar}
    horizontalbar: {display: SocialCalc.Constants.s_loc_horizontal_bar, func: GraphHorizontalBar}
    piechart: {display: SocialCalc.Constants.s_loc_pie_chart, func: MakePieChart}
    linechart: {display: SocialCalc.Constants.s_loc_line_chart, func: MakeLineChart}
    scatterchart: {display: SocialCalc.Constants.s_loc_scatter_chart, func: MakeScatterChart}

  do doPlay
