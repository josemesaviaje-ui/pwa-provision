/* =========================
   CLIENTES (FIRESTORE REALTIME)
========================= */

import {
  db,
  collection,
  agregar,
  eliminar
} from "./firestore.js";

import {
  query,
  orderBy,
  onSnapshot,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let clientesCache = [];
let ultimoClienteEliminado = null;
let timeoutDeshacer = null;

/* =========================
   ESCUCHAR CLIENTES (TIEMPO REAL)
========================= */

const q = query(
  collection(db, "clientes"),
  where("usuarioId", "==", window.usuarioActual.uid),
  orderBy("nombre")
);

onSnapshot(q, snapshot => {
  clientesCache = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  renderClientes();
});

/* =========================
   CREAR CLIENTE
========================= */

window.crearCliente = async function () {
  const codigoInput = document.getElementById("codigoCliente");
  const nombreInput = document.getElementById("nombreCliente");
  const direccionInput = document.getElementById("direccionCliente");

  const codigo = codigoInput.value.trim();
  const nombre = nombreInput.value.trim();
  const direccion = direccionInput.value.trim();

  if (!codigo) {
    showToast("El código de cliente es obligatorio");
    return;
  }

  if (!nombre) {
    showToast("El nombre del cliente es obligatorio");
    return;
  }

  if (
    clientesCache.some(
      c => c.codigo?.toLowerCase() === codigo.toLowerCase()
    )
  ) {
    showToast("Ya existe un cliente con ese código");
    return;
  }

  await agregar("clientes", {
    codigo,
    nombre,
    direccion
  });

  codigoInput.value = "";
  nombreInput.value = "";
  direccionInput.value = "";

  showToast("Cliente creado");
};

/* =========================
   RENDER CLIENTES
========================= */

function renderClientes() {
  const cont = document.getElementById("listaClientes");
  if (!cont) return;

  const texto =
    document.getElementById("buscarCliente")?.value.toLowerCase() || "";

  const clientes = clientesCache.filter(c =>
    c.nombre.toLowerCase().includes(texto) ||
    (c.codigo && c.codigo.toLowerCase().includes(texto))
  );

  cont.innerHTML = "";

  if (!clientes.length) {
    cont.innerHTML = `
      <div class="empty-state">
        <span>👥</span>
        No hay clientes
      </div>
    `;
    return;
  }

  clientes.forEach(cliente => {
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

window.eliminarCliente = async function (id) {
  const cliente = clientesCache.find(c => c.id === id);
  if (!cliente) return;

  ultimoClienteEliminado = cliente;

  await eliminar("clientes", id);
  showToast("Cliente eliminado · Deshacer");

  clearTimeout(timeoutDeshacer);
  timeoutDeshacer = setTimeout(() => {
    ultimoClienteEliminado = null;
  }, 4000);
};

window.deshacerEliminarCliente = async function () {
  if (!ultimoClienteEliminado) return;

  await agregar("clientes", {
    codigo: ultimoClienteEliminado.codigo,
    nombre: ultimoClienteEliminado.nombre,
    direccion: ultimoClienteEliminado.direccion
  });

  ultimoClienteEliminado = null;
  showToast("Cliente restaurado");
};

/* =========================
   CLICK EN TOAST
========================= */

document.addEventListener("click", e => {
  if (
    e.target.classList.contains("toast") &&
    e.target.textContent.includes("Deshacer")
  ) {
    deshacerEliminarCliente();
  }
});