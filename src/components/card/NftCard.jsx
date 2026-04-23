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

      // Removido o filtro .is('deleted_at', null) para buscar TODOS os eventos
      const { data: eventos, error: eventosError } = await supabase
        .from('eventos')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventosError) {
        console.error('❌ Erro ao buscar eventos:', eventosError);
        throw eventosError;
      }

      console.log('📦 Eventos encontrados (incluindo deletados):', eventos?.length || 0);

      if (!eventos || eventos.length === 0) {
        setEvents([]);
        return;
      }

      const eventosCompletos = await Promise.all(
        eventos.map(async (evento) => {
          try {
            const { data: organizador, error: orgError } = await supabase
              .from('organizadores')
              .select('nome_empresa')
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

            return {
              id: evento.id,
              title: evento.nome_evento || 'Sem título',
              author: organizador?.nome_empresa || 'Organizador',
              price: evento.valor?.toString() || "0",
              image: evento.imagem_url || 'https://via.placeholder.com/300x200?text=Sem+Imagem',
              likes: likesCount || 0,
              category: evento.categoria || 'Sem categoria',
              eventType: evento.tipo_evento || 'presencial',
              location: evento.local || 'Local não informado',
              date: evento.data_evento,
              time: evento.hora_evento,
              deleted_at: evento.deleted_at // Incluir informação de deleção
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

      // Atualizar a lista local
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

  // Renderização condicional com apenas um return
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
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5">
        {events.map((event) => {
          const isDeleted = event.deleted_at !== null;
          
          return (
            <Card
              key={event.id}
              extra={`flex flex-col w-full h-full !p-4 3xl:p-![18px] bg-white mb-5 ${
                isDeleted ? 'opacity-60' : ''
              }`}
            >
              <div className="h-full w-full">
                <div className="relative w-full">
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
                    className="mb-3 h-full w-full rounded-xl 3xl:h-full 3xl:w-full cursor-pointer"
                    onClick={() => navigate(`/admin/detalhes/${event.id}`)}
                  />
                </div>

                <div className="mb-3 flex items-center justify-between px-1 md:flex-col md:items-start lg:flex-row lg:justify-between xl:flex-col xl:items-start 3xl:flex-row 3xl:justify-between">
                  <div className="mb-2">
                    <div className="flex gap-2 items-center">
                      <img
                        src={event.image}
                        className="w-10 h-10 rounded-full"
                        alt=""
                      />
                      <p className="text-lg font-bold text-navy-700 dark:text-white">
                        {event.author}
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-600 md:mt-2">
                      Nome: {event.title}
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-600 md:mt-2">
                      Interessados: {event.price}
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-600 md:mt-2">
                      Status: {isDeleted ? 'Deletado' : 'Disponível'}
                    </p>
                    <p className="mt-2 mb-2 text-sm font-bold text-brand-500 dark:text-white">
                      Preço {event.price} <span>Kzs</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:flex-col md:items-start lg:flex-row lg:justify-between xl:flex-col 2xl:items-start 3xl:flex-row 3xl:items-center 3xl:justify-between">
                  <div className="flex flex-row items-center gap-x-2">
                    <button
                      onClick={() => toggleEventStatus(event.id, event.deleted_at)}
                      disabled={updatingEvent === event.id}
                      className={`linear rounded-[20px] px-4 py-2 text-base font-medium text-white transition duration-200 ${
                        isDeleted
                          ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
                          : 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {updatingEvent === event.id ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processando...
                        </span>
                      ) : (
                        isDeleted ? 'Ativar' : 'Desativar'
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