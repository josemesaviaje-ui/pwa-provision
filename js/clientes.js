/* =========================
   CLIENTES - Versión Firestore DEFINITIVA (con creación funcionando)
========================= */

import { agregar, eliminar } from './firestore.js';
import { db, collection, onSnapshot } from './firestore.js';

let clientes = [];

let unsubscribeClientes = null;

/* =========================
   INICIAR ESCUCHA EN TIEMPO REAL
========================= */

function iniciarEscuchaClientes() {
  unsubscribeClientes = onSnapshot(collection(db, "clientes"), (snapshot) => {
    clientes = [];
    snapshot.forEach((doc) => {
      clientes.push({ id: doc.id, ...doc.data() });
    });
    clientes.sort((a, b) => a.nombre.localeCompare(b.nombre));
    renderClientes();
  });
}

/* =========================
   CREAR CLIENTE (CORREGIDO)
========================= */

async function crearCliente() {
  const codigoInput = document.getElementById("codigoCliente");
  const nombreInput = document.getElementById("nombreCliente");
  const direccionInput = document.getElementById("direccionCliente");

  const codigo = codigoInput.value.trim();
  const nombre = nombreInput.value.trim();
  const direccion = direccionInput.value.trim();

  if (!codigo || !nombre) {
    showToast("Código y nombre son obligatorios");
    return;
  }

  // Validar código único (usando la lista actual)
  if (clientes.some(c => c.codigo?.toLowerCase() === codigo.toLowerCase())) {
    showToast("Ya existe un cliente con ese código");
    return;
  }

  try {
    await agregar('clientes', {
      codigo,
      nombre,
      direccion: direccion || ''
    });

    // Limpiar inputs
    codigoInput.value = "";
    nombreInput.value = "";
    direccionInput.value = "";

    showToast("Cliente creado correctamente");
    // El listener actualizará la lista automáticamente

  } catch (error) {
    showToast("Error al crear el cliente");
    console.error(error);
  }
}

/* =========================
   RENDER CLIENTES
========================= */

function renderClientes() {
  const cont = document.getElementById("listaClientes");
  if (!cont) return;

  const texto = document.getElementById("buscarCliente")?.value.toLowerCase() || "";

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(texto) ||
    (c.codigo && c.codigo.toLowerCase().includes(texto))
  );

  cont.innerHTML = "";

  if (!clientesFiltrados.length) {
    cont.innerHTML = `
      <div class="empty-state">
        <span>👥</span>
        No hay clientes que coincidan
      </div>
    `;
    return;
  }

  clientesFiltrados.forEach(cliente => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <strong>${cliente.nombre}</strong><br>
      <small>Código: ${cliente.codigo || "—"}</small><br>
      ${cliente.direccion ? `<small>${cliente.direccion}</small><br>` : ""}
      <br>
      <a href="cliente.html?id=${cliente.id}">➡️ Ver cliente</a><br><br>
      <button class="btn-danger" onclick="eliminarCliente('${cliente.id}')">
        Eliminar
      </button>
    `;

    cont.appendChild(card);
  });
}

/* =========================
   ELIMINAR + DESHACER
========================= */

async function eliminarCliente(id) {
  if (!confirm("¿Eliminar este cliente y todos sus datos?")) return;

  try {
    await eliminar('clientes', id);
    showToast("Cliente eliminado");
  } catch (error) {
    showToast("Error al eliminar");
  }
}

/* =========================
   INIT
========================= */

iniciarEscuchaClientes();