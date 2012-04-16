start = new Date
log = console.log
_ = require 'underscore'
fs = require 'fs'
path = require 'path'
client = require './client'
print = -> process.stdout.write.apply process.stdout, arguments
timeout = (func, time) -> setTimeout time, func

grey    = "\033[0;90m"
red     = "\033[0;31m"
green   = "\033[0;32m"
yellow  = "\033[0;33m"
blue    = "\033[0;34m"
reset   = "\033[0m"

tests = {}
done = {}
uncaught = []

@run_dir = (dir) =>
  @add_dir dir, => @run()

@add_dir = (dir, cb) =>
  fs.readdir dir, (err, files) =>
    if err then throw err
    else
      for f in files
        if f.match(/\.coffee$/)
          p = path.join dir, f
          if p isnt module.parent.filename
            @add p
      cb()

@add = (p) ->
  file = path.basename(require.resolve p)
  
  for title, test of require(p).tests
    do (title, test) ->
      full_title = file + ': ' + title
      
      tests[full_title] = test
      
      test.t =
        title: title
        file: file
        full_title: full_title
        expected: {}
        waits: {}
        passed: {}
        failed: {}
        
        client: client

        all_passed: ->
          _(@failed).isEmpty() and _(@expected).isEmpty()

        _reached: (key) ->
          if @expected[key]
            delete @expected[key]
            @end_check()

        reached: -> @pass.apply @, arguments

        pass: (key) ->
          @passed[key] = true
          @_reached key

        fail: (key, info = {}) ->
          @failed[key] = info
          @_reached key

        equal: (key, actual, expected) ->
          if actual isnt expected then @fail key, {type: 'equal', actual, expected}
          else @pass key

        matches: (key, actual, regex) ->
          if not actual.match(regex) then @fail key, {type: 'matches', actual, regex}
          else @pass key

        ok: (key, value) ->
          if !!!value then @fail key, {type: 'ok'}
          else @pass key

        expect: ->
          @expected[a] = true for a in arguments
                  
        wait: (ms) ->
          id = timeout ms, =>
            delete @waits[id]
            @end_check()
          @waits[id] = true

        end_check: ->
          if not done[@full_title]
            if @ran? and (_(@expected).isEmpty() or _(@waits).isEmpty())
              @end()
        
        end: ->
          clearInterval(k) for k, v of @waits
          done[@full_title] = @
          finish_him() if _(done).size() is _(tests).size()

@run = ->
  for full_title, test of tests
    do (full_title, test) ->
      t = test.t
      try
        test(t)
      catch e
        t.error = e
        t.end()
      
      t.ran = yes
      t.end_check()

finish_him = ->
  line = ('-' for i in [1..40]).join('')
  log ''
  
  passed = 0
  failed = 0
  timedout = 0
  errors = 0
  
  for full_title, test of tests
    do (full_title, test) ->
      t = done[full_title]
      if not t.all_passed() or t.error
        log full_title
        log line
      
        for k, v of t.passed
          passed++
          log "#{green}✔#{reset} #{k}"
        for k, v of t.failed
          failed++
          log "#{red}✖ #{k} (failed '#{v.type}')#{reset}"
          if v.type is 'equal'
            log "Expected vs #{red}actual#{reset}:"
            log v.expected
            log red + v.actual + reset
          else if v.type is 'matches'
            log "Regex vs #{red}actual#{reset}:"
            log v.regex
            log red + v.actual + reset
        for k, v of t.expected
          timedout++
          log "#{red}✖ #{k} (not reached)#{reset}"
        if t.error
          errors++
          log "#{red}✖ Error:#{reset}"
          log t.error.stack
        
        log ''
  
  if uncaught.length > 0
    log "#{uncaught.length} Uncaught error(s):"
    for e in uncaught
      log e.stack

    log ''

  log line + line

  if failed is 0 and timedout is 0 and errors is 0 and uncaught.length is 0
    print "#{green}All passing#{reset} | "
  else
    print "#{red}#{failed} fail(s)#{reset} | " if failed > 0
    print "#{red}#{timedout} not reached#{reset} | " if timedout > 0
    print "#{red}#{errors} error(s)#{reset} | " if errors > 0
    print "#{red}#{uncaught.length} uncaught error(s)#{reset} | " if uncaught.length > 0

  print "#{_(tests).size()} tests | "
  log "#{new Date - start} ms\n"

  process.exit()
      
process.on 'uncaughtException', (err) ->
  uncaught.push err
  throw err