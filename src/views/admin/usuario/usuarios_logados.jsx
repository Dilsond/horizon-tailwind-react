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
    FaInfoCircle,
    FaPowerOff,
    FaSync
} from "react-icons/fa";
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import Card from "components/card";
import { createColumnHelper } from "@tanstack/react-table";
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

const columnHelper = createColumnHelper();

const UsuariosLogados = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState({ type: '', text: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        userType: ''
    });
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
        totalPages: 1,
        totalCount: 0
    });

    // Buscar usuários ativos (não deletados)
    const fetchActiveUsers = async () => {
        try {
            setLoading(true);
            setActionMessage({ type: '', text: '' });

            // Buscar usuários normais
            let query = supabase
                .from('usuarios_normais')
                .select('*', { count: 'exact' })
                .is('deleted_at', null);

            // Aplicar filtros
            if (filters.search) {
                query = query.or(`nome_completo.ilike.%${filters.search}%,nome_utilizador.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
            }

            // Paginação
            const from = pagination.pageIndex * pagination.pageSize;
            const to = from + pagination.pageSize - 1;
            query = query.range(from, to).order('created_at', { ascending: false });

            const { data: usuariosNormais, error: errorNormais, count: countNormais } = await query;

            if (errorNormais) {
                console.error('Erro ao buscar usuários normais:', errorNormais);
            }

            // Buscar organizadores (apenas aprovados)
            let orgQuery = supabase
                .from('organizadores')
                .select('*', { count: 'exact' })
                .eq('status', 'aprovado')
                .is('deleted_at', null);

            if (filters.search) {
                orgQuery = orgQuery.or(`nome_empresa.ilike.%${filters.search}%,email_empresa.ilike.%${filters.search}%`);
            }

            const { data: organizadores, error: errorOrg, count: countOrg } = await orgQuery;

            if (errorOrg) {
                console.error('Erro ao buscar organizadores:', errorOrg);
            }

            // Buscar administradores
            const { data: administradores, error: errorAdmin } = await supabase
                .from('administradores')
                .select('*')
                .is('deleted_at', null);

            if (errorAdmin) {
                console.error('Erro ao buscar administradores:', errorAdmin);
            }

            // Combinar e formatar usuários
            const formattedUsers = [];

            // Adicionar usuários normais
            (usuariosNormais || []).forEach(user => {
                formattedUsers.push({
                    id: user.id,
                    nome_completo: user.nome_completo,
                    nome_utilizador: user.nome_utilizador,
                    email: user.email,
                    type: 'user',
                    created_at: user.created_at
                });
            });

            // Adicionar organizadores
            (organizadores || []).forEach(org => {
                formattedUsers.push({
                    id: org.id,
                    nome_completo: org.nome_empresa,
                    nome_utilizador: org.nome_empresa.toLowerCase().replace(/\s/g, ''),
                    email: org.email_empresa,
                    type: 'organizer',
                    created_at: org.created_at
                });
            });

            // Adicionar administradores
            (administradores || []).forEach(admin => {
                formattedUsers.push({
                    id: admin.id,
                    nome_completo: admin.nome,
                    nome_utilizador: admin.email.split('@')[0],
                    email: admin.email,
                    type: 'admin',
                    created_at: admin.created_at
                });
            });

            // Aplicar filtro por tipo de usuário
            let filteredUsers = formattedUsers;
            if (filters.userType && filters.userType !== 'all') {
                filteredUsers = formattedUsers.filter(user => user.type === filters.userType);
            }

            // Ordenar por data de criação (mais recentes primeiro)
            filteredUsers.sort((a, b) => {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            // Atualizar paginação
            setPagination(prev => ({
                ...prev,
                totalCount: filteredUsers.length,
                totalPages: Math.ceil(filteredUsers.length / prev.pageSize)
            }));

            // Paginar
            const start = pagination.pageIndex * pagination.pageSize;
            const end = start + pagination.pageSize;
            setUsers(filteredUsers.slice(start, end));

        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            setActionMessage({ type: 'error', text: 'Erro ao carregar usuários' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveUsers();
    }, [pagination.pageIndex, filters.search, filters.userType]);

    const resetFilters = () => {
        setFilters({
            search: '',
            userType: ''
        });
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    };

    const handleRefresh = () => {
        fetchActiveUsers();
    };

    const getUserTypeIcon = (type) => {
        switch (type) {
            case 'admin':
                return { icon: <FaUserShield className="text-purple-500" />, label: 'Administrador' };
            case 'organizer':
                return { icon: <FaBuilding className="text-blue-500" />, label: 'Organizador' };
            case 'user':
                return { icon: <FaUser className="text-green-500" />, label: 'Usuário' };
            default:
                return { icon: <FaUser className="text-gray-500" />, label: 'Desconhecido' };
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const userColumns = [
        {
            accessorKey: "nome_utilizador",
            header: () => <p className="text-sm font-bold text-gray-600">USUÁRIO</p>,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {getUserTypeIcon(row.original.type).icon}
                    <div>
                        <p className="text-sm font-medium text-navy-700">
                            {row.original.nome_utilizador}
                        </p>
                        <p className="text-xs text-gray-500">
                            {row.original.nome_completo}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "email",
            header: () => <p className="text-sm font-bold text-gray-600">EMAIL</p>,
            cell: ({ row }) => (
                <p className="text-sm text-gray-500">
                    {row.original.email}
                </p>
            ),
        },
        {
            accessorKey: "type",
            header: () => <p className="text-sm font-bold text-gray-600">TIPO</p>,
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    row.original.type === 'admin' ? 'bg-purple-100 text-purple-700' :
                    row.original.type === 'organizer' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                }`}>
                    {getUserTypeIcon(row.original.type).label}
                </span>
            ),
        },
        {
            accessorKey: "created_at",
            header: () => <p className="text-sm font-bold text-gray-600">DATA DE REGISTO</p>,
            cell: ({ row }) => (
                <p className="text-sm text-gray-500">
                    {formatDate(row.original.created_at)}
                </p>
            ),
        },
        {
            accessorKey: "actions",
            header: () => <p className="text-sm font-bold text-gray-600">ID</p>,
            cell: ({ row }) => (
                <p className="text-xs text-gray-400 font-mono">
                    {row.original.id.substring(0, 8)}...
                </p>
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
                <SyncLoader color="#F97316" size={15} />
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
                    <div className="text-xl md:text-xl font-bold text-navy-700 text-center md:text-left">
                        Usuários do Sistema
                    </div>
                    <div className="text-xl md:text-xl font-bold text-navy-700 text-center md:text-left">
                        Total - {pagination.totalCount}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto space-y-3 sm:space-y-0 sm:space-x-4">
                        <div className="relative w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Pesquisar..."
                                className="w-full pl-10 pr-4 py-2 border text-navy-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
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
                            onClick={handleRefresh}
                            className="w-full sm:w-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg flex items-center justify-center space-x-2 text-white"
                            title="Atualizar lista"
                        >
                            <FaSync />
                            <span>Atualizar</span>
                        </button>
                    </div>
                </header>

                {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuário</label>
                                <select
                                    name="userType"
                                    value={filters.userType}
                                    onChange={handleFilterChange}
                                    className="w-full p-2 border text-navy-700 rounded"
                                >
                                    <option value="">Todos</option>
                                    <option value="user">Usuário Normal</option>
                                    <option value="organizer">Organizador</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>

                            <div className="flex items-end space-x-2">
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded"
                                >
                                    Limpar Filtros
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-5 overflow-x-scroll xl:overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <table key={headerGroup.id} className="!border-px !border-gray-400">
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start"
                                        >
                                            <div className="items-center justify-between text-xs text-gray-600">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </div>
                                        </th>
                                    ))}
                                </table>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="border-white/0 py-3 pr-4">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {table.getRowModel().rows.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            Nenhum usuário encontrado
                        </div>
                    )}
                </div>
            </Card>

            {/* Paginação */}
            {pagination.totalCount > 0 && (
                <div className="flex items-center justify-between mt-4 mb-4">
                    <div className="flex items-center space-x-2">
                        <button
                            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-[20px] hover:bg-orange-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
                            disabled={pagination.pageIndex === 0}
                        >
                            <FaArrowLeft className="mr-2" /> Anterior
                        </button>
                        <button
                            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-[20px] hover:bg-orange-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.min(p.totalPages - 1, p.pageIndex + 1) }))}
                            disabled={pagination.pageIndex + 1 >= pagination.totalPages}
                        >
                            Próxima <FaArrowRight className="ml-2" />
                        </button>
                    </div>
                    <span className="text-sm text-gray-600">
                        Página {pagination.pageIndex + 1} de {pagination.totalPages}
                    </span>
                </div>
            )}
        </div>
    );
};

export default UsuariosLogados;