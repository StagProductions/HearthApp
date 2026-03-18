import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('hearth-default', {
      name: 'Hearth notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C4622D',
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Save token to user's Firestore doc so Cloud Functions can send targeted pushes
  if (auth.currentUser) {
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { pushToken: token });
  }

  return token;
}

// Schedule a local bill reminder
export async function scheduleBillReminder(billName, dueDate, amount) {
  const triggerDate = new Date(dueDate);
  triggerDate.setDate(triggerDate.getDate() - 2); // 2 days before
  triggerDate.setHours(9, 0, 0, 0); // 9am

  if (triggerDate <= new Date()) return; // already past

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💳 Bill due soon',
      body: `${billName} — £${parseFloat(amount).toFixed(2)} due in 2 days`,
      data: { type: 'bill', billName },
    },
    trigger: triggerDate,
  });
}

// Cancel all scheduled notifications
export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
