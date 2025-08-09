import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { supabase } from '../supabaseClient';
import Swal from 'sweetalert2';

interface Candidata {
  id: number;
  nombre: string;
  facultad: string;
  foto_url: string;
}

function Votacion() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('votacion_id');
  const [fpId, setFpId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);   // <- nuevo
  const [hasVoted, setHasVoted] = useState(false);
  const [candidatas, setCandidatas] = useState<Candidata[]>([]);
  const [seleccionada, setSeleccionada] = useState<Candidata | null>(null);
  const [loading, setLoading] = useState(true);
  const [votacionActiva, setVotacionActiva] = useState(true);
  const [verificandoVoto, setVerificandoVoto] = useState(true);

  // Verificar si ya votó (cuando fpId y deviceId estén disponibles)
useEffect(() => {
    try {
      let token = localStorage.getItem('device_token');
      if (!token) {
        token = crypto.randomUUID(); // o usa nanoid si prefieres
        localStorage.setItem('device_token', token);
      }
      setDeviceId(token);
    } catch {
      // si localStorage falla (modo incógnito muy agresivo), crea uno volatile
      setDeviceId(`volatile-${Math.random().toString(36).slice(2)}`);
    }
  }, []);


  // Obtener fingerprint del dispositivo
  useEffect(() => {
    const loadFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setFpId(result.visitorId);
      } catch (e) {
        console.warn('FingerprintJS falló o está bloqueado:', e);
        setFpId(null);
      }
    };
    loadFingerprint();
  }, []);

  const dispositivo_hash = deviceId && fpId ? `${deviceId}:${fpId}`
                        : deviceId ?? fpId ?? null;

  // Verificar si votación está dentro del rango de fechas
  useEffect(() => {
    const verificarTiempoDeVotacion = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('votacion')
        .select('fecha_inicio, fecha_fin')
        .eq('id', Number(id))
        .single();

      if (error || !data) {
        setVotacionActiva(false);
        return;
      }
      const ahora = new Date();
      setVotacionActiva(ahora >= new Date(data.fecha_inicio) && ahora <= new Date(data.fecha_fin));
    };
    verificarTiempoDeVotacion();
  }, [id]);

  // Obtener candidatas
  useEffect(() => {
    const fetchCandidatas = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('candidata')
        .select('*')
        .eq('votacion_id', Number(id));
      if (!error && data) setCandidatas(data as Candidata[]);
      setLoading(false);
    };
    fetchCandidatas();
  }, [id]);

  // 5) Verificar si ya votó (cuando tengamos el hash listo)
  useEffect(() => {
      const verificar = async () => {
        if (!dispositivo_hash || !id) return;
        const { data, error } = await supabase
          .from('voto')
          .select('id', { count: 'exact' })
          .eq('dispositivo_hash', dispositivo_hash)
          .eq('votacion_id', Number(id));

        if (!error && data && data.length > 0) setHasVoted(true);
        setVerificandoVoto(false);
      };
      verificar();
    }, [dispositivo_hash, id]);

  // Emitir voto
  const emitirVoto = async (candidataId: number | null) => {
    if (!dispositivo_hash || !id) {
      Swal.fire('Error', 'No se pudo identificar el dispositivo. Intenta refrescar.', 'error');
      return;
    }

  // Doble-check
    const { data: prev } = await supabase
      .from('voto')
      .select('id')
      .eq('dispositivo_hash', dispositivo_hash)
      .eq('votacion_id', Number(id));
    if (prev && prev.length > 0) {
      setHasVoted(true);
      Swal.fire('🛑 Ya has votado', 'Este dispositivo ya fue utilizado para votar.', 'warning');
      return;
    }


  const confirmacion = await Swal.fire({
      title: candidataId ? `¿Confirmar tu voto por ${seleccionada?.nombre}?` : '¿Votar en blanco?',
      text: candidataId ? 'Tu elección será registrada.' : 'Estás enviando un voto en blanco.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, votar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirmacion.isConfirmed) return;


    const { error } = await supabase.from('voto').insert({
      votacion_id: Number(id),
      candidata_id: candidataId,
      voto_blanco: candidataId === null,
      voto_nulo: false,
      dispositivo_hash, // <- siempre el mismo valor usado en el check anterior
    });

    if (error) {
      console.error('Insert voto error:', error);
      Swal.fire('❌ Error', `No se pudo registrar el voto: ${error.message}`, 'error');
      return;
    }

setHasVoted(true);
    Swal.fire({
      title: '✅ ¡Gracias por votar!',
      text: 'Tu voto ha sido registrado correctamente.',
      icon: 'success',
      confirmButtonText: 'Ver resultados',
    }).then((res) => {
      if (res.isConfirmed) {
        window.location.href = `/resultados?votacion_id=${id}`;
      }
    });
  };

  if (!votacionActiva)
    return <p className="text-center p-8 text-white">Esta votación ha finalizado o aún no ha comenzado.</p>;

  if (hasVoted)
    return (
      <div className="text-center p-8 text-white space-y-4">
        <p className="text-xl font-semibold">✅ Este dispositivo ya ha votado.</p>
        <button
          onClick={() => {
            window.location.href = `/resultados?votacion_id=${id}`;
          }}
          className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded text-white text-lg"
        >
          Ver resultados
        </button>
      </div>
    );


  return (
    <div className="min-h-screen pb-28 px-4 pt-6 text-white max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">Vota por tu candidata 👑</h1>

      <div style={{ color: '#aaa', fontSize: 12, textAlign: 'center' }}>
        hash: {dispositivo_hash}
      </div>

      <div className="grid gap-4">
        {candidatas.map((c) => {
          const esSeleccionada = seleccionada?.id === c.id;
          return (
            <div
              key={c.id}
              onClick={() => setSeleccionada(c)}
              className={`cursor-pointer bg-white/10 rounded-lg shadow text-white flex flex-col sm:flex-row items-center transition border-2 ${
                esSeleccionada ? 'border-indigo-500' : 'border-transparent'
              } p-4`}
            >
              <img
                src={c.foto_url}
                alt={c.nombre}
                className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 object-cover rounded-lg"
              />
              <div className="sm:ml-6 mt-4 sm:mt-0 text-center sm:text-left">
                <h3 className="text-2xl sm:text-3xl font-semibold">{c.nombre}</h3>
                {esSeleccionada && (
                  <span className="text-sm text-indigo-300 block mt-1">Seleccionada</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Botones fijos en la parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#130e1d] px-4 py-4 border-t border-gray-700 flex flex-col items-center gap-2 z-50">
        <div className="text-white text-sm">
          {seleccionada
            ? `Has seleccionado: ${seleccionada.nombre}`
            : 'Selecciona una candidata o vota en blanco'}
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => emitirVoto(null)}
            className="bg-gray-700 hover:bg-gray-800 py-2 px-4 rounded text-white text-lg"
          >
            Votar en blanco
          </button>
          <button
            onClick={() => emitirVoto(seleccionada?.id ?? null)}
            disabled={!seleccionada}
            className={`py-2 px-4 rounded text-white text-lg ${
              seleccionada
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-indigo-900 opacity-50 cursor-not-allowed'
            }`}
          >
            Confirmar voto
          </button>
        </div>
      </div>
    </div>
  );
}

export default Votacion;
