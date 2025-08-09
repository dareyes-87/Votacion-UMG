// src/pages/ResultadosLive.tsx
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { QRCodeCanvas } from 'qrcode.react';

type Resultado = {
  candidata_id: number;
  nombre: string;
  votos: number;
};

function ResultadosLive() {
  const [searchParams] = useSearchParams();
  const votacionId = searchParams.get('votacion_id');

  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [blancos, setBlancos] = useState(0);
  const [nulos, setNulos] = useState(0);
  const [totalVotos, setTotalVotos] = useState(0);

  const qrUrl = useMemo(() => {
    if (!votacionId) return '';
    // Link directo a la pantalla de votar de ESTE evento
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/votar?votacion_id=${Number(votacionId)}`;
  }, [votacionId]);

  const obtenerResultados = async () => {
    if (!votacionId) return;

    const votacionIdNumber = Number(votacionId);
    if (isNaN(votacionIdNumber)) return;

    const { data: candidatas, error: errorCandidatas } = await supabase
      .from('candidata')
      .select('id, nombre')
      .eq('votacion_id', votacionIdNumber);

    if (errorCandidatas || !candidatas) {
      console.error('Error obteniendo candidatas:', errorCandidatas);
      return;
    }

    const resultadosConVotos = await Promise.all(
      candidatas.map(async (c) => {
        const { count, error } = await supabase
          .from('voto')
          .select('*', { count: 'exact', head: true })
          .eq('candidata_id', c.id)
          .eq('votacion_id', votacionIdNumber);

        if (error) console.error('Error contando votos:', error);

        return {
          candidata_id: c.id,
          nombre: c.nombre,
          votos: count || 0,
        };
      })
    );

    const { count: blancosCount } = await supabase
      .from('voto')
      .select('*', { count: 'exact', head: true })
      .eq('voto_blanco', true)
      .eq('votacion_id', votacionIdNumber);

    const { count: nulosCount } = await supabase
      .from('voto')
      .select('*', { count: 'exact', head: true })
      .eq('voto_nulo', true)
      .eq('votacion_id', votacionIdNumber);

    const total =
      resultadosConVotos.reduce((acc, r) => acc + (r.votos || 0), 0) +
      (blancosCount || 0) +
      (nulosCount || 0);

    setResultados(resultadosConVotos);
    setBlancos(blancosCount || 0);
    setNulos(nulosCount || 0);
    setTotalVotos(total);
  };

  useEffect(() => {
    obtenerResultados();

    const votacionIdNumber = Number(votacionId);
    const channel = supabase
      .channel('realtime-votos')
      .on(
        "postgres_changes",
        {
          event: '*',
          schema: 'public',
          table: 'voto',
          filter: `votacion_id=eq.${votacionIdNumber}`,
        },
        () => obtenerResultados()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [votacionId]);

  const copiarLink = async () => {
    if (!qrUrl) return;
    try {
      await navigator.clipboard.writeText(qrUrl);
      alert('Enlace copiado al portapapeles.');
    } catch {
      alert('No se pudo copiar. Copia manualmente el enlace mostrado.');
    }
  };

  const compartirLink = async () => {
    if (!qrUrl) return;
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({
          title: 'Votación',
          text: 'Vota aquí:',
          url: qrUrl,
        });
      } catch {
        // usuario canceló, no pasa nada
      }
    } else {
      copiarLink();
    }
  };

  return (
    <div className="p-6 text-center space-y-6">
      <h1 className="text-4xl font-bold text-indigo-600">📊 Resultados en tiempo real</h1>

      {/* Layout: resultados + panel QR */}
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna de resultados (ocupa 2 en grande) */}
        <div className="lg:col-span-2 space-y-6">
          {resultados.map((r) => (
            <div key={r.candidata_id} className="text-left max-w-2xl mx-auto">
              <p className="text-xl font-semibold text-white mb-1">{r.nombre}</p>
              <div className="bg-gray-300 h-6 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-6 transition-all duration-700 ease-in-out"
                  style={{
                    width: `${totalVotos > 0 ? (r.votos / totalVotos) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-white">
                {r.votos} voto{r.votos === 1 ? '' : 's'} •{' '}
                {totalVotos > 0 ? ((r.votos / totalVotos) * 100).toFixed(1) : '0.0'}%
              </p>
            </div>
          ))}

          <div className="mt-6 text-white text-lg">
            <p>🗳️ Votos en blanco: <strong>{blancos}</strong></p>
            <p className="mt-2">🧮 Total de papeletas: <strong>{totalVotos}</strong></p>
          </div>
        </div>

        {/* Panel QR para votar */}
        <aside className="lg:col-span-1">
          <div className="bg-white/10 rounded-2xl p-5 border border-white/10 shadow-md flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold text-white">📲 Escanea para votar</h2>

            {qrUrl ? (
              <>
                <div className="bg-white p-3 rounded-xl">
                  <QRCodeCanvas
                    value={qrUrl}
                    size={220}
                    includeMargin
                    level="M"
                  />
                </div>

                <div className="text-white/80 text-sm break-all max-w-full">
                  {qrUrl}
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => (window.location.href = qrUrl)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-white"
                  >
                    Abrir enlace
                  </button>
                  <button
                    onClick={copiarLink}
                    className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded text-white"
                  >
                    Copiar
                  </button>
                  <button
                    onClick={compartirLink}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white"
                  >
                    Compartir
                  </button>
                </div>

                <p className="text-xs text-white/60">
                  También puedes apuntar la cámara del teléfono al QR para votar desde tu dispositivo.
                </p>
              </>
            ) : (
              <p className="text-white/80">No se encontró el ID de votación.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ResultadosLive;

