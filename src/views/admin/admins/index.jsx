import React, { useState, useEffect } from 'react';
import { FaTrash, FaPlus, FaLock, FaShieldAlt, FaCrown, FaUserCheck, FaUserSlash, FaEye, FaEyeSlash } from 'react-icons/fa';
import Card from 'components/card';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
} from '@tanstack/react-table';
import { SyncLoader } from 'react-spinners';
import styled from 'styled-components';
import { supabase } from '../../../lib/supabase.ts';

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

const GerenciamentoAdmins = () => {
    const [admins, setAdmins] = useState([]);
    const [suspendedAdmins, setSuspendedAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [globalFilterSuspended, setGlobalFilterSuspended] = useState('');
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showReactivateModal, setShowReactivateModal] = useState(false);
    const [adminToDelete, setAdminToDelete] = useState(null);
    const [adminToReactivate, setAdminToReactivate] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({ nome: '', email: '', senha: '' });
    const [showFormPassword, setShowFormPassword] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyPassword, setVerifyPassword] = useState('');

    const isSuperAdmin = currentUser?.role === 'super_admin';

    // ── Carregar utilizador actual ──
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try { setCurrentUser(JSON.parse(storedUser)); }
            catch (err) { console.error('Erro ao parsear usuário:', err); }
        }
    }, []);

    useEffect(() => {
        if (currentUser?.id) refreshCurrentUser();
    }, [currentUser?.id]);

    const refreshCurrentUser = async () => {
        const { data } = await supabase
            .from('administradores')
            .select('id, nome, email, role, cargo')
            .eq('id', currentUser?.id)
            .single();
        if (data) {
            const updated = { ...currentUser, ...data };
            setCurrentUser(updated);
            localStorage.setItem('user', JSON.stringify(updated));
            localStorage.setItem('admin', JSON.stringify(updated));
        }
    };

    // ── Buscar admins ──
    const fetchAdmins = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: active, error: e1 } = await supabase
                .from('administradores')
                .select('*')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });
            if (e1) throw e1;
            setAdmins(active || []);

            // Suspensos: só o super admin carrega
            if (isSuperAdmin) {
                const { data: suspended, error: e2 } = await supabase
                    .from('administradores')
                    .select('*')
                    .not('deleted_at', 'is', null)
                    .order('deleted_at', { ascending: false });
                if (e2) throw e2;
                setSuspendedAdmins(suspended || []);
            }
        } catch (err) {
            setError('Erro ao carregar administradores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAdmins(); }, [isSuperAdmin]);

    // ── Verificar senha antes de suspender ──
    const handleVerifyAndDelete = async () => {
        if (!verifyPassword) { setError('Por favor, digite sua senha'); return; }
        setIsVerifying(true);
        setError(null);
        try {
            const { data: admin, error: fetchError } = await supabase
                .from('administradores')
                .select('id, senha, role')
                .eq('id', currentUser?.id)
                .single();

            if (fetchError || !admin) { setError('Administrador não encontrado'); return; }

            let passwordMatch = false;
            const { data: rpcResult, error: rpcError } = await supabase
                .rpc('verify_admin_password', { admin_id: currentUser?.id, input_password: verifyPassword });

            passwordMatch = (!rpcError && rpcResult !== null)
                ? rpcResult === true
                : admin.senha === verifyPassword;

            if (!passwordMatch) { setError('Senha incorreta.'); return; }

            setShowVerifyModal(false);
            setVerifyPassword('');
            setShowDeleteModal(true);
        } catch (err) {
            setError('Erro ao verificar senha');
        } finally {
            setIsVerifying(false);
        }
    };

    // ── Adicionar admin ──
    const handleAddAdmin = async () => {
        if (!formData.nome || !formData.email || !formData.senha) {
            setError('Preencha todos os campos obrigatórios');
            return;
        }
        if (formData.senha.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data: existing } = await supabase
                .from('administradores')
                .select('email')
                .eq('email', formData.email.trim().toLowerCase())
                .maybeSingle();

            if (existing) { setError('Email já registado'); setLoading(false); return; }

            const { error: insertError } = await supabase
                .from('administradores')
                .insert([{
                    nome: formData.nome,
                    email: formData.email.trim().toLowerCase(),
                    senha: formData.senha,
                    cargo: 'Administrador',
                    role: 'admin',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }]);

            if (insertError) throw insertError;

            setSuccess('Administrador criado com sucesso!');
            setShowAddModal(false);
            setFormData({ nome: '', email: '', senha: '' });
            await fetchAdmins();
            setTimeout(() => setSuccess(null), 6000);
        } catch (err) {
            setError('Erro ao adicionar administrador: ' + (err.message || ''));
        } finally {
            setLoading(false);
        }
    };

    // ── Suspender ──
    const handleDeleteAdmin = async () => {
        setLoading(true);
        setError(null);
        try {
            if (adminToDelete === currentUser?.id) {
                setError('Não pode suspender a sua própria conta');
                setLoading(false);
                return;
            }
            const { error: deleteError } = await supabase
                .from('administradores')
                .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
                .eq('id', adminToDelete);

            if (deleteError) throw deleteError;
            setSuccess('Administrador suspenso com sucesso!');
            setShowDeleteModal(false);
            setAdminToDelete(null);
            await fetchAdmins();
            setTimeout(() => setSuccess(null), 4000);
        } catch (err) {
            setError('Erro ao suspender administrador');
        } finally {
            setLoading(false);
        }
    };

    // ── Reativar ──
    const handleReactivateAdmin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error: reactivateError } = await supabase
                .from('administradores')
                .update({ deleted_at: null, updated_at: new Date().toISOString() })
                .eq('id', adminToReactivate);

            if (reactivateError) throw reactivateError;
            setSuccess('Administrador reativado com sucesso!');
            setShowReactivateModal(false);
            setAdminToReactivate(null);
            await fetchAdmins();
            setTimeout(() => setSuccess(null), 4000);
        } catch (err) {
            setError('Erro ao reativar administrador');
        } finally {
            setLoading(false);
        }
    };

    const prepareDelete = (adminId) => {
        if (!isSuperAdmin) return;
        setAdminToDelete(adminId);
        setError(null);
        setVerifyPassword('');
        setShowVerifyModal(true);
    };

    const prepareReactivate = (adminId) => {
        if (!isSuperAdmin) return;
        setAdminToReactivate(adminId);
        setError(null);
        setShowReactivateModal(true);
    };

    // ── Definição de colunas ──
    const columnHelper = createColumnHelper();

    const activeColumns = [
        columnHelper.accessor('id', {
            header: () => <p className="text-sm font-bold text-gray-600">ID</p>,
            cell: (info) => <p className="text-xs text-gray-400 font-mono">{info.getValue().substring(0, 8)}…</p>,
        }),
        columnHelper.accessor('nome', {
            header: () => <p className="text-sm font-bold text-gray-600">NOME</p>,
            cell: (info) => (
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-navy-700">{info.getValue()}</p>
                    {info.row.original.id === currentUser?.id && <span className="text-xs text-gray-400">(você)</span>}
                </div>
            ),
        }),
        columnHelper.accessor('email', {
            header: () => <p className="text-sm font-bold text-gray-600">EMAIL</p>,
            cell: (info) => <p className="text-sm text-gray-500">{info.getValue()}</p>,
        }),
        columnHelper.accessor('role', {
            header: () => <p className="text-sm font-bold text-gray-600">TIPO</p>,
            cell: (info) => {
                const isSA = info.getValue() === 'super_admin';
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isSA ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                        {isSA ? <FaCrown className="w-3 h-3" /> : <FaShieldAlt className="w-3 h-3" />}
                        {isSA ? 'Super Admin' : 'Admin'}
                    </span>
                );
            },
        }),
        columnHelper.accessor('cargo', {
            header: () => <p className="text-sm font-bold text-gray-600">CARGO</p>,
            cell: (info) => <p className="text-sm text-gray-500">{info.getValue() || 'Administrador'}</p>,
        }),
        columnHelper.accessor('created_at', {
            header: () => <p className="text-sm font-bold text-gray-600">CRIADO EM</p>,
            cell: (info) => <p className="text-sm text-gray-500">{new Date(info.getValue()).toLocaleDateString('pt-PT')}</p>,
        }),
        columnHelper.display({
            id: 'acoes',
            header: () => <p className="text-sm font-bold text-gray-600">AÇÕES</p>,
            cell: ({ row }) => {
                const isCurrentUser = row.original.id === currentUser?.id;
                const isTargetSA = row.original.role === 'super_admin';
                if (!isSuperAdmin || isCurrentUser || isTargetSA) {
                    return <span className="text-xs text-gray-300 italic">{isTargetSA && !isCurrentUser ? 'Protegido' : '—'}</span>;
                }
                return (
                    <button onClick={() => prepareDelete(row.original.id)}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors">
                        <FaUserSlash className="w-3 h-3" /> Suspender
                    </button>
                );
            },
        }),
    ];

    const suspendedColumnHelper = createColumnHelper();
    const suspendedColumns = [
        suspendedColumnHelper.accessor('id', {
            header: () => <p className="text-sm font-bold text-gray-600">ID</p>,
            cell: (info) => <p className="text-xs text-gray-400 font-mono">{info.getValue().substring(0, 8)}…</p>,
        }),
        suspendedColumnHelper.accessor('nome', {
            header: () => <p className="text-sm font-bold text-gray-600">NOME</p>,
            cell: (info) => <p className="text-sm font-medium text-gray-600">{info.getValue()}</p>,
        }),
        suspendedColumnHelper.accessor('email', {
            header: () => <p className="text-sm font-bold text-gray-600">EMAIL</p>,
            cell: (info) => <p className="text-sm text-gray-500">{info.getValue()}</p>,
        }),
        suspendedColumnHelper.accessor('role', {
            header: () => <p className="text-sm font-bold text-gray-600">TIPO</p>,
            cell: (info) => {
                const isSA = info.getValue() === 'super_admin';
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isSA ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                        {isSA ? <FaCrown className="w-3 h-3" /> : <FaShieldAlt className="w-3 h-3" />}
                        {isSA ? 'Super Admin' : 'Admin'}
                    </span>
                );
            },
        }),
        suspendedColumnHelper.accessor('deleted_at', {
            header: () => <p className="text-sm font-bold text-gray-600">SUSPENSO EM</p>,
            cell: (info) => (
                <p className="text-sm text-red-400">
                    {info.getValue() ? new Date(info.getValue()).toLocaleDateString('pt-PT') : '—'}
                </p>
            ),
        }),
        suspendedColumnHelper.display({
            id: 'reativar',
            header: () => <p className="text-sm font-bold text-gray-600">AÇÕES</p>,
            cell: ({ row }) => (
                <button onClick={() => prepareReactivate(row.original.id)}
                    className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded transition-colors">
                    <FaUserCheck className="w-3 h-3" /> Reativar
                </button>
            ),
        }),
    ];

    const activeTable = useReactTable({
        data: admins, columns: activeColumns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
    });

    const suspendedTable = useReactTable({
        data: suspendedAdmins, columns: suspendedColumns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: { globalFilter: globalFilterSuspended },
        onGlobalFilterChange: setGlobalFilterSuspended,
    });

    if (loading && admins.length === 0) {
        return <LoaderContainer><SyncLoader color="#1B254B" size={15} /></LoaderContainer>;
    }

    return (
        <div className="space-y-6">

            {/* Aviso modo leitura */}
            {!isSuperAdmin && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mt-4 sm:mt-10">
                    <FaShieldAlt className="flex-shrink-0" />
                    <p className="text-sm">
                        Está em modo leitura. Apenas o <strong>Super Admin</strong> pode adicionar, suspender ou reativar contas.
                    </p>
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">
                    {success}
                </div>
            )}

            {/* ══ Tabela: Ativos ══ */}
            <Card extra="w-full h-full sm:overflow-auto px-6 pt-4 pb-6 mt-5">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-navy-700">Administradores Ativos</h2>
                        {isSuperAdmin && (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                                <FaCrown className="w-3 h-3" /> Super Admin
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
                        <input type="text" placeholder="Pesquisar..." value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg w-full sm:w-56 text-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-500 text-sm" />
                        {isSuperAdmin && (
                            <button
                                onClick={() => { setError(null); setFormData({ nome: '', email: '', senha: '' }); setShowAddModal(true); }}
                                className="bg-navy-700 text-white px-4 py-2 rounded-lg hover:bg-navy-800 flex items-center justify-center gap-2 transition-colors text-sm whitespace-nowrap">
                                <FaPlus /> Adicionar Admin
                            </button>
                        )}
                    </div>
                </header>
                <div className="overflow-x-auto">
                    <div className="min-w-[640px] sm:min-w-0">
                        <table className="w-full">
                            <thead>
                                {activeTable.getHeaderGroups().map((hg) => (
                                    <tr key={hg.id} className="border-b border-gray-200">
                                        {hg.headers.map((h) => (
                                            <th key={h.id} className="py-3 text-left">{flexRender(h.column.columnDef.header, h.getContext())}</th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {activeTable.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                        ))}
                                    </tr>
                                ))}
                                {activeTable.getRowModel().rows.length === 0 && (
                                    <tr><td colSpan={activeColumns.length} className="text-center py-10 text-gray-400 text-sm">Nenhum administrador encontrado</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>

            {/* ══ Tabela: Suspensos — só super admin ══ */}
            {isSuperAdmin && (
                <Card extra="w-full h-full sm:overflow-auto px-6 pt-4 pb-6">
                    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-navy-700">Administradores Suspensos</h2>
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                                <FaUserSlash className="w-3 h-3" /> {suspendedAdmins.length}
                            </span>
                        </div>
                        <input type="text" placeholder="Pesquisar suspensos..." value={globalFilterSuspended}
                            onChange={(e) => setGlobalFilterSuspended(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg w-full sm:w-56 text-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-500 text-sm" />
                    </header>
                    <div className="overflow-x-auto">
                        <div className="min-w-[560px] sm:min-w-0">
                            <table className="w-full">
                                <thead>
                                    {suspendedTable.getHeaderGroups().map((hg) => (
                                        <tr key={hg.id} className="border-b border-gray-200">
                                            {hg.headers.map((h) => (
                                                <th key={h.id} className="py-3 text-left">{flexRender(h.column.columnDef.header, h.getContext())}</th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {suspendedTable.getRowModel().rows.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-100 hover:bg-red-50/40 transition-colors">
                                            {row.getVisibleCells().map((cell) => (
                                                <td key={cell.id} className="py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                            ))}
                                        </tr>
                                    ))}
                                    {suspendedTable.getRowModel().rows.length === 0 && (
                                        <tr><td colSpan={suspendedColumns.length} className="text-center py-10 text-gray-400 text-sm">Nenhum administrador suspenso</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>
            )}

            {/* ── Modal: Verificar senha ── */}
            {showVerifyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <FaLock className="text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-navy-700">Confirmar Identidade</h3>
                                    <p className="text-xs text-gray-500">Digite a sua senha de Super Admin para continuar</p>
                                </div>
                            </div>
                            <input type="password" value={verifyPassword}
                                onChange={(e) => { setVerifyPassword(e.target.value); setError(null); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleVerifyAndDelete()}
                                className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                                placeholder="A sua senha" autoFocus />
                            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                            <div className="flex flex-col sm:flex-row justify-end gap-2">
                                <button onClick={() => { setShowVerifyModal(false); setAdminToDelete(null); setError(null); setVerifyPassword(''); }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors">Cancelar</button>
                                <button onClick={handleVerifyAndDelete} disabled={isVerifying}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50">
                                    {isVerifying ? <SyncLoader color="#fff" size={8} /> : <><FaLock /> Verificar</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Adicionar Admin ── */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <FaPlus className="text-navy-700" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-navy-700">Adicionar Novo Admin</h3>
                                    <p className="text-xs text-gray-500">O novo admin terá nível <strong>Admin</strong></p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                                    <input type="text" value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 text-sm"
                                        placeholder="Nome completo" autoFocus />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input type="email" value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 text-sm"
                                        placeholder="email@exemplo.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                                    <div className="relative">
                                        <input type={showFormPassword ? 'text' : 'password'} value={formData.senha}
                                            onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                            className="w-full p-3 pr-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 text-sm"
                                            placeholder="Mínimo 6 caracteres" />
                                        <button type="button" onClick={() => setShowFormPassword(!showFormPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showFormPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Mínimo de 6 caracteres</p>
                                </div>
                            </div>
                            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
                            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
                                <button onClick={() => { setShowAddModal(false); setFormData({ nome: '', email: '', senha: '' }); setError(null); }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors">Cancelar</button>
                                <button onClick={handleAddAdmin} disabled={loading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50">
                                    {loading ? <SyncLoader color="#fff" size={8} /> : <><FaPlus /> Criar Admin</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Confirmar Suspensão ── */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <FaUserSlash className="text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-navy-700">Confirmar Suspensão</h3>
                                    <p className="text-xs text-gray-500">Pode ser revertido na tabela de suspensos</p>
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm mb-6">
                                Tem a certeza que deseja <strong>suspender</strong> este administrador? Ele perderá o acesso imediatamente.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-end gap-2">
                                <button onClick={() => { setShowDeleteModal(false); setAdminToDelete(null); }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors">Cancelar</button>
                                <button onClick={handleDeleteAdmin} disabled={loading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50">
                                    {loading ? <SyncLoader color="#fff" size={8} /> : <><FaUserSlash /> Suspender</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Confirmar Reativação ── */}
            {showReactivateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <FaUserCheck className="text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-navy-700">Confirmar Reativação</h3>
                                    <p className="text-xs text-gray-500">O administrador voltará a ter acesso ao painel</p>
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm mb-6">
                                Tem a certeza que deseja <strong>reativar</strong> este administrador?
                            </p>
                            <div className="flex flex-col sm:flex-row justify-end gap-2">
                                <button onClick={() => { setShowReactivateModal(false); setAdminToReactivate(null); }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors">Cancelar</button>
                                <button onClick={handleReactivateAdmin} disabled={loading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50">
                                    {loading ? <SyncLoader color="#fff" size={8} /> : <><FaUserCheck /> Reativar</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GerenciamentoAdmins;