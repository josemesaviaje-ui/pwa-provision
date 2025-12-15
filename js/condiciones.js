/* =====================================================
   PARAMS / ESTADO GLOBAL
===================================================== */

const params = new URLSearchParams(window.location.search);
const clienteId = params.get("id");

let ultimoMovimientoEliminado = null;
let timeoutDeshacerMovimiento = null;

let filtroTipoMovimiento = "todos";

let chartEvolucionCliente = null;
let chartTiposCliente = null;
let condicionEditandoId = null;

// CIERRE CONTABLE (opcional)
const FECHA_CIERRE = null; // ej: "2024-12-31"

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
   DATOS CLIENTE (EDICIÓN)
===================================================== */

function renderDatosCliente() {
  const cliente = getCliente();

  document.getElementById("clienteCodigo").value = cliente.codigo || "";
  document.getElementById("clienteNombre").value = cliente.nombre || "";
  document.getElementById("clienteDireccion").value = cliente.direccion || "";
}

function guardarDatosCliente() {
  const cliente = getCliente();

  const nuevoCodigo =
    document.getElementById("clienteCodigo").value.trim();
  const nombre =
    document.getElementById("clienteNombre").value.trim();
  const direccion =
    document.getElementById("clienteDireccion").value.trim();

  if (!nuevoCodigo) {
    showToast("El código del cliente es obligatorio");
    return;
  }

  if (!nombre) {
    showToast("El nombre del cliente es obligatorio");
    return;
  }

  // VALIDAR CÓDIGO ÚNICO
  const existe = getData().clientes.some(c =>
    c.id !== cliente.id &&
    c.codigo &&
    c.codigo.toLowerCase() === nuevoCodigo.toLowerCase()
  );

  if (existe) {
    showToast("Ya existe otro cliente con ese código");
    return;
  }

  cliente.codigo = nuevoCodigo;
  cliente.nombre = nombre;
  cliente.direccion = direccion;

  saveCliente(cliente);
  showToast("Datos del cliente actualizados");
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

  const cliente = getCliente();

if (condicionEditandoId) {
  // === EDITAR ===
  const condicion = cliente.condiciones.find(c => c.id === condicionEditandoId);

  const editada = {
    ...condicion,
    porcentaje,
    fechaInicio: inicio,
    fechaFin: fin
  };

  if (haySolapamiento(editada)) {
    showToast("La condición se solapa con otra existente");
    return;
  }

  condicion.porcentaje = porcentaje;
  condicion.fechaInicio = inicio;
  condicion.fechaFin = fin;

  condicionEditandoId = null;
  showToast("Condición actualizada");

} else {
  // === CREAR ===
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

  cliente.condiciones.push(nueva);
  showToast("Condición añadida");
}

saveCliente(cliente);
limpiarInputs();
render();
}

function editarCondicion(id) {
  const cliente = getCliente();
  const condicion = cliente.condiciones.find(c => c.id === id);
  if (!condicion) return;

  document.getElementById("porcentaje").value = condicion.porcentaje;
  document.getElementById("fechaInicio").value = condicion.fechaInicio;
  document.getElementById("fechaFin").value = condicion.fechaFin;

  condicionEditandoId = id;
}

function eliminarCondicion(id) {
  if (!confirm("¿Eliminar esta condición?")) return;

  const cliente = getCliente();
  cliente.condiciones = cliente.condiciones.filter(c => c.id !== id);

  saveCliente(cliente);
  render();
  showToast("Condición eliminada");
}

function estadoCondicion(c) {
  const hoy = new Date().toISOString().split("T")[0];
  if (hoy < c.fechaInicio) return "Pendiente";
  if (hoy > c.fechaFin) return "Caducada";
  return "Activa";
}

