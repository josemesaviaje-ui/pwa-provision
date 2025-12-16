import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "./cloud.js";

/* =========================
   CACHE
========================= */

let clientesCache = [];

/* =========================
   ESCUCHA REALTIME
========================= */

export function iniciarEscuchaClientes() {
  const ref = collection(db, "clientes");

  onSnapshot(ref, snap => {
    clientesCache = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    document.dispatchEvent(new Event("clientes-updated"));
  });
}

export function getClientes() {
  return clientesCache;
}

export function getClienteById(id) {
  return clientesCache.find(c => c.id === id);
}

/* =========================
   CRUD CLIENTES
========================= */

export async function crearCliente(cliente) {
  await addDoc(collection(db, "clientes"), {
    ...cliente,
    condiciones: [],
    movimientos: []
  });
}

export async function actualizarCliente(id, data) {
  await updateDoc(doc(db, "clientes", id), data);
}

export async function eliminarCliente(id) {
  await deleteDoc(doc(db, "clientes", id));
}