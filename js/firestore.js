// js/firestore.js
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, query, where, onSnapshot, writeBatch, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./auth.js";

const db = getFirestore(app);

// Activar offline (imprescindible para PWA)
enableIndexedDbPersistence(db).catch((err) => {
  console.warn("Offline no disponible:", err);
});

export { db, collection, doc, writeBatch };

// Función genérica para agregar
export async function agregar(coleccion, datos) {
  datos.usuarioId = window.usuarioActual.uid;
  datos.fechaCreacion = new Date();
  return await addDoc(collection(db, coleccion), datos);
}

// Actualizar
export async function actualizar(coleccion, id, datos) {
  const ref = doc(db, coleccion, id);
  return await updateDoc(ref, datos);
}

// Eliminar
export async function eliminar(coleccion, id) {
  const ref = doc(db, coleccion, id);
  return await deleteDoc(ref);
}

// Escuchar en tiempo real solo mis datos
export function escuchar(coleccion, callback) {
  const q = query(collection(db, coleccion), where("usuarioId", "==", window.usuarioActual.uid));
  return onSnapshot(q, (snapshot) => {
    const lista = [];
    snapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() });
    });
    callback(lista);
  });
}