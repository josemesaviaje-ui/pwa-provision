/* =====================================================
   CLIENTE DETAIL - Firestore (VERSIÓN FINAL FUNCIONAL)
===================================================== */

import {
  db,
  doc,
  collection,
  query,
  where,
  onSnapshot
} from './firestore.js';

import {
  agregar,
  actualizar,
  eliminar
} from './firestore.js';

/* =====================================================
   PARAMS
===================================================== */

const params = new URLSearchParams(window.location.search);
const clienteId = params.get("id");

if (!clienteId) {
  showToast("Cliente no encontrado");
  window.location.href = "clientes.html";
}

/* =====================================================
   ELEMENTOS DOM  🔴 OBLIGATORIO
===================================================== */

const clienteCodigo = document.getElementById("clienteCodigo");
const clienteNombre = document.getElementById("clienteNombre");
const clienteDireccion = document.getElementById("clienteDireccion");

const porcentajeInput = document.getElementById("porcentaje");
const fechaInicio = document.getElementById("fechaInicio");
const fechaFin = document.getElementById("fechaFin");

const conceptoCompra = document.getElementById("conceptoCompra");
const importeCompra = document.getElementById("importeCompra");
const fechaCompra = document.getElementById("fechaCompra");

const conceptoCargo = document.getElementById("conceptoCargo");
const importeCargo = document.getElementById("importeCargo");
const fechaCargo = document.getElementById("fechaCargo");

/* =====================================================
   ESTADO
===================================================== */

let clienteActual = null;
let condicionesCliente = [];
let movimientosCliente = [];

let ultimoMovimientoEliminado = null;
let timeoutDeshacerMovimiento = null;

/* =====================================================
   FIRESTORE LISTENERS
===================================================== */

/* ---------- CLIENTE ---------- */
onSnapshot(doc(db, "clientes", clienteId), (snap) => {
  if (!snap.exists()) {
    showToast("Cliente no encontrado");
    window.location.href = "clientes.html";
    return;
  }
  clienteActual = { id: snap.id, ...snap.data() };
  renderDatosCliente();
});

/* ---------- CONDICIONES ---------- */
onSnapshot(
  query(collection(db, "condiciones"), where("clienteId", "==", clienteId)),
  (snapshot) => {
    condicionesCliente = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCondiciones();
  }
);

/* ---------- MOVIMIENTOS ---------- */
onSnapshot(
  query(collection(db, "movimientos"), where("clienteId", "==", clienteId)),
  (snapshot) => {
    movimientosCliente = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    renderMovimientos();
    document.getElementById("saldoCliente").innerText =
      calcularSaldo().toFixed(2) + " €";
  }
);

/* =====================================================
   DATOS CLIENTE
===================================================== */

function renderDatosCliente() {
  if (!clienteActual) return;
  clienteCodigo.value = clienteActual.codigo || "";
  clienteNombre.value = clienteActual.nombre || "";
  clienteDireccion.value = clienteActual.direccion || "";
}

window.guardarDatosCliente = async function () {
  const codigo = clienteCodigo.value.trim();
  const nombre = clienteNombre.value.trim();
  const direccion = clienteDireccion.value.trim();

  if (!codigo || !nombre) {
    showToast("Código y nombre obligatorios");
    return;
  }

  await actualizar("clientes", clienteId, { codigo, nombre, direccion });
  showToast("Datos actualizados");
};

/* =====================================================
   CONDICIONES
===================================================== */

window.crearCondicion = async function () {
  const porcentaje = Number(porcentajeInput.value);
  const inicio = fechaInicio.value;
  const fin = fechaFin.value;

  if (!porcentaje || porcentaje <= 0 || !inicio || !fin || inicio > fin) {
    showToast("Datos de condición incorrectos");
    return;
  }

  if (haySolapamiento({ fechaInicio: inicio, fechaFin: fin })) {
    showToast("La condición se solapa con otra");
    return;
  }

  await agregar("condiciones", {
    clienteId,
    porcentaje,
    fechaInicio: inicio,
    fechaFin: fin
  });

  porcentajeInput.value = "";
  fechaInicio.value = "";
  fechaFin.value = "";

  showToast("Condición añadida");
};

