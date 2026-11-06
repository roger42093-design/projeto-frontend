import axios from 'axios';

// Endereço do back-end, escolhido pelo comando usado (ver .env):
//   npm run dev / npm run dev:local  -> VITE_API_URL_LOCAL
//   npm run dev:remoto               -> VITE_API_URL_REMOTO
//   npm run build (Docker/CI)        -> VITE_API_URL
const URL_POR_MODO = {
  'dev-local': import.meta.env.VITE_API_URL_LOCAL,
  'dev-remoto': import.meta.env.VITE_API_URL_REMOTO,
};

export const API_URL =
  URL_POR_MODO[import.meta.env.MODE] || import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

if (import.meta.env.DEV) {
  console.log(`[API] baseURL ativo: ${api.defaults.baseURL} (modo: ${import.meta.env.MODE})`);
}

// ==========================================
// 2. Interceptador de Requisição (Request)
// ==========================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('@HelpTec:token');

    // Verifica se é uma rota pública de autenticação
    const isPublicAuthRoute =
      config.url?.includes('/api/v1/auth/login') ||
      config.url?.includes('/api/v1/auth/register');

    // Só adiciona o token se ele existir E não for rota de login/registro
    if (token && token !== 'undefined' && token !== 'null' && !isPublicAuthRoute) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} -> ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// ==========================================
// 3. Interceptador de Resposta (Response)
// ==========================================
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const { response } = error;

    if (response) {
      switch (response.status) {
        case 401:
          console.warn('[API] Sessão expirada. Redirecionando...');
          localStorage.removeItem('@HelpTec:token');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          console.error('[API] Acesso negado.');
          break;
        case 404:
          console.error('[API] Recurso não encontrado.');
          break;
        case 500:
          console.error('[API] Erro interno no servidor.');
          break;
        default:
          console.error(`[API Error] Status: ${response.status}`, response.data);
          break;
      }
    } else {
      console.error('[API Network Error] Não foi possível conectar ao servidor ou bloqueio de CORS.');
    }

    return Promise.reject(error);
  }
);

export default api;