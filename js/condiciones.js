/* =====================================================
   CLIENTE DETAIL - Versión Firestore CORREGIDA
===================================================== */

import { agregar, actualizar, eliminar } from './firestore.js';
import { db, collection, query, where, onSnapshot } from './firestore.js';  // ¡IMPORTANTE! Añadidos estos

const params = new URLSearchParams(window.location.search);
const clienteId = params.get("id");

let ultimoMovimientoEliminado = null;
let timeoutDeshacerMovimiento = null;

let clienteActual = null;
let condicionesCliente = [];
let movimientosCliente = [];

let unsubscribeCliente = null;
let unsubscribeCondiciones = null;
let unsubscribeMovimientos = null;

/* =====================================================
   CARGAR DATOS DEL CLIENTE
===================================================== */

function cargarDatosCliente() {
  if (!clienteId) {
    showToast("Cliente no encontrado");
    window.location.href = "clientes.html";
    return;
  }

  // Escuchar el cliente específico
  const qCliente = query(collection(db, "clientes"), where("id", "==", clienteId));
  unsubscribeCliente = onSnapshot(qCliente, (snapshot) => {
    if (snapshot.empty) {
      showToast("Cliente no encontrado");
      window.location.href = "clientes.html";
      return;
    }
    snapshot.forEach((doc) => {
      clienteActual = { id: doc.id, ...doc.data() };
      renderDatosCliente();
    });
  });

  // Escuchar condiciones del cliente
  const qCond = query(collection(db, "condiciones"), where("clienteId", "==", clienteId));
  unsubscribeCondiciones = onSnapshot(qCond, (snapshot) => {
    condicionesCliente = [];
    snapshot.forEach((doc) => {
      condicionesCliente.push({ id: doc.id, ...doc.data() });
    });
    renderCondiciones();
    render();
  });

  // Escuchar movimientos del cliente
  const qMov = query(collection(db, "movimientos"), where("clienteId", "==", clienteId));
  unsubscribeMovimientos = onSnapshot(qMov, (snapshot) => {
    movimientosCliente = [];
    snapshot.forEach((doc) => {
      movimientosCliente.push({ id: doc.id, ...doc.data() });
    });
    movimientosCliente.sort((a, b) => a.fecha.localeCompare(b.fecha));
    renderMovimientos();
    renderGraficosCliente();
    document.getElementById("saldoCliente").innerText = calcularSaldo().toFixed(2) + " €";
    render();
  });
}

/* =====================================================
   RENDER DATOS CLIENTE
===================================================== */

function renderDatosCliente() {
  if (!clienteActual) return;

  document.getElementById("clienteCodigo").value = clienteActual.codigo || "";
  document.getElementById("clienteNombre").value = clienteActual.nombre || "";
  document.getElementById("clienteDireccion").value = clienteActual.direccion || "";
}

async function guardarDatosCliente() {
  if (!clienteActual) return;

  const nuevoCodigo = document.getElementById("clienteCodigo").value.trim();
  const nombre = document.getElementById("clienteNombre").value.trim();
  const direccion = document.getElementById("clienteDireccion").value.trim();

  if (!nuevoCodigo || !nombre) {
    showToast("Código y nombre obligatorios");
    return;
  }

  try {
    await actualizar('clientes', clienteId, {
      codigo: nuevoCodigo,
      nombre,
      direccion
    });
    showToast("Datos actualizados");
  } catch (error) {
    showToast("Error al guardar");
    console.error(error);
  }
}

/* =====================================================
   CONDICIONES
===================================================== */

async function crearCondicion() {
  const porcentaje = Number(document.getElementById("porcentaje").value);
  const inicio = document.getElementById("fechaInicio").value;
  const fin = document.getElementById("fechaFin").value;

  if (!porcentaje || porcentaje <= 0 || !inicio || !fin || inicio > fin) {
    showToast("Datos de condición incorrectos");
    return;
  }

  const nueva = {
    clienteId,
    porcentaje,
    fechaInicio: inicio,
    fechaFin: fin
  };

  if (haySolapamiento(nueva)) {
    showToast("La condición se solapa con otra");
    return;
  }

  try {
    await agregar('condiciones', nueva);
    limpiarInputs();
    showToast("Condición añadida");
  } catch (error) {
    showToast("Error al guardar condición");
    console.error(error);
  }
}

function haySolapamiento(nueva) {
  return condicionesCliente.some(c =>
    !(nueva.fechaFin < c.fechaInicio || nueva.fechaInicio > c.fechaFin)
  );
}

async function eliminarCondicion(id) {
  if (!confirm("¿Eliminar esta condición?")) return;
  try {
    await eliminar('condiciones', id);
    showToast("Condición eliminada");
  } catch (error) {
    showToast("Error al eliminar");
  }
}

