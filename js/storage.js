const STORAGE_KEY = "pwa_provisiones_data";

function getData() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : { clientes: [] };
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* CLIENTES */
function getClientes() {
  return getData().clientes;
}

function addCliente(cliente) {
  const data = getData();
  data.clientes.push(cliente);
  saveData(data);
}

function deleteCliente(id) {
  const data = getData();
  data.clientes = data.clientes.filter(c => c.id !== id);
  saveData(data);
}