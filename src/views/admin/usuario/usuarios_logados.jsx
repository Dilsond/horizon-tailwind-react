import React, { useEffect, useState } from 'react';
import {
    FaArrowLeft,
    FaArrowRight,
    FaSearch,
    FaFilter,
    FaUser,
    FaUserShield,
    FaUserTie,
    FaBuilding,
    FaGasPump,
    FaSignInAlt,
    FaSignOutAlt,
    FaInfoCircle,
    FaPowerOff
} from "react-icons/fa";
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import Card from "components/card";
import { createColumnHelper } from "@tanstack/react-table";
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

const columnHelper = createColumnHelper();
const API_BASE_URL = Config.getApiUrl();

const UsuariosLogados = () => {
    const [users, setUsers] = useState([]);
    const [usersLogados, setLogados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 4,
        totalPages: 1,
    });
    const [filters, setFilters] = useState({
        search: '',
        userType: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState({ type: '', text: '' });
    const [selectedUser, setSelectedUser] = useState(null);


    useEffect(() => {
        fetchLoggedInUsers();
    }, [pagination.pageIndex, filters]);

    const fetchLoggedInUsers = async () => {
        try {
            let url = `api/logged-in-users/?page=${pagination.pageIndex + 1}`;
            const params = new URLSearchParams();

            if (filters.search) params.append('search', filters.search);
            if (filters.userType) params.append('user_type', filters.userType);

            if (params.toString()) {
                url += `&${params.toString()}`;
            }

            const response = await fetchWithToken(url, {
                method: 'GET',
                headers: {
                    "ngrok-skip-browser-warning": "true",
                },
            });

            const data = await response.json();
            console.log(data);
            setUsers(data.results || []);
            setLogados(data);
            console.log(data);
            setPagination((prev) => ({
                ...prev,
                totalPages: Math.ceil(data.count / prev.pageSize),
            }));
        } catch (error) {
            console.error("Erro ao buscar usuários logados", error);
        } finally {
            setLoading(false);
        }
    };
    const handleLogoutAllSessions = async () => {
        setActionLoading(true);
        try {
            const response = await fetchWithToken(`api/logout-all/`, {
                method: 'POST',
                headers: {
                    "ngrok-skip-browser-warning": "true",
                },
            });

            if (!response.ok) {
                throw new Error('Falha ao desconectar todas as sessões');
            }

            setActionMessage({ type: 'success', text: 'Todas as sessões foram desconectadas com sucesso' });
            fetchLoggedInUsers();
        } catch (error) {
            console.error("Erro ao desconectar sessões", error);
            setActionMessage({ type: 'error', text: error.message });
        } finally {
            setActionLoading(false);
            setShowLogoutModal(false);
            setSelectedUser(null);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            userType: ''
        });
    };

    const getUserTypeIcon = (user) => {
        if (user.is_admin) {
            return { icon: <FaUserShield className="text-purple-500" />, type: 'Administrador' };
        }
        // if (user.is_empresa) {
        //     return { icon: <FaBuilding className="text-blue-500" />, type: 'Empresa' };
        // }
        if (user.is_funcionario_posto) {
            return { icon: <FaBuilding className="text-green-500" />, type: 'Funcionário Posto' };
        }
        if (user.is_funcionario_emppresa) {
            return { icon: <FaUserTie className="text-yellow-500" />, type: 'Funcionário Empresa' };
        }
        if (user.is_usuario) {
            return { icon: <FaUser className="text-teal-500" />, type: 'Usuário' };
        }
        return { icon: <FaUser className="text-gray-500" />, type: 'Desconhecido' };
    };

    const userColumns = [
        {
            accessorKey: "username",
            header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">USUÁRIO</p>,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {getUserTypeIcon(row.original).icon}
                    <p className="text-sm font-medium text-navy-700 dark:text-white">
                        {row.getValue("username")}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "email",
            header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">EMAIL</p>,
            cell: ({ row }) => (
                <p className="text-sm text-gray-500">
                    {row.getValue("email")}
                </p>
            ),
        },
        {
            accessorKey: "userType",
            header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">TIPO</p>,
            cell: ({ row }) => (
                <p className="text-sm text-gray-500">
                    {getUserTypeIcon(row.original).type}
                </p>
            ),
        },
        // {
        //     accessorKey: "last_login",
        //     header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">ÚLTIMO LOGIN</p>,
        //     cell: ({ row }) => (
        //         <p className="text-sm text-gray-500">
        //             {row.original.last_login ? 
        //                 new Date(row.original.last_login).toLocaleString() : 
        //                 'Nunca logou'}
        //         </p>
        //     ),
        // },
        {
            accessorKey: "actions",
            header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">AÇÕES</p>,
            cell: ({ row }) => (
                <div className="flex gap-2">

                    <button
                        onClick={() => console.log('Detalhes:', row.original)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Ver detalhes"
                    >
                        <FaInfoCircle />
                    </button>
                </div>
            ),
        },
    ];

    const table = useReactTable({
        data: users,
        columns: userColumns,
        getCoreRowModel: getCoreRowModel(),
    });

    if (loading) {
        return (
            <LoaderContainer>
                <SyncLoader color="#3B82F6" size={15} />
            </LoaderContainer>
        );
    }

    return (
        <div>
            {actionMessage.text && (
                <div className={`mb-4 p-4 rounded-lg ${actionMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {actionMessage.text}
                </div>
            )}

            <Card extra={"w-full h-full sm:overflow-auto px-6 mt-6 mb-6"}>
                <header className="relative flex flex-col md:flex-row items-center justify-between pt-4 gap-4">
                    <div className="text-xl md:text-xl font-bold text-navy-700 dark:text-white text-center md:text-left">
                        Usuários Ativos no Sistema
                    </div>
                    <div className="text-xl md:text-xl font-bold text-navy-700 dark:text-white text-center md:text-left">
                        Total - {usersLogados?.logados_total}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto space-y-3 sm:space-y-0 sm:space-x-4">
                        <div className="relative w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Pesquisar..."
                                className="w-full pl-10 pr-4 py-2 border text-navy-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="w-full sm:w-auto px-4 py-2 bg-gray-400 hover:bg-gray-500 rounded-lg flex items-center justify-center space-x-2 text-white"
                        >
                            <FaFilter />
                            <span>Filtros</span>
                        </button>

                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className="w-full sm:w-auto px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center space-x-2 text-white"
                            title="Desconectar todas as sessões"
                        >
                            <FaPowerOff />
                        </button>
                    </div>
                </header>

                {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuário</label>
                                <select
                                    name="userType"
                                    value={filters.userType}
                                    onChange={handleFilterChange}
                                    className="w-full p-2 border text-navy-700  rounded"
                                >
                                    <option value="" className='text-navy-700'>Todos</option>
                                    <option value="admin" className='text-navy-700'>Administrador</option>
                                    <option value="empresa" className='text-navy-700'>Empresa</option>
                                    <option value="funcionario_posto" className='text-navy-700'>Funcionário Posto</option>
                                    <option value="funcionario_empresa" className='text-navy-700'>Funcionário Empresa</option>
                                    <option value="usuario" className='text-navy-700'>Usuário</option>
                                </select>
                            </div>

                            <div className="flex items-end space-x-2">
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 bg-gray-400 hover:bg-gray-500 rounded"
                                >
                                    Limpar Filtros
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-5 overflow-x-scroll xl:overflow-x-hidden">
                    <table className="w-full">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="!border-px !border-gray-400">
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start"
                                        >
                                            <div className="items-center justify-between text-xs text-gray-200">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50">
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="min-w-[150px] border-white/0 py-3 pr-4">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={userColumns.length} className="text-center py-4 text-gray-500">
                                        Nenhum usuário logado encontrado
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Paginação */}
            <div className="flex items-center justify-between mt-4 mb-4">
                <div className="flex items-center space-x-2">
                    <button
                        className="px-4 py-2 text-sm font-medium text-white bg-brand-900 rounded-[20px] hover:bg-brand-800 flex items-center justify-center"
                        onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))}
                        disabled={pagination.pageIndex === 0}
                    >
                        <FaArrowLeft className="mr-2" /> Anterior
                    </button>
                    <button
                        className="px-4 py-2 text-sm font-medium text-white bg-brand-900 rounded-[20px] hover:bg-brand-800 flex items-center justify-center"
                        onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}
                        disabled={pagination.pageIndex + 1 >= pagination.totalPages}
                    >
                        Próxima <FaArrowRight className="ml-2" />
                    </button>
                </div>
                <span className="text-sm text-gray-600 dark:text-white">
                    Página {pagination.pageIndex + 1} de {pagination.totalPages}
                </span>
            </div>

            {/* Modal de Confirmação de Logout */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Confirmar Logout em Todas as Sessões</h3>
                        <p className="mb-4">
                            Deseja realmente desconectar todas as sessões dos usuários
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowLogoutModal(false);

                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                                disabled={actionLoading}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleLogoutAllSessions()}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
                            >
                                {actionLoading ? (
                                    <SyncLoader color="#ffffff" size={8} />
                                ) : (
                                    <>
                                        <FaPowerOff className="mr-2" />
                                        Desconectar
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

export default UsuariosLogados;