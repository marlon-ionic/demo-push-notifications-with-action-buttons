# Firebase Admin SDK

A Private Key JSON file is required. Please see the [Firebase Docs](https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments) for details.

Once you have your Private Key JSON, update the following reference in `index.js`:

```typescript
const serviceAccount = require("./firebase-adminsdk.json");
```

If you're running the app, you will be able to get the push token from the homepage. If your device is connected to a computer for development, you'll also be able to see the token printed to the `console`. You add any tokens as strings to the array `registrationTokens`.

Then from the root on your project, you can run: `node ./fcm-node`
