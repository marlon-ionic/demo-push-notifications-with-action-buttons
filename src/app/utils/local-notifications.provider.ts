import { ExceptionCode } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';


// This function makes use of functionality of the LocalNotifications plugin to regsiter actions that can be used for iOS to support making Action Buttons available
export function registeriOSNotificationActions() {
  return () => {
    return new Promise<void>((resolve, reject) => {
      LocalNotifications.registerActionTypes({
          types: [
            {
              id: 'MEETING_INVITATION',
              actions: [
                {
                  id: 'ACCEPT_ACTION',
                  title: 'Accept',
                },
                {
                  id: 'DECLINE_ACTION',
                  title: 'Decline'
                }
              ],
            },
          ],
        }).finally(() => resolve());
    });
  }
};
