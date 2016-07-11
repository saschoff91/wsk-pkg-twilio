#wsk-pkg-twilio service package
[![Build Status](https://travis-ci.org/saschoff91/wsk-pkg-messagehub.svg?branch=master)](https://travis-ci.org/saschoff91/wsk-pkg-messagehub)

This package actions use the restful api from twilio service. The feed is implemented with the twilio node library.

![Twilio overview](https://github.com/saschoff91/wsk-pkg-twilio/blob/master/twilio%20overview.jpg?raw=true "Twilio Package Workflow")

#Prepare environment
Perfom following steps to prepare the environment for using the wsk-pkg.twilio.

1. Create a [twilio account](https://www.twilio.com) to get accountSid and authToken from [dashboard](https://www.twilio.com/console).

2. Add a new twilio number to you account [here](https://www.twilio.com/console/phone-numbers/dashboard) with voice and mail. In a trial version of an account, one is for free. For further processing, the Sid is important.

3. If you have a trial account, verify your own number [here](https://www.twilio.com/console/phone-numbers/verified) for message and call receiver.

4. Enable your twilio number for sending SMS/calls in special regions, e.g. germany with prefix +49, [here](https://www.twilio.com/user/account/settings/international/sms).

5. Bind following parameters to the wsk package twilio:

- base, this is the restful api base from twilio, default: api.twilio.com/2010-04-01

- account, this is the accountSid from your personal dashboard
 
- token, auth token from your dashboard

- appURL, url of the bluemix app which holds the triggers 


#Action call
To peform a telefon call, invoke whisk action with following command:

```
wsk -v action invoke --blocking --result twilio/call  -p to '<yourMobileNumber>' -p from '<twilioNumber>' -p url 'https://demo.twilio.com/welcome/voice/'
```

* *yourMobileNumber* must be a verified number in twilio, e.g. +49172XXXX
* *twilioNumber* is a bought number from twilio, which has the functionality to make calls , e.g. +49152XXXX
* *url* specify the xml file of the voice message. To make calls to different receivers, with an own voice message, you must upgrade your account, e.g. https://demo.twilio.com/welcome/voice

For further information from twilio about making calls with restful api, hava a look [here](https://www.twilio.com/docs/api/rest/making-calls)

#Action send SMS
```
wsk -v action invoke --blocking --result twilio/sendSMS -p to '<yourMobileNumber>' -p from '<twilioNumber>' -p message '<personalMessageAsString>' 
```
The details about the parameters, are the same like performing calls, except the *message* parameter. 

Further details about sending sms, look at [this](https://www.twilio.com/docs/api/rest/sending-messages) documentation.

#Create Trigger 
Before creating the trigger, an extra app must deployed. Also bind the bluemix twilio service to it. 
```
/feeds/TriggerProvider/ cf push

```

If you want to create a trigger, it is possible to do it in two ways:
```
wsk -v trigger create twilioSMS -p numberSID '<numberSid>' --feed twilio/twilioFeed

```
When the numberSID is given as parameter, the binding of this trigger to a specific twilio number is done.
Everytime when a new message arrives to these number, the trigger get fired. 

```
wsk -v trigger create twilioSMS -p serviceSID '<serviceSid>' --feed twilio/twilioFeed
```
The serviceSID compares many twilio numbers to a messaging service with copilot. These messaging service can created in the [Programmable SMS Dashboard](https://www.twilio.com/console/sms/dashboard). When you create a trigger like this, you have to ensure, that the messaging service sid is valid. The api doesnt provide a mechanism to proof that.


**IMPORTANT** In both cases, you must enable and configure the webhook request in your twilio account.
* bind to number: Configure [here](https://www.twilio.com/console/phone-numbers/dashboard) the phone number webhook
* bind to messaging service: Configure [here](https://www.twilio.com/console/sms/dashboard) for each messaging service.

The Url of each webhook action is *http://twiliofeed.mybluemix.net/messageincoming*.

#Further Work
* Replace the restful api communication of the two actions with the twilio node library
* Fire a trigger, if an inboud call is coming, doesnt work. Any incoming events are displayed in the [Programmable Voice Logs](https://www.twilio.com/console/voice/logs/calls), EXCEPT calls ! (error? bug?)
* implement test cases

# Contributing
Please refer to [CONTRIBUTING.md](CONTRIBUTING.md)

# License
Copyright 2015-2016 IBM Corporation

Licensed under the [Apache License, Version 2.0 (the "License")](http://www.apache.org/licenses/LICENSE-2.0.html).

Unless required by applicable law or agreed to in writing, software distributed under the license is distributed on an "as is" basis, without warranties or conditions of any kind, either express or implied. See the license for the specific language governing permissions and limitations under the license.

