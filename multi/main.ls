require \./styles.styl
React = require \react
TabPanel = require \react-basic-tabs
BasePath = \http://127.0.0.1:8000
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
      Nav { rows: @props.foldr.rows, activeIndex: @get-idx!, @~onChange }
      Buttons { can-delete, @~on-add, @~on-rename, @~on-delete }
  get-idx: -> @props.activeIndex <? @props.foldr.lastIndex!
  get-sheet: -> @props.foldr.at(@get-idx!)
  onChange: -> @setProps activeIndex: it
  on-add: ->
    { foldr } = @props
    prefix = \Sheet
    next-sheet = foldr.size! + 1
    link-prefix = "/#Index."
    if foldr.lastRow!title is /^([_a-zA-Z]+)(\d+)$/
      prefix = RegExp.$1
      next-sheet = parseInt RegExp.$2
    if foldr.lastRow!link is /^(\/[^=]+\.)/
      link-prefix = RegExp.$1
    while "#prefix#next-sheet" in foldr.titles! or "#link-prefix#next-sheet" in foldr.links!
      ++next-sheet
    activeIndex = foldr.size!
    foldr.=push { link: "#link-prefix#next-sheet", title: "#prefix#next-sheet" }
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
    return unless confirm("Really delete?\n#{ @get-sheet!title }")
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
      ...for { title, link="/#{ encodeURIComponent title }" } in @props.rows
        div { key: title, title, className: \wrapper },
          Frame { src: "#BasePath#link" }

Frame = createClass do
  shouldComponentUpdate: -> @props.src isnt it.src
  render: -> iframe { key: @props.src, src: @props.src }

<-(window.init=)
foldr = new HackFoldr BasePath
<-foldr.fetch Index
React.render App({ foldr }), document.body
