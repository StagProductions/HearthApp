// src/screens/DashboardScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../services/AuthContext';
import { listenEvents, listenBills, listenMeals, listenShifts } from '../services/dataService';
import { colors, spacing, radius, shadows } from '../utils/theme';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export default function DashboardScreen({ navigation }) {
  const { user, householdCode, memberName, partnerName, household } = useAuth();
  const [events, setEvents] = useState([]);
  const [bills, setBills] = useState([]);
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    if (!householdCode) return;
    const u1 = listenEvents(householdCode, setEvents);
    const u2 = listenBills(householdCode, setBills);
    const u3 = listenMeals(householdCode, setMeals);
    return () => { u1(); u2(); u3(); };
  }, [householdCode]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const upcomingEvents = events.slice(0, 3);
  const overdueBills = bills.filter(b => b.status === 'overdue');
  const dueSoonBills = bills.filter(b => b.status === 'due-soon');
  const tonightMeal = meals.find(m => m.date === todayStr && m.type === 'dinner');
  const memberCount = household?.members ? Object.keys(household.members).length : 1;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView style={s.bg} contentContainerStyle={s.content}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting()}, {memberName()} ☀️</Text>
          <Text style={s.sub}>{memberCount === 2 ? `${memberName()} & ${partnerName()}'s Hearth` : 'Your Hearth'}</Text>
        </View>
        <TouchableOpacity style={s.codeChip}>
          <Text style={s.codeChipText}>{householdCode}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.statRow}>
        {[
          { label: 'Events', value: upcomingEvents.length },
          { label: 'Bills overdue', value: overdueBills.length, danger: overdueBills.length > 0 },
          { label: 'Meals this week', value: meals.filter(m => { const d = new Date(m.date); const now = new Date(); return d >= startOfWeek(now) && d <= endOfWeek(now); }).length },
        ].map((s2, i) => (
          <View key={i} style={[s.statCard, s2.danger && s.statDanger]}>
            <Text style={s.statValue}>{s2.value}</Text>
            <Text style={s.statLabel}>{s2.label}</Text>
          </View>
        ))}
      </View>

      {tonightMeal && (
        <TouchableOpacity style={s.card} onPress={() => navigation.navigate('Meals')}>
          <Text style={s.cardTitle}>🍽️  Tonight's dinner</Text>
          <Text style={s.mealName}>{tonightMeal.name}</Text>
        </TouchableOpacity>
      )}

      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.cardTitle}>📅  Upcoming events</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
            <Text style={s.link}>See all</Text>
          </TouchableOpacity>
        </View>
        {upcomingEvents.length === 0
          ? <Text style={s.empty}>No upcoming events yet</Text>
          : upcomingEvents.map(ev => (
            <View key={ev.id} style={s.eventRow}>
              <View style={[s.dot, { backgroundColor: ev.who === 'both' ? colors.gold : ev.userId === user?.uid ? colors.rust : colors.sage }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.evName}>{ev.title}</Text>
                <Text style={s.evMeta}>{ev.date}{ev.time ? ` · ${ev.time}` : ''}</Text>
              </View>
            </View>
          ))
        }
      </View>

      {(overdueBills.length > 0 || dueSoonBills.length > 0) && (
        <TouchableOpacity style={s.card} onPress={() => navigation.navigate('Bills')}>
          <Text style={s.cardTitle}>💳  Bills need attention</Text>
          {[...overdueBills, ...dueSoonBills].map(b => (
            <View key={b.id} style={s.row}>
              <Text style={s.evName}>{b.emoji} {b.name}</Text>
              <View style={[s.badge, { backgroundColor: b.status === 'overdue' ? colors.dangerLight : colors.goldLight }]}>
                <Text style={[s.badgeText, { color: b.status === 'overdue' ? colors.danger : '#7A5A1A' }]}>
                  {b.status === 'overdue' ? 'Overdue' : 'Due soon'}
                </Text>
              </View>
            </View>
          ))}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.md, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  greeting: { fontSize: 20, fontWeight: '700', color: colors.darkBrown },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  codeChip: { backgroundColor: colors.darkBrown, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  codeChipText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.warmWhite, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  statDanger: { borderColor: 'rgba(192,57,43,0.3)', backgroundColor: colors.dangerLight },
  statValue: { fontSize: 26, fontWeight: '700', color: colors.darkBrown },
  statLabel: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  card: { backgroundColor: colors.warmWhite, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, ...shadows.card },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.darkBrown, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { fontSize: 13, color: colors.rust },
  empty: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  dot: { width: 10, height: 10, borderRadius: 5 },
  evName: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  evMeta: { fontSize: 12, color: colors.textMuted },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  mealName: { fontSize: 20, fontWeight: '700', color: colors.darkBrown },
  danger: colors.danger,
  dangerLight: colors.dangerLight,
});
