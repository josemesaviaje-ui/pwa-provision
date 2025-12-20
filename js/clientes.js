/* =========================
   CLIENTES - VERSIÓN FINAL QUE FUNCIONA
========================= */

import { db, collection, addDoc, onSnapshot, deleteDoc, doc } from './firestore.js';
import { auth } from './auth.js';

let clientes = [];

// Render de la lista
function renderClientes() {
  const cont = document.getElementById("listaClientes");
  if (!cont) return;

  const texto = document.getElementById("buscarCliente")?.value.toLowerCase() || "";

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(texto) ||
    (c.codigo && c.codigo.toLowerCase().includes(texto))
  );

  cont.innerHTML = "";

  if (filtrados.length === 0) {
    cont.innerHTML = `
      <div class="empty-state">
        <span>👥</span>
        No hay clientes que coincidan
      </div>
    `;
    return;
  }

  filtrados.forEach(c => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <strong>${c.nombre}</strong><br>
      <small>Código: ${c.codigo || "—"}</small><br>
      ${c.direccion ? `<small>${c.direccion}</small><br>` : ""}
      <br>
      <a href="cliente.html?id=${c.id}">➡️ Ver cliente</a><br><br>
      <button class="btn-danger" onclick="eliminarCliente('${c.id}')">
        Eliminar
      </button>
    `;
    cont.appendChild(card);
  });
}

// Carga en tiempo real
onSnapshot(collection(db, "clientes"), (snapshot) => {
  clientes = [];
  snapshot.forEach((doc) => {
    clientes.push({ id: doc.id, ...doc.data() });
  });
  clientes.sort((a, b) => a.nombre.localeCompare(b.nombre));
  renderClientes();
});

// Crear cliente - GLOBAL para onclick
window.crearCliente = async function() {
  const codigo = document.getElementById("codigoCliente").value.trim();
  const nombre = document.getElementById("nombreCliente").value.trim();
  const direccion = document.getElementById("direccionCliente").value.trim();

  if (!codigo || !nombre) {
    showToast("Código y nombre son obligatorios");
    return;
  }

  if (clientes.some(c => c.codigo?.toLowerCase() === codigo.toLowerCase())) {
    showToast("Ya existe un cliente con ese código");
    return;
  }

  try {
    await addDoc(collection(db, "clientes"), {
      usuarioId: auth.currentUser.uid,
      codigo,
      nombre,
      direccion: direccion || ''
    });

    // Limpiar campos
    document.getElementById("codigoCliente").value = "";
    document.getElementById("nombreCliente").value = "";
    document.getElementById("direccionCliente").value = "";

    showToast("Cliente creado correctamente");

  } catch (error) {
    showToast("Error al crear cliente");
    console.error(error);
  }
};

// Eliminar cliente - GLOBAL para onclick
window.eliminarCliente = async function(id) {
  if (!confirm("¿Eliminar este cliente y todos sus datos?")) return;

  try {
    await deleteDoc(doc(db, "clientes", id));
    showToast("Cliente eliminado");
  } catch (error) {
    showToast("Error al eliminar");
    console.error(error);
  }
};