// src/screens/CalendarScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import { listenEvents, addEvent, deleteEvent } from '../services/dataService';
import { colors, spacing, radius, shadows } from '../utils/theme';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, parseISO } from 'date-fns';

export default function CalendarScreen() {
  const { user, householdCode, memberName, partnerName } = useAuth();
  const [events, setEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', time: '', who: 'both', notes: '' });

  useEffect(() => {
    if (!householdCode) return;
    return listenEvents(householdCode, setEvents);
  }, [householdCode]);

  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOffset = (getDay(startOfMonth(currentMonth)) + 6) % 7; // Mon=0

  const eventsForDate = (dateStr) => events.filter(e => e.date === dateStr);
  const selectedEvents = eventsForDate(selectedDate);

  async function handleAdd() {
    if (!form.title.trim()) return Alert.alert('Enter a title');
    await addEvent(householdCode, { ...form, date: selectedDate, userId: user.uid });
    setForm({ title: '', time: '', who: 'both', notes: '' });
    setShowModal(false);
  }

  async function handleDelete(id) {
    Alert.alert('Delete event', 'Remove this event?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEvent(householdCode, id) },
    ]);
  }

  const whoColor = (who, uid) => who === 'both' ? colors.gold : uid === user?.uid ? colors.rust : colors.sage;

  return (
    <View style={s.bg}>
      {/* Month nav */}
      <View style={s.monthNav}>
        <TouchableOpacity onPress={() => setCurrentMonth(d => { const m = new Date(d); m.setMonth(m.getMonth()-1); return m; })}>
          <Ionicons name="chevron-back" size={22} color={colors.darkBrown} />
        </TouchableOpacity>
        <Text style={s.monthLabel}>{format(currentMonth, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={() => setCurrentMonth(d => { const m = new Date(d); m.setMonth(m.getMonth()+1); return m; })}>
          <Ionicons name="chevron-forward" size={22} color={colors.darkBrown} />
        </TouchableOpacity>
      </View>

      {/* Day names */}
      <View style={s.dayNames}>
        {['M','T','W','T','F','S','S'].map((d,i) => <Text key={i} style={s.dayName}>{d}</Text>)}
      </View>

      {/* Calendar grid */}
      <View style={s.grid}>
        {Array.from({ length: firstDayOffset }).map((_,i) => <View key={`e${i}`} style={s.cell} />)}
        {daysInMonth.map(day => {
          const ds = format(day, 'yyyy-MM-dd');
          const isToday = ds === format(new Date(), 'yyyy-MM-dd');
          const isSelected = ds === selectedDate;
          const hasEvents = eventsForDate(ds).length > 0;
          return (
            <TouchableOpacity key={ds} style={[s.cell, isSelected && s.cellSelected, isToday && !isSelected && s.cellToday]} onPress={() => setSelectedDate(ds)}>
              <Text style={[s.cellText, isSelected && s.cellTextSel, isToday && !isSelected && s.cellTextToday]}>{format(day,'d')}</Text>
              {hasEvents && <View style={[s.eventDot, isSelected && { backgroundColor: '#fff' }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={s.legend}>
        {[{c:colors.rust,l:memberName()},{c:colors.sage,l:partnerName()},{c:colors.gold,l:'Both'}].map((it,i) => (
          <View key={i} style={s.legendItem}>
            <View style={[s.legendDot,{backgroundColor:it.c}]} />
            <Text style={s.legendText}>{it.l}</Text>
          </View>
        ))}
      </View>

      {/* Selected day events */}
      <ScrollView style={s.eventsList} contentContainerStyle={{ padding: spacing.md }}>
        <View style={s.eventsHeader}>
          <Text style={s.eventsTitle}>{format(parseISO(selectedDate), 'd MMMM')}</Text>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {selectedEvents.length === 0
          ? <Text style={s.empty}>No events — tap Add to create one</Text>
          : selectedEvents.map(ev => (
            <View key={ev.id} style={s.eventCard}>
              <View style={[s.eventDotLg, { backgroundColor: whoColor(ev.who, ev.userId) }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.evName}>{ev.title}</Text>
                {ev.time ? <Text style={s.evMeta}>{ev.time}</Text> : null}
                {ev.notes ? <Text style={s.evMeta}>{ev.notes}</Text> : null}
                <Text style={s.evWho}>{ev.who === 'both' ? 'Both' : ev.userId === user?.uid ? memberName() : partnerName()}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(ev.id)}>
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))
        }
      </ScrollView>

      {/* Add event modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Add event — {format(parseISO(selectedDate),'d MMM')}</Text>
            <TextInput style={s.input} placeholder="Event title" placeholderTextColor={colors.textMuted} value={form.title} onChangeText={t => setForm(f=>({...f,title:t}))} />
            <TextInput style={s.input} placeholder="Time (e.g. 6:00 PM)" placeholderTextColor={colors.textMuted} value={form.time} onChangeText={t => setForm(f=>({...f,time:t}))} />
            <TextInput style={s.input} placeholder="Notes (optional)" placeholderTextColor={colors.textMuted} value={form.notes} onChangeText={t => setForm(f=>({...f,notes:t}))} />
            <Text style={s.label}>Who?</Text>
            <View style={s.whoRow}>
              {[{v:'me',l:memberName()},{v:'partner',l:partnerName()},{v:'both',l:'Both'}].map(opt => (
                <TouchableOpacity key={opt.v} style={[s.whoBtn, form.who===opt.v && s.whoBtnActive]} onPress={() => setForm(f=>({...f,who:opt.v}))}>
                  <Text style={[s.whoBtnText, form.who===opt.v && s.whoBtnTextActive]}>{opt.l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleAdd}><Text style={s.saveText}>Add event</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.cream },
  monthNav: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.warmWhite, borderBottomWidth:1, borderBottomColor:colors.border },
  monthLabel: { fontSize:17, fontWeight:'700', color:colors.darkBrown },
  dayNames: { flexDirection:'row', paddingHorizontal: spacing.md, backgroundColor:colors.warmWhite },
  dayName: { flex:1, textAlign:'center', fontSize:11, fontWeight:'700', color:colors.textMuted, paddingVertical:6, textTransform:'uppercase' },
  grid: { flexDirection:'row', flexWrap:'wrap', paddingHorizontal: spacing.md, backgroundColor:colors.warmWhite, paddingBottom:8 },
  cell: { width:'14.28%', aspectRatio:1, alignItems:'center', justifyContent:'center', borderRadius:8 },
  cellSelected: { backgroundColor:colors.rust },
  cellToday: { backgroundColor:colors.rustLight },
  cellText: { fontSize:14, color:colors.textSecondary },
  cellTextSel: { color:'#fff', fontWeight:'700' },
  cellTextToday: { color:colors.rustDark, fontWeight:'700' },
  eventDot: { width:4, height:4, borderRadius:2, backgroundColor:colors.gold, marginTop:1 },
  legend: { flexDirection:'row', gap:16, paddingHorizontal:spacing.md, paddingVertical:8, backgroundColor:colors.warmWhite, borderBottomWidth:1, borderBottomColor:colors.border },
  legendItem: { flexDirection:'row', alignItems:'center', gap:5 },
  legendDot: { width:8, height:8, borderRadius:4 },
  legendText: { fontSize:12, color:colors.textMuted },
  eventsList: { flex:1 },
  eventsHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:spacing.md },
  eventsTitle: { fontSize:17, fontWeight:'700', color:colors.darkBrown },
  addBtn: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:colors.rust, borderRadius:radius.md, paddingHorizontal:12, paddingVertical:7 },
  addBtnText: { color:'#fff', fontWeight:'700', fontSize:14 },
  empty: { fontSize:14, color:colors.textMuted, fontStyle:'italic' },
  eventCard: { flexDirection:'row', alignItems:'flex-start', gap:12, backgroundColor:colors.warmWhite, borderRadius:radius.md, padding:12, borderWidth:1, borderColor:colors.border, marginBottom:8 },
  eventDotLg: { width:12, height:12, borderRadius:6, marginTop:3 },
  evName: { fontSize:15, fontWeight:'600', color:colors.textPrimary },
  evMeta: { fontSize:13, color:colors.textMuted, marginTop:2 },
  evWho: { fontSize:12, color:colors.rust, marginTop:4, fontWeight:'600' },
  modalOverlay: { flex:1, backgroundColor:'rgba(44,31,20,0.5)', justifyContent:'flex-end' },
  modalCard: { backgroundColor:colors.warmWhite, borderTopLeftRadius:20, borderTopRightRadius:20, padding:spacing.lg },
  modalTitle: { fontSize:18, fontWeight:'700', color:colors.darkBrown, marginBottom:spacing.md },
  input: { backgroundColor:colors.cream, borderWidth:1, borderColor:colors.borderStrong, borderRadius:radius.md, padding:12, fontSize:15, color:colors.textPrimary, marginBottom:spacing.sm },
  label: { fontSize:13, fontWeight:'700', color:colors.textSecondary, marginBottom:spacing.sm },
  whoRow: { flexDirection:'row', gap:8, marginBottom:spacing.md },
  whoBtn: { flex:1, paddingVertical:9, borderRadius:radius.sm, borderWidth:1, borderColor:colors.border, alignItems:'center' },
  whoBtnActive: { backgroundColor:colors.rust, borderColor:colors.rust },
  whoBtnText: { fontSize:13, color:colors.textMuted, fontWeight:'600' },
  whoBtnTextActive: { color:'#fff' },
  modalBtns: { flexDirection:'row', gap:10 },
  cancelBtn: { flex:1, padding:14, borderRadius:radius.md, borderWidth:1, borderColor:colors.border, alignItems:'center' },
  cancelText: { color:colors.textSecondary, fontWeight:'600' },
  saveBtn: { flex:1, padding:14, borderRadius:radius.md, backgroundColor:colors.rust, alignItems:'center' },
  saveText: { color:'#fff', fontWeight:'700' },
});
