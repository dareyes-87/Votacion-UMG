// src/pages/Votacion.tsx
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

  // Estados de identificación del dispositivo
  const [fpId, setFpId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Estados de UI / datos
  const [hasVoted, setHasVoted] = useState(false);
  const [candidatas, setCandidatas] = useState<Candidata[]>([]);
  const [seleccionada, setSeleccionada] = useState<Candidata | null>(null);
  const [loading, setLoading] = useState(true);
  const [votacionActiva, setVotacionActiva] = useState(true);
  const [verificandoVoto, setVerificandoVoto] = useState(true);

  // Estados para pantalla sin votacion_id (QR / manual)
  const [showScanner, setShowScanner] = useState(false);
  const [manualInput, setManualInput] = useState('');

  // ===== Helpers para flujo sin ID =====
  function extractVotacionId(text: string): number | null {
    if (!text) return null;
    // número directo
    const asNum = Number(text.trim());
    if (!Number.isNaN(asNum) && asNum > 0) return asNum;

    // URL con query
    try {
      const url = new URL(text);
      const fromQuery = url.searchParams.get('votacion_id');
      if (fromQuery && !Number.isNaN(Number(fromQuery))) return Number(fromQuery);
    } catch {
      // no era URL; intentar encontrar votacion_id=NNN en texto
      const m = text.match(/votacion_id=(\d+)/i);
      if (m) return Number(m[1]);
    }
    return null;
  }

  async function startScanner() {
    setShowScanner(true);
    if (typeof window === 'undefined') return;
    try {
      const { Html5Qrcode } = await import('html5-qrcode'); // npm i html5-qrcode
      const elementId = 'qr-reader';

      setTimeout(async () => {
        const html5QrCode = new Html5Qrcode(elementId);
        const config = { fps: 10, qrbox: 250 };
        try {
          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            (decodedText: string) => {
              const vid = extractVotacionId(decodedText);
              if (vid) {
                html5QrCode.stop().then(() => {
                  window.location.href = `/votar?votacion_id=${vid}`;
                });
              }
            }
          );
          (window as any).__qrInstance = html5QrCode;
        } catch (e) {
          console.error('No se pudo iniciar la cámara/QR:', e);
          Swal.fire('Permiso requerido', 'No se pudo acceder a la cámara.', 'warning');
          setShowScanner(false);
        }
      }, 0);
    } catch (e) {
      console.error('Error cargando html5-qrcode:', e);
      Swal.fire('Error', 'No se pudo iniciar el lector QR.', 'error');
      setShowScanner(false);
    }
  }

  useEffect(() => {
    return () => {
      const inst = (window as any).__qrInstance;
      if (inst) inst.stop().catch(() => {});
    };
  }, []);

  // ===== Identificación del dispositivo (token local + Fingerprint opcional) =====
  useEffect(() => {
    try {
      let token = localStorage.getItem('device_token');
      if (!token) {
        token = crypto.randomUUID();
        localStorage.setItem('device_token', token);
      }
      setDeviceId(token);
    } catch {
      setDeviceId(`volatile-${Math.random().toString(36).slice(2)}`);
    }
  }, []);

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

  const dispositivo_hash =
    deviceId && fpId ? `${deviceId}:${fpId}` : deviceId ?? fpId ?? null;

  // ===== Verificar ventana de tiempo de la votación =====
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
      setVotacionActiva(
        ahora >= new Date(data.fecha_inicio) && ahora <= new Date(data.fecha_fin)
      );
    };
    verificarTiempoDeVotacion();
  }, [id]);

  // ===== Obtener candidatas =====
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

  // ===== Verificar si ya votó este dispositivo =====
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

  // ===== Emitir voto =====
  const emitirVoto = async (candidataId: number | null) => {
    if (!dispositivo_hash || !id) {
      Swal.fire('Error', 'No se pudo identificar el dispositivo o falta el ID.', 'error');
      return;
    }

    // Doble-check cliente (puedes eliminar cuando migres a RPC)
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
      dispositivo_hash,
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

  // ===== Vista cuando NO hay votacion_id (entrada con QR o manual) =====
  if (!id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-white text-center space-y-6">
        <h1 className="text-3xl font-bold">Vota por tu candidata 👑</h1>
        <p className="opacity-80">Escanea el código QR del evento o pega el enlace/ID para continuar.</p>

        <div className="flex flex-col gap-3 w-full max-w-md">
          <button
            onClick={startScanner}
            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded text-white text-lg"
          >
            Escanear QR
          </button>

          {showScanner && (
            <div className="rounded-lg overflow-hidden border border-white/20">
              <div id="qr-reader" className="w-full h-[320px] bg-black/40" />
            </div>
          )}

          <div className="text-left">
            <label className="block text-sm mb-1 opacity-80">Pegar enlace o ID de votación</label>
            <input
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Ej. https://.../votar?votacion_id=123 o 123"
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 focus:outline-none"
            />
            <button
              onClick={() => {
                const vid = extractVotacionId(manualInput);
                if (!vid) {
                  Swal.fire('Dato inválido', 'Ingresa un enlace o ID válido.', 'warning');
                  return;
                }
                window.location.href = `/votar?votacion_id=${vid}`;
              }}
              className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded text-white text-lg"
            >
              Continuar
            </button>
          </div>
        </div>

        <a href="/" className="text-sm text-indigo-300 hover:text-indigo-200 underline">
          Ir al inicio
        </a>
      </div>
    );
  }

  // ===== Votación fuera de tiempo =====
  if (!votacionActiva) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-white text-center space-y-4">
        <p className="text-xl">Esta votación ha finalizado o aún no ha comenzado.</p>

        {id ? (
          <button
            onClick={() => (window.location.href = `/resultados?votacion_id=${id}`)}
            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded text-white text-lg"
          >
            Ver resultados de esta votación
          </button>
        ) : (
          <a
            href="/resultados"
            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded text-white text-lg"
          >
            Ver resultados
          </a>
        )}

        <a
          href="/"
          className="text-sm text-indigo-300 hover:text-indigo-200 underline mt-2"
        >
          Ir al inicio
        </a>
      </div>
    );
  }

  // ===== Ya votó este dispositivo =====
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

  // ===== Vista principal de votación =====
  return (
    <div className="min-h-screen pb-28 px-4 pt-6 text-white max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">Vota por tu candidata 👑</h1>

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
