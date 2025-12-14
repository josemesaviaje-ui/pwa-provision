/* =====================================================
   PARAMS / ESTADO GLOBAL
===================================================== */

const params = new URLSearchParams(window.location.search);
const clienteId = params.get("id");

let ultimoMovimientoEliminado = null;
let timeoutDeshacerMovimiento = null;

let chartEvolucionCliente = null;
let chartTiposCliente = null;

// CIERRE CONTABLE (opcional)
const FECHA_CIERRE = null;

/* =====================================================
   CLIENTE
===================================================== */

function getCliente() {
  return getData().clientes.find(c => c.id === clienteId);
}

function saveCliente(cliente) {
  const data = getData();
  const idx = data.clientes.findIndex(c => c.id === cliente.id);
  data.clientes[idx] = cliente;
  saveData(data);
}

/* =====================================================
   VALIDACIONES
===================================================== */

function haySolapamiento(nueva) {
  const cliente = getCliente();
  return cliente.condiciones.some(c =>
    !(nueva.fechaFin < c.fechaInicio || nueva.fechaInicio > c.fechaFin)
  );
}

function diasParaCaducar(cond) {
  const hoy = new Date();
  const fin = new Date(cond.fechaFin);
  return Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
}

/* =====================================================
   DATOS CLIENTE
===================================================== */

function renderDatosCliente() {
  const c = getCliente();
  clienteCodigo.value = c.codigo || "";
  clienteNombre.value = c.nombre || "";
  clienteDireccion.value = c.direccion || "";
}

function guardarDatosCliente() {
  const c = getCliente();
  const codigo = clienteCodigo.value.trim();
  const nombre = clienteNombre.value.trim();
  const direccion = clienteDireccion.value.trim();

  if (!codigo || !nombre) {
    showToast("Código y nombre obligatorios");
    return;
  }

  const duplicado = getData().clientes.some(x =>
    x.id !== c.id &&
    x.codigo &&
    x.codigo.toLowerCase() === codigo.toLowerCase()
  );

  if (duplicado) {
    showToast("Ya existe otro cliente con ese código");
    return;
  }

  c.codigo = codigo;
  c.nombre = nombre;
  c.direccion = direccion;

  saveCliente(c);
  showToast("Datos actualizados");
}

/* =====================================================
   CONDICIONES
===================================================== */

function crearCondicion() {
  const porcentaje = Number(document.getElementById("porcentaje").value);
  const inicio = document.getElementById("fechaInicio").value;
  const fin = document.getElementById("fechaFin").value;

  if (!porcentaje || porcentaje <= 0 || !inicio || !fin) {
    showToast("Datos de condición incorrectos");
    return;
  }

  if (inicio > fin) {
    showToast("La fecha inicio no puede ser mayor que la final");
    return;
  }

  const nueva = {
    id: crypto.randomUUID(),
    porcentaje,
    fechaInicio: inicio,
    fechaFin: fin
  };

  if (haySolapamiento(nueva)) {
    showToast("La condición se solapa con otra existente");
    return;
  }

  const cliente = getCliente();
  cliente.condiciones = cliente.condiciones || [];
  cliente.condiciones.push(nueva);

  saveCliente(cliente);
  limpiarInputs();
  render();
  showToast("Condición añadida correctamente");
}

function estadoCondicion(c) {
  const hoy = new Date().toISOString().split("T")[0];
  if (hoy < c.fechaInicio) return "Pendiente";
  if (hoy > c.fechaFin) return "Caducada";
  return "Activa";
}

function renderCondiciones() {
  const c = getCliente();
  listaCondiciones.innerHTML = "";

  if (!c.condiciones.length) {
    listaCondiciones.innerHTML = `<div class="empty-state">No hay condiciones</div>`;
    return;
  }

  c.condiciones.forEach(cond => {
    const estado = estadoCondicion(cond);
    const dias = diasParaCaducar(cond);

    let aviso = "";
    if (estado === "Activa" && dias <= 15) {
      aviso = `<span class="badge badge-warning">Caduca en ${dias} días</span>`;
    }

    listaCondiciones.innerHTML += `
      <div class="card">
        <strong>${cond.porcentaje}%</strong><br>
        ${cond.fechaInicio} → ${cond.fechaFin}<br>
        <span class="badge">${estado}</span><br>
        ${aviso}
      </div>
    `;
  });
}

/* =====================================================
   PROVISIÓN AUTOMÁTICA (ÚNICA Y CORRECTA)
===================================================== */

function getCondicionActiva(fecha) {
  return getCliente().condiciones.find(c =>
    fecha >= c.fechaInicio && fecha <= c.fechaFin
  ) || null;
}

