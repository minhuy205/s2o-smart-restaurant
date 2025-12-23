// clients/guest-web/utils/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  // --- COPY TỪ FIREBASE CONSOLE ---
  apiKey: "AIzaSyD4IJw1x92RbBchKezFkEuHzsUynJ2nsA8", 
  authDomain: "s2o-restaurant.firebaseapp.com",
  projectId: "s2o-restaurant",
  storageBucket: "s2o-restaurant.firebasestorage.app",
  messagingSenderId: "669538036774",
  appId: "1:669538036774:web:0a089b6a5d30b089ab4ae7",
  // --------------------------------
};

let messaging = null;
let app = null;

if (typeof window !== "undefined") {
  try {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  } catch (err) {
    console.error("Firebase init error:", err);
  }
}

export const requestForToken = async () => {
  if (!messaging) return null;
  try {
    const currentToken = await getToken(messaging, { 
      // VapidKey lấy ở: Firebase Console -> Cloud Messaging -> Web configuration -> Generate Key pair
      vapidKey: 'BGbkuuGh4Z-Ogq_gfG1xrMOd-c-yN1e6ByRFy4jdL41DhUtmTxQ5SQXdXWN8txREEFh9k-G7ySQPcjjXUgJ6pSQ' 
    });
    if (currentToken) {
      console.log("FCM Token:", currentToken);
      return currentToken;
    } else {
      console.log("No registration token available.");
      return null;
    }
  } catch (err) {
    console.log("An error occurred while retrieving token. ", err);
    return null;
  }
};