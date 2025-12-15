/* =====================================================
   IMPORTACIÓN MASIVA (COMPRAS / CARGOS) - Versión Firestore
===================================================== */

import { agregar, eliminar } from './firestore.js';

// Variable global para deshacer la última importación
let ultimaImportacion = {
  tipo: null,        // "compra" | "cargo"
  movimientoIds: []  // Array de IDs de Firestore de los movimientos añadidos
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
   OBTENER CONDICIÓN ACTIVA (desde el array global del cliente)
===================================================== */

// Esta función la usamos desde condiciones.js, así que la importamos o redefinimos aquí si es necesario
// Como condicionesCliente está en condiciones.js, asumimos que está disponible globalmente
// o la copiamos aquí (recomendado para evitar dependencias circulares)

function getCondicionActiva(fecha) {
  // Copia segura de la función de condiciones.js
  return window.condicionesCliente?.find(c => 
    fecha >= c.fechaInicio && fecha <= c.fechaFin
  );
}

/* =====================================================
   IMPORTAR COMPRAS
===================================================== */

async function importarComprasExcel() {
  const input = document.getElementById("excelCompras");
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const params = new URLSearchParams(window.location.search);
      const clienteId = params.get("id");

      if (!clienteId) {
        showToast("Error: No se pudo identificar el cliente");
        return;
      }

      const movimientosImportados = [];

      for (const r of rows) {
        const concepto = (r.concepto || r.Concepto || "").trim();
        const importe = normalizarImporte(r.importe || r.Importe);
        const fecha = normalizarFecha(r.fecha || r.Fecha);

        if (!concepto || isNaN(importe) || importe <= 0 || !fecha) continue;

        const condicion = getCondicionActiva(fecha);
        if (!condicion) continue;  // Salta si no hay condición activa

        const provision = importe * condicion.porcentaje / 100;

        const docRef = await agregar('movimientos', {
          clienteId,
          tipo: "compra",
          concepto,
          importe,
          fecha,
          porcentaje: condicion.porcentaje,
          provision
        });

        movimientosImportados.push(docRef.id);  // Guardamos el ID real de Firestore
      }

      if (movimientosImportados.length === 0) {
        showToast("No se pudo importar ninguna compra válida");
        return;
      }

      ultimaImportacion = {
        tipo: "compra",
        movimientoIds: movimientosImportados
      };

      showToast(`Importadas ${movimientosImportados.length} compras`);
      input.value = "";  // Limpia el input file

    } catch (error) {
      console.error("Error importando compras:", error);
      showToast("Error al importar el archivo");
    }
  };

  reader.readAsArrayBuffer(file);
}

/* =====================================================
   IMPORTAR CARGOS
===================================================== */

async function importarCargosExcel() {
  const input = document.getElementById("importCargosFile");
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const params = new URLSearchParams(window.location.search);
      const clienteId = params.get("id");

      if (!clienteId) {
        showToast("Error: No se pudo identificar el cliente");
        return;
      }

      const movimientosImportados = [];

      for (const r of rows) {
        const concepto = (r.concepto || r.Concepto || "").trim();
        const importe = normalizarImporte(r.importe || r.Importe);
        const fecha = normalizarFecha(r.fecha || r.Fecha);

        if (!concepto || isNaN(importe) || importe <= 0 || !fecha) continue;

        const docRef = await agregar('movimientos', {
          clienteId,
          tipo: "cargo",
          concepto,
          importe,
          fecha
        });

        movimientosImportados.push(docRef.id);
      }

      if (movimientosImportados.length === 0) {
        showToast("No se pudo importar ningún cargo válido");
        return;
      }

      ultimaImportacion = {
        tipo: "cargo",
        movimientoIds: movimientosImportados
      };

      showToast(`Importados ${movimientosImportados.length} cargos`);
      input.value = "";

    } catch (error) {
      console.error("Error importando cargos:", error);
      showToast("Error al importar el archivo");
    }
  };

  reader.readAsArrayBuffer(file);
}

/* =====================================================
   DESHACER ÚLTIMA IMPORTACIÓN
===================================================== */

async function deshacerUltimaImportacion() {
  if (!ultimaImportacion.movimientoIds.length) {
    showToast("No hay importación para deshacer");
    return;
  }

  try {
    // Eliminamos todos los movimientos de la última importación
    const promesas = ultimaImportacion.movimientoIds.map(id => eliminar('movimientos', id));
    await Promise.all(promesas);

    ultimaImportacion = {
      tipo: null,
      movimientoIds: []
    };

    showToast("Importación deshecha correctamente");
  } catch (error) {
    console.error("Error al deshacer importación:", error);
    showToast("Error al deshacer");
  }
}

/* =====================================================
   EXPORTS GLOBALES (para onclick en HTML)
===================================================== */

// Hacemos las funciones accesibles globalmente
window.importarComprasExcel = importarComprasExcel;
window.importarCargosExcel = importarCargosExcel;
window.deshacerUltimaImportacion = deshacerUltimaImportacion;