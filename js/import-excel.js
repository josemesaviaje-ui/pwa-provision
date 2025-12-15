/* =====================================================
   IMPORTACIÓN MASIVA (COMPRAS / CARGOS)
===================================================== */

let ultimaImportacion = {
  tipo: null,        // "compra" | "cargo"
  clienteId: null,
  movimientos: []
};

/* =====================================================
   HELPERS
===================================================== */

function normalizarImporte(valor) {
  if (typeof valor === "number") return valor;

  return Number(
    String(valor)
      .replace(/€/g, "")
      .replace(/\$/g, "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
  );
}

function normalizarFecha(fecha) {
  if (fecha instanceof Date) {
    return fecha.toISOString().split("T")[0];
  }

  if (typeof fecha === "number") {
    const d = new Date((fecha - 25569) * 86400 * 1000);
    return d.toISOString().split("T")[0];
  }

  return fecha;
}

/* =====================================================
   IMPORTAR COMPRAS
===================================================== */

function importarComprasExcel(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = e => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const cliente = getCliente();
    const movimientosImportados = [];

    rows.forEach((r, i) => {
      const concepto = (r.concepto || r.Concepto || "").trim();
      const importe = normalizarImporte(r.importe || r.Importe);
      const fecha = normalizarFecha(r.fecha || r.Fecha);

      if (!concepto || !importe || !fecha) return;

      const condicion = getCondicionActiva(fecha);
      if (!condicion) return;

      movimientosImportados.push({
        id: crypto.randomUUID(),
        tipo: "compra",
        concepto,
        importe,
        fecha,
        porcentaje: condicion.porcentaje,
        provision: importe * condicion.porcentaje / 100
      });
    });

    if (!movimientosImportados.length) {
      showToast("No se pudo importar ninguna compra");
      return;
    }

    cliente.movimientos.push(...movimientosImportados);
    saveCliente(cliente);

    ultimaImportacion = {
      tipo: "compra",
      clienteId: cliente.id,
      movimientos: movimientosImportados.map(m => m.id)
    };

    render();
    showToast(`Importadas ${movimientosImportados.length} compras`);
  };

  reader.readAsArrayBuffer(file);
}

/* =====================================================
   IMPORTAR CARGOS
===================================================== */

function importarCargosExcel(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = e => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const cliente = getCliente();
    const movimientosImportados = [];

    rows.forEach(r => {
      const concepto = (r.concepto || r.Concepto || "").trim();
      const importe = normalizarImporte(r.importe || r.Importe);
      const fecha = normalizarFecha(r.fecha || r.Fecha);

      if (!concepto || !importe || !fecha) return;

      movimientosImportados.push({
        id: crypto.randomUUID(),
        tipo: "cargo",
        concepto,
        importe,
        fecha
      });
    });

    if (!movimientosImportados.length) {
      showToast("No se pudo importar ningún cargo");
      return;
    }

    cliente.movimientos.push(...movimientosImportados);
    saveCliente(cliente);

    ultimaImportacion = {
      tipo: "cargo",
      clienteId: cliente.id,
      movimientos: movimientosImportados.map(m => m.id)
    };

    render();
    showToast(`Importados ${movimientosImportados.length} cargos`);
  };

  reader.readAsArrayBuffer(file);
}

/* =====================================================
   DESHACER IMPORTACIÓN
===================================================== */

function deshacerUltimaImportacion() {
  if (!ultimaImportacion.movimientos.length) {
    showToast("No hay importaciones para deshacer");
    return;
  }

  const cliente = getCliente();

  cliente.movimientos = cliente.movimientos.filter(
    m => !ultimaImportacion.movimientos.includes(m.id)
  );

  saveCliente(cliente);

  ultimaImportacion = {
    tipo: null,
    clienteId: null,
    movimientos: []
  };

  render();
  showToast("Importación deshecha correctamente");
}