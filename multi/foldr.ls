require \es6-promise .polyfill!
require \isomorphic-fetch

export class HackFoldr
  ({ @base, @id }) ->
    @rows = [ { row: 1, title: \Sheet1 }, { title: \Sheet2 } ]
  size: -> @rows.length
  lastIndex: -> @rows.length - 1
  lastRow: -> if @rows.length then @rows[*-1] else {}
  titles: -> [ title for {title} in @rows ]
  at: (idx) -> @rows[idx] ? {}
  push: (row) -> @rows.push(row); @
  set-at: (idx, patch) -> @rows[idx] <<< patch; @
  delete-at: (idx) -> @rows.splice idx, 1; @

# test
new HackFoldr { base: 'https://ethercalc.org/' id: '' }
