// src/components/Layout.tsx
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Squares from "../Squares";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AuthModal from "./AuthModal";

const Layout = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const navItems = isAuthenticated
    ? [
        { label: "Inicio", href: "/" },
        { label: "Crear evento", href: "/admin" },
        { label: "Mis votaciones", href: "/mis-votaciones" },
        { label: "Votar", href: "/votar" },
        { label: "Resultados", href: "/resultados" },
        {
          label: "Cerrar sesión",
          onClick: async () => {
            await supabase.auth.signOut();
            navigate("/");
          },
        },
      ]
    : [
        { label: "Inicio", href: "/" },
        { label: "Votar", href: "/votar" },
        { label: "Resultados", href: "/resultados" },
        {
          label: "Iniciar sesión",
          onClick: () => setShowAuthModal(true),
        },
      ];

  return (
    <div className="relative min-h-screen text-white">
      {/* Fondo animado */}
      <div className="absolute inset-0 -z-10">
        <Squares
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="#9a95a3ff"
          hoverFillColor="#222222"
        />
      </div>

      {/* Navbar fija */}
      <Navbar navItems={navItems} />

      {/* Contenido dinámico */}
      <main className="px-4 mt-10">
        <Outlet />
      </main>

      {/* Modal de login */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

export default Layout;