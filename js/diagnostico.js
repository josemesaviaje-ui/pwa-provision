// js/diagnostico.js - Diagnóstico temporal

import { db, collection, getDocs } from './firestore.js';

window.diagnosticoFirestore = async function() {
  const resultado = document.getElementById('diagnosticoResultado');
  resultado.innerHTML = "Cargando datos de Firestore...";

  try {
    // Contar clientes
    const snapClientes = await getDocs(collection(db, "clientes"));
    const numClientes = snapClientes.size;
    const clientesLista = [];
    snapClientes.forEach(doc => clientesLista.push(doc.data().nombre || "Sin nombre"));

    // Contar movimientos
    const snapMov = await getDocs(collection(db, "movimientos"));
    const numMov = snapMov.size;

    // Contar condiciones
    const snapCond = await getDocs(collection(db, "condiciones"));
    const numCond = snapCond.size;

    resultado.innerHTML = `
      <strong>✅ Conexión a Firestore OK</strong><br><br>
      Clientes: <strong>${numClientes}</strong><br>
      ${clientesLista.join("<br>")}
      <br><br>
      Movimientos (compras/cargos): <strong>${numMov}</strong><br>
      Condiciones: <strong>${numCond}</strong><br><br>
      Si ves números >0 y nombres de clientes → los datos están en la nube.<br>
      Recarga la app para que se muestren en dashboard y listas.
    `;

  } catch (error) {
    resultado.innerHTML = `
      <strong>❌ Error conectando a Firestore:</strong><br>
      ${error.message}<br><br>
      Posibles causas:<br>
      - No estás logueado<br>
      - Problema de internet<br>
      - Config de Firebase incorrecta
    `;
  }
};