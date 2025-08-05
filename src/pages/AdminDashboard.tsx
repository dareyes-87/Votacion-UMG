// src/pages/AdminDashboard.tsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';

function AdminDashboard() {
  const [nombre, setNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [candidatas, setCandidatas] = useState([
    { nombre: '', foto_url: '', facultad: '', file: null as File | null },
  ]);

  const handleCandidataChange = (index: number, field: string, value: string | File) => {
    const updated = [...candidatas];
    if (field === 'file') {
      updated[index].file = value as File;
    } else {
      updated[index][field] = value as string;
    }
    setCandidatas(updated);
  };

  const agregarCandidata = () => {
    setCandidatas([...candidatas, { nombre: '', foto_url: '', facultad: '', file: null }]);
  };

  const eliminarCandidata = (index: number) => {
    const updated = candidatas.filter((_, i) => i !== index);
    setCandidatas(updated);
  };

  const crearVotacionConCandidatas = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    try {
      const { data: votacion, error: errorVotacion } = await supabase
        .from('votacion')
        .insert({
          nombre,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          activa: true,
          created_by: userId,
        })
        .select()
        .single();

      if (errorVotacion) {
        alert('Error al crear votación: ' + errorVotacion.message);
        return;
      }

      const candidatasConURL = await Promise.all(
        candidatas.map(async (c, idx) => {
          if (!c.file) throw new Error(`Falta la imagen de la candidata #${idx + 1}`);

          const fileExt = c.file.name.split('.').pop();
          const filePath = `candidata_${Date.now()}_${idx}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('ftcandidata')
            .upload(filePath, c.file);

          if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`);

          const { data: urlData } = supabase.storage
            .from('ftcandidata')
            .getPublicUrl(filePath);

          return {
            nombre: c.nombre,
            facultad: c.facultad,
            foto_url: urlData.publicUrl,
            votacion_id: votacion.id,
          };
        })
      );

      const { error: errorCandidatas } = await supabase
        .from('candidata')
        .insert(candidatasConURL);

      if (errorCandidatas) {
        alert('Error al agregar candidatas: ' + errorCandidatas.message);
        return;
      }

      alert('✅ Votación y candidatas creadas con éxito');
      setNombre('');
      setFechaInicio('');
      setFechaFin('');
      setCandidatas([{ nombre: '', foto_url: '', facultad: '', file: null }]);
    } catch (err: any) {
      alert('Ocurrió un error: ' + err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 text-white bg-transparent">
      <h1 className="text-3xl font-bold mb-4 text-white">Crear nueva votación</h1>

      <div className="space-y-4">
        <input
          className="w-full p-2 rounded bg-[#0A0014] text-white placeholder-gray-400 border border-white/20"
          placeholder="Nombre de la votación"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          type="datetime-local"
          className="w-full p-2 rounded bg-[#0A0014] text-white border border-white/20"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
        />
        <input
          type="datetime-local"
          className="w-full p-2 rounded bg-[#0A0014] text-white border border-white/20"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
        />
      </div>

      <h2 className="text-2xl font-bold mt-6">Candidatas</h2>
      {candidatas.map((c, i) => (
        <div key={i} className="border border-white/20 p-4 rounded space-y-2 bg-[#0A0014]">
          <input
            className="w-full p-2 rounded bg-[#1E1B2E] text-white placeholder-gray-400 border border-white/10"
            placeholder="Nombre"
            value={c.nombre}
            onChange={(e) => handleCandidataChange(i, 'nombre', e.target.value)}
          />
          <input
            className="w-full p-2 rounded bg-[#1E1B2E] text-white placeholder-gray-400 border border-white/10"
            placeholder="Facultad"
            value={c.facultad}
            onChange={(e) => handleCandidataChange(i, 'facultad', e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="w-full p-2 rounded bg-[#1E1B2E] text-white border border-white/10"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCandidataChange(i, 'file', file);
            }}
          />
          <button
            className="text-sm text-red-400 hover:underline"
            onClick={() => eliminarCandidata(i)}
          >
            Eliminar
          </button>
        </div>
      ))}

      <button
        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded"
        onClick={agregarCandidata}
      >
        + Agregar otra candidata
      </button>

      <div className="mt-6">
        <button
          onClick={crearVotacionConCandidatas}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded"
        >
          Guardar votación y candidatas
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;