function calcularProvisionMovimiento(mov) {
  if (mov.tipo !== "compra") return 0;

  const cond = getCondicionActiva(mov.fecha);
  if (!cond) return 0;

  return +(mov.importe * cond.porcentaje / 100).toFixed(2);
}

/* =====================================================
   MOVIMIENTOS
===================================================== */

function crearCompra() {
  const concepto = conceptoCompra.value.trim();
  const importe = Number(importeCompra.value);
  const fecha = fechaCompra.value;
  const hoy = new Date().toISOString().split("T")[0];

  if (!concepto || importe <= 0 || !fecha || fecha > hoy) {
    showToast("Datos incorrectos");
    return;
  }

  const cond = getCondicionActiva(fecha);
  if (!cond) {
    showToast("No hay condición válida");
    return;
  }

  const c = getCliente();
  const mov = {
    id: crypto.randomUUID(),
    tipo: "compra",
    concepto,
    importe,
    fecha,
    porcentaje: cond.porcentaje
  };

  mov.provision = calcularProvisionMovimiento(mov);
  c.movimientos.push(mov);

  saveCliente(c);
  limpiarInputs();
  render();
  showToast("Compra añadida");
}

function crearCargo(tipo = "cargo") {
  const concepto = conceptoCargo.value.trim();
  const importe = Number(importeCargo.value);
  const fecha = fechaCargo.value;
  const hoy = new Date().toISOString().split("T")[0];

  if (!concepto || importe <= 0 || !fecha || fecha > hoy) {
    showToast("Datos incorrectos");
    return;
  }

  if (calcularSaldo() - importe < 0) {
    showToast("Saldo insuficiente");
    return;
  }

  const c = getCliente();
  c.movimientos.push({
    id: crypto.randomUUID(),
    tipo,
    concepto,
    importe,
    fecha
  });

  saveCliente(c);
  limpiarInputs();
  render();
  showToast("Movimiento añadido");
}

/* =====================================================
   SALDO
===================================================== */

function calcularSaldo() {
  return getCliente().movimientos.reduce((s, m) => {
    if (m.tipo === "compra") return s + (m.provision || 0);
    if (m.tipo === "cargo" || m.tipo === "promocion") return s - m.importe;
    return s;
  }, 0);
}

/* =====================================================
   RENDER MOVIMIENTOS
===================================================== */

function renderMovimientos() {
  const c = getCliente();
  listaMovimientos.innerHTML = "";

  if (!c.movimientos.length) {
    listaMovimientos.innerHTML = `<div class="empty-state">No hay movimientos</div>`;
    return;
  }

  c.movimientos.forEach(m => {
    listaMovimientos.innerHTML += `
      <div class="card">
        <strong>${m.concepto}</strong><br>
        Fecha: ${m.fecha}<br>
        ${m.tipo === "compra"
          ? `Importe: ${m.importe} €<br>Provisión: ${m.provision.toFixed(2)} €`
          : `-${m.importe} € (${m.tipo})`}
      </div>
    `;
  });
}

/* =====================================================
   GRÁFICOS
===================================================== */

function renderGraficosCliente() {
  const c = getCliente();
  if (!c.movimientos.length) return;

  const movs = [...c.movimientos].sort((a, b) =>
    a.fecha.localeCompare(b.fecha)
  );

  let saldo = 0;
  const labels = [];
  const data = [];
  let compras = 0;
  let cargos = 0;

  movs.forEach(m => {
    if (m.tipo === "compra") {
      saldo += m.provision;
      compras += m.provision;
    }
    if (m.tipo !== "compra") {
      saldo -= m.importe;
      cargos += m.importe;
    }
    labels.push(m.fecha);
    data.push(saldo);
  });

  if (chartEvolucionCliente) chartEvolucionCliente.destroy();
  chartEvolucionCliente = new Chart(graficoEvolucionCliente, {
    type: "line",
    data: { labels, datasets: [{ data, fill: true }] },
    options: { plugins: { legend: { display: false } } }
  });

  if (chartTiposCliente) chartTiposCliente.destroy();
  chartTiposCliente = new Chart(graficoTiposCliente, {
    type: "doughnut",
    data: {
      labels: ["Provisión", "Cargos"],
      datasets: [{ data: [compras, cargos] }]
    }
  });
}

/* =====================================================
   UTILS / INIT
===================================================== */

function limpiarInputs() {
  document.querySelectorAll("input").forEach(i => i.value = "");
}

function render() {
  renderDatosCliente();
  saldoCliente.innerText = calcularSaldo().toFixed(2) + " €";
  renderCondiciones();
  renderMovimientos();
  renderGraficosCliente();
}

render();