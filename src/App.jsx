// src/App.jsx
import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { PrivateRoute } from './shared/components/PrivateRoute';

import './App.css';
import splashImage from './assets/print certo.jpg'; 
import IrParaGoogle from './pages/login/IrParaGoogle';
import { abaJaPassouPeloGoogle, irParaLoginGoogle, marcarAbaComLogin } from './utils/loginGoogle';
import ApproverPage from './pages/aprovador/ApproverPage';
import CandidatePage from './pages/candidato/CandidatePage';
import MeusChamadosPage from './pages/chamados/MeusChamadosPage';
import SupportPage from './pages/suporte/SupportPage';
import WebmailPage from './pages/webmail/WebmailPage';
import ManagerPage from './pages/gestor/ManagerPage';
import { PERFIL, rotaDoPerfil } from './utils/perfis';

// O back volta para cá depois do login com Google: /oauth2/redirect?token=...
// Guarda o token e recarrega na raiz: com o token salvo aparece a tela de abertura
// e depois a área da conta.
const OAuth2RedirectHandler = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) return;
    localStorage.setItem('@HelpTec:token', token);
    marcarAbaComLogin(); // os próximos F5 desta aba não voltam para o Google
    // replace: o token sai do endereço e do histórico do navegador
    window.location.replace('/');
  }, [token]);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-screen bg-[#050505] text-gray-200 px-4 text-center">
        <p className="text-sm">Não foi possível entrar com o Google.</p>
        <button
          onClick={irParaLoginGoogle}
          className="px-5 py-2.5 rounded-lg bg-linear-to-r from-fuchsia-600 to-purple-700 text-white text-sm font-semibold"
        >
          Entrar com o Google
        </button>
      </div>
    );
  }
  return (
    <div className="text-white flex items-center justify-center min-h-screen bg-[#050505]">
      <p>Entrando no HelpTec...</p>
    </div>
  );
};

// Leva a conta logada para a área do seu perfil (USER -> Meus Chamados, APROVADOR -> /aprovador ...)
const IrParaMinhaArea = () => {
  const { perfil } = useContext(AuthContext);
  return <Navigate to={rotaDoPerfil(perfil)} replace />;
};

// Componente Dashboard atualizado com botão de Logout
const Dashboard = () => {
  const { logout } = useContext(AuthContext);

  return (
    <div className="main-content text-white flex flex-col items-center justify-center min-h-screen bg-[#050505]">
      <h1 className="text-3xl font-bold mb-4">Bem-vindo à HelpTec!</h1>
      <p className="text-gray-400 mb-8">Este é o seu ambiente de trabalho protegido.</p>
      <button 
        onClick={logout}
        className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#be123c] to-[#4338ca] text-white font-semibold hover:opacity-85 transition-opacity cursor-pointer"
      >
        Sair da Conta (Logout)
      </button>
    </div>
  );
};

// Ordem ao abrir o site numa aba nova:
//   1. "Escolha uma conta" do Google (mesmo que já exista um login salvo)
//   2. volta em /oauth2/redirect, guarda o token e marca a aba
//   3. tela de abertura e depois a área da conta
// F5 na mesma aba: a aba já está marcada, então vai direto para a tela de abertura.
function temTokenSalvo() {
  try {
    return Boolean(localStorage.getItem('@HelpTec:token'));
  } catch {
    return false;
  }
}

function estaVoltandoDoGoogle() {
  return window.location.pathname.startsWith('/oauth2/');
}

function precisaPassarPeloGoogle() {
  return !abaJaPassouPeloGoogle() && !estaVoltandoDoGoogle();
}

function App() {
  const [irParaGoogle] = useState(precisaPassarPeloGoogle);
  const [isSplashVisible, setIsSplashVisible] = useState(() => !precisaPassarPeloGoogle() && temTokenSalvo());

  useEffect(() => {
    if (irParaGoogle) irParaLoginGoogle();
  }, [irParaGoogle]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isSplashVisible) return undefined;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsSplashVisible(false), 400);
          return 100;
        }
        return prev + 2; 
      });
    }, 40); 
    
    return () => clearInterval(interval);
    // só na primeira abertura da página
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (irParaGoogle) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505] text-gray-300 text-sm">
        Abrindo o login do Google...
      </div>
    );
  }

  if (isSplashVisible) {
    return (
      <div className="splash-screen">
        <img src={splashImage} alt="HelpTec Splash Screen" className="splash-image" />
        <div className="loading-overlay">
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="loading-title">Carregando Sistema {progress}%</p>
          <p className="loading-subtitle">Preparando o ambiente de trabalho</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Sem tela de login: /login vai direto para o Google (pelo back).
              /cadastro (antigo) também leva para o Google. */}
          <Route path="/login" element={<IrParaGoogle />} />
          <Route path="/cadastro" element={<Navigate to="/login" replace />} />
          
          {/* Rota OAuth2 adicionada (mantido /oauth2/ederect conforme solicitado, e /oauth2/redirect por segurança caso seja erro de digitação no backend) */}
          <Route path="/oauth2/ederect" element={<OAuth2RedirectHandler />} />
          <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

          {/* Cada conta só abre a sua área; as outras voltam para a própria área */}
          <Route
            path="/meus-chamados"
            element={
              <PrivateRoute perfis={[PERFIL.FUNCIONARIO]}>
                <MeusChamadosPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/aprovador"
            element={
              <PrivateRoute perfis={[PERFIL.APROVADOR]}>
                <ApproverPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/suporte"
            element={
              <PrivateRoute perfis={[PERFIL.SUPORTE]}>
                <SupportPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/gestor"
            element={
              <PrivateRoute perfis={[PERFIL.GESTOR, PERFIL.ADMIN]}>
                <ManagerPage />
              </PrivateRoute>
            }
          />

          {/* Páginas de todas as contas (sem "perfis") */}
          <Route
            path="/webmail"
            element={
              <PrivateRoute>
                <WebmailPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/candidato"
            element={
              <PrivateRoute>
                <CandidatePage />
              </PrivateRoute>
            }
          />

          {/* "/" e qualquer outro endereço (ex.: /dashboard, /chamados) vão para a área da conta */}
          <Route
            path="*"
            element={
              <PrivateRoute>
                <IrParaMinhaArea />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;