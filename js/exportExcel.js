function exportarExcel() {
  if (!datosInforme.length) {
    alert("No hay datos para exportar");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(datosInforme);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Informe");

  XLSX.writeFile(wb, "informe_provisiones.xlsx");
}