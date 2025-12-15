// js/firestore.js
import { getFirestore, collection, addDoc, doc, setDoc, deleteDoc, query, where, onSnapshot, writeBatch, getDoc, updateDoc, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./auth.js";  // Reutiliza la app inicializada en auth.js

const db = getFirestore(app);

// === IMPORTANTE: Activar persistencia offline (solo una vez) ===
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Múltiples pestañas abiertas, offline solo en una");
    } else if (err.code === 'unimplemented') {
      console.warn("Navegador no soporta persistencia offline");
    }
  });

// Funciones de ejemplo que puedes usar en toda la app
export async function agregarDocumento(coleccion, datos) {
  if (!window.usuarioActual) throw new Error("Usuario no autenticado");
  
  datos.usuarioId = window.usuarioActual.uid;  // Siempre guardamos el dueño
  datos.fechaCreacion = new Date();

  return await addDoc(collection(db, coleccion), datos);
}

export async function actualizarDocumento(coleccion, id, datos) {
  if (!window.usuarioActual) throw new Error("Usuario no autenticado");
  
  const ref = doc(db, coleccion, id);
  const snapshot = await getDoc(ref);
  if (snapshot.data().usuarioId !== window.usuarioActual.uid) {
    throw new Error("No tienes permiso para editar este documento");
  }

  return await updateDoc(ref, datos);
}

export async function eliminarDocumento(coleccion, id) {
  if (!window.usuarioActual) throw new Error("Usuario no autenticado");
  
  const ref = doc(db, coleccion, id);
  const snapshot = await getDoc(ref);
  if (snapshot.data().usuarioId !== window.usuarioActual.uid) {
    throw new Error("No tienes permiso");
  }

  return await deleteDoc(ref);
}

// Escuchar cambios en tiempo real solo de mis datos
export function escucharColeccion(coleccion, callback) {
  if (!window.usuarioActual) return;

  const q = query(
    collection(db, coleccion),
    where("usuarioId", "==", window.usuarioActual.uid)
  );

  return onSnapshot(q, (snapshot) => {
    const cambios = [];
    snapshot.docChanges().forEach((change) => {
      cambios.push({
        tipo: change.type,        // added, modified, removed
        doc: change.doc.data(),
        id: change.doc.id
      });
    });
    callback(cambios);
  });
}

export { db, collection, doc, writeBatch };