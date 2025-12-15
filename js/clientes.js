/* =========================
   CLIENTES - Versión Firestore DEFINITIVA
========================= */

import { agregar, eliminar } from './firestore.js';
import { db, collection, query, where, onSnapshot } from './firestore.js';  // Importamos lo necesario

let ultimoClienteEliminado = null;
let timeoutDeshacer = null;

let clientes = [];  // Array global con los clientes cargados de Firestore

let unsubscribeClientes = null;  // Para cancelar la escucha si es necesario

/* =========================
   CARGAR CLIENTES EN TIEMPO REAL
========================= */

function iniciarEscuchaClientes() {
  const q = query(collection(db, "clientes"));

  unsubscribeClientes = onSnapshot(q, (snapshot) => {
    clientes = [];
    snapshot.forEach((doc) => {
      clientes.push({ id: doc.id, ...doc.data() });
    });

    // Ordenar por nombre
    clientes.sort((a, b) => a.nombre.localeCompare(b.nombre));

    renderClientes();
  }, (error) => {
    console.error("Error cargando clientes:", error);
    showToast("Error al cargar clientes");
  });
}

/* =========================
   CREAR CLIENTE
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

  // Validar código único
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

    // Limpiar formulario
    codigoInput.value = "";
    nombreInput.value = "";
    direccionInput.value = "";

    showToast("Cliente creado correctamente");
    // No necesitas renderClientes() → el listener lo hace solo

  } catch (error) {
    showToast("Error al crear cliente");
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

  const clientesFiltrados = clientes
    .filter(c =>
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

      <a href="cliente.html?id=${cliente.id}">
        ➡️ Ver cliente
      </a><br><br>

      <button class="btn-danger"
        onclick="eliminarCliente('${cliente.id}')">
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
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  ultimoClienteEliminado = cliente;

  try {
    await eliminar('clientes', id);

    showToast("Cliente eliminado · Deshacer");

    clearTimeout(timeoutDeshacer);
    timeoutDeshacer = setTimeout(() => {
      ultimoClienteEliminado = null;
    }, 4000);

  } catch (error) {
    showToast("Error al eliminar cliente");
    console.error(error);
  }
}

async function deshacerEliminarCliente() {
  if (!ultimoClienteEliminado) return;

  try {
    await agregar('clientes', {
      codigo: ultimoClienteEliminado.codigo,
      nombre: ultimoClienteEliminado.nombre,
      direccion: ultimoClienteEliminado.direccion || ''
    });

    ultimoClienteEliminado = null;
    showToast("Cliente restaurado");

  } catch (error) {
    showToast("Error al restaurar");
    console.error(error);
  }
}

/* =========================
   CLICK TOAST PARA DESHACER
========================= */

document.addEventListener("click", e => {
  if (e.target.classList.contains("toast") && e.target.textContent.includes("Deshacer")) {
    deshacerEliminarCliente();
  }
});

/* =========================
   INIT
========================= */

iniciarEscuchaClientes();