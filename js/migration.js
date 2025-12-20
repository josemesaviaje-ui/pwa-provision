// js/migration.js - Subida manual de datos locales a Firestore

import { agregar } from './firestore.js';

window.subirDatosALaNube = async function() {
  if (!confirm("¿Subir todos tus datos locales a la nube?\n\nEsto sincronizará todo con tu cuenta.")) {
    return;
  }

  const datosLocales = localStorage.getItem('pwa_provisiones_data');

  if (!datosLocales) {
    alert("No hay datos locales para subir.");
    return;
  }

  alert("Datos encontrados. Subiendo a la nube... (espera unos segundos)");

  try {
    const data = JSON.parse(datosLocales);

    for (const clienteViejo of data.clientes) {
      const refCliente = await agregar('clientes', {
        codigo: clienteViejo.codigo || '',
        nombre: clienteViejo.nombre || '',
        direccion: clienteViejo.direccion || ''
      });

      const nuevoId = refCliente.id;

      // Condiciones
      if (clienteViejo.condiciones) {
        for (const c of clienteViejo.condiciones) {
          await agregar('condiciones', {
            clienteId: nuevoId,
            porcentaje: c.porcentaje,
            fechaInicio: c.fechaInicio,
            fechaFin: c.fechaFin
          });
        }
      }

      // Movimientos
      if (clienteViejo.movimientos) {
        for (const m of clienteViejo.movimientos) {
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

    alert("¡SUBIDA COMPLETADA! 🎉\n\nTus datos están ahora en la nube.\nRecarga la app en el móvil con tu misma cuenta y los verás.\n\nPuedes borrar este botón cuando quieras.");

  } catch (error) {
    alert("Error al subir datos: " + error.message + "\n\nAsegúrate de tener internet.");
  }
};