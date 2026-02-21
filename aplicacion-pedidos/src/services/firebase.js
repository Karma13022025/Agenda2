import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCWJm-YOiR-Lu5ZBpC0WEJO-VQIMW3TqEU",
  authDomain: "agenda2-f5675.firebaseapp.com",
  projectId: "agenda2-f5675",
  storageBucket: "agenda2-f5675.firebasestorage.app",
  messagingSenderId: "1097315758481",
  appId: "1:1097315758481:web:e0be0b798343c25ab6aa30"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app); 
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();