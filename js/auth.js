// js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCc5Bo9fLAF0FR3m2m6RWYH2QsSvsztOik",
  authDomain: "provisiones-pwa.firebaseapp.com",
  projectId: "provisiones-pwa",
  storageBucket: "provisiones-pwa.firebasestorage.app",
  messagingSenderId: "4278805330",
  appId: "1:4278805330:web:738dc43f624bad2fe3508b"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export let usuarioActual = null;

signInAnonymously(auth);

onAuthStateChanged(auth, (user) => {
  if (user) {
    usuarioActual = user;
    window.usuarioActual = user; // accesible global
    console.log("Auth OK:", user.uid);
    document.dispatchEvent(new Event("auth-ready"));
  }
});