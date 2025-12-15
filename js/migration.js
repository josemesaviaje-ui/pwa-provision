// js/migration.js - Versión con alertas para ver qué pasa

import { agregar } from './firestore.js';

export async function migrarDatosAntiguos() {
  alert("🔄 Empezando comprobación de datos antiguos...");

  const datosAntiguos = localStorage.getItem('pwa_provisiones_data');

  if (!datosAntiguos) {
    alert("ℹ️ No hay datos antiguos en localStorage. Nada que migrar.");
    return;
  }

  if (localStorage.getItem('datosMigrados')) {
    alert("ℹ️ Los datos ya fueron migrados antes.");
    return;
  }

  alert("✅ Encontrados datos antiguos. Iniciando subida a la nube...\n\nEsto puede tardar unos segundos.");

  try {
    const dataAntigua = JSON.parse(datosAntiguos);

    if (!dataAntigua.clientes || dataAntigua.clientes.length === 0) {
      alert("ℹ️ No hay clientes para migrar.");
      return;
    }

    let contador = 0;

    for (const clienteAntiguo of dataAntigua.clientes) {
      // Crear cliente
      const clienteRef = await agregar('clientes', {
        codigo: clienteAntiguo.codigo || '',
        nombre: clienteAntiguo.nombre || '',
        direccion: clienteAntiguo.direccion || ''
      });

      const nuevoClienteId = clienteRef.id;

      // Migrar condiciones
      if (clienteAntiguo.condiciones && clienteAntiguo.condiciones.length > 0) {
        for (const cond of clienteAntiguo.condiciones) {
          await agregar('condiciones', {
            clienteId: nuevoClienteId,
            porcentaje: cond.porcentaje,
            fechaInicio: cond.fechaInicio,
            fechaFin: cond.fechaFin
          });
          contador++;
        }
      }

      // Migrar movimientos
      if (clienteAntiguo.movimientos && clienteAntiguo.movimientos.length > 0) {
        for (const mov of clienteAntiguo.movimientos) {
          await agregar('movimientos', {
            clienteId: nuevoClienteId,
            tipo: mov.tipo,
            concepto: mov.concepto,
            importe: mov.importe,
            fecha: mov.fecha,
            porcentaje: mov.porcentaje || 0,
            provision: mov.provision || 0
          });
          contador++;
        }
      }
    }

    // Marcar como migrado
    localStorage.setItem('datosMigrados', 'true');

    alert(`🎉 ¡MIGRACIÓN COMPLETADA!\n\nSe han subido todos tus datos a la nube.\nRecarga la app para verlos desde Firestore.\n\nAhora puedes usar la app en cualquier dispositivo con tu cuenta.`);

    // Recargar automáticamente
    location.reload();

  } catch (error) {
    console.error(error);
    alert("❌ Error durante la migración:\n" + error.message + "\n\nRevisa tu conexión a internet e inténtalo de nuevo.");
  }
}

// BOTÓN TEMPORAL
window.forzarMigracion = async function() {
  if (!confirm("¿Forzar la migración ahora?\n\nEsto subirá TODOS tus datos antiguos a la nube.")) {
    return;
  }

  localStorage.removeItem('datosMigrados');  // Forzar aunque ya esté marcado
  await migrarDatosAntiguos();
}