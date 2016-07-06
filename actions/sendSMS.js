/*
 * Action sendSMS based on twilio 
 * Have a look at the restful api from twilio
 * https://www.twilio.com/docs/api/rest/sending-messages
 */

function main(params) {

	var request = require('request');

	var twilio = require('twilio');
	// twilio credentials from package binding
	var base = params.base;
	var accountSid = params.account;
	var authToken = params.token;

	//required param input from cli
	var to = params.to;
	var from = params.from;
	var message = params.message;

	//optional parameter input, alternativ to 'from'
	var messagingServiceSid = params.messagingServiceSid;

	//var accountSid = {{ accountSid }}; // Your Account SID from www.twilio.com/console
	//var authToken = {{ authToken }};   // Your Auth Token from www.twilio.com/console

	var twilio = require('twilio');
	var client = new twilio.RestClient(accountSid, authToken);

	client.messages.create({
	    body: message,
	    to: to,  // Text this number
	    from: from // From a valid Twilio number
	}, function(err, message) {
	    console.log(message.sid);
	    return whisk.done("SMS sent successful, sid: "+ message.sid);
	});
	
	
	
	//----------------- RESTFUL API BASED SMS TRANSMITTING
	
	/*var uri = "https://"+accountSid+":"+authToken+"@"+base+'/Accounts/'+accountSid+'/Messages.json';

	//testing parameter input
	/*
	var form = {		
			To: "+491721366239", 
			From: "+4915735984041", 
			Body: "WAZZZUUUUUUPPPP2?!!!!"   
	};*/

	/*
	if (messagingServiceSid) {
		console.log("messagingServiceSid is set: "+ messagingServiceSid);
		var form = {		
				To: to, 
				Body:message,
				MessagingServiceSid: messagingServiceSid
		};   
	} else {
		var form = {		
				To: to, 
				From: from, 
				Body:message  
		};
	}

	var req = request.post({
		uri:uri,
		form:form
	}, function(error, response,body) {
		if ( response.statusCode == 201) {
			console.log(body);
		}
	});

	req.on('response', function(response) {
		if ( response.statusCode == 201) {
			return whisk.done(response);
		} else {
			return whisk.error(response);
		}

	});*/

	return whisk.async();
} 
