// src/services/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createHousehold, joinHousehold, listenHousehold } from './dataService';

const AuthContext = createContext(null);

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [householdCode, setHouseholdCode] = useState(null);
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const savedCode = await AsyncStorage.getItem(`household_${u.uid}`);
        if (savedCode) {
          setHouseholdCode(savedCode);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!householdCode) return;
    const unsub = listenHousehold(householdCode, setHousehold);
    return unsub;
  }, [householdCode]);

  async function signInEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function signUpEmail(email, password, name) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    return cred;
  }

  async function signInGoogle() {
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();
    const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
    const credential = GoogleAuthProvider.credential(idToken);
    return signInWithCredential(auth, credential);
  }

  async function logout() {
    await signOut(auth);
    setHouseholdCode(null);
    setHousehold(null);
  }

  async function setupNewHousehold(userName) {
    const code = await createHousehold(user.uid, userName || user.displayName || 'You');
    await AsyncStorage.setItem(`household_${user.uid}`, code);
    setHouseholdCode(code);
    return code;
  }

  async function joinExistingHousehold(code, userName) {
    const finalCode = await joinHousehold(
      user.uid,
      userName || user.displayName || 'Partner',
      code
    );
    await AsyncStorage.setItem(`household_${user.uid}`, finalCode);
    setHouseholdCode(finalCode);
    return finalCode;
  }

  const memberName = () => {
    if (!household || !user) return 'You';
    return household.members?.[user.uid]?.name || user.displayName || 'You';
  };

  const partnerName = () => {
    if (!household || !user) return 'Partner';
    const members = household.members || {};
    const partnerEntry = Object.entries(members).find(([uid]) => uid !== user.uid);
    return partnerEntry?.[1]?.name || 'Partner';
  };

  return (
    <AuthContext.Provider value={{
      user,
      household,
      householdCode,
      loading,
      signInEmail,
      signUpEmail,
      signInGoogle,
      logout,
      setupNewHousehold,
      joinExistingHousehold,
      memberName,
      partnerName,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
