import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEye, FaEdit, FaBuilding } from 'react-icons/fa';
import Card from 'components/card';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { supabase } from '../../../lib/supabase.ts';
import { useNavigate } from 'react-router-dom';

const GerenciamentoEmpresas = () => {
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingStatus, setEditingStatus] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchEmpresas();
    }, []);

    const fetchEmpresas = async () => {
        try {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('organizadores')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setEmpresas(data || []);
        } catch (err) {
            console.error('Erro ao buscar empresas:', err);
        } finally {
            setLoading(false);
        }
    };

    const atualizarStatus = async (id, novoStatus) => {
        try {
            const updateData = {};

            if (novoStatus === 'ativo') {
                updateData.deleted_at = null;
            } else {
                updateData.deleted_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from('organizadores')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            // Atualizar estado local
            setEmpresas(empresas.map(emp =>
                emp.id === id
                    ? { ...emp, ...updateData }
                    : emp
            ));

            setEditingStatus(null);
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
        }
    };

    const iniciarEdicaoStatus = (empresa) => {
        setEditingStatus(empresa.id);
        setNewStatus(empresa.deleted_at ? 'suspenso' : 'ativo');
    };

    const cancelarEdicao = () => {
        setEditingStatus(null);
        setNewStatus('');
    };

    const salvarStatus = (id) => {
        atualizarStatus(id, newStatus);
    };

    const handleVisualizar = (id) => {
        navigate(`/admin/perfilempresa/${id}`);
    };

    const getStatusInfo = (empresa) => {
        const isActive = !empresa.deleted_at;
        return {
            status: isActive ? 'ativo' : 'suspenso',
            label: isActive ? 'Ativa' : 'Suspensa',
            color: isActive
                ? 'bg-green-100 text-green-800 border-green-200'
                : 'bg-red-100 text-red-800 border-red-200',
            badgeColor: isActive ? 'bg-green-500' : 'bg-red-500'
        };
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-PT');
    };

    // Configuração da tabela
    const columnHelper = createColumnHelper();
    const columns = [
        columnHelper.accessor('nome_empresa', {
            header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">NOME DA EMPRESA</p>,
            cell: (info) => (
                <p className="text-sm font-bold text-navy-700 dark:text-white">
                    {info.getValue() || 'Não informado'}
                </p>
            ),
        }),
        columnHelper.accessor('nif', {
            header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">NIF</p>,
            cell: (info) => (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {info.getValue() || '-'}
                </p>
            ),
        }),
        columnHelper.accessor('email_empresa', {
            header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">EMAIL</p>,
            cell: (info) => (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {info.getValue() || '-'}
                </p>
            ),
        }),
        columnHelper.accessor('contacto', {
            header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">CONTACTO</p>,
            cell: (info) => (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {info.getValue() || '-'}
                </p>
            ),
        }),
        columnHelper.accessor('status', {
            header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">STATUS</p>,
            cell: (info) => {
                const empresa = info.row.original;
                const statusInfo = getStatusInfo(empresa);

                if (editingStatus === empresa.id) {
                    return (
                        <div className="flex items-center space-x-2">
                            <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            >
                                <option value="ativo">Ativa</option>
                                <option value="suspenso">Suspensa</option>
                            </select>
                            <button
                                onClick={() => salvarStatus(empresa.id)}
                                className="text-green-600 hover:text-green-700"
                                title="Salvar"
                            >
                                <FaCheck />
                            </button>
                            <button
                                onClick={cancelarEdicao}
                                className="text-red-600 hover:text-red-700"
                                title="Cancelar"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    );
                }

                return (
                    <div className="flex items-center space-x-2">
                        <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusInfo.color}`}
                        >
                            {statusInfo.label}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${statusInfo.badgeColor}`} />
                    </div>
                );
            },
        }),
        columnHelper.accessor('created_at', {
            header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">CADASTRO</p>,
            cell: (info) => (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(info.getValue())}
                </p>
            ),
        }),
        columnHelper.accessor('acoes', {
            header: () => <p className="text-sm font-bold text-gray-600 dark:text-white">AÇÕES</p>,
            cell: (info) => {
                const empresa = info.row.original;

                return (
                    <div className="flex space-x-3">
                        <button
                            onClick={() => handleVisualizar(empresa.id)}
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                            title="Visualizar Perfil"
                        >
                            <FaEye size={18} />
                        </button>
                        <button
                            onClick={() => iniciarEdicaoStatus(empresa)}
                            className="text-green-500 hover:text-green-700 transition-colors"
                            title="Editar Status"
                        >
                            <FaEdit size={18} />
                        </button>
                    </div>
                );
            },
        }),
    ];

    const table = useReactTable({
        data: empresas,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    if (loading) {
        return (
            <div className="p-6">
                <Card extra={"w-full h-full sm:overflow-auto px-6 py-12"}>
                    <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Cabeçalho com estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card extra={"p-4"}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FaBuilding className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total de Empresas</p>
                            <p className="text-2xl font-bold">{empresas.length}</p>
                        </div>
                    </div>
                </Card>

                <Card extra={"p-4"}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FaCheck className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Empresas Ativas</p>
                            <p className="text-2xl font-bold">
                                {empresas.filter(e => !e.deleted_at).length}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card extra={"p-4"}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <FaTimes className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Empresas Suspensas</p>
                            <p className="text-2xl font-bold">
                                {empresas.filter(e => e.deleted_at).length}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tabela de Empresas */}
            <Card extra={"w-full h-full sm:overflow-auto px-6"}>
                <header className="relative flex items-center justify-between pt-4 pb-2">
                    <div>
                        <h2 className="text-xl font-bold text-navy-700 dark:text-white">
                            Lista de Empresas Cadastradas
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Gerencie todas as empresas organizadoras da plataforma
                        </p>
                    </div>
                </header>

                <div className="mt-5 overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="border-b border-gray-200">
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="text-left py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider"
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className="py-3 px-2"
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {empresas.length === 0 && (
                    <div className="text-center py-12">
                        <FaBuilding className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhuma empresa encontrada</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default GerenciamentoEmpresas;