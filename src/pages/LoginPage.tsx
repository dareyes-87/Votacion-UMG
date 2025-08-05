// src/pages/LoginPage.tsx
import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState } = useForm<LoginForm>();

  const onRegisterSubmit = async (data: LoginForm) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: data.email, password: data.password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Registro exitoso, revisa tu correo.");
      navigate("/");
    }
    setLoading(false);
  };

  const onLoginSubmit = async (data: LoginForm) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Inicio de sesión exitoso.");
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-[#0A0014]/80 backdrop-blur-md rounded-lg shadow-lg border border-white/10 text-white">
          <div className="p-6 text-center">
            <h1 className="text-2xl font-bold">Iniciar sesión</h1>
            <p className="text-sm text-gray-400 mt-1">
              Accede para crear y gestionar tus votaciones
            </p>
          </div>

          <form className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm text-white/80 mb-1">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-4 py-3 bg-[#1E1B2E] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="ejemplo@email.com"
                  {...register("email", { required: true })}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm text-white/80 mb-1">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full px-4 py-3 bg-[#1E1B2E] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                  {...register("password", { required: true })}
                />
              </div>
            </div>

            <div className="flex gap-4 flex-col sm:flex-row">
              <button
                type="button"
                onClick={handleSubmit(onLoginSubmit)}
                disabled={loading || !formState.isValid}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg transition-all font-medium disabled:opacity-50"
              >
                {loading ? "Cargando..." : "Iniciar sesión"}
              </button>

              <button
                type="button"
                onClick={handleSubmit(onRegisterSubmit)}
                disabled={loading || !formState.isValid}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-all font-medium disabled:opacity-50"
              >
                {loading ? "Cargando..." : "Registrarse"}
              </button>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/20"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-sm">o</span>
              <div className="flex-grow border-t border-white/20"></div>
            </div>

            <button
              type="button"
              onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
              className="w-full bg-white text-black py-3 px-4 rounded-lg hover:bg-gray-100 transition-all font-medium flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuar con Google
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
