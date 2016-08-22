/*
 * Copyright 2015-2016 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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


/*****TWILIO******/
var twilioService = appEnv.getServiceCreds('Twilio-ed');
var accountSID = twilioService.accountSID;
var authToken = twilioService.authToken;
var client = require('twilio')(accountSID,authToken);
/*****TWILIO******/


/*****CLOUDANT******/
var cloudant = appEnv.getServiceCreds('cloudant-for-openwhisk');
var cloudantUsername = cloudant.username;
var cloudantPassword = cloudant.password;
var cloudantDatabase = 'twilio_triggers';
var nano = require('nano')(cloudant.url);
nano.db.create(cloudantDatabase);
var db = nano.db.use(cloudantDatabase);
/*****CLOUDANT******/

var retry = require('retry');
var operation = retry.operation({
	retries: 5,
	factor: 3,
	minTimeout: 1 * 1000,
	maxTimeout: 60 * 1000
});


var feeds={};

app.post('/createFeed', isAuthenticated,function(req,res) {
	var method = 'POST/ createFeed';
	var args = typeof req.body === 'object' ? req.body : JSON.parse(req.body);

	if ((!args.serviceSID)&&(!args.numberSID)) {
		return sendError(method, 400, "Missing parameters: required serviceSID/ numberSID parameter is missing", res);
	}

	if (!args.trigger) {
		return sendError(method, 400, "Missing parameters: required trigger parameter is missing", res);
	}

	if (!args.namespace) {
		return sendError(method, 400, "Missing parameters: required namespace parameter is missing", res);
	}

	if (!args.apikey) {
		return sendError(method, 400, "Missing parameters: required api key parameter is missing", res);
	}

	handleTriggerCreation(args, function(response) {
		if (response == "messagingService") {
			sendResponse(method, 200, 'Trigger on MessagingServiceSid created correctly.',res);
		}else { 
			if (response == "numberSID") {
				sendResponse(method, 200, 'Trigger on numberSID created correctly.',res);
			} else {
				if (response == "numberSIDnotValid") {
					sendError(method, 404, 'Trigger cannot created! NumberSID not available in twilio account!',res);
				} else {
					sendResponse(method, 500, 'Trigger failed to create. Missing parameters, e.g. numberSID or messagingServiceSID.',res);
				}
			}	
		}
	});


});

function handleTriggerCreation(newTrigger, _callback) {
	var messagingService = newTrigger.serviceSID;
	var numberSID = newTrigger.numberSID;
	var trigger = newTrigger.trigger;
	var namespace = newTrigger.namespace;
	var apikey = newTrigger.apikey;

	if (messagingService) {

		//newTrigger.apikey[1] = crypto.encrypt(newTrigger.apikey[1]);
		operation.attempt((currentAttempt) => {
			db.insert(newTrigger, trigger, (err) => {
				if (operation.retry(err)) {
					console.log(err);
					console.log("trigger can not be inserted into DB, currentAttempt: ", currentAttempt, "out of :");
					return;
				}
				console.log("inserted successfully");
				feeds[trigger] = {messagingService:messagingService, namespace:namespace, trigger:trigger, apikey:apikey};
				_callback("messagingService");
			});
		});
	} else {
		if (numberSID) { // if parameter numberSID is given
			numberSIDLookUp(numberSID, function(number) { //check in twilio if numberSID exists
				if ((number)&&(numberSID == number.sid)) {

					//newTrigger.apikey[1] = crypto.encrypt(newTrigger.apikey[1]);
					operation.attempt((currentAttempt) => {
						db.insert(newTrigger, trigger, (err) => {
							if (operation.retry(err)) {
								console.log("trigger can not be inserted into DB, currentAttempt: ", currentAttempt, "out of :");
								return;
							}
							console.log("inserted successfully");
							feeds[trigger] = {numberSID:numberSID, phoneNumber:number.phone_number, namespace:namespace, trigger:trigger, apikey:apikey};
							_callback("numberSID");
						});
					});
				} else {
					_callback("numberSIDnotValid");
				}
			});
		}
		else {
			_callback("Fail");
		}
	}
};

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

	var deleted = handleTriggerDeletion(id);
	if (deleted)
		res.status(200).json({
			ok: 'trigger ' + id + ' successfully deleted'
		});
	else
		res.status(404).json({
			error: 'trigger ' + id + ' not found'
		});



});

function handleTriggerDeletion(id) {
	var method = 'deleteTrigger';
	if (feeds[id]) {

		delete feeds[id];

		console.log('trigger', id, 'successfully deleted');

		db.get(id, (err, body) => {
			if (!err) {
				db.destroy(body._id, body._rev, (err) => {
					if (err) {
						console.error(err);
					}
				});
			} else {
				console.error(method, 'there was an error while deleting', id, 'from database');
			}
		});
		return true;
	} else {
		console.log('trigger', id, 'could not be found');
		return false;
	}
}

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

function resetSystem() {
	var method = 'resetSystem';
	// logger.info(tid, method, 'resetting system from last state');
	console.log(method, 'resetting system from last state');
	db.list({
		include_docs: true
	}, (err, body) => {
		if (!err) {
			body.rows.forEach((trigger) => {
				//trigger.doc.pass = crypto.decrypt(trigger.doc.pass);
				handleTriggerCreation(trigger.doc, (error, result) => {
					if (error) {
						console.warn(error);
						console.error(trigger.doc.triggerName, "can not be triggered");
					}
				});
			});
		} else {
			console.log(method, 'could not get latest state from database');
			// logger.error(tid, method, 'could not get latest state from database');
		}
	});
}


//------------------------------- MESSAGE HUB POLLING SERVER
app.listen(appEnv.port, '0.0.0.0', function() {
	var method = 'StartUp';
	logger.info("OK",method, 'Server listen on port '+appEnv.port);

	resetSystem();
});
