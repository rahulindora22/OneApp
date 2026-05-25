/**
 * Converted from LWC: oneAppMaster
 * Acts as navigation hub – checks user authorization then routes to RWA / OOH / CSP / DEPOT.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { displayMasterComponent } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { userId, logout } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(null); // null = loading

  useEffect(() => {
    displayMasterComponent(userId)
      .then((result) => setAuthorized(result === 'SUCCESS'))
      .catch(() => setAuthorized(false));
  }, [userId]);

  if (authorized === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0070d2" />
      </View>
    );
  }

  if (!authorized) {
    return (
      <View style={styles.center}>
        <Text style={styles.unauthorizedText}>You are Unauthorized for this app.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>One App</Text>

      <TouchableOpacity style={styles.moduleBtn} onPress={() => router.push('/(app)/rwa')}>
        <Text style={styles.moduleBtnText}>RWA</Text>
        <Text style={styles.moduleBtnSub}>Residential Welfare Association</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.moduleBtn} onPress={() => router.push('/(app)/ooh')}>
        <Text style={styles.moduleBtnText}>OOH</Text>
        <Text style={styles.moduleBtnSub}>Out-of-Home Advertising</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.moduleBtn} onPress={() => router.push('/(app)/csp')}>
        <Text style={styles.moduleBtnText}>CSP</Text>
        <Text style={styles.moduleBtnSub}>Commercial Service Points</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.moduleBtn} onPress={() => router.push('/(app)/depot')}>
        <Text style={styles.moduleBtnText}>DEPOT</Text>
        <Text style={styles.moduleBtnSub}>Distribution Depots</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => Alert.alert('Logout', 'Are you sure?', [
        { text: 'Cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ])}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f4f6f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#0070d2', marginBottom: 24, textAlign: 'center' },
  moduleBtn: {
    backgroundColor: '#fff', borderRadius: 8, padding: 18, marginBottom: 14,
    borderLeftWidth: 4, borderLeftColor: '#0070d2',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  moduleBtnText: { fontSize: 18, fontWeight: 'bold', color: '#16325c' },
  moduleBtnSub: { fontSize: 13, color: '#706e6b', marginTop: 2 },
  unauthorizedText: { fontSize: 16, color: '#c23934', fontWeight: 'bold' },
  logoutBtn: { marginTop: 24, padding: 14, alignItems: 'center' },
  logoutText: { color: '#c23934', fontWeight: 'bold', fontSize: 15 },
});
