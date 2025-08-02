import { useEffect, useState } from 'react'
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { supabase } from '../supabaseClient'

function Votacion() {
  const [visitorId, setVisitorId] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)

  useEffect(() => {
    const loadFingerprint = async () => {
      const fp = await FingerprintJS.load()
      const result = await fp.get()
      setVisitorId(result.visitorId)
    }

    loadFingerprint()
  }, [])

  const emitirVoto = async (opcion: 'candidata' | 'blanco' | 'nulo') => {
    if (!visitorId) return

    // Verifica si ya votó este dispositivo
    const { data: votosPrevios } = await supabase
      .from('votos')
      .select('*')
      .eq('dispositivo_hash', visitorId)

    if (votosPrevios && votosPrevios.length > 0) {
      alert('Ya has votado desde este dispositivo.')
      setHasVoted(true)
      return
    }

    // Envía el voto
    const { error } = await supabase.from('votos').insert({
      votacion_id: 1, // ID de la votación activa
      candidata_id: opcion === 'candidata' ? 2 : null, // cambia según candidata
      voto_blanco: opcion === 'blanco',
      voto_nulo: opcion === 'nulo',
      dispositivo_hash: visitorId,
    })

    if (error) {
      console.error(error)
      alert('Error al enviar el voto.')
    } else {
      alert('¡Voto registrado!')
      setHasVoted(true)
    }
  }

  if (!visitorId) return <p>Cargando...</p>
  if (hasVoted) return <p>Ya has votado desde este dispositivo.</p>

  return (
    <div className="p-4 max-w-md mx-auto text-center space-y-4">
      <h1 className="text-2xl font-bold">Vota por tu candidata 👑</h1>
      <button
        onClick={() => emitirVoto('candidata')}
        className="bg-indigo-600 text-white w-full py-2 rounded-md"
      >
        Votar por María Pérez
      </button>
      <button
        onClick={() => emitirVoto('blanco')}
        className="bg-gray-300 text-black w-full py-2 rounded-md"
      >
        Votar en blanco
      </button>
      <button
        onClick={() => emitirVoto('nulo')}
        className="bg-red-500 text-white w-full py-2 rounded-md"
      >
        Voto nulo
      </button>
    </div>
  )
}

export default Votacion
