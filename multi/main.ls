require \./styles.styl
React = require \react
TabPanel = require \react-basic-tabs
BasePath = \http://127.0.0.1:8000/
Index = \test

{div, iframe, input, button} = React.DOM

createClass = React.createFactory << React.createClass
App = createClass do
  getDefaultProps: ->
    Sheets: [ { row: 1, title: \Sheet1 }, { title: \Sheet2 } ]
    activeIndex: 0
  render: ->
    can-delete = @props.Sheets.length > 1
    div { className: \nav },
      Nav { Sheets: @props.Sheets, activeIndex: @get-idx!, @~onChange }
      Buttons { can-delete, @~on-add, @~on-rename, @~on-delete }
  get-idx: -> @props.activeIndex <? @props.Sheets.length-1
  get-sheet: -> @props.Sheets[@get-idx!]
  onChange: -> @setProps activeIndex: it
  on-add: ->
    { Sheets } = @props
    prefix = \Sheet
    next-sheet = Sheets.length + 1
    if Sheets[*-1]?title is /^([_a-zA-Z]+)(\d+)$/
      prefix = RegExp.$1
      next-sheet = parseInt RegExp.$2
    while "#prefix#next-sheet" in [ title for {title} in Sheets ]
      ++next-sheet
    @setProps do
      Sheets: Sheets ++ { title: "#prefix#next-sheet" }
      activeIndex: Sheets.length
  on-rename: ->
    { Sheets } = @props
    t = prompt("Rename Sheet", @get-sheet!)
    return if not t? or t in [ title for {title} in Sheets ]
    # TODO: Carry over the data if non-empty
    Sheets[@get-idx!] = { title: s }
    @setProps { Sheets }
  on-delete: ->
    { Sheets } = @props
    return unless Sheets.length > 1 # Cannot delete the last sheet
    Sheets.splice @get-idx!, 1
    @setProps { Sheets }

Buttons = createClass do
  render: ->
    div { className: \buttons },
      button { onClick: @props.on-add }, \Add
      button { onClick: @props.on-rename }, \Rename...
      button { onClick: @props.on-delete, disabled: !@props.can-delete }, \Delete
Nav = createClass do
  onChange: -> @props.onChange it
  render: ->
    TabPanel { activeIndex: @props.activeIndex, @~onChange, tabVerticalPosition: \bottom },
      ...for { title } in @props.Sheets
        div { key: title, title, className: \wrapper },
          iframe { src: "#BasePath#{ encodeURIComponent title }" }

<-(window.init=)
React.render App(), document.body
