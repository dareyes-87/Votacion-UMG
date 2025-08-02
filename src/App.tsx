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
 // Asegúrate de importar tus estilos globales



function App() {
  const navItems = [
    { label: "Inicio", href: "/" },
    { label: "Crear evento", href: "/admin" },
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
        <h1 className="text-4xl font-bold mb-8">Votación Reina UMG</h1>

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
    </div>
  );
}


export default App;