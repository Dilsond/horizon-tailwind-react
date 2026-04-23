import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaCheck, FaTimes, FaHeart, FaCalendarAlt, FaMapMarkerAlt, FaClock, FaSave, FaBan } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import Card from 'components/card';
import avatar from "assets/img/avatars/avatar11.png";
import banner from "assets/img/profile/banner.png";
import NFt3 from "assets/img/nfts/Nft3.png";
import { supabase } from '../../../lib/supabase.ts';

const PerfilEmpresa = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [organizador, setOrganizador] = useState(null);
    const [eventos, setEventos] = useState([]);
    const [stats, setStats] = useState({
        ativos: 0,
        total: 0,
        cancelados: 0,
        totalLikes: 0
    });

    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        nome_empresa: '',
        nif: '',
        localizacao: '',
        contacto: '',
        email_empresa: '',
        sobre: '',
        tags: []
    });

    useEffect(() => {
        if (id) {
            fetchOrganizador();
            fetchEventos();
        }
    }, [id]);

    const fetchOrganizador = async () => {
        try {
            const { data, error } = await supabase
                .from('organizadores')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            setOrganizador(data);
            setFormData({
                nome_empresa: data.nome_empresa || '',
                nif: data.nif || '',
                localizacao: data.localizacao || '',
                contacto: data.contacto || '',
                email_empresa: data.email_empresa || '',
                sobre: data.sobre || '',
                tags: data.tags || []
            });
        } catch (error) {
            console.error('Erro ao buscar organizador:', error);
        }
    };

    const fetchEventos = async () => {
        try {
            const { data, error } = await supabase
                .from('eventos')
                .select('*')
                .eq('organizador_id', id)
                .order('data_evento', { ascending: false });

            if (error) throw error;

            // Calcular estatísticas
            const hoje = new Date();
            let ativos = 0;
            let cancelados = 0;
            let totalLikes = 0;

            const eventosComLikes = await Promise.all(
                data.map(async (evento) => {
                    const { count } = await supabase
                        .from('favoritos_eventos')
                        .select('*', { count: 'exact', head: true })
                        .eq('evento_id', evento.id);

                    totalLikes += count || 0;

                    const dataEvento = new Date(evento.data_evento);
                    if (evento.deleted_at) {
                        cancelados++;
                    } else if (dataEvento >= hoje) {
                        ativos++;
                    }

                    return {
                        ...evento,
                        likes: count || 0
                    };
                })
            );

            setEventos(eventosComLikes);
            setStats({
                total: data.length,
                ativos,
                cancelados,
                totalLikes
            });

        } catch (error) {
            console.error('Erro ao buscar eventos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSalvarEdicao = async () => {
        try {
            const { error } = await supabase
                .from('organizadores')
                .update({
                    nome_empresa: formData.nome_empresa,
                    nif: formData.nif,
                    localizacao: formData.localizacao,
                    contacto: formData.contacto,
                    sobre: formData.sobre,
                    tags: formData.tags,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            setOrganizador({ ...organizador, ...formData });
            setEditing(false);
            alert('Dados da empresa atualizados com sucesso.');
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            alert('Erro ao atualizar dados');
        }
    };

    const handleStatusConta = async (suspender) => {
        try {
            const updateData = {};
            
            if (suspender) {
                updateData.deleted_at = new Date().toISOString();
            } else {
                updateData.deleted_at = null;
            }

            const { error } = await supabase
                .from('organizadores')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            setOrganizador({ ...organizador, ...updateData });
            // alert(`Conta da empresa ${suspender ? 'suspensa' : 'ativada'} com sucesso.`);
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            // alert('Erro ao alterar status da conta');
        }
    };

    const deletarConta = async () => {
        const confirmacao = window.confirm("Tem certeza que deseja deletar permanentemente esta conta? Esta ação não pode ser desfeita.");

        if (confirmacao) {
            try {
                const { error } = await supabase
                    .from('organizadores')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                alert('Conta excluída com sucesso.');
                navigate('/admin/organizadores');
            } catch (error) {
                console.error('Erro ao excluir conta:', error);
                alert('Erro ao excluir conta');
            }
        }
    };

    const handleEventoClick = (eventoId) => {
        navigate(`/admin/detalhes/${eventoId}`);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (evento) => {
        if (evento.deleted_at) {
            return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Cancelado</span>;
        }

        const hoje = new Date();
        const dataEvento = new Date(evento.data_evento);

        if (dataEvento < hoje) {
            return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">Finalizado</span>;
        }

        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Ativo</span>;
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

    const handleTagInput = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            e.preventDefault();
            const newTag = e.target.value.trim();
            if (!formData.tags.includes(newTag)) {
                setFormData({
                    ...formData,
                    tags: [...formData.tags, newTag]
                });
            }
            e.target.value = '';
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter(tag => tag !== tagToRemove)
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    if (!organizador) {
        return (
            <div className="mt-10 text-center text-gray-500">
                Organizador não encontrado
            </div>
        );
    }

    const isContaAtiva = !organizador.deleted_at;

    return (
        <div className="p-4">
            {/* Botão Voltar */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
                ← Voltar
            </button>

            <div className="mb-6 grid h-full grid-cols-1 gap-5 md:grid-cols-2">
                {/* Card de Perfil */}
                <Card extra={"items-center w-full h-full p-[16px] bg-cover"}>
                    <div
                        className="relative mt-1 flex h-32 w-full justify-center rounded-xl bg-cover"
                        style={{ backgroundImage: `url(${banner})` }}
                    >
                        <div className="absolute -bottom-12 flex h-[87px] w-[87px] items-center justify-center rounded-full border-[4px] border-white bg-pink-400 dark:!border-navy-700">
                            <img className="h-full w-full rounded-full object-cover" src={organizador.avatar_url || avatar} alt={organizador.nome_empresa} />
                        </div>
                    </div>

                    <div className="mt-16 flex flex-col items-center">
                        <h4 className="text-xl font-bold text-navy-700 dark:text-white">
                            {organizador.nome_empresa}
                        </h4>
                        <p className="text-base font-normal text-gray-600">{organizador.email_empresa}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${isContaAtiva ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {isContaAtiva ? 'Conta Ativa' : 'Conta Suspensa'}
                            </span>
                        </div>
                    </div>

                    {/* Estatísticas */}
                    <div className="mt-6 mb-3 flex justify-around w-full px-4">
                        <div className="flex flex-col items-center">
                            <p className="text-2xl font-bold text-navy-700 dark:text-white">{stats.ativos}</p>
                            <p className="text-xs font-normal text-gray-600">Ativos</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <p className="text-2xl font-bold text-navy-700 dark:text-white">{stats.total}</p>
                            <p className="text-xs font-normal text-gray-600">Total</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <p className="text-2xl font-bold text-navy-700 dark:text-white">{stats.cancelados}</p>
                            <p className="text-xs font-normal text-gray-600">Cancelados</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <p className="text-2xl font-bold text-navy-700 dark:text-white">{stats.totalLikes}</p>
                            <p className="text-xs font-normal text-gray-600">Likes</p>
                        </div>
                    </div>
                </Card>

                {/* Card de Ações Rápidas */}
                <Card extra="w-full h-full p-6">
                    <h3 className="text-lg font-bold text-navy-700 dark:text-white mb-4">
                        Ações Rápidas
                    </h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => setEditing(!editing)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            <FaEdit />
                            {editing ? 'Cancelar Edição' : 'Editar Perfil'}
                        </button>
                        
                        {isContaAtiva ? (
                            <button
                                onClick={() => handleStatusConta(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                <FaBan />
                                Suspender Conta
                            </button>
                        ) : (
                            <button
                                onClick={() => handleStatusConta(false)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                                <FaCheck />
                                Ativar Conta
                            </button>
                        )}
                        
                        <button
                            onClick={deletarConta}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            <FaTrash />
                            Excluir Permanentemente
                        </button>
                    </div>
                </Card>
            </div>

            {/* Informações Cadastrais - Lado a Lado */}
            <Card extra="w-full p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-navy-700 dark:text-white">
                        Informações Cadastrais
                    </h3>
                    {editing && (
                        <button
                            onClick={handleSalvarEdicao}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                            <FaSave />
                            Salvar Alterações
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Coluna Esquerda */}
                    <div className="space-y-4">
                        {/* Nome da Empresa */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                                Nome da Empresa
                            </label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={formData.nome_empresa}
                                    onChange={(e) => setFormData({ ...formData, nome_empresa: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                />
                            ) : (
                                <p className="text-base font-medium text-navy-700 dark:text-white">
                                    {formData.nome_empresa}
                                </p>
                            )}
                        </div>

                        {/* NIF */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                                NIF
                            </label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={formData.nif}
                                    onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                />
                            ) : (
                                <p className="text-base font-medium text-navy-700 dark:text-white">
                                    {formData.nif || 'Não informado'}
                                </p>
                            )}
                        </div>

                        {/* Localização */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                                Localização
                            </label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={formData.localizacao}
                                    onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                />
                            ) : (
                                <p className="text-base font-medium text-navy-700 dark:text-white">
                                    {formData.localizacao || 'Não informado'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Coluna Direita */}
                    <div className="space-y-4">
                        {/* Contacto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                                Contacto
                            </label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={formData.contacto}
                                    onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                />
                            ) : (
                                <p className="text-base font-medium text-navy-700 dark:text-white">
                                    {formData.contacto || 'Não informado'}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                                Email
                            </label>
                            <p className="text-base font-medium text-navy-700 dark:text-white">
                                {formData.email_empresa}
                            </p>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                                Tags
                            </label>
                            {editing ? (
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Digite uma tag e pressione Enter"
                                        onKeyDown={handleTagInput}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent mb-2"
                                    />
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1"
                                            >
                                                {tag}
                                                <button
                                                    onClick={() => removeTag(tag)}
                                                    className="hover:text-red-600"
                                                >
                                                    <FaTimes size={10} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {formData.tags.length > 0 ? (
                                        formData.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
                                            >
                                                {tag}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">Nenhuma tag cadastrada</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sobre - Ocupa largura total */}
                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                        Sobre a Empresa
                    </label>
                    {editing ? (
                        <textarea
                            value={formData.sobre}
                            onChange={(e) => setFormData({ ...formData, sobre: e.target.value })}
                            rows={4}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                    ) : (
                        <p className="text-base text-gray-600">
                            {formData.sobre || 'Sem descrição cadastrada'}
                        </p>
                    )}
                </div>
            </Card>

            {/* Eventos Divulgados */}
            <Card extra="w-full p-6">
                <h3 className="text-lg font-bold text-navy-700 dark:text-white mb-4">
                    Eventos Divulgados ({eventos.length})
                </h3>

                {eventos.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">Nenhum evento encontrado</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {eventos.map((evento) => (
                            <Card
                                key={evento.id}
                                extra={`flex flex-col w-full h-full !p-4 bg-white cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}
                                onClick={() => handleEventoClick(evento.id)}
                            >
                                <div className="h-full w-full">
                                    <div className="relative w-full overflow-hidden rounded-xl">
                                        <img
                                            src={evento.imagem_url || NFt3}
                                            alt={evento.nome_evento}
                                            className="h-40 w-full object-cover transition-transform duration-300 hover:scale-110"
                                            onError={(e) => {
                                                e.target.src = NFt3;
                                            }}
                                        />
                                        <div className="absolute top-2 right-2">
                                            {getStatusBadge(evento)}
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <h3 className="text-base font-bold text-navy-700 dark:text-white mb-2 line-clamp-1">
                                            {evento.nome_evento}
                                        </h3>

                                        <div className="space-y-2 mb-3">
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <FaCalendarAlt className="text-brand-500" />
                                                <span>{formatDate(evento.data_evento)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <FaClock className="text-brand-500" />
                                                <span>{evento.hora_evento?.slice(0, 5)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <FaMapMarkerAlt className="text-brand-500" />
                                                <span className="truncate">{evento.local || 'Local não informado'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                                {getCategoryLabel(evento.categoria)}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <FaHeart className="text-red-500 text-xs" />
                                                <span className="text-xs font-medium">{evento.likes || 0}</span>
                                            </div>
                                        </div>

                                        <div className="mt-2 text-right">
                                            <p className="text-sm font-bold text-brand-500">
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
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default PerfilEmpresa;