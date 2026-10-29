// Formatadores usados pelas páginas de chamados

export function formatarId(id) {
  if (id === null || id === undefined) return '-';
  return String(id).padStart(4, '0');
}

export function formatarDataHora(data) {
  if (!data) return '-';
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Aceita "Alta", "ALTA", "Crítica", "CRITICA"... (ignora acento e maiúscula)
function normalizar(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function getPriorityColor(prioridade) {
  switch (normalizar(prioridade)) {
    case 'critica':
      return 'bg-red-100 text-red-800';
    case 'alta':
      return 'bg-orange-100 text-orange-800';
    case 'media':
      return 'bg-yellow-100 text-yellow-800';
    case 'baixa':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}