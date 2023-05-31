import UIKit
import Capacitor
import Firebase
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        FirebaseApp.configure()
        return true
    }


    // This method must be added for iOS to handle the silent notificiation
    // Please refer to https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/pushing_background_updates_to_your_app
func application(_ application: UIApplication,
                     didReceiveRemoteNotification userInfo: [AnyHashable : Any],
                     fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {

        // Perform background operation
        // Request user's permission for local notifications. Adjust this as needed
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                // Define the notification category
                var categoryIdentifier = "MEETING_INVITATION"

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

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
      Messaging.messaging().apnsToken = deviceToken
      Messaging.messaging().token(completion: { (token, error) in
      if let error = error {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
      } else if let token = token {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: token)
      }
      })
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
      NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

}
