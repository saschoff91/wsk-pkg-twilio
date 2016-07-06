/*
 * Action sendSMS based on twilio
 * Hava a look at the restful api documentation from twilio
 * https://www.twilio.com/docs/api/rest/making-calls 
 */

var request = require('request');

function main(params) {
	console.log(params);

	// twilio credentials from package binding
	var base = params.base;
	var accountSid = params.account;
	var authToken = params.token;

	//mandatory param input from cli
	var to = params.to;
	var from = params.from;
	var voiceUrl = params.url;

	//optional param input from cli
	var applicationSid = params.applicationSid; //alternative to url

	var uri = "https://"+accountSid+":"+authToken+"@"+base+'/Accounts/'+accountSid+'/Calls.json';

	if (applicationSid) {
		var form = {		
				To: to, 
				From: from, 
				ApplicationSid: applicationSid   
		};
	} else {
		var form = {		
				To: to, 
				From: from, 
				Url: voiceUrl   
		};
	}

	var req = request.post({
		uri:uri,
		form:form
	});

	req.on('response', function(response) {
		if ( response.statusCode == 201) {
			return whisk.done(response);
		}
		else {
			return whisk.error(response);
		}

	});

	return whisk.async();
} 
