import { useState } from "react";
import { supabase } from "@/supabaseClient";

function AuthModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async () => {
        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
            alert("Error al iniciar sesión: " + error.message);
            } else {
            setTimeout(onClose, 300); // espera breve para permitir actualización
            }
        } else {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
            alert("Error al registrarse: " + error.message);
            } else {
            alert("Registro exitoso, revisa tu correo");
            }
        }
     };


  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-md text-black w-96">
        <h2 className="text-2xl font-bold mb-4">{isLogin ? "Iniciar sesión" : "Registrarse"}</h2>
        <input
          className="w-full p-2 border rounded mb-3"
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded mb-4"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-indigo-600 text-white p-2 rounded mb-2"
        >
          {isLogin ? "Iniciar sesión" : "Registrarse"}
        </button>
        <p
          onClick={() => setIsLogin(!isLogin)}
          className="text-center text-sm text-blue-600 cursor-pointer"
        >
          {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
        </p>
        <button
          onClick={onClose}
          className="w-full mt-4 text-sm text-gray-600 underline"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default AuthModal;
