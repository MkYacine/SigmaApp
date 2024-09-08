/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {Timestamp} from "firebase-admin/firestore";

admin.initializeApp({
  credential: admin.credential.cert("./serviceAccountKey.json"),
});

const db = admin.firestore();

export const schedulePushNotification = functions.firestore
  .document("events/{eventId}")
  .onCreate(async (snap, context) => {
    const event = snap.data();
    const eventId = context.params.eventId;

    if (event && event.startDate) {
      const notificationTime = new Date(event.startDate.toDate().getTime()-
       - 30 * 60 * 1000);
      const now = new Date();

      if (notificationTime > now) {
        await db.collection("notifications").add({
          eventId: eventId,
          title: event.title,
          body: `Event "${event.title}" starts in 30 minutes!`,
          scheduledTime: Timestamp.fromDate(notificationTime),
          sent: false,
        });
      }
    }
  });

export const sendScheduledNotifications = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();

    const query = db.collection("notifications")
      .where("scheduledTime", "<=", now)
      .where("sent", "==", false)
      .limit(100);

    const snapshot = await query.get();

    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];

    for (const notification of notifications) {
      const event = await db
        .collection("events")
        .doc(notification.eventId)
        .get();
      const eventData = event.data();

      if (eventData && eventData.assignedMembers) {
        for (const userId of eventData.assignedMembers) {
          const userDoc = await db.collection("users").doc(userId).get();
          const userData = userDoc.data();

          if (userData && userData.expoPushToken) {
            await admin.messaging().send({
              token: userData.expoPushToken,
              notification: {
                title: notification.title,
                body: notification.body,
              },
            });
          }
        }
      }

      await db
        .collection("notifications")
        .doc(notification.id)
        .update({sent: true});
    }
  });

interface Notification {
  id: string;
  eventId: string;
  title: string;
  body: string;
  scheduledTime: FirebaseFirestore.Timestamp;
  sent: boolean;
}
