import { CommonModule } from '@angular/common';
import { Component, NgZone, OnInit } from '@angular/core';
import { Clipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';
import { ActionPerformed, PushNotifications, PushNotificationSchema, Token } from '@capacitor/push-notifications';
import { AlertController, IonicModule, ToastController, ToastOptions } from '@ionic/angular';

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
  notifications: any[] = [];
  constructor(private alertController: AlertController, private toastController: ToastController, private zone: NgZone) {}

  async ngOnInit(): Promise<void> {
    if(this.isNativePlatform) {
      await this.initNotifications();
      await this.checkPermissions();
      await this.initPushListeners();
    }
  }

  async initNotifications() {
    this.notifications = await this.get(NOTIFICATIONS_KEY) || [];
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
    await this.confirm('Confirm Notification Purge', '', () => this.clearNotifications());
  }

  async copyToClipboard(value: string) {
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

  async confirm(header: string, message: string, action: () => Promise<void>, confirmLabel: string = 'Confirm', destructive: boolean = true, subHeader?: string) {
    const alert = await this.alertController.create({
      mode: 'ios',
      header, subHeader, message,
      buttons: [
        { role: 'cancel', text: 'Cancel'},
        {
          role: destructive ? 'destructive' : undefined,
          text: confirmLabel,
          handler: action
        }
      ]
    });
    await alert.present();
  }


  private async checkPermissions(): Promise<void> {
    try {
      const permissionStatus = await PushNotifications.requestPermissions();
      if(permissionStatus.receive === 'granted') {
        await PushNotifications.register();
      } else if(permissionStatus.receive == 'denied') {
        await this.confirm('Notification Permissions Denied',
                          'Please check your device settings, close the app, and try again!',
                          async() => { },
                          'OK' );
      } else {
        console.warn('permissionStatus', permissionStatus);

      }
    } catch(e) {
      console.error('checkPermissions:error', e);
    }
  }

  private async initPushListeners() {
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('token', token.value);
      this.pushToken = token.value;
      // alert('Push registration success, token: ' + token.value);
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
          this.notifications = [...this.notifications, notification];
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
      },
    );
  }
}
