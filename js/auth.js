// js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCc5Bo9fLAF0FR3m2m6RWYH2QsSvsztOik",
  authDomain: "provisiones-pwa.firebaseapp.com",
  projectId: "provisiones-pwa",
  storageBucket: "provisiones-pwa.firebasestorage.app",
  messagingSenderId: "4278805330",
  appId: "1:4278805330:web:738dc43f624bad2fe3508b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.usuarioActual = null;

export function protegerPagina(callbackDespuesLogin = null) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.usuarioActual = user;
      console.log("Logueado:", user.uid);
      if (callbackDespuesLogin) callbackDespuesLogin();
    } else {
      window.location.href = 'login.html';
    }
  });
}

export function cerrarSesion() {
  signOut(auth).then(() => {
    window.location.href = 'login.html';
  });
}

export { auth, app };