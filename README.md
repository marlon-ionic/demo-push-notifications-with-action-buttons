# Push Notifications with Action Buttons

This project demonstrates an approach to allowing for Push Notiifcations that support Action Buttons on both iOS & Android. The backend system used for the push notifications in this case Google Firebase Cloud Messaging (FCM), but any push service or API that allows you to define a custom JSON payload structure should be fine.

It's assumed that you have a solid understanding of setting up push notifications using FCM. If not, refer to our docs on [Using Push Notificaitons with Firebase](https://capacitorjs.com/docs/guides/push-notifications-firebase) as a starting point.

## Project Overview

This project uses the approach of using [Silent Notifications](https://capacitorjs.com/docs/apis/push-notifications#silent-push-notifications--data-only-notifications) for both iOS & Android. This notification should include all of your required information (as the `data` payload). A local notifcation will then be triggered with your action buttons. The approach varies a bit by platform.

During app initialization, it's important to call `LocalNotifications.registerActionTypes()` to setup the configuration for Action Buttons. [registerActionTypes](https://capacitorjs.com/docs/apis/local-notifications#registeractiontypes) takes a `RegisterActionTypesOptions` object that includes an `id` property is key because it's the identifier used to associate the Action Buttons to the notification.

### Android

For Android, the silent notification is recieved by the [Capacitor Push Notifications Plugin](https://capacitorjs.com/docs/apis/push-notifications). The app will recieve the silent notification via the `pushNotificaionReceived` [listener](https://capacitorjs.com/docs/apis/push-notifications#addlistenerpushnotificationreceived-). From there, we use the [Capacitor Local Notifications Plugin](https://capacitorjs.com/docs/apis/local-notifications) schedule a local notification based on data received. 

### iOS

For iOS, silent notifications (for iOS docs, these may be referred to as `Background Notifications`) are NOT handled by default. Some additional configuration is required to get this setup.

In Xcode, enable the `Remote Notifications` [Background Mode](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/pushing_background_updates_to_your_app) for your app. Inn your `AppDelegate.swift`, you'll need to add a handler for the silent notification. See below for an example that will generate a local notifcaiton when a silent notification is recieved. That local notification will be handled by the Local Notifications Plugin.

```swift
func application(_ application: UIApplication,
                     didReceiveRemoteNotification userInfo: [AnyHashable : Any],
                     fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {

        // Perform background operation
        // Request user's permission for local notifications. Adjust this as needed
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                // Define the notification category
                let categoryIdentifier = "MEETING_INVITATION"

                // The category identifier can also be read from the notification
                if let category = userInfo["category"] as? String {
                   print(category)
                    categoryIdentifier = category
                }

                // You can force the app to the foreground by passing .foreground as a options
                // For all options, see: https://developer.apple.com/documentation/usernotifications/unnotificationactionoptions
                let acceptAction = UNNotificationAction(identifier: "ACCEPT_ACTION", title: "Accept", options: [.foreground])
                let declineAction = UNNotificationAction(identifier: "DECLINE_ACTION", title: "Decline", options: [])

                let category = UNNotificationCategory(identifier: categoryIdentifier, actions: [acceptAction, declineAction], intentIdentifiers: [], options: [])

                UNUserNotificationCenter.current().setNotificationCategories([category])

                // Create the notification content
                let content = UNMutableNotificationContent()
                //Set title/body for notification based on push's payload
                if let title = userInfo["title"] as? String {
                   print(title)
                    content.title =  title
                }
                if let body = userInfo["body"] as? String {
                   print(body)
                    content.body =  body
                }
                content.categoryIdentifier = categoryIdentifier

                // Create the trigger for the notification (e.g., trigger it after 5 seconds)
                let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)

                // Create the notification request
                let request = UNNotificationRequest(identifier: "MyNotification", content: content, trigger: trigger)

                // Schedule the notification
                UNUserNotificationCenter.current().add(request) { error in
                    if let error = error {
                        print("Error scheduling notification:", error.localizedDescription)
                    } else {
                        print("Notification scheduled successfully!")
                    }
                }
            } else if let error = error {
                print("Error requesting authorization for notifications:", error.localizedDescription)
            }
        }

        // Inform the system after the background operation is completed.
        completionHandler(.newData)
    }
```

### Google Firebase Cloud Messaging (FCM)

Refer to [README](fcm-node/README.md) in the `fcm-node` folder. The format of the JSON payload in FCM is very particular. Here's an example of a payload for a "Silent" notification:

```typescript
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
```

### Using a physical iOS device

To test on a physical iOS device, you'll need an active Apple Developer Account. There is a script powered by [Trapeze](https://trapeze.dev) that can help you automate the required project updates. You'll need two piece of info:

- `TEAM_ID`: Your Apple Developer Team ID
- `PACKAGE_ID`: The bundle indentifier for your app

You can then run `npx @trapezedev/configure run trapeze/update-package-and-team.yaml`
