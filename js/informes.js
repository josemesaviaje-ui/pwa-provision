let datosInforme = [];
let resumenInforme = {};

function cargarClientesFiltro() {
  const select = document.getElementById("clienteFiltro");
  const clientes = getData().clientes;

  clientes.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.nombre;
    select.appendChild(opt);
  });
}

/* =========================
   GENERAR INFORME
========================= */

function generarInforme() {
  const clienteId = document.getElementById("clienteFiltro").value;
  const desde = document.getElementById("fechaDesde").value;
  const hasta = document.getElementById("fechaHasta").value;

  const clientes = getData().clientes;

  let resultado = [];
  let totalGenerado = 0;
  let totalConsumido = 0;
  const clientesIncluidos = new Set();

  clientes.forEach(cliente => {

    if (clienteId !== "all" && cliente.id !== clienteId) return;

    cliente.movimientos.forEach(mov => {

      if (desde && mov.fecha < desde) return;
      if (hasta && mov.fecha > hasta) return;

      clientesIncluidos.add(cliente.nombre);

      if (mov.tipo === "compra") {
        totalGenerado += mov.provision;
      }

      if (mov.tipo === "cargo") {
        totalConsumido += mov.importe;
      }

      resultado.push({
        Cliente: cliente.nombre,
        Fecha: mov.fecha,
        Tipo: mov.tipo,
        Concepto: mov.concepto,
        Importe: mov.importe,
        Provisión: mov.provision || 0
      });
    });
  });
  
  resultado.sort((a, b) => b.Fecha.localeCompare(a.Fecha));
  
  datosInforme = resultado;

  resumenInforme = {
    totalGenerado,
    totalConsumido,
    saldo: totalGenerado - totalConsumido,
    clientes: clientesIncluidos.size,
    desde,
    hasta
  };

  renderInforme();
}

function setPeriodo(dias) {
  const hoy = new Date();
  const desde = new Date(hoy);
  desde.setDate(hoy.getDate() - dias);

  document.getElementById("fechaHasta").value =
    hoy.toISOString().split("T")[0];

  document.getElementById("fechaDesde").value =
    desde.toISOString().split("T")[0];

  generarInforme();
}

/* =========================
   RENDER INFORME
========================= */

function renderInforme() {
  const cont = document.getElementById("resultadoInforme");
  cont.innerHTML = "";

  if (!datosInforme.length) {
  cont.innerHTML = `
    <div class="empty-state">
      <span>📄</span>
      No hay datos para los filtros seleccionados
    </div>
  `;
  return;
}

  // RESUMEN VISUAL
  cont.innerHTML = `
    <div class="card">
      <strong>Resumen</strong><br>
      Clientes: ${resumenInforme.clientes}<br>
      Provisión generada: ${resumenInforme.totalGenerado.toFixed(2)} €<br>
      Provisión consumida: ${resumenInforme.totalConsumido.toFixed(2)} €<br>
      <strong>Saldo: ${resumenInforme.saldo.toFixed(2)} €</strong>
    </div>
  `;

  // TABLA
  let html = `
    <table>
      <tr>
        <th>Cliente</th>
        <th>Fecha</th>
        <th>Tipo</th>
        <th>Concepto</th>
        <th>Importe</th>
        <th>Provisión</th>
      </tr>
  `;

  datosInforme.forEach(d => {
    html += `
      <tr>
        <td>${d.Cliente}</td>
        <td>${d.Fecha}</td>
        <td>${d.Tipo}</td>
        <td>${d.Concepto}</td>
        <td>${d.Importe.toFixed(2)}</td>
        <td>${d.Provisión.toFixed(2)}</td>
      </tr>
    `;
  });

  html += "</table>";
  cont.innerHTML += html;
}

/* INIT */
cargarClientesFiltro();