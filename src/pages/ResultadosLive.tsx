// src/pages/ResultadosLive.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

type Resultado = {
  candidata_id: number
  nombre: string
  votos: number
}

function ResultadosLive() {
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [blancos, setBlancos] = useState(0)
  const [nulos, setNulos] = useState(0)

  const obtenerResultados = async () => {
    const { data: candidatas } = await supabase.from('candidatas').select('*')

    const resultadosConVotos = await Promise.all(
      candidatas!.map(async (c: any) => {
        const { count } = await supabase
          .from('votos')
          .select('*', { count: 'exact', head: true })
          .eq('candidata_id', c.id)
        return { candidata_id: c.id, nombre: c.nombre, votos: count || 0 }
      })
    )

    const { count: blancosCount } = await supabase
      .from('votos')
      .select('*', { count: 'exact', head: true })
      .eq('voto_blanco', true)

    const { count: nulosCount } = await supabase
      .from('votos')
      .select('*', { count: 'exact', head: true })
      .eq('voto_nulo', true)

    setBlancos(blancosCount || 0)
    setNulos(nulosCount || 0)
    setResultados(resultadosConVotos)
  }

  useEffect(() => {
    obtenerResultados()

    // Subscribirse a cambios en la tabla votos
    const channel = supabase
      .channel('realtime-votos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votos' }, () => {
        obtenerResultados()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="p-6 text-center space-y-4">
      <h1 className="text-4xl font-bold">📊 Resultados en tiempo real</h1>
      {resultados.map((r) => (
        <div key={r.candidata_id} className="text-left max-w-md mx-auto">
          <p className="text-xl font-semibold">{r.nombre}</p>
          <div className="bg-gray-200 h-6 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-6"
              style={{ width: `${r.votos * 10}%` }}
            />
          </div>
          <p>{r.votos} votos</p>
        </div>
      ))}
      <div className="mt-6">
        <p>🗳️ Votos en blanco: {blancos}</p>
        <p>❌ Votos nulos: {nulos}</p>
      </div>
    </div>
  )
}

export default ResultadosLive
