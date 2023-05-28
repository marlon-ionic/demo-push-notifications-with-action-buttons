/* eslint-env es6 */


// Simple utility to get an access token to call the Firebase REST API. Replace this json reference with your private key.
// https://firebase.google.com/docs/cloud-messaging/auth-server#provide-credentials-manually
// From https://firebase.google.com/docs/cloud-messaging/auth-server#use-credentials-to-mint-access-tokens

// PLEASE KEEP YOU PRIVATE KEY SECURE!
const { JWT } = require('google-auth-library');

function getAccessToken() {
  return new Promise(function(resolve, reject) {
    const key = require('./test-fcm-6da89-firebase-adminsdk-nf210-09e9d6a9ff.json');
    const jwtClient = new JWT(
      key.client_email,
      null,
      key.private_key,
      ['https://www.googleapis.com/auth/firebase.messaging'],
      null
    );
    jwtClient.authorize(function(err, tokens) {
      if (err) {
        reject(err);
        return;
      }
      console.log('token', tokens.access_token);
      resolve(tokens.access_token);
    });
  });
}

getAccessToken();
