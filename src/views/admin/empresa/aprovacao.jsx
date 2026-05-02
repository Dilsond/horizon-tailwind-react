import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaCheck, FaTimes, FaFilePdf, FaImage, FaDownload, FaExpand } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase.ts';
import Card from 'components/card';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
} from '@tanstack/react-table';

// ─── Modal de Documento ───────────────────────────────────────────────────────
const DocumentoModal = ({ url, nome, onClose }) => {
    if (!url) return null;

    const isPdf = nome?.toLowerCase().endsWith('.pdf');

    return createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header do modal */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        {isPdf ? (
                            <FaFilePdf className="text-red-500 w-5 h-5" />
                        ) : (
                            <FaImage className="text-blue-500 w-5 h-5" />
                        )}
                        <span className="text-sm font-semibold text-navy-700 truncate max-w-[300px]">
                            {nome || 'Documento'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={url}
                            download={nome}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-700 text-white text-xs rounded-lg hover:bg-navy-800 transition-colors"
                            title="Download"
                        >
                            <FaDownload className="w-3 h-3" />
                            Download
                        </a>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                            title="Fechar"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
                    {isPdf ? (
                        <iframe
                            src={url}
                            title={nome}
                            className="w-full h-full min-h-[60vh] rounded-lg border-0 bg-white"
                        />
                    ) : (
                        <img
                            src={url}
                            alt={nome}
                            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow"
                        />
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

// ─── Modal de Confirmação / Rejeição ─────────────────────────────────────────
const ConfirmModal = ({ type, organizador, onConfirm, onCancel, isProcessing }) => {
    const [motivo, setMotivo] = useState('');
    const [motivoError, setMotivoError] = useState('');

    const isRejeitar = type === 'rejeitar';

    const handleConfirm = () => {
        if (isRejeitar && !motivo.trim()) {
            setMotivoError('Por favor, informe o motivo da rejeição');
            return;
        }
        onConfirm(motivo);
    };

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="p-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isRejeitar ? 'bg-red-100' : 'bg-green-100'}`}>
                        {isRejeitar ? (
                            <FaTimes className="text-red-600 w-5 h-5" />
                        ) : (
                            <FaCheck className="text-green-600 w-5 h-5" />
                        )}
                    </div>

                    <h3 className="text-lg font-semibold text-navy-700 text-center mb-1">
                        {isRejeitar ? 'Rejeitar Empresa' : 'Aprovar Empresa'}
                    </h3>
                    <p className="text-sm text-gray-500 text-center mb-5">
                        {isRejeitar
                            ? `Tem a certeza que deseja rejeitar "${organizador?.nome_empresa}"?`
                            : `Tem a certeza que deseja aprovar "${organizador?.nome_empresa}"?`}
                    </p>

                    {isRejeitar && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Motivo da rejeição *
                            </label>
                            <textarea
                                value={motivo}
                                onChange={(e) => {
                                    setMotivo(e.target.value);
                                    setMotivoError('');
                                }}
                                rows={3}
                                placeholder="Descreva o motivo da rejeição..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
                                autoFocus
                            />
                            {motivoError && (
                                <p className="text-red-500 text-xs mt-1">{motivoError}</p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            disabled={isProcessing}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isProcessing}
                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                                isRejeitar
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-green-500 hover:bg-green-600'
                            }`}
                        >
                            {isProcessing ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : isRejeitar ? (
                                <>
                                    <FaTimes className="w-3 h-3" />
                                    Rejeitar
                                </>
                            ) : (
                                <>
                                    <FaCheck className="w-3 h-3" />
                                    Aprovar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ─── Componente Principal ─────────────────────────────────────────────────────
const EmpresasParaAprovar = () => {
    const navigate = useNavigate();
    const [organizadores, setOrganizadores] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    // Estado do modal de documento
    const [docModal, setDocModal] = useState({ open: false, url: null, nome: null });

    // Estado do modal de confirmação/rejeição
    const [confirmModal, setConfirmModal] = useState({
        open: false,
        type: null, // 'aprovar' | 'rejeitar'
        organizador: null,
    });

    const fetchOrganizadoresPendentes = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('organizadores')
                .select('*')
                .eq('status', 'pendente')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setOrganizadores(data || []);
        } catch (err) {
            console.error('Erro ao buscar organizadores:', err);
            setError('Erro ao carregar lista de organizadores pendentes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrganizadoresPendentes();
    }, []);

    // Abrir modal de documento
    const visualizarDocumento = (url, nome) => {
        if (!url) {
            setError('Nenhum documento anexado');
            return;
        }
        setDocModal({ open: true, url, nome });
    };

    // Abrir modal de confirmação
    const openConfirm = (type, organizador) => {
        setConfirmModal({ open: true, type, organizador });
    };

    const closeConfirm = () => {
        setConfirmModal({ open: false, type: null, organizador: null });
    };

    // Confirmar ação (aprovar ou rejeitar)
    const handleConfirmAction = async (motivo) => {
        const { type, organizador } = confirmModal;
        setProcessingId(organizador.id);

        try {
            if (type === 'aprovar') {
                const { data: userData } = await supabase.auth.getUser();
                const { error: updateError } = await supabase
                    .from('organizadores')
                    .update({
                        status: 'aprovado',
                        aprovado_por: userData.user?.id || null,
                        aprovado_em: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', organizador.id);

                if (updateError) throw updateError;
            } else {
                const { error: updateError } = await supabase
                    .from('organizadores')
                    .update({
                        status: 'rejeitado',
                        rejeitado_motivo: motivo,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', organizador.id);

                if (updateError) throw updateError;
            }

            setOrganizadores((prev) => prev.filter((org) => org.id !== organizador.id));
            closeConfirm();
        } catch (err) {
            console.error(`Erro ao ${type} organizador:`, err);
            setError(`Erro ao ${type} organizador. Tente novamente.`);
            closeConfirm();
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const columnHelper = createColumnHelper();

    const columns = [
        columnHelper.accessor('id', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">ID</p>,
            cell: (info) => (
                <p className="text-sm text-gray-600 font-mono">
                    {info.getValue().substring(0, 8)}...
                </p>
            ),
        }),
        columnHelper.accessor('nome_empresa', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Empresa</p>,
            cell: (info) => (
                <p className="text-sm font-bold text-navy-700 whitespace-nowrap">
                    {info.getValue()}
                </p>
            ),
        }),
        columnHelper.accessor('nif', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">NIF</p>,
            cell: (info) => (
                <p className="text-sm text-gray-600 font-mono">{info.getValue()}</p>
            ),
        }),
        columnHelper.accessor('email_empresa', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</p>,
            cell: (info) => (
                <p className="text-sm text-gray-600 truncate max-w-[160px]">{info.getValue()}</p>
            ),
        }),
        columnHelper.accessor('contacto', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contacto</p>,
            cell: (info) => (
                <p className="text-sm text-gray-600 whitespace-nowrap">{info.getValue() || '—'}</p>
            ),
        }),
        columnHelper.accessor('localizacao', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Localização</p>,
            cell: (info) => (
                <p className="text-sm text-gray-600 whitespace-nowrap">{info.getValue() || '—'}</p>
            ),
        }),
        columnHelper.accessor('created_at', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Solicitação</p>,
            cell: (info) => (
                <p className="text-sm text-gray-600 whitespace-nowrap">{formatDate(info.getValue())}</p>
            ),
        }),
        columnHelper.display({
            id: 'documento',
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Documento</p>,
            cell: ({ row }) => {
                const org = row.original;
                const isPdf = org.documento_nome?.toLowerCase().endsWith('.pdf');
                return (
                    <button
                        onClick={() => visualizarDocumento(org.documento_url, org.documento_nome)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium whitespace-nowrap"
                    >
                        {isPdf ? (
                            <FaFilePdf className="w-3 h-3 text-red-500" />
                        ) : (
                            <FaImage className="w-3 h-3 text-blue-500" />
                        )}
                        Ver doc
                    </button>
                );
            },
        }),
        columnHelper.display({
            id: 'acoes',
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</p>,
            cell: ({ row }) => {
                const org = row.original;
                const isProcessing = processingId === org.id;
                return (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => openConfirm('aprovar', org)}
                            disabled={isProcessing}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-xs font-medium whitespace-nowrap"
                        >
                            <FaCheck className="w-3 h-3" />
                            Aprovar
                        </button>
                        <button
                            onClick={() => openConfirm('rejeitar', org)}
                            disabled={isProcessing}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 text-xs font-medium whitespace-nowrap"
                        >
                            <FaTimes className="w-3 h-3" />
                            Rejeitar
                        </button>
                    </div>
                );
            },
        }),
    ];

    const table = useReactTable({
        data: organizadores,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
    });

    if (isLoading) {
        return (
            <div className="p-4">
                <Card extra="w-full h-full p-8">
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-700" />
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <>
            <div className="p-4">
                <Card extra="w-full h-full p-4 sm:p-6 overflow-x-auto">
                    <header className="relative flex flex-col gap-4 sm:flex-row sm:items-center justify-between pt-2 sm:pt-4">
                        <div className="text-lg sm:text-xl font-bold text-navy-700">
                            Organizadores Pendentes de Aprovação
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({organizadores.length})
                            </span>
                        </div>

                        <div className="w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Pesquisar empresa, email ou NIF..."
                                value={globalFilter}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="w-full p-2 border border-gray-300 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                            />
                        </div>
                    </header>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                            <p className="text-red-600 text-sm">{error}</p>
                            <button
                                onClick={() => {
                                    setError(null);
                                    fetchOrganizadoresPendentes();
                                }}
                                className="ml-3 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs flex-shrink-0"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    )}

                    {organizadores.length === 0 && !error ? (
                        <div className="mt-8 text-center py-12 bg-gray-50 rounded-lg">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaCheck className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Nenhum organizador pendente
                            </h3>
                            <p className="text-gray-500">
                                Todos os organizadores foram processados.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full min-w-[900px]">
                                <thead>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <tr key={headerGroup.id} className="border-b border-gray-200">
                                            {headerGroup.headers.map((header) => (
                                                <th
                                                    key={header.id}
                                                    className="py-3 px-3 text-left first:pl-0 last:pr-0"
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
                                                    className="py-3 px-3 align-middle first:pl-0 last:pr-0"
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
                    )}
                </Card>
            </div>

            {/* Modal de Documento */}
            {docModal.open && (
                <DocumentoModal
                    url={docModal.url}
                    nome={docModal.nome}
                    onClose={() => setDocModal({ open: false, url: null, nome: null })}
                />
            )}

            {/* Modal de Confirmar Ação */}
            {confirmModal.open && (
                <ConfirmModal
                    type={confirmModal.type}
                    organizador={confirmModal.organizador}
                    onConfirm={handleConfirmAction}
                    onCancel={closeConfirm}
                    isProcessing={processingId === confirmModal.organizador?.id}
                />
            )}
        </>
    );
};

export default EmpresasParaAprovar;