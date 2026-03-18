import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Card, CardHeader, Button, BottomSheet, Input, Divider } from '../components/UI';
import { useAuth } from '../hooks/useAuth';
import {
  subscribeMeals, setMeal, deleteMeal,
  subscribeShopping, addShoppingItem, toggleShoppingItem, deleteShoppingItem
} from '../firebase/firestore';
import { colors, spacing, radius } from '../utils/theme';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'];
const POPULAR_MEALS = ['Porridge', 'Avocado toast', 'Scrambled eggs', 'Caesar salad', 'Soup & bread', 'Jacket potato', 'Pasta', 'Stir-fry', 'Roast chicken', 'Salmon & veg', 'Spaghetti Bolognese', 'Slow cooker stew', 'Takeaway', 'Pizza', 'Curry'];

export default function MealsScreen() {
  const { household } = useAuth();
  const [meals, setMeals] = useState([]);
  const [shopping, setShopping] = useState([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [tab, setTab] = useState('planner'); // 'planner' | 'shopping'
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [mealName, setMealName] = useState('');
  const [mealNotes, setMealNotes] = useState('');
  const [shoppingItem, setShoppingItem] = useState('');

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (!household?.id) return;
    const u1 = subscribeMeals(household.id, setMeals);
    const u2 = subscribeShopping(household.id, setShopping);
    return () => { u1(); u2(); };
  }, [household?.id]);

  const getMeal = (date, type) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const typeKey = type.toLowerCase();
    return meals.find(m => m.date === dateStr && m.mealType === typeKey);
  };

  const handleCellPress = (date, type) => {
    const existing = getMeal(date, type);
    setSelectedCell({ date: format(date, 'yyyy-MM-dd'), type: type.toLowerCase(), label: `${type} — ${format(date, 'EEE d MMM')}` });
    setMealName(existing?.name || '');
    setMealNotes(existing?.notes || '');
    setSheetVisible(true);
  };

  const handleSaveMeal = async () => {
    if (!mealName.trim()) {
      await deleteMeal(household.id, selectedCell.date, selectedCell.type);
    } else {
      await setMeal(household.id, selectedCell.date, selectedCell.type, { name: mealName.trim(), notes: mealNotes.trim() });
    }
    setSheetVisible(false);
  };

  const handleAddShopping = async () => {
    if (!shoppingItem.trim()) return;
    await addShoppingItem(household.id, { name: shoppingItem.trim() });
    setShoppingItem('');
  };

  const pendingItems = shopping.filter(i => !i.done);
  const doneItems = shopping.filter(i => i.done);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* Tab switcher */}
      <View style={styles.tabs}>
        {[['planner', '🍽️ Meal planner'], ['shopping', '🛒 Shopping list']].map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.tab, tab === key && styles.tabActive]} onPress={() => setTab(key)}>
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'planner' ? (
        <>
          <View style={styles.weekNav}>
            <TouchableOpacity onPress={() => setWeekStart(w => subWeeks(w, 1))} style={styles.navBtn}>
              <Text style={styles.navText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.weekLabel}>{format(weekStart, 'd MMM')} – {format(addDays(weekStart, 6), 'd MMM yyyy')}</Text>
            <TouchableOpacity onPress={() => setWeekStart(w => addWeeks(w, 1))} style={styles.navBtn}>
              <Text style={styles.navText}>›</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            {MEAL_TYPES.map(type => (
              <View key={type} style={styles.mealRow}>
                <Text style={styles.mealTypeLabel}>{type}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealScroll}>
                  {days.map(day => {
                    const meal = getMeal(day, type);
                    return (
                      <TouchableOpacity key={day.toString()} style={[styles.mealCell, meal && styles.mealCellFilled]} onPress={() => handleCellPress(day, type)}>
                        <Text style={styles.mealDayName}>{format(day, 'EEE')}</Text>
                        <Text style={styles.mealDayNum}>{format(day, 'd')}</Text>
                        {meal
                          ? <Text style={styles.mealCellText} numberOfLines={2}>{meal.name}</Text>
                          : <Text style={styles.mealCellAdd}>+</Text>
                        }
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ))}
          </ScrollView>
        </>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          {/* Add item */}
          <View style={styles.addRow}>
            <Input
              style={{ flex: 1, marginBottom: 0, marginRight: spacing.sm }}
              value={shoppingItem}
              onChangeText={setShoppingItem}
              placeholder="Add item..."
              onSubmitEditing={handleAddShopping}
              returnKeyType="done"
            />
            <Button label="Add" onPress={handleAddShopping} style={{ paddingHorizontal: 20 }}/>
          </View>

          {/* Pending */}
          {pendingItems.length > 0 && (
            <Card>
              <CardHeader title={`To get (${pendingItems.length})`}/>
              {pendingItems.map(item => (
                <TouchableOpacity key={item.id} style={styles.shopItem} onPress={() => toggleShoppingItem(household.id, item.id, true)}>
                  <View style={styles.shopCheck}/>
                  <Text style={styles.shopName}>{item.name}</Text>
                  <TouchableOpacity onPress={() => deleteShoppingItem(household.id, item.id)}>
                    <Text style={{ color: colors.textMuted, fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {/* Done */}
          {doneItems.length > 0 && (
            <Card>
              <CardHeader title={`Done (${doneItems.length})`}/>
              {doneItems.map(item => (
                <TouchableOpacity key={item.id} style={styles.shopItem} onPress={() => toggleShoppingItem(household.id, item.id, false)}>
                  <View style={[styles.shopCheck, styles.shopCheckDone]}>
                    <Text style={{ color: colors.white, fontSize: 10 }}>✓</Text>
                  </View>
                  <Text style={[styles.shopName, { textDecorationLine: 'line-through', color: colors.textMuted }]}>{item.name}</Text>
                  <TouchableOpacity onPress={() => deleteShoppingItem(household.id, item.id)}>
                    <Text style={{ color: colors.textMuted, fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {pendingItems.length === 0 && doneItems.length === 0 && (
            <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, fontStyle: 'italic' }}>
              Your shopping list is empty — add items above
            </Text>
          )}
        </ScrollView>
      )}

      <BottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} title={selectedCell?.label || 'Add meal'}>
        <Input label="Meal name" value={mealName} onChangeText={setMealName} placeholder="e.g. Spaghetti Bolognese"/>
        <Input label="Notes (optional)" value={mealNotes} onChangeText={setMealNotes} placeholder="e.g. defrost chicken first" multiline numberOfLines={2}/>

        <Text style={styles.suggestLabel}>Quick picks</Text>
        <View style={styles.suggestions}>
          {POPULAR_MEALS.map(m => (
            <TouchableOpacity key={m} style={styles.suggestChip} onPress={() => setMealName(m)}>
              <Text style={styles.suggestText}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button label="Save" onPress={handleSaveMeal} style={{ marginTop: spacing.md }}/>
        {mealName ? <Button label="Clear meal" onPress={() => { setMealName(''); handleSaveMeal(); }} variant="ghost" style={{ marginTop: 6, marginBottom: spacing.lg }}/> : <View style={{ height: spacing.lg }}/>}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', backgroundColor: colors.warmWhite, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.rust },
  tabText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.rust },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: colors.warmWhite },
  navBtn: { padding: 8 },
  navText: { fontSize: 22, color: colors.rust, fontWeight: '700' },
  weekLabel: { fontSize: 14, fontWeight: '700', color: colors.darkBrown },
  mealRow: { borderBottomWidth: 1, borderBottomColor: colors.border },
  mealTypeLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  mealScroll: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  mealCell: { width: 90, height: 80, backgroundColor: colors.warmWhite, borderRadius: radius.md, marginRight: spacing.sm, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  mealCellFilled: { backgroundColor: colors.goldLight, borderColor: 'rgba(212,168,75,0.3)' },
  mealDayName: { fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  mealDayNum: { fontSize: 16, fontWeight: '700', color: colors.darkBrown },
  mealCellText: { fontSize: 11, color: '#5A3E1A', textAlign: 'center', marginTop: 4, lineHeight: 14 },
  mealCellAdd: { fontSize: 24, color: colors.textMuted, marginTop: 4 },
  addRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: spacing.md },
  shopItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  shopCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.borderStrong },
  shopCheckDone: { backgroundColor: colors.sage, borderColor: colors.sage, alignItems: 'center', justifyContent: 'center' },
  shopName: { flex: 1, fontSize: 15, color: colors.textPrimary },
  suggestLabel: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600', marginBottom: 8 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  suggestChip: { backgroundColor: colors.sand, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  suggestText: { fontSize: 13, color: colors.textSecondary },
});
