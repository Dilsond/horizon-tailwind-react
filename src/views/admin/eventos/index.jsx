import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaCheck, FaTimes, FaFilePdf, FaImage, FaDownload, FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt, FaUser, FaRedo, FaExclamationTriangle } from 'react-icons/fa';
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
const DocumentoModal = ({ url, nome, loading, onClose }) => {
    if (!url && !loading) return null;
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
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        {isPdf
                            ? <FaFilePdf className="text-red-500 w-5 h-5" />
                            : <FaImage className="text-blue-500 w-5 h-5" />
                        }
                        <span className="text-sm font-semibold text-navy-700 truncate max-w-[300px]">
                            {nome || 'Documento de Autorização'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {url && (
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
                        )}
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4 min-h-[60vh]">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                            <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                            <p className="text-sm">A carregar documento...</p>
                        </div>
                    ) : isPdf ? (
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

// ─── Modal de Detalhe do Evento ───────────────────────────────────────────────
const EventoDetalheModal = ({ evento, onClose }) => {
    if (!evento) return null;

    const formatDate = (d) => d
        ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
        : '—';

    const tipoLabel = { presencial: 'Presencial', online: 'Online', hibrido: 'Híbrido' };
    const categoriaLabel = { palestra: 'Palestra', workshop: 'Workshop', feiras: 'Feira', masterclasse: 'Masterclasse' };

    return createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {evento.imagem_url && (
                    <div className="h-44 w-full overflow-hidden flex-shrink-0">
                        <img
                            src={evento.imagem_url}
                            alt={evento.nome_evento}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div className="p-5 overflow-y-auto flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                            {categoriaLabel[evento.categoria] || evento.categoria}
                        </span>
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                            {tipoLabel[evento.tipo_evento] || evento.tipo_evento}
                        </span>
                        {evento.valor > 0
                            ? <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Pago · {evento.valor} Kz</span>
                            : <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">Gratuito</span>
                        }
                    </div>

                    <h2 className="text-lg font-bold text-navy-700 mb-4">{evento.nome_evento}</h2>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-orange-400 flex-shrink-0" />
                            <span>{formatDate(evento.data_evento)} · {evento.hora_evento?.slice(0, 5)}{evento.hora_termino ? ` → ${evento.hora_termino.slice(0, 5)}` : ''}</span>
                        </div>
                        {evento.local && (
                            <div className="flex items-center gap-2">
                                <FaMapMarkerAlt className="text-orange-400 flex-shrink-0" />
                                <span>{evento.local}</span>
                            </div>
                        )}
                        {evento.contacto_whatsapp && (
                            <div className="flex items-center gap-2">
                                <span className="text-green-500 font-bold text-xs">WA</span>
                                <span>{evento.contacto_whatsapp}</span>
                            </div>
                        )}
                    </div>

                    {evento.descricao && (
                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Descrição</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{evento.descricao}</p>
                        </div>
                    )}

                    {/* Motivo de rejeição (quando aplicável) */}
                    {evento.motivo_rejeicao && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
                            <p className="text-xs font-semibold text-red-400 uppercase mb-1 flex items-center gap-1">
                                <FaExclamationTriangle className="w-3 h-3" />
                                Motivo da Rejeição
                            </p>
                            <p className="text-sm text-red-700 leading-relaxed">{evento.motivo_rejeicao}</p>
                        </div>
                    )}

                    {Array.isArray(evento.estacoes) && evento.estacoes.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                                <FaTicketAlt className="inline mr-1" />
                                Ingressos
                            </p>
                            <div className="space-y-2">
                                {evento.estacoes.map((e, i) => (
                                    <div key={i} className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2 text-sm">
                                        <span className="font-medium text-gray-700">{e.nome}</span>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span>{e.quantidade} lugares</span>
                                            <span className="font-semibold text-orange-600">{e.preco} Kz</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ─── Modal de Confirmação / Rejeição ─────────────────────────────────────────
const ConfirmModal = ({ type, evento, onConfirm, onCancel, isProcessing }) => {
    const [motivo, setMotivo] = useState('');
    const [motivoError, setMotivoError] = useState('');
    const isRejeitar = type === 'rejeitar';
    const isReanalisar = type === 'reanalisar';

    const handleConfirm = () => {
        if (isRejeitar && !motivo.trim()) {
            setMotivoError('Por favor, informe o motivo da rejeição');
            return;
        }
        onConfirm(motivo);
    };

    const config = {
        rejeitar: {
            iconBg: 'bg-red-100',
            icon: <FaTimes className="text-red-600 w-5 h-5" />,
            title: 'Rejeitar Evento',
            desc: `Tem a certeza que deseja rejeitar "${evento?.nome_evento}"?`,
            btnClass: 'bg-red-500 hover:bg-red-600',
            btnLabel: <><FaTimes className="w-3 h-3" /> Rejeitar</>,
        },
        aprovar: {
            iconBg: 'bg-green-100',
            icon: <FaCheck className="text-green-600 w-5 h-5" />,
            title: 'Aprovar Evento',
            desc: `Tem a certeza que deseja aprovar "${evento?.nome_evento}"? O evento ficará visível na plataforma.`,
            btnClass: 'bg-green-500 hover:bg-green-600',
            btnLabel: <><FaCheck className="w-3 h-3" /> Aprovar</>,
        },
        reanalisar: {
            iconBg: 'bg-amber-100',
            icon: <FaRedo className="text-amber-600 w-5 h-5" />,
            title: 'Colocar em Análise',
            desc: `Tem a certeza que deseja mover "${evento?.nome_evento}" de volta para pendente? O organizador será notificado.`,
            btnClass: 'bg-amber-500 hover:bg-amber-600',
            btnLabel: <><FaRedo className="w-3 h-3" /> Mover para pendente</>,
        },
    };

    const c = config[type] || config.aprovar;

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="p-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${c.iconBg}`}>
                        {c.icon}
                    </div>

                    <h3 className="text-lg font-semibold text-navy-700 text-center mb-1">{c.title}</h3>
                    <p className="text-sm text-gray-500 text-center mb-5">{c.desc}</p>

                    {isRejeitar && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Motivo da rejeição *
                            </label>
                            <textarea
                                value={motivo}
                                onChange={(e) => { setMotivo(e.target.value); setMotivoError(''); }}
                                rows={3}
                                placeholder="Descreva o motivo da rejeição para notificar o organizador..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
                                autoFocus
                            />
                            {motivoError && <p className="text-red-500 text-xs mt-1">{motivoError}</p>}
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
                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${c.btnClass}`}
                        >
                            {isProcessing
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : c.btnLabel
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ─── Tabela de Eventos Rejeitados ─────────────────────────────────────────────
const EventosRejeitados = ({ onReanalisarSuccess }) => {
    const [eventos, setEventos] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ open: false, type: null, evento: null });
    const [detalheModal, setDetalheModal] = useState({ open: false, evento: null });
    const [docModal, setDocModal] = useState({ open: false, url: null, nome: null, loading: false });

    const abrirDocumento = async (urlPublica, nome) => {
        if (!urlPublica) return;
        setDocModal({ open: true, url: null, nome, loading: true });
        try {
            const marker = '/storage/v1/object/public/event-documents/';
            const markerSign = '/storage/v1/object/sign/event-documents/';
            let path = null;
            if (urlPublica.includes(marker)) {
                path = decodeURIComponent(urlPublica.split(marker)[1]);
            } else if (urlPublica.includes(markerSign)) {
                path = decodeURIComponent(urlPublica.split(markerSign)[1].split('?')[0]);
            } else {
                const parts = urlPublica.split('event-documents/');
                if (parts[1]) path = decodeURIComponent(parts[1].split('?')[0]);
            }
            if (!path) throw new Error('Caminho não encontrado');
            const { data, error: signError } = await supabase.storage
                .from('event-documents')
                .createSignedUrl(path, 3600);
            if (signError) throw signError;
            setDocModal({ open: true, url: data.signedUrl, nome, loading: false });
        } catch (err) {
            console.error('Erro ao gerar URL assinado:', err);
            setDocModal({ open: false, url: null, nome: null, loading: false });
        }
    };

    const fetchEventosRejeitados = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('eventos')
                .select(`
                    *,
                    organizadores!eventos_organizador_id_fkey (
                        nome_empresa,
                        email_empresa,
                        contacto
                    )
                `)
                .eq('status_aprovacao', 'rejeitado')
                .is('deleted_at', null)
                .order('updated_at', { ascending: false });

            if (fetchError) throw fetchError;
            setEventos(data || []);
        } catch (err) {
            console.error('Erro ao buscar eventos rejeitados:', err);
            setError('Erro ao carregar eventos rejeitados');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchEventosRejeitados(); }, []);

    const handleReanalisar = async () => {
        const { evento } = confirmModal;
        setProcessingId(evento.id);
        try {
            const { error: updateError } = await supabase
                .from('eventos')
                .update({
                    status_aprovacao: 'pendente',
                    motivo_rejeicao: null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', evento.id);

            if (updateError) throw updateError;

            // Notificar organizador
            await supabase.from('notificacoes').insert({
                usuario_id: evento.organizador_id,
                tipo_usuario: 'organizer',
                titulo: '🔄 Evento em Reanálise',
                mensagem: `O seu evento "${evento.nome_evento}" foi colocado em análise novamente pelo administrador.`,
                tipo: 'evento_reanalise',
            });

            setEventos((prev) => prev.filter((e) => e.id !== evento.id));
            setConfirmModal({ open: false, type: null, evento: null });
            if (onReanalisarSuccess) onReanalisarSuccess();
        } catch (err) {
            console.error('Erro ao reanalisar evento:', err);
            setError('Erro ao mover evento para pendente. Tente novamente.');
            setConfirmModal({ open: false, type: null, evento: null });
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (d) => d
        ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    const tipoDocLabel = { contrato_aluguer: 'Contrato', carta_autorizacao: 'Carta Aut.' };
    const categoriaLabel = { palestra: 'Palestra', workshop: 'Workshop', feiras: 'Feira', masterclasse: 'Masterclasse' };

    const columnHelper = createColumnHelper();

    const columns = [
        columnHelper.display({
            id: 'capa',
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Capa</p>,
            cell: ({ row }) => {
                const ev = row.original;
                return ev.imagem_url ? (
                    <img
                        src={ev.imagem_url}
                        alt={ev.nome_evento}
                        className="w-12 h-12 object-cover rounded-lg border border-red-100 flex-shrink-0 opacity-80"
                    />
                ) : (
                    <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
                        <FaCalendarAlt className="text-red-200 w-5 h-5" />
                    </div>
                );
            },
        }),
        columnHelper.accessor('nome_evento', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Evento</p>,
            cell: (info) => (
                <div>
                    <p className="text-sm font-bold text-navy-700 whitespace-nowrap max-w-[180px] truncate">
                        {info.getValue()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {categoriaLabel[info.row.original.categoria] || info.row.original.categoria}
                    </p>
                </div>
            ),
        }),
        columnHelper.accessor('organizadores', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Organizador</p>,
            cell: (info) => {
                const org = info.getValue();
                return (
                    <div>
                        <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">{org?.nome_empresa || '—'}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[140px]">{org?.email_empresa || ''}</p>
                    </div>
                );
            },
        }),
        columnHelper.accessor('data_evento', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data Evento</p>,
            cell: (info) => (
                <div>
                    <p className="text-sm text-gray-700 whitespace-nowrap">{formatDate(info.getValue())}</p>
                    <p className="text-xs text-gray-400">
                        {info.row.original.hora_evento?.slice(0, 5)}
                    </p>
                </div>
            ),
        }),
        columnHelper.accessor('motivo_rejeicao', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Motivo</p>,
            cell: (info) => (
                <div className="max-w-[200px]">
                    <p className="text-xs text-red-600 leading-relaxed line-clamp-2">
                        {info.getValue() || <span className="text-gray-400 italic">Não especificado</span>}
                    </p>
                </div>
            ),
        }),
        columnHelper.accessor('updated_at', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rejeitado em</p>,
            cell: (info) => (
                <p className="text-sm text-gray-600 whitespace-nowrap">{formatDate(info.getValue())}</p>
            ),
        }),
        columnHelper.display({
            id: 'documento',
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Documento</p>,
            cell: ({ row }) => {
                const ev = row.original;
                if (!ev.documento_autorizacao_url) {
                    return <span className="text-xs text-gray-400 italic">Sem doc.</span>;
                }
                const isPdf = ev.documento_autorizacao_nome?.toLowerCase().endsWith('.pdf');
                return (
                    <button
                        onClick={() => abrirDocumento(ev.documento_autorizacao_url, ev.documento_autorizacao_nome)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium whitespace-nowrap"
                    >
                        {isPdf
                            ? <FaFilePdf className="w-3 h-3 text-red-500" />
                            : <FaImage className="w-3 h-3 text-blue-500" />
                        }
                        {tipoDocLabel[ev.documento_autorizacao_tipo] || 'Ver doc'}
                    </button>
                );
            },
        }),
        columnHelper.display({
            id: 'detalhes',
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Detalhes</p>,
            cell: ({ row }) => (
                <button
                    onClick={() => setDetalheModal({ open: true, evento: row.original })}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium whitespace-nowrap"
                >
                    <FaCalendarAlt className="w-3 h-3" />
                    Ver evento
                </button>
            ),
        }),
        columnHelper.display({
            id: 'acoes',
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ação</p>,
            cell: ({ row }) => {
                const ev = row.original;
                const isProcessing = processingId === ev.id;
                return (
                    <button
                        onClick={() => setConfirmModal({ open: true, type: 'reanalisar', evento: ev })}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 text-xs font-medium whitespace-nowrap"
                    >
                        {isProcessing
                            ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <FaRedo className="w-3 h-3" />
                        }
                        Pôr pendente
                    </button>
                );
            },
        }),
    ];

    const table = useReactTable({
        data: eventos,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
    });

    return (
        <>
            {/* Divisor visual */}
            <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-red-200 to-transparent" />
                <div className="flex items-center gap-2 px-4 py-1.5 bg-red-50 border border-red-100 rounded-full">
                    <FaTimes className="w-3 h-3 text-red-400" />
                    <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">Eventos Rejeitados</span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-red-200 to-transparent" />
            </div>

            <Card extra="w-full h-full p-4 sm:p-6 overflow-x-auto border border-red-50">
                <header className="relative flex flex-col gap-4 sm:flex-row sm:items-center justify-between pt-2 sm:pt-4">
                    <div>
                        <div className="text-lg sm:text-xl font-bold text-navy-700 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-7 h-7 bg-red-100 rounded-lg">
                                <FaTimes className="w-3.5 h-3.5 text-red-500" />
                            </span>
                            Eventos Rejeitados
                            <span className="ml-1 text-sm font-normal text-gray-500">
                                ({eventos.length})
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 ml-9">
                            Mova eventos de volta para pendente para que sejam reanalisados
                        </p>
                    </div>
                    <div className="w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="Pesquisar evento ou organizador..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="w-full p-2 border border-gray-300 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 text-sm"
                        />
                    </div>
                </header>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                        <p className="text-red-600 text-sm">{error}</p>
                        <button
                            onClick={() => { setError(null); fetchEventosRejeitados(); }}
                            className="ml-3 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs flex-shrink-0"
                        >
                            Tentar novamente
                        </button>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-400" />
                    </div>
                ) : eventos.length === 0 && !error ? (
                    <div className="mt-6 text-center py-10 bg-gray-50 rounded-xl">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FaCheck className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Nenhum evento rejeitado</p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[1050px]">
                            <thead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id} className="border-b border-red-100">
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
                                    <tr key={row.id} className="border-b border-red-50 hover:bg-red-50/40 transition-colors">
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

            {/* Modal de documento */}
            {docModal.open && (
                <DocumentoModal
                    url={docModal.url}
                    nome={docModal.nome}
                    loading={docModal.loading}
                    onClose={() => setDocModal({ open: false, url: null, nome: null, loading: false })}
                />
            )}

            {/* Modal de detalhe */}
            {detalheModal.open && (
                <EventoDetalheModal
                    evento={detalheModal.evento}
                    onClose={() => setDetalheModal({ open: false, evento: null })}
                />
            )}

            {/* Modal de confirmação */}
            {confirmModal.open && (
                <ConfirmModal
                    type={confirmModal.type}
                    evento={confirmModal.evento}
                    onConfirm={handleReanalisar}
                    onCancel={() => setConfirmModal({ open: false, type: null, evento: null })}
                    isProcessing={processingId === confirmModal.evento?.id}
                />
            )}
        </>
    );
};

// ─── Componente Principal ─────────────────────────────────────────────────────
const EventosPendentes = () => {
    const [eventos, setEventos] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [refreshRejeitados, setRefreshRejeitados] = useState(0);

    const [docModal, setDocModal] = useState({ open: false, url: null, nome: null, loading: false });
    const [detalheModal, setDetalheModal] = useState({ open: false, evento: null });
    const [confirmModal, setConfirmModal] = useState({ open: false, type: null, evento: null });

    const abrirDocumento = async (urlPublica, nome) => {
        if (!urlPublica) { setError('Nenhum documento anexado'); return; }

        setDocModal({ open: true, url: null, nome, loading: true });

        try {
            const marker = '/storage/v1/object/public/event-documents/';
            const markerSign = '/storage/v1/object/sign/event-documents/';
            let path = null;

            if (urlPublica.includes(marker)) {
                path = decodeURIComponent(urlPublica.split(marker)[1]);
            } else if (urlPublica.includes(markerSign)) {
                path = decodeURIComponent(urlPublica.split(markerSign)[1].split('?')[0]);
            } else {
                const parts = urlPublica.split('event-documents/');
                if (parts[1]) path = decodeURIComponent(parts[1].split('?')[0]);
            }

            if (!path) throw new Error('Não foi possível extrair o caminho do ficheiro');

            const { data, error: signError } = await supabase.storage
                .from('event-documents')
                .createSignedUrl(path, 3600);

            if (signError) throw signError;

            setDocModal({ open: true, url: data.signedUrl, nome, loading: false });
        } catch (err) {
            console.error('Erro ao gerar URL assinado:', err);
            setError('Não foi possível carregar o documento. Verifique as permissões do bucket.');
            setDocModal({ open: false, url: null, nome: null, loading: false });
        }
    };

    const fetchEventosPendentes = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('eventos')
                .select(`
                    *,
                    organizadores!eventos_organizador_id_fkey (
                        nome_empresa,
                        email_empresa,
                        contacto
                    )
                `)
                .eq('status_aprovacao', 'pendente')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setEventos(data || []);
        } catch (err) {
            console.error('Erro ao buscar eventos pendentes:', err);
            setError('Erro ao carregar eventos pendentes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchEventosPendentes(); }, []);

    const openConfirm = (type, evento) => setConfirmModal({ open: true, type, evento });
    const closeConfirm = () => setConfirmModal({ open: false, type: null, evento: null });

    const handleConfirmAction = async (motivo) => {
        const { type, evento } = confirmModal;
        setProcessingId(evento.id);

        try {
            if (type === 'aprovar') {
                const { data: userData } = await supabase.auth.getUser();

                const { error: updateError } = await supabase
                    .from('eventos')
                    .update({
                        status_aprovacao: 'aprovado',
                        aprovado_por: userData.user?.id || null,
                        aprovado_em: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', evento.id);

                if (updateError) throw updateError;

                await supabase.from('notificacoes').insert({
                    usuario_id: evento.organizador_id,
                    tipo_usuario: 'organizer',
                    titulo: '✅ Evento Aprovado!',
                    mensagem: `O seu evento "${evento.nome_evento}" foi aprovado e já está visível na plataforma.`,
                    tipo: 'evento_aprovado',
                });

            } else {
                const { error: updateError } = await supabase
                    .from('eventos')
                    .update({
                        status_aprovacao: 'rejeitado',
                        motivo_rejeicao: motivo,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', evento.id);

                if (updateError) throw updateError;

                await supabase.from('notificacoes').insert({
                    usuario_id: evento.organizador_id,
                    tipo_usuario: 'organizer',
                    titulo: '❌ Evento Rejeitado',
                    mensagem: `O seu evento "${evento.nome_evento}" foi rejeitado. Motivo: ${motivo}`,
                    tipo: 'evento_rejeitado',
                });
            }

            setEventos((prev) => prev.filter((e) => e.id !== evento.id));
            closeConfirm();

            // Se rejeitou, refresca a tabela de rejeitados
            if (type === 'rejeitar') {
                setRefreshRejeitados((n) => n + 1);
            }
        } catch (err) {
            console.error(`Erro ao ${type} evento:`, err);
            setError(`Erro ao ${type} evento. Tente novamente.`);
            closeConfirm();
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (d) => d
        ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    const tipoLabel = { presencial: 'Presencial', online: 'Online', hibrido: 'Híbrido' };
    const categoriaLabel = { palestra: 'Palestra', workshop: 'Workshop', feiras: 'Feira', masterclasse: 'Masterclasse' };
    const tipoDocLabel = { contrato_aluguer: 'Contrato', carta_autorizacao: 'Carta Aut.' };

    const columnHelper = createColumnHelper();

    const columns = [
        columnHelper.display({
            id: 'capa',
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Capa</p>,
            cell: ({ row }) => {
                const ev = row.original;
                return ev.imagem_url ? (
                    <img
                        src={ev.imagem_url}
                        alt={ev.nome_evento}
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                    />
                ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FaCalendarAlt className="text-gray-300 w-5 h-5" />
                    </div>
                );
            },
        }),
        columnHelper.accessor('nome_evento', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Evento</p>,
            cell: (info) => (
                <div>
                    <p className="text-sm font-bold text-navy-700 whitespace-nowrap max-w-[180px] truncate">
                        {info.getValue()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {categoriaLabel[info.row.original.categoria] || info.row.original.categoria}
                    </p>
                </div>
            ),
        }),
        columnHelper.accessor('organizadores', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Organizador</p>,
            cell: (info) => {
                const org = info.getValue();
                return (
                    <div>
                        <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                            {org?.nome_empresa || '—'}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-[140px]">
                            {org?.email_empresa || ''}
                        </p>
                    </div>
                );
            },
        }),
        columnHelper.accessor('data_evento', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data Evento</p>,
            cell: (info) => (
                <div>
                    <p className="text-sm text-gray-700 whitespace-nowrap">{formatDate(info.getValue())}</p>
                    <p className="text-xs text-gray-400">
                        {info.row.original.hora_evento?.slice(0, 5)}
                        {info.row.original.hora_termino ? ` → ${info.row.original.hora_termino.slice(0, 5)}` : ''}
                    </p>
                </div>
            ),
        }),
        columnHelper.accessor('tipo_evento', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</p>,
            cell: (info) => (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full whitespace-nowrap">
                    {tipoLabel[info.getValue()] || info.getValue()}
                </span>
            ),
        }),
        columnHelper.accessor('valor', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Valor</p>,
            cell: (info) => (
                info.getValue() > 0
                    ? <span className="text-sm font-semibold text-green-600 whitespace-nowrap">{info.getValue()} Kz</span>
                    : <span className="text-xs text-gray-400 font-medium">Gratuito</span>
            ),
        }),
        columnHelper.accessor('created_at', {
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Submetido</p>,
            cell: (info) => (
                <p className="text-sm text-gray-600 whitespace-nowrap">{formatDate(info.getValue())}</p>
            ),
        }),
        columnHelper.display({
            id: 'documento',
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Documento</p>,
            cell: ({ row }) => {
                const ev = row.original;
                if (!ev.documento_autorizacao_url) {
                    return <span className="text-xs text-gray-400 italic">Sem doc.</span>;
                }
                const isPdf = ev.documento_autorizacao_nome?.toLowerCase().endsWith('.pdf');
                return (
                    <button
                        onClick={() => abrirDocumento(ev.documento_autorizacao_url, ev.documento_autorizacao_nome)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium whitespace-nowrap"
                    >
                        {isPdf
                            ? <FaFilePdf className="w-3 h-3 text-red-500" />
                            : <FaImage className="w-3 h-3 text-blue-500" />
                        }
                        {tipoDocLabel[ev.documento_autorizacao_tipo] || 'Ver doc'}
                    </button>
                );
            },
        }),
        columnHelper.display({
            id: 'detalhes',
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Detalhes</p>,
            cell: ({ row }) => (
                <button
                    onClick={() => setDetalheModal({ open: true, evento: row.original })}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium whitespace-nowrap"
                >
                    <FaCalendarAlt className="w-3 h-3" />
                    Ver evento
                </button>
            ),
        }),
        columnHelper.display({
            id: 'acoes',
            header: () => <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</p>,
            cell: ({ row }) => {
                const ev = row.original;
                const isProcessing = processingId === ev.id;
                return (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => openConfirm('aprovar', ev)}
                            disabled={isProcessing}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-xs font-medium whitespace-nowrap"
                        >
                            <FaCheck className="w-3 h-3" />
                            Aprovar
                        </button>
                        <button
                            onClick={() => openConfirm('rejeitar', ev)}
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
        data: eventos,
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
                {/* ── Tabela de Pendentes ── */}
                <Card extra="w-full h-full p-4 sm:p-6 overflow-x-auto">
                    <header className="relative flex flex-col gap-4 sm:flex-row sm:items-center justify-between pt-2 sm:pt-4">
                        <div className="text-lg sm:text-xl font-bold text-navy-700">
                            Eventos Pendentes de Aprovação
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({eventos.length})
                            </span>
                        </div>
                        <div className="w-full sm:w-72">
                            <input
                                type="text"
                                placeholder="Pesquisar evento ou organizador..."
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
                                onClick={() => { setError(null); fetchEventosPendentes(); }}
                                className="ml-3 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs flex-shrink-0"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    )}

                    {eventos.length === 0 && !error ? (
                        <div className="mt-8 text-center py-12 bg-gray-50 rounded-lg">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaCheck className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum evento pendente</h3>
                            <p className="text-gray-500">Todos os eventos foram processados.</p>
                        </div>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full min-w-[1100px]">
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

                {/* ── Tabela de Rejeitados ── */}
                <EventosRejeitados
                    key={refreshRejeitados}
                    onReanalisarSuccess={() => {
                        // Quando um rejeitado volta a pendente, refresca a tabela de pendentes
                        fetchEventosPendentes();
                    }}
                />
            </div>

            {/* Modal de Documento */}
            {docModal.open && (
                <DocumentoModal
                    url={docModal.url}
                    nome={docModal.nome}
                    loading={docModal.loading}
                    onClose={() => setDocModal({ open: false, url: null, nome: null, loading: false })}
                />
            )}

            {/* Modal de Detalhe do Evento */}
            {detalheModal.open && (
                <EventoDetalheModal
                    evento={detalheModal.evento}
                    onClose={() => setDetalheModal({ open: false, evento: null })}
                />
            )}

            {/* Modal de Confirmação */}
            {confirmModal.open && (
                <ConfirmModal
                    type={confirmModal.type}
                    evento={confirmModal.evento}
                    onConfirm={handleConfirmAction}
                    onCancel={closeConfirm}
                    isProcessing={processingId === confirmModal.evento?.id}
                />
            )}
        </>
    );
};

export default EventosPendentes;