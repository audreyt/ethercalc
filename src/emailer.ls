@__emailer__ = null
@include = ->
  return @__emailer__ if @__emailer__
  emailer = {}
  emailer.log = -> console.log "email tester"
  nodemailer = require \nodemailer
  generator = require \xoauth2 .createXOAuth2Generator do
    #// **********************************
    #//  Please add OAuth2 values 
    #//   from OAuth playground: https://developers.google.com/oauthplayground/
    #//   to node environment vars (process.env.)
    #// **********************************
    user: process.env.i3pqpufosc_user #// Your gmail address.
    clientId: process.env.i3pqpufosc_clientId
    clientSecret: process.env.i3pqpufosc_clientSecret
    refreshToken: process.env.i3pqpufosc_refreshToken 

  #// listen for token updates
  #// you probably want to store these to a db
  generator.on \token (token) -> 
    #console.log "New token for #{token.user}: #{token.accessToken}"  



  #// login
  smtpTransport = nodemailer.createTransport do 
    service: 'gmail'
    auth: 
      xoauth2: generator

  emailer.sendemail = (emailTo, emailSubject, emailBody) -> 
    #debug return before sending
  none = (emailTo, emailSubject, emailBody) !->
    mailOptions = 
      from: process.env.i3pqpufosc_user
      to: emailTo               #// to address
      subject: emailSubject     #// Subject line
      text: emailBody           #// plaintext body
      html: emailBody           #// html: '<b>Hello world </b>'       #// html body
  
    smtpTransport.sendMail mailOptions, (error, info) !->
      if error
        console.log error
        console.dir info
      else
        console.log 'Message sent to:'+(info.accepted)
        #//console.dir(info);
        return info.accepted
      smtpTransport.close();
  

  @__emailer__ = emailer

  