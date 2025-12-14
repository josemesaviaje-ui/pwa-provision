function exportarPDF() {
  if (!datosInforme.length) {
    alert("No hay datos para exportar");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // TÍTULO
  doc.setFontSize(16);
  doc.text("Informe de Provisiones", 14, 15);

  // FECHA
  doc.setFontSize(10);
  doc.text(
    "Generado el: " + new Date().toLocaleDateString(),
    14,
    22
  );

  // TABLA
  const columnas = [
    "Cliente",
    "Fecha",
    "Tipo",
    "Concepto",
    "Importe",
    "Provisión"
  ];

  const filas = datosInforme.map(d => [
    d.Cliente,
    d.Fecha,
    d.Tipo,
    d.Concepto,
    d.Importe,
    d.Provisión
  ]);

  doc.autoTable({
    head: [columnas],
    body: filas,
    startY: 28,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [142, 202, 230] }
  });

  doc.save("informe_provisiones.pdf");
}