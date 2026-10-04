import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBF9wOvyND4YIGE_VZ9GtOQCfqgtIFBptA",
  authDomain: "rugby-coach-5d82b.firebaseapp.com",
  projectId: "rugby-coach-5d82b",
  storageBucket: "rugby-coach-5d82b.firebasestorage.app",
  messagingSenderId: "846611573269",
  appId: "1:846611573269:web:33ed7a55f1c47b6a673c1c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
