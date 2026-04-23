import { useState } from 'react';
import { X, Mail, KeyRound, Lock, CheckCircle, AlertCircle, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase.ts';
import { emailService } from '../../../services/emailService.ts';

const PasswordChangeModal = ({ isOpen, onClose, userId, userEmail, userName, onSuccess }) => {
    const [step, setStep] = useState('current');
    const [currentPassword, setCurrentPassword] = useState('');
    const [forgotEmail, setForgotEmail] = useState(userEmail);
    const [codigo, setCodigo] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [countdown, setCountdown] = useState(0);
    const [recoveryId, setRecoveryId] = useState(null);
    const [tempUserId, setTempUserId] = useState(userId);
    const [tempUserEmail, setTempUserEmail] = useState(userEmail);
    const [tempUserName, setTempUserName] = useState(userName);

    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const generateCode = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const startCountdown = () => {
        setCountdown(60);
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const findAdminByEmail = async (email) => {
        const { data, error } = await supabase
            .from('administradores')
            .select('id, nome, email')
            .eq('email', email)
            .maybeSingle();

        if (error) {
            console.error('Erro ao buscar administrador:', error);
            return null;
        }

        return data;
    };

    const handleVerifyCurrentPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data: admin, error } = await supabase
                .from('administradores')
                .select('senha')
                .eq('id', userId)
                .single();

            if (error || !admin) {
                setError('Erro ao verificar administrador');
                setIsLoading(false);
                return;
            }

            const hashedCurrentPassword = '$2a$10$' + await sha256(currentPassword);

            if (admin.senha !== hashedCurrentPassword) {
                setError('Senha atual incorreta');
                setIsLoading(false);
                return;
            }

            setSuccess('Senha verificada com sucesso!');
            setStep('new');

        } catch (err) {
            console.error('Erro:', err);
            setError('Ocorreu um erro inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    const sendVerificationCode = async (email, id, name) => {
        try {
            const codigoGerado = generateCode();
            const expiraEm = new Date();
            expiraEm.setMinutes(expiraEm.getMinutes() + 15);

            console.log('📝 Gerando código para:', { email, id, name });
            console.log('🔑 Código gerado:', codigoGerado);

            // Primeiro, marcar códigos antigos como utilizados
            const { error: updateError } = await supabase
                .from('recuperacao_senha')
                .update({ utilizado: true })
                .eq('email', email)
                .eq('utilizado', false);

            if (updateError) {
                console.error('⚠️ Erro ao atualizar códigos antigos:', updateError);
                // Não interrompe o fluxo, apenas loga o erro
            }

            // Inserir novo código
            const insertData = {
                email: email,
                codigo: codigoGerado,
                tipo_usuario: 'administrador',
                expira_em: expiraEm.toISOString(),
                utilizado: false,
                administrador_id: id
            };

            console.log('📦 Inserindo no banco:', insertData);

            const { data: insertedData, error: insertError } = await supabase
                .from('recuperacao_senha')
                .insert([insertData])
                .select()
                .single();

            if (insertError) {
                console.error('❌ Erro detalhado ao inserir código:', insertError);

                // Mensagens de erro mais específicas
                if (insertError.code === '23503') {
                    setError('Erro de chave estrangeira. Verifique se o administrador existe.');
                } else if (insertError.code === '23505') {
                    setError('Já existe um código ativo para este email. Aguarde ou tente novamente.');
                } else if (insertError.code === '42P01') {
                    setError('Tabela de recuperação não encontrada. Contacte o administrador.');
                } else {
                    setError(`Erro ao gerar código: ${insertError.message}`);
                }
                return false;
            }

            console.log('✅ Código inserido com sucesso:', insertedData);
            setRecoveryId(insertedData.id);

            // Tentar enviar email
            const emailResult = await emailService.sendRecoveryCode({
                to_email: email,
                to_name: name,
                codigo: codigoGerado,
                userType: 'admin'
            });

            if (!emailResult.success) {
                console.log('⚠️ Falha no envio do email, mas código foi gerado:', codigoGerado);

                // Em desenvolvimento, mostrar o código
                if (process.env.NODE_ENV === 'development') {
                    alert(`🔐 CÓDIGO DE VERIFICAÇÃO: ${codigoGerado}\n\nO email não pôde ser enviado, mas o código foi gerado com sucesso. Use este código para teste.`);
                }

                setError('Erro ao enviar email. Use o código mostrado no console.');
                return false;
            }

            return true;

        } catch (err) {
            console.error('❌ Erro inesperado em sendVerificationCode:', err);
            setError('Erro ao gerar código de verificação');
            return false;
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            console.log('🔍 Buscando admin com email:', forgotEmail);

            const { data: admin, error: adminError } = await supabase
                .from('administradores')
                .select('id, nome, email')
                .eq('email', forgotEmail)
                .maybeSingle();

            if (adminError) {
                console.error('❌ Erro ao buscar admin:', adminError);
                setError('Erro ao verificar email');
                setIsLoading(false);
                return;
            }

            if (!admin) {
                console.log('⚠️ Admin não encontrado');
                setError('Email não encontrado');
                setIsLoading(false);
                return;
            }

            console.log('✅ Admin encontrado:', admin);

            setTempUserId(admin.id);
            setTempUserEmail(admin.email);
            setTempUserName(admin.nome);

            const sent = await sendVerificationCode(admin.email, admin.id, admin.nome);

            if (sent) {
                setSuccess('Código enviado para seu email!');
                setStep('code');
                startCountdown();
            }

        } catch (err) {
            console.error('❌ Erro inesperado:', err);
            setError('Ocorreu um erro inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data: recovery, error: recoveryError } = await supabase
                .from('recuperacao_senha')
                .select('*')
                .eq('email', tempUserEmail)
                .eq('codigo', codigo)
                .eq('utilizado', false)
                .gte('expira_em', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (recoveryError || !recovery) {
                setError('Código inválido ou expirado');
                setIsLoading(false);
                return;
            }

            setRecoveryId(recovery.id);
            setSuccess('Código verificado com sucesso!');
            setStep('new');

        } catch (err) {
            console.error('Erro:', err);
            setError('Erro ao verificar código');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (newPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            setIsLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem');
            setIsLoading(false);
            return;
        }

        try {
            const hashedPassword = '$2a$10$' + await sha256(newPassword);

            const { error: updateError } = await supabase
                .from('administradores')
                .update({
                    senha: hashedPassword,
                    updated_at: new Date().toISOString()
                })
                .eq('id', tempUserId);

            if (updateError) {
                console.error('Erro ao atualizar senha:', updateError);
                setError('Erro ao atualizar senha');
                setIsLoading(false);
                return;
            }

            if (recoveryId) {
                await supabase
                    .from('recuperacao_senha')
                    .update({ utilizado: true })
                    .eq('id', recoveryId);
            }

            setSuccess('Senha atualizada com sucesso!');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);

        } catch (err) {
            console.error('Erro:', err);
            setError('Erro ao atualizar senha');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (countdown > 0) return;
        setIsLoading(true);
        const sent = await sendVerificationCode(tempUserEmail, tempUserId, tempUserName);
        if (sent) {
            setSuccess('Novo código enviado!');
            startCountdown();
        }
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-navy-100 rounded-xl flex items-center justify-center">
                            <Lock className="w-5 h-5 text-navy-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Alterar Senha</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <p className="text-green-600 text-sm">{success}</p>
                        </div>
                    )}

                    {/* Step 1: Current Password */}
                    {step === 'current' && (
                        <form onSubmit={handleVerifyCurrentPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Senha Atual
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none pr-12"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !currentPassword}
                                className="w-full bg-brand-500 text-white py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Verificando...' : 'Verificar Senha'}
                            </button>

                            <div className="text-center mt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep('forgot')}
                                    className="text-brand-500 hover:text-brand-600 text-sm font-semibold inline-flex items-center gap-1"
                                >
                                    <HelpCircle className="w-4 h-4" />
                                    Esqueceu a sua senha?
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step: Forgot Password - Email Input */}
                    {step === 'forgot' && (
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email da conta
                                </label>
                                <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-brand-500">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        className="flex-1 focus:outline-none"
                                        placeholder="admin@exemplo.com"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !forgotEmail}
                                className="w-full bg-brand-500 text-white py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Enviando...' : 'Enviar Código'}
                            </button>

                            <div className="text-center mt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep('current')}
                                    className="text-brand-500 hover:text-brand-600 text-sm font-semibold"
                                >
                                    Voltar
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 2: Code Verification */}
                    {step === 'code' && (
                        <form onSubmit={handleVerifyCode} className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-700">
                                    <strong>📧 Código enviado para:</strong>
                                    <br />
                                    {tempUserEmail}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Código de Verificação
                                </label>
                                <input
                                    type="text"
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || codigo.length !== 6}
                                className="w-full bg-brand-500 text-white py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Verificando...' : 'Verificar Código'}
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={countdown > 0 || isLoading}
                                    className="text-brand-500 hover:text-brand-600 text-sm font-semibold disabled:text-gray-400"
                                >
                                    {countdown > 0 ? `Reenviar em ${countdown}s` : 'Reenviar Código'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: New Password */}
                    {step === 'new' && (
                        <form onSubmit={handleNewPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nova Senha
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none pr-12"
                                        placeholder="••••••••"
                                        minLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1.5">Mínimo de 6 caracteres</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirmar Nova Senha
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none pr-12"
                                        placeholder="••••••••"
                                        minLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !newPassword || !confirmPassword}
                                className="w-full bg-brand-500 text-white py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Atualizando...' : 'Atualizar Senha'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PasswordChangeModal;