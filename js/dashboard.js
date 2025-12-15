/* =========================
   DASHBOARD - Versión Firestore
========================= */

const AVISO_DIAS = 15;

let chartClientes = null;
let chartMovimientos = null;

// Variables globales para los datos
let todosClientes = [];
let todosMovimientos = [];
let todasCondiciones = [];

// Escuchas en tiempo real
let unsubscribeClientes = null;
let unsubscribeMovimientos = null;
let unsubscribeCondiciones = null;

/* =========================
   ANIMACIÓN CONTADORES
========================= */

function animateValue(id, start, end, duration = 600, suffix = "") {
  const el = document.getElementById(id);
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
   CARGAR TODOS LOS DATOS Y ESCUCHAR CAMBIOS
========================= */

function iniciarDashboard() {
  // Escuchar todos los clientes del usuario
  unsubscribeClientes = escuchar('clientes', (lista) => {
    todosClientes = lista;
    calcularDashboard();
  });

  // Escuchar TODOS los movimientos (de todos los clientes)
  unsubscribeMovimientos = escuchar('movimientos', (lista) => {
    todosMovimientos = lista;
    calcularDashboard();
  });

  // Escuchar TODAS las condiciones
  unsubscribeCondiciones = escuchar('condiciones', (lista) => {
    todasCondiciones = lista;
    calcularDashboard();
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

  // Recorrer todos los clientes
  todosClientes.forEach(cliente => {
    // Filtrar movimientos de este cliente
    const movimientosCliente = todosMovimientos.filter(m => m.clienteId === cliente.id);

    let saldoCliente = 0;

    movimientosCliente.forEach(m => {
      if (m.tipo === "compra") {
        saldoCliente += m.provision;
        totalGenerado += m.provision;
      }
      if (m.tipo === "cargo") {
        saldoCliente -= m.importe;
        totalConsumido += m.importe;
      }
    });

    saldoTotal += saldoCliente;
    labelsClientes.push(cliente.nombre);
    saldosClientes.push(saldoCliente);
  });

  // Animar contadores
  animateValue("saldoTotal", 0, saldoTotal, 700, " €");
  animateValue("totalGenerado", 0, totalGenerado, 700, " €");
  animateValue("totalConsumido", 0, totalConsumido, 700, " €");

  document.getElementById("totalClientes").innerText = todosClientes.length;

  renderGraficoClientes(labelsClientes, saldosClientes);
  renderGraficoMovimientos(totalGenerado, totalConsumido);
  renderAlertas();
}

/* =========================
   GRÁFICOS
========================= */

function renderGraficoClientes(labels, data) {
  if (chartClientes) chartClientes.destroy();

  chartClientes = new Chart(document.getElementById("graficoClientes"), {
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
  if (chartMovimientos) chartMovimientos.destroy();

  chartMovimientos = new Chart(document.getElementById("graficoMovimientos"), {
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
   ALERTAS CONDICIONES PRÓXIMAS A CADUCAR
========================= */

function renderAlertas() {
  const cont = document.getElementById("alertasCondiciones");
  cont.innerHTML = "";

  const hoy = new Date();
  let hayAlertas = false;

  todosClientes.forEach(cliente => {
    // Filtrar condiciones de este cliente
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
   INIT - Cuando carga la página
========================= */

iniciarDashboard();