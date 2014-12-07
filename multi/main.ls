require \./styles.styl
React = require \react
TabPanel = require \react-basic-tabs
BasePath = \http://127.0.0.1:8000/

{div, iframe, input, button} = React.DOM

createClass = React.createFactory << React.createClass
App = createClass do
  getDefaultProps: ->
    Sheets: <[ Sheet1 Sheet2 Sheet3 Sheet4 Sheet5 ]>
    activeIndex: 0
  render: ->
    div { className: \nav },
      Nav { Sheets: @props.Sheets, activeIndex: @get-idx!, @~onChange }
      Buttons { @~on-add, @~on-rename, @~on-delete }
  get-idx: -> @props.activeIndex <? @props.Sheets.length-1
  get-sheet: -> @props.Sheets[@get-idx!]
  onChange: -> @setProps activeIndex: it
  on-add: ->
    { Sheets } = @props
    next-sheet = Sheets.length + 1
    while "Sheet#next-sheet" in Sheets
      ++next-sheet
    @setProps Sheets: (Sheets ++ "Sheet#next-sheet")
  on-rename: ->
    { Sheets } = @props
    s = prompt("Rename Sheet", @get-sheet!)
    return if not s? or s in Sheets
    # TODO: Carry over the data if non-empty
    Sheets[@get-idx!] = s
    @setProps { Sheets }
  on-delete: ->
    { Sheets } = @props
    Sheets.splice @get-idx!, 1
    @setProps { Sheets }

Buttons = createClass do
  render: ->
    div { className: \buttons },
      button { onClick: @props.on-add }, \Add
      button { onClick: @props.on-rename }, \Rename...
      button { onClick: @props.on-delete }, \Delete

Nav = createClass do
  onChange: -> @props.onChange it
  render: ->
    TabPanel { activeIndex: @props.activeIndex, @~onChange, tabVerticalPosition: \bottom },
      ...for title in @props.Sheets
        div { title, className: \wrapper },
          iframe { src: "#BasePath#{ encodeURIComponent title }" }

<-(window.init=)
React.render App(), document.body