function renderCondiciones() {
  const cliente = getCliente();
  const cont = document.getElementById("listaCondiciones");
  cont.innerHTML = "";

  if (!cliente.condiciones.length) {
    cont.innerHTML = `
      <div class="empty-state">
        <span>📅</span>
        No hay condiciones
      </div>
    `;
    return;
  }

  cliente.condiciones.forEach(c => {
    const estado = estadoCondicion(c);
    const dias = diasParaCaducar(c);

    const badge =
      estado === "Activa" ? "badge-success" :
      estado === "Pendiente" ? "badge-warning" :
      "badge-danger";

    let aviso = "";
    if (estado === "Activa" && dias <= 15) {
      aviso = `<br><span class="badge badge-warning">
                Caduca en ${dias} días
               </span>`;
    }

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
  <strong>${c.porcentaje}%</strong><br>
  ${c.fechaInicio} → ${c.fechaFin}<br>
  <span class="badge ${badge}">${estado}</span>
  ${aviso}
  <br><br>
  <button onclick="editarCondicion('${c.id}')">✏️ Editar</button>
  <button class="btn-danger" onclick="eliminarCondicion('${c.id}')">
    🗑️ Eliminar
  </button>
`;
    cont.appendChild(div);
  });
}

/* =====================================================
   CONDICIÓN ACTIVA
===================================================== */

function getCondicionActiva(fecha) {
  return getCliente().condiciones.find(c =>
    fecha >= c.fechaInicio && fecha <= c.fechaFin
  );
}

/* =====================================================
   COMPRAS
===================================================== */

function crearCompra() {
  const concepto = document.getElementById("conceptoCompra").value.trim();
  const importe = Number(document.getElementById("importeCompra").value);
  const fecha = document.getElementById("fechaCompra").value;
  const hoy = new Date().toISOString().split("T")[0];

  if (!concepto || importe <= 0 || !fecha) {
    showToast("Datos de compra incorrectos");
    return;
  }

  if (fecha > hoy) {
    showToast("La fecha no puede ser futura");
    return;
  }

  if (FECHA_CIERRE && fecha <= FECHA_CIERRE) {
    showToast("Periodo cerrado, no se permiten cambios");
    return;
  }

  const cliente = getCliente();
  const condicion = getCondicionActiva(fecha);

  if (!condicion) {
    showToast("No hay condición válida para esa fecha");
    return;
  }

  cliente.movimientos.push({
    id: crypto.randomUUID(),
    tipo: "compra",
    concepto,
    importe,
    fecha,
    porcentaje: condicion.porcentaje,
    provision: importe * condicion.porcentaje / 100
  });

  saveCliente(cliente);
  limpiarInputs();
  render();
  showToast("Compra añadida");
}

/* =====================================================
   CARGOS
===================================================== */

function crearCargo() {
  const concepto = document.getElementById("conceptoCargo").value.trim();
  const importe = Number(document.getElementById("importeCargo").value);
  const fecha = document.getElementById("fechaCargo").value;
  const hoy = new Date().toISOString().split("T")[0];

  if (!concepto || importe <= 0 || !fecha) {
    showToast("Datos de cargo incorrectos");
    return;
  }

  if (fecha > hoy) {
    showToast("La fecha no puede ser futura");
    return;
  }

  if (FECHA_CIERRE && fecha <= FECHA_CIERRE) {
    showToast("Periodo cerrado, no se permiten cambios");
    return;
  }

  const saldoActual = calcularSaldo();
  if (saldoActual - importe < 0) {
    showToast("Este cargo dejaría el saldo en negativo");
    return;
  }

  const cliente = getCliente();
  cliente.movimientos.push({
    id: crypto.randomUUID(),
    tipo: "cargo",
    concepto,
    importe,
    fecha
  });

  saveCliente(cliente);
  limpiarInputs();
  render();
  showToast("Cargo añadido");
}

/* =====================================================
   SALDO
===================================================== */

function calcularSaldo() {
  return getCliente().movimientos.reduce((s, m) => {
    if (m.tipo === "compra") return s + m.provision;
    if (m.tipo === "cargo") return s - m.importe;
    return s;
  }, 0);
}

/* =====================================================
   MOVIMIENTOS
===================================================== */

function renderMovimientos() {
  const cliente = getCliente();
  const cont = document.getElementById("listaMovimientos");
  cont.innerHTML = "";

  if (!cliente.movimientos.length) {
    cont.innerHTML = `
      <div class="empty-state">
        <span>💼</span>
        No hay movimientos
      </div>
    `;
    return;
  }

  cliente.movimientos.forEach(m => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <strong>${m.concepto}</strong><br>
      Fecha: ${m.fecha}<br>
      ${
        m.tipo === "compra"
          ? `Importe: ${m.importe} €<br>
             Provisión: ${m.provision.toFixed(2)} €`
          : `Cargo: -${m.importe} €`
      }
      <br><br>
      <button class="btn-danger"
        onclick="eliminarMovimiento('${m.id}')">
        Eliminar
      </button>
    `;
    cont.appendChild(div);
  });
}

