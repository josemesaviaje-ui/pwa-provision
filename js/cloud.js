/* =========================
   FIREBASE CDN (SIN NPM)
========================= */

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously
} from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* =========================
   CONFIG (PEGA LA TUYA)
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
const db = getFirestore(app);
const auth = getAuth(app);

/* =========================
   AUTH ANÓNIMA
========================= */

let userId = null;

signInAnonymously(auth)
  .then(res => {
    userId = res.user.uid;
    console.log("Auth OK:", userId);
    syncFromCloud();
  })
  .catch(err => {
    console.error("Auth error", err);
  });

/* =========================
   SYNC
========================= */

async function syncToCloud() {
  if (!userId) return;
  await setDoc(doc(db, "usuarios", userId), {
    data: getData(),
    updatedAt: Date.now()
  });
}

async function syncFromCloud() {
  if (!userId) return;
  const ref = doc(db, "usuarios", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  saveData(snap.data().data);
  showToast("Datos sincronizados");
}