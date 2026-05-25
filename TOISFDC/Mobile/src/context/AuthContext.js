import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUnauthorizedHandler } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['access_token', 'user_id', 'user_name']);
    setUserId(null);
    setIsLoggedIn(false);
  }, []);

  // Register logout as the global 401 handler so any stale/invalid token
  // automatically sends the user back to the login screen.
  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('access_token');
      const uid = await AsyncStorage.getItem('user_id');
      if (token && uid) {
        setUserId(uid);
        setIsLoggedIn(true);
      }
      setLoading(false);
    })();
  }, []);

  const login = (uid) => {
    setUserId(uid);
    setIsLoggedIn(true);
  };

  return (
    <AuthContext.Provider value={{ userId, isLoggedIn, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
