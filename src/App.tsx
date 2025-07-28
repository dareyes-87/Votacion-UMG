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

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white">
      <div className="text-center space-y-4 px-4">
        <h1 className="text-4xl font-bold sm:text-6xl drop-shadow-lg">
          Votación Reina UMG 2025 👑
        </h1>
        <p className="text-xl sm:text-2xl font-light">
          Bienvenido al sistema oficial de votación universitaria.
        </p>
        <div className="mt-6">
          <button className="bg-white text-indigo-700 font-semibold px-6 py-3 rounded-2xl hover:bg-gray-200 transition shadow-lg">
            Ingresar como Votante
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
