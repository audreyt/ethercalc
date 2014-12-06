require \./styles.styl
React = require \react
TabPanel = require \react-basic-tabs

{div} = React.DOM

createClass = React.createFactory << React.createClass
App = React.createClass do
  getInitialState: -> activeIndex: 1
  onChange: -> @setState activeIndex: it
  render: ->
    TabPanel { activeIndex: @state.activeIndex, @~onChange, tabVerticalPosition: \bottom },
      div { title: \One }   \First
      div { title: \Two }   \Second
      div { title: \Three } \Third
      div { title: \Four }  \Fourth
      div { title: \Five }  \Fifth

<-(window.init=)
React.render App(), document.body
