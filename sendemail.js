exports.sendTestEmail = function (emailTo, emailSubject, emailBody) { 
	
	var nodemailer = require("nodemailer");
	
	var generator = require('xoauth2').createXOAuth2Generator({
		
		// **********************************
		//  Please add OAuth2 values 
		//   from OAuth playground: https://developers.google.com/oauthplayground/
		//   to node environment vars (process.env.)
		// **********************************
		
		
	    user: process.env.i3pqpufosc_user, // Your gmail address.
	    
	    clientId: process.env.i3pqpufosc_clientId,
	    clientSecret: process.env.i3pqpufosc_clientSecret,
	    	    	
	    refreshToken: process.env.i3pqpufosc_refreshToken 
	});
	
	
	
	// listen for token updates
	// you probably want to store these to a db
	generator.on('token', function(token){
	    console.log('New token for %s: %s', token.user, token.accessToken);
	});
	
	
	// login
	var smtpTransport = nodemailer.createTransport({
	    service: 'gmail',
	    auth: {
	        xoauth2: generator
	    }
	});
	
	
	var mailOptions = {
	//	    from: "eddyparkinson@cellmaster.com.au",
	    from: process.env.i3pqpufosc_user,
	    to: emailTo,
	    subject: emailSubject, // Subject line
	    text: emailBody, // plaintext body
	    html: emailBody // html body
	    //to: "eddyparkinsoncity@yahoo.co.uk",
	    //subject: 'Hello ', // Subject line
	    //text: 'Hello world ', // plaintext body
	    //html: '<b>Hello world </b>' // html body
	};
	
	var mailResponse;
	smtpTransport.sendMail(mailOptions, function(error, info) {
      mailResponse = info;
	  if (error) {
	    console.log(error);
	    console.dir(info);
	  } else {
        console.log('Message sent: ');
        //console.log('Env:'+process.env.i3pqpufosc_refreshToken);	    
        //console.dir(process.env);	    
	  }
	  smtpTransport.close();
	});
    console.dir(mailResponse);
	
	
}

// sendTestEmail();

