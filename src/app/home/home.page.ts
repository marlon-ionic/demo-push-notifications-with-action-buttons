import { CommonModule } from '@angular/common';
import { Component, NgZone, OnInit } from '@angular/core';
import { Clipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';
import { LocalNotificationSchema, LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { ActionPerformed as LocalActionPerformed } from '@capacitor/local-notifications';
import { ActionPerformed, PushNotifications, PushNotificationSchema, Token } from '@capacitor/push-notifications';
import { Share } from '@capacitor/share';
import { AlertButton, AlertController, IonicModule, ToastController, ToastOptions } from '@ionic/angular';

const NOTIFICATIONS_KEY = 'notifications';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class HomePage implements OnInit {
  isNativePlatform = Capacitor.isNativePlatform();
  pushToken?: string;
  canShare?: boolean;
  notifications: NotifcationListItem[] = [];
  constructor(private alertController: AlertController, private toastController: ToastController, private zone: NgZone) {}

  async ngOnInit(): Promise<void> {
    if(this.isNativePlatform) {
      await this.initNotifications();
      await this.checkPermissions();
      await this.initPushListeners();
    }
    const { value } = await Share.canShare();
    this.canShare = value;
  }

  async initNotifications() {
    this.notifications = (await this.get(NOTIFICATIONS_KEY) || []);
  }

  async clearNotifications () {
    console.log('clearNotifications');
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
    this.notifications = [];
    console.log('clearNotifications -- done');
  }

  async get<T>(key: string): Promise<T|null> {
    const value = localStorage.getItem(key);
    if(value === null) {
      return null;
    }
    try {
      const result = JSON.parse(value!) as T;
      return result;
    } catch (e) {
      await this.toast({
        header: `Cannot get ${key}`,
        message: 'JSON.parse failed',
        color: 'danger',
        duration: 3000
      });
      return null;
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      const str = JSON.stringify(value);
      localStorage.setItem(key, str);
    } catch (e: any) {
      await this.toast({
        header: `Cannot set ${key}`,
        message: e.message || `${e}`,
        color: 'danger',
        duration: 3000
      });
    }
  }

  async confirmClear() {
    await this.actionPrompt('Confirm Notification Purge', undefined, [
      {
        text: 'Cancel',
        role: 'cancel'
      }, {
        role: 'destructive',
        text: 'Purge',
        handler: () => this.clearNotifications()
      }
    ]);
  }

  async share(value: string) {
    await Share.share({
      'title': 'Push Token from Demo App',
      text: value
    });

  }

  async copyToClipboard(value: string) {
    if(this.canShare) {
      await this.share(value);
      return;
    }
    await Clipboard.write({
      string: value
    });

    await this.toast({
      duration: 2000,
      icon: 'checkmark-circle-outline',
      position: 'bottom',
      message: 'Copied to clipboard!'
    });
  }

  async toast(opts: ToastOptions) {
    const toast = await this.toastController.create(opts);
    await toast.present();
  }

  async actionPrompt(header: string, message?: string, actions?: (string|AlertButton)[], subHeader?: string) {
    const buttons = actions || ['OK'];
    const alert = await this.alertController.create({
      mode: 'ios',
      header,
      subHeader,
      message,
      buttons
    });
    await alert.present();
  }


  private async checkPermissions(): Promise<void> {
    try {
      const permissionStatus = await PushNotifications.requestPermissions();
      if(permissionStatus.receive === 'granted') {
        await PushNotifications.register();
      } else if(permissionStatus.receive == 'denied') {
        await this.actionPrompt(
          'Notification Permissions Denied',
          'Please check your device settings, close the app, and try again!');
      } else {
        console.warn('permissionStatus', permissionStatus);

      }
    } catch(e) {
      console.error('checkPermissions:error', e);
    }
  }

  private async initPushListeners() {

    PushNotifications.addListener('registration', (token: Token) => {
      this.zone.run(() => {
        console.log('token', token.value);
        this.pushToken = token.value;
      });

      // alert('Push registration success, token: ' + token.value);
    });

    LocalNotifications.addListener('localNotificationActionPerformed', (notification: LocalActionPerformed) => {
      this.zone.run(async () => {
        console.log('localNotificationActionPerformed', notification);
        const item: NotifcationListItem = {
          type: 'local',
          actionId: notification.actionId,
          notificationDate: new Date(),
          title: notification.notification.title,
          body: notification.notification.body
        };
        this.notifications = [...this.notifications, item];
        await this.set(NOTIFICATIONS_KEY, this.notifications);
      });
    });

    LocalNotifications.addListener('localNotificationReceived', (notification: LocalNotificationSchema) => {
      this.zone.run(async () => {
        const item: NotifcationListItem = {
          type: 'local',
          notificationDate: new Date(),
          title: notification.title,
          body: notification.body
        };
        this.notifications = [...this.notifications, item];
        await this.set(NOTIFICATIONS_KEY, this.notifications);
        console.log('localNotificationReceived', notification);

      });
    });



    PushNotifications.addListener('registrationError', async (error: any) => {
      console.warn('registrationError', error);
      alert('Error on registration: ' + JSON.stringify(error));
      await this.toast({
        header: 'registrationError',
        color: 'danger',
        duration: 6000
      })
    });

    PushNotifications.addListener(
      'pushNotificationReceived',
      async (notification: PushNotificationSchema) => {
        this.zone.run(async() => {

          const plaform = Capacitor.getPlatform();
          console.log('plaform', plaform);
          if(plaform === 'android' && notification.data) {
            const opts: ScheduleOptions = {
              notifications: [
                {
                  id: this.notifications.length,
                  title: notification.data.title,
                  body: notification.data.body,
                  actionTypeId: notification.data.category
                }
              ]
            }
            const result = await LocalNotifications.schedule(opts);
            console.log('LocalNotifications: result', result);


          }

          const item: NotifcationListItem = {
            type: 'remote',
            notificationDate: new Date(),
            title: notification.title,
            body: notification.body
          };
          this.notifications = [...this.notifications, item];
          await this.set(NOTIFICATIONS_KEY, this.notifications);
          console.log('pushNotificationReceived', notification, this.notifications, this.notifications.length);
        });
        // alert('Push received: ' + JSON.stringify(notification));

      },
    );

    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      async (notification: ActionPerformed) => {
        console.log('pushNotificationActionPerformed', notification);
        // alert('Push action performed: ' + JSON.stringify(notification));
        const item: NotifcationListItem = {
          type: 'remote',
          actionId: notification.actionId,
          notificationDate: new Date(),
          title: notification.notification.title,
          body: notification.notification.body
        };
        this.notifications = [...this.notifications, item];
        await this.set(NOTIFICATIONS_KEY, this.notifications);
      },
    );
  }
}


interface NotifcationListItem {
  notificationDate: Date;
  type: 'local' | 'remote';
  actionId?: string;
  title?: string;
  body?: string;
}
