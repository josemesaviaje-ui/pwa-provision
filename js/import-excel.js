/* =====================================================
   IMPORTACIÓN EXCEL (ROBUSTA Y COHERENTE)
===================================================== */

let excelRows = [];
let validRows = [];

/* ================= EVENTOS ================= */

document.getElementById("btnTemplate")?.addEventListener("click", descargarPlantilla);
document.getElementById("btnPreview")?.addEventListener("click", vistaPrevia);
document.getElementById("btnImport")?.addEventListener("click", importarDatos);

/* ================= PLANTILLA ================= */

function descargarPlantilla() {
  const csv =
`tipo,concepto,fecha,importe
compra,Factura 123,2025-01-15,1200.50
cargo,Descuento comercial,15/01/2025,50
promocion,Promo verano,15-01-2025,100€`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "plantilla_importacion.csv";
  a.click();
}

/* ================= VISTA PREVIA ================= */

function vistaPrevia() {
  const file = document.getElementById("excelFile").files[0];
  if (!file) {
    showToast("Selecciona un archivo Excel");
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    excelRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    renderPreview();
  };

  reader.readAsArrayBuffer(file);
}

/* ================= RENDER PREVIEW ================= */

function renderPreview() {
  validRows = [];

  let html = `
  <table class="table">
    <tr>
      <th>#</th>
      <th>Tipo</th>
      <th>Concepto</th>
      <th>Fecha</th>
      <th>Importe</th>
      <th>Estado</th>
    </tr>`;

  excelRows.forEach((r, i) => {
    const tipo = normalizarTipo(r.tipo);
    const fecha = parseFecha(r.fecha);
    const importe = parseImporte(r.importe);
    const concepto = String(r.concepto || "").trim();

    const valido = !!(tipo && fecha && !isNaN(importe) && concepto);

    if (valido) {
      validRows.push({ tipo, concepto, fecha, importe });
    }

    html += `
      <tr style="background:${valido ? "#e6fffa" : "#ffe6e6"}">
        <td>${i + 1}</td>
        <td>${r.tipo}</td>
        <td>${concepto}</td>
        <td>${r.fecha}</td>
        <td>${r.importe}</td>
        <td>${valido ? "✔ Válido" : "❌ Error"}</td>
      </tr>`;
  });

  html += "</table>";

  document.getElementById("excelPreview").innerHTML = html;
  document.getElementById("btnImport").disabled = validRows.length === 0;
}

/* ================= IMPORTAR ================= */

function importarDatos() {
  if (!validRows.length) {
    showToast("No hay filas válidas para importar");
    return;
  }

  const cliente = getCliente();
  if (!cliente) {
    showToast("Cliente no cargado");
    return;
  }

  cliente.movimientos = cliente.movimientos || [];

  validRows.forEach(r => {
    const mov = {
      id: crypto.randomUUID(),
      tipo: r.tipo,
      concepto: r.concepto,
      fecha: r.fecha,
      importe: r.importe,
      origen: "excel"
    };

    // 👉 PROVISIÓN AUTOMÁTICA (MISMA LÓGICA QUE MANUAL)
    if (mov.tipo === "compra") {
      mov.provision = calcularProvisionMovimiento(mov);
      const cond = getCondicionActiva(mov.fecha);
      mov.porcentaje = cond ? cond.porcentaje : 0;
    }

    cliente.movimientos.push(mov);
  });

  saveCliente(cliente);
  render();

  showToast(`Importadas ${validRows.length} filas correctamente`);
  limpiarExcelUI();
}

/* ================= LIMPIEZA UI ================= */

function limpiarExcelUI() {
  document.getElementById("excelFile").value = "";
  document.getElementById("excelPreview").innerHTML = "";
  document.getElementById("btnImport").disabled = true;
  excelRows = [];
  validRows = [];
}

/* ================= UTILIDADES ================= */

function normalizarTipo(t) {
  if (!t) return null;
  t = String(t).toLowerCase().trim();
  if (["compra", "cargo", "promocion"].includes(t)) return t;
  return null;
}

function parseImporte(v) {
  if (v === null || v === undefined) return NaN;

  let s = String(v)
    .replace(/\s/g, "")
    .replace("€", "")
    .replace("$", "")
    .replace(".", "")
    .replace(",", ".");

  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
}

function parseFecha(f) {
  if (!f) return null;

  if (f instanceof Date) {
    return f.toISOString().split("T")[0];
  }

  const s = String(f).trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY o DD-MM-YYYY
  const m = s.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  return null;
}