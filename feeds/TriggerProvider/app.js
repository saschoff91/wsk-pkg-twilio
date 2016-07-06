/*
 * Twilio App as Trigger feed. Twilio webhook uses this endpoint for fire trigger
 * 
 */

var express = require('express');
var cfenv = require('cfenv');
var bodyParser = require('body-parser');
var request = require('request');
var logger = require('./Logger');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();
var twilioService = appEnv.getServiceCreds('Twilio-ed');

var accountSID = twilioService.accountSID;
var authToken = twilioService.authToken;

var client = require('twilio')(accountSID,authToken);

console.log('TWILIO CREDENTIALS ',accountSID, ' AND ', authToken );

var feeds={};

app.post('/createFeed', isAuthenticated,function(req,res) {
	var method = 'POST/ createFeed';
	var args = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
	var messagingService = args.serviceSID;
	var numberSID = args.numberSID;
	var trigger = args.trigger;
	var namespace = args.namespace;

	if (messagingService) {
		feeds[trigger] = {messagingService:messagingService, namespace:namespace, trigger:trigger, apikey:args.apikey};
		sendResponse(method, 200, 'Trigger "'+trigger+'" on MessagingServiceSid '+ messagingService+' created correctly.',res);
	} else {
		if (numberSID) { // if parameter numberSID is given
			numberSIDLookUp(numberSID, function(number) { //check in twilio if numberSID exists
				if ((number)&&(numberSID == number.sid)) {
					feeds[trigger] = {numberSID:numberSID, phoneNumber:number.phone_number, namespace:namespace, trigger:trigger,apikey:args.apikey};
					sendResponse(method, 200, 'Trigger "'+trigger+'" on numberSID '+ numberSID+' listen on number '+number.phone_number+' created correctly.',res);
				} else {
					sendError(method, 404, 'Trigger "'+trigger+'" cannot created! NumberSID not available in twilio account!',res);
				}
			});
		}
		else {
			sendResponse(method, 500, 'Trigger "'+trigger+'" failed to create. Missing parameters, e.g. numberSID or messagingServiceSID.',res);
		}

	}
});

function numberSIDLookUp(numberSID, _callback) {
	console.log("LOOKUP WITH NUMBERID ", numberSID);
	client.incomingPhoneNumbers(numberSID).get(function(err, number) { 
		if (number) {
			_callback(number);
		} else {
			_callback(err);
		}
	}); 
}

app.delete('/deleteFeed/:id', isAuthenticated,function(req,res) {
	var method = 'DELETE/ deleteFeed';
	var id = req.params.id;
	id = id.replace(/:/g, "/");

	delete feeds[id];

	sendResponse(method, 200, 'Trigger "'+id+'" deleted correctly.',res);

});

app.post('/messageincoming',function(req,res) {
	var method = "POST/ messageincoming";
	var args = typeof req.body === 'object' ? req.body : JSON.parse(req.body);

	if (req.body.MessagingServiceSid) {
		//if request is from messaging service webhook
		for (var id in feeds) {
			var val = feeds[id];

			console.log('1. PART',val.messagingServce, 'and 2. PART ',req.body.MessagingServiceSid);
			if (val.messagingService == req.body.MessagingServiceSid) {
				var response = invokeWhiskAction(id, req.body);
			}
		}
		res.send(JSON.stringify({result:response}));
	} else {
		//if request is from a number webhook
		for (var id in feeds) {
			var val = feeds[id];

			// test  numberSID: '+4915735984041' 
			console.log('1. PART',val.numberSID, 'and 2. PART ',req.body.To);
			if (val.phoneNumber == req.body.To) {
				var response = invokeWhiskAction(id, req.body);
			}
		}
		res.send(JSON.stringify({result:response}));
	}
});

app.post('/messagingservice',function(req,res) {
	var method = "POST/ messagingservice";
	var args = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
	//console.log(req.body);
	for (var id in feeds) {
		var val = feeds[id];

		if (val.messagingService == req.body.MessagingServiceSid) {
			var response = invokeWhiskAction(id, req.body);
		}
	}
	res.send(JSON.stringify({result:response}));
});


/**
 * Fire the whisk trigger
 */
function invokeWhiskAction(id, message) {
	var method = 'FUNCTION: invokeWhiskAction';
	
	logger.info(id, method, 'for trigger', id, 'invoking action', id, 'with incoming message', message);

	var form = {payload:message};

	var uri = 'https://openwhisk.ng.bluemix.net/api/v1/namespaces/'+feeds[id].namespace+'/triggers/'+id;

	var options= {
			method: 'POST',
			uri: uri,
			auth: {
				user: feeds[id].apikey[0],
				pass: feeds[id].apikey[1]
			},
			json:form
	};
	request(options, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			logger.info(id, method, 'Done trigger fired, body', body);
			return body;
		} else {
			logger.error(id, method, 'Error fire trigger:', response ? response.statusCode : response, error, body);
			return body;
		}
	});
}

function isAuthenticated(req, res, next) {
	var method = req.method + " " + req.path;
	if (!req.headers.authorization)
		return sendError(method, 401, "Unauthorized: authentication header expected", res);

	var parts = req.headers.authorization.split(" ");
	if (parts[0].toLowerCase() !== 'basic' || !parts[1])
		return sendError(method, 401, "Unauthorized: authentication header expected", res);

	var auth = new Buffer(parts[1], 'base64').toString();
	auth = auth.match(/^([^:]*):(.*)$/);
	if (!auth)
		return sendError(method, 401, "Unauthorized: authentication header expected", res);

	req.user = {
			uuid: auth[1],
			key: auth[2]
	};

	next();
}

//FUNCTION: SENDING ERROR MESSAGES
function sendError(method, statusCode, message, res) {
	console.log(method, message);
	res.status(statusCode).json({
		error: message
	});
}

function sendResponse(method, statusCode, message, res) {
	console.log(method, message);
	res.status(statusCode).json({
		response: message
	});
}

//------------------------------- MESSAGE HUB POLLING SERVER
app.listen(appEnv.port, '0.0.0.0', function() {
	var method = 'StartUp'
		// print a message when the server starts listening
		logger.info("OK",method, 'Server listen on port '+appEnv.port);
});
