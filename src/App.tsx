import { AuthProvider } from "@/context/AuthContext";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./libs/queryClient";
import { ToastContainer } from "react-toastify";
import { Routes } from "react-router-dom";
import { Route } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import HomePage from "@/pages/HomePage";
import { Link } from 'react-router-dom'
import Squares from "./Squares";
import GooeyNav from "./GooeyNav";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal"; // el modal que haremos
import { useEffect } from "react";




function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && showAuthModal) {
      setShowAuthModal(false); // ✅ cerrar modal si ya está autenticado
      navigate("/admin");
    }
  }, [isAuthenticated]);

  console.log("Auth user:", user);
  console.log("Authenticated:", isAuthenticated);


  const navItems = [
    { label: "Inicio", href: "/" },
    {
      label: "Crear evento",
      href: "#",
      onClick: () => {
        if (isAuthenticated) {
          navigate("/admin");
        } else {
          setShowAuthModal(true);
        }
      },
    },
    { label: "Votar", href: "/votar" },
    { label: "Resultados", href: "/resultados" },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Squares
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="#271E37"
          hoverFillColor="#222"
        />
      </div>

      <div className="relative z-10 text-center">
        <h1 className="text-4xl font-bold mb-8">Votación Señorita UMG</h1>

        <div style={{ height: "400px", position: "relative" }}>
          <GooeyNav
            items={navItems}
            particleCount={15}
            particleDistances={[90, 10]}
            particleR={100}
            initialActiveIndex={0}
            animationTime={600}
            timeVariance={300}
            colors={[1, 2, 3, 1, 2, 3, 1, 4]}
          />
        </div>
      </div>

      {/* Modal para login/registro */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}


export default App;