import { useState } from "react";
import { supabase } from "@/supabaseClient";

interface AuthModalProps {
  onClose: () => void;
}

function AuthModal({ onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          alert("Error al iniciar sesión: " + error.message);
        } else {
          setTimeout(onClose, 300);
        }
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          alert("Error al registrarse: " + error.message);
        } else {
          alert("Registro exitoso. Revisa tu correo para confirmar.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-[#0F0B1C]/90 text-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-white/10">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {isLogin ? "Iniciar sesión" : "Registrarse"}
        </h2>

        <input
          className="w-full p-2 mb-3 bg-[#1E1B2E] border border-white/20 rounded placeholder-gray-400"
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-2 mb-4 bg-[#1E1B2E] border border-white/20 rounded placeholder-gray-400"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded text-white font-semibold transition-all disabled:opacity-60"
        >
          {loading ? "Cargando..." : isLogin ? "Iniciar sesión" : "Registrarse"}
        </button>

        <p
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm mt-4 text-indigo-300 hover:text-indigo-100 text-center cursor-pointer"
        >
          {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
        </p>

        <button
          onClick={onClose}
          className="mt-6 text-center w-full text-sm text-gray-400 hover:text-gray-200"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default AuthModal;
