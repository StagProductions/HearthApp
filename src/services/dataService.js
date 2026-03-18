// src/services/dataService.js
// All Firestore read/write operations for Hearth
// Every function scopes data to the household so both users share it

import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, where, serverTimestamp, setDoc, getDoc,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Household ──────────────────────────────────────────────────

export function generateHouseholdCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'HEARTH-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createHousehold(userId, userName) {
  const code = generateHouseholdCode();
  const householdRef = doc(db, 'households', code);
  await setDoc(householdRef, {
    code,
    createdAt: serverTimestamp(),
    members: {
      [userId]: { name: userName, role: 'owner', joinedAt: serverTimestamp() },
    },
  });
  return code;
}

export async function joinHousehold(userId, userName, code) {
  const householdRef = doc(db, 'households', code.toUpperCase());
  const snap = await getDoc(householdRef);
  if (!snap.exists()) throw new Error('Household not found. Check your code.');
  await updateDoc(householdRef, {
    [`members.${userId}`]: { name: userName, role: 'partner', joinedAt: serverTimestamp() },
  });
  return code.toUpperCase();
}

export function listenHousehold(code, callback) {
  return onSnapshot(doc(db, 'households', code), snap => {
    callback(snap.exists() ? snap.data() : null);
  });
}

// ── Calendar Events ────────────────────────────────────────────

export function listenEvents(householdCode, callback) {
  const q = query(
    collection(db, 'households', householdCode, 'events'),
    orderBy('date', 'asc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function addEvent(householdCode, event) {
  return addDoc(collection(db, 'households', householdCode, 'events'), {
    ...event,
    createdAt: serverTimestamp(),
  });
}

export async function updateEvent(householdCode, eventId, data) {
  return updateDoc(doc(db, 'households', householdCode, 'events', eventId), data);
}

export async function deleteEvent(householdCode, eventId) {
  return deleteDoc(doc(db, 'households', householdCode, 'events', eventId));
}

// ── Shifts ─────────────────────────────────────────────────────

export function listenShifts(householdCode, callback) {
  const q = query(
    collection(db, 'households', householdCode, 'shifts'),
    orderBy('date', 'asc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function setShift(householdCode, shift) {
  // Use date+userId as doc ID so updates overwrite cleanly
  const id = `${shift.date}_${shift.userId}`;
  return setDoc(doc(db, 'households', householdCode, 'shifts', id), {
    ...shift,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteShift(householdCode, shiftId) {
  return deleteDoc(doc(db, 'households', householdCode, 'shifts', shiftId));
}

// ── Meal Planner ───────────────────────────────────────────────

export function listenMeals(householdCode, callback) {
  const q = query(
    collection(db, 'households', householdCode, 'meals'),
    orderBy('date', 'asc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function setMeal(householdCode, meal) {
  const id = `${meal.date}_${meal.type}`;
  return setDoc(doc(db, 'households', householdCode, 'meals', id), {
    ...meal,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMeal(householdCode, mealId) {
  return deleteDoc(doc(db, 'households', householdCode, 'meals', mealId));
}

// Shopping list items
export function listenShoppingList(householdCode, callback) {
  return onSnapshot(
    collection(db, 'households', householdCode, 'shopping'),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export async function addShoppingItem(householdCode, item) {
  return addDoc(collection(db, 'households', householdCode, 'shopping'), {
    name: item,
    done: false,
    addedAt: serverTimestamp(),
  });
}

export async function toggleShoppingItem(householdCode, itemId, done) {
  return updateDoc(doc(db, 'households', householdCode, 'shopping', itemId), { done });
}

export async function deleteShoppingItem(householdCode, itemId) {
  return deleteDoc(doc(db, 'households', householdCode, 'shopping', itemId));
}

// ── Bills ──────────────────────────────────────────────────────

export function listenBills(householdCode, callback) {
  const q = query(
    collection(db, 'households', householdCode, 'bills'),
    orderBy('dueDay', 'asc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function addBill(householdCode, bill) {
  return addDoc(collection(db, 'households', householdCode, 'bills'), {
    ...bill,
    createdAt: serverTimestamp(),
  });
}

export async function updateBill(householdCode, billId, data) {
  return updateDoc(doc(db, 'households', householdCode, 'bills', billId), data);
}

export async function deleteBill(householdCode, billId) {
  return deleteDoc(doc(db, 'households', householdCode, 'bills', billId));
}

// ── Documents ──────────────────────────────────────────────────

export function listenDocuments(householdCode, callback) {
  const q = query(
    collection(db, 'households', householdCode, 'documents'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function addDocument(householdCode, docMeta) {
  return addDoc(collection(db, 'households', householdCode, 'documents'), {
    ...docMeta,
    createdAt: serverTimestamp(),
  });
}

export async function deleteDocument(householdCode, docId) {
  return deleteDoc(doc(db, 'households', householdCode, 'documents', docId));
}