function haySolapamiento(nueva) {
  return condicionesCliente.some(c =>
    !(nueva.fechaFin < c.fechaInicio || nueva.fechaInicio > c.fechaFin)
  );
}

window.eliminarCondicion = async function (id) {
  if (!confirm("¿Eliminar condición?")) return;
  await eliminar("condiciones", id);
  showToast("Condición eliminada");
};

function renderCondiciones() {
  const cont = document.getElementById("listaCondiciones");
  cont.innerHTML = "";

  if (!condicionesCliente.length) {
    cont.innerHTML = `<div class="empty-state">No hay condiciones</div>`;
    return;
  }

  const hoy = new Date().toISOString().split("T")[0];

  condicionesCliente.forEach(c => {
    const estado =
      hoy < c.fechaInicio ? "Pendiente" :
      hoy > c.fechaFin ? "Caducada" : "Activa";

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <strong>${c.porcentaje}%</strong><br>
      ${c.fechaInicio} → ${c.fechaFin}<br>
      <span class="badge">${estado}</span><br><br>
      <button class="btn-danger" onclick="eliminarCondicion('${c.id}')">
        Eliminar
      </button>
    `;
    cont.appendChild(div);
  });
}

function getCondicionActiva(fecha) {
  return condicionesCliente.find(c =>
    fecha >= c.fechaInicio && fecha <= c.fechaFin
  );
}

/* =====================================================
   COMPRAS
===================================================== */

window.crearCompra = async function () {
  const concepto = conceptoCompra.value.trim();
  const importe = Number(importeCompra.value);
  const fecha = fechaCompra.value;

  if (!concepto || importe <= 0 || !fecha) {
    showToast("Datos de compra incorrectos");
    return;
  }

  const condicion = getCondicionActiva(fecha);
  if (!condicion) {
    showToast("No hay condición activa");
    return;
  }

  const provision = importe * condicion.porcentaje / 100;

  await agregar("movimientos", {
    clienteId,
    tipo: "compra",
    concepto,
    importe,
    fecha,
    porcentaje: condicion.porcentaje,
    provision
  });

  conceptoCompra.value = "";
  importeCompra.value = "";
  fechaCompra.value = "";

  showToast("Compra añadida");
};

/* =====================================================
   CARGOS
===================================================== */

window.crearCargo = async function () {
  const concepto = conceptoCargo.value.trim();
  const importe = Number(importeCargo.value);
  const fecha = fechaCargo.value;

  if (!concepto || importe <= 0 || !fecha) {
    showToast("Datos de cargo incorrectos");
    return;
  }

  if (calcularSaldo() - importe < 0) {
    showToast("Saldo insuficiente");
    return;
  }

  await agregar("movimientos", {
    clienteId,
    tipo: "cargo",
    concepto,
    importe,
    fecha
  });

  conceptoCargo.value = "";
  importeCargo.value = "";
  fechaCargo.value = "";

  showToast("Cargo añadido");
};

/* =====================================================
   MOVIMIENTOS
===================================================== */

window.eliminarMovimiento = async function (id) {
  ultimoMovimientoEliminado =
    movimientosCliente.find(m => m.id === id);

  await eliminar("movimientos", id);
  showToast("Movimiento eliminado");

  clearTimeout(timeoutDeshacerMovimiento);
  timeoutDeshacerMovimiento = setTimeout(() => {
    ultimoMovimientoEliminado = null;
  }, 4000);
};

function renderMovimientos() {
  const cont = document.getElementById("listaMovimientos");
  cont.innerHTML = "";

  if (!movimientosCliente.length) {
    cont.innerHTML = `<div class="empty-state">No hay movimientos</div>`;
    return;
  }

  movimientosCliente.forEach(m => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <strong>${m.concepto}</strong><br>
      ${m.fecha}<br>
      ${m.tipo === "compra"
        ? `Provisión: ${m.provision.toFixed(2)} €`
        : `Cargo: -${m.importe} €`
      }
      <br><br>
      <button class="btn-danger" onclick="eliminarMovimiento('${m.id}')">
        Eliminar
      </button>
    `;
    cont.appendChild(div);
  });
}

/* =====================================================
   SALDO
===================================================== */

function calcularSaldo() {
  return movimientosCliente.reduce(
    (s, m) => m.tipo === "compra"
      ? s + (m.provision || 0)
      : s - m.importe
  , 0);
}