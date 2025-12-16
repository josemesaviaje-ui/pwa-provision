/* =========================
   FIREBASE CDN (SIN NPM)
========================= */

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import { getFirestore } from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously
} from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* =========================
   CONFIG
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyCc5Bo9fLAF0FR3m2m6RWYH2QsSvsztOik",
  authDomain: "provisiones-pwa.firebaseapp.com",
  projectId: "provisiones-pwa",
  storageBucket: "provisiones-pwa.firebasestorage.app",
  messagingSenderId: "4278805330",
  appId: "1:4278805330:web:738dc43f624bad2fe3508b"
};

/* =========================
   INIT
========================= */

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const auth = getAuth(app);
signInAnonymously(auth)
  .then(() => console.log("Auth anónima OK"))
  .catch(err => console.error("Auth error", err));