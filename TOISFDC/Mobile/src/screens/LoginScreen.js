import React, { useState } from 'react';
import {
  Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { login as apiLogin } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username || !password) {
      Alert.alert('Validation', 'Please enter username and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiLogin(username, password);
      login(data.user_id);
    } catch (e) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>One App</Text>
      <Text style={styles.subtitle}>Times of India – Field Sales</Text>

      <TextInput
        style={styles.input}
        placeholder="Username (email)"
        autoCapitalize="none"
        keyboardType="email-address"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Log In</Text>}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f4f6f9' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0070d2', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#d8dde6',
    borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 15,
  },
  btn: {
    backgroundColor: '#0070d2', borderRadius: 6, padding: 14,
    alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