function renderCondiciones() {
  const cont = document.getElementById("listaCondiciones");
  cont.innerHTML = "";

  if (!condicionesCliente.length) {
    cont.innerHTML = `<div class="empty-state"><span>📅</span> No hay condiciones</div>`;
    return;
  }

  condicionesCliente.forEach(c => {
    const hoy = new Date().toISOString().split("T")[0];
    const estado = hoy < c.fechaInicio ? "Pendiente" : hoy > c.fechaFin ? "Caducada" : "Activa";
    const dias = Math.ceil((new Date(c.fechaFin) - new Date()) / 86400000);

    const badge = estado === "Activa" ? "badge-success" : estado === "Pendiente" ? "badge-warning" : "badge-danger";
    let aviso = estado === "Activa" && dias <= 15 ? `<br><span class="badge badge-warning">Caduca en ${dias} días</span>` : "";

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <strong>${c.porcentaje}%</strong><br>
      ${c.fechaInicio} → ${c.fechaFin}<br>
      <span class="badge ${badge}">${estado}</span>${aviso}
      <br><br>
      <button class="btn-danger" onclick="eliminarCondicion('${c.id}')">🗑️ Eliminar</button>
    `;
    cont.appendChild(div);
  });
}

function getCondicionActiva(fecha) {
  return condicionesCliente.find(c => fecha >= c.fechaInicio && fecha <= c.fechaFin);
}

/* =====================================================
   COMPRAS Y CARGOS
===================================================== */

async function crearCompra() {
  const concepto = document.getElementById("conceptoCompra").value.trim();
  const importe = Number(document.getElementById("importeCompra").value);
  const fecha = document.getElementById("fechaCompra").value;
  const hoy = new Date().toISOString().split("T")[0];

  if (!concepto || importe <= 0 || !fecha || fecha > hoy) {
    showToast("Datos de compra incorrectos");
    return;
  }

  const condicion = getCondicionActiva(fecha);
  if (!condicion) {
    showToast("No hay condición activa para esa fecha");
    return;
  }

  const provision = importe * condicion.porcentaje / 100;

  try {
    await agregar('movimientos', {
      clienteId,
      tipo: "compra",
      concepto,
      importe,
      fecha,
      porcentaje: condicion.porcentaje,
      provision
    });
    limpiarInputs();
    showToast("Compra añadida");
  } catch (error) {
    showToast("Error al añadir compra");
    console.error(error);
  }
}

async function crearCargo() {
  const concepto = document.getElementById("conceptoCargo").value.trim();
  const importe = Number(document.getElementById("importeCargo").value);
  const fecha = document.getElementById("fechaCargo").value;
  const hoy = new Date().toISOString().split("T")[0];

  if (!concepto || importe <= 0 || !fecha || fecha > hoy) {
    showToast("Datos de cargo incorrectos");
    return;
  }

  const saldoActual = calcularSaldo();
  if (saldoActual - importe < 0) {
    showToast("Saldo insuficiente");
    return;
  }

  try {
    await agregar('movimientos', {
      clienteId,
      tipo: "cargo",
      concepto,
      importe,
      fecha
    });
    limpiarInputs();
    showToast("Cargo añadido");
  } catch (error) {
    showToast("Error al añadir cargo");
    console.error(error);
  }
}

async function eliminarMovimiento(id) {
  const movimiento = movimientosCliente.find(m => m.id === id);
  if (!movimiento) return;

  ultimoMovimientoEliminado = movimiento;

  try {
    await eliminar('movimientos', id);
    showToast("Movimiento eliminado · Deshacer");

    clearTimeout(timeoutDeshacerMovimiento);
    timeoutDeshacerMovimiento = setTimeout(() => {
      ultimoMovimientoEliminado = null;
    }, 4000);
  } catch (error) {
    showToast("Error al eliminar");
  }
}

async function deshacerEliminarMovimiento() {
  if (!ultimoMovimientoEliminado) return;

  try {
    await agregar('movimientos', {
      clienteId,
      tipo: ultimoMovimientoEliminado.tipo,
      concepto: ultimoMovimientoEliminado.concepto,
      importe: ultimoMovimientoEliminado.importe,
      fecha: ultimoMovimientoEliminado.fecha,
      porcentaje: ultimoMovimientoEliminado.porcentaje || 0,
      provision: ultimoMovimientoEliminado.provision || 0
    });
    ultimoMovimientoEliminado = null;
    showToast("Movimiento restaurado");
  } catch (error) {
    showToast("Error al restaurar");
  }
}

/* =====================================================
   SALDO Y GRÁFICOS
===================================================== */

function calcularSaldo() {
  return movimientosCliente.reduce((s, m) => m.tipo === "compra" ? s + (m.provision || 0) : s - m.importe, 0);
}

function renderMovimientos() {
  const cont = document.getElementById("listaMovimientos");
  cont.innerHTML = "";

  if (!movimientosCliente.length) {
    cont.innerHTML = `<div class="empty-state"><span>💼</span> No hay movimientos</div>`;
    return;
  }

  movimientosCliente.forEach(m => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <strong>${m.concepto}</strong><br>
      Fecha: ${m.fecha}<br>
      ${m.tipo === "compra" ? `Importe: ${m.importe} €<br>Provisión: ${(m.provision || 0).toFixed(2)} €` : `Cargo: -${m.importe} €`}
      <br><br>
      <button class="btn-danger" onclick="eliminarMovimiento('${m.id}')">Eliminar</button>
    `;
    cont.appendChild(div);
  });
}

function renderGraficosCliente() {
  if (!movimientosCliente.length) return;

  const movs = [...movimientosCliente].sort((a, b) => a.fecha.localeCompare(b.fecha));

  let saldo = 0;
  const labels = [];
  const dataSaldo = [];
  let compras = 0;
  let cargos = 0;

  movs.forEach(m => {
    if (m.tipo === "compra")