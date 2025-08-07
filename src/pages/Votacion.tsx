import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { supabase } from '../supabaseClient';
import Swal from 'sweetalert2';
import CircularGallery from '../components/CircularGallery';

interface Candidata {
  id: number;
  nombre: string;
  facultad: string;
  foto_url: string;
}

function Votacion() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('votacion_id');
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [candidatas, setCandidatas] = useState<Candidata[]>([]);
  const [loading, setLoading] = useState(true);
  const [seleccionada, setSeleccionada] = useState<Candidata | null>(null);

  useEffect(() => {
    const loadFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setVisitorId(result.visitorId);
    };
    loadFingerprint();
  }, []);

  useEffect(() => {
    const fetchCandidatas = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('candidata')
        .select('*')
        .eq('votacion_id', id);

      if (!error) setCandidatas(data as Candidata[]);
      setLoading(false);
    };
    fetchCandidatas();
  }, [id]);

  const emitirVoto = async () => {
    if (!visitorId || !id) return;

    const { data: votosPrevios } = await supabase
      .from('voto')
      .select('*')
      .eq('dispositivo_hash', visitorId)
      .eq('votacion_id', id);

    if (votosPrevios && votosPrevios.length > 0) {
      setHasVoted(true);
      Swal.fire('🛑 Ya has votado', 'Este dispositivo ya fue utilizado para votar.', 'warning');
      return;
    }

    const confirmacion = await Swal.fire({
      title: seleccionada ? `¿Votar por ${seleccionada.nombre}?` : '¿Votar en blanco?',
      text: seleccionada
        ? 'Tu elección será registrada.'
        : 'Estás enviando un voto en blanco.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, votar',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmacion.isConfirmed) return;

    const { error } = await supabase.from('voto').insert({
      votacion_id: Number(id),
      candidata_id: seleccionada?.id ?? null,
      voto_blanco: seleccionada === null,
      dispositivo_hash: visitorId,
    });

    if (error) {
      Swal.fire('❌ Error', 'Ocurrió un error al emitir tu voto.', 'error');
    } else {
      setHasVoted(true);
      Swal.fire('✅ ¡Gracias por votar!', '', 'success');
    }
  };

  if (loading || !visitorId)
    return <p className="text-center p-8 text-white">Cargando...</p>;

  if (hasVoted)
    return <p className="text-center p-8 text-white">Este dispositivo ya fue utilizado para votar.</p>;

  const items = candidatas.map((c) => ({
    image: c.foto_url,
    text: c.nombre,
    onClick: () => setSeleccionada(c),
  }));

  return (
    <div className="w-full h-[90vh] relative text-white">
      <h1 className="text-3xl text-center font-bold mb-6">Vota por tu candidata 👑</h1>

      <div className="w-full h-[500px] relative">
        <CircularGallery items={items} />
      </div>

      <div className="absolute bottom-4 w-full flex flex-col items-center gap-3">
        <p className="text-lg">
          {seleccionada
            ? `Seleccionaste: ${seleccionada.nombre}`
            : 'Selecciona una candidata o vota en blanco'}
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => setSeleccionada(null)}
            className="bg-gray-500 hover:bg-gray-600 py-2 px-4 rounded text-white"
          >
            Votar en blanco
          </button>
          <button
            onClick={emitirVoto}
            className="bg-green-600 hover:bg-green-700 py-2 px-4 rounded text-white"
            disabled={seleccionada === null}
          >
            Confirmar voto
          </button>
        </div>
      </div>
    </div>
  );
}

export default Votacion;


