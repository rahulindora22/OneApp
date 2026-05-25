import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

function generateDeviceId() {
  const deviceString = Platform.OS + Platform.Version + Math.random().toString(36);
  let hash = 0;
  for (let i = 0; i < deviceString.length; i++) {
    const char = deviceString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString();
}

export async function getOrCreateDeviceId() {
  let deviceId = await AsyncStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = generateDeviceId();
    await AsyncStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}

export function getDeviceName() {
  if (Platform.OS === 'android') return 'Android';
  if (Platform.OS === 'ios') return 'iPhone';
  return 'Other';
}
