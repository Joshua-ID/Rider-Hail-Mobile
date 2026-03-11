import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'RIDER' | 'DRIVER'>('RIDER');
  const { register, isLoading } = useAuthStore();

  const handleRegister = async () => {
    if (!name || !email || !password) { Alert.alert('Error', 'Please fill in all required fields'); return; }
    try {
      await register({ name, email, phone, password, role });
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the ride</Text>

        {/* Role toggle */}
        <View style={styles.roleContainer}>
          {(['RIDER', 'DRIVER'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleButton, role === r && styles.roleButtonActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                {r === 'RIDER' ? '🧑 Rider' : '🚗 Driver'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.form}>
          {[
            { label: 'Full Name *', value: name, setter: setName, placeholder: 'John Doe' },
            { label: 'Email *', value: email, setter: setEmail, placeholder: 'you@example.com', keyboard: 'email-address' as any },
            { label: 'Phone', value: phone, setter: setPhone, placeholder: '+1 234 567 8900', keyboard: 'phone-pad' as any },
            { label: 'Password *', value: password, setter: setPassword, placeholder: 'Min. 6 characters', secure: true },
          ].map(({ label, value, setter, placeholder, keyboard, secure }) => (
            <View key={label} style={styles.inputContainer}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                value={value}
                onChangeText={setter}
                keyboardType={keyboard}
                secureTextEntry={secure}
                autoCapitalize={label.includes('Email') ? 'none' : 'words'}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'Creating account...' : 'Create Account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.link}>Sign in</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 60 },
  back: { marginBottom: 24 },
  backText: { color: '#6C63FF', fontSize: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 16, color: '#9CA3AF', marginTop: 4, marginBottom: 24 },
  roleContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleButton: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#2D2D44',
  },
  roleButtonActive: { borderColor: '#6C63FF', backgroundColor: '#6C63FF20' },
  roleText: { color: '#9CA3AF', fontWeight: '600', fontSize: 15 },
  roleTextActive: { color: '#6C63FF' },
  form: { backgroundColor: '#1A1A2E', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#2D2D44' },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#9CA3AF', marginBottom: 8 },
  input: {
    backgroundColor: '#0F0F1A', borderRadius: 12, padding: 14,
    color: '#FFFFFF', fontSize: 16, borderWidth: 1, borderColor: '#2D2D44',
  },
  button: { backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  linkText: { textAlign: 'center', marginTop: 20, color: '#9CA3AF', fontSize: 14 },
  link: { color: '#6C63FF', fontWeight: '600' },
});
