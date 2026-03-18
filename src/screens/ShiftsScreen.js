// src/screens/ShiftsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import { listenShifts, setShift, deleteShift } from '../services/dataService';
import { colors, spacing, radius, shiftTypes } from '../utils/theme';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function ShiftsScreen() {
  const { user, householdCode, memberName, partnerName, household } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null); // { date, userId }

  const members = household?.members ? Object.entries(household.members) : [];

  useEffect(() => {
    if (!householdCode) return;
    return listenShifts(householdCode, setShifts);
  }, [householdCode]);

  const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'));

  const getShift = (date, userId) => shifts.find(s => s.date === date && s.userId === userId);

  function openEdit(date, userId) {
    setEditing({ date, userId });
    setModalVisible(true);
  }

  async function pickShift(type) {
    if (!editing) return;
    await setShift(householdCode, { date: editing.date, userId: editing.userId, type });
    setModalVisible(false);
    setEditing(null);
  }

  async function clearShift() {
    if (!editing) return;
    const id = `${editing.date}_${editing.userId}`;
    await deleteShift(householdCode, id);
    setModalVisible(false);
    setEditing(null);
  }

  const totalHours = (userId) => {
    return weekDates.reduce((sum, d) => {
      const sh = getShift(d, userId);
      if (!sh || sh.type === 'off') return sum;
      return sum + (sh.type === 'morning' || sh.type === 'evening' ? 8 : sh.type === 'night' ? 8 : 0);
    }, 0);
  };

  return (
    <View style={s.bg}>
      {/* Week nav */}
      <View style={s.weekNav}>
        <TouchableOpacity onPress={() => setWeekStart(w => subWeeks(w, 1))}>
          <Ionicons name="chevron-back" size={22} color={colors.darkBrown} />
        </TouchableOpacity>
        <Text style={s.weekLabel}>
          {format(weekStart,'d MMM')} – {format(addDays(weekStart,6),'d MMM yyyy')}
        </Text>
        <TouchableOpacity onPress={() => setWeekStart(w => addWeeks(w, 1))}>
          <Ionicons name="chevron-forward" size={22} color={colors.darkBrown} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Day headers */}
          <View style={s.headerRow}>
            <View style={s.personCol} />
            {weekDates.map((d, i) => (
              <View key={d} style={s.dayCol}>
                <Text style={s.dayName}>{DAYS[i]}</Text>
                <Text style={s.dayNum}>{format(new Date(d),'d')}</Text>
              </View>
            ))}
          </View>

          {/* Rows per member */}
          {members.map(([uid, member]) => (
            <View key={uid} style={s.memberRow}>
              <View style={s.personCol}>
                <View style={[s.avatar, { backgroundColor: uid === user?.uid ? colors.rust : colors.sage }]}>
                  <Text style={s.avatarText}>{member.name?.[0]?.toUpperCase() || '?'}</Text>
                </View>
                <Text style={s.personName}>{uid === user?.uid ? 'You' : member.name}</Text>
              </View>
              {weekDates.map(d => {
                const sh = getShift(d, uid);
                const cfg = sh ? shiftTypes[sh.type] : null;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[s.shiftCell, cfg && { backgroundColor: cfg.color, borderColor: 'transparent' }]}
                    onPress={() => openEdit(d, uid)}>
                    {cfg ? (
                      <>
                        <Text style={[s.shiftEmoji]}>{cfg.emoji}</Text>
                        <Text style={[s.shiftLabel, { color: cfg.textColor }]}>{cfg.label}</Text>
                        {cfg.time ? <Text style={[s.shiftTime, { color: cfg.textColor, opacity: 0.7 }]}>{cfg.time}</Text> : null}
                      </>
                    ) : (
                      <Ionicons name="add" size={20} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Summary */}
      <View style={s.summary}>
        {members.map(([uid, member]) => (
          <View key={uid} style={s.summaryCard}>
            <Text style={s.sumLabel}>{uid === user?.uid ? 'Your hours' : `${member.name}'s hours`}</Text>
            <Text style={s.sumValue}>{totalHours(uid)}</Text>
          </View>
        ))}
      </View>

      {/* Shift picker modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Set shift</Text>
            {Object.entries(shiftTypes).map(([type, cfg]) => (
              <TouchableOpacity key={type} style={[s.shiftOption, { backgroundColor: cfg.color }]} onPress={() => pickShift(type)}>
                <Text style={s.shiftOptEmoji}>{cfg.emoji}</Text>
                <View>
                  <Text style={[s.shiftOptLabel, { color: cfg.textColor }]}>{cfg.label}</Text>
                  {cfg.time ? <Text style={[s.shiftOptTime, { color: cfg.textColor, opacity: 0.7 }]}>{cfg.time}</Text> : null}
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.clearBtn} onPress={clearShift}>
              <Text style={s.clearText}>Clear shift</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn2} onPress={() => setModalVisible(false)}>
              <Text style={s.cancelText2}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.cream },
  weekNav: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:spacing.md, paddingVertical:spacing.sm, backgroundColor:colors.warmWhite, borderBottomWidth:1, borderBottomColor:colors.border },
  weekLabel: { fontSize:15, fontWeight:'700', color:colors.darkBrown },
  headerRow: { flexDirection:'row', paddingTop:8, paddingBottom:4, backgroundColor:colors.warmWhite },
  personCol: { width:80, alignItems:'center', justifyContent:'center', paddingVertical:4 },
  dayCol: { width:100, alignItems:'center', paddingVertical:4 },
  dayName: { fontSize:11, fontWeight:'700', color:colors.textMuted, textTransform:'uppercase', letterSpacing:1 },
  dayNum: { fontSize:16, fontWeight:'700', color:colors.darkBrown, marginTop:2 },
  memberRow: { flexDirection:'row', paddingVertical:6, paddingHorizontal:0, borderBottomWidth:1, borderBottomColor:colors.border },
  avatar: { width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center', marginBottom:2 },
  avatarText: { color:'#fff', fontWeight:'700', fontSize:13 },
  personName: { fontSize:11, color:colors.textMuted, textAlign:'center' },
  shiftCell: { width:100, height:70, alignItems:'center', justifyContent:'center', borderRadius:8, borderWidth:1, borderColor:colors.border, marginHorizontal:1, backgroundColor:colors.warmWhite },
  shiftEmoji: { fontSize:16 },
  shiftLabel: { fontSize:11, fontWeight:'700', marginTop:2 },
  shiftTime: { fontSize:10, marginTop:1 },
  summary: { flexDirection:'row', gap:spacing.sm, padding:spacing.md, backgroundColor:colors.warmWhite, borderTopWidth:1, borderTopColor:colors.border },
  summaryCard: { flex:1, backgroundColor:colors.cream, borderRadius:radius.md, padding:spacing.sm, alignItems:'center' },
  sumLabel: { fontSize:11, color:colors.textMuted },
  sumValue: { fontSize:22, fontWeight:'700', color:colors.darkBrown },
  modalOverlay: { flex:1, backgroundColor:'rgba(44,31,20,0.5)', justifyContent:'flex-end' },
  modalCard: { backgroundColor:colors.warmWhite, borderTopLeftRadius:20, borderTopRightRadius:20, padding:spacing.lg },
  modalTitle: { fontSize:18, fontWeight:'700', color:colors.darkBrown, marginBottom:spacing.md },
  shiftOption: { flexDirection:'row', alignItems:'center', gap:14, padding:14, borderRadius:radius.md, marginBottom:8 },
  shiftOptEmoji: { fontSize:22 },
  shiftOptLabel: { fontSize:16, fontWeight:'700' },
  shiftOptTime: { fontSize:13 },
  clearBtn: { padding:14, borderRadius:radius.md, borderWidth:1, borderColor:colors.danger, alignItems:'center', marginBottom:8 },
  clearText: { color:colors.danger, fontWeight:'700' },
  cancelBtn2: { padding:14, borderRadius:radius.md, borderWidth:1, borderColor:colors.border, alignItems:'center' },
  cancelText2: { color:colors.textSecondary },
});
