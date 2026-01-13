import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyD6Vfk-5ndY7hpuyzsm0B-XeAJo_XGgCEo",
  authDomain: "s20-smart-restaurant.firebaseapp.com",
  projectId: "s20-smart-restaurant",
  storageBucket: "s20-smart-restaurant.firebasestorage.app",
  messagingSenderId: "55637303148",
  appId: "1:55637303148:web:3f8a21db1605aa94b95d49",
  measurementId: "G-K7VH5982FP"
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
      vapidKey: 'BDqwO6Ohv0XdMfxzXzKkgVsweHVgBCnVwNLeR2yt1Rt0v2_gX2hSAvgnj511ZxW8KuHlF9eO839I1_P7VslSBeE' 
    });
    if (currentToken) {
      console.log("🔥 FCM Token:", currentToken);
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

// 🔥 HÀM MỚI: Lắng nghe tin nhắn khi đang mở Web (Ting Ting!)
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      console.log("📩 Nhận tin nhắn foreground:", payload);
      resolve(payload);
    });
  });