require \./styles.styl
React = require \react
TabPanel = require \react-basic-tabs
BasePath = \http://127.0.0.1:8000/

{div, iframe} = React.DOM

createClass = React.createFactory << React.createClass
App = React.createClass do
  getInitialState: -> activeIndex: 0
  onChange: -> @setState activeIndex: it
  render: ->
    Sheets = <[ Sheet1 Sheet2 Sheet3 Sheet4 Sheet5 ]>
    TabPanel { activeIndex: @state.activeIndex, @~onChange, tabVerticalPosition: \bottom },
      ...for title in Sheets
        div { title, className: \wrapper },
          iframe { src: "#BasePath#{ encodeURIComponent title }" }

<-(window.init=)
React.render App(), document.body
