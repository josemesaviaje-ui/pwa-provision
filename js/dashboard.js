const AVISO_DIAS = 15;

let chartClientes = null;
let chartMovimientos = null;

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

    el.innerText =
      value.toFixed(2).replace(".", ",") + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* =========================
   DASHBOARD
========================= */

function calcularDashboard() {
  const data = getData();

  let saldoTotal = 0;
  let totalGenerado = 0;
  let totalConsumido = 0;

  const labelsClientes = [];
  const saldosClientes = [];

  data.clientes.forEach(cliente => {
    let saldoCliente = 0;

    cliente.movimientos.forEach(m => {
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

  animateValue("saldoTotal", 0, saldoTotal, 700, " €");
  animateValue("totalGenerado", 0, totalGenerado, 700, " €");
  animateValue("totalConsumido", 0, totalConsumido, 700, " €");

  document.getElementById("totalClientes").innerText =
    data.clientes.length;

  renderGraficoClientes(labelsClientes, saldosClientes);
  renderGraficoMovimientos(totalGenerado, totalConsumido);
  renderAlertas(data.clientes);
}

/* =========================
   GRÁFICO CLIENTES
========================= */

function renderGraficoClientes(labels, data) {
  if (chartClientes) chartClientes.destroy();

  chartClientes = new Chart(
    document.getElementById("graficoClientes"),
    {
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
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    }
  );
}

/* =========================
   GRÁFICO MOVIMIENTOS
========================= */

function renderGraficoMovimientos(generado, consumido) {
  if (chartMovimientos) chartMovimientos.destroy();

  chartMovimientos = new Chart(
    document.getElementById("graficoMovimientos"),
    {
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
        plugins: {
          legend: {
            position: "bottom"
          }
        },
        cutout: "65%"
      }
    }
  );
}

/* =========================
   ALERTAS
========================= */

function renderAlertas(clientes) {
  const cont = document.getElementById("alertasCondiciones");
  cont.innerHTML = "";

  const hoy = new Date();
  let hayAlertas = false;

  clientes.forEach(cliente => {
    cliente.condiciones.forEach(cond => {
      const fin = new Date(cond.fechaFin);
      const dias = (fin - hoy) / (1000 * 60 * 60 * 24);

      if (dias > 0 && dias <= AVISO_DIAS) {
        hayAlertas = true;

        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
          <strong>${cliente.nombre}</strong><br>
          ${cond.porcentaje}% hasta ${cond.fechaFin}
          <span class="badge badge-warning">
            ${Math.ceil(dias)} días
          </span>
        `;

        cont.appendChild(div);
      }
    });
  });

  if (!hayAlertas) {
    cont.innerHTML =
      "<p style='color:var(--muted)'>Sin alertas</p>";
  }
}

/* =========================
   INIT
========================= */

calcularDashboard();