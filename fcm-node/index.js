/* eslint-env es6 */

// This example using the Firebase Admin SDK to send messages (https://firebase.google.com/docs/reference/admin/node).
// To complete setup for this, you'll need a Private Key from your Firebase account (https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments).
// Please refer to Firebase docs for a reference to the proper structure:
// REST API: https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages
// Admin SDK (Node): https://firebase.google.com/docs/reference/admin/node/firebase-admin.messaging.basemessage

const { getMessaging } = require('firebase-admin/messaging');



var admin = require("firebase-admin");

//Replace this with a reference to your private key (https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments)
const serviceAccount = require("./firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// These registration tokens come from the client FCM SDKs.
const registrationTokens = [
//Enter your push tokens here!

];


// This data object is where you can define your notification details
// In this example, category is used to indentify the iOS Category, or the ActionTypeId via the LocalNotifications plugin for Android
// See https://firebase.google.com/docs/reference/admin/node/firebase-admin.messaging.multicastmessage
const message = {
  data: {
    body :"This is an FCM notification message!",
    title :"FCM Message",
    category: "MEETING_INVITATION",
  },
  apns: {
    payload: {
      aps: {
        contentAvailable : true
      }
    }
  },
  tokens: registrationTokens,
};




/**
 * If you want to explore an option of sending iOS-only push notifications, which will handle the Action buttons,
 * You can send a message with a structure like this. Please note that for Android,
 * this sort of format will be treated as traditional push notifcation with no Action buttons.
 * */

// const message = {
//   notification:{
//     body :"This is an FCM notification message!",
//     title :"FCM Message"
//   },
//   apns: {
//     payload: {
//       aps: {
//         category: "MEETING_INVITATION"
//       }
//     }
//   },
//   tokens: registrationTokens,
// };

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
