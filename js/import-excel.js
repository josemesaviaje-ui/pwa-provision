/* =====================================================
   IMPORTACIÓN EXCEL · COMPRAS / CARGOS
   NO MODIFICA NADA EXISTENTE
===================================================== */

/* ===== ESTADO PARA DESHACER ===== */

let ultimaImportacion = {
  clienteId: null,
  movimientos: []
};

/* =====================================================
   UTIL · NORMALIZAR IMPORTE
===================================================== */

function normalizarImporte(valor) {
  if (valor === null || valor === undefined) return NaN;

  if (typeof valor === "number") {
    return isNaN(valor) ? NaN : valor;
  }

  let txt = valor.toString().trim();
  if (!txt) return NaN;

  txt = txt
    .replace(/€/g, "")
    .replace(/\$/g, "")
    .replace(/£/g, "")
    .replace(/[^\d,.\-]/g, "");

  const tieneComa = txt.includes(",");
  const tienePunto = txt.includes(".");

  if (tieneComa && tienePunto) {
    if (txt.lastIndexOf(",") > txt.lastIndexOf(".")) {
      txt = txt.replace(/\./g, "").replace(",", ".");
    } else {
      txt = txt.replace(/,/g, "");
    }
  } else if (tieneComa) {
    txt = txt.replace(",", ".");
  }

  const num = Number(txt);
  return isNaN(num) ? NaN : num;
}

/* =====================================================
   IMPORTAR COMPRAS
===================================================== */

function importarComprasDesdeExcel(filas, clienteId) {
  const data = getData();
  const cliente = data.clientes.find(c => c.id === clienteId);
  if (!cliente) return;

  let importados = 0;
  let errores = 0;

  ultimaImportacion = {
    clienteId,
    movimientos: []
  };

  filas.forEach(fila => {
    const concepto = (fila.concepto || fila.factura || "").toString().trim();
    const fecha = fila.fecha;
    const importe = normalizarImporte(fila.importe);

    if (!concepto || !fecha || isNaN(importe) || importe <= 0) {
      errores++;
      return;
    }

    const condicion = cliente.condiciones.find(c =>
      fecha >= c.fechaInicio && fecha <= c.fechaFin
    );

    if (!condicion) {
      errores++;
      return;
    }

    const mov = {
      id: crypto.randomUUID(),
      tipo: "compra",
      concepto,
      importe,
      fecha,
      porcentaje: condicion.porcentaje,
      provision: +(importe * condicion.porcentaje / 100).toFixed(2)
    };

    cliente.movimientos.push(mov);
    ultimaImportacion.movimientos.push(mov.id);
    importados++;
  });

  saveData(data);
  render();
  showToast(`Compras importadas: ${importados} · Errores: ${errores}`);
}

/* =====================================================
   IMPORTAR CARGOS
===================================================== */

function importarCargosDesdeExcel(filas, clienteId) {
  const data = getData();
  const cliente = data.clientes.find(c => c.id === clienteId);
  if (!cliente) return;

  let importados = 0;
  let errores = 0;

  ultimaImportacion = {
    clienteId,
    movimientos: []
  };

  filas.forEach(fila => {
    const concepto = (fila.concepto || "").toString().trim();
    const fecha = fila.fecha;
    const importe = normalizarImporte(fila.importe);

    if (!concepto || !fecha || isNaN(importe) || importe <= 0) {
      errores++;
      return;
    }

    const mov = {
      id: crypto.randomUUID(),
      tipo: "cargo",
      concepto,
      importe,
      fecha
    };

    cliente.movimientos.push(mov);
    ultimaImportacion.movimientos.push(mov.id);
    importados++;
  });

  saveData(data);
  render();
  showToast(`Cargos importados: ${importados} · Errores: ${errores}`);
}

/* =====================================================
   DESHACER ÚLTIMA IMPORTACIÓN
===================================================== */

function deshacerUltimaImportacion() {
  if (!ultimaImportacion.clienteId || !ultimaImportacion.movimientos.length) {
    showToast("No hay importación para deshacer");
    return;
  }

  const data = getData();
  const cliente = data.clientes.find(c => c.id === ultimaImportacion.clienteId);
  if (!cliente) return;

  cliente.movimientos = cliente.movimientos.filter(
    m => !ultimaImportacion.movimientos.includes(m.id)
  );

  saveData(data);

  ultimaImportacion = {
    clienteId: null,
    movimientos: []
  };

  render();
  showToast("Importación deshecha correctamente");
}

/* =====================================================
   LECTOR DE ARCHIVO EXCEL (GENÉRICO)
===================================================== */

function leerExcel(file, callback) {
  const reader = new FileReader();

  reader.onload = e => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    callback(filas);
  };

  reader.readAsArrayBuffer(file);
}