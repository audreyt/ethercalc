@__emailer__ = null
@include = ->
  return @__emailer__ if @__emailer__
  emailer = {}
  emailer.log = -> console.log "email tester"

  @__emailer__ = emailer
