// js/storage.js - Versión con Cloud Firestore

import { agregar, actualizar, eliminar, escuchar, db } from './firestore.js';

// Variables globales para cachear los datos (opcional, pero útil para acceso rápido)
let clientesCache = [];

// === CLIENTES ===
export function escucharClientes(callback) {
  return escuchar('clientes', (lista) => {
    clientesCache = lista;
    callback(lista);
  });
}

export function getClientes() {
  return clientesCache;  // Devuelve el caché (siempre actualizado por el listener)
}

export async function addCliente(cliente) {
  try {
    const docRef = await agregar('clientes', {
      codigo: cliente.codigo,
      nombre: cliente.nombre,
      direccion: cliente.direccion || ''
    });
    return { id: docRef.id, ...cliente };  // Devuelve el cliente con su nuevo ID de Firestore
  } catch (error) {
    console.error("Error añadiendo cliente:", error);
    throw error;
  }
}

export async function updateCliente(id, nuevosDatos) {
  try {
    await actualizar('clientes', id, nuevosDatos);
  } catch (error) {
    console.error("Error actualizando cliente:", error);
    throw error;
  }
}

export async function deleteCliente(id) {
  try {
    await eliminar('clientes', id);
  } catch (error) {
    console.error("Error eliminando cliente:", error);
    throw error;
  }
}

// === INICIALIZACIÓN GLOBAL (llamar desde las páginas principales) ===
export function iniciarEscuchaGlobal() {
  escucharClientes(() => {
    // Se ejecuta cada vez que cambian los clientes
    // Puedes añadir aquí listeners para otras colecciones si las tienes
  });
}