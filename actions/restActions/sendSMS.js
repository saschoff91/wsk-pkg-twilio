/*
 * Action sendSMS based on twilio 
 * Have a look at the restful api from twilio
 * https://www.twilio.com/docs/api/rest/sending-messages
 */

function main(params) {

	var request = require('request');

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

	
	if (!base) {
		return whisk.error("Parameter 'base' is missing.");
	}
	if (!accountSid) {
		return whisk.error("Parameter 'accountSid' is missing.");
	}
	if (!authToken) {
		return whisk.error("Parameter 'authToken' is missing.");
	}
	if (!to) {
		return whisk.error("Parameter 'to' is missing.");
	}
	if ((!from)&&(!tomessagingServiceSid)) {
		return whisk.error("Parameter 'from' and 'messagingServiceSid' are missing. At least one of them must given");
	} 
	
	if (!message) {
		return whisk.error("Parameter 'message' is missing.");
	}
	
	
	var uri = "https://"+accountSid+":"+authToken+"@"+base+'/Accounts/'+accountSid+'/Messages.json';
	
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

	});

	return whisk.async();
} 
