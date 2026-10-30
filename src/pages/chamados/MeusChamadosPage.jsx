import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TicketForm } from "./TicketForm";
import { TicketList } from "./TicketList";
import { chamadoService } from '../../shared/services/chamadoService';
import { chamadoApiParaTela, chamadoTelaParaApi } from '../../utils/chamadoMapper';

export default function MeusChamadosPage() {
  const navigate = useNavigate();

  const [aba, setAba] = useState('lista'); // 'lista' | 'novo'
  const [chamados, setChamados] = useState([]);
  const [rascunhos, setRascunhos] = useState([]); // chamados preenchidos, ainda não enviados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const carregarChamados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // O api.js já devolve o corpo da resposta
      const response = await chamadoService.buscar({}, { page: 0, size: 50 });
      setChamados((response.itens || []).map(chamadoApiParaTela));
    } catch (err) {
      console.error('Erro ao buscar chamados', err);
      setError('Não foi possível carregar os chamados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarChamados();
  }, [carregarChamados]);

  // Formulário preenchido -> vira rascunho na lista
  const handleSubmitForm = (formData) => {
    setRascunhos((prev) => [
      {
        ...formData,
        id_local: Date.now(),
        isPendente: true,
        status: 'Pendente',
        data_abertura: new Date().toISOString(),
      },
      ...prev,
    ]);
    setAba('lista');
  };

  // "Confirmar Envio" -> manda o rascunho para a API
  const handleConfirmTicket = async (ticket) => {
    setError(null);
    try {
      await chamadoService.criar(chamadoTelaParaApi(ticket));
      setRascunhos((prev) => prev.filter((r) => r.id_local !== ticket.id_local));
      await carregarChamados();
    } catch (err) {
      console.error('Erro ao enviar chamado', err);
      setError('Não foi possível enviar o chamado. Ele continua como rascunho.');
    }
  };

  const handleDeletePending = (idLocal) => {
    setRascunhos((prev) => prev.filter((r) => r.id_local !== idLocal));
  };

  const abaClasse = (ativa) =>
    `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
      ativa
        ? 'bg-purple-700 text-white shadow-sm'
        : 'bg-white text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
    }`;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0f0f14] px-4 py-6">
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>

        <div className="flex gap-2">
          <button onClick={() => setAba('lista')} className={abaClasse(aba === 'lista')}>
            Meus chamados
          </button>
          <button onClick={() => setAba('novo')} className={abaClasse(aba === 'novo')}>
            Abrir chamado
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {loading && <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Carregando chamados...</p>}

        {aba === 'novo' ? (
          <TicketForm onSubmit={handleSubmitForm} />
        ) : (
          <TicketList
            tickets={[...rascunhos, ...chamados]}
            onConfirmTicket={handleConfirmTicket}
            onDeletePending={handleDeletePending}
          />
        )}
      </div>
    </div>
  );
}