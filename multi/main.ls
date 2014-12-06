require \./styles.styl
React = require \react
TabPanel = require \react-basic-tabs
BasePath = \http://127.0.0.1:8000/

{div, iframe, input, button} = React.DOM

createClass = React.createFactory << React.createClass
App = createClass do
  getDefaultProps: -> Sheets: <[ Sheet1 Sheet2 Sheet3 Sheet4 Sheet5 ]>
  render: ->
    div { className: \nav },
      Nav { Sheets: @props.Sheets }
      Buttons!

Buttons = createClass do
  render: ->
    div { className: \buttons },
      button {}, \Add
      button {}, \Rename...
      button {}, \Delete

Nav = createClass do
  getInitialState: -> activeIndex: 0
  onChange: -> @setState activeIndex: it
  render: ->
    TabPanel { activeIndex: @state.activeIndex, @~onChange, tabVerticalPosition: \bottom },
      ...for title in @props.Sheets
        div { title, className: \wrapper },
          iframe { src: "#BasePath#{ encodeURIComponent title }" }

<-(window.init=)
React.render App(), document.body
