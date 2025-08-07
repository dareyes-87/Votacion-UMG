// src/pages/AdminDashboard.tsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import QRCode from 'qrcode';
import Swal from 'sweetalert2';

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
        .insert({ nombre, fecha_inicio: fechaInicio, fecha_fin: fechaFin, activa: true, created_by: userId })
        .select()
        .single();

      if (errorVotacion) throw new Error(errorVotacion.message);

      const candidatasConURL = await Promise.all(
        candidatas.map(async (c, idx) => {
          if (!c.file) throw new Error(`Falta imagen en la candidata #${idx + 1}`);
          const fileExt = c.file.name.split('.').pop();
          const filePath = `candidata_${Date.now()}_${idx}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('ftcandidata').upload(filePath, c.file);
          if (uploadError) throw new Error(uploadError.message);
          const { data: urlData } = supabase.storage.from('ftcandidata').getPublicUrl(filePath);
          return { nombre: c.nombre, facultad: c.facultad, foto_url: urlData.publicUrl, votacion_id: votacion.id, created_by: userId };
        })
      );

      const { error: errorCandidatas } = await supabase.from('candidata').insert(candidatasConURL);
      if (errorCandidatas) throw new Error(errorCandidatas.message);

      const url = `${window.location.origin}/votar?votacion_id=${votacion.id}`;
      const qrBase64 = await QRCode.toDataURL(url);

      await supabase.from('votacion').update({ url, qr_base64: qrBase64 }).eq('id', votacion.id);

      Swal.fire({
        title: '✅ Votación creada',
        html: `
          <p>Comparte este código QR con los votantes:</p>
          <img src="${qrBase64}" alt="QR" style="margin: auto;"/>
          <p><a href="${url}" target="_blank">${url}</a></p>
        `,
        confirmButtonText: 'Listo',
      });

      setNombre('');
      setFechaInicio('');
      setFechaFin('');
      setCandidatas([{ nombre: '', foto_url: '', facultad: '', file: null }]);

    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 text-white">
      <h1 className="text-3xl font-bold">Crear nueva votación</h1>
      <input className="w-full p-2 bg-[#0A0014] rounded" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
      <input type="datetime-local" className="w-full p-2 bg-[#0A0014] rounded" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
      <input type="datetime-local" className="w-full p-2 bg-[#0A0014] rounded" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />

      <h2 className="text-xl font-bold">Candidatas</h2>
      {candidatas.map((c, i) => (
        <div key={i} className="space-y-2 bg-[#0A0014] p-3 rounded">
          <input className="w-full p-2 bg-black rounded" placeholder="Nombre" value={c.nombre} onChange={e => handleCandidataChange(i, 'nombre', e.target.value)} />
          <input className="w-full p-2 bg-black rounded" placeholder="Facultad" value={c.facultad} onChange={e => handleCandidataChange(i, 'facultad', e.target.value)} />
          <input type="file" className="w-full" onChange={e => handleCandidataChange(i, 'file', e.target.files?.[0] || null)} />
          <button className="text-red-400 text-sm" onClick={() => eliminarCandidata(i)}>Eliminar</button>
        </div>
      ))}
      <button onClick={agregarCandidata} className="bg-indigo-700 px-4 py-2 rounded">+ Agregar otra candidata</button>
      <button onClick={crearVotacionConCandidatas} className="bg-green-700 px-4 py-2 rounded w-full">Guardar votación y candidatas</button>
    </div>
  );
}

export default AdminDashboard;