import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  token: 'laundry_token',
  user:  'laundry_user',
};

interface User {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export const Storage = {
  async setToken(token: string) {
    await AsyncStorage.setItem(KEYS.token, token);
  },
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.token);
  },
  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.token);
  },
  async setUser(user: User) {
    await AsyncStorage.setItem(KEYS.user, JSON.stringify(user));
  },
  async getUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem(KEYS.user);
    return raw ? JSON.parse(raw) : null;
  },
  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.user);
  },
  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([KEYS.token, KEYS.user]);
  },
};