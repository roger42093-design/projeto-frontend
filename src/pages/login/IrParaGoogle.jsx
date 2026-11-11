import { useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { irParaLoginGoogle } from '../../utils/loginGoogle';

// /login: não tem tela; vai direto para o Google (pelo back)
export default function IrParaGoogle() {
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    if (!isAuthenticated) irParaLoginGoogle();
  }, [isAuthenticated]);

  if (isAuthenticated) return <Navigate to="/" replace />;
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050505] text-gray-300 text-sm">
      Abrindo o login do Google...
    </div>
  );
}