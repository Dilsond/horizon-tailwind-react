import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FaCheck, FaTimes, FaHeart, FaHeartBroken, FaMapMarkerAlt, FaCalendarAlt, FaClock, FaUser, FaBuilding, FaArrowLeft, FaEye } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import Card from 'components/card';
import NFt3 from "assets/img/nfts/Nft3.png";
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

// ─── Modal de Likes (portal) ──────────────────────────────────────────────────
const LikesModal = ({ isOpen, onClose, eventoId, likeCount }) => {
    const [likes, setLikes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && eventoId) fetchLikes();
    }, [isOpen, eventoId]);

    const fetchLikes = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('favoritos_eventos')
                .select(`
                    id,
                    created_at,
                    usuario_normal:usuarios_normais (
                        id,
                        nome_completo,
                        nome_utilizador,
                        foto
                    ),
                    administrador:administradores (
                        id,
                        nome,
                        email,
                        avatar_url
                    ),
                    organizador:organizadores (
                        id,
                        nome_empresa,
                        email_empresa
                    )
                `)
                .eq('evento_id', eventoId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formatados = data.map(like => {
                if (like.usuario_normal) {
                    return {
                        id: like.id,
                        nome: like.usuario_normal.nome_completo,
                        username: like.usuario_normal.nome_utilizador,
                        foto: like.usuario_normal.foto,
                        tipo: 'Usuário',
                        data: like.created_at,
                    };
                }
                if (like.administrador) {
                    return {
                        id: like.id,
                        nome: like.administrador.nome,
                        email: like.administrador.email,
                        foto: like.administrador.avatar_url,
                        tipo: 'Administrador',
                        data: like.created_at,
                    };
                }
                if (like.organizador) {
                    return {
                        id: like.id,
                        nome: like.organizador.nome_empresa,
                        email: like.organizador.email_empresa,
                        tipo: 'Organizador',
                        data: like.created_at,
                    };
                }
                return null;
            }).filter(Boolean);

            setLikes(formatados);
        } catch (err) {
            console.error('Erro ao buscar likes:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <FaHeart className="text-red-500" />
                        <h3 className="text-base font-semibold text-navy-700">
                            Pessoas que curtiram
                            <span className="ml-1.5 text-sm font-normal text-gray-400">({likeCount})</span>
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Lista */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <SyncLoader color="#1B254B" size={10} />
                        </div>
                    ) : likes.length === 0 ? (
                        <div className="text-center py-10">
                            <FaHeartBroken className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">Ninguém curtiu este evento ainda</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {likes.map((like) => (
                                <div
                                    key={like.id}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold flex-shrink-0 overflow-hidden">
                                        {like.foto ? (
                                            <img
                                                src={like.foto}
                                                alt={like.nome}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <span>{like.nome?.charAt(0).toUpperCase() || 'U'}</span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-navy-700 truncate">
                                            {like.nome}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">
                                            {like.username
                                                ? `@${like.username}`
                                                : like.email || ''}{' '}
                                            •{' '}
                                            <span className="text-navy-500 font-medium">{like.tipo}</span>
                                        </p>
                                    </div>

                                    {/* Data */}
                                    <p className="text-xs text-gray-400 flex-shrink-0 text-right">
                                        {formatDate(like.data)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

// ─── Modal de confirmação de apagar ──────────────────────────────────────────
const DeleteModal = ({ onConfirm, onCancel, isProcessing }) =>
    createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaTimes className="text-red-600 w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-navy-700 text-center mb-2">Apagar Evento</h3>
                <p className="text-sm text-gray-500 text-center mb-6">
                    Tem certeza que deseja apagar este evento? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : 'Apagar'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );

// ─── Card de Evento Relacionado ───────────────────────────────────────────────
const EventoRelacionadoCard = ({ evento, onClick }) => (
    <Card
        extra="flex flex-col w-full h-full !p-4 bg-white cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
        onClick={onClick}
    >
        <div className="h-full w-full">
            <div className="relative w-full overflow-hidden rounded-xl">
                <img
                    src={evento.imagem_url || NFt3}
                    alt={evento.nome_evento}
                    className="h-48 w-full object-cover transition-transform duration-300 hover:scale-110"
                    onError={(e) => { e.target.src = NFt3; }}
                />
            </div>

            <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-gray-200">
                        <img
                            src={evento.imagem_url || NFt3}
                            className="h-full w-full object-cover"
                            alt={evento.organizador_nome}
                            onError={(e) => { e.target.src = NFt3; }}
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-600">Organizador</p>
                        <p className="truncate text-base font-bold text-navy-700 dark:text-white">
                            {evento.organizador_nome}
                        </p>
                    </div>
                </div>

                <div>
                    <p className="text-sm font-medium text-gray-600">Nome do Evento</p>
                    <p className="text-base font-semibold text-navy-700 dark:text-white line-clamp-2">
                        {evento.nome_evento}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <FaHeart className="text-red-400 w-4 h-4" />
                    <span className="text-sm font-medium text-gray-600">
                        {evento.interessados || 0} interessados
                    </span>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <p className="text-lg font-bold text-navy-700 dark:text-white">
                        {evento.valor
                            ? new Intl.NumberFormat('pt-AO', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                            }).format(evento.valor) + ' Kz'
                            : 'Grátis'}
                    </p>
                </div>
            </div>
        </div>
    </Card>
);

// ─── Componente Principal ─────────────────────────────────────────────────────
const DetalhesEvento = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [evento, setEvento] = useState(null);
    const [eventosRelacionados, setEventosRelacionados] = useState([]);
    const [mediaPrincipal, setMediaPrincipal] = useState(null);
    const [tipoMedia, setTipoMedia] = useState('imagem');
    const [mediaList, setMediaList] = useState([]);
    const [likeCount, setLikeCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);

    // Modais
    const [likesModalOpen, setLikesModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [imgModalOpen, setImgModalOpen] = useState(false);

    useEffect(() => {
        const userFromStorage = localStorage.getItem('admin');
        if (userFromStorage) setCurrentUser(JSON.parse(userFromStorage));
    }, []);

    // Re-fetch e scroll ao topo sempre que o id da URL muda
    useEffect(() => {
        if (!id) return;
        setEvento(null);
        setEventosRelacionados([]);
        setLikeCount(0);
        setMediaList([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        fetchEvento(id);
    }, [id]);

    const fetchEvento = async (eventoId) => {
        try {
            setLoading(true);

            const { data: ev, error } = await supabase
                .from('eventos')
                .select('*')
                .eq('id', eventoId)
                .is('deleted_at', null)
                .single();

            if (error) throw error;

            const { data: organizador } = await supabase
                .from('organizadores')
                .select('*')
                .eq('id', ev.organizador_id)
                .single();

            const { count } = await supabase
                .from('favoritos_eventos')
                .select('*', { count: 'exact', head: true })
                .eq('evento_id', eventoId);

            setLikeCount(count || 0);

            // Mídias
            const medias = [];
            if (ev.imagem_url) medias.push({ url: ev.imagem_url, tipo: 'imagem' });
            if (ev.video_url) medias.push({ url: ev.video_url, tipo: 'video' });
            setMediaList(medias);
            setMediaPrincipal(ev.imagem_url || NFt3);
            setTipoMedia('imagem');

            setEvento({ ...ev, organizador });

            await fetchEventosRelacionados(ev.categoria, eventoId);
        } catch (err) {
            console.error('Erro ao buscar evento:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEventosRelacionados = async (categoria, eventoId) => {
        try {
            const { data } = await supabase
                .from('eventos')
                .select('*')
                .eq('categoria', categoria)
                .neq('id', eventoId)
                .is('deleted_at', null)
                .limit(4);

            if (!data) return;

            const comOrg = await Promise.all(
                data.map(async (ev) => {
                    const { data: org } = await supabase
                        .from('organizadores')
                        .select('nome_empresa')
                        .eq('id', ev.organizador_id)
                        .single();

                    const { count } = await supabase
                        .from('favoritos_eventos')
                        .select('*', { count: 'exact', head: true })
                        .eq('evento_id', ev.id);

                    return {
                        ...ev,
                        organizador_nome: org?.nome_empresa || 'Organizador',
                        interessados: count || 0,
                    };
                })
            );
            setEventosRelacionados(comOrg);
        } catch (err) {
            console.error('Erro ao buscar eventos relacionados:', err);
        }
    };

    // Trocar para evento relacionado — muda URL, o useEffect [id] trata o resto
    const handleEventoRelacionadoClick = (eventoId) => {
        if (eventoId === id) return;
        navigate(`/admin/evento/${eventoId}`);
    };

    const deletarEvento = async () => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('eventos')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            setDeleteModalOpen(false);
            navigate(-1);
        } catch (err) {
            console.error('Erro ao deletar evento:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const trocarMediaPrincipal = (url, tipo) => {
        setMediaPrincipal(url);
        setTipoMedia(tipo);
    };

    const formatDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });

    const getCategoryLabel = (cat) => ({
        palestra: 'Palestra',
        workshop: 'Workshop',
        feiras: 'Feira',
        masterclasse: 'Masterclasse',
    }[cat] || cat);

    const getStatusBadge = (ev) => {
        if (ev.deleted_at) return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">Cancelado</span>;
        if (new Date(ev.data_evento) < new Date()) return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">Finalizado</span>;
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">A decorrer</span>;
    };

    if (loading) {
        return (
            <LoaderContainer>
                <SyncLoader color="#1B254B" size={15} />
            </LoaderContainer>
        );
    }

    if (!evento) {
        return (
            <div className="mt-10 text-center text-gray-500 p-4">
                <p className="mb-4">Evento não encontrado</p>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mx-auto"
                >
                    <FaArrowLeft /> Voltar
                </button>
            </div>
        );
    }

    return (
        <div className="p-4">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 mt-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
                <FaArrowLeft /> Voltar
            </button>

            <Card extra="w-full h-full sm:overflow-auto p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Coluna Esquerda — Média */}
                    <div className="w-full md:w-1/2">
                        {tipoMedia === 'imagem' ? (
                            <img
                                src={mediaPrincipal}
                                alt={evento.nome_evento}
                                className="w-full h-96 object-cover rounded-lg cursor-pointer"
                                onClick={() => setImgModalOpen(true)}
                                onError={(e) => { e.target.src = NFt3; }}
                            />
                        ) : (
                            <div className="relative w-full h-96">
                                <video
                                    src={mediaPrincipal}
                                    controls
                                    autoPlay
                                    className="w-full h-full object-cover rounded-lg"
                                >
                                    Seu navegador não suporta o elemento de vídeo.
                                </video>
                            </div>
                        )}

                        {mediaList.length > 0 && (
                            <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                {mediaList.map((media, index) => (
                                    <div
                                        key={index}
                                        className={`relative w-full aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                            mediaPrincipal === media.url
                                                ? 'border-navy-500 ring-2 ring-navy-200'
                                                : 'border-transparent hover:border-gray-300'
                                        }`}
                                        onClick={() => trocarMediaPrincipal(media.url, media.tipo)}
                                    >
                                        {media.tipo === 'imagem' ? (
                                            <img
                                                src={media.url}
                                                alt={`Mídia ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.src = NFt3; }}
                                            />
                                        ) : (
                                            <>
                                                <video
                                                    src={media.url}
                                                    className="w-full h-full object-cover"
                                                    preload="metadata"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                                    <svg className="w-8 h-8 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M6.3 2.8L16 10 6.3 17.2V2.8z" />
                                                    </svg>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Coluna Direita — Informações */}
                    <div className="w-full md:w-1/2">
                        {/* Organizador + likes */}
                        <div className="mb-4">
                            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                                <div
                                    className="cursor-pointer"
                                    onClick={() => navigate(`/admin/perfilempresa/${evento.organizador?.id}`)}
                                >
                                    <div className="w-12 h-12 rounded-full bg-navy-700 flex items-center justify-center text-white text-xl font-bold">
                                        {evento.organizador?.nome_empresa?.charAt(0) || 'O'}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p
                                        className="font-medium text-xl cursor-pointer hover:text-blue-500 transition-colors"
                                        onClick={() => navigate(`/admin/perfilempresa/${evento.organizador?.id}`)}
                                    >
                                        {evento.organizador?.nome_empresa || 'Organizador'}
                                    </p>
                                    <p className="text-sm text-gray-500">Organizador</p>
                                </div>

                                {/* Botão ver likes */}
                                <button
                                    onClick={() => setLikesModalOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
                                    title="Ver quem curtiu"
                                >
                                    <FaHeart className="text-red-400 w-4 h-4" />
                                    <span className="text-sm font-semibold">{likeCount}</span>
                                    <FaEye className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-navy-700 dark:text-white mb-3">
                            {evento.nome_evento}
                        </h1>

                        <p className="text-gray-600 text-justify mb-4">
                            {evento.descricao || 'Sem descrição disponível'}
                        </p>

                        <div className="mb-4">{getStatusBadge(evento)}</div>

                        <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-2 text-gray-600">
                                <FaCalendarAlt className="text-navy-500" />
                                <span>{formatDate(evento.data_evento)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <FaClock className="text-navy-500" />
                                <span>{evento.hora_evento?.slice(0, 5)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <FaMapMarkerAlt className="text-navy-500" />
                                <span>{evento.local || 'Local não informado'}</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <p className="text-gray-600 mb-2">
                                <strong>Categoria:</strong> {getCategoryLabel(evento.categoria)}
                            </p>
                            <p className="text-gray-600 mb-2">
                                <strong>Tipo:</strong>{' '}
                                {evento.tipo_evento === 'presencial' ? 'Presencial'
                                    : evento.tipo_evento === 'online' ? 'Online'
                                    : 'Híbrido'}
                            </p>
                            <p className="text-gray-600">
                                <strong>Contacto:</strong> {evento.contacto_whatsapp || 'Não informado'}
                            </p>
                        </div>

                        <div className="mb-4">
                            <p className="text-2xl font-bold text-navy-700">
                                {evento.valor
                                    ? new Intl.NumberFormat('pt-AO', {
                                        style: 'currency',
                                        currency: 'AOA',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                    }).format(evento.valor)
                                    : 'Grátis'}
                            </p>
                        </div>

                        <button
                            onClick={() => setDeleteModalOpen(true)}
                            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Apagar Evento
                        </button>
                    </div>
                </div>
            </Card>

            {/* Eventos Relacionados */}
            {eventosRelacionados.length > 0 && (
                <>
                    <div className="relative flex items-center justify-between pt-8 pb-4">
                        <div className="text-2xl font-bold text-navy-700 dark:text-white">
                            Eventos Relacionados
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                        {eventosRelacionados.map((ev) => (
                            <EventoRelacionadoCard
                                key={ev.id}
                                evento={ev}
                                onClick={() => handleEventoRelacionadoClick(ev.id)}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Modal imagem ampliada */}
            {imgModalOpen && createPortal(
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] p-4 cursor-zoom-out"
                    onClick={() => setImgModalOpen(false)}
                >
                    <img
                        src={mediaPrincipal}
                        alt="Visualização ampliada"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                        onClick={() => setImgModalOpen(false)}
                    >
                        <FaTimes />
                    </button>
                </div>,
                document.body
            )}

            {/* Modal de Likes */}
            <LikesModal
                isOpen={likesModalOpen}
                onClose={() => setLikesModalOpen(false)}
                eventoId={id}
                likeCount={likeCount}
            />

            {/* Modal de apagar */}
            {deleteModalOpen && (
                <DeleteModal
                    onConfirm={deletarEvento}
                    onCancel={() => setDeleteModalOpen(false)}
                    isProcessing={isDeleting}
                />
            )}
        </div>
    );
};

export default DetalhesEvento;