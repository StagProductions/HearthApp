// src/screens/AuthScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import { colors, spacing, radius } from '../utils/theme';

export default function AuthScreen() {
  const { signInEmail, signUpEmail, signInGoogle } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) return Alert.alert('Please fill in all fields');
    if (mode === 'signup' && !name) return Alert.alert('Please enter your name');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInEmail(email, password);
      } else {
        await signUpEmail(email, password, name);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      await signInGoogle();
    } catch (e) {
      Alert.alert('Google sign-in failed', e.message);
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={s.logoArea}>
          <View style={s.logoCircle}>
            <Text style={s.logoEmoji}>🏡</Text>
          </View>
          <Text style={s.appName}>Hearth</Text>
          <Text style={s.tagline}>Your home, together</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{mode === 'login' ? 'Welcome back' : 'Create account'}</Text>

          {mode === 'signup' && (
            <TextInput
              style={s.input}
              placeholder="Your first name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={s.input}
            placeholder="Email address"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={s.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={s.primaryBtn} onPress={handleSubmit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.primaryBtnText}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>
            }
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>

          <TouchableOpacity style={s.googleBtn} onPress={handleGoogle} disabled={loading}>
            <Ionicons name="logo-google" size={18} color={colors.textPrimary} />
            <Text style={s.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            <Text style={s.switchText}>
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.cream },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  logoArea: { alignItems: 'center', marginBottom: spacing.xl },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.darkBrown,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 36, fontWeight: '700', color: colors.darkBrown, letterSpacing: 1 },
  tagline: { fontSize: 14, color: colors.textMuted, marginTop: 4, letterSpacing: 1 },
  card: {
    backgroundColor: colors.warmWhite,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.darkBrown, marginBottom: spacing.md },
  input: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  primaryBtn: {
    backgroundColor: colors.rust,
    borderRadius: radius.md,
    padding: 15,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: spacing.sm, color: colors.textMuted, fontSize: 13 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    padding: 14,
    backgroundColor: colors.warmWhite,
  },
  googleBtnText: { fontSize: 15, color: colors.textPrimary, fontWeight: '600' },
  switchText: {
    textAlign: 'center',
    marginTop: spacing.md,
    color: colors.rust,
    fontSize: 14,
  },
});