/* =====================================================
   ELIMINAR + DESHACER
===================================================== */

function eliminarMovimiento(id) {
  const cliente = getCliente();
  const idx = cliente.movimientos.findIndex(m => m.id === id);
  if (idx === -1) return;

  ultimoMovimientoEliminado = cliente.movimientos[idx];
  cliente.movimientos.splice(idx, 1);

  saveCliente(cliente);
  render();

  showToast("Movimiento eliminado · Deshacer");

  clearTimeout(timeoutDeshacerMovimiento);
  timeoutDeshacerMovimiento = setTimeout(() => {
    ultimoMovimientoEliminado = null;
  }, 4000);
}

function deshacerEliminarMovimiento() {
  if (!ultimoMovimientoEliminado) return;

  const cliente = getCliente();
  cliente.movimientos.push(ultimoMovimientoEliminado);
  saveCliente(cliente);

  ultimoMovimientoEliminado = null;
  render();
  showToast("Movimiento restaurado");
}

/* =====================================================
   GRÁFICOS
===================================================== */

function renderGraficosCliente() {
  const cliente = getCliente();
  if (!cliente.movimientos.length) return;

  const movs = [...cliente.movimientos].sort((a, b) =>
    a.fecha.localeCompare(b.fecha)
  );

  let saldo = 0;
  const labels = [];
  const dataSaldo = [];
  let compras = 0;
  let cargos = 0;

  movs.forEach(m => {
    if (m.tipo === "compra") {
      saldo += m.provision;
      compras += m.provision;
    }
    if (m.tipo === "cargo") {
      saldo -= m.importe;
      cargos += m.importe;
    }
    labels.push(m.fecha);
    dataSaldo.push(saldo);
  });

  if (chartEvolucionCliente) chartEvolucionCliente.destroy();
  chartEvolucionCliente = new Chart(
    document.getElementById("graficoEvolucionCliente"),
    {
      type: "line",
      data: {
        labels,
        datasets: [{
          data: dataSaldo,
          borderColor: "#5fa8d3",
          backgroundColor: "rgba(95,168,211,.15)",
          fill: true,
          tension: 0.35
        }]
      },
      options: { plugins: { legend: { display: false } } }
    }
  );

  if (chartTiposCliente) chartTiposCliente.destroy();
  chartTiposCliente = new Chart(
    document.getElementById("graficoTiposCliente"),
    {
      type: "doughnut",
      data: {
        labels: ["Compras", "Cargos"],
        datasets: [{
          data: [compras, cargos],
          backgroundColor: ["#95d5b2", "#ff8fa3"],
          borderWidth: 0
        }]
      },
      options: {
        cutout: "65%",
        plugins: { legend: { position: "bottom" } }
      }
    }
  );
}

/* =====================================================
   UTILS / RENDER
===================================================== */

function limpiarInputs() {
  document.querySelectorAll("input").forEach(i => i.value = "");
}

function render() {
  renderDatosCliente();

  document.getElementById("saldoCliente").innerText =
    calcularSaldo().toFixed(2) + " €";

  renderCondiciones();
  renderMovimientos();
  renderGraficosCliente();
}

/* INIT */
render();