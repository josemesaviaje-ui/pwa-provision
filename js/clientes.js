/* =========================
   CLIENTES
========================= */

let ultimoClienteEliminado = null;
let timeoutDeshacer = null;

/* =========================
   CREAR CLIENTE
========================= */

function crearCliente() {
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

  const clientes = getClientes();

  // VALIDAR CÓDIGO ÚNICO
  if (clientes.some(c => c.codigo?.toLowerCase() === codigo.toLowerCase())) {
    showToast("Ya existe un cliente con ese código");
    return;
  }

  const cliente = {
    id: crypto.randomUUID(),
    codigo,
    nombre,
    direccion,
    condiciones: [],
    movimientos: []
  };

  addCliente(cliente);

  codigoInput.value = "";
  nombreInput.value = "";
  direccionInput.value = "";

  renderClientes();
  showToast("Cliente creado");
}

/* =========================
   RENDER CLIENTES
========================= */

function renderClientes() {
  const cont = document.getElementById("listaClientes");

  const texto =
    document.getElementById("buscarCliente")?.value.toLowerCase() || "";

  const clientes = getClientes()
    .filter(c =>
      c.nombre.toLowerCase().includes(texto) ||
      (c.codigo && c.codigo.toLowerCase().includes(texto))
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  cont.innerHTML = "";

  if (!clientes.length) {
    cont.innerHTML = `
      <div class="empty-state">
        <span>👥</span>
        No hay clientes que coincidan
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

function eliminarCliente(id) {
  const clientes = getClientes();
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  ultimoClienteEliminado = cliente;

  deleteCliente(id);
  renderClientes();

  showToast("Cliente eliminado · Deshacer");

  clearTimeout(timeoutDeshacer);
  timeoutDeshacer = setTimeout(() => {
    ultimoClienteEliminado = null;
  }, 4000);
}

function deshacerEliminarCliente() {
  if (!ultimoClienteEliminado) return;

  addCliente(ultimoClienteEliminado);
  ultimoClienteEliminado = null;

  renderClientes();
  showToast("Cliente restaurado");
}

/* =========================
   CLICK TOAST
========================= */

document.addEventListener("click", e => {
  if (
    e.target.classList.contains("toast") &&
    e.target.textContent.includes("Deshacer")
  ) {
    deshacerEliminarCliente();
  }
});

/* INIT */
renderClientes();