import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import RWAScreen from '../screens/RWAScreen';
import OOHScreen from '../screens/OOHScreen';
import CSPScreen from '../screens/CSPScreen';
import DepoScreen from '../screens/DepoScreen';

import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isLoggedIn } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0070d2' }, headerTintColor: '#fff' }}>
        {!isLoggedIn ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'One App – Login' }} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'One App' }} />
            <Stack.Screen name="RWA" component={RWAScreen} options={{ title: 'RWA Segments' }} />
            <Stack.Screen name="OOH" component={OOHScreen} options={{ title: 'OOH Segments' }} />
            <Stack.Screen name="CSP" component={CSPScreen} options={{ title: 'CSP Segments' }} />
            <Stack.Screen name="Depot" component={DepoScreen} options={{ title: 'DEPOT' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
