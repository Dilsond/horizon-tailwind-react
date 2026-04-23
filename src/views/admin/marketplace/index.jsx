import React, { useState, useEffect } from "react";
import Banner from "./components/Banner";
import NFt2 from "assets/img/nfts/Nft2.png";
import NFt3 from "assets/img/nfts/Nft3.png";
import NFt4 from "assets/img/nfts/Nft4.png";
import NFt5 from "assets/img/nfts/Nft5.png";
import NFt6 from "assets/img/nfts/Nft6.png";
import avatar1 from "assets/img/avatars/avatar1.png";
import avatar2 from "assets/img/avatars/avatar2.png";
import avatar3 from "assets/img/avatars/avatar3.png";
import NftCard from "components/card/NftCard";
import ImageModal from "./components/modal";
import { supabase } from "../../../lib/supabase.ts";
import EventList from "../../../components/card/NftCard";

// Array fixo de avatares para os bidders (mantendo o layout original)
const biddersAvatars = [avatar1, avatar2, avatar3];

const Marketplace = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNft, setSelectedNft] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      // Primeiro, buscar todos os eventos
      const { data: eventos, error: eventosError } = await supabase
        .from('eventos')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (eventosError) throw eventosError;

      // Para cada evento, buscar o organizador correspondente
      const eventosComOrganizadores = await Promise.all(
        eventos.map(async (evento) => {
          // Buscar organizador pelo ID
          const { data: organizador, error: orgError } = await supabase
            .from('organizadores')
            .select('nome_empresa, id')
            .eq('id', evento.organizador_id)
            .single();

          if (orgError) {
            console.error(`Erro ao buscar organizador para evento ${evento.id}:`, orgError);
          }

          // Buscar contagem de likes para este evento
          const { count: likesCount, error: likesError } = await supabase
            .from('favoritos_eventos')
            .select('*', { count: 'exact', head: true })
            .eq('evento_id', evento.id);

          if (likesError) {
            console.error(`Erro ao buscar likes para evento ${evento.id}:`, likesError);
          }

          return {
            id: evento.id,
            title: evento.nome_evento,
            author: organizador?.nome_empresa || 'Organizador',
            price: evento.valor?.toString() || "0",
            image: evento.imagem_url || NFt3,
            additionalImages: [NFt2, NFt4, NFt5, NFt6],
            likes: likesCount || 0,
            category: evento.categoria,
            eventType: evento.tipo_evento,
            location: evento.local,
            date: evento.data_evento,
            time: evento.hora_evento
          };
        })
      );

      setEvents(eventosComOrganizadores);
    } catch (err) {
      console.error('Erro ao buscar eventos:', err);
      setError('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (nft) => {
    setSelectedNft(nft);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNft(null);
  };

  // Extrair categorias únicas dos eventos
  const categories = [...new Set(events.map(e => e.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-3 grid h-full grid-cols-1 gap-5 xl:grid-cols-1 2xl:grid-cols-1">
      <div className="col-span-1 h-fit w-full xl:col-span-1 2xl:col-span-2">

        <div className="mb-4 mt-5 flex flex-col justify-between px-4 md:flex-row md:items-center">
          <h4 className="ml-1 text-2xl font-bold text-navy-700 dark:text-white">
            Categorias
          </h4>
          <ul className="mt-4 flex items-center justify-between md:mt-0 md:justify-center md:!gap-5 2xl:!gap-12">
            {categories.slice(0, 4).map((category, index) => (
              <li key={index}>
                <a
                  className="text-base font-medium text-brand-500 hover:text-brand-500 dark:text-white"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  {category || 'Sem categoria'}
                </a>
              </li>
            ))}
            {categories.length === 0 && (
              <li>
                <a
                  className="text-base font-medium text-brand-500 hover:text-brand-500 dark:text-white"
                  href="#"
                >
                  Todas
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className="z-20 mt-5">
          <EventList />
        </div>
      </div>

      {/* Modal com imagens adicionais */}
      {isModalOpen && selectedNft && (
        <ImageModal
          imageUrl={selectedNft.image}
          additionalImages={selectedNft.additionalImages}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default Marketplace;