import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase.ts';

export default function SignIn() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validação básica
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      setIsLoading(false);
      return;
    }

    console.log('📧 Email digitado:', email);
    console.log('🔑 Senha digitada:', password);

    try {
      console.log('🔍 Buscando admin com email:', email);

      const { data: admin, error: adminError } = await supabase
        .from('administradores')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .is('deleted_at', null)
        .maybeSingle();

      console.log('📦 Dados retornados:', { admin, adminError });

      if (adminError) {
        console.error('❌ Erro na consulta:', adminError);
        setError('Erro ao verificar credenciais. Tente novamente.');
        setIsLoading(false);
        return;
      }

      if (!admin) {
        console.log('⚠️ Nenhum admin encontrado com este email');
        setError('Email ou senha incorretos');
        setIsLoading(false);
        return;
      }

      const hashedPassword = '$2a$10$' + await sha256(password);

      if (admin.senha !== hashedPassword) {
        console.log('⚠️ Senha incorreta');
        setError('Email ou senha incorretos');
        setIsLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('administradores')
        .update({ ultimo_acesso: new Date().toISOString() })
        .eq('id', admin.id);

      if (updateError) {
        console.error('⚠️ Erro ao atualizar último acesso:', updateError);
      }

      const adminUser = {
        id: admin.id,
        name: admin.nome,
        email: admin.email,
        cargo: admin.cargo,
        avatar: admin.avatar_url,
        type: 'admin'
      };

      localStorage.setItem('admin', JSON.stringify(adminUser));

      console.log('✅ Login bem-sucedido!', adminUser);

      navigate('/admin/default');

    } catch (err) {
      console.error('❌ Erro inesperado:', err);
      setError('Ocorreu um erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-16 mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">

      <div className="mt-[4vh] w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-[420px]">

        <h4 className="mb-2.5 text-4xl font-bold text-navy-700 dark:text-white">
          Login
        </h4>

        <p className="mb-9 ml-1 text-base text-gray-600">
          Insira seus dados nos respectivos campos!
        </p>

        <div className="mb-3 w-full">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite o seu endereço de email"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            required
          />
        </div>

        <div className="mb-3 w-full">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite a sua senha"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            required
          />
        </div>

        {/* ERROR */}
        {error && (
          <p className="text-red-500 text-sm mb-2">{error}</p>
        )}

        {/* LINK */}
        <div className="mb-4 flex items-center justify-between px-2">
          <a
            className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-white"
            href="#"
          >
            Esqueceu sua senha?
          </a>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="linear mt-2 w-full rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Entrando...' : 'Login'}
        </button>

      </div>
    </div>
  );
}