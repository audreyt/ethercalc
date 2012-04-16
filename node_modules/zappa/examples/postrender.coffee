require('./zappa') ->
  @enable 'default layout'
  
  @get '/': ->
    @user = plan: 'staff'

    @render 'index', {@user, postrender: 'plans'}

  @postrender plans: ($) ->
    $('.staff').remove() if @user.plan isnt 'staff'
    $('div.' + @user.plan).addClass 'highlighted'

  @view index: ->
    @title = 'Post-rendering'
    @style = '''
      #quotas div {border: 1px solid #999; background: #eee; padding: 10px; margin: 10px}
      #quotas .highlighted {border: 3px solid #37697e; background: #d0deea}
    '''

    h1 'Quotas:'

    div id: 'quotas', ->
      div class: 'basic', ->
        h2 'Basic'
        p 'Disk: 1 GB'
        p 'Bandwidth: 10 GB'
        button class: 'staff', -> 'Change Quotas'

      div class: 'silver', ->
        h2 'Silver'
        p 'Disk: 2 GB'
        p 'RAM: 15 GB'
        button class: 'staff', -> 'Change Quotas'

      div class: 'golden', ->
        h2 'Golden'
        p 'Disk: 4 GB'
        p 'RAM: 30 GB'
        button class: 'staff', -> 'Change Quotas'

      div class: 'staff', ->
        h2 'Staff'
        p 'Disk: 10 GB'
        p 'RAM: 100 GB'