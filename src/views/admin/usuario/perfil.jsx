import React, { useState, useEffect } from 'react';
import { FaUser, FaEdit, FaLock, FaSave, FaTimes, FaCheck, FaTrash, FaArrowLeft, FaHeart } from 'react-icons/fa';
import Card from 'components/card';
import banner from "assets/img/profile/banner.png";
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase.ts';

const PerfilUsuario = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [usuario, setUsuario] = useState(null);
    const [favoritos, setFavoritos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingFavoritos, setLoadingFavoritos] = useState(true);
    const [error, setError] = useState(null);
    const [editando, setEditando] = useState(false);
    const [formData, setFormData] = useState({});
    const [status, setStatus] = useState({ ativo: true });

    useEffect(() => {
        if (id) {
            fetchUsuario();
            fetchFavoritos();
        }
    }, [id]);

    const fetchUsuario = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('usuarios_normais')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            setUsuario(data);
            setFormData({
                nome_completo: data.nome_completo || '',
                nome_utilizador: data.nome_utilizador || '',
                email: data.email || '',
                foto: data.foto || 'https://bonnierpublications.com/app/uploads/2022/05/digitalfoto.jpg',
            });
            setStatus({ ativo: !data.deleted_at });

        } catch (err) {
            console.error('Erro ao buscar usuário:', err);
            setError('Usuário não encontrado');
        } finally {
            setLoading(false);
        }
    };

    const fetchFavoritos = async () => {
        try {
            setLoadingFavoritos(true);
            console.log('🔍 Buscando favoritos para usuário:', id);

            // Buscar IDs dos eventos favoritados
            const { data: favoritosData, error: favError } = await supabase
                .from('favoritos_eventos')
                .select('evento_id')
                .eq('usuario_normal_id', id);

            if (favError) {
                console.error('❌ Erro ao buscar favoritos:', favError);
                throw favError;
            }

            console.log('📦 Favoritos encontrados:', favoritosData);

            if (!favoritosData || favoritosData.length === 0) {
                console.log('ℹ️ Nenhum favorito encontrado');
                setFavoritos([]);
                return;
            }

            const eventoIds = favoritosData.map(f => f.evento_id);
            console.log('🎯 IDs dos eventos:', eventoIds);

            // Buscar eventos SEM o join complexo
            const { data: eventos, error: eventosError } = await supabase
                .from('eventos')
                .select('*')
                .in('id', eventoIds)
                .is('deleted_at', null);

            if (eventosError) {
                console.error('❌ Erro ao buscar detalhes dos eventos:', eventosError);
                throw eventosError;
            }

            console.log('📦 Eventos encontrados:', eventos);

            if (!eventos || eventos.length === 0) {
                console.log('ℹ️ Nenhum evento válido encontrado');
                setFavoritos([]);
                return;
            }

            // Para cada evento, buscar organizador e likes separadamente
            const eventosCompletos = await Promise.all(
                eventos.map(async (evento) => {
                    try {
                        // Buscar organizador pelo ID
                        const { data: organizador, error: orgError } = await supabase
                            .from('organizadores')
                            .select('nome_empresa')
                            .eq('id', evento.organizador_id)
                            .maybeSingle();

                        if (orgError) {
                            console.warn(`⚠️ Erro ao buscar organizador para evento ${evento.id}:`, orgError);
                        }

                        // Buscar contagem de likes
                        const { count, error: countError } = await supabase
                            .from('favoritos_eventos')
                            .select('*', { count: 'exact', head: true })
                            .eq('evento_id', evento.id);

                        if (countError) {
                            console.warn(`⚠️ Erro ao buscar likes para evento ${evento.id}:`, countError);
                        }

                        return {
                            id: evento.id,
                            nome: evento.nome_evento,
                            descricao: evento.descricao || 'Sem descrição',
                            categoria: evento.categoria,
                            data: evento.data_evento,
                            hora: evento.hora_evento ? evento.hora_evento.slice(0, 5) : '',
                            tipo: evento.tipo_evento,
                            local: evento.local || 'Local não informado',
                            imagem: evento.imagem_url || 'https://via.placeholder.com/300x200?text=Sem+Imagem',
                            organizador: organizador?.nome_empresa || 'Organizador não identificado',
                            likes: count || 0
                        };
                    } catch (err) {
                        console.warn(`⚠️ Erro ao processar evento ${evento.id}:`, err);
                        return null;
                    }
                })
            );

            // Filtrar eventos que falharam (null)
            const eventosValidos = eventosCompletos.filter(e => e !== null);
            console.log('✅ Eventos processados com sucesso:', eventosValidos.length);

            setFavoritos(eventosValidos);

        } catch (err) {
            console.error('❌ Erro inesperado em fetchFavoritos:', err);
            setFavoritos([]);
        } finally {
            setLoadingFavoritos(false);
        }
    };

    const salvarPerfil = async () => {
        try {
            const { error } = await supabase
                .from('usuarios_normais')
                .update({
                    nome_completo: formData.nome_completo,
                    nome_utilizador: formData.nome_utilizador,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            setUsuario({ ...usuario, ...formData });
            setEditando(false);
            // alert('Perfil atualizado com sucesso!');
        } catch (err) {
            console.error('Erro ao atualizar perfil:', err);
            // alert('Erro ao atualizar perfil');
        }
    };

    const handleStatusConta = async (novoStatus) => {
        try {
            const updateData = {};

            if (novoStatus === 'ativo') {
                updateData.deleted_at = null;
            } else {
                updateData.deleted_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from('usuarios_normais')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            setStatus({ ativo: novoStatus === 'ativo' });
            setUsuario({ ...usuario, ...updateData });

            // alert(`Conta ${novoStatus === 'ativo' ? 'ativada' : 'suspensa'} com sucesso!`);
        } catch (err) {
            console.error('Erro ao alterar status:', err);
            alert('Erro ao alterar status da conta');
        }
    };

    const handleFotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione uma imagem válida');
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                alert('A imagem deve ter no máximo 2MB');
                return;
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('user-avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('user-avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('usuarios_normais')
                .update({ foto: publicUrl })
                .eq('id', id);

            if (updateError) throw updateError;

            setFormData({ ...formData, foto: publicUrl });
            setUsuario({ ...usuario, foto: publicUrl });

        } catch (err) {
            console.error('Erro ao fazer upload:', err);
            alert('Erro ao atualizar foto');
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

    const getCategoryLabel = (category) => {
        const labels = {
            palestra: 'Palestra',
            workshop: 'Workshop',
            feiras: 'Feira',
            masterclasse: 'Masterclasse'
        };
        return labels[category] || category;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    if (error || !usuario) {
        return (
            <div className="text-center text-red-500 p-8">
                {error || 'Usuário não encontrado'}
            </div>
        );
    }

    const handleEventoClick = (eventoId) => {
        navigate(`/admin/detalhes/${eventoId}`);
    };

    return (
        <div>
            {/* Botão Voltar */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 mt-5 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
                <FaArrowLeft /> Voltar para Lista de Usuários
            </button>

            <div className='mb-10 grid h-full grid-cols-1 gap-5 md:grid-cols-2'>
                <Card extra={"items-center w-full h-full p-[16px] mt-3 bg-cover"}>
                    <div
                        className="relative mt-1 flex h-32 w-full justify-center rounded-xl bg-cover"
                        style={{ backgroundImage: `url(${banner})` }}
                    >
                        <div className="absolute -bottom-12 flex h-[87px] w-[87px] items-center justify-center rounded-full border-[4px] border-white bg-pink-400 dark:!border-navy-700 group">
                            <img
                                src={formData.foto}
                                alt="Foto de Perfil"
                                className="w-full h-full rounded-full object-cover"
                            />
                            {editando && (
                                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <FaEdit className="text-white text-xl" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFotoUpload}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Nome e Email */}
                    <div className="mt-16 flex flex-col items-center">
                        <h4 className="text-xl font-bold text-navy-700 dark:text-white">
                            {usuario.nome_completo || 'Nome não informado'}
                        </h4>
                        <p className="text-base font-normal text-gray-600">{usuario.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${status.ativo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'}`}>
                                {status.ativo ? 'Conta Ativa' : 'Conta Suspensa'}
                            </span>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                @{usuario.nome_utilizador || 'username'}
                            </span>
                        </div>
                    </div>
                </Card>

                <Card extra={"w-full h-full sm:overflow-auto px-6 mt-6 mb-6"}>
                    <div className="col-span-5 lg:col-span-6 lg:mb-0 3xl:col-span-5">
                        <header className="relative flex mb-8 mt-4 items-center justify-between pt-4">
                            <div className="text-xl font-bold text-navy-700 dark:text-white">
                                Informações do Perfil
                            </div>
                            {!editando ? (
                                <button
                                    onClick={() => setEditando(true)}
                                    className="text-blue-500 hover:text-blue-700 flex items-center"
                                >
                                    <FaEdit className="mr-2" />
                                    Editar Perfil
                                </button>
                            ) : (
                                <div className="flex space-x-4">
                                    <button
                                        onClick={salvarPerfil}
                                        className="text-green-500 hover:text-green-700 flex items-center"
                                    >
                                        <FaSave className="mr-2" />
                                        Salvar
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditando(false);
                                            setFormData({
                                                nome_completo: usuario.nome_completo || '',
                                                nome_utilizador: usuario.nome_utilizador || '',
                                                email: usuario.email || '',
                                            });
                                        }}
                                        className="text-red-500 hover:text-red-700 flex items-center"
                                    >
                                        <FaTimes className="mr-2" />
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </header>

                        {/* Cards de Informações */}
                        <div className="grid grid-cols-2 gap-4 px-2">
                            {/* Nome Completo */}
                            <div className="relative flex flex-col items-start justify-center rounded-2xl bg-white bg-clip-border px-3 py-4 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
                                <p className="text-sm text-gray-600">Nome Completo</p>
                                {editando ? (
                                    <input
                                        type="text"
                                        value={formData.nome_completo}
                                        onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                                        className="mt-1 p-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                ) : (
                                    <p className="text-base font-medium text-navy-700 dark:text-white">
                                        {usuario.nome_completo || 'Não informado'}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="relative flex flex-col justify-center rounded-2xl bg-white bg-clip-border px-3 py-4 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
                                <p className="text-sm text-gray-600">Email</p>
                                {editando ? (
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="mt-1 p-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-100"
                                        disabled
                                    />
                                ) : (
                                    <p className="text-base font-medium text-navy-700 dark:text-white">
                                        {usuario.email}
                                    </p>
                                )}
                                {editando && (
                                    <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
                                )}
                            </div>

                            {/* Nome de Utilizador */}
                            <div className="relative flex flex-col items-start justify-center rounded-2xl bg-white bg-clip-border px-3 py-4 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
                                <p className="text-sm text-gray-600">Nome de Utilizador</p>
                                {editando ? (
                                    <input
                                        type="text"
                                        value={formData.nome_utilizador}
                                        onChange={(e) => setFormData({ ...formData, nome_utilizador: e.target.value })}
                                        className="mt-1 p-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                ) : (
                                    <p className="text-base font-medium text-navy-700 dark:text-white">
                                        @{usuario.nome_utilizador || 'sem_username'}
                                    </p>
                                )}
                            </div>

                            {/* Data de Cadastro */}
                            <div className="relative flex flex-col justify-center rounded-2xl bg-white bg-clip-border px-3 py-4 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
                                <p className="text-sm text-gray-600">Membro desde</p>
                                <p className="text-base font-medium text-navy-700 dark:text-white">
                                    {usuario.created_at
                                        ? new Date(usuario.created_at).toLocaleDateString('pt-PT')
                                        : 'Não informado'}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Seção de Favoritos */}
            <Card extra="w-full p-6 h-full mb-6">
                <header className="relative flex items-center justify-between pt-2 pb-4">
                    <div className="flex items-center gap-2">
                        <FaHeart className="text-red-500" />
                        <div className="text-xl font-bold text-navy-700 dark:text-white">
                            Eventos Favoritos
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-navy-500 text-white rounded-full text-sm font-semibold">
                        {favoritos.length} {favoritos.length === 1 ? 'favorito' : 'favoritos'}
                    </span>
                </header>

                {loadingFavoritos ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                    </div>
                ) : favoritos.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <FaHeart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Este usuário ainda não tem eventos favoritos</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {favoritos.map((evento) => (
                            <Card key={evento.id} extra="p-4 hover:shadow-lg transition-shadow">
                                <div className="relative">
                                    <img
                                        src={evento.imagem}
                                        alt={evento.nome}
                                        className="w-full h-40 object-cover rounded-lg mb-3 cursor-pointer"
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/300x200?text=Sem+Imagem';
                                        }}
                                        onClick={() => handleEventoClick(evento.id)}
                                    />
                                    <span className="absolute top-2 right-2 px-2 py-1 bg-navy-500 text-white text-xs rounded-full">
                                        {getCategoryLabel(evento.categoria)}
                                    </span>
                                </div>

                                <h3 className="font-bold text-navy-700 dark:text-white mb-2 line-clamp-1">
                                    {evento.nome}
                                </h3>

                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {evento.descricao || 'Sem descrição'}
                                </p>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">
                                        {formatDate(evento.data)} • {evento.hora}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <FaHeart className="text-red-500 text-xs" />
                                        <span className="text-gray-600">{evento.likes}</span>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 mt-2">
                                    {evento.organizador}
                                </p>
                            </Card>
                        ))}
                    </div>
                )}
            </Card>

            <div className="grid h-full grid-cols-1 gap-5 lg:!grid-cols-1">
                <Card extra="w-full p-4 h-full">
                    <header className="relative flex items-center justify-between pt-4">
                        <div className="text-xl font-bold text-navy-700 dark:text-white">
                            Status da Conta
                        </div>
                    </header>
                    <div className="mt-5">
                        <p className="text-sm font-bold text-navy-700 dark:text-white">
                            Status atual:
                            <span className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full ${status.ativo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {status.ativo ? 'Ativo' : 'Suspenso'}
                            </span>
                        </p>
                        <div className="flex space-x-2 mt-4">
                            {status.ativo ? (
                                <button
                                    onClick={() => handleStatusConta('suspenso')}
                                    className="bg-red-500 mb-5 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center"
                                >
                                    <FaTimes className="mr-2" /> Suspender Conta
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleStatusConta('ativo')}
                                    className="bg-green-500 mb-5 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center"
                                >
                                    <FaCheck className="mr-2" /> Ativar Conta
                                </button>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PerfilUsuario;