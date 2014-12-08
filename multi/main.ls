require \./styles.styl
React = require \react
TabPanel = require \react-basic-tabs
BasePath = \http://127.0.0.1:8000/
Index = \test
HackFoldr = require(\./foldr.ls).HackFoldr

{div, iframe, input, button} = React.DOM

createClass = React.createFactory << React.createClass
App = createClass do
  propTypes: { foldr: React.PropTypes.any.isRequired }
  getDefaultProps: -> activeIndex: 0
  render: ->
    can-delete = @props.foldr.size! > 1
    div { className: \nav },
      Nav { titles: @props.foldr.titles!, activeIndex: @get-idx!, @~onChange }
      Buttons { can-delete, @~on-add, @~on-rename, @~on-delete }
  get-idx: -> @props.activeIndex <? @props.foldr.lastIndex!
  get-sheet: -> @props.foldr.at(@get-idx!)
  onChange: -> @setProps activeIndex: it
  on-add: ->
    { foldr } = @props
    prefix = \Sheet
    next-sheet = foldr.size! + 1
    if foldr.lastRow!title is /^([_a-zA-Z]+)(\d+)$/
      prefix = RegExp.$1
      next-sheet = parseInt RegExp.$2
    while "#prefix#next-sheet" in foldr.titles!
      ++next-sheet
    activeIndex = foldr.size!
    foldr.=push { title: "#prefix#next-sheet" }
    @setProps { foldr, activeIndex }
  on-rename: ->
    { foldr } = @props
    title = prompt("Rename Sheet", @get-sheet!title)
    return if not title? or title in foldr.titles!
    # TODO: Carry over the data if non-empty
    foldr.set-at @get-idx!, { title }
    @setProps { foldr }
  on-delete: ->
    { foldr } = @props
    foldr.delete-at @get-idx!
    @setProps { foldr }

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
      ...for title in @props.titles
        div { key: title, title, className: \wrapper },
          iframe { src: "#BasePath#{ encodeURIComponent title }" }

<-(window.init=)
foldr = new HackFoldr "#BasePath/#Index"
React.render App({ foldr }), document.body
