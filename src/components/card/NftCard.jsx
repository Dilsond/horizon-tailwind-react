import { useState, useEffect } from "react";
import Card from "components/card";
import { supabase } from "../../lib/supabase.ts";
import { useNavigate } from "react-router-dom";

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingEvent, setUpdatingEvent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      console.log('🔍 Buscando todos os eventos...');

      const { data: eventos, error: eventosError } = await supabase
        .from('eventos')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventosError) {
        console.error('❌ Erro ao buscar eventos:', eventosError);
        throw eventosError;
      }

      console.log('📦 Eventos encontrados:', eventos?.length || 0);

      if (!eventos || eventos.length === 0) {
        setEvents([]);
        return;
      }

      const eventosCompletos = await Promise.all(
        eventos.map(async (evento) => {
          try {
            // Buscar organizador com avatar
            const { data: organizador, error: orgError } = await supabase
              .from('organizadores')
              .select('nome_empresa, avatar_url, status')
              .eq('id', evento.organizador_id)
              .maybeSingle();

            if (orgError) {
              console.error(`⚠️ Erro ao buscar organizador ${evento.organizador_id}:`, orgError);
            }

            const { count: likesCount, error: likesError } = await supabase
              .from('favoritos_eventos')
              .select('*', { count: 'exact', head: true })
              .eq('evento_id', evento.id);

            if (likesError) {
              console.error(`⚠️ Erro ao buscar likes para evento ${evento.id}:`, likesError);
            }

            // Verificar se o evento é gratuito
            const isFree = !evento.valor || evento.valor === 0;
            const priceDisplay = isFree ? 'Grátis' : `${evento.valor?.toLocaleString()} Kz`;
            const isFreeNumber = evento.valor === 0 || evento.valor === null;

            return {
              id: evento.id,
              title: evento.nome_evento || 'Sem título',
              author: organizador?.nome_empresa || 'Organizador',
              authorAvatar: organizador?.avatar_url || null,
              authorStatus: organizador?.status || 'aprovado',
              price: evento.valor || 0,
              priceDisplay: priceDisplay,
              isFree: isFreeNumber,
              image: evento.imagem_url || 'https://via.placeholder.com/300x200?text=Sem+Imagem',
              likes: likesCount || 0,
              category: evento.categoria || 'Sem categoria',
              eventType: evento.tipo_evento || 'presencial',
              location: evento.local || 'Local não informado',
              date: evento.data_evento,
              time: evento.hora_evento,
              deleted_at: evento.deleted_at
            };
          } catch (err) {
            console.error(`❌ Erro ao processar evento ${evento.id}:`, err);
            return null;
          }
        })
      );

      const eventosValidos = eventosCompletos.filter(e => e !== null);

      console.log('✅ Eventos processados:', eventosValidos.length);
      setEvents(eventosValidos);

    } catch (err) {
      console.error('❌ Erro inesperado:', err);
      setError('Erro ao carregar eventos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const toggleEventStatus = async (eventId, currentDeletedAt) => {
    try {
      setUpdatingEvent(eventId);

      const newDeletedAt = currentDeletedAt ? null : new Date().toISOString();

      const { error } = await supabase
        .from('eventos')
        .update({ deleted_at: newDeletedAt })
        .eq('id', eventId);

      if (error) throw error;

      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === eventId
            ? { ...event, deleted_at: newDeletedAt }
            : event
        )
      );

    } catch (err) {
      console.error('❌ Erro ao atualizar status do evento:', err);
      alert('Erro ao atualizar status do evento. Tente novamente.');
    } finally {
      setUpdatingEvent(null);
    }
  };

  // Renderização condicional
  let content;

  if (loading) {
    content = (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  } else if (error) {
    content = (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    );
  } else if (events.length === 0) {
    content = (
      <div className="text-center text-gray-500 p-8">
        Nenhum evento encontrado
      </div>
    );
  } else {
    content = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {events.map((event) => {
          const isDeleted = event.deleted_at !== null;

          return (
            <Card
              key={event.id}
              extra={`flex flex-col w-full h-[520px] !p-4 bg-white hover:shadow-lg transition-shadow duration-300 ${isDeleted ? 'opacity-60' : ''
                }`}
            >
              <div className="h-full w-full flex flex-col">
                {/* Imagem do Evento */}
                <div className="relative w-full h-48 flex-shrink-0">
                  {isDeleted && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        DELETADO
                      </span>
                    </div>
                  )}
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover rounded-xl cursor-pointer"
                    onClick={() => navigate(`/admin/detalhes/${event.id}`)}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=Imagem+Indispon%C3%ADvel';
                    }}
                  />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 flex flex-col mt-3">
                  {/* Autor com Avatar */}
                  <div className="flex items-center gap-2 mb-2">
                    {event.authorAvatar ? (
                      <img
                        src={event.authorAvatar}
                        alt={event.author}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?background=f97316&color=fff&bold=true&size=32&name=${encodeURIComponent(event.author)}`;
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-500 to-red-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {event.author.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <p className="text-sm font-semibold text-gray-700 truncate">
                      {event.author}
                    </p>
                  </div>

                  {/* Título do evento */}
                  <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 min-h-[48px]">
                    {event.title}
                  </h3>

                  {/* Informações adicionais */}
                  <div className="space-y-1 mb-3">
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <span className="font-medium">Categoria:</span>
                      {event.category}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <span className="font-medium">Data:</span>
                      {event.date ? new Date(event.date).toLocaleDateString('pt-PT') : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <span className="font-medium">Status:</span>
                      <span className={isDeleted ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                        {isDeleted ? 'Deletado' : 'Ativo'}
                      </span>
                    </p>
                  </div>

                  {/* Preço */}
                  <div className="mt-auto">
                    <p className={`text-xl font-bold mb-3 ${event.isFree ? 'text-green-600' : 'text-green-600'}`}>
                      {event.priceDisplay}
                    </p>

                    {/* Botão */}
                    <button
                      onClick={() => toggleEventStatus(event.id, event.deleted_at)}
                      disabled={updatingEvent === event.id}
                      className={`w-full linear rounded-[20px] px-4 py-2 text-sm font-medium text-white transition duration-200 ${isDeleted
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {updatingEvent === event.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processando...
                        </span>
                      ) : (
                        isDeleted ? 'Ativar Evento' : 'Desativar Evento'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return content;
};

export default EventList;