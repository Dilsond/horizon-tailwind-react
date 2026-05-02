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
    const [empresasPendentes, setEmpresasPendentes] = useState(0);
    const [loading, setLoading] = useState(true);
    const [editingStatus, setEditingStatus] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchEmpresas();
        fetchEmpresasPendentes();
    }, []);

    const fetchEmpresas = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('organizadores')
                .select('*')
                .eq('status', 'aprovado')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setEmpresas(data || []);
        } catch (err) {
            console.error('Erro ao buscar empresas:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmpresasPendentes = async () => {
        try {
            const { count, error } = await supabase
                .from('organizadores')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pendente');
            if (error) throw error;
            setEmpresasPendentes(count || 0);
        } catch (err) {
            console.error('Erro ao buscar empresas pendentes:', err);
        }
    };

    const atualizarStatus = async (id, novoStatus) => {
        try {
            const updateData =
                novoStatus === 'ativo'
                    ? { deleted_at: null, updated_at: new Date().toISOString() }
                    : { deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() };

            const { error } = await supabase
                .from('organizadores')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            setEmpresas((prev) =>
                prev.map((emp) => (emp.id === id ? { ...emp, ...updateData } : emp))
            );
            setEditingStatus(null);
            setNewStatus('');
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

    const salvarStatus = (id) => atualizarStatus(id, newStatus);

    const handleVisualizar = (id) => navigate(`/admin/perfilempresa/${id}`);

    const getStatusInfo = (empresa) => {
        const isActive = !empresa.deleted_at;
        return {
            label: isActive ? 'Ativa' : 'Suspensa',
            color: isActive
                ? 'bg-green-100 text-green-800 border-green-200'
                : 'bg-red-100 text-red-800 border-red-200',
            badgeColor: isActive ? 'bg-green-500' : 'bg-red-500',
        };
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-PT');
    };

    const columnHelper = createColumnHelper();
    const columns = [
        columnHelper.accessor('nome_empresa', {
            header: () => (
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Nome da Empresa
                </p>
            ),
            cell: (info) => (
                <p className="text-sm font-bold text-navy-700 dark:text-white whitespace-nowrap">
                    {info.getValue() || 'Não informado'}
                </p>
            ),
        }),
        columnHelper.accessor('nif', {
            header: () => (
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">NIF</p>
            ),
            cell: (info) => (
                <p className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                    {info.getValue() || '-'}
                </p>
            ),
        }),
        columnHelper.accessor('email_empresa', {
            header: () => (
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</p>
            ),
            cell: (info) => (
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[180px]">
                    {info.getValue() || '-'}
                </p>
            ),
        }),
        columnHelper.accessor('contacto', {
            header: () => (
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contacto</p>
            ),
            cell: (info) => (
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {info.getValue() || '-'}
                </p>
            ),
        }),
        columnHelper.display({
            id: 'status',
            header: () => (
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</p>
            ),
            cell: ({ row }) => {
                const empresa = row.original;
                const statusInfo = getStatusInfo(empresa);

                if (editingStatus === empresa.id) {
                    return (
                        <div className="flex items-center gap-2">
                            <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                            >
                                <option value="ativo">Ativa</option>
                                <option value="suspenso">Suspensa</option>
                            </select>
                            <button
                                onClick={() => salvarStatus(empresa.id)}
                                className="text-green-600 hover:text-green-700 transition-colors"
                                title="Salvar"
                            >
                                <FaCheck size={13} />
                            </button>
                            <button
                                onClick={cancelarEdicao}
                                className="text-red-600 hover:text-red-700 transition-colors"
                                title="Cancelar"
                            >
                                <FaTimes size={13} />
                            </button>
                        </div>
                    );
                }

                return (
                    <div className="flex items-center gap-2">
                        <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full border whitespace-nowrap ${statusInfo.color}`}
                        >
                            {statusInfo.label}
                        </span>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusInfo.badgeColor}`} />
                    </div>
                );
            },
        }),
        columnHelper.accessor('created_at', {
            header: () => (
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cadastro</p>
            ),
            cell: (info) => (
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {formatDate(info.getValue())}
                </p>
            ),
        }),
        columnHelper.display({
            id: 'acoes',
            header: () => (
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</p>
            ),
            cell: ({ row }) => {
                const empresa = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleVisualizar(empresa.id)}
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                            title="Visualizar Perfil"
                        >
                            <FaEye size={17} />
                        </button>
                        <button
                            onClick={() => iniciarEdicaoStatus(empresa)}
                            className="text-green-600 hover:text-navy-900 transition-colors"
                            title="Editar Status"
                        >
                            <FaEdit size={17} />
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

    const totalEmpresas = empresas.length + empresasPendentes;
    const taxaAprovacao =
        totalEmpresas > 0 ? Math.round((empresas.length / totalEmpresas) * 100) : 0;

    if (loading) {
        return (
            <div className="p-6">
                <Card extra="w-full h-full sm:overflow-auto px-6 py-12">
                    <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-700" />
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card extra="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FaBuilding className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Aprovadas</p>
                            <p className="text-2xl font-bold text-navy-700">{empresas.length}</p>
                        </div>
                    </div>
                </Card>

                <Card extra="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FaCheck className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Empresas Ativas</p>
                            <p className="text-2xl font-bold text-navy-700">
                                {empresas.filter((e) => !e.deleted_at).length}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card extra="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FaTimes className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Empresas Suspensas</p>
                            <p className="text-2xl font-bold text-navy-700">
                                {empresas.filter((e) => e.deleted_at).length}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card extra="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FaBuilding className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Taxa de Aprovação</p>
                            <p className="text-2xl font-bold text-navy-700">{taxaAprovacao}%</p>
                            <p className="text-xs text-gray-400 mt-0.5">{empresasPendentes} pendentes</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tabela */}
            <Card extra="w-full h-full sm:overflow-auto px-6">
                <header className="relative flex items-center justify-between pt-4 pb-2">
                    <div>
                        <h2 className="text-xl font-bold text-navy-700 dark:text-white">
                            Empresas Aprovadas
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Lista de empresas que já foram aprovadas na plataforma
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            fetchEmpresas();
                            fetchEmpresasPendentes();
                        }}
                        className="px-4 py-2 bg-navy-400 text-white rounded-lg hover:bg-navy-800 transition-colors text-sm font-medium"
                    >
                        Atualizar
                    </button>
                </header>

                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="border-b border-gray-200">
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="text-left py-3 px-3 first:pl-0 last:pr-0"
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
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
                                            className="py-3 px-3 first:pl-0 last:pr-0 align-middle"
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {empresas.length === 0 && (
                    <div className="text-center py-12">
                        <FaBuilding className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Nenhuma empresa aprovada encontrada</p>
                        <p className="text-sm text-gray-400 mt-1">
                            As empresas aprovadas aparecerão aqui
                        </p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default GerenciamentoEmpresas;