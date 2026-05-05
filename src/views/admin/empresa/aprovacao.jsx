import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaCheck, FaTimes, FaFilePdf, FaImage, FaDownload, FaBuilding, FaUser, FaLink } from 'react-icons/fa';
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

    const isPdf = nome?.toLowerCase().endsWith('.pdf') || url?.includes('.pdf');

    return createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
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
                        >
                            <FaDownload className="w-3 h-3" />
                            Download
                        </a>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>

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

// ─── Modal de Detalhes do Organizador ────────────────────────────────────────
const DetalhesModal = ({ organizador, onClose, onAprovar, onRejeitar }) => {
    if (!organizador) return null;

    const isSingular = organizador.tipo_organizador === 'singular';

    return createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9998] p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSingular ? 'bg-purple-100' : 'bg-blue-100'}`}>
                            {isSingular
                                ? <FaUser className="w-4 h-4 text-purple-600" />
                                : <FaBuilding className="w-4 h-4 text-blue-600" />
                            }
                        </div>
                        <span className="text-sm font-semibold text-navy-700">
                            {isSingular ? 'Organizador Individual' : 'Empresa'}
                        </span>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                        <FaTimes />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">
                                {isSingular ? 'Nome Completo' : 'Nome da Empresa'}
                            </p>
                            <p className="text-sm font-semibold text-gray-800">
                                {organizador.nome_empresa}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Email</p>
                            <p className="text-sm text-gray-700 break-all">{organizador.email_empresa}</p>
                        </div>

                        {isSingular ? (
                            <>
                                {organizador.portfolio_url && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Portfólio / Redes Sociais</p>
                                        <a
                                            href={organizador.portfolio_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline break-all"
                                        >
                                            <FaLink className="w-3 h-3 flex-shrink-0" />
                                            {organizador.portfolio_url}
                                        </a>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {organizador.nif && (
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">NIF</p>
                                        <p className="text-sm text-gray-700 font-mono">{organizador.nif}</p>
                                    </div>
                                )}
                                {organizador.contacto && (
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Contacto</p>
                                        <p className="text-sm text-gray-700">{organizador.contacto}</p>
                                    </div>
                                )}
                                {organizador.localizacao && (
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Localização</p>
                                        <p className="text-sm text-gray-700">{organizador.localizacao}</p>
                                    </div>
                                )}
                                {organizador.sobre && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Sobre</p>
                                        <p className="text-sm text-gray-700 leading-relaxed">{organizador.sobre}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Documento */}
                    <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                            {isSingular ? 'Documento de Identidade (BI)' : 'Documento (Alvará / Certificado)'}
                        </p>
                        {(isSingular ? organizador.bi_documento_url : organizador.documento_url) ? (
                            <a
                                href={isSingular ? organizador.bi_documento_url : organizador.documento_url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors w-full"
                            >
                                <FaFilePdf className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700 truncate flex-1">
                                    {isSingular
                                        ? (organizador.bi_documento_nome || 'Documento BI')
                                        : (organizador.documento_nome || 'Documento')
                                    }
                                </span>
                                <FaDownload className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            </a>
                        ) : (
                            <p className="text-sm text-gray-400 italic">Sem documento anexado</p>
                        )}
                    </div>
                </div>

                <div className="px-5 py-4 border-t border-gray-200 flex gap-3">
                    <button
                        onClick={() => { onRejeitar(organizador); onClose(); }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                        <FaTimes className="w-3 h-3" />
                        Rejeitar
                    </button>
                    <button
                        onClick={() => { onAprovar(organizador); onClose(); }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                        <FaCheck className="w-3 h-3" />
                        Aprovar
                    </button>
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
                        {isRejeitar
                            ? <FaTimes className="text-red-600 w-5 h-5" />
                            : <FaCheck className="text-green-600 w-5 h-5" />
                        }
                    </div>

                    <h3 className="text-lg font-semibold text-navy-700 text-center mb-1">
                        {isRejeitar ? 'Rejeitar Registo' : 'Aprovar Registo'}
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
                                onChange={(e) => { setMotivo(e.target.value); setMotivoError(''); }}
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
                                isRejeitar ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                            }`}
                        >
                            {isProcessing ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : isRejeitar ? (
                                <><FaTimes className="w-3 h-3" /> Rejeitar</>
                            ) : (
                                <><FaCheck className="w-3 h-3" /> Aprovar</>
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

    const [docModal, setDocModal] = useState({ open: false, url: null, nome: null });
    const [detalhesModal, setDetalhesModal] = useState({ open: false, organizador: null });
    const [confirmModal, setConfirmModal] = useState({ open: false, type: null, organizador: null });

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

    useEffect(() => { fetchOrganizadoresPendentes(); }, []);

    const visualizarDocumento = (url, nome) => {
        if (!url) { setError('Nenhum documento anexado'); return; }
        setDocModal({ open: true, url, nome });
    };

    const openConfirm = (type, organizador) => {
        setConfirmModal({ open: true, type, organizador });
    };

    const closeConfirm = () => {
        setConfirmModal({ open: false, type: null, organizador: null });
    };

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
        return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const columnHelper = createColumnHelper();

    const columns = [
        // Tipo badge
        columnHelper.accessor('tipo_organizador', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</p>,
            cell: (info) => {
                const isSingular = info.getValue() === 'singular';
                return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                        isSingular
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                    }`}>
                        {isSingular
                            ? <><FaUser className="w-2.5 h-2.5" /> Individual</>
                            : <><FaBuilding className="w-2.5 h-2.5" /> Empresa</>
                        }
                    </span>
                );
            },
        }),
        // Nome (nome_empresa para ambos; nome_completo é igual para singular)
        columnHelper.accessor('nome_empresa', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome</p>,
            cell: (info) => (
                <p className="text-sm font-bold text-navy-700 whitespace-nowrap">{info.getValue()}</p>
            ),
        }),
        // NIF (apenas empresas) / portfólio (singulares)
        columnHelper.display({
            id: 'identificacao',
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">NIF / Portfólio</p>,
            cell: ({ row }) => {
                const org = row.original;
                const isSingular = org.tipo_organizador === 'singular';
                if (isSingular) {
                    return org.portfolio_url ? (
                        <a
                            href={org.portfolio_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline max-w-[130px] truncate"
                            title={org.portfolio_url}
                        >
                            <FaLink className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{org.portfolio_url.replace(/^https?:\/\//, '')}</span>
                        </a>
                    ) : <span className="text-xs text-gray-400">—</span>;
                }
                return <p className="text-sm text-gray-600 font-mono">{org.nif || '—'}</p>;
            },
        }),
        columnHelper.accessor('email_empresa', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</p>,
            cell: (info) => (
                <p className="text-sm text-gray-600 truncate max-w-[160px]">{info.getValue()}</p>
            ),
        }),
        columnHelper.accessor('created_at', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Solicitação</p>,
            cell: (info) => (
                <p className="text-sm text-gray-600 whitespace-nowrap">{formatDate(info.getValue())}</p>
            ),
        }),
        // Documento — adapta consoante o tipo
        columnHelper.display({
            id: 'documento',
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Documento</p>,
            cell: ({ row }) => {
                const org = row.original;
                const isSingular = org.tipo_organizador === 'singular';
                const url = isSingular ? org.bi_documento_url : org.documento_url;
                const nome = isSingular ? (org.bi_documento_nome || 'BI') : (org.documento_nome || 'Alvará');
                const isPdf = nome?.toLowerCase().endsWith('.pdf') || url?.includes('.pdf');

                return url ? (
                    <button
                        onClick={() => visualizarDocumento(url, nome)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium whitespace-nowrap"
                    >
                        {isPdf
                            ? <FaFilePdf className="w-3 h-3 text-red-500" />
                            : <FaImage className="w-3 h-3 text-blue-500" />
                        }
                        {isSingular ? 'Ver BI' : 'Ver alvará'}
                    </button>
                ) : (
                    <span className="text-xs text-gray-400 italic">Sem doc.</span>
                );
            },
        }),
        // Acções
        columnHelper.display({
            id: 'acoes',
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</p>,
            cell: ({ row }) => {
                const org = row.original;
                const isProcessing = processingId === org.id;
                return (
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setDetalhesModal({ open: true, organizador: org })}
                            className="px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium whitespace-nowrap"
                        >
                            Detalhes
                        </button>
                        <button
                            onClick={() => openConfirm('aprovar', org)}
                            disabled={isProcessing}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-xs font-medium whitespace-nowrap"
                        >
                            <FaCheck className="w-2.5 h-2.5" />
                            Aprovar
                        </button>
                        <button
                            onClick={() => openConfirm('rejeitar', org)}
                            disabled={isProcessing}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 text-xs font-medium whitespace-nowrap"
                        >
                            <FaTimes className="w-2.5 h-2.5" />
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

    // Contagens por tipo
    const totalEmpresas = organizadores.filter(o => o.tipo_organizador === 'empresa').length;
    const totalSingulares = organizadores.filter(o => o.tipo_organizador === 'singular').length;

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
                    <header className="relative flex flex-col gap-4 sm:flex-row sm:items-start justify-between pt-2 sm:pt-4">
                        <div>
                            <div className="text-lg sm:text-xl font-bold text-navy-700">
                                Organizadores Pendentes de Aprovação
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                    ({organizadores.length})
                                </span>
                            </div>
                            {/* Mini contadores por tipo */}
                            {organizadores.length > 0 && (
                                <div className="flex items-center gap-3 mt-1.5">
                                    {totalEmpresas > 0 && (
                                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                                            <FaBuilding className="w-2.5 h-2.5" />
                                            {totalEmpresas} empresa{totalEmpresas !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                    {totalSingulares > 0 && (
                                        <span className="inline-flex items-center gap-1 text-xs text-purple-600 font-medium">
                                            <FaUser className="w-2.5 h-2.5" />
                                            {totalSingulares} individual{totalSingulares !== 1 ? 'is' : ''}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Pesquisar nome, email ou NIF..."
                                value={globalFilter}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="w-full p-2 border border-gray-300 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 text-sm"
                            />
                        </div>
                    </header>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                            <p className="text-red-600 text-sm">{error}</p>
                            <button
                                onClick={() => { setError(null); fetchOrganizadoresPendentes(); }}
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum organizador pendente</h3>
                            <p className="text-gray-500">Todos os organizadores foram processados.</p>
                        </div>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full min-w-[860px]">
                                <thead>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <tr key={headerGroup.id} className="border-b border-gray-200">
                                            {headerGroup.headers.map((header) => (
                                                <th key={header.id} className="py-3 px-3 text-left first:pl-0 last:pr-0">
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
                                                <td key={cell.id} className="py-3 px-3 align-middle first:pl-0 last:pr-0">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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

            {/* Modal de Detalhes */}
            {detalhesModal.open && (
                <DetalhesModal
                    organizador={detalhesModal.organizador}
                    onClose={() => setDetalhesModal({ open: false, organizador: null })}
                    onAprovar={(org) => openConfirm('aprovar', org)}
                    onRejeitar={(org) => openConfirm('rejeitar', org)}
                />
            )}

            {/* Modal de Confirmação */}
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