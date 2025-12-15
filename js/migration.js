// js/migration.js - Versión super simple con alerts

import { agregar } from './firestore.js';

window.subirDatosALaNube = async function() {
  alert("Botón pulsado. Empezando...");

  const datos = localStorage.getItem('pwa_provisiones_data');

  if (!datos) {
    alert("No hay datos locales para subir. Nada que hacer.");
    return;
  }

  alert("Datos encontrados. Subiendo a la nube... (puede tardar 10-30 segundos)");

  try {
    const parseados = JSON.parse(datos);

    if (!parseados.clientes || parseados.clientes.length === 0) {
      alert("No hay clientes para subir.");
      return;
    }

    alert(`Subiendo ${parseados.clientes.length} clientes...`);

    for (const clienteViejo of parseados.clientes) {
      const refCliente = await agregar('clientes', {
        codigo: clienteViejo.codigo || '',
        nombre: clienteViejo.nombre || '',
        direccion: clienteViejo.direccion || ''
      });

      const idNuevo = refCliente.id;

      // Condiciones
      if (clienteViejo.condiciones && clienteViejo.condiciones.length > 0) {
        for (const c of clienteViejo.condiciones) {
          await agregar('condiciones', {
            clienteId: idNuevo,
            porcentaje: c.porcentaje,
            fechaInicio: c.fechaInicio,
            fechaFin: c.fechaFin
          });
        }
      }

      // Movimientos
      if (clienteViejo.movimientos && clienteViejo.movimientos.length > 0) {
        for (const m of clienteViejo.movimientos) {
          await agregar('movimientos', {
            clienteId: idNuevo,
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

    alert("¡ÉXITO TOTAL! 🎉\n\nTodos tus datos están ahora en la nube.\n\nRecarga la app en el móvil con tu misma cuenta y los verás.");

  } catch (err) {
    alert("ERROR: " + err.message + "\n\nAsegúrate de tener internet bueno e inténtalo de nuevo.");
  }
};