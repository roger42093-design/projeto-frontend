import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { api } from './services/api';
import { LoginPage } from './pages/login/LoginPage';
import { OAuth2RedirectHandler } from './pages/login/OAuth2RedirectHandler';
import { HomePage } from './pages/home/HomePage';
import { TopBar } from './components/TopBar';
import { TicketForm } from './pages/helpdesk/components/TicketForm';
import { TicketList } from './pages/helpdesk/components/TicketList';
import { ApproverDashboard } from './pages/approver/ApproverDashboard';
import { SupportDashboard } from './pages/support/SupportDashboard';
import { ManagementPortal } from './pages/management/ManagementPortal';
import { WebmailPage } from './pages/webmail/WebmailPage';
import { CandidatePage } from './pages/candidate/CandidatePage';
import { FileText, List, ArrowLeft } from 'lucide-react';
import ChamadosPage from './pages/chamados/ChamadosPage';

// Componente principal interno, protegido pelas rotas privadas
function HelpTecApp() {
  const { user, logout } = useAuth();
  const userEmail = user?.email;
  const [userType, setUserType] = useState('funcionario');
  const [currentPage, setCurrentPage] = useState('home');
  const [activeTab, setActiveTab] = useState('new');
  
  // 1. Estado da Fonte de Verdade Remota (Backend API)
  const [tickets, setTickets] = useState([]);

  // 2. Estado da Fonte de Verdade Local (Rascunhos no Navegador)
  // Inicialização Lazy: só executa a leitura do localStorage na montagem inicial
  const [chamadosPendentes, setChamadosPendentes] = useState(() => {
    const salvos = localStorage.getItem('@helptec-pendentes');
    return salvos ? JSON.parse(salvos) : [];
  });

  // 3. Efeito Colateral: Sincroniza a memória local com o disco (localStorage)
  useEffect(() => {
    localStorage.setItem('@helptec-pendentes', JSON.stringify(chamadosPendentes));
  }, [chamadosPendentes]);

  // Carrega os chamados oficiais da API ao abrir a aplicação
  useEffect(() => {
    api
      .get('/api/chamados')
      .then((res) => setTickets(res.data))
      .catch((err) => console.error('Falha ao carregar chamados:', err));
  }, []);

  const handleLogout = () => {
    logout();
    setCurrentPage('home');
  };

  const handleNavigate = (itemId) => {
    if (itemId === 'portal') setCurrentPage('home');
    else if (itemId === 'helpdesk') setCurrentPage('helpdesk');
    else if (itemId === 'approver') setCurrentPage('approver');
    else if (itemId === 'support') setCurrentPage('support');
    else if (itemId === 'management') setCurrentPage('management');
    else if (itemId === 'webmail') setCurrentPage('webmail');
    else if (itemId === 'candidato') setCurrentPage('candidato');
  };

  // Lógica de Rascunho: Salva localmente com propriedades de segurança
  const handleAddTicket = (ticket) => {
    // Fallback de segurança para garantir a geração de ID em redes sem HTTPS
    const geradorId = window.crypto && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Date.now().toString();

    const novoPendente = {
      ...ticket,
      id_local: geradorId,
      id_chamado: geradorId, // Previne quebra de chave (key) no map do TicketList
      status: 'Pendente',    // Previne erros no mapa de cores
      data_abertura: new Date().toISOString(), 
      isPendente: true       // Flag vital para a renderização condicional
    };
    
    // Adiciona o rascunho no início da lista local
    setChamadosPendentes((prev) => [novoPendente, ...prev]);
    setActiveTab('list');
  };

  // Lógica de Confirmação: Envia para a API e limpa o rascunho
  const handleConfirmarPendente = (chamadoLocal) => {
    // Desestruturação (Rest Operator) para remover dados provisórios
    const { 
      id_local, 
      isPendente, 
      id_chamado, 
      status, 
      data_abertura, 
      ...dadosParaAPI 
    } = chamadoLocal;

    api
      .post('/api/chamados', dadosParaAPI)
      .then((res) => {
        setTickets((prev) => [res.data, ...prev]); // Adiciona aos oficiais
        handleDeletarPendente(id_local);           // Remove dos locais
      })
      .catch((err) => {
        console.error('Falha ao confirmar chamado no servidor:', err);
        alert('Ocorreu um erro ao comunicar com o servidor.');
      });
  };

  // Lógica de Exclusão: Apaga o rascunho sem contactar o servidor
  const handleDeletarPendente = (id_local) => {
    setChamadosPendentes((prev) => prev.filter(t => t.id_local !== id_local));
  };

  const handleUpdateTicket = (id, updates) => {
    api
      .patch(`/api/chamados/${id}`, updates)
      .then((res) => {
        setTickets((prev) =>
          prev.map((ticket) => (ticket.id_chamado === id ? res.data : ticket)),
        );
      })
      .catch((err) => console.error('Falha ao atualizar chamado:', err));
  };

  // Router interno baseado em estado
  if (currentPage === 'home') {
    return <HomePage userEmail={userEmail} onLogout={handleLogout} userType={userType} onUserTypeChange={setUserType} onNavigate={handleNavigate} onNavigateToHelpDesk={() => setCurrentPage('helpdesk')} />;
  }
  if (currentPage === 'approver') {
    return <ApproverDashboard tickets={tickets} onUpdateTicket={handleUpdateTicket} onBack={() => setCurrentPage('home')} userEmail={userEmail} onLogout={handleLogout} userType={userType} onUserTypeChange={setUserType} onNavigate={handleNavigate} />;
  }
  if (currentPage === 'support') {
    return <SupportDashboard tickets={tickets} onUpdateTicket={handleUpdateTicket} onBack={() => setCurrentPage('home')} userEmail={userEmail} onLogout={handleLogout} userType={userType} onUserTypeChange={setUserType} onNavigate={handleNavigate} />;
  }
  if (currentPage === 'management') {
    return <ManagementPortal tickets={tickets} onUpdateTicket={handleUpdateTicket} onBack={() => setCurrentPage('home')} userEmail={userEmail} onLogout={handleLogout} userType={userType} onUserTypeChange={setUserType} onNavigate={handleNavigate} />;
  }
  if (currentPage === 'webmail') {
    return <WebmailPage onBack={() => setCurrentPage('home')} userEmail={userEmail} onLogout={handleLogout} userType={userType} onUserTypeChange={setUserType} onNavigate={handleNavigate} />;
  }
  if (currentPage === 'candidato') {
    return <CandidatePage onBack={() => setCurrentPage('home')} userEmail={userEmail} onLogout={handleLogout} userType={userType} onUserTypeChange={setUserType} onNavigate={handleNavigate} />;
  }

  // Renderização principal do HelpDesk
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage('home')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Voltar</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Sistema de Help Desk
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Portal do Solicitante
                </p>
              </div>
            </div>
            <TopBar
              userEmail={userEmail}
              onLogout={handleLogout}
              userType={userType}
              onUserTypeChange={setUserType}
              onNavigate={handleNavigate}
            />
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('new')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 transition-colors ${activeTab === 'new' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Abrir Chamado</span>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 transition-colors ${activeTab === 'list' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <List className="w-5 h-5" />
              <span className="font-medium">Meus Chamados</span>
              <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                {/* Total reflete a união dos dois estados */}
                {tickets.length + chamadosPendentes.length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'new' ? (
          <TicketForm onSubmit={handleAddTicket} />
        ) : (
          <TicketList 
            // Unimos os rascunhos no topo, seguidos dos chamados oficiais
            tickets={[...chamadosPendentes, ...tickets]} 
            onUpdateTicket={handleUpdateTicket} 
            onConfirmTicket={handleConfirmarPendente}
            onDeletePending={handleDeletarPendente}
          />
        )}
      </main>
    </div>
  );
}

// Ponto de entrada de rotas e contextos globais
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/chamados" element={<ChamadosPage />} />
          <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <HelpTecApp />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}