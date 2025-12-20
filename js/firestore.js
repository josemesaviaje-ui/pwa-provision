// js/firestore.js
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { app } from "./auth.js";

const db = getFirestore(app);

// Offline PWA
enableIndexedDbPersistence(db).catch(() => {});

export { db, collection, doc };

// CREATE
export function crear(coleccion, datos) {
  return addDoc(collection(db, coleccion), {
    ...datos,
    usuarioId: window.usuarioActual.uid,
    createdAt: serverTimestamp()
  });
}

// UPDATE
export function actualizar(coleccion, id, datos) {
  return updateDoc(doc(db, coleccion, id), datos);
}

// DELETE
export function eliminar(coleccion, id) {
  return deleteDoc(doc(db, coleccion, id));
}

// REALTIME
export function escuchar(coleccion, filtros, callback) {
  let q = query(
    collection(db, coleccion),
    where("usuarioId", "==", window.usuarioActual.uid),
    ...filtros
  );

  return onSnapshot(q, (snap) => {
    const lista = [];
    snap.forEach(d => lista.push({ id: d.id, ...d.data() }));
    callback(lista);
  });
}