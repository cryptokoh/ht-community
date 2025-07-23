import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

class NotificationServiceClass {
  private isInitialized = false;

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#8B5A83',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async getPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id-here', // TODO: Replace with actual project ID
      });
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  setupNotificationHandlers(): void {
    if (this.isInitialized) return;

    // Handle notifications received while app is foregrounded
    Notifications.addNotificationReceivedListener(this.handleNotificationReceived);

    // Handle user tapping on notifications  
    Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse);

    this.isInitialized = true;
  }

  private handleNotificationReceived = (notification: Notifications.Notification) => {
    console.log('Notification received:', notification);
    // Handle foreground notification display
  };

  private handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    console.log('Notification response:', response);
    // Handle user tapping on notification
    // Navigate to appropriate screen based on notification data
  };

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    triggerDate?: Date
  ): Promise<string | null> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: triggerDate ? { date: triggerDate } : null,
      });
      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  cleanup(): void {
    if (this.isInitialized) {
      Notifications.removeAllNotificationListeners();
      this.isInitialized = false;
    }
  }
}

export const NotificationService = new NotificationServiceClass();