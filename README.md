# 🏡 Hearth — Your Home, Together

A warm, cosy household planning app for couples. Real-time synced across both devices.

## Screens

| Screen | Features |
|--------|----------|
| Dashboard | Live overview — events, meals, bills, partner presence |
| Calendar | Monthly calendar, per-person and shared events |
| Shift Rota | Weekly grid for both people — 6 shift types |
| Meal Planner | 7-day grid + shared shopping list with checkboxes |
| Bills | Track due dates, amounts, status — mark paid in one tap |
| Documents | Upload PDFs/photos — categorised by Home/Finance/Medical/Important |

---

## ─── STEP 1: Install Node.js ────────────────────────────

Download from https://nodejs.org (choose LTS).

Verify: `node --version`  (need v18+)

---

## ─── STEP 2: Set up Firebase ────────────────────────────

1. Go to https://console.firebase.google.com → Add project → name it "Hearth"
2. Enable these services:
   - **Authentication** → Email/Password + Google
   - **Firestore Database** → Production mode → region: europe-west2
   - **Realtime Database** → Europe region
   - **Storage** → Production mode
3. Add Android app → package: `com.hearth.familyplanner`
4. Download `google-services.json` → place in the `/hearth` root folder
5. Copy your web config values (from Project Settings → Web app)

---

## ─── STEP 3: Fill in your config ───────────────────────

Open `src/firebase/config.js` and paste your Firebase config values.

Open `src/hooks/useAuth.js` and paste your Google Web Client ID.

---

## ─── STEP 4: Install dependencies ─────────────────────

```bash
cd hearth
npm install
```

---

## ─── STEP 5: Build the APK (cloud — recommended) ───────

```bash
npm install -g eas-cli
eas login                              # create free account at expo.dev first
eas init                               # paste the project ID into app.json
eas build -p android --profile preview
```

Expo builds it in the cloud (~10-15 mins) and gives you a download link for the .apk.

---

## ─── STEP 6: Install on phones ─────────────────────────

1. Android Settings → Security → Install unknown apps → enable
2. Open the .apk → Install
3. First person: Create account → Create household → note your HEARTH-XXXX code
4. Second person: Create account → Join household → enter HEARTH-XXXX code
5. Everything syncs in real-time between both phones 🎉

---

## Project structure

```
hearth/
├── App.js                    # Root navigation + auth gate
├── app.json                  # Expo + Android config
├── eas.json                  # APK build profile
├── package.json
├── google-services.json      # ← YOU ADD THIS from Firebase
├── firestore.rules           # Deploy: firebase deploy --only firestore:rules
└── src/
    ├── firebase/
    │   ├── config.js         # ← Fill in your Firebase keys
    │   └── firestore.js      # All DB operations
    ├── hooks/useAuth.js      # Auth + household context
    ├── components/UI.js      # Shared UI components
    ├── utils/theme.js        # Colours + spacing tokens
    └── screens/
        ├── AuthScreen.js
        ├── HouseholdSetupScreen.js
        ├── DashboardScreen.js
        ├── CalendarScreen.js
        ├── ShiftsScreen.js
        ├── MealsScreen.js
        ├── BillsScreen.js
        └── DocumentsScreen.js
```

---

## Common issues

**Google sign-in fails** → Add your build's SHA-1 fingerprint in Firebase → Project Settings → Android app. EAS shows this after first build.

**Permission denied** → Deploy rules: `firebase deploy --only firestore:rules`

**google-services.json not found** → Must be in root `/hearth/` folder, not in `/src/`

---

## Future features ready to add

- Push notifications for bill reminders (FCM already wired)
- Dark mode (theme tokens ready)
- Recurring bills/events
- Recipe book
- Google Play Store (change `buildType` to `aab` in eas.json)
