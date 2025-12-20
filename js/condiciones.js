// js/condiciones.js
import { crear, eliminar, escuchar, actualizar } from "./firestore.js";

const params = new URLSearchParams(location.search);
const clienteId = params.get("id");

let cliente = null;
let condiciones = [];
let movimientos = [];
let ultimoMovimientoEliminado = null;
let timeoutDeshacerMovimiento = null;

/* =========================
   ESCUCHAR FIRESTORE
========================= */

document.addEventListener("auth-ready", () => {
  escuchar("clientes", [], lista => {
    cliente = lista.find(c => c.id === clienteId);
    if (cliente) renderCliente();
  });

  escuchar("condiciones", [
    ["clienteId", "==", clienteId]
  ], lista => {
    condiciones = lista;
    renderCondiciones();
  });

  escuchar("movimientos", [
    ["clienteId", "==", clienteId]
  ], lista => {
    movimientos = lista.sort((a, b) => a.fecha.localeCompare(b.fecha));
    renderMovimientos();
    renderSaldo();
  });
});

/* =========================
   RENDER DATOS CLIENTE
========================= */

function renderCliente() {
  if (!cliente) return;
  document.getElementById("clienteCodigo").value = cliente.codigo || "";
  document.getElementById("clienteNombre").value = cliente.nombre || "";
  document.getElementById("clienteDireccion").value = cliente.direccion || "";
}

window.guardarDatosCliente = async function () {
  if (!cliente) return;
  const codigo = document.getElementById("clienteCodigo").value.trim();
  const nombre = document.getElementById("clienteNombre").value.trim();
  const direccion = document.getElementById("clienteDireccion").value.trim();

  if (!codigo || !nombre) return alert("Código y nombre son obligatorios");

  await actualizar("clientes", cliente.id, { codigo, nombre, direccion });
  alert("Datos actualizados");
};

/* =========================
   CREAR CONDICIONES / MOVIMIENTOS
========================= */

window.crearCondicion = function () {
  const nueva = {
    clienteId,
    porcentaje: Number(document.getElementById("porcentaje").value),
    fechaInicio: document.getElementById("fechaInicio").value,
    fechaFin: document.getElementById("fechaFin").value
  };

  if (!nueva.porcentaje || !nueva.fechaInicio || !nueva.fechaFin || nueva.fechaInicio > nueva.fechaFin) {
    return alert("Datos incorrectos");
  }

  if (condiciones.some(c => !(nueva.fechaFin < c.fechaInicio || nueva.fechaInicio > c.fechaFin))) {
    return alert("La condición se solapa con otra");
  }

  crear("condiciones", nueva);
};

window.crearCompra = function () {
  const fecha = document.getElementById("fechaCompra").value;
  const condicion = condiciones.find(c => fecha >= c.fechaInicio && fecha <= c.fechaFin);
  if (!condicion) return alert("No hay condición activa");

  const importe = Number(document.getElementById("importeCompra").value);

  crear("movimientos", {
    clienteId,
    tipo: "compra",
    concepto: document.getElementById("conceptoCompra").value,
    importe,
    fecha,
    porcentaje: condicion.porcentaje,
    provision: importe * condicion.porcentaje / 100
  });
};

window.crearCargo = function () {
  crear("movimientos", {
    clienteId,
    tipo: "cargo",
    concepto: document.getElementById("conceptoCargo").value,
    importe: Number(document.getElementById("importeCargo").value),
    fecha: document.getElementById("fechaCargo").value
  });
};

/* =========================
   RENDER CONDICIONES
========================= */

function estadoCondicion(c) {
  const hoy = new Date().toISOString().split("T")[0];
  if (hoy < c.fechaInicio) return "Pendiente";
  if (hoy > c.fechaFin) return "Caducada";
  return "Activa";
}

function renderCondiciones() {
  const cont = document.getElementById("listaCondiciones");
  cont.innerHTML = "";
  if (!condiciones.length) {
    cont.innerHTML = "<div class='empty-state'>No hay condiciones</div>";
    return;
  }

  condiciones.forEach(c => {
    const div = document.createElement("div");
    div.className = "card";
    const estado = estadoCondicion(c);
    div.innerHTML = `
      <strong>${c.porcentaje}%</strong><br>
      ${c.fechaInicio} → ${c.fechaFin}<br>
      <span class="badge">${estado}</span><br>
      <button class="btn-danger" onclick="eliminarCondicion('${c.id}')">Eliminar</button>
    `;
    cont.appendChild(div);
  });
}

window.eliminarCondicion = function (id) {
  if (confirm("¿Eliminar condición?")) eliminar("condiciones", id);
};

/* =========================
   RENDER MOVIMIENTOS
========================= */

function renderMovimientos() {
  const cont = document.getElementById("listaMovimientos");
  cont.innerHTML = "";
  if (!movimientos.length) {
    cont.innerHTML = "<div class='empty-state'>No hay movimientos</div>";
    return;
  }

  movimientos.forEach(m => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <strong>${m.concepto}</strong><br>
      ${m.fecha}<br>
      ${m.tipo === "compra" ? `Provisión: ${m.provision.toFixed(2)} €` : `Cargo: -${m.importe} €`}<br>
      <button class="btn-danger" onclick="eliminarMovimiento('${m.id}')">Eliminar</button>
    `;
    cont.appendChild(div);
  });
}

/* =========================
   SALDO
========================= */

function renderSaldo() {
  const saldo = movimientos.reduce((s, m) => m.tipo === "compra" ? s + (m.provision || 0) : s - m.importe, 0);
  document.getElementById("saldoCliente").innerText = saldo.toFixed(2) + " €";
}

/* =========================
   ELIMINAR + DESHACER
========================= */

window.eliminarMovimiento = function (id) {
  ultimoMovimientoEliminado = movimientos.find(m => m.id === id);
  eliminar("movimientos", id);

  clearTimeout(timeoutDeshacerMovimiento);
  timeoutDeshacerMovimiento = setTimeout(() => {
    ultimoMovimientoEliminado = null;
  }, 4000);
};

window.deshacerEliminarMovimiento = function () {
  if (!ultimoMovimientoEliminado) return;
  crear("movimientos", ultimoMovimientoEliminado);
  ultimoMovimientoEliminado = null;
};