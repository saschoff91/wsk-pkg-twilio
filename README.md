Openwhisk Twilio Package
============================

This repository includes actions and feeds for [IBM Bluemix](http://www.ibm.com/cloud-computing/bluemix/) service Twilio. 
The whole communication is based on the [Twilio REST API](https://www.twilio.com/docs/api/rest).

![Twilio overview](https://github.com/saschoff91/wsk-pkg-twilio/blob/master/twilio%20overview.jpg?raw=true "Twilio Package Workflow")

## Getting Started:
Before using this package, following preparations must be done:
  1. Create a [twilio](https://www.twilio.com) account to get accountSid and authToken from [dashboard](https://www.twilio.com/console).
  2. Add a new twilio number to you account [here](https://www.twilio.com/console/phone-numbers/dashboard) with voice and sms functionality. If you use a trila account, one twilio number is for free. For further processing, the accountSID and authToken is important.
  3. If you have a trial account, verify your own number [here](https://www.twilio.com/console/phone-numbers/verified) for message and call receiver.
  4. Enable your twilio number for sending SMS/calls in special regions, e.g. germany with prefix +49, [here](https://www.twilio.com/user/account/settings/international/sms).
  1. Create a Twilio instance in Bluemix and fullfill your credentials from twilio.com account.
  2. Create a node application, which acts as a trigger provider.
  3. Create a cloudant instance, which stores the trigger.
  4. Bind the twilio and cloudant instance to node application, via application dashboard.
  5. Modify /feeds/TriggerProvider/app.js file and fill in your message hub instance name

``` javascript
var twilioService = appEnv.getServiceCreds('Twilio-instance');
...
var cloudant = appEnv.getServiceCreds('Cloudant-instance');
``` 
  5. Deploy the created node application with file from /feeds/TriggerProvider/ with 
``` 
/<PATH_TO_NODE_FILES>$ cf push
```
  ***Note:*** If you cloned this repository and deploy the application with /feeds/TriggerProvider/, change the application name in manifest.yml before. 

| Entity | Type | Parameters | Description |
| --- | --- | --- | --- |
| `/whisk.system/twilio` | package | twilioBase, accountSID, authToken, appUrl | Twilio Package |
| `/whisk.system/twilio/sms` | action | see action [details](https://github.com/saschoff91/wsk-pkg-twilio/blob/master/actions/sendSMS.js) | send sms to a receiver |
| `/whisk.system/twilio/call` | action | see action [details](https://github.com/saschoff91/wsk-pkg-twilio/blob/master/actions/call.js) | perform voice call |


## Actions:
The parameters for the package /whisk.system/messagehub, like twilioBase, accountSID, authToken and appUrl, are required for all following actions and feeds. So they are not listed seperatly. Parameters for each action are listed in the source code of each action file.

To bind all required parameters to the package perform following command.
```bash
wsk package update twilio -p twilioBase '<twilioBase>' -p accountSID '<accountSID>' -p authToken '<authToken>' -p appUrl '<appUrl>'
```

#### Send SMS 
`/whisk.system/iot/sms` create a short message service and send it to a receiver

| **Parameter** | **Type** | **Required** | **Description** | **Default** | **Example** |
| ------------- | ---- | -------- | ------------ | ------- |------- |
| to | *string* | yes |  Number from receiver | - | "XXXXX" |
| message | *string* | yes |  Message text content  | - | "ZZZZZ" |
| from | *string* | no |  Twilio number from sender | - | "YYYYY" |
| messagingServiceSid | *string* | no |  Messaging Service Id from twilio service | - | "WWWWW" |

At least **from** or **messagingServiceSid** must provide to this action. If both are given, the **from** parameter will ignored.

##### Usage

```bash
wsk action invoke /whisk.system/twilio/sms -p to 'XXXXX' -p from 'YYYYY' -p message 'ZZZZZ'
```

Example of success response:
```javascript
{
    "result": {
        "account_sid": "<accountSID>",
        "api_version": "2010-04-01",
        "body": "Sent from your Twilio trial account - ZZZZZ",
        "date_created": "Thu, 21 Jul 2016 09:26:30 +0000",
        "date_sent": null,
        "date_updated": "Thu, 21 Jul 2016 09:26:30 +0000",
        "direction": "outbound-api",
        "error_code": null,
        "error_message": null,
        "from": "YYYYY",
        "messaging_service_sid": null,
        "num_media": "0",
        "num_segments": "1",
        "price": null,
        "price_unit": "USD",
        "sid": "SMf43570c074e248dc9b1c53378b91e87c",
        "status": "queued",
        "subresource_uris": {
            "media": "/2010-04-01/Accounts/<accountSID>/Messages/SMf43570c074e248dc9b1c53378b91e87c/Media.json"
        },
        "to": "XXXXX",
        "uri": "/2010-04-01/Accounts/<accountSID>/Messages/SMf43570c074e248dc9b1c53378b91e87c.json"
    },
    "status": "success",
    "success": true
}

```

#### Perform call
`/whisk.system/twilio/call` is an action to perform automatic calls to a receiver

| **Parameter** | **Type** | **Required** | **Description** | **Default** | **Example** |
| ------------- | ---- | -------- | ------------ | ------- |------- |
| to | *string* | yes |  Number from receiver | - | "XXXXX" |
| from | *string* | yes |  Twilio number from sender | - | "YYYYY" |
| url | *string* | yes |  Url of xml file, which produce voice | - | "https://demo.twilio.com/welcome/voice/" |

##### Usage
```bash
wsk action invoke /whisk.system/twilio /call -p to 'XXXXX' -p from 'YYYYY' -p url 'https://demo.twilio.com/welcome/voice/' 
```

Example of success response:
```javascript
{
    "result": {
        "account_sid": "<accountSID>",
        "annotation": null,
        "answered_by": null,
        "api_version": "2010-04-01",
        "caller_name": null,
        "date_created": null,
        "date_updated": null,
        "direction": "outbound-api",
        "duration": null,
        "end_time": null,
        "forwarded_from": null,
        "from": "YYYYY",
        "from_formatted": "YYYYY",
        "group_sid": null,
        "parent_call_sid": null,
        "phone_number_sid": null,
        "price": null,
        "price_unit": "USD",
        "sid": "CAe1b5b6b4505a0dd4f7e19418eb4aefcc",
        "start_time": null,
        "status": "queued",
        "subresource_uris": {
            "notifications": "/2010-04-01/Accounts/<accountSID>/Calls/CAe1b5b6b4505a0dd4f7e19418eb4aefcc/Notifications.json",
            "recordings": "/2010-04-01/Accounts/<accountSID>/Calls/CAe1b5b6b4505a0dd4f7e19418eb4aefcc/Recordings.json"
        },
        "to": "XXXXX",
        "to_formatted": "XXXXX",
        "uri": "/2010-04-01/Accounts/<accountSID>/Calls/CAe1b5b6b4505a0dd4f7e19418eb4aefcc.json"
    },
    "status": "success",
    "success": true
}
```

## Feed
#### Create trigger
`/whisk.system/twilio/twilioFeed` is an action, which handle the trigger lifecycle (create, delete) for Twilio.
It is possible to listen on an incoming sms/call of a twilio number or a messaging service.

Independent from the trigger source, twilio number or messaging service, you must configure the callback webhook request in your twilio account manually. The API doesnt provide any functionality to do it.

- Messaging Service

 Move to: Programmable SMS -> <serviceName> -> configure -> Inbound Settings and fullfill the setting **REQUEST URL** 
```text
 http://<TriggerProvider>.mybluemix.net/messageincoming
```
 
- Twilio Number

Move to: Phone Numbers -> <twilioNumber> -> Manage Numbers -> Fullfill webhook request url 
```text
 http://<TriggerProvider>.mybluemix.net/messageincoming
```
Now the twilio account is able to perform a webhook request to your node application to fire a whisk trigger with sms/call details.

| **Parameter** | **Type** | **Required** | **Description** | **Default** | **Example** |
| ------------- | ---- | -------- | ------------ | ------- |------- |
| numberSID | *string* | yes |  Twilio number id | - | "XXXXX" |
| serviceSID | *integer* | no |  Messaging Service id, alternative to numberSID | - | "YYYYY" |
| feed | *string* | yes |  Feed action | - | "messagehub/twilioFeed" |

##### Usage
```bash
wsk trigger create <triggerName> -p topic 'numberSID'  --feed twilio/twilioFeed
```

Example of success response:
```javascript
{
  "name": "<triggerName>",
  "subject": "saschoff@de.ibm.com",
  "activationId": "f583c82f839c4894aea5c0d7ff3808a8",
  "publish": false,
  "annotations": [],
  "version": "0.0.5",
  "response": {
    "result": {
      "result": "done creation"
    },
    "success": true,
    "status": "success"
  },
  "end": 1469095378703,
  "logs": [],
  "start": 1469095378419,
  "namespace": "<namespace>"
}

```

# Deploying Locally
This package contains an install script that will create a package and add the actions into it :
```shell
git clone https://github.com/saschoff91/wsk-pkg-twilio
cd wsk-pkg-twilio
./install.sh <apihost> <authkey> <pathtowskcli>
```

# Further Work
* Replace the restful api communication of the two actions with the twilio node library
* Fire a trigger, if an inboud call is coming, doesnt work. Any incoming events are displayed in the [Programmable Voice Logs](https://www.twilio.com/console/voice/logs/calls), EXCEPT calls ! (error? bug?)
* implement test cases with real test account
* implementation is based on a trial account with limited functionality

# Contributing
Please refer to [CONTRIBUTING.md](CONTRIBUTING.md)

# License
Copyright 2015-2016 IBM Corporation

Licensed under the [Apache License, Version 2.0 (the "License")](http://www.apache.org/licenses/LICENSE-2.0.html).

Unless required by applicable law or agreed to in writing, software distributed under the license is distributed on an "as is" basis, without warranties or conditions of any kind, either express or implied. See the license for the specific language governing permissions and limitations under the license.
