import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { Button, Input } from '../components/UI';
import { useAuth } from '../hooks/useAuth';
import { createHousehold, joinHousehold } from '../firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { colors, spacing, radius } from '../utils/theme';

export default function HouseholdSetupScreen() {
  const { user, refreshHousehold } = useAuth();
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { id, code: newCode } = await createHousehold(
        user.uid,
        user.displayName || user.email
      );
      await refreshHousehold(id);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!code.trim()) return Alert.alert('Enter a code', 'Please enter your HEARTH invite code.');
    setLoading(true);
    try {
      const id = await joinHousehold(user.uid, user.displayName || user.email, code.trim());
      await refreshHousehold(id);
    } catch (err) {
      Alert.alert('Invalid code', err.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.emoji}>🏡</Text>
          <Text style={styles.title}>Set up your household</Text>
          <Text style={styles.subtitle}>
            Create a new Hearth household, or join one your partner has already created.
          </Text>
        </View>

        {!mode ? (
          <View style={styles.options}>
            <TouchableOpacity style={styles.optionCard} onPress={() => setMode('create')}>
              <Text style={styles.optionEmoji}>✨</Text>
              <Text style={styles.optionTitle}>Create a household</Text>
              <Text style={styles.optionDesc}>
                Start fresh. You'll get a HEARTH code to share with your partner.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={() => setMode('join')}>
              <Text style={styles.optionEmoji}>🔗</Text>
              <Text style={styles.optionTitle}>Join a household</Text>
              <Text style={styles.optionDesc}>
                Enter the HEARTH-XXXX code your partner shared with you.
              </Text>
            </TouchableOpacity>
          </View>
        ) : mode === 'create' ? (
          <View style={styles.form}>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                After creating your household, you'll see your HEARTH code on the home screen to share with your partner.
              </Text>
            </View>
            <Button label="Create household" onPress={handleCreate} loading={loading}/>
            <Button label="Back" onPress={() => setMode(null)} variant="ghost" style={{ marginTop: 8 }}/>
          </View>
        ) : (
          <View style={styles.form}>
            <Input
              label="HEARTH invite code"
              value={code}
              onChangeText={t => setCode(t.toUpperCase())}
              placeholder="HEARTH-XXXX"
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Button label="Join household" onPress={handleJoin} loading={loading}/>
            <Button label="Back" onPress={() => setMode(null)} variant="ghost" style={{ marginTop: 8 }}/>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1, padding: spacing.xl, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  emoji: { fontSize: 52, marginBottom: spacing.lg },
  title: { fontSize: 26, fontWeight: '700', color: colors.darkBrown, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  options: { gap: spacing.md },
  optionCard: {
    backgroundColor: colors.warmWhite, borderRadius: radius.lg,
    padding: spacing.xl, borderWidth: 1.5, borderColor: colors.border,
  },
  optionEmoji: { fontSize: 32, marginBottom: spacing.sm },
  optionTitle: { fontSize: 18, fontWeight: '700', color: colors.darkBrown, marginBottom: 6 },
  optionDesc: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  form: { gap: 0 },
  infoBox: {
    backgroundColor: colors.goldLight, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: 'rgba(212,168,75,0.3)',
  },
  infoText: { fontSize: 14, color: '#7A5A1A', lineHeight: 20 },
});
