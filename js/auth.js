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

// Variable global para acceder al usuario actual desde cualquier JS
window.usuarioActual = null;

// Función para proteger todas las páginas (excepto login.html)
export function protegerPagina() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Usuario logueado → guardamos en variable global
      window.usuarioActual = user;
      console.log("Usuario logueado:", user.uid);
      // Si tienes una función principal en la página (ej: cargarDatos(), iniciarDashboard(), etc.)
      // la llamas aquí o déjala en el script de cada página
    } else {
      // No hay usuario → redirige al login
      if (window.location.pathname !== '/login.html' && window.location.pathname !== '/') {
        window.location.href = 'login.html';
      }
    }
  });
}

// Función opcional para cerrar sesión (puedes llamarla desde un botón)
export function cerrarSesion() {
  signOut(auth).then(() => {
    window.location.href = 'login.html';
  }).catch((error) => {
    console.error("Error al cerrar sesión:", error);
  });
}

export { auth, app };