import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaTrash, FaPlus, FaLock } from 'react-icons/fa';
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
  background-color: rgba(255, 255, 255, 0.0);
`;

const GerenciamentoAdmins = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [adminToDelete, setAdminToDelete] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({ nome: '', email: '', senha: '' });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyPassword, setVerifyPassword] = useState('');

    // Buscar usuário atual
    useEffect(() => {
        const getUser = async () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    setCurrentUser(user);
                } catch (err) {
                    console.error('Erro ao parsear usuário:', err);
                }
            }
        };
        getUser();
    }, []);

    // Buscar administradores
    const fetchAdmins = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('administradores')
                .select('*')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setAdmins(data || []);
        } catch (error) {
            console.error('Error fetching admins:', error);
            setError('Erro ao carregar administradores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    // Verificar senha do admin atual — compara diretamente com o valor armazenado no banco
    const handleVerifyAdmin = async () => {
        if (!verifyPassword) {
            setError('Por favor, digite sua senha');
            return;
        }

        setIsVerifying(true);
        setError(null);

        try {
            // Buscar admin atual no banco
            const { data: admin, error: fetchError } = await supabase
                .from('administradores')
                .select('id, senha')
                .eq('id', currentUser?.id)
                .single();

            if (fetchError) throw fetchError;
            if (!admin) {
                setError('Administrador não encontrado');
                setIsVerifying(false);
                return;
            }

            // Verificar senha — tenta bcrypt via supabase rpc se disponível,
            // caso contrário faz comparação directa (útil quando a senha foi
            // armazenada em texto simples ou com hash próprio do projecto)
            let passwordMatch = false;

            // Tentativa 1: RPC verify_admin_password (bcrypt no servidor)
            const { data: rpcResult, error: rpcError } = await supabase
                .rpc('verify_admin_password', {
                    admin_id: currentUser?.id,
                    input_password: verifyPassword,
                });

            if (!rpcError && rpcResult !== null) {
                passwordMatch = rpcResult === true;
            } else {
                // Tentativa 2: comparação directa (senha em texto simples ou hash próprio)
                passwordMatch = admin.senha === verifyPassword;
            }

            if (!passwordMatch) {
                setError('Senha incorreta');
                setIsVerifying(false);
                return;
            }

            setSuccess('Identidade verificada com sucesso!');
            setShowVerifyModal(false);
            setVerifyPassword('');
            setTimeout(() => setSuccess(null), 3000);

            if (pendingAction === 'add') {
                setShowAddModal(true);
            } else if (pendingAction === 'delete') {
                setShowDeleteModal(true);
            }

        } catch (error) {
            console.error('Verification error:', error);
            setError('Erro ao verificar senha');
        } finally {
            setIsVerifying(false);
        }
    };

    // Adicionar novo administrador
    const handleAddAdmin = async () => {
        if (!formData.nome || !formData.email) {
            setError('Preencha todos os campos');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Verificar se email já existe
            const { data: existing, error: checkError } = await supabase
                .from('administradores')
                .select('email')
                .eq('email', formData.email)
                .maybeSingle();

            if (checkError) throw checkError;

            if (existing) {
                setError('Email já registado');
                setLoading(false);
                return;
            }

            // Gerar senha temporária aleatória
            const tempPassword = Math.random().toString(36).slice(-8) +
                Math.random().toString(36).slice(-4).toUpperCase();

            // Inserir novo administrador com senha em texto simples
            // (a hash será aplicada pelo trigger do banco, se existir)
            const { data: newAdmin, error: insertError } = await supabase
                .from('administradores')
                .insert([
                    {
                        nome: formData.nome,
                        email: formData.email,
                        senha: tempPassword,
                        cargo: 'Administrador',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    }
                ])
                .select()
                .single();

            if (insertError) throw insertError;

            setSuccess(`Admin adicionado! Senha temporária: ${tempPassword}`);
            setShowAddModal(false);
            setFormData({ nome: '', email: '', senha: '' });
            await fetchAdmins();
            setTimeout(() => setSuccess(null), 8000);

        } catch (error) {
            console.error('Add admin error:', error);
            setError('Erro ao adicionar administrador: ' + (error.message || ''));
        } finally {
            setLoading(false);
        }
    };

    // Remover administrador (soft delete)
    const handleDeleteAdmin = async () => {
        setLoading(true);
        setError(null);

        try {
            if (adminToDelete === currentUser?.id) {
                setError('Você não pode remover sua própria conta');
                setLoading(false);
                return;
            }

            const { error: deleteError } = await supabase
                .from('administradores')
                .update({
                    deleted_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', adminToDelete);

            if (deleteError) throw deleteError;

            setSuccess('Admin removido com sucesso!');
            setShowDeleteModal(false);
            setAdminToDelete(null);
            await fetchAdmins();
            setTimeout(() => setSuccess(null), 3000);

        } catch (error) {
            console.error('Delete admin error:', error);
            setError('Erro ao remover administrador');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const prepareAddAdmin = () => {
        setError(null);
        setVerifyPassword('');
        setPendingAction('add');
        setShowVerifyModal(true);
    };

    const prepareDelete = (adminId) => {
        setAdminToDelete(adminId);
        setError(null);
        setVerifyPassword('');
        setPendingAction('delete');
        setShowVerifyModal(true);
    };

    const columnHelper = createColumnHelper();
    const columns = [
        columnHelper.accessor('id', {
            header: () => <p className="text-sm font-bold text-gray-600">ID</p>,
            cell: (info) => (
                <p className="text-sm text-gray-500 font-mono">
                    {info.getValue().substring(0, 8)}...
                </p>
            ),
        }),
        columnHelper.accessor('nome', {
            header: () => <p className="text-sm font-bold text-gray-600">NOME</p>,
            cell: (info) => (
                <p className="text-sm font-medium text-navy-700">{info.getValue()}</p>
            ),
        }),
        columnHelper.accessor('email', {
            header: () => <p className="text-sm font-bold text-gray-600">EMAIL</p>,
            cell: (info) => (
                <p className="text-sm text-gray-500">{info.getValue()}</p>
            ),
        }),
        columnHelper.accessor('cargo', {
            header: () => <p className="text-sm font-bold text-gray-600">CARGO</p>,
            cell: (info) => (
                <p className="text-sm text-gray-500">{info.getValue() || 'Administrador'}</p>
            ),
        }),
        columnHelper.accessor('created_at', {
            header: () => <p className="text-sm font-bold text-gray-600">CRIADO EM</p>,
            cell: (info) => {
                const date = new Date(info.getValue());
                return (
                    <p className="text-sm text-gray-500">
                        {date.toLocaleDateString('pt-PT')}
                    </p>
                );
            },
        }),
        columnHelper.display({
            id: 'acoes',
            header: () => <p className="text-sm font-bold text-gray-600">AÇÕES</p>,
            cell: ({ row }) => {
                const isCurrentUser = row.original.id === currentUser?.id;
                return (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => prepareDelete(row.original.id)}
                            disabled={isCurrentUser}
                            className={`text-red-500 hover:text-red-700 transition-colors ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={isCurrentUser ? 'Não pode remover a própria conta' : 'Remover admin'}
                        >
                            <FaTrash />
                        </button>
                    </div>
                );
            },
        }),
    ];

    const table = useReactTable({
        data: admins,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
    });

    if (loading && admins.length === 0) {
        return (
            <LoaderContainer>
                <SyncLoader color="#1B254B" size={15} />
            </LoaderContainer>
        );
    }

    return (
        <div>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 sm:mt-10 mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4 sm:mt-10 mb-4" role="alert">
                    <span className="block sm:inline">{success}</span>
                </div>
            )}

            <Card extra="w-full h-full sm:overflow-auto px-6 mt-6 mb-6">
                <header className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 sm:pt-4 gap-2 sm:gap-0">
                    <div className="text-lg sm:text-xl font-bold text-navy-700 mt-3">
                        Lista de Administradores
                    </div>
                    <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-2">
                        <input
                            type="text"
                            placeholder="Pesquise aqui..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg w-full text-navy-700 sm:w-64 focus:outline-none focus:ring-2 focus:ring-navy-500"
                        />
                        <button
                            onClick={prepareAddAdmin}
                            className="bg-navy-700 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-navy-800 flex items-center justify-center transition-colors"
                        >
                            <FaPlus className="mr-2" />
                            <span className="text-sm sm:text-base">Adicionar</span>
                        </button>
                    </div>
                </header>

                <div className="mt-3 sm:mt-5 overflow-x-auto">
                    <div className="min-w-[600px] sm:min-w-0">
                        <table className="w-full">
                            <thead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id} className="border-b border-gray-200">
                                        {headerGroup.headers.map((header) => (
                                            <th key={header.id} className="py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="py-3 text-sm">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {table.getRowModel().rows.length === 0 && (
                                    <tr>
                                        <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                                            Nenhum administrador encontrado
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>

            {/* Modal de Verificação de Senha */}
            {showVerifyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4 text-navy-700">
                                Verificar Identidade
                            </h3>
                            <p className="mb-4 text-gray-600">
                                Digite sua senha para confirmar esta ação:
                            </p>
                            <input
                                type="password"
                                value={verifyPassword}
                                onChange={(e) => {
                                    setVerifyPassword(e.target.value);
                                    setError(null);
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleVerifyAdmin()}
                                className="w-full p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-navy-500"
                                placeholder="Sua senha"
                                autoFocus
                            />
                            {error && (
                                <p className="text-red-500 text-sm mb-4">{error}</p>
                            )}
                            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                                <button
                                    onClick={() => {
                                        setShowVerifyModal(false);
                                        setPendingAction(null);
                                        setError(null);
                                        setVerifyPassword('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleVerifyAdmin}
                                    disabled={isVerifying}
                                    className="px-4 py-2 bg-navy-700 text-white rounded-md hover:bg-navy-800 flex items-center justify-center transition-colors disabled:opacity-50"
                                >
                                    {isVerifying ? (
                                        <SyncLoader color="#ffffff" size={8} />
                                    ) : (
                                        <>
                                            <FaLock className="mr-2" />
                                            Verificar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Adicionar Admin */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4 text-navy-700">
                                Adicionar Novo Admin
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nome
                                    </label>
                                    <input
                                        type="text"
                                        name="nome"
                                        value={formData.nome}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                                        placeholder="Nome do admin"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                                        placeholder="Email do admin"
                                    />
                                </div>
                            </div>
                            {error && (
                                <p className="text-red-500 text-sm mt-3">{error}</p>
                            )}
                            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setFormData({ nome: '', email: '', senha: '' });
                                        setError(null);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddAdmin}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center justify-center transition-colors disabled:opacity-50"
                                >
                                    {loading ? (
                                        <SyncLoader color="#ffffff" size={8} />
                                    ) : (
                                        <>
                                            <FaPlus className="mr-2" />
                                            Adicionar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmar Exclusão */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4 text-navy-700">
                                Confirmar Exclusão
                            </h3>
                            <p className="mb-6 text-gray-600">
                                Tem certeza que deseja remover este administrador?
                            </p>
                            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setAdminToDelete(null);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteAdmin}
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center transition-colors disabled:opacity-50"
                                >
                                    {loading ? (
                                        <SyncLoader color="#ffffff" size={8} />
                                    ) : (
                                        <>
                                            <FaTrash className="mr-2" />
                                            Remover
                                        </>
                                    )}
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