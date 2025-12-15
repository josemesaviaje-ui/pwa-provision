// js/migration.js
import { agregar } from "./firestore.js";

// Solo se ejecuta si hay datos en localStorage y no se ha migrado ya
export async function migrarDatosAntiguos() {
  if (!localStorage.getItem('datosMigrados') && localStorage.getItem('clientes')) {
    console.log("Migrando datos antiguos a Firestore...");

    // Migrar clientes
    const clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
    for (const cliente of clientes) {
      const nuevoId = await agregar('clientes', {
        codigo: cliente.codigo,
        nombre: cliente.nombre,
        direccion: cliente.direccion || ''
      });
      // Ahora migrar todo lo relacionado con este cliente (compras, cargos, condiciones)
      // Asumimos que tienes estructuras como compras_clienteId, etc.
      // Ejemplo genérico (adapta según tu estructura actual):
      const compras = JSON.parse(localStorage.getItem(`compras_${cliente.codigo}`) || '[]');
      for (const compra of compras) {
        await agregar('compras', {
          clienteId: nuevoId.id || cliente.codigo,  // mejor usar el nuevo ID de Firestore
          concepto: compra.concepto,
          importe: compra.importe,
          fecha: compra.fecha
        });
      }
      // Repite para cargos, condiciones, etc.
    }

    localStorage.setItem('datosMigrados', 'true');
    console.log("Migración completada");
    alert("Datos migrados a la nube. Ahora se sincronizarán en todos tus dispositivos.");
  }
}

// BOTÓN TEMPORAL - QUITAR DESPUÉS
window.forzarMigracion = async function() {
  if (!confirm("¿Subir todos tus datos antiguos a la nube ahora?\n\nEsto sincronizará todo con tu cuenta.")) {
    return;
  }

  // Forzar borrando la marca de migrado
  localStorage.removeItem('datosMigrados');

  await migrarDatosAntiguos();
}