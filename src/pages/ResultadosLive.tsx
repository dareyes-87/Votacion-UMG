// src/pages/ResultadosLive.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

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
  const [maxVotos, setMaxVotos] = useState(1); // evitar división por cero

  const obtenerResultados = async () => {

  if (!votacionId) return;

  const votacionIdNumber = Number(votacionId);
  if (isNaN(votacionIdNumber)) return;

  const { data: candidatas, error: errorCandidatas } = await supabase
    .from('candidata')
    .select('id, nombre')
    .eq('votacion_id', votacionIdNumber);

  if (errorCandidatas || !candidatas) {
    console.error("Error obteniendo candidatas:", errorCandidatas);
    return;
  }

  const resultadosConVotos = await Promise.all(
      candidatas.map(async (c) => {
        const { count, error } = await supabase
          .from('voto')
          .select('*', { count: 'exact', head: true })
          .eq('candidata_id', c.id) // ✅ sin el filtro de votacion_id
          .eq('votacion_id', votacionIdNumber); // ✅ Agrega esto

        if (error) console.error("Error contando votos:", error);

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

  const max = Math.max(
    ...resultadosConVotos.map((r) => r.votos),
    blancosCount || 0,
    nulosCount || 0,
    1
  );

  setMaxVotos(max);
  setBlancos(blancosCount || 0);
  setNulos(nulosCount || 0);
  setResultados(resultadosConVotos);
};


  useEffect(() => {
    console.log("Se ejecutó useEffect con votacionId:", votacionId);
  
    obtenerResultados();

    const channel = supabase
      .channel('realtime-votos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'voto' },
        () => {
          obtenerResultados();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [votacionId]);

  return (
    <div className="p-6 text-center space-y-6">
      <h1 className="text-4xl font-bold text-indigo-600">📊 Resultados en tiempo real</h1>

      {resultados.map((r) => (
        <div key={r.candidata_id} className="text-left max-w-2xl mx-auto">
          <p className="text-xl font-semibold text-white mb-1">{r.nombre}</p>
          <div className="bg-gray-300 h-6 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-6 transition-all duration-700 ease-in-out"
              style={{
                width: `${(r.votos / maxVotos) * 100}%`,
              }}
            />
          </div>
          <p className="text-white">{r.votos} voto{r.votos === 1 ? '' : 's'}</p>
        </div>
      ))}

      <div className="mt-10 text-white text-lg">
        <p>🗳️ Votos en blanco: <strong>{blancos}</strong></p>
        <p>❌ Votos nulos: <strong>{nulos}</strong></p>
      </div>
    </div>
  );
}

export default ResultadosLive;