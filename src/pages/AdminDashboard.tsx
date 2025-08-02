// src/pages/AdminDashboard.tsx
import { useState } from 'react'
import { supabase } from '../supabaseClient'

function AdminDashboard() {
  const [nombre, setNombre] = useState('')
  const [candidata, setCandidata] = useState('')
  const [votacionId, setVotacionId] = useState<number | null>(null)

  const crearVotacion = async () => {
    const { data, error } = await supabase
      .from('votaciones')
      .insert({ nombre, activa: true })
      .select()
      .single()

    if (error) return alert('Error al crear votación')
    setVotacionId(data.id)
    alert('Votación creada')
  }

  const agregarCandidata = async () => {
    if (!votacionId) return alert('Crea una votación primero')

    const { error } = await supabase.from('candidatas').insert({
      nombre: candidata,
      votacion_id: votacionId,
    })

    if (error) return alert('Error al agregar candidata')
    alert('Candidata agregada')
    setCandidata('')
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Panel de Administrador</h1>

      <div>
        <label>Nombre de la votación</label>
        <input
          className="w-full p-2 border"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <button onClick={crearVotacion} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
          Crear votación
        </button>
      </div>

      {votacionId && (
        <div>
          <label>Agregar candidata</label>
          <input
            className="w-full p-2 border"
            value={candidata}
            onChange={(e) => setCandidata(e.target.value)}
          />
          <button onClick={agregarCandidata} className="mt-2 bg-green-500 text-white px-4 py-2 rounded">
            Agregar
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
