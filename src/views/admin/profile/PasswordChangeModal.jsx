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

    const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

    const startCountdown = () => {
        setCountdown(60);
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    // ── Verificar senha actual — mesma lógica do SignIn ──
    const verifyPassword = async (adminId, inputPassword) => {
        const { data: admin, error } = await supabase
            .from('administradores')
            .select('id, senha')
            .eq('id', adminId)
            .single();

        if (error || !admin) return false;

        // Tenta RPC bcrypt primeiro (se existir no servidor)
        const { data: rpcResult, error: rpcError } = await supabase
            .rpc('verify_admin_password', {
                admin_id: adminId,
                input_password: inputPassword,
            });

        if (!rpcError && rpcResult !== null) {
            return rpcResult === true;
        }

        // Fallback: comparação directa em texto simples (igual ao SignIn)
        return admin.senha === inputPassword;
    };

    // ── Step 1: Verificar senha actual ──
    const handleVerifyCurrentPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const match = await verifyPassword(userId, currentPassword);

            if (!match) {
                setError('Senha atual incorreta');
                setIsLoading(false);
                return;
            }

            setSuccess('Senha verificada com sucesso!');
            setTimeout(() => { setSuccess(null); setStep('new'); }, 800);

        } catch (err) {
            console.error('Erro:', err);
            setError('Ocorreu um erro inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Enviar código de recuperação ──
    const sendVerificationCode = async (email, id, name) => {
        try {
            const codigoGerado = generateCode();
            const expiraEm = new Date();
            expiraEm.setMinutes(expiraEm.getMinutes() + 15);

            // Invalidar códigos antigos
            await supabase
                .from('recuperacao_senha')
                .update({ utilizado: true })
                .eq('email', email)
                .eq('utilizado', false);

            const { data: insertedData, error: insertError } = await supabase
                .from('recuperacao_senha')
                .insert([{
                    email,
                    codigo: codigoGerado,
                    tipo_usuario: 'administrador',
                    expira_em: expiraEm.toISOString(),
                    utilizado: false,
                    administrador_id: id,
                }])
                .select()
                .single();

            if (insertError) {
                console.error('Erro ao inserir código:', insertError);
                setError('Erro ao gerar código de verificação: ' + insertError.message);
                return false;
            }

            setRecoveryId(insertedData.id);

            const emailResult = await emailService.sendRecoveryCode({
                to_email: email,
                to_name: name,
                codigo: codigoGerado,
                userType: 'admin',
            });

            if (!emailResult.success) {
                // Em dev, mostrar o código na consola para teste
                console.log('🔐 CÓDIGO DE VERIFICAÇÃO (dev):', codigoGerado);
                setError('Erro ao enviar email. Verifique a consola para o código (ambiente de desenvolvimento).');
                return false;
            }

            return true;

        } catch (err) {
            console.error('Erro em sendVerificationCode:', err);
            setError('Erro ao gerar código de verificação');
            return false;
        }
    };

    // ── Step forgot: buscar admin e enviar código ──
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const { data: admin, error: adminError } = await supabase
                .from('administradores')
                .select('id, nome, email')
                .eq('email', forgotEmail.trim().toLowerCase())
                .is('deleted_at', null)
                .maybeSingle();

            if (adminError || !admin) {
                setError('Email não encontrado');
                setIsLoading(false);
                return;
            }

            setTempUserId(admin.id);
            setTempUserEmail(admin.email);
            setTempUserName(admin.nome);

            const sent = await sendVerificationCode(admin.email, admin.id, admin.nome);
            if (sent) {
                setSuccess('Código enviado para o seu email!');
                setStep('code');
                startCountdown();
            }

        } catch (err) {
            console.error('Erro:', err);
            setError('Ocorreu um erro inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Step code: verificar código ──
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

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
            setSuccess('Código verificado!');
            setTimeout(() => { setSuccess(null); setStep('new'); }, 800);

        } catch (err) {
            console.error('Erro:', err);
            setError('Erro ao verificar código');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Step new: guardar nova senha em texto simples (igual ao SignIn) ──
    const handleNewPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

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
            // Guardar em texto simples — mesma forma como são criadas no GerenciamentoAdmins
            const { error: updateError } = await supabase
                .from('administradores')
                .update({
                    senha: newPassword,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', tempUserId);

            if (updateError) {
                setError('Erro ao atualizar senha');
                setIsLoading(false);
                return;
            }

            // Marcar código como utilizado (se veio do fluxo de recuperação)
            if (recoveryId) {
                await supabase
                    .from('recuperacao_senha')
                    .update({ utilizado: true })
                    .eq('id', recoveryId);
            }

            // Actualizar localStorage para reflectir nova senha (se o utilizador estiver logado)
            try {
                const stored = localStorage.getItem('admin');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    localStorage.setItem('admin', JSON.stringify(parsed));
                    localStorage.setItem('user', JSON.stringify(parsed));
                }
            } catch (_) {}

            setSuccess('Senha atualizada com sucesso!');
            setTimeout(() => { onSuccess?.(); onClose(); }, 1800);

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
        setError(null);
        const sent = await sendVerificationCode(tempUserEmail, tempUserId, tempUserName);
        if (sent) { setSuccess('Novo código enviado!'); startCountdown(); }
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
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Alterar Senha</h3>
                            <p className="text-xs text-gray-500">
                                {step === 'current' && 'Confirme a senha actual'}
                                {step === 'forgot'  && 'Recuperação por email'}
                                {step === 'code'    && 'Introduza o código recebido'}
                                {step === 'new'     && 'Defina a nova senha'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 pt-4 px-6">
                    {['current', 'code', 'new'].map((s, i) => (
                        <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${
                            step === s ? 'w-8 bg-brand-500' :
                            (step === 'new' && i < 2) || (step === 'code' && i < 1)
                                ? 'w-4 bg-brand-300' : 'w-4 bg-gray-200'
                        }`} />
                    ))}
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <p className="text-green-600 text-sm">{success}</p>
                        </div>
                    )}

                    {/* ── Step: senha actual ── */}
                    {step === 'current' && (
                        <form onSubmit={handleVerifyCurrentPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Senha Atual</label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => { setCurrentPassword(e.target.value); setError(null); }}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none pr-12"
                                        placeholder="••••••••"
                                        autoFocus
                                        required
                                    />
                                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" disabled={isLoading || !currentPassword}
                                className="w-full bg-brand-500 text-white py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50">
                                {isLoading ? 'Verificando...' : 'Verificar Senha'}
                            </button>
                            <div className="text-center">
                                <button type="button" onClick={() => { setError(null); setStep('forgot'); }}
                                    className="text-brand-500 hover:text-brand-600 text-sm font-semibold inline-flex items-center gap-1">
                                    <HelpCircle className="w-4 h-4" /> Esqueceu a sua senha?
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── Step: forgot ── */}
                    {step === 'forgot' && (
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email da conta</label>
                                <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-brand-500">
                                    <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    <input type="email" value={forgotEmail}
                                        onChange={(e) => { setForgotEmail(e.target.value); setError(null); }}
                                        className="flex-1 focus:outline-none text-sm"
                                        placeholder="admin@exemplo.com" required />
                                </div>
                            </div>
                            <button type="submit" disabled={isLoading || !forgotEmail}
                                className="w-full bg-brand-500 text-white py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50">
                                {isLoading ? 'Enviando...' : 'Enviar Código'}
                            </button>
                            <div className="text-center">
                                <button type="button" onClick={() => { setError(null); setStep('current'); }}
                                    className="text-brand-500 hover:text-brand-600 text-sm font-semibold">
                                    ← Voltar
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── Step: código ── */}
                    {step === 'code' && (
                        <form onSubmit={handleVerifyCode} className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-700">
                                    <strong>📧 Código enviado para:</strong><br />{tempUserEmail}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Código de Verificação</label>
                                <input type="text" value={codigo}
                                    onChange={(e) => { setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
                                    placeholder="000000" maxLength={6} autoFocus required />
                            </div>
                            <button type="submit" disabled={isLoading || codigo.length !== 6}
                                className="w-full bg-brand-500 text-white py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50">
                                {isLoading ? 'Verificando...' : 'Verificar Código'}
                            </button>
                            <div className="text-center">
                                <button type="button" onClick={handleResendCode}
                                    disabled={countdown > 0 || isLoading}
                                    className="text-brand-500 hover:text-brand-600 text-sm font-semibold disabled:text-gray-400">
                                    {countdown > 0 ? `Reenviar em ${countdown}s` : 'Reenviar Código'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── Step: nova senha ── */}
                    {step === 'new' && (
                        <form onSubmit={handleNewPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                                <div className="relative">
                                    <input type={showNewPassword ? 'text' : 'password'} value={newPassword}
                                        onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none pr-12"
                                        placeholder="••••••••" minLength={6} autoFocus required />
                                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1.5">Mínimo de 6 caracteres</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha</label>
                                <div className="relative">
                                    <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none pr-12"
                                        placeholder="••••••••" minLength={6} required />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {/* Indicador de coincidência */}
                                {confirmPassword.length > 0 && (
                                    <p className={`text-xs mt-1.5 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                                        {newPassword === confirmPassword ? '✓ As senhas coincidem' : '✗ As senhas não coincidem'}
                                    </p>
                                )}
                            </div>
                            <button type="submit" disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                                className="w-full bg-brand-500 text-white py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50">
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