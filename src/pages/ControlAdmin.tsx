// src/pages/ControlAdmin.tsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Layout from "./Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabaseClient";

// ---------- Tipos según tus tablas ----------
type Votacion = {
  id: number;
  nombre: string | null;
  fecha_inicio: string | null; // ISO timestamp
  fecha_fin: string | null;    // ISO timestamp
  activa: boolean | null;
  created_by: string | null;
  url?: string | null;
};

type Candidata = {
  id: number; // int4 serial
  nombre: string | null;
  foto_url: string | null;
  facultad: string | null;
  votacion_id: number;
  created_by: string | null;
};

// ---------- Página ----------
export default function ControlAdmin() {
  const { user } = useAuth();

  const [votaciones, setVotaciones] = useState<Votacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Votacion | null>(null);

  const fetchVotaciones = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("votacion")
      .select("*")
      .or(
        user?.id
          ? `created_by.eq.${user.id},created_by.is.null`
          : "created_by.is.null"
      )
      .order("fecha_inicio", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("No se pudo cargar la lista de votaciones");
    } else {
      setVotaciones(((data ?? []) as Votacion[]));

    }
    setLoading(false);
  };

  useEffect(() => {
  fetchVotaciones();

  const ch = supabase
    .channel("votacion-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "votacion" },
      () => fetchVotaciones()
    )
    .subscribe();

  // ✅ cleanup sin Promise
  return () => {
    // Opción A
    supabase.removeChannel(ch);
    // O opción B (según versión de supabase-js):
    // ch.unsubscribe();
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user?.id]);


  const filtered = useMemo(() => {
    if (!search.trim()) return votaciones;
    const q = search.toLowerCase();
    return votaciones.filter((v) => (v.nombre || "").toLowerCase().includes(q));
  }, [votaciones, search]);

  const confirmDelete = async (id: number) => {
    const res = await Swal.fire({
      title: "¿Eliminar votación?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        popup: "rounded-2xl",
        confirmButton:
          "bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700",
        cancelButton:
          "bg-gray-700 text-white px-4 py-2 rounded-xl hover:bg-gray-800",
      },
    });
    if (!res.isConfirmed) return;

    const { error } = await supabase.from("votacion").delete().eq("id", id);
    if (error) {
      console.error(error);
      toast.error("No se pudo eliminar");
    } else {
      toast.success("Votación eliminada");
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-semibold">Mis votaciones</h1>
            <p className="text-sm opacity-70">Gestiona lo que creaste en “Crear evento”.</p>
          </div>
          <input
            type="text"
            placeholder="Buscar por título…"
            className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-700 outline-none focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="rounded-2xl border border-neutral-800 overflow-hidden shadow-lg">
          <div className="grid grid-cols-12 bg-neutral-900 px-4 py-3 text-sm font-medium">
            <div className="col-span-5">Nombre</div>
            <div className="col-span-3">Fecha inicio</div>
            <div className="col-span-3">Fecha fin</div>
            <div className="col-span-1 text-right">Acciones</div>
          </div>

          {loading ? (
            <div className="p-6 text-center opacity-70">Cargando…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center opacity-70">No hay votaciones para mostrar.</div>
          ) : (
            <ul className="divide-y divide-neutral-800">
              {filtered.map((v) => (
                <li
                  key={v.id}
                  className="grid grid-cols-12 items-center px-4 py-4 text-sm hover:bg-neutral-900/40"
                >
                  <div className="col-span-5 pr-2 truncate">{v.nombre}</div>
                  <div className="col-span-3">{(v.fecha_inicio ?? "").slice(0, 10)}</div>
                  <div className="col-span-3">{(v.fecha_fin ?? "").slice(0, 10)}</div>
                  <div className="col-span-1 flex justify-end gap-2">
                    <button
                      onClick={() => setEditing(v)}
                      className="px-3 py-1.5 rounded-xl border border-indigo-500 hover:bg-indigo-500/10"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => confirmDelete(v.id)}
                      className="px-3 py-1.5 rounded-xl border border-red-600 hover:bg-red-600/10"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {editing && (
          <EditVotacionModal
            votacion={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              fetchVotaciones();
            }}
          />
        )}
      </div>
    </Layout>
  );
}

// ---------- Modal: Datos + Candidatas ----------
function EditVotacionModal({
  votacion,
  onClose,
  onSaved,
}: {
  votacion: Votacion;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"datos" | "candidatas">("datos");

  // Datos generales
  const [nombre, setNombre] = useState(votacion.nombre ?? "");
  const [fi, setFi] = useState((votacion.fecha_inicio ?? "").slice(0, 10));
  const [ff, setFf] = useState((votacion.fecha_fin ?? "").slice(0, 10));
  const [saving, setSaving] = useState(false);

  // Candidatas
  const [candidatas, setCandidatas] = useState<Candidata[]>([]);
  const [loadingCand, setLoadingCand] = useState(true);

  const fetchCandidatas = async () => {
    setLoadingCand(true);
    const { data, error } = await supabase
      .from("candidata")
      .select("*")
      .eq("votacion_id", votacion.id)
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("No se pudieron cargar las candidatas");
    } else {
      setCandidatas((data || []) as Candidata[]);
    }
    setLoadingCand(false);
  };

  useEffect(() => {
    fetchCandidatas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [votacion.id]);

  // Guardar datos generales
  const saveDatos = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("votacion")
      .update({ nombre, fecha_inicio: fi, fecha_fin: ff })
      .eq("id", votacion.id);
    if (error) {
      console.error(error);
      toast.error("No se pudieron guardar los datos");
    } else {
      toast.success("Datos guardados");
      onSaved();
    }
    setSaving(false);
  };

  // Agregar candidata (inserta de una vez para obtener id autoincrement)
  const addCandidata = async () => {
    const { data, error } = await supabase
      .from("candidata")
      .insert({
        nombre: "",
        facultad: "",
        foto_url: null,
        votacion_id: votacion.id,
        created_by: user?.id ?? null,
      })
      .select("*")
      .single();

    if (error) {
      console.error(error);
      toast.error("No se pudo agregar la candidata");
      return;
    }
    setCandidatas((prev) => [...prev, data as Candidata]);
  };

  // Guardar cambios por candidata
  const saveCandidata = async (c: Candidata) => {
    const { error } = await supabase
      .from("candidata")
      .update({
        nombre: c.nombre,
        facultad: c.facultad,
        foto_url: c.foto_url,
      })
      .eq("id", c.id);
    if (error) {
      console.error(error);
      toast.error("No se pudo guardar la candidata");
    } else {
      toast.success("Candidata guardada");
      fetchCandidatas();
    }
  };

  // Eliminar candidata
  const removeCandidata = async (id: number) => {
    const res = await Swal.fire({
      title: "¿Eliminar candidata?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        confirmButton:
          "bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700",
        cancelButton:
          "bg-gray-700 text-white px-4 py-2 rounded-xl hover:bg-gray-800",
      },
    });
    if (!res.isConfirmed) return;

    const { error } = await supabase.from("candidata").delete().eq("id", id);
    if (error) {
      console.error(error);
      toast.error("No se pudo eliminar la candidata");
    } else {
      toast.success("Candidata eliminada");
      setCandidatas((prev) => prev.filter((x) => x.id !== id));
    }
  };

  // Subir foto y actualizar foto_url
  const onFileChange = async (cand: Candidata, file?: File) => {
    if (!file) return;
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${cand.votacion_id}/${cand.id}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("candidatas") // <-- cambia si tu bucket tiene otro nombre
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: pub } = supabase
        .storage
        .from("candidatas")
        .getPublicUrl(path);
      const url = pub.publicUrl;

      // actualizar en BD
      const { error } = await supabase
        .from("candidata")
        .update({ foto_url: url })
        .eq("id", cand.id);
      if (error) throw error;

      setCandidatas((prev) =>
        prev.map((x) => (x.id === cand.id ? { ...x, foto_url: url } : x))
      );
      toast.success("Imagen subida");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo subir la imagen");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="text-xl font-semibold">Editar votación</h2>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl border border-neutral-700 hover:bg-neutral-800"
          >
            Cerrar
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex gap-2 mb-4">
            <button
              className={`px-4 py-2 rounded-xl border ${
                tab === "datos"
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-neutral-800 hover:bg-neutral-900"
              }`}
              onClick={() => setTab("datos")}
            >
              Datos generales
            </button>
            <button
              className={`px-4 py-2 rounded-xl border ${
                tab === "candidatas"
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-neutral-800 hover:bg-neutral-900"
              }`}
              onClick={() => setTab("candidatas")}
            >
              Candidatas
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 max-h-[70vh] overflow-auto">
          {tab === "datos" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Nombre</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Fecha inicio</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={fi}
                  onChange={(e) => setFi(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Fecha fin</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={ff}
                  onChange={(e) => setFf(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Candidatas</h3>
                <button
                  onClick={addCandidata}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                >
                  + Agregar candidata
                </button>
              </div>

              {loadingCand ? (
                <div className="py-6 text-center opacity-70">Cargando…</div>
              ) : candidatas.length === 0 ? (
                <div className="py-6 text-center opacity-70">Aún no hay candidatas.</div>
              ) : (
                <div className="space-y-4">
                  {candidatas.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-neutral-800 p-4 bg-neutral-900/40"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-3">
                          <div className="aspect-square rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                            {c.foto_url ? (
                              <img
                                src={c.foto_url}
                                alt={c.nombre || "candidata"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs opacity-60 px-2 text-center">
                                Sin imagen
                              </span>
                            )}
                          </div>
                          <label className="mt-2 block">
                            <span className="text-xs opacity-70">Foto</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="mt-1 block w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-neutral-800 file:text-white hover:file:bg-neutral-700"
                              onChange={(e) => onFileChange(c, e.target.files?.[0])}
                            />
                          </label>
                        </div>

                        <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm mb-1">Nombre</label>
                            <input
                              type="text"
                              className="w-full px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-700 outline-none focus:ring-2 focus:ring-indigo-500"
                              value={c.nombre ?? ""}
                              onChange={(e) =>
                                setCandidatas((prev) =>
                                  prev.map((x) =>
                                    x.id === c.id ? { ...x, nombre: e.target.value } : x
                                  )
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-1">Facultad</label>
                            <input
                              type="text"
                              className="w-full px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-700 outline-none focus:ring-2 focus:ring-indigo-500"
                              value={c.facultad ?? ""}
                              onChange={(e) =>
                                setCandidatas((prev) =>
                                  prev.map((x) =>
                                    x.id === c.id
                                      ? { ...x, facultad: e.target.value }
                                      : x
                                  )
                                )
                              }
                            />
                          </div>

                          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => saveCandidata(c)}
                              className="px-3 py-1.5 rounded-xl border border-emerald-600 hover:bg-emerald-600/10"
                            >
                              Guardar cambios
                            </button>
                            <button
                              onClick={() => removeCandidata(c.id)}
                              className="px-3 py-1.5 rounded-xl border border-red-600 hover:bg-red-600/10"
                            >
                              Eliminar candidata
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 flex justify-end gap-2 bg-neutral-950">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-800"
          >
            Cancelar
          </button>
          <button
            onClick={saveDatos}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar datos"}
          </button>
        </div>
      </div>
    </div>
  );
}
