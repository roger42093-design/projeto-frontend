// O login com Google começa no back: ele leva para "Escolha uma conta" do Google
// (o back pede prompt=select_account) e, depois, devolve para o front em
// /oauth2/redirect?token=...
const ENDERECO_DO_BACK = import.meta.env.VITE_API_URL || 'http://localhost:8080';
export const ENDERECO_LOGIN_GOOGLE = `${ENDERECO_DO_BACK}/oauth2/authorization/google`;

// Marca "esta aba já passou pelo Google". Fica no sessionStorage: vale para os F5
// da mesma aba e some quando a aba é fechada. Aba ou janela nova = Google de novo.
const MARCA_ABA_COM_LOGIN = '@HelpTec:aba-com-login';

export function irParaLoginGoogle() {
  window.location.replace(ENDERECO_LOGIN_GOOGLE);
}

export function marcarAbaComLogin() {
  try {
    sessionStorage.setItem(MARCA_ABA_COM_LOGIN, 'sim');
  } catch {
    /* sem sessionStorage: o Google vai aparecer em todo carregamento */
  }
}

export function abaJaPassouPeloGoogle() {
  try {
    return sessionStorage.getItem(MARCA_ABA_COM_LOGIN) === 'sim';
  } catch {
    return false;
  }
}