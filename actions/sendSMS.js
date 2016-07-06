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
	
	return whisk.async();
} 
