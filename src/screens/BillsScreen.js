import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Card, CardHeader, StatCard, Badge, Button, BottomSheet, Input } from '../components/UI';
import { useAuth } from '../hooks/useAuth';
import { subscribeBills, addBill, updateBill, deleteBill } from '../firebase/firestore';
import { colors, spacing, radius } from '../utils/theme';
import { format, addDays, parseISO } from 'date-fns';

const BILL_ICONS = ['🏠', '⚡', '💧', '🔥', '🌐', '📱', '📺', '🚗', '🛡️', '💳', '🎵', '📦'];
const STATUS_OPTIONS = ['unpaid', 'paid', 'auto', 'overdue'];

function getBillStatus(bill) {
  if (bill.status === 'paid') return 'paid';
  if (bill.status === 'auto') return 'auto';
  const today = format(new Date(), 'yyyy-MM-dd');
  const soon = format(addDays(new Date(), 5), 'yyyy-MM-dd');
  if (bill.dueDate < today) return 'overdue';
  if (bill.dueDate <= soon) return 'dueSoon';
  return 'default';
}

const statusLabel = { paid: 'Paid', auto: 'Auto-pay', overdue: 'Overdue', dueSoon: 'Due soon', default: 'Upcoming' };

export default function BillsScreen() {
  const { household } = useAuth();
  const [bills, setBills] = useState([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', amount: '', dueDate: '', icon: '💳', status: 'unpaid', notes: '' });

  useEffect(() => {
    if (!household?.id) return;
    return subscribeBills(household.id, setBills);
  }, [household?.id]);

  const totalMonthly = bills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
  const totalPaid = bills.filter(b => b.status === 'paid' || b.status === 'auto').reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
  const outstanding = totalMonthly - totalPaid;

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', amount: '', dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'), icon: '💳', status: 'unpaid', notes: '' });
    setSheetVisible(true);
  };

  const openEdit = (bill) => {
    setEditing(bill);
    setForm({ name: bill.name, amount: String(bill.amount), dueDate: bill.dueDate, icon: bill.icon || '💳', status: bill.status || 'unpaid', notes: bill.notes || '' });
    setSheetVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.amount || !form.dueDate) {
      return Alert.alert('Missing fields', 'Please fill in name, amount, and due date.');
    }
    const data = { ...form, amount: parseFloat(form.amount) };
    try {
      if (editing) {
        await updateBill(household.id, editing.id, data);
      } else {
        await addBill(household.id, data);
      }
      setSheetVisible(false);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = (bill) => {
    Alert.alert('Delete bill', `Remove "${bill.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBill(household.id, bill.id) }
    ]);
  };

  const markPaid = (bill) => updateBill(household.id, bill.id, { status: 'paid' });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ padding: spacing.lg }}>
      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
        <StatCard label="Total monthly" value={`£${totalMonthly.toFixed(0)}`}/>
        <StatCard label="Paid" value={`£${totalPaid.toFixed(0)}`} color={colors.sage}/>
        <StatCard label="Outstanding" value={`£${outstanding.toFixed(0)}`} color={outstanding > 0 ? colors.rust : colors.sage}/>
      </View>

      {/* Bills list */}
      <Card>
        <CardHeader title="All bills" action="+ Add bill" onAction={openAdd}/>
        {bills.length === 0 ? (
          <Text style={styles.emptyText}>No bills added yet — tap + Add bill to get started</Text>
        ) : (
          bills.map(bill => {
            const status = getBillStatus(bill);
            return (
              <TouchableOpacity key={bill.id} style={styles.billRow} onPress={() => openEdit(bill)}>
                <Text style={{ fontSize: 24, marginRight: 12 }}>{bill.icon || '💳'}</Text>
                <View style={styles.billInfo}>
                  <Text style={styles.billName}>{bill.name}</Text>
                  <Text style={styles.billDue}>Due {bill.dueDate}</Text>
                </View>
                <Text style={styles.billAmount}>£{parseFloat(bill.amount).toFixed(2)}</Text>
                <Badge label={statusLabel[status]} type={status}/>
                {(status !== 'paid' && status !== 'auto') && (
                  <TouchableOpacity style={styles.paidBtn} onPress={() => markPaid(bill)}>
                    <Text style={styles.paidBtnText}>✓</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </Card>

      {/* Edit sheet */}
      <BottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} title={editing ? 'Edit bill' : 'Add bill'}>
        <Text style={styles.iconLabel}>Icon</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
          {BILL_ICONS.map(icon => (
            <TouchableOpacity key={icon} style={[styles.iconBtn, form.icon === icon && styles.iconBtnActive]} onPress={() => setForm(f => ({ ...f, icon }))}>
              <Text style={{ fontSize: 22 }}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Input label="Bill name" value={form.name} onChangeText={t => setForm(f => ({ ...f, name: t }))} placeholder="e.g. Electricity"/>
        <Input label="Amount (£)" value={form.amount} onChangeText={t => setForm(f => ({ ...f, amount: t }))} placeholder="0.00" keyboardType="decimal-pad"/>
        <Input label="Due date" value={form.dueDate} onChangeText={t => setForm(f => ({ ...f, dueDate: t }))} placeholder="YYYY-MM-DD"/>
        <Input label="Notes (optional)" value={form.notes} onChangeText={t => setForm(f => ({ ...f, notes: t }))} placeholder="e.g. Direct debit from joint account"/>

        <Text style={styles.iconLabel}>Status</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg }}>
          {STATUS_OPTIONS.map(s => (
            <TouchableOpacity key={s} style={[styles.statusBtn, form.status === s && styles.statusBtnActive]} onPress={() => setForm(f => ({ ...f, status: s }))}>
              <Text style={[styles.statusBtnText, form.status === s && { color: colors.white }]}>{statusLabel[s] || s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button label={editing ? 'Save changes' : 'Add bill'} onPress={handleSave}/>
        {editing && <Button label="Delete bill" onPress={() => { handleDelete(editing); setSheetVisible(false); }} variant="danger" style={{ marginTop: 8, marginBottom: spacing.lg }}/>}
        {!editing && <View style={{ height: spacing.lg }}/>}
      </BottomSheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  emptyText: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
  billRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 4 },
  billInfo: { flex: 1 },
  billName: { fontSize: 15, color: colors.textPrimary, fontWeight: '600' },
  billDue: { fontSize: 12, color: colors.textMuted },
  billAmount: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginRight: 8 },
  paidBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.sageLight, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  paidBtnText: { color: colors.sage, fontWeight: '800', fontSize: 16 },
  iconLabel: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600', marginBottom: 8 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, marginRight: 8, borderWidth: 1.5, borderColor: 'transparent' },
  iconBtnActive: { borderColor: colors.rust, backgroundColor: colors.rustLight },
  statusBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border },
  statusBtnActive: { backgroundColor: colors.rust, borderColor: colors.rust },
  statusBtnText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
});
