import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEdit, FaTrash, FaPlus, FaLock } from 'react-icons/fa';
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
import Config from "../../../Config";
import { fetchWithToken } from '../../../authService';

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
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: ''
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);

    useEffect(() => {
        const fetchAdmins = async () => {
            try {
                const response = await fetchWithToken('api/admins/', {
                    method: 'GET',
                    headers: {
                        "ngrok-skip-browser-warning": "true",
                    },
                });
                const data = await response.json();
                setAdmins(data.admins || []);
            } catch (error) {
                console.error('Error fetching admins:', error);
                setError('Erro ao carregar administradores');
            } finally {
                setLoading(false);
            }
        };

        fetchAdmins();
    }, []);

    const handleVerifyAdmin = async () => {
        setLoading(true);
        try {
            const response = await fetchWithToken('api/admins/verificar/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "ngrok-skip-browser-warning": "true",
                },
                body: JSON.stringify({ senha: formData.senha })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Erro na verificação');
            }

            setSuccess('Identidade verificada com sucesso!');
            setShowVerifyModal(false);
            setFormData({ ...formData, senha: '' });

            if (pendingAction === 'add') {
                setShowAddModal(true);
            } else if (pendingAction === 'delete') {
                setShowDeleteModal(true);
            }

        } catch (error) {
            console.error('Verification error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
            setPendingAction(null);
        }
    };

    const handleAddAdmin = async () => {
        setLoading(true);
        try {
            const response = await fetchWithToken('api/admins/adicionar/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "ngrok-skip-browser-warning": "true",
                },
                body: JSON.stringify({
                    nome: formData.nome,
                    email: formData.email
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Erro ao adicionar admin');
            }

            setSuccess('Admin adicionado com sucesso!');
            setShowAddModal(false);
            setFormData({ nome: '', email: '', senha: '' });
            window.location.reload();

            // Refresh admin list
            const refreshResponse = await fetchWithToken('api/list-admins/');
            const refreshData = await refreshResponse.json();
            setAdmins(refreshData.admins || []);
            
        } catch (error) {
            console.error('Add admin error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAdmin = async () => {
        setLoading(true);
        try {
            const response = await fetchWithToken(`api/admins/remover/${adminToDelete}/`, {
                method: 'DELETE',
                headers: {
                    "ngrok-skip-browser-warning": "true",
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Erro ao remover admin');
            }

            setSuccess('Admin removido com sucesso!');
            setShowDeleteModal(false);
            setAdminToDelete(null);

            // Refresh admin list
            const refreshResponse = await fetchWithToken('api/list-admins/');
            const refreshData = await refreshResponse.json();
            setAdmins(refreshData.admins || []);
        } catch (error) {
            console.error('Delete admin error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const prepareAddAdmin = () => {
        setPendingAction('add');
        setShowVerifyModal(true);
    };

    const prepareDelete = (adminId) => {
        setAdminToDelete(adminId);
        setPendingAction('delete');
        setShowVerifyModal(true);
    };

    const columnHelper = createColumnHelper();
    const columns = [
        columnHelper.accessor('id', {
            header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">ID</p>,
            cell: (info) => <p className="text-sm text-navy-700 dark:text-white">{info.getValue()}</p>,
        }),
        columnHelper.accessor('username', {
            header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">NOME</p>,
            cell: (info) => <p className="text-sm text-navy-700 dark:text-white">{info.getValue()}</p>,
        }),
        columnHelper.accessor('email', {
            header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">EMAIL</p>,
            cell: (info) => <p className="text-sm text-navy-700 dark:text-white">{info.getValue()}</p>,
        }),
        columnHelper.accessor('is_admin', {
            header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">STATUS</p>,
            cell: (info) => (
                <div className="flex items-center">
                    {info.getValue() ? (
                        <FaCheck className="text-green-500" />
                    ) : (
                        <FaTimes className="text-red-500" />
                    )}
                </div>
            ),
        }),
        // columnHelper.accessor('id', {
        //     header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">AÇÕES</p>,
        //     cell: (info) => (
        //         <div className="flex space-x-2">
        //             <button
        //                 onClick={() => prepareDelete(info.getValue())}
        //                 className="text-red-500 hover:text-red-700"
        //             >
        //                 <FaTrash />
        //             </button>
        //         </div>
        //     ),
        // }),
    ];

    const table = useReactTable({
        data: admins,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
    });

    if (loading && admins.length === 0) {
        return (
            <LoaderContainer>
                <SyncLoader color="#3B82F6" size={15} />
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
                    <div className="text-lg sm:text-xl font-bold text-navy-700 mt-3 dark:text-white">Lista de Administradores</div>
                    <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-2">
                        <input
                            type="text"
                            placeholder="Pesquise aqui..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="p-2 border rounded-lg w-full text-navy-700 sm:w-auto"
                        />
                        <button
                            onClick={prepareAddAdmin}
                            className="bg-green-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center"
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
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <th key={header.id} className="border-b py-2 text-start text-sm sm:text-base">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {table.getRowModel().rows.map((row) => (
                                    <tr key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="py-2 text-sm sm:text-base">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>

            {showVerifyModal && (
                <div className="fixed inset-0 bg-black bg-[#0B0B0B] bg-opacity-70 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-navy-800 p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-3 sm:mb-4 dark:text-white">Verificar Identidade</h3>
                        <p className="mb-3 sm:mb-4 dark:text-gray-300">Digite sua senha para confirmar esta ação:</p>
                        <input
                            type="password"
                            name="senha"
                            value={formData.senha}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-lg mb-3 sm:mb-4 dark:bg-navy-700 dark:border-gray-600 dark:text-white"
                            placeholder="Sua senha"
                        />
                        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                            <button
                                onClick={() => {
                                    setShowVerifyModal(false);
                                    setPendingAction(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-navy-700 dark:text-white"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleVerifyAdmin}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center dark:bg-blue-600 dark:hover:bg-blue-700"
                            >
                                {loading ? (
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
            )}

            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-[#0B0B0B] bg-opacity-70 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-navy-800 p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-3 sm:mb-4 dark:text-white">Adicionar Novo Admin</h3>
                        <div className="space-y-3 sm:space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Nome</label>
                                <input
                                    type="text"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-lg dark:bg-navy-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Nome do admin"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-lg dark:bg-navy-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Email do admin"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-navy-700 dark:text-white"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddAdmin}
                                disabled={loading}
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center justify-center dark:bg-green-600 dark:hover:bg-green-700"
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
            )}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-[#0B0B0B] bg-opacity-70 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-navy-800 p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-3 sm:mb-4 dark:text-white">Confirmar Exclusão</h3>
                        <p className="mb-3 sm:mb-4 dark:text-gray-300">Tem certeza que deseja remover este administrador?</p>
                        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-navy-700 dark:text-white"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteAdmin}
                                disabled={loading}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center dark:bg-red-600 dark:hover:bg-red-700"
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
            )}
        </div>
    );
};

export default GerenciamentoAdmins;