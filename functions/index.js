// functions/index.js
// Deploy with: firebase deploy --only functions
//
// Prerequisites:
//   npm install -g firebase-tools
//   cd functions && npm install
//   firebase login
//   firebase use --add   (select your Hearth project)

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// ── Run every day at 9am UTC ───────────────────────────────
exports.dailyBillReminders = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('Europe/London')
  .onRun(async () => {
    const today = new Date();
    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);
    const in3Str = in3Days.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const householdsSnap = await db.collection('households').get();

    for (const householdDoc of householdsSnap.docs) {
      const billsSnap = await db
        .collection('households').doc(householdDoc.id)
        .collection('bills')
        .where('dueDate', '>=', todayStr)
        .where('dueDate', '<=', in3Str)
        .get();

      if (billsSnap.empty) continue;

      const members = householdDoc.data().members || {};
      const memberUids = Object.keys(members);

      for (const uid of memberUids) {
        const userDoc = await db.collection('users').doc(uid).get();
        const pushToken = userDoc.data()?.pushToken;
        if (!pushToken) continue;

        for (const billDoc of billsSnap.docs) {
          const bill = billDoc.data();
          if (bill.status === 'paid' || bill.status === 'auto') continue;

          const daysUntil = Math.ceil((new Date(bill.dueDate) - today) / 86400000);
          const dueText = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;

          await messaging.send({
            token: pushToken,
            notification: {
              title: `${bill.icon || '💳'} Bill due ${dueText}`,
              body: `${bill.name} — £${parseFloat(bill.amount).toFixed(2)}`,
            },
            android: {
              notification: { channelId: 'hearth-default', color: '#C4622D' }
            },
          });
        }
      }
    }

    return null;
  });

// ── Notify partner when a shared event is created ──────────
exports.onEventCreated = functions.firestore
  .document('households/{householdId}/events/{eventId}')
  .onCreate(async (snap, context) => {
    const event = snap.data();
    if (event.who !== 'both' && event.who !== 'partner') return null;

    const householdDoc = await db.collection('households').doc(context.params.householdId).get();
    const members = householdDoc.data()?.members || {};

    // Notify everyone except the creator
    for (const [uid, member] of Object.entries(members)) {
      if (uid === event.createdBy) continue;
      const userDoc = await db.collection('users').doc(uid).get();
      const pushToken = userDoc.data()?.pushToken;
      if (!pushToken) continue;

      await messaging.send({
        token: pushToken,
        notification: {
          title: '📅 New event added',
          body: `${event.title} — ${event.date}${event.time ? ' at ' + event.time : ''}`,
        },
        android: {
          notification: { channelId: 'hearth-default', color: '#C4622D' }
        },
      });
    }

    return null;
  });

// ── Notify partner when a bill is marked paid ──────────────
exports.onBillUpdated = functions.firestore
  .document('households/{householdId}/bills/{billId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status === after.status) return null;
    if (after.status !== 'paid') return null;

    const householdDoc = await db.collection('households').doc(context.params.householdId).get();
    const members = householdDoc.data()?.members || {};

    for (const [uid] of Object.entries(members)) {
      if (uid === after.updatedBy) continue;
      const userDoc = await db.collection('users').doc(uid).get();
      const pushToken = userDoc.data()?.pushToken;
      if (!pushToken) continue;

      await messaging.send({
        token: pushToken,
        notification: {
          title: '✅ Bill paid',
          body: `${after.name} (£${parseFloat(after.amount).toFixed(2)}) has been marked as paid`,
        },
        android: {
          notification: { channelId: 'hearth-default', color: '#7A8C6E' }
        },
      });
    }

    return null;
  });
