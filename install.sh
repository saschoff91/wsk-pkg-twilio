#!/bin/bash

#/
# Copyright 2015-2016 IBM Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#/

# To run this command
# WHISKPROPS_FILE="$OPENWHISK_HOME/whisk.properties"
# WSK_CLI=$OPENWHISK_HOME/bin/wsk
# AUTH_KEY=$(cat $OPENWHISK_HOME/config/keys/auth.whisk.system)
# EDGE_HOST=$(grep '^edge.host=' $WHISKPROPS_FILE | cut -d'=' -f2)

set -e
set -x

if [ $# -eq 0 ]
then
    echo "Usage: ./install.sh $APIHOST $AUTH $WSK_CLI"
fi

APIHOST="$1"
AUTH="$2"
WSK_CLI="$3"

PACKAGE_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo Installing an Twilio Openwhisk Package \

$WSK_CLI --apihost $APIHOST package update --auth $AUTH --shared yes  twilio \
    -a description "Twilio Openwhisk Package" \
    -a parameters '[{"name":"twilioBase","required":true,"bindTime":true,"description":"Twilio api base"},{"name":"accountSID","required":true,"bindTime":true,"type":"password","description":"Twilio user account SID"},{"name":"authToken","required":true,"bindTime":true,"type":"password","description":"Twilio user account token "}]'

$WSK_CLI --apihost $APIHOST action update --auth $AUTH --shared yes twilio/sms $PACKAGE_HOME/actions/sendSMS.js \
-a description 'Send SMS to receiver' \
    -a parameters '[{"name":"twilioBase","required":true,"bindTime":true,"description":"Twilio api base"},{"name":"accountSID","required":true,"bindTime":true,"type":"password","description":"Twilio user account SID"},{"name":"authToken","required":true,"bindTime":true,"type":"password","description":"Twilio user account token "},{"name":"to","required":true,"bindTime":false,"description":"Number of message receiver. If account is trial, verifiy first"},{"name":"from","required":true,"bindTime":false,"description":"Twilio number from account."},{"name":"message","required":true,"bindTime":false,"description":"Content of the sms message."}]' \
    -a sampleInput '{"twilioBase":"XXXXXX","accountSID":"YYYYYY","authToken":"WWWWWW","to":"UUUUUU","from":"ZZZZZZ","url":"Lorem ipsum dolor sit amet"}' \
-a sampleOutput '{"result":{"account_sid":"YYYYYY","api_version":"2010-04-01","body":"Sent from your Twilio trial account - Lorem ipsum dolor sit amet","date_created":"Mon, 18 Jul 2016 09:14:09 +0000","date_sent":null,"date_updated":"Mon, 18 Jul 2016 09:14:09 +0000","direction":"outbound-api","error_code":null,"error_message":null,"from":"ZZZZZZ","messaging_service_sid":null,"num_media":"0","num_segments":"1","price":null,"price_unit":"USD","sid":"SM50780d35aad64d99996ff2ff46c5fc52","status":"queued","subresource_uris":{"media":"/2010-04-01/Accounts/YYYYYY/Messages/SM50780d35aad64d99996ff2ff46c5fc52/Media.json"},"to":"YYYYYY","uri":"/2010-04-01/Accounts/YYYYYY/Messages/SM50780d35aad64d99996ff2ff46c5fc52.json"},"status":"success","success":true}'

$WSK_CLI --apihost $APIHOST action update --auth $AUTH --shared yes twilio/call $PACKAGE_HOME/actions/call.js \
-a description 'Perfom call to a receiver' \
    -a parameters '[{"name":"twilioBase","required":true,"bindTime":true,"description":"Twilio api base"},{"name":"accountSID","required":true,"bindTime":true,"type":"password","description":"Twilio user account SID"},{"name":"authToken","required":true,"bindTime":true,"type":"password","description":"Twilio user account token "},{"name":"to","required":true,"bindTime":false,"description":"Number of message receiver. If account is trial, verifiy first"},{"name":"from","required":true,"bindTime":false,"description":"Twilio number from account."},{"name":"url","required":true,"bindTime":false,"description":"URL to voice xml file, e.g. https://demo.twilio.com/welcome/voice/"}]' \
    -a sampleInput '{"twilioBase":"XXXXXX","accountSID":"YYYYYY","authToken":"WWWWWW","to":"UUUUUU","from":"ZZZZZZ","url":"https://demo.twilio.com/welcome/voice/"}' \
-a sampleOutput '{"result":{"account_sid":"YYYYYY","annotation":null,"answered_by":null,"api_version":"2010-04-01","caller_name":null,"date_created":null,"date_updated":null,"direction":"outbound-api","duration":null,"end_time":null,"forwarded_from":null,"from":"ZZZZZZ","from_formatted":"ZZZZZZ","group_sid":null,"parent_call_sid":null,"phone_number_sid":null,"price":null,"price_unit":"USD","sid":"CA36af16e5349f38edc973bbbf47e05f93","start_time":null,"status":"queued","subresource_uris":{"notifications":"/2010-04-01/Accounts/YYYYYY/Calls/CA36af16e5349f38edc973bbbf47e05f93/Notifications.json","recordings":"/2010-04-01/Accounts/YYYYYY/Calls/CA36af16e5349f38edc973bbbf47e05f93/Recordings.json"},"to":"UUUUUU","to_formatted":"UUUUUU","uri":"/2010-04-01/Accounts/YYYYYY/Calls/CA36af16e5349f38edc973bbbf47e05f93.json"},"status":"success","success":true}'

$WSK_CLI --apihost $APIHOST action update --auth $AUTH --shared yes sendgrid/twilioFeed $PACKAGE_HOME/feeds/twilioFeed.js \
-a description 'Create feed action for trigger lifecycle events' \

