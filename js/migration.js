// js/migration.js - Solo botón manual simple

import { agregar } from './firestore.js';

// BOTÓN MANUAL PARA SUBIR DATOS
window.subirDatosALaNube = async function() {
  if (!confirm("¿Subir TODOS tus datos actuales a la nube ahora?\n\nDespués podrás verlos en cualquier móvil o tablet con tu misma cuenta.")) {
    return;
  }

  const datosAntiguos = localStorage.getItem('pwa_provisiones_data');

  if (!datosAntiguos) {
    alert("No hay datos en la app para subir. Nada que hacer.");
    return;
  }

  alert("Subiendo datos a la nube... Espera unos segundos (no cierres la app).");

  try {
    const data = JSON.parse(datosAntiguos);

    for (const clienteAntiguo of data.clientes) {
      // Crear cliente nuevo en la nube
      const clienteRef = await agregar('clientes', {
        codigo: clienteAntiguo.codigo || '',
        nombre: clienteAntiguo.nombre || '',
        direccion: clienteAntiguo.direccion || ''
      });

      const nuevoId = clienteRef.id;

      // Subir condiciones
      if (clienteAntiguo.condiciones) {
        for (const c of clienteAntiguo.condiciones) {
          await agregar('condiciones', {
            clienteId: nuevoId,
            porcentaje: c.porcentaje,
            fechaInicio: c.fechaInicio,
            fechaFin: c.fechaFin
          });
        }
      }

      // Subir movimientos (compras y cargos)
      if (clienteAntiguo.movimientos) {
        for (const m of clienteAntiguo.movimientos) {
          await agregar('movimientos', {
            clienteId: nuevoId,
            tipo: m.tipo,
            concepto: m.concepto,
            importe: m.importe,
            fecha: m.fecha,
            porcentaje: m.porcentaje || 0,
            provision: m.provision || 0
          });
        }
      }
    }

    alert("¡TODO SUBIDO A LA NUBE! 🎉\n\nAhora recarga la app en el móvil con tu misma cuenta y verás todos los datos.\n\nPuedes borrar este botón cuando quieras.");

  } catch (error) {
    alert("Error al subir los datos: " + error.message + "\n\nAsegúrate de tener internet e inténtalo de nuevo.");
  }
};