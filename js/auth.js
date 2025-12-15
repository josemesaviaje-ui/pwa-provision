import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = { /* TU CONFIG */ };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };

export function protegerPagina() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // No hay usuario logueado → redirige al login
      window.location.href = 'login.html';
    } else {
      console.log('Usuario logueado:', user.uid);
      // Aquí puedes guardar el UID para usarlo en Firestore
      window.usuarioActual = user;
      // Continúa cargando la página normalmente
      iniciarApp(); // Llama a tu función principal si la tienes
    }
  });
}