/* eslint-env es6 */



const { getMessaging } = require('firebase-admin/messaging');



var admin = require("firebase-admin");

var serviceAccount = require("./firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// These registration tokens come from the client FCM SDKs.
const registrationTokens = [


];

const message = {
  data: {score: '850', time: '2:45'},
  notification:{
    body :"This is an FCM notification message!",
    title :"FCM Message"
  },
  apns: {
    payload: {
      aps: {
        category: "MEETING_INVITATION"
      }
    }
  },
  tokens: registrationTokens,
};

// https://firebase.google.com/docs/reference/admin/node/firebase-admin.messaging.messaging.md#messagingsendeachformulticast
getMessaging().sendEachForMulticast(message)
  .then((response) => {
    console.log('sendEachForMulticast', response);
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(registrationTokens[idx]);
        }
      });
      console.log('List of tokens that caused failures: ' + failedTokens);
    }
  }).catch((e) => console.error('messaging', e));
