import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaHeart, FaHeartBroken, FaMapMarkerAlt, FaCalendarAlt, FaClock, FaUser, FaBuilding, FaArrowLeft, FaEye } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import Card from 'components/card';
import avatar1 from "assets/img/avatars/avatar1.png";
import avatar2 from "assets/img/avatars/avatar2.png";
import avatar3 from "assets/img/avatars/avatar3.png";
import NFt3 from "assets/img/nfts/Nft3.png";
import { SyncLoader } from 'react-spinners';
import styled from 'styled-components';
import Modal from 'react-modal';
import { supabase } from '../../../lib/supabase.ts';

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '90%',
        maxHeight: '90%',
        padding: 0,
        border: 'none',
        background: 'transparent',
        overflow: 'hidden'
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 1000
    }
};

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.0); 
`;

Modal.setAppElement('#root');

// Componente Modal de Likes
const LikesModal = ({ isOpen, onClose, eventoId, likeCount }) => {
    const [likes, setLikes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && eventoId) {
            fetchLikes();
        }
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

            const likesFormatados = data.map(like => {
                if (like.usuario_normal) {
                    return {
                        id: like.id,
                        nome: like.usuario_normal.nome_completo,
                        username: like.usuario_normal.nome_utilizador,
                        foto: like.usuario_normal.foto,
                        tipo: 'Usuário',
                        data: like.created_at
                    };
                } else if (like.administrador) {
                    return {
                        id: like.id,
                        nome: like.administrador.nome,
                        email: like.administrador.email,
                        foto: like.administrador.avatar_url,
                        tipo: 'Administrador',
                        data: like.created_at
                    };
                } else if (like.organizador) {
                    return {
                        id: like.id,
                        nome: like.organizador.nome_empresa,
                        email: like.organizador.email_empresa,
                        tipo: 'Organizador',
                        data: like.created_at
                    };
                }
                return null;
            }).filter(like => like !== null);

            setLikes(likesFormatados);
        } catch (error) {
            console.error('Erro ao buscar likes:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            style={{
                content: {
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    marginRight: '-50%',
                    transform: 'translate(-50%, -50%)',
                    maxWidth: '500px',
                    width: '90%',
                    maxHeight: '80vh',
                    padding: '0',
                    borderRadius: '12px',
                    overflow: 'hidden'
                },
                overlay: {
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    zIndex: 1000
                }
            }}
            contentLabel="Pessoas que curtiram"
        >
            <div className="bg-white rounded-lg">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-navy-700">
                        Pessoas que curtiram ({likeCount})
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                        </div>
                    ) : likes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Ninguém curtiu este evento ainda
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {likes.map((like) => (
                                <div key={like.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold flex-shrink-0 overflow-hidden">
                                        {like.foto ? (
                                            <img
                                                src={like.foto}
                                                alt={like.nome}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <span>{like.nome?.charAt(0).toUpperCase() || 'U'}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-navy-700 truncate">
                                            {like.nome}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {like.username || like.email || ''} • {like.tipo}
                                        </p>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {formatDate(like.data)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

// Componente Card de Evento Relacionado
const EventoRelacionadoCard = ({ evento, onClick }) => {
    return (
        <Card
            extra={`flex flex-col w-full h-full !p-4 3xl:p-![18px] bg-white cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}
            onClick={onClick}
        >
            <div className="h-full w-full">
                <div className="relative w-full overflow-hidden rounded-xl">
                    <img
                        src={evento.imagem_url || NFt3}
                        alt={evento.nome_evento}
                        className="h-48 w-full object-cover transition-transform duration-300 hover:scale-110"
                        onError={(e) => {
                            e.target.src = NFt3;
                        }}
                    />
                </div>

                <div className="mt-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-gray-200">
                            <img
                                src={evento.imagem_url || NFt3}
                                className="h-full w-full object-cover"
                                alt={evento.organizador_nome}
                                onError={(e) => {
                                    e.target.src = NFt3;
                                }}
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-600">
                                Organizador
                            </p>
                            <p className="truncate text-base font-bold text-navy-700 dark:text-white">
                                {evento.organizador_nome}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-600">
                            Nome do Evento
                        </p>
                        <p className="text-base font-semibold text-navy-700 dark:text-white line-clamp-2">
                            {evento.nome_evento}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-600">
                            {evento.interessados || 0} interessados
                        </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <p className="text-lg font-bold text-brand-500 dark:text-white">
                            {evento.valor
                                ? new Intl.NumberFormat('pt-AO', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(evento.valor) + ' Kz'
                                : 'Grátis'
                            }
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

const DetalhesEvento = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [evento, setEvento] = useState(null);
    const [eventosRelacionados, setEventosRelacionados] = useState([]);
    const [mediaPrincipal, setMediaPrincipal] = useState(null);
    const [tipoMedia, setTipoMedia] = useState('imagem');
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);
    const [mediaList, setMediaList] = useState([]);
    const [likesModalOpen, setLikesModalOpen] = useState(false);

    useEffect(() => {
        const userFromStorage = localStorage.getItem('admin');
        if (userFromStorage) {
            setCurrentUser(JSON.parse(userFromStorage));
        }

        if (id) {
            fetchEvento();
        }
    }, [id]);

    const fetchEvento = async () => {
        try {
            setLoading(true);

            const { data: evento, error } = await supabase
                .from('eventos')
                .select('*')
                .eq('id', id)
                .is('deleted_at', null)
                .single();

            if (error) throw error;

            const { data: organizador } = await supabase
                .from('organizadores')
                .select('*')
                .eq('id', evento.organizador_id)
                .single();

            const { count } = await supabase
                .from('favoritos_eventos')
                .select('*', { count: 'exact', head: true })
                .eq('evento_id', id);

            setLikeCount(count || 0);

            if (currentUser) {
                const { data: userLike } = await supabase
                    .from('favoritos_eventos')
                    .select('id')
                    .eq('evento_id', id)
                    .eq(currentUser.type === 'admin' ? 'administrador_id' : 'usuario_normal_id', currentUser.id)
                    .maybeSingle();

                setIsLiked(!!userLike);
            }

            await fetchEventosRelacionados(evento.categoria, evento.id);

            // Criar lista unificada de mídias
            const medias = [];

            if (evento.imagem_url) {
                medias.push({
                    url: evento.imagem_url,
                    tipo: 'imagem'
                });
            }

            if (evento.video_url) {
                medias.push({
                    url: evento.video_url,
                    tipo: 'video'
                });
            }

            setMediaList(medias);

            const eventoCompleto = {
                ...evento,
                organizador: organizador,
            };

            setEvento(eventoCompleto);
            setMediaPrincipal(evento.imagem_url || NFt3);

        } catch (error) {
            console.error('Erro ao buscar evento:', error);
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

            if (data) {
                const eventosComOrganizadores = await Promise.all(
                    data.map(async (ev) => {
                        const { data: org } = await supabase
                            .from('organizadores')
                            .select('nome_empresa')
                            .eq('id', ev.organizador_id)
                            .single();

                        return {
                            ...ev,
                            organizador_nome: org?.nome_empresa || 'Organizador',
                            interessados: await getEventoInteressados(ev.id)
                        };
                    })
                );
                setEventosRelacionados(eventosComOrganizadores);
            }
        } catch (error) {
            console.error('Erro ao buscar eventos relacionados:', error);
        }
    };

    const getEventoInteressados = async (eventoId) => {
        try {
            const { count } = await supabase
                .from('favoritos_eventos')
                .select('*', { count: 'exact', head: true })
                .eq('evento_id', eventoId);
            return count || 0;
        } catch {
            return 0;
        }
    };

    const handleLikeToggle = async () => {
        if (!currentUser) {
            alert('Faça login para interagir');
            return;
        }

        try {
            if (isLiked) {
                let query = supabase
                    .from('favoritos_eventos')
                    .delete()
                    .eq('evento_id', id);

                if (currentUser.type === 'admin') {
                    query = query.eq('administrador_id', currentUser.id);
                } else {
                    query = query.eq('usuario_normal_id', currentUser.id);
                }

                await query;
                setIsLiked(false);
                setLikeCount(prev => prev - 1);
            } else {
                const insertData = {
                    evento_id: id,
                    created_at: new Date().toISOString()
                };

                if (currentUser.type === 'admin') {
                    insertData.administrador_id = currentUser.id;
                } else {
                    insertData.usuario_normal_id = currentUser.id;
                }

                await supabase
                    .from('favoritos_eventos')
                    .insert(insertData);

                setIsLiked(true);
                setLikeCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Erro ao alternar like:', error);
        }
    };

    const handleVerLikes = () => {
        setLikesModalOpen(true);
    };

    const deletarEvento = async () => {
        const confirmacao = window.confirm("Tem certeza que deseja deletar este evento?");

        if (confirmacao) {
            try {
                const { error } = await supabase
                    .from('eventos')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', id);

                if (error) throw error;

                alert("Evento deletado com sucesso!");
                navigate(-1);
            } catch (error) {
                console.error('Erro ao deletar evento:', error);
                alert("Erro ao deletar o evento.");
            }
        }
    };

    const openModal = () => setModalIsOpen(true);
    const closeModal = () => setModalIsOpen(false);

    const trocarMediaPrincipal = (novaMedia, tipo) => {
        setMediaPrincipal(novaMedia);
        setTipoMedia(tipo);
    };

    const handleOrganizadorClick = (organizadorId) => {
        navigate(`/admin/organizador/${organizadorId}`);
    };

    const handleEventoClick = (eventoId) => {
        setLoading(true);
        navigate(`/admin/evento/${eventoId}`, { replace: true });
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const getCategoryLabel = (category) => {
        const labels = {
            palestra: 'Palestra',
            workshop: 'Workshop',
            feiras: 'Feira',
            masterclasse: 'Masterclasse'
        };
        return labels[category] || category;
    };

    const getStatusBadge = (evento) => {
        if (evento.deleted_at) {
            return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">Cancelado</span>;
        }

        const hoje = new Date();
        const dataEvento = new Date(evento.data_evento);

        if (dataEvento < hoje) {
            return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">Finalizado</span>;
        }

        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">A decorrer</span>;
    };

    if (loading) {
        return (
            <LoaderContainer>
                <SyncLoader color="#3B82F6" size={15} />
            </LoaderContainer>
        );
    }

    if (!evento) {
        return (
            <div className="mt-10 text-center text-gray-500">
                Evento não encontrado <span onClick={() => navigate(-1)} className="flex items-center cursor-pointer gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors" ><FaArrowLeft /> Voltar</span>
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
                    {/* Coluna da Esquerda - Mídia */}
                    <div className="w-full md:w-1/2">
                        {tipoMedia === 'imagem' ? (
                            <img
                                src={mediaPrincipal}
                                alt={evento.nome_evento}
                                className="w-full h-96 object-cover rounded-lg cursor-pointer"
                                onClick={openModal}
                                onError={(e) => {
                                    e.target.src = NFt3;
                                }}
                            />
                        ) : (
                            <div className="relative w-full h-96">
                                <video
                                    src={mediaPrincipal}
                                    controls
                                    autoPlay
                                    className="w-full h-full object-cover rounded-lg"
                                    onClick={(e) => e.preventDefault()}
                                >
                                    Seu navegador não suporta o elemento de vídeo.
                                </video>
                            </div>
                        )}

                        {/* Lista unificada de mídias */}
                        {mediaList.length > 0 && (
                            <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                {mediaList.map((media, index) => (
                                    <div
                                        key={index}
                                        className={`relative w-full aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${mediaPrincipal === media.url
                                                ? 'border-brand-500 ring-2 ring-brand-200'
                                                : 'border-transparent hover:border-gray-300'
                                            }`}
                                        onClick={() => trocarMediaPrincipal(media.url, media.tipo)}
                                    >
                                        {media.tipo === 'imagem' ? (
                                            <img
                                                src={media.url}
                                                alt={`Mídia ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.src = NFt3;
                                                }}
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

                    {/* Coluna da Direita - Informações */}
                    <div className="w-full md:w-1/2">
                        <div className="mb-4">
                            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                                <div
                                    className="cursor-pointer"
                                    onClick={() => navigate(`/admin/perfilempresa/${evento.organizador?.id}`)}
                                >
                                    <div className="w-12 h-12 rounded-full bg-navy-500 flex items-center justify-center text-white text-xl font-bold">
                                        {evento.organizador?.nome_empresa?.charAt(0) || 'O'}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p
                                        className="font-medium text-xl cursor-pointer hover:text-blue-500"
                                        onClick={() => navigate(`/admin/perfilempresa/${evento.organizador?.id}`)}
                                    >
                                        {evento.organizador?.nome_empresa || 'Organizador'}
                                    </p>
                                    <p className="text-sm text-gray-500">Organizador</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center">
                                        <button
                                            onClick={handleLikeToggle}
                                            className={`p-2 rounded-full transition-colors ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                                                }`}
                                        >
                                            {isLiked ? <FaHeart size={24} /> : <FaHeartBroken size={24} />}
                                        </button>
                                        <button
                                            onClick={handleVerLikes}
                                            className="ml-1 text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1"
                                            title="Ver quem curtiu"
                                        >
                                            <span>{likeCount}</span>
                                            <FaEye size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-3xl font-bold text-navy-700 dark:text-white">
                                {evento.nome_evento}
                            </h1>
                        </div>

                        <p className="text-gray-600 text-justify mb-4">
                            {evento.descricao || 'Sem descrição disponível'}
                        </p>

                        <div className="flex items-center justify-between mb-4">{getStatusBadge(evento)}</div>

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
                                <strong>Tipo:</strong> {evento.tipo_evento === 'presencial' ? 'Presencial' :
                                    evento.tipo_evento === 'online' ? 'Online' : 'Híbrido'}
                            </p>
                            <p className="text-gray-600">
                                <strong>Contacto:</strong> {evento.contacto_whatsapp || 'Não informado'}
                            </p>
                        </div>

                        <div className="mb-4">
                            <p className="text-2xl font-bold text-navy-500">
                                {evento.valor
                                    ? new Intl.NumberFormat('pt-AO', {
                                        style: 'currency',
                                        currency: 'AOA',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(evento.valor)
                                    : 'Grátis'
                                }
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
                                onClick={deletarEvento}
                            >
                                Apagar Evento
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            {eventosRelacionados.length > 0 && (
                <>
                    <div className="relative flex items-center justify-between pt-8 pb-4">
                        <div className="text-2xl font-bold text-navy-700 dark:text-white">
                            Eventos Relacionados
                        </div>
                    </div>

                    <div className="z-20 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                        {eventosRelacionados.map((ev) => (
                            <EventoRelacionadoCard
                                key={ev.id}
                                evento={ev}
                                onClick={() => handleEventoClick(ev.id)}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Modal de visualização ampliada */}
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                style={customStyles}
                contentLabel="Mídia em tamanho grande"
            >
                {tipoMedia === 'imagem' ? (
                    <img
                        src={mediaPrincipal}
                        alt="Visualização ampliada"
                        className="max-w-full max-h-screen cursor-pointer"
                        onClick={closeModal}
                    />
                ) : (
                    <video
                        src={mediaPrincipal}
                        controls
                        autoPlay
                        className="max-w-full max-h-screen"
                    />
                )}
            </Modal>

            {/* Modal de Likes */}
            <LikesModal
                isOpen={likesModalOpen}
                onClose={() => setLikesModalOpen(false)}
                eventoId={id}
                likeCount={likeCount}
            />
        </div>
    );
};

export default DetalhesEvento;