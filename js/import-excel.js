/* =====================================================
   IMPORTAR COMPRAS DESDE EXCEL
===================================================== */

function normalizarImporte(valor) {
  if (typeof valor === "number") return valor;
  if (!valor) return NaN;

  return Number(
    valor.toString()
      .replace(/\./g, "")
      .replace(",", ".")
  );
}

function normalizarFecha(valor) {
  if (!valor) return null;

  // Excel number date
  if (typeof valor === "number") {
    const d = new Date((valor - 25569) * 86400 * 1000);
    return d.toISOString().split("T")[0];
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return valor;
  }

  // DD/MM/YYYY o DD-MM-YYYY
  const m = valor.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (m) {
    return `${m[3]}-${m[2]}-${m[1]}`;
  }

  return null;
}

function importarComprasExcel() {
  const input = document.getElementById("excelCompras");
  if (!input.files.length) {
    showToast("Selecciona un archivo Excel");
    return;
  }

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = e => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rows.length) {
      showToast("El Excel está vacío");
      return;
    }

    const cliente = getCliente();
    let importadas = 0;
    let errores = 0;

    rows.forEach((r, i) => {
      const concepto = (r.concepto || "").toString().trim();
      const importe = normalizarImporte(r.importe);
      const fecha = normalizarFecha(r.fecha);

      if (!concepto || isNaN(importe) || importe <= 0 || !fecha) {
        errores++;
        return;
      }

      const condicion = getCondicionActiva(fecha);
      if (!condicion) {
        errores++;
        return;
      }

      cliente.movimientos.push({
        id: crypto.randomUUID(),
        tipo: "compra",
        concepto,
        importe,
        fecha,
        porcentaje: condicion.porcentaje,
        provision: +(importe * condicion.porcentaje / 100).toFixed(2)
      });

      importadas++;
    });

    saveCliente(cliente);
    render();

    showToast(
      `Importadas: ${importadas} · Errores: ${errores}`
    );

    input.value = "";
  };

  reader.readAsArrayBuffer(file);
}