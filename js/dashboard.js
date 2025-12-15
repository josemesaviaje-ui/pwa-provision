/* =========================
   DASHBOARD - Versión Firestore DEFINITIVA
========================= */

const AVISO_DIAS = 15;

let chartClientes = null;
let chartMovimientos = null;

// Variables globales
let todosClientes = [];
let todosMovimientos = [];
let todasCondiciones = [];

// Escuchas
let unsubscribeClientes = null;
let unsubscribeMovimientos = null;
let unsubscribeCondiciones = null;

/* =========================
   ANIMACIÓN CONTADORES
========================= */

function animateValue(id, start, end, duration = 600, suffix = "") {
  const el = document.getElementById(id);
  if (!el) return;

  const range = end - start;
  const startTime = performance.now();

  function update(time) {
    const progress = Math.min((time - startTime) / duration, 1);
    const value = start + range * progress;

    el.innerText = value.toFixed(2).replace(".", ",") + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* =========================
   INICIAR ESCUCHAS EN TIEMPO REAL
========================= */

import { db, collection, onSnapshot } from './firestore.js';

function iniciarDashboard() {
  // Escuchar clientes
  unsubscribeClientes = onSnapshot(collection(db, "clientes"), (snapshot) => {
    todosClientes = [];
    snapshot.forEach((doc) => {
      todosClientes.push({ id: doc.id, ...doc.data() });
    });
    calcularDashboard();
  }, (error) => {
    console.error("Error clientes:", error);
  });

  // Escuchar movimientos
  unsubscribeMovimientos = onSnapshot(collection(db, "movimientos"), (snapshot) => {
    todosMovimientos = [];
    snapshot.forEach((doc) => {
      todosMovimientos.push({ id: doc.id, ...doc.data() });
    });
    calcularDashboard();
  }, (error) => {
    console.error("Error movimientos:", error);
  });

  // Escuchar condiciones
  unsubscribeCondiciones = onSnapshot(collection(db, "condiciones"), (snapshot) => {
    todasCondiciones = [];
    snapshot.forEach((doc) => {
      todasCondiciones.push({ id: doc.id, ...doc.data() });
    });
    calcularDashboard();
  }, (error) => {
    console.error("Error condiciones:", error);
  });
}

/* =========================
   CALCULAR DASHBOARD
========================= */

function calcularDashboard() {
  let saldoTotal = 0;
  let totalGenerado = 0;
  let totalConsumido = 0;

  const labelsClientes = [];
  const saldosClientes = [];

  todosClientes.forEach(cliente => {
    const movimientosCliente = todosMovimientos.filter(m => m.clienteId === cliente.id);

    let saldoCliente = 0;

    movimientosCliente.forEach(m => {
      if (m.tipo === "compra") {
        const provision = m.provision || 0;
        saldoCliente += provision;
        totalGenerado += provision;
      }
      if (m.tipo === "cargo") {
        saldoCliente -= m.importe;
        totalConsumido += m.importe;
      }
    });

    saldoTotal += saldoCliente;
    labelsClientes.push(cliente.nombre || "Sin nombre");
    saldosClientes.push(saldoCliente);
  });

  // Contadores
  if (document.getElementById("saldoTotal")) animateValue("saldoTotal", 0, saldoTotal, 700, " €");
  if (document.getElementById("totalGenerado")) animateValue("totalGenerado", 0, totalGenerado, 700, " €");
  if (document.getElementById("totalConsumido")) animateValue("totalConsumido", 0, totalConsumido, 700, " €");
  if (document.getElementById("totalClientes")) {
    document.getElementById("totalClientes").innerText = todosClientes.length;
  }

  renderGraficoClientes(labelsClientes, saldosClientes);
  renderGraficoMovimientos(totalGenerado, totalConsumido);
  renderAlertas();
}

/* =========================
   GRÁFICOS
========================= */

function renderGraficoClientes(labels, data) {
  const canvas = document.getElementById("graficoClientes");
  if (!canvas) return;

  if (chartClientes) chartClientes.destroy();

  chartClientes = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Saldo provisión (€)",
        data,
        backgroundColor: "#5fa8d3",
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function renderGraficoMovimientos(generado, consumido) {
  const canvas = document.getElementById("graficoMovimientos");
  if (!canvas) return;

  if (chartMovimientos) chartMovimientos.destroy();

  chartMovimientos = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Generado", "Consumido"],
      datasets: [{
        data: [generado, consumido],
        backgroundColor: ["#95d5b2", "#ff8fa3"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      cutout: "65%"
    }
  });
}

/* =========================
   ALERTAS
========================= */

function renderAlertas() {
  const cont = document.getElementById("alertasCondiciones");
  if (!cont) return;

  cont.innerHTML = "";

  const hoy = new Date();
  let hayAlertas = false;

  todosClientes.forEach(cliente => {
    const condicionesCliente = todasCondiciones.filter(c => c.clienteId === cliente.id);

    condicionesCliente.forEach(cond => {
      const fin = new Date(cond.fechaFin);
      const dias = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));

      if (dias > 0 && dias <= AVISO_DIAS) {
        hayAlertas = true;

        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
          <strong>${cliente.nombre}</strong><br>
          ${cond.porcentaje}% hasta ${cond.fechaFin}
          <span class="badge badge-warning">
            ${dias} días restantes
          </span>
        `;
        cont.appendChild(div);
      }
    });
  });

  if (!hayAlertas) {
    cont.innerHTML = "<p style='color:var(--muted)'>Sin alertas pendientes</p>";
  }
}

/* =========================
   INIT
========================= */

iniciarDashboard();